-- Endurecimiento multi-organización y candidatura pública verificable.

alter table public.applications
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists summary text;

create sequence if not exists public.application_registration_seq;

create or replace function public.prepare_application_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_call public.calls%rowtype;
begin
  if new.status = 'submitted' and old.status = 'draft' then
    select * into target_call
    from public.calls
    where id = new.call_id;

    if target_call.id is null
       or target_call.status not in ('published', 'active')
       or (target_call.opens_at is not null and target_call.opens_at > now())
       or (target_call.closes_at is not null and target_call.closes_at < now()) then
      raise exception 'La convocatoria no está abierta.';
    end if;

    if nullif(trim(new.project_name), '') is null
       or nullif(trim(new.contact_name), '') is null
       or nullif(trim(new.contact_email), '') is null
       or nullif(trim(new.summary), '') is null then
      raise exception 'La candidatura está incompleta.';
    end if;

    if not exists (
      select 1 from public.application_files f where f.application_id = new.id
    ) then
      raise exception 'La candidatura requiere un documento.';
    end if;

    new.registration_number := coalesce(
      new.registration_number,
      'ODI-' || extract(year from now())::text || '-' ||
      lpad(nextval('public.application_registration_seq')::text, 6, '0')
    );
    new.submitted_at := now();
    new.locked_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_application_submission on public.applications;
create trigger prepare_application_submission
before update of status on public.applications
for each row execute function public.prepare_application_submission();

drop policy if exists "organization members read" on public.application_files;
drop policy if exists "applicants read own application files" on public.application_files;
drop policy if exists "applicants add draft application files" on public.application_files;
drop policy if exists "applicants remove draft application files" on public.application_files;

create policy "applicants read own application files"
on public.application_files for select
using (
  exists (
    select 1 from public.applications a
    where a.id = application_id
      and (
        a.applicant_user_id = auth.uid()
        or public.has_permission(a.organization_id, 'applications.review')
        or exists (
          select 1 from public.evaluator_assignments ea
          where ea.application_id = a.id and ea.evaluator_id = auth.uid()
        )
      )
  )
);

create policy "applicants add draft application files"
on public.application_files for insert
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.applicant_user_id = auth.uid()
      and a.status = 'draft'
      and a.locked_at is null
      and a.organization_id = organization_id
  )
);

create policy "applicants remove draft application files"
on public.application_files for delete
using (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.applicant_user_id = auth.uid()
      and a.status = 'draft'
      and a.locked_at is null
  )
);

drop policy if exists "application owners upload files" on storage.objects;
drop policy if exists "application owners read files" on storage.objects;
drop policy if exists "application owners remove draft files" on storage.objects;

create policy "application owners upload files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'application-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "application owners read files"
on storage.objects for select to authenticated
using (
  bucket_id = 'application-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "application owners remove draft files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'application-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.workspace_item_manager(
  target_organization_id uuid,
  item_kind text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when item_kind = 'auditoria'
      then public.has_permission(target_organization_id, 'audit.read')
    when item_kind = 'usuarios'
      then public.has_permission(target_organization_id, 'users.manage')
    when item_kind in ('documentos', 'project_documentos')
      then public.has_permission(target_organization_id, 'documents.manage')
    when item_kind in ('candidaturas', 'evaluaciones')
      then public.has_permission(target_organization_id, 'applications.review')
        or public.has_permission(target_organization_id, 'evaluations.manage')
    when item_kind like 'project_%'
      then public.has_permission(target_organization_id, 'projects.manage')
    else public.has_permission(target_organization_id, 'programs.manage')
  end
$$;

create or replace function public.can_access_workspace_project(
  target_project_id uuid,
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and p.organization_id = target_organization_id
      and (
        public.has_permission(target_organization_id, 'projects.read_all')
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.mentor_assignments ma
          join public.mentors m on m.id = ma.mentor_id
          where ma.project_id = p.id and m.user_id = auth.uid()
        )
      )
  )
$$;

revoke all on function public.workspace_item_manager(uuid, text) from public;
revoke all on function public.can_access_workspace_project(uuid, uuid) from public;
grant execute on function public.workspace_item_manager(uuid, text) to authenticated;
grant execute on function public.can_access_workspace_project(uuid, uuid) to authenticated;

drop policy if exists "members read workspace items" on public.workspace_items;
drop policy if exists "members create own workspace items" on public.workspace_items;
drop policy if exists "owners managers update workspace items" on public.workspace_items;
drop policy if exists "owners managers delete workspace items" on public.workspace_items;

create policy "scoped read workspace items"
on public.workspace_items for select
using (
  public.workspace_item_manager(organization_id, kind)
  or created_by = auth.uid()
  or (
    project_id is not null
    and public.can_access_workspace_project(project_id, organization_id)
  )
);

create policy "scoped create workspace items"
on public.workspace_items for insert
with check (
  kind <> 'auditoria'
  and created_by = auth.uid()
  and (
    public.workspace_item_manager(organization_id, kind)
    or (
      project_id is not null
      and public.can_access_workspace_project(project_id, organization_id)
    )
    or kind in (
      'itinerario', 'entregables', 'mentorias', 'calendario',
      'comunidad', 'perfil', 'sesiones', 'horas'
    )
  )
);

create policy "scoped update workspace items"
on public.workspace_items for update
using (
  kind <> 'auditoria'
  and (
  public.workspace_item_manager(organization_id, kind)
  or created_by = auth.uid()
  )
)
with check (
  kind <> 'auditoria'
  and (
  public.workspace_item_manager(organization_id, kind)
  or created_by = auth.uid()
  )
);

create policy "scoped delete workspace items"
on public.workspace_items for delete
using (
  kind <> 'auditoria'
  and (
  public.workspace_item_manager(organization_id, kind)
  or created_by = auth.uid()
  )
);

create or replace function public.protect_workspace_item_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.organization_id := old.organization_id;
    new.project_id := old.project_id;
    new.kind := old.kind;
  end if;

  if new.project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = new.project_id
      and p.organization_id = new.organization_id
  ) then
    raise exception 'El proyecto no pertenece a la organización indicada.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_workspace_item_scope on public.workspace_items;
create trigger protect_workspace_item_scope
before insert or update on public.workspace_items
for each row execute function public.protect_workspace_item_scope();

drop policy if exists "evaluator reads assigned application" on public.applications;
create policy "evaluator reads assigned application"
on public.applications for select
using (
  exists (
    select 1 from public.evaluator_assignments ea
    where ea.application_id = applications.id
      and ea.evaluator_id = auth.uid()
  )
);

drop policy if exists "members read organization documents" on public.documents;
drop policy if exists "scoped document readers" on public.documents;
create policy "scoped document readers"
on public.documents for select
using (
  public.has_permission(organization_id, 'documents.manage')
  or (
    visibility in ('members', 'public')
    and public.is_organization_member(organization_id)
  )
  or (
    entity_type = 'project'
    and entity_id is not null
    and public.can_access_workspace_project(entity_id, organization_id)
  )
);

drop policy if exists "organization members read" on public.document_versions;
drop policy if exists "scoped document version readers" on public.document_versions;
create policy "scoped document version readers"
on public.document_versions for select
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
  )
);

do $$
declare target_table text;
begin
  foreach target_table in array array[
    'project_members', 'project_objectives', 'project_risks',
    'mentor_assignments', 'task_submissions', 'sessions'
  ] loop
    execute format('drop policy if exists "organization members read" on public.%I', target_table);
    execute format(
      'create policy "scoped project readers" on public.%I for select using (public.can_access_workspace_project(project_id, organization_id))',
      target_table
    );
  end loop;
end $$;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'programs.manage', 'calls.manage', 'applications.review',
  'evaluations.manage', 'projects.read_all', 'projects.manage',
  'documents.manage'
)
where r.code = 'coordinator'
on conflict do nothing;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  target_entity_id uuid;
begin
  target_organization_id := case when tg_op = 'DELETE' then old.organization_id else new.organization_id end;
  target_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;

  insert into public.audit_logs (
    organization_id, user_id, action, entity_type, entity_id, safe_changes
  ) values (
    target_organization_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    target_entity_id,
    case
      when tg_op = 'UPDATE' then jsonb_build_object('updated_at', now())
      else null
    end
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare target_table text;
begin
  foreach target_table in array array[
    'programs', 'calls', 'applications', 'projects', 'documents',
    'events', 'indicators', 'workspace_items'
  ] loop
    execute format('drop trigger if exists audit_%I on public.%I', target_table, target_table);
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.write_audit_log()',
      target_table,
      target_table
    );
  end loop;
end $$;

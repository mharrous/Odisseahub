-- Acciones reales para módulos administrativos y coherencia multi-organización.

drop policy if exists "organization managers update settings" on public.organization_settings;
create policy "organization managers update settings"
on public.organization_settings for update to authenticated
using (public.has_permission(organization_id, 'users.manage'))
with check (public.has_permission(organization_id, 'users.manage'));

drop policy if exists "user managers create memberships" on public.organization_members;
drop policy if exists "user managers update memberships" on public.organization_members;
drop policy if exists "user managers delete memberships" on public.organization_members;
create policy "user managers create memberships"
on public.organization_members for insert to authenticated
with check (public.has_permission(organization_id, 'users.manage'));
create policy "user managers update memberships"
on public.organization_members for update to authenticated
using (public.has_permission(organization_id, 'users.manage'))
with check (public.has_permission(organization_id, 'users.manage'));
create policy "user managers delete memberships"
on public.organization_members for delete to authenticated
using (public.has_permission(organization_id, 'users.manage'));

drop policy if exists "user managers read organization profiles" on public.profiles;
create policy "user managers read organization profiles"
on public.profiles for select to authenticated
using (
  profiles.id = auth.uid()
  or exists (
    select 1
    from public.organization_members target_member
    where target_member.user_id = profiles.id
      and public.has_permission(target_member.organization_id, 'users.manage')
  )
);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'evaluation_rubrics', 'evaluation_criteria', 'evaluator_assignments',
    'evaluations', 'evaluation_scores'
  ] loop
    execute format('drop policy if exists "evaluation managers manage" on public.%I', target_table);
    execute format(
      'create policy "evaluation managers manage" on public.%I for all to authenticated using (public.has_permission(organization_id, ''evaluations.manage'')) with check (public.has_permission(organization_id, ''evaluations.manage''))',
      target_table
    );
  end loop;

  foreach target_table in array array[
    'cohorts', 'itineraries', 'phases', 'modules', 'lessons',
    'activities', 'tasks', 'events', 'event_registrations',
    'attendance', 'indicators', 'indicator_values', 'report_exports'
  ] loop
    execute format('drop policy if exists "program managers manage domain records" on public.%I', target_table);
    execute format(
      'create policy "program managers manage domain records" on public.%I for all to authenticated using (public.has_permission(organization_id, ''programs.manage'')) with check (public.has_permission(organization_id, ''programs.manage''))',
      target_table
    );
  end loop;

  foreach target_table in array array[
    'mentors', 'mentor_specialties', 'mentor_assignments',
    'project_members', 'project_objectives', 'project_risks',
    'sessions', 'session_attendees', 'session_minutes'
  ] loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = 'organization_id'
    ) then
      execute format('drop policy if exists "project managers manage operational records" on public.%I', target_table);
      execute format(
        'create policy "project managers manage operational records" on public.%I for all to authenticated using (public.has_permission(organization_id, ''projects.manage'')) with check (public.has_permission(organization_id, ''projects.manage''))',
        target_table
      );
    end if;
  end loop;
end $$;

drop policy if exists "document managers manage versions" on public.document_versions;
create policy "document managers manage versions"
on public.document_versions for all to authenticated
using (public.has_permission(organization_id, 'documents.manage'))
with check (public.has_permission(organization_id, 'documents.manage'));

drop policy if exists "document managers upload objects" on storage.objects;
drop policy if exists "authorized users read document objects" on storage.objects;
drop policy if exists "document managers delete objects" on storage.objects;

create policy "document managers upload objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid, 'documents.manage')
);

create policy "authorized users read document objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and (
    (
      (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
      and public.has_permission(((storage.foldername(name))[1])::uuid, 'documents.manage')
    )
    or exists (
      select 1
      from public.document_versions version
      join public.documents document on document.id = version.document_id
      where version.storage_path = name
    )
  )
);

create policy "document managers delete objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid, 'documents.manage')
);

create or replace function public.enforce_parent_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_id uuid;
  parent_matches boolean;
begin
  parent_id := nullif(to_jsonb(new) ->> tg_argv[2], '')::uuid;
  if parent_id is null then
    return new;
  end if;
  execute format(
    'select exists (select 1 from public.%I where %I = $1 and organization_id = $2)',
    tg_argv[0],
    tg_argv[1]
  ) into parent_matches using parent_id, new.organization_id;
  if not parent_matches then
    raise exception 'El registro relacionado no pertenece a la organización indicada.';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_parent_organization() from public;

do $$
declare
  relation record;
begin
  for relation in
    select * from (values
      ('calls', 'programs', 'id', 'program_id'),
      ('cohorts', 'programs', 'id', 'program_id'),
      ('cohorts', 'calls', 'id', 'call_id'),
      ('evaluation_rubrics', 'calls', 'id', 'call_id'),
      ('evaluator_assignments', 'applications', 'id', 'application_id'),
      ('evaluations', 'evaluator_assignments', 'id', 'assignment_id'),
      ('evaluations', 'evaluation_rubrics', 'id', 'rubric_id'),
      ('itineraries', 'programs', 'id', 'program_id'),
      ('events', 'programs', 'id', 'program_id'),
      ('indicators', 'programs', 'id', 'program_id'),
      ('indicators', 'projects', 'id', 'project_id'),
      ('document_versions', 'documents', 'id', 'document_id')
    ) as links(child_table, parent_table, parent_key, child_column)
  loop
    execute format(
      'drop trigger if exists enforce_%I_%I_scope on public.%I',
      relation.child_table,
      relation.child_column,
      relation.child_table
    );
    execute format(
      'create trigger enforce_%I_%I_scope before insert or update on public.%I for each row execute function public.enforce_parent_organization(%L, %L, %L)',
      relation.child_table,
      relation.child_column,
      relation.child_table,
      relation.parent_table,
      relation.parent_key,
      relation.child_column
    );
  end loop;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'cohorts', 'evaluation_rubrics', 'evaluator_assignments', 'evaluations',
    'mentors', 'itineraries', 'report_exports', 'organization_members'
  ] loop
    execute format('drop trigger if exists audit_%I on public.%I', target_table, target_table);
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.write_audit_log()',
      target_table,
      target_table
    );
  end loop;
end $$;

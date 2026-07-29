-- Cambio completo de identidad visible y prefijo de registro a Mentoría.

update public.organization_settings
set
  contact_email = replace(contact_email, 'odissea', 'mentoria'),
  email_sender_name = replace(email_sender_name, 'ODISSEA', 'Mentoría')
where
  contact_email ilike '%odissea%'
  or email_sender_name ilike '%odissea%';

update public.profiles
set display_name = replace(display_name, 'ODISSEA', 'Mentoría')
where display_name ilike '%odissea%';

update public.programs
set name = replace(name, 'ODISSEA', 'Mentoría')
where name ilike '%odissea%';

update public.calls
set
  name = replace(name, 'ODISSEA', 'Mentoría'),
  slug = case when slug = 'primera-odissea' then 'primera-mentoria' else replace(slug, 'odissea', 'mentoria') end,
  contact_email = replace(contact_email, 'odissea', 'mentoria')
where
  name ilike '%odissea%'
  or slug ilike '%odissea%'
  or contact_email ilike '%odissea%';

update public.cohorts
set name = replace(name, 'ODISSEA', 'Mentoría')
where name ilike '%odissea%';

update public.itineraries
set name = replace(name, 'ODISSEA', 'Mentoría')
where name ilike '%odissea%';

update public.events
set location = replace(location, 'ODISSEA', 'Mentoría')
where location ilike '%odissea%';

update public.workspace_items
set
  title = replace(replace(title, 'ODISSEA', 'Mentoría'), 'ODI-', 'MEN-'),
  description = replace(description, 'ODISSEA', 'Mentoría'),
  owner_name = replace(owner_name, 'ODISSEA', 'Mentoría')
where
  title ilike '%odissea%'
  or title like 'ODI-%'
  or description ilike '%odissea%'
  or owner_name ilike '%odissea%';

alter table public.workspace_items
  alter column owner_name set default 'Coordinación Mentoría';

update public.applications
set registration_number = replace(registration_number, 'ODI-', 'MEN-')
where registration_number like 'ODI-%';

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
      'MEN-' || extract(year from now())::text || '-' ||
      lpad(nextval('public.application_registration_seq')::text, 6, '0')
    );
    new.submitted_at := now();
    new.locked_at := now();
  end if;
  return new;
end;
$$;

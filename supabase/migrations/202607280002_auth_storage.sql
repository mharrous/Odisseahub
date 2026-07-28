-- Autenticación, perfiles y almacenamiento privado.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_organization_role(target_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.code
  from public.organization_members m
  join public.roles r on r.id = m.role_id
  where m.organization_id = target_organization_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1
$$;

revoke all on function public.current_organization_role(uuid) from public;
grant execute on function public.current_organization_role(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'application-files',
    'application-files',
    false,
    10485760,
    array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'submission-files',
    'submission-files',
    false,
    26214400,
    array['application/pdf', 'application/zip', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  ),
  (
    'documents',
    'documents',
    false,
    26214400,
    null
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Los buckets son privados. Las operaciones se habilitarán mediante URLs
-- firmadas desde una función segura; no se conceden políticas abiertas
-- directamente sobre storage.objects.

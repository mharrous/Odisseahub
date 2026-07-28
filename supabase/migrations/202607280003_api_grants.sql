-- Privilegios de Data API. RLS sigue siendo la capa que decide qué filas
-- puede consultar o modificar cada rol.

grant usage on schema public to anon, authenticated;
grant execute on function public.is_organization_member(uuid) to anon;
grant execute on function public.has_permission(uuid, text) to anon;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

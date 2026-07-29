-- Ejecutar contra una base local después de `supabase db reset`.
-- Las aserciones fallan con división por cero si una política filtra mal.

begin;

-- Auth anónimo de Supabase utiliza el rol PostgreSQL `authenticated`.
-- Sin un `sub` válido, ninguna tabla privada debe devolver filas.
set local role authenticated;
select 1 / case when (select count(*) from public.workspace_items) = 0 then 1 else 0 end;
select 1 / case when (select count(*) from public.applications) = 0 then 1 else 0 end;
select 1 / case when (select count(*) from public.documents) = 0 then 1 else 0 end;

reset role;

select 1 / case when exists (
  select 1 from pg_policies
  where schemaname = 'public'
    and tablename = 'workspace_items'
    and policyname = 'scoped read workspace items'
) then 1 else 0 end;

select 1 / case when exists (
  select 1 from pg_trigger
  where tgname = 'prepare_application_submission'
    and not tgisinternal
) then 1 else 0 end;

select 1 / case when exists (
  select 1 from pg_trigger
  where tgname = 'protect_workspace_item_scope'
    and not tgisinternal
) then 1 else 0 end;

select 1 / case when exists (
  select 1 from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'authorized users read application files'
) then 1 else 0 end;

select 1 / case when exists (
  select 1 from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'application owners remove draft files'
    and qual like '%status%'
    and qual like '%draft%'
) then 1 else 0 end;

rollback;

-- Mantiene los adjuntos presentados inmutables y permite su lectura a revisores autorizados.

drop policy if exists "application owners read files" on storage.objects;
drop policy if exists "application owners remove draft files" on storage.objects;

create policy "authorized users read application files"
on storage.objects for select to authenticated
using (
  bucket_id = 'application-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.application_files f
      join public.applications a on a.id = f.application_id
      where f.storage_path = name
        and (
          public.has_permission(a.organization_id, 'applications.review')
          or exists (
            select 1
            from public.evaluator_assignments ea
            where ea.application_id = a.id
              and ea.evaluator_id = auth.uid()
          )
        )
    )
  )
);

create policy "application owners remove draft files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'application-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    not exists (
      select 1
      from public.application_files f
      where f.storage_path = name
    )
    or exists (
      select 1
      from public.application_files f
      join public.applications a on a.id = f.application_id
      where f.storage_path = name
        and a.applicant_user_id = auth.uid()
        and a.status = 'draft'
        and a.locked_at is null
    )
  )
);

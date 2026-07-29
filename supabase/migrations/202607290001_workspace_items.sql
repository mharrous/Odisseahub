-- Registros operativos flexibles para que los módulos de primera fase tengan
-- CRUD persistente sin mezclar su información con las tablas maestras.

create table if not exists public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  kind text not null,
  title text not null,
  description text,
  status text not null default 'Disponible'
    check (status in ('Disponible', 'En curso', 'Completado', 'Archivado')),
  owner_name text not null default 'Coordinación ODISSEA',
  due_on date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists workspace_items_scope_idx
  on public.workspace_items (organization_id, kind, project_id, updated_at desc)
  where deleted_at is null;

alter table public.workspace_items enable row level security;

create policy "members read workspace items"
  on public.workspace_items for select
  using (public.is_organization_member(organization_id));

create policy "members create own workspace items"
  on public.workspace_items for insert
  with check (
    public.is_organization_member(organization_id)
    and (created_by = auth.uid() or created_by is null)
  );

create policy "owners and managers update workspace items"
  on public.workspace_items for update
  using (
    created_by = auth.uid()
    or public.has_permission(organization_id, 'programs.manage')
  )
  with check (
    created_by = auth.uid()
    or public.has_permission(organization_id, 'programs.manage')
  );

create policy "owners and managers delete workspace items"
  on public.workspace_items for delete
  using (
    created_by = auth.uid()
    or public.has_permission(organization_id, 'programs.manage')
  );

grant select, insert, update, delete on public.workspace_items to authenticated;

drop trigger if exists set_workspace_items_updated_at on public.workspace_items;
create trigger set_workspace_items_updated_at
  before update on public.workspace_items
  for each row execute function public.set_updated_at();

insert into public.workspace_items
  (id, organization_id, kind, title, description, status, owner_name, due_on)
values
  ('71000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','convocatorias','Primera convocatoria ODISSEA','Convocatoria pública activa','Disponible','María Campos','2026-09-30'),
  ('71000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','candidaturas','ODI-2026-0012 · HydroSense','Documentación completa','En curso','Coordinación ODISSEA',null),
  ('71000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','candidaturas','ODI-2026-0015 · Gadir Cloud','Pendiente de revisión técnica','En curso','María Campos',null),
  ('71000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','itinerarios','Itinerario base ODISSEA','2 fases y 9 módulos','Disponible','Coordinación ODISSEA',null),
  ('71000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','mentores','Lucía Romero · Estrategia','Modalidad híbrida','Disponible','María Campos',null),
  ('71000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','mentores','Álvaro Peña · Finanzas','Modalidad online','Disponible','María Campos',null),
  ('71000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','eventos','Taller de estrategia comercial','Espacio ODISSEA','En curso','Coordinación ODISSEA','2026-07-30'),
  ('71000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000001','indicadores','RCO01 · Proyectos acompañados','Objetivo anual','En curso','María Campos','2026-12-31'),
  ('71000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000001','documentos','Bases reguladoras.pdf','Documento privado · versión 1','Disponible','María Campos',null),
  ('71000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000001','informes','Informe mensual · Julio','Seguimiento ejecutivo','Completado','María Campos',null),
  ('71000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','configuracion','Identidad visual','Marca y apariencia institucional','Disponible','María Campos',null),
  ('71000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000001','auditoria','María Campos publicó una convocatoria','Acción registrada automáticamente','Completado','Sistema',null),
  ('71000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000001','usuarios','Administrador ODISSEA','Membresía activa · organización','Disponible','Sistema',null)
on conflict (id) do nothing;

insert into public.workspace_items
  (id, organization_id, project_id, kind, title, description, status, owner_name, due_on)
select values_table.id, '10000000-0000-0000-0000-000000000001', p.id,
       values_table.kind, values_table.title, values_table.description,
       values_table.status, values_table.owner_name, values_table.due_on
from public.projects p
cross join (
  values
    ('72000000-0000-0000-0000-000000000001'::uuid,'project_equipo','Nora Haddad','Responsable del proyecto','Disponible','Coordinación ODISSEA',null::date),
    ('72000000-0000-0000-0000-000000000002'::uuid,'project_equipo','Lucía Romero','Mentora principal','Disponible','Coordinación ODISSEA',null::date),
    ('72000000-0000-0000-0000-000000000003'::uuid,'project_entregables','Validación de mercado','Entrega en revisión','En curso','Nora Haddad','2026-08-14'::date),
    ('72000000-0000-0000-0000-000000000004'::uuid,'project_sesiones','Revisión de validación','Sesión online','En curso','Lucía Romero','2026-08-04'::date),
    ('72000000-0000-0000-0000-000000000005'::uuid,'project_indicadores','Progreso del itinerario','Seguimiento mensual','En curso','Coordinación ODISSEA',null::date),
    ('72000000-0000-0000-0000-000000000006'::uuid,'project_observaciones','Seguimiento ordinario','Sin incidencias críticas','Disponible','María Campos',null::date),
    ('72000000-0000-0000-0000-000000000007'::uuid,'project_itinerario','Validación de mercado','Actividad en curso','En curso','Nora Haddad','2026-08-14'::date),
    ('72000000-0000-0000-0000-000000000008'::uuid,'project_mentorias','Mentoría de estrategia','Próxima sesión online','En curso','Lucía Romero','2026-08-04'::date),
    ('72000000-0000-0000-0000-000000000009'::uuid,'project_documentos','Matriz de evidencias','Documento privado','Disponible','Nora Haddad',null::date),
    ('72000000-0000-0000-0000-000000000010'::uuid,'project_actividad','Actualización del progreso','Progreso actualizado al 74%','Completado','Sistema',null::date)
) as values_table(id,kind,title,description,status,owner_name,due_on)
where p.name = 'Abyla Robotics'
on conflict (id) do nothing;

-- Datos ficticios y repetibles para desarrollo local.
insert into public.organizations (id, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'Cámara de Comercio de Ceuta', 'camara-ceuta')
on conflict (id) do nothing;

insert into public.organization_settings (organization_id, contact_email)
values ('10000000-0000-0000-0000-000000000001', 'odissea@example.invalid')
on conflict (organization_id) do nothing;

insert into public.permissions (code, description) values
  ('programs.manage', 'Crear y modificar programas'),
  ('calls.manage', 'Crear y publicar convocatorias'),
  ('applications.review', 'Revisar candidaturas'),
  ('evaluations.manage', 'Administrar evaluaciones'),
  ('projects.read_all', 'Consultar todos los proyectos'),
  ('projects.manage', 'Administrar proyectos'),
  ('documents.manage', 'Administrar documentación'),
  ('users.manage', 'Administrar usuarios'),
  ('audit.read', 'Consultar auditoría')
on conflict (code) do nothing;

insert into public.roles (id, organization_id, code, name, is_system) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'organization_admin', 'Administrador de la organización', true),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'coordinator', 'Coordinador de programa', true),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'mentor', 'Mentor', true),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'participant', 'Participante', true),
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'evaluator', 'Evaluador', true)
on conflict (id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select '11000000-0000-0000-0000-000000000001'::uuid, id from public.permissions
on conflict do nothing;

insert into public.programs (id, organization_id, name, description, objectives, status, places, starts_on, ends_on, color)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Primera convocatoria ODISSEA',
  'Programa de incubación y consolidación para proyectos de alta tecnología.',
  'Validación, crecimiento, acceso a mercado y preparación para financiación.',
  'active', 8, '2026-02-01', '2027-01-31', '#1677FF'
) on conflict (id) do nothing;

insert into public.calls (id, organization_id, program_id, name, slug, description, opens_at, closes_at, places, status, privacy_text, contact_email)
values (
  '21000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Primera convocatoria ODISSEA', 'primera-odissea',
  'Convocatoria para ocho proyectos tecnológicos.', '2026-07-01', '2026-09-30 23:59:59+02',
  8, 'published', 'Texto demostrativo pendiente de validación jurídica.', 'odissea@example.invalid'
) on conflict (id) do nothing;

insert into public.cohorts (id, organization_id, program_id, call_id, name, starts_on, ends_on, status)
values (
  '22000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  'Cohorte ODISSEA 2026', '2026-02-01', '2027-01-31', 'active'
) on conflict (id) do nothing;

insert into public.projects (id, organization_id, cohort_id, name, description, sector, status, maturity_stage, progress) values
  ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Abyla Robotics','Robótica aplicada al entorno marino.','Robótica marina','active','validation',74),
  ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Nauta AI','Analítica predictiva para operaciones portuarias.','Inteligencia artificial','active','validation',61),
  ('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Estrecho Circular','Reutilización de subproductos industriales.','Economía circular','active','growth',83),
  ('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Ceuta Biolab','Biomateriales de origen marino.','Biotecnología','at_risk','prototype',38),
  ('30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Atlas Mobility','Movilidad inteligente de última milla.','Movilidad','active','growth',68),
  ('30000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','BlueTrace','Sensores para monitorización oceánica.','Oceanografía','active','prototype',57),
  ('30000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Neptuno Secure','Ciberseguridad para infraestructuras marítimas.','Ciberseguridad','active','growth',79),
  ('30000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','Orilla Health','Seguimiento remoto de salud.','Salud digital','at_risk','validation',31)
on conflict (id) do nothing;

insert into public.mentors (id, organization_id, full_name, biography, languages, modality, status) values
  ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Lucía Romero','Especialista ficticia en estrategia y producto.',array['es','en'],'hybrid','active'),
  ('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Álvaro Peña','Especialista ficticio en finanzas y crecimiento.',array['es'],'online','active'),
  ('40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Marta Soler','Especialista ficticia en comercialización.',array['es','fr'],'hybrid','active')
on conflict (id) do nothing;

insert into public.itineraries (id, organization_id, program_id, name)
values ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Itinerario base ODISSEA')
on conflict (id) do nothing;
insert into public.phases (id, organization_id, itinerary_id, title, description, position, duration_days) values
  ('51000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Incubación','Análisis, propuesta de valor, modelo, mercado y Demo Day.',1,120),
  ('51000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Consolidación','Crecimiento, escalabilidad, desarrollo comercial y financiación.',2,240)
on conflict (id) do nothing;
insert into public.modules (id, organization_id, phase_id, title, description, position, progress_weight) values
  ('52000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001','Diagnóstico inicial','Punto de partida y objetivos.',1,15),
  ('52000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001','Validación de mercado','Entrevistas, hipótesis y evidencias.',2,25),
  ('52000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000002','Crecimiento comercial','Canales, ventas y alianzas.',1,30)
on conflict (id) do nothing;

insert into public.indicators (id, organization_id, program_id, code, name, data_type, unit, target_value, source, frequency) values
  ('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','RCO01','Empresas apoyadas','number','empresas','8','Registro del programa','monthly'),
  ('60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','RCO04','Empresas con apoyo no financiero','number','empresas','8','Registro de actividades','quarterly'),
  ('60000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','RCR18','Participantes que mantienen actividad','percentage','%','85','Seguimiento','quarterly'),
  ('60000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','MENTOR_HOURS','Horas de mentoría','number','horas','240','Actas de sesión','monthly')
on conflict (id) do nothing;

insert into public.events (id, organization_id, program_id, title, event_type, starts_at, ends_at, capacity, location) values
  ('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Taller de estrategia comercial','workshop','2026-07-30 10:00:00+02','2026-07-30 13:00:00+02',30,'Espacio ODISSEA'),
  ('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Comité mensual de seguimiento','meeting','2026-08-06 09:30:00+02','2026-08-06 11:00:00+02',20,'Online')
on conflict (id) do nothing;

insert into public.documents (id, organization_id, entity_type, entity_id, title, category, visibility) values
  ('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','program','20000000-0000-0000-0000-000000000001','Bases reguladoras','legal','private'),
  ('80000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','program','20000000-0000-0000-0000-000000000001','Plantilla de modelo financiero','template','members')
on conflict (id) do nothing;

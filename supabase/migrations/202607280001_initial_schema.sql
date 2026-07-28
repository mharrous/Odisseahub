-- ODISSEA HUB · esquema inicial multi-organización
create extension if not exists pgcrypto;

create type public.program_status as enum ('draft', 'published', 'active', 'completed', 'archived');
create type public.application_status as enum ('draft', 'submitted', 'documentation_pending', 'admitted', 'not_admitted', 'under_evaluation', 'selected', 'reserve', 'rejected', 'withdrawn');
create type public.submission_status as enum ('not_started', 'in_progress', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'overdue');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  logo_path text,
  compact_logo_path text,
  favicon_path text,
  primary_color text not null default '#1677FF',
  secondary_color text not null default '#13B8A6',
  contact_email text,
  legal_notice text,
  privacy_policy text,
  email_sender_name text,
  ai_enabled boolean not null default false,
  retention_days integer check (retention_days is null or retention_days > 0),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  avatar_path text,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, code)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.organization_members m
  where m.organization_id = target_organization_id and m.user_id = auth.uid() and m.status = 'active'
) $$;

create or replace function public.has_permission(target_organization_id uuid, permission_code text)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1
  from public.organization_members m
  join public.role_permissions rp on rp.role_id = m.role_id
  join public.permissions p on p.id = rp.permission_id
  where m.organization_id = target_organization_id
    and m.user_id = auth.uid()
    and m.status = 'active'
    and p.code = permission_code
) $$;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  objectives text,
  status public.program_status not null default 'draft',
  places integer not null default 0 check (places >= 0),
  starts_on date,
  ends_on date,
  color text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index programs_organization_status_idx on public.programs (organization_id, status) where deleted_at is null;

create table public.program_members (
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (program_id, user_id, role)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  opens_at timestamptz,
  closes_at timestamptz,
  places integer not null default 0 check (places >= 0),
  status public.program_status not null default 'draft',
  legal_basis_path text,
  privacy_text text,
  contact_email text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
create index calls_program_idx on public.calls (program_id, status);

create table public.application_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.calls(id) on delete cascade,
  name text not null,
  version integer not null default 1,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_form_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_id uuid not null references public.application_forms(id) on delete cascade,
  field_type text not null,
  label text not null,
  help_text text,
  is_required boolean not null default false,
  position integer not null,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, position)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.calls(id),
  applicant_user_id uuid references public.profiles(id),
  registration_number text,
  project_name text not null,
  status public.application_status not null default 'draft',
  submitted_at timestamptz,
  locked_at timestamptz,
  reopened_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, registration_number)
);
create index applications_call_status_idx on public.applications (call_id, status);
create index applications_applicant_idx on public.applications (applicant_user_id);

create table public.application_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  field_id uuid not null references public.application_form_fields(id),
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, field_id)
);

create table public.application_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.evaluation_rubrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  call_id uuid not null references public.calls(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rubric_id uuid not null references public.evaluation_rubrics(id) on delete cascade,
  name text not null,
  weight numeric(5,2) not null check (weight > 0 and weight <= 100),
  min_score numeric not null default 0,
  max_score numeric not null check (max_score > min_score),
  position integer not null,
  created_at timestamptz not null default now()
);
create table public.evaluator_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  evaluator_id uuid not null references public.profiles(id) on delete cascade,
  conflict_declared boolean not null default false,
  conflict_note text,
  assigned_at timestamptz not null default now(),
  unique (application_id, evaluator_id)
);
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignment_id uuid not null unique references public.evaluator_assignments(id) on delete cascade,
  rubric_id uuid not null references public.evaluation_rubrics(id),
  private_comments text,
  shared_comments text,
  total_score numeric,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  criterion_id uuid not null references public.evaluation_criteria(id),
  score numeric not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evaluation_id, criterion_id)
);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.programs(id),
  call_id uuid references public.calls(id),
  name text not null,
  starts_on date,
  ends_on date,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cohort_id uuid references public.cohorts(id),
  application_id uuid unique references public.applications(id),
  name text not null,
  legal_name text,
  description text,
  sector text,
  status text not null default 'active',
  maturity_stage text,
  starts_on date,
  expected_exit_on date,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index projects_organization_status_idx on public.projects (organization_id, status) where deleted_at is null;
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id),
  full_name text not null,
  email text,
  project_role text,
  linkedin_url text,
  joined_on date,
  left_on date,
  created_at timestamptz not null default now()
);
create table public.project_objectives (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, title text not null, status text not null default 'open',
  due_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_risks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, title text not null, probability text, impact text,
  mitigation text, status text not null default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.mentors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id), full_name text not null, biography text, languages text[], modality text,
  linkedin_url text, internal_rate numeric(12,2), status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mentor_specialties (
  mentor_id uuid not null references public.mentors(id) on delete cascade, specialty text not null,
  created_at timestamptz not null default now(), primary key (mentor_id, specialty)
);
create table public.mentor_assignments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id), project_id uuid not null references public.projects(id),
  is_primary boolean not null default false, specialty text, reason text, starts_on date, ends_on date,
  created_at timestamptz not null default now()
);

create table public.itineraries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid references public.programs(id), name text not null, is_template boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.phases (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  itinerary_id uuid not null references public.itineraries(id) on delete cascade, title text not null, description text,
  position integer not null, duration_days integer, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (itinerary_id, position)
);
create table public.modules (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  phase_id uuid not null references public.phases(id) on delete cascade, title text not null, description text, position integer not null,
  opens_at timestamptz, due_at timestamptz, is_required boolean not null default true, progress_weight numeric(6,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (phase_id, position)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade, title text not null, content_type text not null,
  content jsonb not null default '{}'::jsonb, position integer not null, estimated_minutes integer,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade, title text not null, activity_type text not null,
  instructions text, position integer not null, due_at timestamptz, is_required boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade, title text not null, instructions text, due_at timestamptz,
  requires_review boolean not null default true, allows_new_version boolean not null default true, max_files integer not null default 5,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.task_submissions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id), project_id uuid not null references public.projects(id),
  status public.submission_status not null default 'not_started', current_version integer not null default 0,
  submitted_at timestamptz, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (task_id, project_id)
);
create table public.submission_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.task_submissions(id) on delete cascade, version_number integer not null,
  text_content text, link_url text, submitted_by uuid references public.profiles(id), created_at timestamptz not null default now(),
  unique (submission_id, version_number)
);
create table public.submission_files (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  version_id uuid not null references public.submission_versions(id) on delete cascade, storage_path text not null,
  original_name text not null, mime_type text, size_bytes bigint, created_at timestamptz not null default now()
);
create table public.feedback (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.task_submissions(id) on delete cascade, version_id uuid references public.submission_versions(id),
  author_id uuid not null references public.profiles(id), body text not null, is_private boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id), mentor_id uuid references public.mentors(id), title text not null,
  status text not null default 'scheduled', modality text, meeting_url text, location text, starts_at timestamptz not null,
  planned_minutes integer, actual_minutes integer, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.session_attendees (
  session_id uuid not null references public.sessions(id) on delete cascade, user_id uuid not null references public.profiles(id),
  attended boolean, created_at timestamptz not null default now(), primary key (session_id, user_id)
);
create table public.session_minutes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null unique references public.sessions(id) on delete cascade, objectives text, summary text, agreements text,
  visible_to_participant boolean not null default false, authored_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid references public.programs(id), title text not null, event_type text not null, starts_at timestamptz not null,
  ends_at timestamptz, capacity integer, location text, meeting_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade, user_id uuid not null references public.profiles(id),
  status text not null default 'registered', created_at timestamptz not null default now(), unique (event_id, user_id)
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade, user_id uuid not null references public.profiles(id),
  attended boolean not null, checked_at timestamptz, checked_by uuid references public.profiles(id), unique (event_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null, entity_id uuid, folder_path text, title text not null, description text, category text,
  visibility text not null default 'private', current_version integer not null default 1, uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index documents_entity_idx on public.documents (organization_id, entity_type, entity_id) where deleted_at is null;
create table public.document_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade, version_number integer not null,
  storage_path text not null, original_name text not null, mime_type text, size_bytes bigint, uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), unique (document_id, version_number)
);

create table public.indicators (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid references public.programs(id), project_id uuid references public.projects(id), code text not null, name text not null,
  data_type text not null, unit text, target_value jsonb, source text, frequency text, responsible_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index indicators_scope_idx on public.indicators (organization_id, program_id, project_id);
create table public.indicator_values (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id) on delete cascade, value jsonb not null, measured_at timestamptz not null,
  entered_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.indicator_evidence (
  indicator_value_id uuid not null references public.indicator_values(id) on delete cascade,
  document_id uuid not null references public.documents(id), created_at timestamptz not null default now(),
  primary key (indicator_value_id, document_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, category text not null, title text not null, body text,
  action_url text, read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create table public.notification_preferences (
  organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null, in_app boolean not null default true, email boolean not null default false, updated_at timestamptz not null default now(),
  primary key (organization_id, user_id, category)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null, entity_id uuid,
  safe_changes jsonb, ip inet, user_agent text, created_at timestamptz not null default now()
);
create index audit_logs_org_date_idx on public.audit_logs (organization_id, created_at desc);
create table public.report_exports (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type text not null, format text not null, filters jsonb not null default '{}'::jsonb, storage_path text,
  generated_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

do $$
declare target_table text;
begin
  foreach target_table in array array[
    'organizations','organization_settings','profiles','organization_members','programs','calls','application_forms',
    'application_form_fields','applications','application_answers','evaluation_rubrics','evaluations','evaluation_scores',
    'cohorts','projects','project_objectives','project_risks','mentors','itineraries','phases','modules','lessons','activities',
    'tasks','task_submissions','feedback','sessions','session_minutes','events','documents','indicators'
  ] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
  end loop;
end $$;

-- RLS se habilita en todas las tablas del esquema público creadas por esta migración.
do $$
declare item record;
begin
  for item in select tablename from pg_tables where schemaname = 'public'
  loop execute format('alter table public.%I enable row level security', item.tablename);
  end loop;
end $$;

create policy "members read organization" on public.organizations for select
  using (public.is_organization_member(organizations.id));
create policy "members read own membership" on public.organization_members for select
  using (user_id = auth.uid() or public.has_permission(organization_id, 'users.manage'));
create policy "users read own profile" on public.profiles for select using (profiles.id = auth.uid());
create policy "users update own profile" on public.profiles for update using (profiles.id = auth.uid()) with check (profiles.id = auth.uid());

create policy "members read programs" on public.programs for select
  using (public.is_organization_member(organization_id));
create policy "program managers create programs" on public.programs for insert
  with check (public.has_permission(organization_id, 'programs.manage'));
create policy "program managers update programs" on public.programs for update
  using (public.has_permission(organization_id, 'programs.manage'))
  with check (public.has_permission(organization_id, 'programs.manage'));
create policy "published calls are public" on public.calls for select
  using (status in ('published', 'active') or public.is_organization_member(organization_id));
create policy "program managers manage calls" on public.calls for all
  using (public.has_permission(organization_id, 'calls.manage'))
  with check (public.has_permission(organization_id, 'calls.manage'));

create policy "applicant reads own applications" on public.applications for select
  using (applicant_user_id = auth.uid() or public.has_permission(organization_id, 'applications.review'));
create policy "applicant creates own draft" on public.applications for insert
  with check (applicant_user_id = auth.uid() and status = 'draft');
create policy "applicant updates unlocked draft" on public.applications for update
  using (applicant_user_id = auth.uid() and status = 'draft' and locked_at is null)
  with check (applicant_user_id = auth.uid());
create policy "reviewers manage applications" on public.applications for update
  using (public.has_permission(organization_id, 'applications.review'))
  with check (public.has_permission(organization_id, 'applications.review'));
create policy "answers follow application access" on public.application_answers for select
  using (exists (select 1 from public.applications a where a.id = application_id and (a.applicant_user_id = auth.uid() or public.has_permission(a.organization_id, 'applications.review'))));
create policy "applicants edit draft answers" on public.application_answers for all
  using (exists (select 1 from public.applications a where a.id = application_id and a.applicant_user_id = auth.uid() and a.status = 'draft' and a.locked_at is null))
  with check (exists (select 1 from public.applications a where a.id = application_id and a.applicant_user_id = auth.uid() and a.status = 'draft' and a.locked_at is null));

create policy "evaluators read assignments" on public.evaluator_assignments for select
  using (evaluator_id = auth.uid() or public.has_permission(organization_id, 'evaluations.manage'));
create policy "evaluators read own evaluations" on public.evaluations for select
  using (exists (select 1 from public.evaluator_assignments ea where ea.id = assignment_id and ea.evaluator_id = auth.uid()) or public.has_permission(organization_id, 'evaluations.manage'));
create policy "evaluators edit open evaluations" on public.evaluations for update
  using (finalized_at is null and exists (select 1 from public.evaluator_assignments ea where ea.id = assignment_id and ea.evaluator_id = auth.uid()))
  with check (exists (select 1 from public.evaluator_assignments ea where ea.id = assignment_id and ea.evaluator_id = auth.uid()));

create policy "members read projects" on public.projects for select
  using (
    public.has_permission(organization_id, 'projects.read_all')
    or exists (select 1 from public.project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid())
    or exists (select 1 from public.mentor_assignments ma join public.mentors m on m.id = ma.mentor_id where ma.project_id = projects.id and m.user_id = auth.uid())
  );
create policy "project managers manage projects" on public.projects for all
  using (public.has_permission(organization_id, 'projects.manage'))
  with check (public.has_permission(organization_id, 'projects.manage'));

create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "auditors read logs" on public.audit_logs for select
  using (organization_id is not null and public.has_permission(organization_id, 'audit.read'));
-- No UPDATE ni DELETE policy sobre audit_logs: los registros son append-only.

create policy "members read organization documents" on public.documents for select
  using (public.is_organization_member(organization_id));
create policy "document managers manage documents" on public.documents for all
  using (public.has_permission(organization_id, 'documents.manage'))
  with check (public.has_permission(organization_id, 'documents.manage'));

-- Política base para tablas organizativas sin reglas más específicas.
do $$
declare target_table text;
begin
  foreach target_table in array array[
    'organization_settings','roles','permissions','role_permissions','program_members','application_forms',
    'application_form_fields','application_files','evaluation_rubrics','evaluation_criteria','evaluation_scores','cohorts',
    'project_members','project_objectives','project_risks','mentors','mentor_specialties','mentor_assignments','itineraries',
    'phases','modules','lessons','activities','tasks','task_submissions','submission_versions','submission_files','feedback',
    'sessions','session_attendees','session_minutes','events','event_registrations','attendance','document_versions',
    'indicators','indicator_values','indicator_evidence','notification_preferences','report_exports'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = target_table and column_name = 'organization_id'
    ) then
      execute format('create policy "organization members read" on public.%I for select using (public.is_organization_member(organization_id))', target_table);
    end if;
  end loop;
end $$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_permission(uuid, text) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;

import { initialPrograms, projects as demoProjects } from '../data/demo'
import type { AppNotification, DashboardSummary, Program, Project, UserProfile, WorkspaceItem } from '../types/domain'
import { isSupabaseConfigured, supabase } from './supabase'
import { loadLocal, makeId, saveLocal } from './storage'
import { DEMO_ORGANIZATION_ID, resolveOrganizationId } from './tenant'

export const MENTORIA_ORGANIZATION_ID = DEMO_ORGANIZATION_ID

const programStatusToDb: Record<Program['status'], string> = {
  Borrador: 'draft',
  Publicado: 'published',
  Activo: 'active',
  Finalizado: 'completed',
}

const programStatusFromDb: Record<string, Program['status']> = {
  draft: 'Borrador',
  published: 'Publicado',
  active: 'Activo',
  completed: 'Finalizado',
  archived: 'Finalizado',
}

const maturityLabels: Record<string, string> = {
  idea: 'Ideación',
  prototype: 'Prototipado',
  validation: 'Incubación',
  growth: 'Consolidación',
}

function assertSupabase() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function mapProgram(row: Record<string, unknown>): Program {
  return {
    id: String(row.id),
    name: String(row.name),
    entity: String(row.organization_name ?? 'Organización Mentoría'),
    status: programStatusFromDb[String(row.status)] ?? 'Borrador',
    places: Number(row.places ?? 0),
    projects: Number(row.project_count ?? 0),
    progress: Number(row.progress ?? 0),
    startDate: String(row.starts_on ?? ''),
    endDate: String(row.ends_on ?? ''),
    color: String(row.color ?? '#13B8A6'),
  }
}

export async function listPrograms(): Promise<Program[]> {
  if (!isSupabaseConfigured) return loadLocal<Program[]>('mentoria-programs', initialPrograms)
  const client = assertSupabase()
  const organizationId = await resolveOrganizationId()
  const [programResult, cohortResult, projectResult, organizationResult] = await Promise.all([
    client.from('programs').select('id,name,status,places,starts_on,ends_on,color').eq('organization_id', organizationId).is('deleted_at', null).order('created_at'),
    client.from('cohorts').select('id,program_id').eq('organization_id', organizationId),
    client.from('projects').select('id,cohort_id,progress').eq('organization_id', organizationId).is('deleted_at', null),
    client.from('organizations').select('name').eq('id', organizationId).single(),
  ])
  if (programResult.error) throw programResult.error
  if (cohortResult.error) throw cohortResult.error
  if (projectResult.error) throw projectResult.error
  if (organizationResult.error) throw organizationResult.error

  const programByCohort = new Map((cohortResult.data ?? []).map((row) => [String(row.id), String(row.program_id)]))
  return (programResult.data ?? []).map((row) => {
    const projects = (projectResult.data ?? []).filter((project) => programByCohort.get(String(project.cohort_id)) === String(row.id))
    const progress = projects.length
      ? projects.reduce((total, project) => total + Number(project.progress ?? 0), 0) / projects.length
      : 0
    return mapProgram({
      ...row,
      organization_name: organizationResult.data.name,
      project_count: projects.length,
      progress: Math.round(progress),
    } as Record<string, unknown>)
  })
}

export async function createProgram(input: Omit<Program, 'id' | 'entity' | 'projects' | 'progress' | 'status' | 'color'>): Promise<Program> {
  if (!isSupabaseConfigured) {
    const current = loadLocal<Program[]>('mentoria-programs', initialPrograms)
    const next: Program = {
      id: makeId('program'),
      entity: 'Cámara de Comercio de Ceuta',
      projects: 0,
      progress: 0,
      status: 'Borrador',
      color: '#13B8A6',
      ...input,
    }
    saveLocal('mentoria-programs', [...current, next])
    return next
  }
  const client = assertSupabase()
  const organizationId = await resolveOrganizationId()
  const { data, error } = await client.from('programs').insert({
    organization_id: organizationId,
    name: input.name,
    places: input.places,
    starts_on: input.startDate || null,
    ends_on: input.endDate || null,
    color: '#13B8A6',
    status: 'draft',
  }).select('id,name,status,places,starts_on,ends_on,color').single()
  if (error) throw error
  return mapProgram(data as Record<string, unknown>)
}

export async function updateProgram(program: Program): Promise<Program> {
  if (!isSupabaseConfigured) {
    const current = loadLocal<Program[]>('mentoria-programs', initialPrograms)
    saveLocal('mentoria-programs', current.map((item) => item.id === program.id ? program : item))
    return program
  }
  const { data, error } = await assertSupabase().from('programs').update({
    name: program.name,
    status: programStatusToDb[program.status],
    places: program.places,
    starts_on: program.startDate || null,
    ends_on: program.endDate || null,
    color: program.color,
  }).eq('id', program.id).select('id,name,status,places,starts_on,ends_on,color').single()
  if (error) throw error
  return mapProgram({ ...data, project_count: program.projects, progress: program.progress } as Record<string, unknown>)
}

export async function duplicateProgram(program: Program): Promise<Program> {
  return createProgram({
    name: `${program.name} — Copia`,
    places: program.places,
    startDate: program.startDate,
    endDate: program.endDate,
  })
}

export async function removeProgram(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const current = loadLocal<Program[]>('mentoria-programs', initialPrograms)
    saveLocal('mentoria-programs', current.filter((item) => item.id !== id))
    return
  }
  const { error } = await assertSupabase().from('programs').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    sector: String(row.sector ?? 'Sin sector'),
    phase: maturityLabels[String(row.maturity_stage)] ?? 'Sin fase',
    status: String(row.status) === 'at_risk' ? 'En riesgo' : Number(row.progress ?? 0) >= 70 ? 'Al día' : 'En marcha',
    progress: Number(row.progress ?? 0),
    mentor: String(row.mentor_name ?? 'Sin asignar'),
    lead: String(row.lead_name ?? 'Equipo del proyecto'),
    nextMilestone: String(row.next_milestone ?? 'Sin hito pendiente'),
    hours: Number(row.mentor_hours ?? 0),
  }
}

export async function listProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return demoProjects
  const client = assertSupabase()
  const organizationId = await resolveOrganizationId()
  const { data, error } = await client
    .from('projects')
    .select('id,name,sector,status,maturity_stage,progress')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error

  const projectRows = data ?? []
  const projectIds = projectRows.map((row) => String(row.id))
  if (!projectIds.length) return []

  const [membersResult, assignmentsResult, objectivesResult, sessionsResult] = await Promise.all([
    client.from('project_members').select('project_id,full_name,project_role,left_on').in('project_id', projectIds),
    client.from('mentor_assignments').select('project_id,is_primary,mentors(full_name)').in('project_id', projectIds),
    client.from('project_objectives').select('project_id,title,due_on,status').in('project_id', projectIds).neq('status', 'completed').order('due_on'),
    client.from('sessions').select('project_id,actual_minutes').in('project_id', projectIds).not('actual_minutes', 'is', null),
  ])
  if (membersResult.error) throw membersResult.error
  if (assignmentsResult.error) throw assignmentsResult.error
  if (objectivesResult.error) throw objectivesResult.error
  if (sessionsResult.error) throw sessionsResult.error

  return projectRows.map((row) => {
    const projectId = String(row.id)
    const activeMembers = (membersResult.data ?? []).filter((member) => String(member.project_id) === projectId && !member.left_on)
    const lead = activeMembers.find((member) => member.project_role === 'lead') ?? activeMembers[0]
    const assignments = (assignmentsResult.data ?? []).filter((item) => String(item.project_id) === projectId)
    const assignment = assignments.find((item) => item.is_primary) ?? assignments[0]
    const mentorRow = assignment?.mentors as unknown as { full_name?: string } | null
    const objective = (objectivesResult.data ?? []).find((item) => String(item.project_id) === projectId)
    const minutes = (sessionsResult.data ?? [])
      .filter((item) => String(item.project_id) === projectId)
      .reduce((total, item) => total + Number(item.actual_minutes ?? 0), 0)
    return mapProject({
      ...row,
      lead_name: lead?.full_name,
      mentor_name: mentorRow?.full_name,
      next_milestone: objective?.title,
      mentor_hours: Math.round(minutes / 60),
    } as Record<string, unknown>)
  })
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured) return demoProjects.find((item) => item.id === id) ?? null
  const projects = await listProjects()
  return projects.find((project) => project.id === id) ?? null
}

function workspaceKey(kind: string, projectId?: string) {
  return `mentoria-workspace-${kind}-${projectId ?? 'organization'}`
}

function mapWorkspaceItem(row: Record<string, unknown>): WorkspaceItem {
  return {
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    description: String(row.description ?? ''),
    status: String(row.status ?? 'Disponible') as WorkspaceItem['status'],
    owner: String(row.owner_name ?? 'Coordinación Mentoría'),
    dueDate: row.due_on ? String(row.due_on) : undefined,
    projectId: row.project_id ? String(row.project_id) : undefined,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  }
}

export async function listWorkspaceItems(kind: string, projectId?: string, defaults: WorkspaceItem[] = []): Promise<WorkspaceItem[]> {
  if (!isSupabaseConfigured) {
    const key = workspaceKey(kind, projectId)
    const stored = loadLocal<WorkspaceItem[]>(key, [])
    if (stored.length || !defaults.length) return stored
    saveLocal(key, defaults)
    return defaults
  }
  const organizationId = await resolveOrganizationId()
  let query = assertSupabase()
    .from('workspace_items')
    .select('id,kind,title,description,status,owner_name,due_on,project_id,updated_at')
    .eq('organization_id', organizationId)
    .eq('kind', kind)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  query = projectId ? query.eq('project_id', projectId) : query.is('project_id', null)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => mapWorkspaceItem(row as Record<string, unknown>))
}

export async function saveWorkspaceItem(item: Omit<WorkspaceItem, 'id' | 'updatedAt'> & { id?: string }): Promise<WorkspaceItem> {
  if (!isSupabaseConfigured) {
    const key = workspaceKey(item.kind, item.projectId)
    const current = loadLocal<WorkspaceItem[]>(key, [])
    const next: WorkspaceItem = { ...item, id: item.id ?? makeId('item'), updatedAt: new Date().toISOString() }
    saveLocal(key, item.id ? current.map((row) => row.id === item.id ? next : row) : [next, ...current])
    return next
  }
  const client = assertSupabase()
  const organizationId = await resolveOrganizationId()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('No hay una sesión autenticada.')
  const payload = {
    organization_id: organizationId,
    kind: item.kind,
    title: item.title,
    description: item.description,
    status: item.status,
    owner_name: item.owner,
    due_on: item.dueDate || null,
    project_id: item.projectId || null,
  }
  const request = item.id
    ? client.from('workspace_items').update(payload).eq('id', item.id)
    : client.from('workspace_items').insert({ ...payload, created_by: user.id })
  const { data, error } = await request.select('id,kind,title,description,status,owner_name,due_on,project_id,updated_at').single()
  if (error) throw error
  return mapWorkspaceItem(data as Record<string, unknown>)
}

export async function removeWorkspaceItem(item: WorkspaceItem): Promise<void> {
  if (!isSupabaseConfigured) {
    const key = workspaceKey(item.kind, item.projectId)
    const current = loadLocal<WorkspaceItem[]>(key, [])
    saveLocal(key, current.filter((row) => row.id !== item.id))
    return
  }
  const { error } = await assertSupabase().from('workspace_items').update({ deleted_at: new Date().toISOString() }).eq('id', item.id)
  if (error) throw error
}

export async function getCurrentProfile(): Promise<UserProfile> {
  if (!isSupabaseConfigured) return { id: 'demo-user', displayName: 'Usuario de demostración', email: 'demo@example.invalid' }
  const client = assertSupabase()
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) throw userError ?? new Error('No hay una sesión autenticada.')
  const { data, error } = await client.from('profiles').select('display_name').eq('id', user.id).single()
  if (error) throw error
  return { id: user.id, displayName: String(data.display_name), email: user.email ?? '' }
}

export async function listNotifications(): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) return []
  const client = assertSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return []
  const { data, error } = await client
    .from('notifications')
    .select('id,title,body,action_url,read_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ''),
    actionUrl: row.action_url ? String(row.action_url) : undefined,
    readAt: row.read_at ? String(row.read_at) : undefined,
    createdAt: String(row.created_at),
  }))
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error } = await assertSupabase().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function getAdminDashboard(): Promise<DashboardSummary> {
  if (!isSupabaseConfigured) {
    return {
      activeProjects: demoProjects.length,
      averageProgress: Math.round(demoProjects.reduce((total, project) => total + project.progress, 0) / demoProjects.length),
      mentorHours: demoProjects.reduce((total, project) => total + project.hours, 0),
      pendingDeliverables: 0,
      atRiskProjects: demoProjects.filter((project) => project.status === 'En riesgo').map((project) => ({ id: project.id, name: project.name, progress: project.progress })),
      upcomingEvents: [],
      recentActivity: [],
    }
  }
  const client = assertSupabase()
  const organizationId = await resolveOrganizationId()
  const [projects, sessions, submissions, events, audit] = await Promise.all([
    client.from('projects').select('id,name,status,progress').eq('organization_id', organizationId).is('deleted_at', null),
    client.from('sessions').select('actual_minutes').eq('organization_id', organizationId).not('actual_minutes', 'is', null),
    client.from('task_submissions').select('id,status').eq('organization_id', organizationId).in('status', ['submitted', 'under_review', 'changes_requested', 'overdue']),
    client.from('events').select('id,title,starts_at,location').eq('organization_id', organizationId).gte('starts_at', new Date().toISOString()).order('starts_at').limit(5),
    client.from('audit_logs').select('id,action,entity_type,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(5),
  ])
  for (const result of [projects, sessions, submissions, events, audit]) if (result.error) throw result.error
  const projectRows = projects.data ?? []
  const averageProgress = projectRows.length
    ? Math.round(projectRows.reduce((total, project) => total + Number(project.progress ?? 0), 0) / projectRows.length)
    : 0
  return {
    activeProjects: projectRows.length,
    averageProgress,
    mentorHours: Math.round((sessions.data ?? []).reduce((total, session) => total + Number(session.actual_minutes ?? 0), 0) / 60),
    pendingDeliverables: submissions.data?.length ?? 0,
    atRiskProjects: projectRows.filter((project) => project.status === 'at_risk').map((project) => ({ id: String(project.id), name: String(project.name), progress: Number(project.progress ?? 0) })),
    upcomingEvents: (events.data ?? []).map((event) => ({ id: String(event.id), title: String(event.title), startsAt: String(event.starts_at), location: String(event.location ?? 'Online') })),
    recentActivity: (audit.data ?? []).map((item) => ({ id: String(item.id), title: String(item.action), detail: String(item.entity_type), createdAt: String(item.created_at) })),
  }
}

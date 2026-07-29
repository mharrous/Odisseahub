import { initialPrograms, projects as demoProjects } from '../data/demo'
import type { Program, Project, WorkspaceItem } from '../types/domain'
import { isSupabaseConfigured, supabase } from './supabase'
import { loadLocal, makeId, saveLocal } from './storage'

export const ODISSEA_ORGANIZATION_ID = '10000000-0000-0000-0000-000000000001'

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

const demoProjectByName = new Map(demoProjects.map((project) => [project.name, project]))

function assertSupabase() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function mapProgram(row: Record<string, unknown>): Program {
  return {
    id: String(row.id),
    name: String(row.name),
    entity: 'Cámara de Comercio de Ceuta',
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
  if (!isSupabaseConfigured) return loadLocal<Program[]>('odissea-programs', initialPrograms)
  const client = assertSupabase()
  const { data, error } = await client
    .from('programs')
    .select('id,name,status,places,starts_on,ends_on,color')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => mapProgram(row as Record<string, unknown>))
}

export async function createProgram(input: Omit<Program, 'id' | 'entity' | 'projects' | 'progress' | 'status' | 'color'>): Promise<Program> {
  if (!isSupabaseConfigured) {
    const current = loadLocal<Program[]>('odissea-programs', initialPrograms)
    const next: Program = {
      id: makeId('program'),
      entity: 'Cámara de Comercio de Ceuta',
      projects: 0,
      progress: 0,
      status: 'Borrador',
      color: '#13B8A6',
      ...input,
    }
    saveLocal('odissea-programs', [...current, next])
    return next
  }
  const client = assertSupabase()
  const { data, error } = await client.from('programs').insert({
    organization_id: ODISSEA_ORGANIZATION_ID,
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
    const current = loadLocal<Program[]>('odissea-programs', initialPrograms)
    const updated = current.map((item) => item.id === program.id ? program : item)
    saveLocal('odissea-programs', updated)
    return program
  }
  const client = assertSupabase()
  const { data, error } = await client.from('programs').update({
    name: program.name,
    status: programStatusToDb[program.status],
    places: program.places,
    starts_on: program.startDate || null,
    ends_on: program.endDate || null,
    color: program.color,
  }).eq('id', program.id).select('id,name,status,places,starts_on,ends_on,color').single()
  if (error) throw error
  return mapProgram(data as Record<string, unknown>)
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
    const current = loadLocal<Program[]>('odissea-programs', initialPrograms)
    saveLocal('odissea-programs', current.filter((item) => item.id !== id))
    return
  }
  const client = assertSupabase()
  const { error } = await client.from('programs').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

function mapProject(row: Record<string, unknown>): Project {
  const demo = demoProjectByName.get(String(row.name))
  return {
    id: String(row.id),
    name: String(row.name),
    sector: String(row.sector ?? 'Sin sector'),
    phase: maturityLabels[String(row.maturity_stage)] ?? demo?.phase ?? 'Incubación',
    status: String(row.status) === 'at_risk' ? 'En riesgo' : Number(row.progress ?? 0) >= 70 ? 'Al día' : 'En marcha',
    progress: Number(row.progress ?? 0),
    mentor: demo?.mentor ?? 'Sin asignar',
    lead: demo?.lead ?? 'Equipo del proyecto',
    nextMilestone: demo?.nextMilestone ?? 'Definir próximo hito',
    hours: demo?.hours ?? 0,
  }
}

export async function listProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) return demoProjects
  const client = assertSupabase()
  const { data, error } = await client
    .from('projects')
    .select('id,name,sector,status,maturity_stage,progress')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return (data ?? []).map((row) => mapProject(row as Record<string, unknown>))
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured) return demoProjects.find((item) => item.id === id) ?? null
  const client = assertSupabase()
  const { data, error } = await client
    .from('projects')
    .select('id,name,sector,status,maturity_stage,progress')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  return data ? mapProject(data as Record<string, unknown>) : null
}

function workspaceKey(kind: string, projectId?: string) {
  return `odissea-workspace-${kind}-${projectId ?? 'organization'}`
}

function mapWorkspaceItem(row: Record<string, unknown>): WorkspaceItem {
  return {
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    description: String(row.description ?? ''),
    status: (String(row.status ?? 'Disponible') as WorkspaceItem['status']),
    owner: String(row.owner_name ?? 'Coordinación ODISSEA'),
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
  const client = assertSupabase()
  let query = client
    .from('workspace_items')
    .select('id,kind,title,description,status,owner_name,due_on,project_id,updated_at')
    .eq('organization_id', ODISSEA_ORGANIZATION_ID)
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
    const next: WorkspaceItem = {
      ...item,
      id: item.id ?? makeId('item'),
      updatedAt: new Date().toISOString(),
    }
    saveLocal(key, item.id ? current.map((row) => row.id === item.id ? next : row) : [next, ...current])
    return next
  }
  const client = assertSupabase()
  const { data: { user } } = await client.auth.getUser()
  const payload = {
    organization_id: ODISSEA_ORGANIZATION_ID,
    kind: item.kind,
    title: item.title,
    description: item.description,
    status: item.status,
    owner_name: item.owner,
    due_on: item.dueDate || null,
    project_id: item.projectId || null,
    created_by: user?.id ?? null,
  }
  const request = item.id
    ? client.from('workspace_items').update(payload).eq('id', item.id)
    : client.from('workspace_items').insert(payload)
  const { data, error } = await request
    .select('id,kind,title,description,status,owner_name,due_on,project_id,updated_at')
    .single()
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
  const client = assertSupabase()
  const { error } = await client.from('workspace_items').update({ deleted_at: new Date().toISOString() }).eq('id', item.id)
  if (error) throw error
}

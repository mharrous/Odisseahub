import type { WorkspaceItem } from '../types/domain'
import { supabase } from './supabase'
import { resolveOrganizationId } from './tenant'

export const domainBackedKinds = new Set([
  'convocatorias', 'candidaturas', 'evaluaciones', 'cohortes', 'mentores',
  'itinerarios', 'eventos', 'indicadores', 'documentos', 'informes',
  'usuarios', 'configuracion', 'auditoria',
])

function item(
  id: unknown,
  kind: string,
  title: unknown,
  description: unknown,
  status: WorkspaceItem['status'],
  owner: unknown,
  updatedAt: unknown,
  dueDate?: unknown,
): WorkspaceItem {
  return {
    id: String(id),
    kind,
    title: String(title),
    description: String(description ?? ''),
    status,
    owner: String(owner ?? 'Sistema'),
    updatedAt: String(updatedAt ?? new Date().toISOString()),
    dueDate: dueDate ? String(dueDate).slice(0, 10) : undefined,
  }
}

export async function listDomainItems(kind: string): Promise<WorkspaceItem[]> {
  if (!supabase) return []
  const organizationId = await resolveOrganizationId()

  if (kind === 'convocatorias') {
    const { data, error } = await supabase.from('calls').select('id,name,description,status,closes_at,contact_email,updated_at').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.name, row.description, ['published', 'active'].includes(row.status) ? 'En curso' : row.status === 'completed' ? 'Completado' : 'Disponible', row.contact_email, row.updated_at, row.closes_at))
  }
  if (kind === 'candidaturas') {
    const { data, error } = await supabase.from('applications').select('id,registration_number,project_name,contact_name,contact_email,status,updated_at,submitted_at').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.registration_number ? `${row.registration_number} · ${row.project_name}` : row.project_name, `${row.contact_name ?? ''} · ${row.contact_email ?? ''}`, row.status === 'submitted' || row.status === 'under_evaluation' ? 'En curso' : ['selected', 'admitted'].includes(row.status) ? 'Completado' : 'Disponible', row.contact_name, row.updated_at, row.submitted_at))
  }
  if (kind === 'evaluaciones') {
    const { data, error } = await supabase.from('evaluations').select('id,total_score,finalized_at,updated_at,evaluator_assignments(applications(project_name,registration_number))').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => {
      const assignment = row.evaluator_assignments as unknown as { applications?: { project_name?: string; registration_number?: string } } | null
      const application = assignment?.applications
      return item(row.id, kind, application?.registration_number ? `${application.registration_number} · ${application.project_name}` : application?.project_name ?? 'Evaluación', row.total_score == null ? 'Pendiente de puntuación' : `${row.total_score} puntos`, row.finalized_at ? 'Completado' : 'En curso', 'Evaluador asignado', row.updated_at)
    })
  }
  if (kind === 'cohortes') {
    const { data, error } = await supabase.from('cohorts').select('id,name,status,starts_on,ends_on,updated_at').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.name, `${row.starts_on ?? 'Sin inicio'} — ${row.ends_on ?? 'Sin fin'}`, row.status === 'active' ? 'En curso' : row.status === 'completed' ? 'Completado' : 'Disponible', 'Coordinación', row.updated_at, row.ends_on))
  }
  if (kind === 'mentores') {
    const { data, error } = await supabase.from('mentors').select('id,full_name,modality,status,updated_at').eq('organization_id', organizationId).order('full_name')
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.full_name, `Modalidad: ${row.modality ?? 'sin especificar'}`, row.status === 'active' ? 'Disponible' : 'Archivado', row.full_name, row.updated_at))
  }
  if (kind === 'itinerarios') {
    const { data, error } = await supabase.from('itineraries').select('id,name,is_template,updated_at').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.name, row.is_template ? 'Plantilla reutilizable' : 'Itinerario de programa', 'Disponible', 'Coordinación', row.updated_at))
  }
  if (kind === 'eventos') {
    const { data, error } = await supabase.from('events').select('id,title,event_type,starts_at,location,updated_at').eq('organization_id', organizationId).order('starts_at')
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.title, `${row.event_type} · ${row.location ?? 'Online'}`, new Date(row.starts_at).getTime() < Date.now() ? 'Completado' : 'Disponible', 'Coordinación', row.updated_at, row.starts_at))
  }
  if (kind === 'indicadores') {
    const { data, error } = await supabase.from('indicators').select('id,code,name,unit,target_value,frequency,updated_at').eq('organization_id', organizationId).order('code')
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, `${row.code} · ${row.name}`, `Objetivo: ${JSON.stringify(row.target_value)} ${row.unit ?? ''} · ${row.frequency ?? ''}`, 'En curso', 'Seguimiento', row.updated_at))
  }
  if (kind === 'documentos') {
    const { data, error } = await supabase.from('documents').select('id,title,description,category,visibility,uploaded_by,updated_at').eq('organization_id', organizationId).is('deleted_at', null).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.title, `${row.category ?? 'Documento'} · ${row.visibility}`, 'Disponible', row.uploaded_by ?? 'Sistema', row.updated_at))
  }
  if (kind === 'informes') {
    const { data, error } = await supabase.from('report_exports').select('id,report_type,format,generated_by,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, `${row.report_type} · ${row.format}`, 'Exportación generada', 'Completado', row.generated_by ?? 'Sistema', row.created_at))
  }
  if (kind === 'usuarios') {
    const { data, error } = await supabase.from('organization_members').select('id,status,updated_at,profiles(display_name),roles(name)').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { display_name?: string } | null
      const role = row.roles as unknown as { name?: string } | null
      return item(row.id, kind, profile?.display_name ?? 'Usuario', role?.name ?? 'Sin rol', row.status === 'active' ? 'Disponible' : row.status === 'suspended' ? 'Archivado' : 'En curso', role?.name ?? 'Sistema', row.updated_at)
    })
  }
  if (kind === 'configuracion') {
    const { data, error } = await supabase.from('organization_settings').select('organization_id,contact_email,primary_color,secondary_color,ai_enabled,updated_at').eq('organization_id', organizationId).single()
    if (error) throw error
    return [item(data.organization_id, kind, 'Configuración de la organización', `Contacto: ${data.contact_email ?? 'sin definir'} · IA: ${data.ai_enabled ? 'activa' : 'desactivada'} · Colores: ${data.primary_color} / ${data.secondary_color}`, 'Disponible', 'Administración', data.updated_at)]
  }
  if (kind === 'auditoria') {
    const { data, error } = await supabase.from('audit_logs').select('id,action,entity_type,entity_id,user_id,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.action, `${row.entity_type}${row.entity_id ? ` · ${row.entity_id}` : ''}`, 'Completado', row.user_id ?? 'Sistema', row.created_at))
  }
  return []
}

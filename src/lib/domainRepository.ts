import type { WorkspaceItem } from '../types/domain'
import { supabase } from './supabase'
import { resolveOrganizationId } from './tenant'

export const domainBackedKinds = new Set([
  'convocatorias', 'candidaturas', 'evaluaciones', 'cohortes', 'mentores',
  'itinerarios', 'eventos', 'indicadores', 'documentos', 'informes',
  'usuarios', 'configuracion', 'auditoria',
])

export type DomainValues = Record<string, string | boolean>
export interface DomainOption { value: string; label: string }
export type DomainOptions = Record<string, DomainOption[]>

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function item(
  id: unknown,
  kind: string,
  title: unknown,
  description: unknown,
  status: WorkspaceItem['status'],
  owner: unknown,
  updatedAt: unknown,
  dueDate?: unknown,
  metadata?: Record<string, unknown>,
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
    metadata,
  }
}

function toLocalDateTime(value: unknown) {
  return value ? String(value).slice(0, 16) : ''
}

function rowMetadata(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    key.endsWith('_at') && value ? toLocalDateTime(value) : value,
  ]))
}

export async function listDomainItems(kind: string): Promise<WorkspaceItem[]> {
  const db = client()
  const organizationId = await resolveOrganizationId()

  if (kind === 'convocatorias') {
    const { data, error } = await db.from('calls').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.name, row.description, ['published', 'active'].includes(row.status) ? 'En curso' : row.status === 'completed' ? 'Completado' : row.status === 'archived' ? 'Archivado' : 'Disponible', row.contact_email, row.updated_at, row.closes_at, rowMetadata(row)))
  }
  if (kind === 'candidaturas') {
    const { data, error } = await db.from('applications').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.registration_number ? `${row.registration_number} · ${row.project_name}` : row.project_name, `${row.contact_name ?? ''} · ${row.contact_email ?? ''}`, ['submitted', 'documentation_pending', 'under_evaluation'].includes(row.status) ? 'En curso' : ['selected', 'admitted'].includes(row.status) ? 'Completado' : ['rejected', 'not_admitted', 'withdrawn'].includes(row.status) ? 'Archivado' : 'Disponible', row.contact_name, row.updated_at, row.submitted_at, rowMetadata(row)))
  }
  if (kind === 'evaluaciones') {
    const { data, error } = await db.from('evaluations').select('*,evaluator_assignments(application_id,evaluator_id,applications(project_name,registration_number))').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => {
      const assignment = row.evaluator_assignments as unknown as { application_id?: string; evaluator_id?: string; applications?: { project_name?: string; registration_number?: string } } | null
      const application = assignment?.applications
      return item(row.id, kind, application?.registration_number ? `${application.registration_number} · ${application.project_name}` : application?.project_name ?? 'Evaluación', row.total_score == null ? 'Pendiente de puntuación' : `${row.total_score} puntos`, row.finalized_at ? 'Completado' : 'En curso', 'Evaluador asignado', row.updated_at, undefined, rowMetadata({ ...row, application_id: assignment?.application_id, evaluator_id: assignment?.evaluator_id }))
    })
  }
  if (kind === 'cohortes') {
    const { data, error } = await db.from('cohorts').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.name, `${row.starts_on ?? 'Sin inicio'} — ${row.ends_on ?? 'Sin fin'}`, row.status === 'active' ? 'En curso' : row.status === 'completed' ? 'Completado' : row.status === 'archived' ? 'Archivado' : 'Disponible', 'Coordinación', row.updated_at, row.ends_on, rowMetadata(row)))
  }
  if (kind === 'mentores') {
    const { data, error } = await db.from('mentors').select('*').eq('organization_id', organizationId).order('full_name')
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.full_name, `Modalidad: ${row.modality ?? 'sin especificar'}`, row.status === 'active' ? 'Disponible' : 'Archivado', row.full_name, row.updated_at, undefined, rowMetadata({ ...row, languages: (row.languages ?? []).join(', ') })))
  }
  if (kind === 'itinerarios') {
    const { data, error } = await db.from('itineraries').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.name, row.is_template ? 'Plantilla reutilizable' : 'Itinerario de programa', 'Disponible', 'Coordinación', row.updated_at, undefined, rowMetadata(row)))
  }
  if (kind === 'eventos') {
    const { data, error } = await db.from('events').select('*').eq('organization_id', organizationId).order('starts_at')
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.title, `${row.event_type} · ${row.location ?? 'Online'}`, new Date(row.starts_at).getTime() < Date.now() ? 'Completado' : 'Disponible', 'Coordinación', row.updated_at, row.starts_at, rowMetadata(row)))
  }
  if (kind === 'indicadores') {
    const { data, error } = await db.from('indicators').select('*').eq('organization_id', organizationId).order('code')
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, `${row.code} · ${row.name}`, `Objetivo: ${String(row.target_value ?? '')} ${row.unit ?? ''} · ${row.frequency ?? ''}`, 'En curso', 'Seguimiento', row.updated_at, undefined, rowMetadata({ ...row, target_value: typeof row.target_value === 'string' ? row.target_value : JSON.stringify(row.target_value) })))
  }
  if (kind === 'documentos') {
    const { data, error } = await db.from('documents').select('*').eq('organization_id', organizationId).is('deleted_at', null).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.title, `${row.category ?? 'Documento'} · ${row.visibility}`, 'Disponible', row.uploaded_by ?? 'Sistema', row.updated_at, undefined, rowMetadata(row)))
  }
  if (kind === 'informes') {
    const { data, error } = await db.from('report_exports').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, `${row.report_type} · ${String(row.format).toUpperCase()}`, row.storage_path ? 'Archivo disponible para descarga' : 'Exportación registrada', 'Completado', row.generated_by ?? 'Sistema', row.created_at, undefined, rowMetadata(row)))
  }
  if (kind === 'usuarios') {
    const { data, error } = await db.from('organization_members').select('id,user_id,role_id,status,updated_at,profiles(display_name),roles(name,code)').eq('organization_id', organizationId).order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { display_name?: string } | null
      const role = row.roles as unknown as { name?: string; code?: string } | null
      return item(row.id, kind, profile?.display_name ?? 'Usuario', role?.name ?? 'Sin rol', row.status === 'active' ? 'Disponible' : row.status === 'suspended' ? 'Archivado' : 'En curso', role?.name ?? 'Sistema', row.updated_at, undefined, rowMetadata({ ...row, role_code: role?.code }))
    })
  }
  if (kind === 'configuracion') {
    const { data, error } = await db.from('organization_settings').select('*').eq('organization_id', organizationId).single()
    if (error) throw error
    return [item(data.organization_id, kind, 'Configuración de la organización', `Contacto: ${data.contact_email ?? 'sin definir'} · IA: ${data.ai_enabled ? 'activa' : 'desactivada'} · Colores: ${data.primary_color} / ${data.secondary_color}`, 'Disponible', 'Administración', data.updated_at, undefined, rowMetadata(data))]
  }
  if (kind === 'auditoria') {
    const { data, error } = await db.from('audit_logs').select('id,action,entity_type,entity_id,user_id,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return (data ?? []).map((row) => item(row.id, kind, row.action, `${row.entity_type}${row.entity_id ? ` · ${row.entity_id}` : ''}`, 'Completado', row.user_id ?? 'Sistema', row.created_at))
  }
  return []
}

export async function listDomainOptions(): Promise<DomainOptions> {
  const db = client()
  const organizationId = await resolveOrganizationId()
  const [programs, calls, applications, rubrics, members, roles, projects] = await Promise.all([
    db.from('programs').select('id,name').eq('organization_id', organizationId).is('deleted_at', null).order('name'),
    db.from('calls').select('id,name').eq('organization_id', organizationId).order('name'),
    db.from('applications').select('id,registration_number,project_name').eq('organization_id', organizationId).neq('status', 'draft').order('project_name'),
    db.from('evaluation_rubrics').select('id,name').eq('organization_id', organizationId).order('name'),
    db.from('organization_members').select('user_id,profiles(display_name),roles(code)').eq('organization_id', organizationId).eq('status', 'active'),
    db.from('roles').select('id,name,code').eq('organization_id', organizationId).order('name'),
    db.from('projects').select('id,name').eq('organization_id', organizationId).is('deleted_at', null).order('name'),
  ])
  for (const result of [programs, calls, applications, rubrics, members, roles, projects]) if (result.error) throw result.error
  const evaluators = (members.data ?? []).filter((member) => {
    const role = member.roles as unknown as { code?: string } | null
    return role?.code === 'evaluator'
  }).map((member) => {
    const profile = member.profiles as unknown as { display_name?: string } | null
    return { value: String(member.user_id), label: profile?.display_name ?? 'Evaluador' }
  })
  return {
    programs: (programs.data ?? []).map((row) => ({ value: String(row.id), label: String(row.name) })),
    calls: (calls.data ?? []).map((row) => ({ value: String(row.id), label: String(row.name) })),
    applications: (applications.data ?? []).map((row) => ({ value: String(row.id), label: `${row.registration_number ?? 'Sin registro'} · ${row.project_name}` })),
    rubrics: (rubrics.data ?? []).map((row) => ({ value: String(row.id), label: String(row.name) })),
    evaluators,
    roles: (roles.data ?? []).map((row) => ({ value: String(row.id), label: String(row.name) })),
    projects: (projects.data ?? []).map((row) => ({ value: String(row.id), label: String(row.name) })),
  }
}

async function currentUserId() {
  const { data: { user }, error } = await client().auth.getUser()
  if (error || !user) throw error ?? new Error('No hay una sesión autenticada.')
  return user.id
}

function nullable(value: string | boolean | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberOrNull(value: string | boolean | undefined) {
  if (typeof value !== 'string' || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error('Introduce un valor numérico válido.')
  return parsed
}

function ensureChronology(start: string | boolean | undefined, end: string | boolean | undefined, message: string) {
  if (typeof start !== 'string' || typeof end !== 'string' || !start || !end) return
  if (new Date(end).getTime() < new Date(start).getTime()) throw new Error(message)
}

function indicatorTargetValue(values: DomainValues) {
  const raw = typeof values.target_value === 'string' ? values.target_value.trim() : ''
  if (!raw) return null
  if (values.data_type === 'text') return raw
  const parsed = Number(raw.replace(',', '.'))
  if (!Number.isFinite(parsed)) throw new Error('El valor objetivo debe ser numérico para el tipo seleccionado.')
  return parsed
}

export async function saveDomainItem(kind: string, id: string | undefined, values: DomainValues, file?: File): Promise<void> {
  const db = client()
  const organizationId = await resolveOrganizationId()
  const userId = await currentUserId()

  if (kind === 'convocatorias') {
    ensureChronology(values.opens_at, values.closes_at, 'La fecha de cierre no puede ser anterior a la apertura.')
    const payload = { organization_id: organizationId, program_id: values.program_id, name: values.name, slug: values.slug, description: nullable(values.description), opens_at: nullable(values.opens_at), closes_at: nullable(values.closes_at), places: Number(values.places || 0), status: values.status || 'draft', privacy_text: nullable(values.privacy_text), contact_email: nullable(values.contact_email) }
    const { error } = id ? await db.from('calls').update(payload).eq('id', id) : await db.from('calls').insert({ ...payload, created_by: userId })
    if (error) throw error
    return
  }
  if (kind === 'candidaturas') {
    if (!id) throw new Error('Las candidaturas se crean desde la convocatoria pública.')
    const { error } = await db.from('applications').update({ status: values.status }).eq('id', id)
    if (error) throw error
    return
  }
  if (kind === 'evaluaciones') {
    if (id) {
      const { error } = await db.from('evaluations').update({ rubric_id: values.rubric_id, private_comments: nullable(values.private_comments), shared_comments: nullable(values.shared_comments), total_score: numberOrNull(values.total_score), finalized_at: values.finalized ? new Date().toISOString() : null }).eq('id', id)
      if (error) throw error
      return
    }
    const { data: assignment, error: assignmentError } = await db.from('evaluator_assignments').upsert({ organization_id: organizationId, application_id: values.application_id, evaluator_id: values.evaluator_id }, { onConflict: 'application_id,evaluator_id' }).select('id').single()
    if (assignmentError) throw assignmentError
    const { error } = await db.from('evaluations').insert({ organization_id: organizationId, assignment_id: assignment.id, rubric_id: values.rubric_id, private_comments: nullable(values.private_comments), shared_comments: nullable(values.shared_comments), total_score: numberOrNull(values.total_score) })
    if (error) throw error
    const { error: applicationError } = await db.from('applications').update({ status: 'under_evaluation' }).eq('id', values.application_id)
    if (applicationError) throw applicationError
    return
  }
  if (kind === 'cohortes') {
    ensureChronology(values.starts_on, values.ends_on, 'La fecha de fin no puede ser anterior al inicio.')
    const payload = { organization_id: organizationId, program_id: values.program_id, call_id: nullable(values.call_id), name: values.name, starts_on: nullable(values.starts_on), ends_on: nullable(values.ends_on), status: values.status || 'planned' }
    const { error } = id ? await db.from('cohorts').update(payload).eq('id', id) : await db.from('cohorts').insert(payload)
    if (error) throw error
    return
  }
  if (kind === 'mentores') {
    const payload = { organization_id: organizationId, full_name: values.full_name, biography: nullable(values.biography), languages: String(values.languages ?? '').split(',').map((value) => value.trim()).filter(Boolean), modality: nullable(values.modality), linkedin_url: nullable(values.linkedin_url), internal_rate: numberOrNull(values.internal_rate), status: values.status || 'active' }
    const { error } = id ? await db.from('mentors').update(payload).eq('id', id) : await db.from('mentors').insert(payload)
    if (error) throw error
    return
  }
  if (kind === 'itinerarios') {
    const payload = { organization_id: organizationId, program_id: nullable(values.program_id), name: values.name, is_template: Boolean(values.is_template) }
    const { error } = id ? await db.from('itineraries').update(payload).eq('id', id) : await db.from('itineraries').insert(payload)
    if (error) throw error
    return
  }
  if (kind === 'eventos') {
    ensureChronology(values.starts_at, values.ends_at, 'La fecha de fin no puede ser anterior al inicio.')
    const payload = { organization_id: organizationId, program_id: nullable(values.program_id), title: values.title, event_type: values.event_type, starts_at: values.starts_at, ends_at: nullable(values.ends_at), capacity: numberOrNull(values.capacity), location: nullable(values.location), meeting_url: nullable(values.meeting_url) }
    const { error } = id ? await db.from('events').update(payload).eq('id', id) : await db.from('events').insert(payload)
    if (error) throw error
    return
  }
  if (kind === 'indicadores') {
    const payload = { organization_id: organizationId, program_id: nullable(values.program_id), project_id: nullable(values.project_id), code: values.code, name: values.name, data_type: values.data_type, unit: nullable(values.unit), target_value: indicatorTargetValue(values), source: nullable(values.source), frequency: nullable(values.frequency) }
    const { error } = id ? await db.from('indicators').update(payload).eq('id', id) : await db.from('indicators').insert(payload)
    if (error) throw error
    return
  }
  if (kind === 'documentos') {
    let documentId = id
    let createdDocument = false
    if (id) {
      const { error } = await db.from('documents').update({ title: values.title, description: nullable(values.description), category: nullable(values.category), visibility: values.visibility || 'private', entity_type: values.entity_type || 'organization', entity_id: values.entity_type === 'project' ? nullable(values.entity_id) : null, folder_path: nullable(values.folder_path) }).eq('id', id)
      if (error) throw error
    } else {
      const { data, error } = await db.from('documents').insert({ organization_id: organizationId, title: values.title, description: nullable(values.description), category: nullable(values.category), visibility: values.visibility || 'private', entity_type: values.entity_type || 'organization', entity_id: values.entity_type === 'project' ? nullable(values.entity_id) : null, folder_path: nullable(values.folder_path), uploaded_by: userId, current_version: 1 }).select('id').single()
      if (error) throw error
      documentId = String(data.id)
      createdDocument = true
    }
    if (file && documentId) {
      if (file.size > 25 * 1024 * 1024) throw new Error('El archivo supera el máximo de 25 MB.')
      const { count, error: countError } = await db.from('document_versions').select('id', { count: 'exact', head: true }).eq('document_id', documentId)
      if (countError) throw countError
      const version = (count ?? 0) + 1
      const safeName = file.name.normalize('NFKD').replace(/[^\w.-]+/g, '-')
      const path = `${organizationId}/documents/${documentId}/${version}-${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await db.storage.from('documents').upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) {
        if (createdDocument) await db.from('documents').delete().eq('id', documentId)
        throw uploadError
      }
      const { error: versionError } = await db.from('document_versions').insert({ organization_id: organizationId, document_id: documentId, version_number: version, storage_path: path, original_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: userId })
      if (versionError) {
        await db.storage.from('documents').remove([path])
        if (createdDocument) await db.from('documents').delete().eq('id', documentId)
        throw versionError
      }
      const { error: versionUpdateError } = await db.from('documents').update({ current_version: version }).eq('id', documentId)
      if (versionUpdateError) throw versionUpdateError
    }
    return
  }
  if (kind === 'informes') {
    const reportType = String(values.report_type || 'Informe general')
    const format = String(values.format || 'csv')
    const { data: projects, error: projectError } = await db.from('projects').select('name,sector,status,maturity_stage,progress,updated_at').eq('organization_id', organizationId).is('deleted_at', null).order('name')
    if (projectError) throw projectError
    const content = format === 'json'
      ? JSON.stringify(projects ?? [], null, 2)
      : ['Proyecto,Sector,Estado,Fase,Progreso,Actualización', ...(projects ?? []).map((row) => [row.name, row.sector, row.status, row.maturity_stage, row.progress, row.updated_at].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
    const mimeType = format === 'json' ? 'application/json' : 'text/csv'
    const path = `${organizationId}/reports/${Date.now()}-${crypto.randomUUID()}.${format}`
    const { error: uploadError } = await db.storage.from('documents').upload(path, new Blob([content], { type: mimeType }), { contentType: mimeType })
    if (uploadError) throw uploadError
    const { error } = await db.from('report_exports').insert({ organization_id: organizationId, report_type: reportType, format, filters: { scope: values.scope || 'projects' }, storage_path: path, generated_by: userId })
    if (error) {
      await db.storage.from('documents').remove([path])
      throw error
    }
    return
  }
  if (kind === 'usuarios') {
    if (id) {
      const { error } = await db.from('organization_members').update({ role_id: values.role_id, status: values.status }).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await db.functions.invoke('invite-user', { body: { email: values.email, displayName: values.display_name, roleId: values.role_id, organizationId } })
      if (error) throw error
    }
    return
  }
  if (kind === 'configuracion') {
    const { error } = await db.from('organization_settings').update({ contact_email: nullable(values.contact_email), primary_color: values.primary_color, secondary_color: values.secondary_color, legal_notice: nullable(values.legal_notice), privacy_policy: nullable(values.privacy_policy), email_sender_name: nullable(values.email_sender_name), ai_enabled: Boolean(values.ai_enabled), retention_days: numberOrNull(values.retention_days) }).eq('organization_id', organizationId)
    if (error) throw error
    return
  }
  throw new Error(`El módulo ${kind} no admite esta operación.`)
}

export async function removeDomainItem(kind: string, row: WorkspaceItem): Promise<void> {
  const db = client()
  if (kind === 'convocatorias') {
    const { error } = await db.from('calls').update({ status: 'archived' }).eq('id', row.id)
    if (error) throw error
    return
  }
  if (kind === 'candidaturas') throw new Error('Las candidaturas no se eliminan; cambia su estado a retirada o rechazada.')
  if (kind === 'cohortes') {
    const { error } = await db.from('cohorts').update({ status: 'archived' }).eq('id', row.id)
    if (error) throw error
    return
  }
  if (kind === 'mentores') {
    const { error } = await db.from('mentors').update({ status: 'inactive' }).eq('id', row.id)
    if (error) throw error
    return
  }
  if (kind === 'documentos') {
    const { error } = await db.from('documents').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (error) throw error
    return
  }
  if (kind === 'usuarios') {
    const { error } = await db.from('organization_members').update({ status: 'suspended' }).eq('id', row.id)
    if (error) throw error
    return
  }
  if (kind === 'configuracion' || kind === 'auditoria') throw new Error('Este registro no se puede eliminar.')
  const tables: Record<string, string> = { evaluaciones: 'evaluations', itinerarios: 'itineraries', eventos: 'events', indicadores: 'indicators', informes: 'report_exports' }
  const table = tables[kind]
  if (!table) throw new Error(`El módulo ${kind} no admite eliminación.`)
  const { error } = await db.from(table).delete().eq('id', row.id)
  if (error) throw error
  if (kind === 'informes' && row.metadata?.storage_path) {
    const { error: storageError } = await db.storage.from('documents').remove([String(row.metadata.storage_path)])
    if (storageError) throw new Error('El informe se eliminó del registro, pero no se pudo limpiar su archivo.')
  }
}

export async function getDomainDownloadUrl(row: WorkspaceItem): Promise<string> {
  const db = client()
  let path = row.metadata?.storage_path ? String(row.metadata.storage_path) : ''
  if (row.kind === 'documentos') {
    const { data, error } = await db.from('document_versions').select('storage_path').eq('document_id', row.id).order('version_number', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    path = data?.storage_path ?? ''
  }
  if (!path) throw new Error('Este registro todavía no tiene un archivo disponible.')
  const { data, error } = await db.storage.from('documents').createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}

import type { ApplicationDraft, PublicCall, SubmittedApplication } from '../types/domain'
import { isSupabaseConfigured, supabase } from './supabase'

const remoteDraftKey = 'mentoria-remote-application-id'
const applicationBucket = 'application-files'

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.')
  return supabase
}

function mapCall(row: Record<string, unknown>): PublicCall {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    opensAt: row.opens_at ? String(row.opens_at) : undefined,
    closesAt: row.closes_at ? String(row.closes_at) : undefined,
    places: Number(row.places ?? 0),
    status: String(row.status) === 'active' ? 'active' : 'published',
    privacyText: String(row.privacy_text ?? ''),
    contactEmail: String(row.contact_email ?? ''),
  }
}

export async function listPublicCalls(): Promise<PublicCall[]> {
  if (!isSupabaseConfigured) {
    return [{
      id: 'demo-call',
      organizationId: 'demo-organization',
      slug: 'primera-mentoria',
      name: 'Primera convocatoria Mentoría',
      description: 'Programa de incubación y consolidación para proyectos tecnológicos.',
      closesAt: '2026-09-30T21:59:59.000Z',
      places: 8,
      status: 'published',
      privacyText: 'Texto de demostración.',
      contactEmail: 'mentoria@example.invalid',
    }]
  }

  const { data, error } = await client()
    .from('calls')
    .select('id,organization_id,slug,name,description,opens_at,closes_at,places,status,privacy_text,contact_email')
    .in('status', ['published', 'active'])
    .order('closes_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => mapCall(row as Record<string, unknown>))
}

export async function getPublicCall(slug: string): Promise<PublicCall | null> {
  if (!isSupabaseConfigured) {
    return (await listPublicCalls()).find((item) => item.slug === slug) ?? null
  }
  const { data, error } = await client()
    .from('calls')
    .select('id,organization_id,slug,name,description,opens_at,closes_at,places,status,privacy_text,contact_email')
    .eq('slug', slug)
    .in('status', ['published', 'active'])
    .maybeSingle()
  if (error) throw error
  return data ? mapCall(data as Record<string, unknown>) : null
}

async function ensureApplicant() {
  const supabaseClient = client()
  const { data: userData, error: userError } = await supabaseClient.auth.getUser()
  if (userError && userError.name !== 'AuthSessionMissingError') throw userError
  if (userData.user) return userData.user

  const { data, error } = await supabaseClient.auth.signInAnonymously({
    options: { data: { display_name: 'Solicitante Mentoría' } },
  })
  if (error) throw new Error(`No se ha podido iniciar la candidatura: ${error.message}`)
  if (!data.user) throw new Error('No se ha podido crear la sesión segura de candidatura.')
  return data.user
}

async function findDraft(call: PublicCall, userId: string) {
  const storedId = window.localStorage.getItem(remoteDraftKey)
  let query = client()
    .from('applications')
    .select('id,project_name,contact_name,contact_email,summary,status,registration_number,submitted_at')
    .eq('call_id', call.id)
    .eq('applicant_user_id', userId)

  query = storedId ? query.eq('id', storedId) : query.eq('status', 'draft').order('updated_at', { ascending: false }).limit(1)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data as Record<string, unknown> | null
}

export async function loadRemoteApplicationDraft(call: PublicCall): Promise<ApplicationDraft | null> {
  if (!isSupabaseConfigured) return null
  const user = await ensureApplicant()
  const row = await findDraft(call, user.id)
  if (!row || String(row.status) !== 'draft') return null

  const { data: files, error: fileError } = await client()
    .from('application_files')
    .select('original_name')
    .eq('application_id', String(row.id))
    .limit(1)
  if (fileError) throw fileError
  window.localStorage.setItem(remoteDraftKey, String(row.id))
  return {
    projectName: String(row.project_name ?? ''),
    contactName: String(row.contact_name ?? ''),
    email: String(row.contact_email ?? ''),
    summary: String(row.summary ?? ''),
    consent: false,
    fileName: files?.[0]?.original_name ? String(files[0].original_name) : undefined,
    status: 'draft',
  }
}

async function saveApplicationRow(call: PublicCall, draft: ApplicationDraft, userId: string) {
  const existing = await findDraft(call, userId)
  const payload = {
    organization_id: call.organizationId,
    call_id: call.id,
    applicant_user_id: userId,
    project_name: draft.projectName.trim(),
    contact_name: draft.contactName.trim(),
    contact_email: draft.email.trim().toLowerCase(),
    summary: draft.summary.trim(),
    created_by: userId,
  }

  const request = existing
    ? client().from('applications').update(payload).eq('id', String(existing.id))
    : client().from('applications').insert({ ...payload, status: 'draft' })
  const { data, error } = await request.select('id').single()
  if (error) throw error
  window.localStorage.setItem(remoteDraftKey, String(data.id))
  return String(data.id)
}

function safeFileName(name: string) {
  const parts = name.split('.')
  const extension = parts.length > 1 ? `.${parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')}` : ''
  const base = parts.join('.').normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 80)
  return `${base || 'documento'}${extension}`
}

async function uploadApplicationFile(
  call: PublicCall,
  applicationId: string,
  userId: string,
  file: File,
) {
  if (file.size > 10 * 1024 * 1024) throw new Error('El documento supera el máximo de 10 MB.')
  const accepted = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!accepted.includes(file.type)) throw new Error('El documento debe ser PDF, DOC o DOCX.')

  const { data: existing, error: existingError } = await client()
    .from('application_files')
    .select('id,storage_path,original_name')
    .eq('application_id', applicationId)
  if (existingError) throw existingError
  if (existing?.some((item) => item.original_name === file.name)) return

  const path = `${userId}/${applicationId}/${crypto.randomUUID()}-${safeFileName(file.name)}`
  const { error: uploadError } = await client().storage.from(applicationBucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { error: metadataError } = await client().from('application_files').insert({
    organization_id: call.organizationId,
    application_id: applicationId,
    storage_path: path,
    original_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: userId,
  })
  if (metadataError) {
    await client().storage.from(applicationBucket).remove([path])
    throw metadataError
  }
}

export async function saveRemoteApplication(
  call: PublicCall,
  draft: ApplicationDraft,
  file?: File,
) {
  const user = await ensureApplicant()
  const applicationId = await saveApplicationRow(call, draft, user.id)
  if (file) await uploadApplicationFile(call, applicationId, user.id, file)
  return applicationId
}

export async function submitRemoteApplication(
  call: PublicCall,
  draft: ApplicationDraft,
  file?: File,
): Promise<SubmittedApplication> {
  const applicationId = await saveRemoteApplication(call, draft, file)
  const { data, error } = await client()
    .from('applications')
    .update({ status: 'submitted' })
    .eq('id', applicationId)
    .select('id,registration_number,project_name,contact_name,submitted_at')
    .single()
  if (error) throw error

  window.localStorage.removeItem(remoteDraftKey)
  return {
    id: String(data.id),
    registration: String(data.registration_number),
    projectName: String(data.project_name),
    contactName: String(data.contact_name),
    submittedAt: String(data.submitted_at),
  }
}

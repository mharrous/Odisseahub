import { isSupabaseConfigured, supabase } from './supabase'

export const DEMO_ORGANIZATION_ID = '10000000-0000-0000-0000-000000000001'

let cachedUserId = ''
let cachedOrganizationId = ''

export async function resolveOrganizationId(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return DEMO_ORGANIZATION_ID

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError ?? new Error('No hay una sesión autenticada.')
  if (cachedUserId === user.id && cachedOrganizationId) return cachedOrganizationId

  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) throw error

  cachedUserId = user.id
  cachedOrganizationId = String(data.organization_id)
  return cachedOrganizationId
}

export function clearTenantCache() {
  cachedUserId = ''
  cachedOrganizationId = ''
}

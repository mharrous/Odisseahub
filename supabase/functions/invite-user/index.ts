import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = new Set([
  'https://mentoria.pages.dev',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
])

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://mentoria.pages.dev',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function response(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) })
  if (request.method !== 'POST') return response(request, { error: 'Método no permitido.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) return response(request, { error: 'Configuración incompleta del servicio.' }, 500)

  const authorization = request.headers.get('authorization')
  if (!authorization) return response(request, { error: 'Sesión no válida.' }, 401)

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: callerData, error: callerError } = await caller.auth.getUser()
  if (callerError || !callerData.user) return response(request, { error: 'Sesión no válida.' }, 401)

  const body = await request.json().catch(() => null) as {
    email?: string
    displayName?: string
    roleId?: string
    organizationId?: string
  } | null
  const email = body?.email?.trim().toLowerCase()
  const roleId = body?.roleId?.trim()
  const organizationId = body?.organizationId?.trim()
  if (!email || !roleId || !organizationId) return response(request, { error: 'Correo, rol y organización son obligatorios.' }, 400)

  const { data: allowed, error: permissionError } = await caller.rpc('has_permission', {
    target_organization_id: organizationId,
    permission_code: 'users.manage',
  })
  if (permissionError || !allowed) return response(request, { error: 'No tienes permiso para invitar usuarios.' }, 403)

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: role, error: roleError } = await admin.from('roles').select('id').eq('id', roleId).eq('organization_id', organizationId).single()
  if (roleError || !role) return response(request, { error: 'El rol no pertenece a esta organización.' }, 400)

  let user: { id: string; email?: string } | undefined
  for (let page = 1; page <= 100; page += 1) {
    const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (listError) return response(request, { error: 'No se ha podido comprobar la cuenta.' }, 500)
    user = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user || usersPage.users.length < 1000) break
  }
  let invited = false

  if (!user) {
    const origin = request.headers.get('origin')
    const redirectTo = allowedOrigins.has(origin ?? '') ? `${origin}/restablecer-contrasena` : 'https://mentoria.pages.dev/restablecer-contrasena'
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { display_name: body?.displayName?.trim() || email.split('@')[0] },
      redirectTo,
    })
    if (error || !data.user) return response(request, { error: error?.message ?? 'No se ha podido enviar la invitación.' }, 400)
    user = data.user
    invited = true
  }

  const { error: membershipError } = await admin.from('organization_members').upsert({
    organization_id: organizationId,
    user_id: user.id,
    role_id: roleId,
    status: invited ? 'invited' : 'active',
  }, { onConflict: 'organization_id,user_id' })
  if (membershipError) return response(request, { error: membershipError.message }, 400)

  return response(request, { ok: true, invited, userId: user.id })
})

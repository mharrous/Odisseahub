/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role } from '../../types/domain'
import { loadLocal, saveLocal } from '../../lib/storage'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { clearTenantCache } from '../../lib/tenant'

const validRoles: Role[] = ['admin', 'coordinator', 'mentor', 'participant', 'evaluator']
const remoteRoleAliases: Record<string, Role> = {
  organization_admin: 'admin',
  coordinator: 'coordinator',
  mentor: 'mentor',
  participant: 'participant',
  evaluator: 'evaluator',
}

interface LoginCredentials {
  email: string
  password: string
  demoRole: Role
}

interface AuthState {
  role: Role | null
  organizationId: string | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<Role>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => (
    isSupabaseConfigured ? null : loadLocal<Role | null>('mentoria-role', null)
  ))
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadRemoteAccess = useCallback(async (): Promise<Role | null> => {
    if (!supabase) return null
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id,roles(code)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    if (error) throw error

    setOrganizationId(String(data.organization_id))
    const roleRow = data.roles as unknown as { code?: string } | null
    const remoteCode = String(roleRow?.code ?? '')
    return remoteRoleAliases[remoteCode] ?? (validRoles.includes(remoteCode as Role) ? remoteCode as Role : null)
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const refreshSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        const nextRole = session ? await loadRemoteAccess() : null
        if (active) {
          setRole(nextRole)
          if (!nextRole) setOrganizationId(null)
        }
      } catch {
        if (active) {
          setRole(null)
          setOrganizationId(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void refreshSession()
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setRole(null)
        setOrganizationId(null)
        clearTenantCache()
        setLoading(false)
        return
      }
      setLoading(true)
      window.setTimeout(() => void refreshSession(), 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadRemoteAccess])

  const login = useCallback(async ({ email, password, demoRole }: LoginCredentials) => {
    if (!supabase) {
      setRole(demoRole)
      saveLocal('mentoria-role', demoRole)
      return demoRole
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const nextRole = await loadRemoteAccess()
      if (!nextRole) {
        await supabase.auth.signOut()
        throw new Error('Tu cuenta todavía no tiene acceso asignado a Mentoría.')
      }
      setRole(nextRole)
      return nextRole
    } finally {
      setLoading(false)
    }
  }, [loadRemoteAccess])

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('mentoria-role')
    }
    clearTenantCache()
    setRole(null)
    setOrganizationId(null)
  }, [])

  const value = useMemo<AuthState>(() => ({
    role,
    organizationId,
    loading,
    login,
    logout,
  }), [loading, login, logout, organizationId, role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return value
}

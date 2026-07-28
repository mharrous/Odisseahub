/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role } from '../../types/domain'
import { loadLocal, saveLocal } from '../../lib/storage'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

const ODISSEA_ORGANIZATION_ID = '10000000-0000-0000-0000-000000000001'
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
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<Role>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => (
    isSupabaseConfigured ? null : loadLocal<Role | null>('odissea-role', null)
  ))
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadRemoteRole = useCallback(async (): Promise<Role | null> => {
    if (!supabase) return null

    const { data, error } = await supabase.rpc('current_organization_role', {
      target_organization_id: ODISSEA_ORGANIZATION_ID,
    })
    if (error) throw error
    if (typeof data !== 'string') return null
    return remoteRoleAliases[data] ?? (validRoles.includes(data as Role) ? data as Role : null)
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) return

    let active = true
    const refreshSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        const nextRole = session ? await loadRemoteRole() : null
        if (active) setRole(nextRole)
      } catch {
        if (active) setRole(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void refreshSession()
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setRole(null)
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
  }, [loadRemoteRole])

  const login = useCallback(async ({ email, password, demoRole }: LoginCredentials) => {
    if (!supabase) {
      setRole(demoRole)
      saveLocal('odissea-role', demoRole)
      return demoRole
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const nextRole = await loadRemoteRole()
      if (!nextRole) {
        await supabase.auth.signOut()
        throw new Error('Tu cuenta todavía no tiene acceso asignado a ODISSEA HUB.')
      }
      setRole(nextRole)
      return nextRole
    } finally {
      setLoading(false)
    }
  }, [loadRemoteRole])

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      setRole(null)
      localStorage.removeItem('odissea-role')
    }
    setRole(null)
  }, [])

  const value = useMemo<AuthState>(() => ({
    role,
    loading,
    login,
    logout,
  }), [loading, login, logout, role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return value
}

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Role } from '../../types/domain'
import { loadLocal, saveLocal } from '../../lib/storage'

interface AuthState {
  role: Role | null
  login: (role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => loadLocal<Role | null>('odissea-role', null))

  const value = useMemo<AuthState>(() => ({
    role,
    login: (nextRole) => {
      setRole(nextRole)
      saveLocal('odissea-role', nextRole)
    },
    logout: () => {
      setRole(null)
      localStorage.removeItem('odissea-role')
    },
  }), [role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return value
}

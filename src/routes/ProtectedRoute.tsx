import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import type { Role } from '../types/domain'

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/no-autorizado" replace />
  return children
}

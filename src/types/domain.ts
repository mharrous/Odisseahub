export type Role = 'admin' | 'coordinator' | 'mentor' | 'participant' | 'evaluator'

export interface Program {
  id: string
  name: string
  entity: string
  status: 'Borrador' | 'Publicado' | 'Activo' | 'Finalizado'
  places: number
  projects: number
  progress: number
  startDate: string
  endDate: string
  color: string
}

export interface Project {
  id: string
  name: string
  sector: string
  phase: string
  status: 'En marcha' | 'En riesgo' | 'Al día'
  progress: number
  mentor: string
  lead: string
  nextMilestone: string
  hours: number
}

export interface WorkspaceItem {
  id: string
  kind: string
  title: string
  description: string
  status: 'Disponible' | 'En curso' | 'Completado' | 'Archivado'
  owner: string
  dueDate?: string
  projectId?: string
  updatedAt: string
}

export interface ApplicationDraft {
  projectName: string
  contactName: string
  email: string
  summary: string
  consent: boolean
  fileName?: string
  status: 'draft' | 'submitted'
  registration?: string
  submittedAt?: string
}

export interface PublicCall {
  id: string
  organizationId: string
  slug: string
  name: string
  description: string
  opensAt?: string
  closesAt?: string
  places: number
  status: 'published' | 'active'
  privacyText: string
  contactEmail: string
}

export interface SubmittedApplication {
  id: string
  registration: string
  projectName: string
  contactName: string
  submittedAt: string
}

export interface UserProfile {
  id: string
  displayName: string
  email: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  actionUrl?: string
  readAt?: string
  createdAt: string
}

export interface DashboardSummary {
  activeProjects: number
  averageProgress: number
  mentorHours: number
  pendingDeliverables: number
  atRiskProjects: Array<{ id: string; name: string; progress: number }>
  upcomingEvents: Array<{ id: string; title: string; startsAt: string; location: string }>
  recentActivity: Array<{ id: string; title: string; detail: string; createdAt: string }>
}

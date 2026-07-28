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

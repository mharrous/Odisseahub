import type { Program, Project } from '../types/domain'

export const initialPrograms: Program[] = [
  {
    id: 'program-mentoria-01',
    name: 'Primera convocatoria Mentoría',
    entity: 'Cámara de Comercio de Ceuta',
    status: 'Activo',
    places: 8,
    projects: 8,
    progress: 42,
    startDate: '2026-02-01',
    endDate: '2027-01-31',
    color: '#1677FF',
  },
]

export const projects: Project[] = [
  { id: 'p1', name: 'Abyla Robotics', sector: 'Robótica marina', phase: 'Incubación', status: 'Al día', progress: 74, mentor: 'Lucía Romero', lead: 'Nora Haddad', nextMilestone: 'Validación técnica', hours: 18 },
  { id: 'p2', name: 'Nauta AI', sector: 'Inteligencia artificial', phase: 'Incubación', status: 'En marcha', progress: 61, mentor: 'Álvaro Peña', lead: 'Yassin Mohamed', nextMilestone: 'Prueba de mercado', hours: 14 },
  { id: 'p3', name: 'Estrecho Circular', sector: 'Economía circular', phase: 'Consolidación', status: 'Al día', progress: 83, mentor: 'Marta Soler', lead: 'Elena Ruiz', nextMilestone: 'Acuerdo comercial', hours: 26 },
  { id: 'p4', name: 'Ceuta Biolab', sector: 'Biotecnología', phase: 'Incubación', status: 'En riesgo', progress: 38, mentor: 'Lucía Romero', lead: 'Samir Benali', nextMilestone: 'Entregable financiero', hours: 9 },
  { id: 'p5', name: 'Atlas Mobility', sector: 'Movilidad', phase: 'Consolidación', status: 'En marcha', progress: 68, mentor: 'Álvaro Peña', lead: 'Paula León', nextMilestone: 'Piloto urbano', hours: 22 },
  { id: 'p6', name: 'BlueTrace', sector: 'Oceanografía', phase: 'Incubación', status: 'Al día', progress: 57, mentor: 'Marta Soler', lead: 'Omar Amar', nextMilestone: 'Prototipo v2', hours: 13 },
  { id: 'p7', name: 'Neptuno Secure', sector: 'Ciberseguridad', phase: 'Consolidación', status: 'En marcha', progress: 79, mentor: 'Lucía Romero', lead: 'Isabel Vega', nextMilestone: 'Certificación', hours: 24 },
  { id: 'p8', name: 'Orilla Health', sector: 'Salud digital', phase: 'Incubación', status: 'En riesgo', progress: 31, mentor: 'Álvaro Peña', lead: 'Daniel Mena', nextMilestone: 'Validación clínica', hours: 7 },
]

export const chartData = [
  { month: 'Feb', progreso: 18, objetivo: 20 },
  { month: 'Mar', progreso: 24, objetivo: 28 },
  { month: 'Abr', progreso: 31, objetivo: 35 },
  { month: 'May', progreso: 39, objetivo: 42 },
  { month: 'Jun', progreso: 48, objetivo: 50 },
  { month: 'Jul', progreso: 56, objetivo: 58 },
]

export const roleLabels = {
  admin: 'Administración',
  coordinator: 'Coordinación',
  mentor: 'Mentoría',
  participant: 'Participante',
  evaluator: 'Evaluación',
} as const

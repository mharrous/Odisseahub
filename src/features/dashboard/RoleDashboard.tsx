import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, FileWarning, FolderKanban, Route, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { getCurrentProfile, listProjects } from '../../lib/repository'
import { listDomainItems } from '../../lib/domainRepository'
import type { Project, UserProfile, WorkspaceItem } from '../../types/domain'
import { useAuth } from '../auth/AuthContext'

export function RoleDashboard() {
  const { role } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<WorkspaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const requests: Promise<unknown>[] = [getCurrentProfile()]
    if (role === 'participant' || role === 'mentor' || role === 'coordinator') requests.push(listProjects())
    if (role === 'evaluator') requests.push(listDomainItems('candidaturas'))
    Promise.all(requests)
      .then((results) => {
        if (!active) return
        setProfile(results[0] as UserProfile)
        if (role === 'evaluator') setApplications((results[1] as WorkspaceItem[] | undefined) ?? [])
        else setProjects((results[1] as Project[] | undefined) ?? [])
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar tu panel.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [role])

  if (loading) return <div className="empty-state"><p>Cargando tu espacio…</p></div>
  if (error) return <EmptyState title="No se ha podido cargar el panel" description={error} />
  if (role === 'participant') return <ParticipantDashboard profile={profile} project={projects[0]} />
  if (role === 'evaluator') return <EvaluatorDashboard profile={profile} applications={applications} />
  return <MentorDashboard profile={profile} projects={projects} coordinator={role === 'coordinator'} />
}

function ParticipantDashboard({ profile, project }: { profile: UserProfile | null; project?: Project }) {
  const navigate = useNavigate()
  if (!project) return <><PageHeader eyebrow="Mi espacio" title={`Buenos días, ${profile?.displayName ?? 'participante'}`} description="Tu proyecto aparecerá aquí cuando se complete la asignación." /><EmptyState title="Sin proyecto asignado" description="Contacta con coordinación si esperabas ver un proyecto." /></>
  return (
    <>
      <PageHeader eyebrow="Mi espacio" title={`Buenos días, ${profile?.displayName ?? 'participante'}`} description="Consulta el avance y continúa con el siguiente hito de tu proyecto." />
      <section className="project-hero">
        <span className="eyebrow project-eyebrow">{project.name} · {project.phase}</span>
        <h2 className="project-progress-title">Tu ruta avanza al {project.progress}%</h2>
        <p>Próximo hito: {project.nextMilestone}.</p>
        <ProgressBar value={project.progress} label="Progreso del itinerario" />
      </section>
      <div className="dashboard-grid">
        <section className="card"><div className="card-head"><h2>Tu próximo paso</h2><Route size={19} color="#1677FF" /></div><span className="badge badge--warning">En curso</span><h3 className="card-spaced-title">{project.nextMilestone}</h3><p className="muted card-copy">Consulta las instrucciones, actualiza el estado y adjunta las evidencias correspondientes.</p><button className="button button--primary" onClick={() => navigate('/app/entregables')}>Continuar entregable</button></section>
        <aside className="card"><div className="card-head"><h2>Mentor principal</h2><Users size={19} color="#13B8A6" /></div><h3>{project.mentor}</h3><p className="muted card-caption">{project.hours} horas registradas</p></aside>
      </div>
      <section className="metric-grid dashboard-section">
        <article className="metric-card"><div><p>Progreso</p><strong>{project.progress}%</strong></div><span className="metric-card__icon"><CheckCircle2 size={20}/></span><small>{project.status}</small></article>
        <article className="metric-card"><div><p>Horas mentoría</p><strong>{project.hours} h</strong></div><span className="metric-card__icon"><Clock3 size={20}/></span><small>{project.mentor}</small></article>
      </section>
    </>
  )
}

function MentorDashboard({ profile, projects, coordinator }: { profile: UserProfile | null; projects: Project[]; coordinator: boolean }) {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow={coordinator ? 'Coordinación' : 'Panel de mentoría'} title={`Buenos días, ${profile?.displayName ?? (coordinator ? 'coordinación' : 'mentor')}`} description="Proyectos y seguimientos visibles según tus asignaciones actuales." />
      <section className="metric-grid">
        <article className="metric-card"><div><p>Proyectos asignados</p><strong>{projects.length}</strong></div><span className="metric-card__icon"><FolderKanban size={20}/></span><small>{projects.filter((project) => project.status === 'En riesgo').length} en riesgo</small></article>
        <article className="metric-card"><div><p>Horas registradas</p><strong>{projects.reduce((total, project) => total + project.hours, 0)} h</strong></div><span className="metric-card__icon"><Clock3 size={20}/></span><small>Sesiones completadas</small></article>
        <article className="metric-card"><div><p>Próximos hitos</p><strong>{projects.filter((project) => project.nextMilestone !== 'Sin hito pendiente').length}</strong></div><span className="metric-card__icon"><CalendarDays size={20}/></span><small>Con seguimiento</small></article>
        <article className="metric-card"><div><p>Alertas</p><strong>{projects.filter((project) => project.status === 'En riesgo').length}</strong></div><span className="metric-card__icon"><FileWarning size={20}/></span><small>Requieren atención</small></article>
      </section>
      <section className="card dashboard-section">
        <div className="card-head"><h2>Proyectos asignados</h2><Users size={18} color="#1677FF" /></div>
        {projects.length ? <div className="milestone-list">{projects.map((project) => <button className="milestone milestone--button" key={project.id} onClick={() => navigate(`/mentor/proyectos/${project.id}`)}><span className="project-logo project-logo--small">{project.name.slice(0,2).toUpperCase()}</span><div className="milestone-content"><strong>{project.name}</strong><p>{project.nextMilestone} · {project.progress}% de progreso</p></div></button>)}</div> : <EmptyState title="Sin proyectos asignados" description="Los proyectos aparecerán cuando coordinación complete la asignación." />}
      </section>
    </>
  )
}

function EvaluatorDashboard({ profile, applications }: { profile: UserProfile | null; applications: WorkspaceItem[] }) {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow="Panel de evaluación" title={`Buenos días, ${profile?.displayName ?? 'evaluador'}`} description="Solo se muestran las candidaturas que tienes asignadas." />
      <div className="notice">Las puntuaciones de otros evaluadores permanecen ocultas hasta el cierre del proceso.</div>
      <section className="metric-grid dashboard-section">
        <article className="metric-card"><div><p>Asignadas</p><strong>{applications.length}</strong></div><span className="metric-card__icon"><FileWarning size={20}/></span><small>{applications.filter((item) => item.status !== 'Completado').length} pendientes</small></article>
        <article className="metric-card"><div><p>Finalizadas</p><strong>{applications.filter((item) => item.status === 'Completado').length}</strong></div><span className="metric-card__icon"><CheckCircle2 size={20}/></span><small>Evaluaciones cerradas</small></article>
      </section>
      <section className="card dashboard-section">
        <div className="card-head"><h2>Candidaturas asignadas</h2><span className="badge badge--info">Rúbrica ODISSEA</span></div>
        {applications.length ? <div className="milestone-list">{applications.map((application) => <button className="milestone milestone--button" key={application.id} onClick={() => navigate('/evaluador/candidaturas')}><span className="milestone__dot" /><div><strong>{application.title}</strong><p>{application.description}</p></div></button>)}</div> : <EmptyState title="Sin candidaturas asignadas" description="No tienes evaluaciones pendientes en este momento." />}
      </section>
    </>
  )
}

import { CalendarDays, CheckCircle2, Clock3, FileWarning, FolderKanban, Route, Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { projects } from '../../data/demo'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

const copy = {
  participant: { eyebrow: 'Mi espacio', title: 'Buenos días, Nora', description: 'Tu siguiente paso está claro. Continúa donde lo dejaste.' },
  mentor: { eyebrow: 'Panel de mentoría', title: 'Buenos días, Lucía', description: 'Proyectos, sesiones y revisiones que requieren tu atención.' },
  evaluator: { eyebrow: 'Panel de evaluación', title: 'Proceso de evaluación', description: 'Consulta únicamente las candidaturas que tienes asignadas.' },
  coordinator: { eyebrow: 'Coordinación', title: 'Seguimiento del programa', description: 'Prioridades y actividad de tus proyectos asignados.' },
} as const

export function RoleDashboard() {
  const { role } = useAuth()
  if (role === 'participant') return <ParticipantDashboard {...copy.participant} />
  if (role === 'evaluator') return <EvaluatorDashboard {...copy.evaluator} />
  return <MentorDashboard {...(role === 'coordinator' ? copy.coordinator : copy.mentor)} />
}

function ParticipantDashboard({ eyebrow, title, description }: typeof copy.participant) {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="project-hero">
        <span className="eyebrow" style={{ color: '#65d8ca' }}>Abyla Robotics · Incubación</span>
        <h2 style={{ fontSize: '1.6rem', margin: '9px 0' }}>Tu ruta avanza al 74%</h2>
        <p>Estás a una actividad de completar el módulo de validación.</p>
        <ProgressBar value={74} label="Progreso del itinerario" />
      </section>
      <div className="dashboard-grid">
        <section className="card"><div className="card-head"><h2>Tu próximo paso</h2><Route size={19} color="#1677FF" /></div><span className="badge badge--warning">Vence en 5 días</span><h3 style={{ marginTop: 14 }}>Entregable · Validación de mercado</h3><p className="muted" style={{ fontSize: '.8rem', lineHeight: 1.6 }}>Incorpora las conclusiones de las entrevistas y adjunta la matriz de evidencias.</p><button className="button button--primary" onClick={() => navigate('/app/entregables')}>Continuar entregable</button></section>
        <aside className="card"><div className="card-head"><h2>Próxima mentoría</h2><CalendarDays size={19} color="#13B8A6" /></div><h3>Revisión del modelo comercial</h3><p className="muted" style={{ fontSize: '.75rem' }}>4 agosto · 10:30 · Online</p><p><strong>Lucía Romero</strong><br/><span className="muted" style={{ fontSize: '.7rem' }}>Mentora principal</span></p></aside>
      </div>
      <div className="metric-grid" style={{ marginTop: 18 }}>
        <article className="metric-card"><div><p>Entregables aprobados</p><strong>7/10</strong></div><span className="metric-card__icon"><CheckCircle2 size={20}/></span><small>1 en revisión</small></article>
        <article className="metric-card"><div><p>Horas de mentoría</p><strong>18 h</strong></div><span className="metric-card__icon"><Clock3 size={20}/></span><small>6 sesiones realizadas</small></article>
      </div>
    </>
  )
}

function MentorDashboard({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  const assigned = projects.filter((project) => project.mentor === 'Lucía Romero')
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="metric-grid">
        <article className="metric-card"><div><p>Proyectos asignados</p><strong>{assigned.length}</strong></div><span className="metric-card__icon"><FolderKanban size={20}/></span><small>1 requiere seguimiento</small></article>
        <article className="metric-card"><div><p>Sesiones próximas</p><strong>3</strong></div><span className="metric-card__icon"><CalendarDays size={20}/></span><small>Próxima: 4 agosto</small></article>
        <article className="metric-card"><div><p>Actas pendientes</p><strong>1</strong></div><span className="metric-card__icon"><FileWarning size={20}/></span><small>Sesión del 24 de julio</small></article>
        <article className="metric-card"><div><p>Horas registradas</p><strong>42 h</strong></div><span className="metric-card__icon"><Clock3 size={20}/></span><small>8 h este mes</small></article>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-head"><h2>Proyectos asignados</h2><Users size={18} color="#1677FF" /></div>
        <div className="milestone-list">{assigned.map((project) => <button className="milestone milestone--button" key={project.id} onClick={() => navigate(`/mentor/proyectos/${project.id}`)}><span className="project-logo" style={{ width: 39, height: 39, fontSize: '.7rem', background: '#eef5ff' }}>{project.name.slice(0,2).toUpperCase()}</span><div style={{ flex: 1 }}><strong>{project.name}</strong><p>{project.nextMilestone} · {project.progress}% de progreso</p></div></button>)}</div>
      </section>
    </>
  )
}

function EvaluatorDashboard({ eyebrow, title, description }: typeof copy.evaluator) {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="notice">Las puntuaciones de otros evaluadores permanecen ocultas hasta el cierre del proceso.</div>
      <section className="metric-grid" style={{ marginTop: 18 }}>
        <article className="metric-card"><div><p>Asignadas</p><strong>4</strong></div><span className="metric-card__icon"><FileWarning size={20}/></span><small>2 pendientes</small></article>
        <article className="metric-card"><div><p>Finalizadas</p><strong>2</strong></div><span className="metric-card__icon"><CheckCircle2 size={20}/></span><small>Evaluaciones bloqueadas</small></article>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-head"><h2>Candidaturas asignadas</h2><span className="badge badge--info">Rúbrica ODISSEA</span></div>
        <div className="milestone-list">
          {['ODI-2026-0012 · HydroSense', 'ODI-2026-0015 · Gadir Cloud', 'ODI-2026-0018 · BioMarine Labs'].map((item, index) => <button className="milestone milestone--button" key={item} onClick={() => navigate('/evaluador/candidaturas')}><span className="milestone__dot" style={{ background: index < 1 ? '#13b8a6' : '#b7c1cd' }} /><div><strong>{item}</strong><p>{index < 1 ? 'Evaluación finalizada · 82 puntos' : 'Pendiente de evaluación'}</p></div></button>)}
        </div>
      </section>
    </>
  )
}

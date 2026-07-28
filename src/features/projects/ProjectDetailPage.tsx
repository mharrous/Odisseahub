import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Clock3, Users } from 'lucide-react'
import { projects } from '../../data/demo'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'

const tabs = ['Resumen', 'Equipo', 'Itinerario', 'Entregables', 'Mentorías', 'Sesiones', 'Indicadores', 'Documentos', 'Actividad', 'Observaciones']

export function ProjectDetailPage() {
  const { id } = useParams()
  const project = projects.find((item) => item.id === id) ?? projects[0]
  const [tab, setTab] = useState('Resumen')
  return (
    <>
      <div className="breadcrumb">Proyectos / <span>{project.name}</span></div>
      <section className="project-hero">
        <div className="project-hero__top"><span className="project-logo">{project.name.slice(0, 2).toUpperCase()}</span><div><Badge tone={project.status === 'En riesgo' ? 'danger' : 'success'}>{project.status}</Badge><h1>{project.name}</h1><p>{project.sector} · Primera cohorte ODISSEA</p></div></div>
        <div className="project-hero__stats">
          <div className="project-stat"><span>Fase actual</span><strong>{project.phase}</strong></div>
          <div className="project-stat"><span>Progreso</span><strong>{project.progress}%</strong></div>
          <div className="project-stat"><span>Mentor principal</span><strong>{project.mentor}</strong></div>
          <div className="project-stat"><span>Horas recibidas</span><strong>{project.hours} h</strong></div>
        </div>
      </section>
      <div className="tabs" role="tablist" aria-label="Secciones del proyecto">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={`tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === 'Resumen' ? (
        <div className="two-column">
          <section className="card">
            <div className="card-head"><h2>Avance del itinerario</h2><Badge tone="info">{project.phase}</Badge></div>
            <ProgressBar value={project.progress} label="Progreso total" />
            <div className="milestone-list" style={{ marginTop: 24 }}>
              <div className="milestone"><span className="milestone__dot" /><div><strong>Propuesta de valor</strong><p>Completado · 12 de junio</p></div></div>
              <div className="milestone"><span className="milestone__dot" /><div><strong>Validación de mercado</strong><p>En curso · vence el 14 de agosto</p></div></div>
              <div className="milestone"><span className="milestone__dot" style={{ background: '#c6cdd5', boxShadow: '0 0 0 5px #f1f3f5' }} /><div><strong>Modelo financiero</strong><p>Bloqueado hasta completar la validación</p></div></div>
            </div>
          </section>
          <aside style={{ display: 'grid', gap: 18 }}>
            <section className="card"><div className="card-head"><h2>Equipo y seguimiento</h2><Users size={18} color="#1677FF" /></div><p><strong>{project.lead}</strong><br/><span className="muted" style={{ fontSize: '.72rem' }}>Responsable del proyecto</span></p><p><strong>{project.mentor}</strong><br/><span className="muted" style={{ fontSize: '.72rem' }}>Mentor principal</span></p></section>
            <section className="card"><div className="card-head"><h2>Próxima sesión</h2><CalendarDays size={18} color="#13B8A6" /></div><p><strong>Revisión de validación</strong></p><p className="muted" style={{ fontSize: '.74rem' }}>4 agosto · 10:30 · Online</p></section>
            {project.status === 'En riesgo' && <div className="alert-item"><span className="alert-item__icon"><AlertTriangle size={16} /></span><div><strong>Seguimiento recomendado</strong><p>El proyecto presenta baja actividad y una entrega próxima.</p></div></div>}
          </aside>
        </div>
      ) : (
        <section className="card">
          <div className="card-head"><h2>{tab}</h2><Clock3 size={18} color="#1677FF" /></div>
          <p className="muted">Esta sección forma parte de la ficha 360º. La conexión completa con Supabase está preparada en el modelo y se ampliará en la siguiente iteración.</p>
        </section>
      )}
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BriefcaseBusiness, CalendarDays, Clock3, FileWarning, FolderKanban, Gauge } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { getAdminDashboard, listProjects } from '../../lib/repository'
import type { DashboardSummary, Project } from '../../types/domain'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getAdminDashboard(), listProjects()])
      .then(([summaryData, projectData]) => {
        if (!active) return
        setSummary(summaryData)
        setProjects(projectData)
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar el panel.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const chartRows = useMemo(() => projects.map((project) => ({
    name: project.name.length > 14 ? `${project.name.slice(0, 12)}…` : project.name,
    progreso: project.progress,
  })), [projects])

  if (loading) return <div className="empty-state"><p>Cargando indicadores reales…</p></div>

  const metrics = [
    { label: 'Proyectos activos', value: String(summary?.activeProjects ?? 0), change: 'Proyectos visibles para tu rol', icon: FolderKanban },
    { label: 'Progreso medio', value: `${summary?.averageProgress ?? 0}%`, change: 'Media calculada en tiempo real', icon: Gauge },
    { label: 'Horas de mentoría', value: `${summary?.mentorHours ?? 0} h`, change: 'Sesiones con horas registradas', icon: Clock3 },
    { label: 'Entregables pendientes', value: String(summary?.pendingDeliverables ?? 0), change: 'En revisión o con cambios', icon: FileWarning },
  ]

  return (
    <>
      <PageHeader eyebrow={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} title="El programa, de un vistazo" description="Datos actuales de proyectos, entregables, mentorías y próximos eventos." action={<Button onClick={() => navigate('/admin/programas?new=1')} icon={<BriefcaseBusiness size={17} />}>Nuevo programa</Button>} />
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      <section className="metric-grid" aria-label="Indicadores principales">
        {metrics.map(({ label, value, change, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div><p>{label}</p><strong>{value}</strong></div><span className="metric-card__icon"><Icon size={20} /></span><small>{change}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="card">
          <div className="card-head"><div><h2>Progreso por proyecto</h2><span className="muted dashboard-caption">Porcentaje registrado actualmente en Supabase</span></div><span className="badge badge--neutral">{projects.length} proyectos</span></div>
          {chartRows.length ? (
            <div className="chart-wrap" aria-label="Gráfico de progreso actual por proyecto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} margin={{ left: -22, right: 10, top: 10 }}>
                  <CartesianGrid stroke="#e8edf3" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e9f0' }} />
                  <Bar dataKey="progreso" fill="#1677FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="Sin proyectos" description="Los proyectos aparecerán aquí cuando se incorporen al programa." />}
        </section>
        <aside className="card">
          <div className="card-head"><h2>Necesita atención</h2><span className="badge badge--danger">{summary?.atRiskProjects.length ?? 0} alertas</span></div>
          <div className="alert-list">
            {summary?.atRiskProjects.length ? summary.atRiskProjects.map((project) => (
              <button className="alert-item alert-item--button" key={project.id} onClick={() => navigate(`/admin/proyectos/${project.id}`)}><span className="alert-item__icon"><AlertTriangle size={16} /></span><div><strong>{project.name}</strong><p>Proyecto marcado en riesgo · {project.progress}% de progreso.</p></div></button>
            )) : <p className="muted">No hay proyectos marcados en riesgo.</p>}
          </div>
        </aside>
      </div>
      <div className="dashboard-grid dashboard-grid--split">
        <section className="card">
          <div className="card-head"><h2>Actividad reciente</h2><Button variant="ghost" size="sm" onClick={() => navigate('/admin/auditoria')}>Ver auditoría</Button></div>
          <div className="activity-list">
            {summary?.recentActivity.length ? summary.recentActivity.map((activity) => (
              <div className="activity-row" key={activity.id}><span className="avatar">{activity.title.slice(0, 2).toUpperCase()}</span><div><p><strong>{activity.title}</strong> · {activity.detail}</p><time>{new Date(activity.createdAt).toLocaleString('es-ES')}</time></div></div>
            )) : <p className="muted">Todavía no hay actividad auditada.</p>}
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Próximos eventos</h2><Button variant="ghost" size="sm" onClick={() => navigate('/admin/eventos')}>Calendario</Button></div>
          <div className="milestone-list">
            {summary?.upcomingEvents.length ? summary.upcomingEvents.map((event) => (
              <div className="milestone" key={event.id}><span className="milestone__dot" /><div><strong>{event.title}</strong><p><CalendarDays size={13} /> {new Date(event.startsAt).toLocaleString('es-ES')} · {event.location}</p></div></div>
            )) : <p className="muted">No hay eventos próximos.</p>}
          </div>
        </section>
      </div>
    </>
  )
}

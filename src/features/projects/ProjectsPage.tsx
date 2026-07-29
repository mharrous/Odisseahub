import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { listProjects } from '../../lib/repository'
import type { Project } from '../../types/domain'
import { useAuth } from '../auth/AuthContext'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { role } = useAuth()

  useEffect(() => {
    let active = true
    listProjects()
      .then((data) => active && setProjects(data))
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar los proyectos.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const phases = useMemo(() => ['Todas', ...new Set(projects.map((project) => project.phase))], [projects])
  const filtered = useMemo(() => projects.filter((project) => {
    const matchesText = `${project.name} ${project.sector} ${project.lead} ${project.mentor}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (phase === 'Todas' || project.phase === phase) && (status === 'Todos' || project.status === status)
  }), [phase, projects, query, status])
  const basePath = role === 'mentor' ? '/mentor/proyectos' : '/admin/proyectos'

  return (
    <>
      <div className="breadcrumb">{role === 'mentor' ? 'Mentoría' : 'Administración'} / <span>Proyectos</span></div>
      <PageHeader title="Proyectos" description="Una vista común del avance, los riesgos y los próximos hitos de la cohorte." />
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} /><input className="field" style={{ paddingLeft: 39 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, sector o persona..." aria-label="Buscar proyectos" /></div>
          <select className="select" style={{ width: 180 }} aria-label="Filtrar por fase" value={phase} onChange={(event) => setPhase(event.target.value)}>{phases.map((value) => <option key={value}>{value}</option>)}</select>
          <select className="select" style={{ width: 180 }} aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)}>{['Todos', 'Al día', 'En marcha', 'En riesgo'].map((value) => <option key={value}>{value}</option>)}</select>
        </div>
        {loading ? <div className="empty-state"><p>Cargando proyectos…</p></div> : filtered.length ? (
          <table>
            <thead><tr><th>Proyecto</th><th>Fase</th><th>Estado</th><th>Mentor</th><th>Progreso</th><th>Próximo hito</th></tr></thead>
            <tbody>{filtered.map((project) => (
              <tr key={project.id}>
                <td><Link to={`${basePath}/${project.id}`}><div className="table-title">{project.name}</div><div className="table-subtitle">{project.sector} · {project.lead}</div></Link></td>
                <td data-label="Fase">{project.phase}</td>
                <td data-label="Estado"><Badge tone={project.status === 'En riesgo' ? 'danger' : project.status === 'Al día' ? 'success' : 'info'}>{project.status}</Badge></td>
                <td data-label="Mentor">{project.mentor}</td>
                <td data-label="Progreso"><ProgressBar value={project.progress} /></td>
                <td data-label="Próximo hito">{project.nextMilestone}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <div className="empty-state"><p>No hay proyectos con estos filtros.</p></div>}
      </div>
    </>
  )
}

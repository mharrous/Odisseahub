import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { projects } from '../../data/demo'

export function ProjectsPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => projects.filter((item) => `${item.name} ${item.sector}`.toLowerCase().includes(query.toLowerCase())), [query])
  return (
    <>
      <div className="breadcrumb">Administración / <span>Proyectos</span></div>
      <PageHeader title="Proyectos" description="Una vista común del avance, los riesgos y los próximos hitos de la cohorte." />
      <div className="table-card">
        <div className="table-toolbar"><div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} /><input className="field" style={{ paddingLeft: 39 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o sector..." aria-label="Buscar proyectos" /></div><select className="select" style={{ width: 170 }}><option>Todas las fases</option></select><select className="select" style={{ width: 170 }}><option>Todos los estados</option></select></div>
        <table>
          <thead><tr><th>Proyecto</th><th>Fase</th><th>Estado</th><th>Mentor</th><th>Progreso</th><th>Próximo hito</th></tr></thead>
          <tbody>{filtered.map((project) => (
            <tr key={project.id}>
              <td><Link to={`/admin/proyectos/${project.id}`}><div className="table-title">{project.name}</div><div className="table-subtitle">{project.sector} · {project.lead}</div></Link></td>
              <td data-label="Fase">{project.phase}</td>
              <td data-label="Estado"><Badge tone={project.status === 'En riesgo' ? 'danger' : project.status === 'Al día' ? 'success' : 'info'}>{project.status}</Badge></td>
              <td data-label="Mentor">{project.mentor}</td>
              <td data-label="Progreso"><ProgressBar value={project.progress} /></td>
              <td data-label="Próximo hito">{project.nextMilestone}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  )
}

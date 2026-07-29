import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { getProject, listWorkspaceItems, removeWorkspaceItem, saveWorkspaceItem } from '../../lib/repository'
import type { Project, WorkspaceItem } from '../../types/domain'

const tabs = ['Resumen', 'Equipo', 'Itinerario', 'Entregables', 'Mentorías', 'Sesiones', 'Indicadores', 'Documentos', 'Actividad', 'Observaciones'] as const
type ProjectTab = typeof tabs[number]

const tabKinds: Record<Exclude<ProjectTab, 'Resumen'>, string> = {
  Equipo: 'project_equipo',
  Itinerario: 'project_itinerario',
  Entregables: 'project_entregables',
  Mentorías: 'project_mentorias',
  Sesiones: 'project_sesiones',
  Indicadores: 'project_indicadores',
  Documentos: 'project_documentos',
  Actividad: 'project_actividad',
  Observaciones: 'project_observaciones',
}

function projectDefaults(project: Project, tab: Exclude<ProjectTab, 'Resumen'>): WorkspaceItem[] {
  const defaults: Record<Exclude<ProjectTab, 'Resumen'>, Array<[string, string, WorkspaceItem['status']]>> = {
    Equipo: [[project.lead, 'Responsable del proyecto', 'Disponible'], [project.mentor, 'Mentor principal', 'Disponible']],
    Itinerario: [['Propuesta de valor', 'Módulo completado', 'Completado'], ['Validación de mercado', 'Actividad prioritaria', 'En curso'], ['Modelo financiero', 'Siguiente módulo', 'Disponible']],
    Entregables: [[project.nextMilestone, 'Próximo entregable del proyecto', 'En curso']],
    Mentorías: [['Revisión del modelo de negocio', 'Sesión de seguimiento individual', 'En curso']],
    Sesiones: [['Sesión de seguimiento', 'Online · 60 minutos', 'Disponible']],
    Indicadores: [['Progreso del itinerario', `${project.progress}% completado`, 'En curso'], ['Horas de mentoría', `${project.hours} horas registradas`, 'En curso']],
    Documentos: [['Ficha del proyecto', 'Documento interno del programa', 'Disponible']],
    Actividad: [['Proyecto actualizado', 'Última revisión de seguimiento', 'Completado']],
    Observaciones: [['Seguimiento general', project.status === 'En riesgo' ? 'Requiere atención del equipo coordinador' : 'Evolución dentro de lo previsto', 'En curso']],
  }
  return defaults[tab].map(([title, description, status], index) => ({
    id: `sample-${tab}-${index}`,
    kind: tabKinds[tab],
    title,
    description,
    status,
    owner: index ? project.mentor : project.lead,
    projectId: project.id,
    updatedAt: new Date(2026, 6, 28 - index).toISOString(),
  }))
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<ProjectTab>('Resumen')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getProject(id)
      .then((value) => {
        if (!active) return
        setProject(value)
        if (!value) setError('No se ha encontrado el proyecto.')
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar el proyecto.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  if (loading) return <div className="empty-state"><p>Cargando ficha del proyecto…</p></div>
  if (!project) return <EmptyState title="Proyecto no encontrado" description={error || 'Comprueba que el proyecto sigue activo.'} />

  return (
    <>
      <div className="breadcrumb">Proyectos / <span>{project.name}</span></div>
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
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
      {tab === 'Resumen' ? <ProjectSummary project={project} /> : <ProjectItems project={project} tab={tab} />}
    </>
  )
}

function ProjectSummary({ project }: { project: Project }) {
  return (
    <div className="two-column">
      <section className="card">
        <div className="card-head"><h2>Avance del itinerario</h2><Badge tone="info">{project.phase}</Badge></div>
        <ProgressBar value={project.progress} label="Progreso total" />
        <div className="milestone-list" style={{ marginTop: 24 }}>
          <div className="milestone"><span className="milestone__dot" /><div><strong>Propuesta de valor</strong><p>Completado · 12 de junio</p></div></div>
          <div className="milestone"><span className="milestone__dot" /><div><strong>{project.nextMilestone}</strong><p>En curso · requiere seguimiento</p></div></div>
          <div className="milestone"><span className="milestone__dot milestone__dot--pending" /><div><strong>Modelo financiero</strong><p>Disponible al completar el hito actual</p></div></div>
        </div>
      </section>
      <aside style={{ display: 'grid', gap: 18 }}>
        <section className="card"><div className="card-head"><h2>Equipo y seguimiento</h2><Users size={18} color="#1677FF" /></div><p><strong>{project.lead}</strong><br/><span className="muted">Responsable del proyecto</span></p><p><strong>{project.mentor}</strong><br/><span className="muted">Mentor principal</span></p></section>
        <section className="card"><div className="card-head"><h2>Próxima sesión</h2><CalendarDays size={18} color="#13B8A6" /></div><p><strong>Revisión de validación</strong></p><p className="muted">4 agosto · 10:30 · Online</p></section>
        {project.status === 'En riesgo' && <div className="alert-item"><span className="alert-item__icon"><AlertTriangle size={16} /></span><div><strong>Seguimiento recomendado</strong><p>El proyecto presenta baja actividad y una entrega próxima.</p></div></div>}
      </aside>
    </div>
  )
}

function ProjectItems({ project, tab }: { project: Project; tab: Exclude<ProjectTab, 'Resumen'> }) {
  const kind = tabKinds[tab]
  const defaults = useMemo(() => projectDefaults(project, tab), [project, tab])
  const [rows, setRows] = useState<WorkspaceItem[]>([])
  const [editing, setEditing] = useState<WorkspaceItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<WorkspaceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listWorkspaceItems(kind, project.id, defaults)
      .then((data) => active && setRows(data))
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar los registros.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [defaults, kind, project.id])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const saved = await saveWorkspaceItem({
        id: editing?.id,
        kind,
        projectId: project.id,
        title: String(data.get('title')),
        description: String(data.get('description') ?? ''),
        status: String(data.get('status')) as WorkspaceItem['status'],
        owner: String(data.get('owner')),
        dueDate: String(data.get('dueDate') ?? '') || undefined,
      })
      setRows((current) => editing ? current.map((row) => row.id === saved.id ? saved : row) : [saved, ...current])
      setCreating(false)
      setEditing(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se ha podido guardar.')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await removeWorkspaceItem(deleting)
      setRows((current) => current.filter((row) => row.id !== deleting.id))
      setDeleting(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se ha podido eliminar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <div className="card-head"><div><h2>{tab}</h2><span className="muted project-section-copy">Información vinculada a {project.name}</span></div><Button size="sm" onClick={() => setCreating(true)} icon={<Plus size={15} />}>Añadir</Button></div>
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      {loading ? <div className="empty-state"><p>Cargando {tab.toLowerCase()}…</p></div> : rows.length ? (
        <div className="project-item-list">{rows.map((row) => (
          <article className="project-item" key={row.id}>
            <div><strong>{row.title}</strong><p>{row.description || 'Sin descripción'}</p><small>{row.owner}{row.dueDate ? ` · ${new Date(row.dueDate).toLocaleDateString('es-ES')}` : ''}</small></div>
            <div className="project-item__actions"><Badge tone={row.status === 'Completado' ? 'success' : row.status === 'Archivado' ? 'neutral' : 'info'}>{row.status}</Badge><Button size="sm" variant="ghost" onClick={() => setEditing(row)} icon={<Pencil size={14} />}>Editar</Button><Button size="sm" variant="danger" onClick={() => setDeleting(row)} icon={<Trash2 size={14} />}>Eliminar</Button></div>
          </article>
        ))}</div>
      ) : <EmptyState title={`Sin ${tab.toLowerCase()}`} description="Añade el primer registro de esta sección." action={<Button onClick={() => setCreating(true)}>Crear registro</Button>} />}

      <Modal title={editing ? `Editar registro de ${tab}` : `Añadir a ${tab}`} open={creating || Boolean(editing)} onClose={() => { setCreating(false); setEditing(null) }}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group form-group--full"><label htmlFor="project-item-title">Nombre *</label><input className="field" id="project-item-title" name="title" defaultValue={editing?.title} required /></div>
            <div className="form-group form-group--full"><label htmlFor="project-item-description">Descripción</label><textarea className="textarea" id="project-item-description" name="description" defaultValue={editing?.description} /></div>
            <div className="form-group"><label htmlFor="project-item-status">Estado</label><select className="select" id="project-item-status" name="status" defaultValue={editing?.status ?? 'Disponible'}>{['Disponible', 'En curso', 'Completado', 'Archivado'].map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="form-group"><label htmlFor="project-item-owner">Responsable *</label><input className="field" id="project-item-owner" name="owner" defaultValue={editing?.owner ?? project.lead} required /></div>
            <div className="form-group form-group--full"><label htmlFor="project-item-due">Fecha objetivo</label><input className="field" id="project-item-due" name="dueDate" type="date" defaultValue={editing?.dueDate} /></div>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => { setCreating(false); setEditing(null) }}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button></div>
        </form>
      </Modal>
      <Modal title="Eliminar registro" open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <p>Se eliminará <strong>{deleting?.title}</strong> de esta ficha.</p>
        <div className="form-actions"><Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={confirmDelete}>{busy ? 'Eliminando…' : 'Eliminar'}</Button></div>
      </Modal>
    </section>
  )
}

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

type EditableProjectTab = Exclude<ProjectTab, 'Resumen'>
type ProjectFieldType = 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'time' | 'textarea' | 'select'
type ProjectField = {
  name: string
  label: string
  type: ProjectFieldType
  required?: boolean
  full?: boolean
  placeholder?: string
  min?: number
  max?: number
  options?: Array<{ value: string; label: string }>
}
type ProjectTabConfig = {
  item: string
  plural: string
  createLabel: string
  fields: ProjectField[]
  details?: Array<{ key: string; label: string; type?: 'url' }>
  statusLabels?: Partial<Record<WorkspaceItem['status'], string>>
}

const standardStatuses = [
  { value: 'Disponible', label: 'Disponible' },
  { value: 'En curso', label: 'En curso' },
  { value: 'Completado', label: 'Completado' },
  { value: 'Archivado', label: 'Archivado' },
]

const projectTabConfig: Record<EditableProjectTab, ProjectTabConfig> = {
  Equipo: {
    item: 'miembro',
    plural: 'Miembros del equipo',
    createLabel: 'Añadir miembro',
    fields: [
      { name: 'title', label: 'Nombre completo', type: 'text', required: true, full: true },
      { name: 'description', label: 'Función en el proyecto', type: 'text', required: true, full: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
      { name: 'phone', label: 'Teléfono', type: 'tel' },
      { name: 'owner', label: 'Área o entidad', type: 'text', required: true },
      { name: 'status', label: 'Situación', type: 'select', options: [
        { value: 'Disponible', label: 'Activo' },
        { value: 'En curso', label: 'Incorporación' },
        { value: 'Completado', label: 'Participación finalizada' },
        { value: 'Archivado', label: 'Inactivo' },
      ] },
    ],
    details: [{ key: 'email', label: 'Correo' }, { key: 'phone', label: 'Teléfono' }],
    statusLabels: { Disponible: 'Activo', 'En curso': 'Incorporación', Completado: 'Finalizado', Archivado: 'Inactivo' },
  },
  Itinerario: {
    item: 'hito',
    plural: 'Hitos del itinerario',
    createLabel: 'Añadir hito',
    fields: [
      { name: 'title', label: 'Módulo o hito', type: 'text', required: true, full: true },
      { name: 'description', label: 'Objetivo de aprendizaje', type: 'textarea', full: true },
      { name: 'status', label: 'Estado', type: 'select', options: standardStatuses },
      { name: 'owner', label: 'Responsable', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha prevista', type: 'date' },
      { name: 'progress', label: 'Progreso (%)', type: 'number', min: 0, max: 100 },
    ],
    details: [{ key: 'progress', label: 'Progreso' }],
  },
  Entregables: {
    item: 'entregable',
    plural: 'Entregables',
    createLabel: 'Añadir entregable',
    fields: [
      { name: 'title', label: 'Nombre del entregable', type: 'text', required: true, full: true },
      { name: 'description', label: 'Descripción y criterios de aceptación', type: 'textarea', full: true },
      { name: 'status', label: 'Estado', type: 'select', options: standardStatuses },
      { name: 'owner', label: 'Responsable', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha límite', type: 'date', required: true },
      { name: 'evidenceUrl', label: 'Enlace a la evidencia', type: 'url', placeholder: 'https://…', full: true },
    ],
    details: [{ key: 'evidenceUrl', label: 'Evidencia', type: 'url' }],
  },
  Mentorías: {
    item: 'mentoría',
    plural: 'Mentorías',
    createLabel: 'Programar mentoría',
    fields: [
      { name: 'title', label: 'Tema de la mentoría', type: 'text', required: true, full: true },
      { name: 'description', label: 'Objetivo y notas previas', type: 'textarea', full: true },
      { name: 'owner', label: 'Mentor', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha', type: 'date', required: true },
      { name: 'time', label: 'Hora', type: 'time', required: true },
      { name: 'duration', label: 'Duración (minutos)', type: 'number', min: 15, max: 480, required: true },
      { name: 'modality', label: 'Modalidad', type: 'select', options: [
        { value: 'Online', label: 'Online' },
        { value: 'Presencial', label: 'Presencial' },
        { value: 'Híbrida', label: 'Híbrida' },
      ] },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'Disponible', label: 'Programada' },
        { value: 'En curso', label: 'En curso' },
        { value: 'Completado', label: 'Realizada' },
        { value: 'Archivado', label: 'Cancelada' },
      ] },
    ],
    details: [{ key: 'time', label: 'Hora' }, { key: 'duration', label: 'Duración' }, { key: 'modality', label: 'Modalidad' }],
    statusLabels: { Disponible: 'Programada', Completado: 'Realizada', Archivado: 'Cancelada' },
  },
  Sesiones: {
    item: 'sesión',
    plural: 'Sesiones',
    createLabel: 'Programar sesión',
    fields: [
      { name: 'title', label: 'Título de la sesión', type: 'text', required: true, full: true },
      { name: 'description', label: 'Agenda', type: 'textarea', full: true },
      { name: 'owner', label: 'Facilitador', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha', type: 'date', required: true },
      { name: 'time', label: 'Hora', type: 'time', required: true },
      { name: 'duration', label: 'Duración (minutos)', type: 'number', min: 15, max: 480 },
      { name: 'modality', label: 'Modalidad', type: 'select', options: [
        { value: 'Online', label: 'Online' },
        { value: 'Presencial', label: 'Presencial' },
        { value: 'Híbrida', label: 'Híbrida' },
      ] },
      { name: 'meetingUrl', label: 'Enlace de reunión', type: 'url', placeholder: 'https://…', full: true },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'Disponible', label: 'Programada' },
        { value: 'En curso', label: 'En curso' },
        { value: 'Completado', label: 'Celebrada' },
        { value: 'Archivado', label: 'Cancelada' },
      ] },
    ],
    details: [{ key: 'time', label: 'Hora' }, { key: 'duration', label: 'Duración' }, { key: 'modality', label: 'Modalidad' }, { key: 'meetingUrl', label: 'Reunión', type: 'url' }],
    statusLabels: { Disponible: 'Programada', Completado: 'Celebrada', Archivado: 'Cancelada' },
  },
  Indicadores: {
    item: 'indicador',
    plural: 'Indicadores',
    createLabel: 'Añadir indicador',
    fields: [
      { name: 'title', label: 'Nombre del indicador', type: 'text', required: true, full: true },
      { name: 'description', label: 'Fuente o método de cálculo', type: 'textarea', full: true },
      { name: 'currentValue', label: 'Valor actual', type: 'number', required: true },
      { name: 'targetValue', label: 'Objetivo', type: 'number', required: true },
      { name: 'unit', label: 'Unidad', type: 'text', placeholder: '%, €, usuarios…' },
      { name: 'owner', label: 'Responsable de medición', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha de medición', type: 'date' },
      { name: 'status', label: 'Situación', type: 'select', options: [
        { value: 'Disponible', label: 'Pendiente de medir' },
        { value: 'En curso', label: 'En seguimiento' },
        { value: 'Completado', label: 'Objetivo alcanzado' },
        { value: 'Archivado', label: 'Descartado' },
      ] },
    ],
    details: [{ key: 'currentValue', label: 'Actual' }, { key: 'targetValue', label: 'Objetivo' }, { key: 'unit', label: 'Unidad' }],
    statusLabels: { Disponible: 'Pendiente', 'En curso': 'En seguimiento', Completado: 'Alcanzado', Archivado: 'Descartado' },
  },
  Documentos: {
    item: 'documento',
    plural: 'Documentos',
    createLabel: 'Añadir documento',
    fields: [
      { name: 'title', label: 'Nombre del documento', type: 'text', required: true, full: true },
      { name: 'description', label: 'Descripción', type: 'textarea', full: true },
      { name: 'category', label: 'Categoría', type: 'select', options: [
        { value: 'Entregable', label: 'Entregable' },
        { value: 'Acta', label: 'Acta' },
        { value: 'Informe', label: 'Informe' },
        { value: 'Evidencia', label: 'Evidencia' },
        { value: 'Otro', label: 'Otro' },
      ] },
      { name: 'documentUrl', label: 'Enlace al archivo', type: 'url', required: true, placeholder: 'https://…', full: true },
      { name: 'owner', label: 'Subido por', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha del documento', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'Disponible', label: 'Disponible' },
        { value: 'En curso', label: 'En revisión' },
        { value: 'Completado', label: 'Validado' },
        { value: 'Archivado', label: 'Archivado' },
      ] },
    ],
    details: [{ key: 'category', label: 'Categoría' }, { key: 'documentUrl', label: 'Abrir documento', type: 'url' }],
    statusLabels: { 'En curso': 'En revisión', Completado: 'Validado' },
  },
  Actividad: {
    item: 'actividad',
    plural: 'Actividad',
    createLabel: 'Registrar actividad',
    fields: [
      { name: 'title', label: 'Actividad realizada', type: 'text', required: true, full: true },
      { name: 'description', label: 'Detalle de la actividad', type: 'textarea', required: true, full: true },
      { name: 'activityType', label: 'Tipo', type: 'select', options: [
        { value: 'Seguimiento', label: 'Seguimiento' },
        { value: 'Reunión', label: 'Reunión' },
        { value: 'Entrega', label: 'Entrega' },
        { value: 'Cambio de estado', label: 'Cambio de estado' },
        { value: 'Otro', label: 'Otro' },
      ] },
      { name: 'owner', label: 'Realizada por', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha', type: 'date', required: true },
      { name: 'time', label: 'Hora', type: 'time' },
      { name: 'status', label: 'Resultado', type: 'select', options: [
        { value: 'Disponible', label: 'Informativa' },
        { value: 'En curso', label: 'Requiere seguimiento' },
        { value: 'Completado', label: 'Cerrada' },
        { value: 'Archivado', label: 'Archivada' },
      ] },
    ],
    details: [{ key: 'activityType', label: 'Tipo' }, { key: 'time', label: 'Hora' }],
    statusLabels: { Disponible: 'Informativa', 'En curso': 'Seguimiento', Completado: 'Cerrada' },
  },
  Observaciones: {
    item: 'observación',
    plural: 'Observaciones',
    createLabel: 'Añadir observación',
    fields: [
      { name: 'title', label: 'Asunto', type: 'text', required: true, full: true },
      { name: 'description', label: 'Observación', type: 'textarea', required: true, full: true },
      { name: 'category', label: 'Categoría', type: 'select', options: [
        { value: 'General', label: 'General' },
        { value: 'Riesgo', label: 'Riesgo' },
        { value: 'Acuerdo', label: 'Acuerdo' },
        { value: 'Incidencia', label: 'Incidencia' },
      ] },
      { name: 'visibility', label: 'Visibilidad', type: 'select', options: [
        { value: 'Equipo coordinador', label: 'Solo equipo coordinador' },
        { value: 'Equipo del proyecto', label: 'Equipo del proyecto' },
        { value: 'Mentor y coordinación', label: 'Mentor y coordinación' },
      ] },
      { name: 'owner', label: 'Autor', type: 'text', required: true },
      { name: 'dueDate', label: 'Fecha de seguimiento', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'Disponible', label: 'Abierta' },
        { value: 'En curso', label: 'En revisión' },
        { value: 'Completado', label: 'Resuelta' },
        { value: 'Archivado', label: 'Archivada' },
      ] },
    ],
    details: [{ key: 'category', label: 'Categoría' }, { key: 'visibility', label: 'Visibilidad' }],
    statusLabels: { Disponible: 'Abierta', 'En curso': 'En revisión', Completado: 'Resuelta' },
  },
}

const coreProjectFields = new Set(['title', 'description', 'status', 'owner', 'dueDate'])

function fieldValue(item: WorkspaceItem | null, field: ProjectField): string | number {
  if (!item) return ''
  if (coreProjectFields.has(field.name)) {
    const value = item[field.name as keyof Pick<WorkspaceItem, 'title' | 'description' | 'status' | 'owner' | 'dueDate'>]
    return value ?? ''
  }
  const value = item.metadata?.[field.name]
  return typeof value === 'string' || typeof value === 'number' ? value : ''
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function ProjectFormField({ field, item, kind, project }: { field: ProjectField; item: WorkspaceItem | null; kind: string; project: Project }) {
  const id = `${kind}-${field.name}`
  const className = `form-group${field.full ? ' form-group--full' : ''}`
  const savedValue = fieldValue(item, field)
  const defaultValue = savedValue || (!item && field.name === 'owner' && kind !== 'project_equipo'
    ? kind === 'project_mentorias' ? project.mentor : project.lead
    : '')
  return (
    <div className={className}>
      <label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
      {field.type === 'textarea' ? (
        <textarea className="textarea" id={id} name={field.name} defaultValue={defaultValue} required={field.required} placeholder={field.placeholder} />
      ) : field.type === 'select' ? (
        <select className="select" id={id} name={field.name} defaultValue={defaultValue || field.options?.[0]?.value} required={field.required}>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input className="field" id={id} name={field.name} type={field.type} defaultValue={defaultValue} required={field.required} placeholder={field.placeholder} min={field.min} max={field.max} />
      )}
    </div>
  )
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
        <div className="project-hero__top"><span className="project-logo">{project.name.slice(0, 2).toUpperCase()}</span><div><Badge tone={project.status === 'En riesgo' ? 'danger' : 'success'}>{project.status}</Badge><h1>{project.name}</h1><p>{project.sector} · Primera cohorte Mentoría</p></div></div>
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
  const config = projectTabConfig[tab]
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
    const metadata = Object.fromEntries(config.fields
      .filter((field) => !coreProjectFields.has(field.name))
      .map((field) => {
        const rawValue = String(data.get(field.name) ?? '').trim()
        return [field.name, field.type === 'number' && rawValue ? Number(rawValue) : rawValue]
      })
      .filter(([, value]) => value !== ''))
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
        metadata,
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
      <div className="card-head"><div><h2>{tab}</h2><span className="muted project-section-copy">{config.plural} vinculados a {project.name}</span></div><Button size="sm" onClick={() => setCreating(true)} icon={<Plus size={15} />}>{config.createLabel}</Button></div>
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      {loading ? <div className="empty-state"><p>Cargando {tab.toLowerCase()}…</p></div> : rows.length ? (
        <div className="project-item-list">{rows.map((row) => (
          <article className="project-item" key={row.id}>
            <div className="project-item__content">
              <strong>{row.title}</strong>
              <p>{row.description || 'Sin descripción'}</p>
              <small>{row.owner}{row.dueDate ? ` · ${new Date(row.dueDate).toLocaleDateString('es-ES')}` : ''}</small>
              {config.details?.length ? <dl className="project-item__details">{config.details.map((detail) => {
                const value = row.metadata?.[detail.key]
                if (value === undefined || value === null || value === '') return null
                const displayValue = detail.key === 'duration' ? `${String(value)} min` : detail.key === 'progress' ? `${String(value)}%` : String(value)
                const externalUrl = detail.type === 'url' ? safeExternalUrl(displayValue) : null
                return <div key={detail.key}><dt>{detail.label}</dt><dd>{detail.type === 'url' ? externalUrl ? <a href={externalUrl} target="_blank" rel="noreferrer">Abrir enlace</a> : 'Enlace no válido' : displayValue}</dd></div>
              })}</dl> : null}
            </div>
            <div className="project-item__actions"><Badge tone={row.status === 'Completado' ? 'success' : row.status === 'Archivado' ? 'neutral' : 'info'}>{config.statusLabels?.[row.status] ?? row.status}</Badge><Button size="sm" variant="ghost" onClick={() => setEditing(row)} icon={<Pencil size={14} />}>Editar</Button><Button size="sm" variant="danger" onClick={() => setDeleting(row)} icon={<Trash2 size={14} />}>Eliminar</Button></div>
          </article>
        ))}</div>
      ) : <EmptyState title={`Sin ${config.plural.toLowerCase()}`} description={`Crea el primer ${config.item} de esta sección.`} action={<Button onClick={() => setCreating(true)}>{config.createLabel}</Button>} />}

      <Modal title={editing ? `Editar ${config.item}` : config.createLabel} open={creating || Boolean(editing)} onClose={() => { setCreating(false); setEditing(null) }}>
        <form key={`${kind}-${editing?.id ?? 'new'}`} onSubmit={submit}>
          <div className="form-grid">
            {config.fields.map((field) => <ProjectFormField key={field.name} field={field} item={editing} kind={kind} project={project} />)}
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => { setCreating(false); setEditing(null) }}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button></div>
        </form>
      </Modal>
      <Modal title={`Eliminar ${config.item}`} open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <p>Se eliminará <strong>{deleting?.title}</strong> de esta ficha.</p>
        <div className="form-actions"><Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={confirmDelete}>{busy ? 'Eliminando…' : 'Eliminar'}</Button></div>
      </Modal>
    </section>
  )
}

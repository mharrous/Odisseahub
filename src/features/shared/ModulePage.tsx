import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, CheckCircle2, Download, FileText, Pencil, Plus, Search, Settings, Trash2, UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { listWorkspaceItems, removeWorkspaceItem, saveWorkspaceItem } from '../../lib/repository'
import {
  domainBackedKinds,
  getDomainDownloadUrl,
  listDomainItems,
  listDomainOptions,
  removeDomainItem,
  saveDomainItem,
  type DomainOptions,
  type DomainValues,
} from '../../lib/domainRepository'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { WorkspaceItem } from '../../types/domain'
import { useAuth } from '../auth/AuthContext'

const moduleConfig: Record<string, { title: string; description: string; item: string; samples?: string[]; readonly?: boolean }> = {
  convocatorias: { title: 'Convocatorias', description: 'Publica oportunidades y gestiona sus formularios, plazos y criterios.', item: 'convocatoria', samples: ['Primera convocatoria ODISSEA'] },
  candidaturas: { title: 'Candidaturas', description: 'Revisa documentación, estados y trazabilidad de cada solicitud.', item: 'candidatura', samples: ['ODI-2026-0012 · HydroSense', 'ODI-2026-0015 · Gadir Cloud', 'ODI-2026-0018 · BioMarine Labs'] },
  evaluaciones: { title: 'Evaluaciones', description: 'Asigna evaluadores, configura rúbricas y consolida el ranking.', item: 'evaluación', samples: ['Rúbrica tecnológica · 5 criterios', 'Comité de selección · Septiembre'] },
  cohortes: { title: 'Cohortes', description: 'Agrupa los proyectos seleccionados y asigna su equipo de seguimiento.', item: 'cohorte', samples: ['Cohorte ODISSEA 2026 · 8 proyectos'] },
  itinerarios: { title: 'Itinerarios', description: 'Ordena fases, módulos y actividades para cada programa.', item: 'itinerario', samples: ['Itinerario base ODISSEA · 2 fases · 9 módulos'] },
  mentores: { title: 'Mentores', description: 'Gestiona perfiles, especialidades, disponibilidad y asignaciones.', item: 'mentor', samples: ['Lucía Romero · Estrategia', 'Álvaro Peña · Finanzas', 'Marta Soler · Comercialización'] },
  eventos: { title: 'Eventos', description: 'Coordina talleres, jornadas y sesiones con control de asistencia.', item: 'evento', samples: ['Taller de estrategia comercial · 30 jul', 'Comité de seguimiento · 6 ago'] },
  indicadores: { title: 'Indicadores', description: 'Controla metas, evidencias e histórico de valores del programa.', item: 'indicador', samples: ['RCO01 · 100%', 'RCO04 · 76%', 'Horas de mentoría · 133 h'] },
  documentos: { title: 'Documentos y evidencias', description: 'Repositorio privado con versiones, etiquetas y visibilidad controlada.', item: 'documento', samples: ['Bases reguladoras.pdf', 'Acta comité 02.pdf', 'Plantilla modelo financiero.xlsx'] },
  informes: { title: 'Informes', description: 'Genera archivos auditables con los datos actuales del programa.', item: 'informe', samples: ['Informe mensual · Julio', 'Seguimiento de indicadores · T2'] },
  usuarios: { title: 'Usuarios y permisos', description: 'Invita usuarios y gestiona su rol y estado en la organización.', item: 'usuario', samples: ['Administrador ODISSEA', 'Coordinación del programa'] },
  configuracion: { title: 'Configuración', description: 'Marca, datos legales, notificaciones y funciones de la organización.', item: 'ajuste', samples: ['Identidad visual', 'Privacidad y textos legales', 'Preferencias de correo'] },
  auditoria: { title: 'Auditoría', description: 'Consulta acciones sensibles sin posibilidad de edición.', item: 'registro', samples: ['María Campos publicó una convocatoria', 'Lucía Romero registró un acta', 'Sistema bloqueó un acceso no autorizado'], readonly: true },
  itinerario: { title: 'Mi itinerario', description: 'Continúa las actividades de tu fase actual.', item: 'actividad', samples: ['Propuesta de valor · Completado', 'Validación de mercado · En curso', 'Modelo financiero · Bloqueado'] },
  entregables: { title: 'Entregables', description: 'Prepara, presenta y consulta las revisiones de tus entregables.', item: 'entregable', samples: ['Validación de mercado · En curso', 'Canvas de negocio · Aprobado', 'Plan financiero · No iniciado'] },
  mentorias: { title: 'Mentorías', description: 'Consulta próximas sesiones, actas y acuerdos.', item: 'sesión', samples: ['Revisión del modelo comercial · 4 ago', 'Validación técnica · 18 ago'] },
  calendario: { title: 'Calendario', description: 'Sesiones, eventos y fechas límite en una sola agenda.', item: 'evento', samples: ['30 jul · Taller comercial', '4 ago · Mentoría', '6 ago · Comité mensual'] },
  comunidad: { title: 'Comunidad', description: 'Canales sencillos para compartir anuncios y recursos.', item: 'publicación', samples: ['Canal general · 3 publicaciones nuevas', 'Cohorte ODISSEA · Aviso fijado'] },
  perfil: { title: 'Mi perfil', description: 'Actualiza tus datos y preferencias de notificación.', item: 'dato', samples: ['Datos personales', 'Seguridad', 'Notificaciones'] },
  sesiones: { title: 'Sesiones', description: 'Programa sesiones y registra actas, acuerdos y horas.', item: 'sesión', samples: ['Abyla Robotics · 4 ago', 'Neptuno Secure · 8 ago'] },
  horas: { title: 'Control de horas', description: 'Registra horas justificables asociadas a cada proyecto.', item: 'registro', samples: ['Julio · 8 h', 'Junio · 12 h'] },
}

type FieldType = 'text' | 'textarea' | 'email' | 'url' | 'number' | 'date' | 'datetime-local' | 'select' | 'checkbox' | 'file' | 'color'
interface FormField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  full?: boolean
  options?: Array<{ value: string; label: string }>
  optionKey?: keyof DomainOptions
  placeholder?: string
  min?: number
  max?: number
  step?: string
  createOnly?: boolean
}

const statuses = {
  program: [
    { value: 'draft', label: 'Borrador' }, { value: 'published', label: 'Publicada' },
    { value: 'active', label: 'Activa' }, { value: 'completed', label: 'Finalizada' }, { value: 'archived', label: 'Archivada' },
  ],
  application: [
    { value: 'submitted', label: 'Presentada' }, { value: 'documentation_pending', label: 'Documentación pendiente' },
    { value: 'admitted', label: 'Admitida' }, { value: 'not_admitted', label: 'No admitida' },
    { value: 'under_evaluation', label: 'En evaluación' }, { value: 'selected', label: 'Seleccionada' },
    { value: 'reserve', label: 'Reserva' }, { value: 'rejected', label: 'Rechazada' }, { value: 'withdrawn', label: 'Retirada' },
  ],
  basic: [
    { value: 'planned', label: 'Planificada' }, { value: 'active', label: 'Activa' },
    { value: 'completed', label: 'Completada' }, { value: 'archived', label: 'Archivada' },
  ],
}

const createLabels: Record<string, string> = {
  convocatorias: 'Nueva convocatoria',
  evaluaciones: 'Nueva evaluación',
  cohortes: 'Nueva cohorte',
  mentores: 'Nuevo mentor',
  itinerarios: 'Nuevo itinerario',
  eventos: 'Nuevo evento',
  indicadores: 'Nuevo indicador',
  documentos: 'Nuevo documento',
  informes: 'Generar informe',
  usuarios: 'Invitar usuario',
}

function domainFields(kind: string, editing: boolean): FormField[] {
  const fields: Record<string, FormField[]> = {
    convocatorias: [
      { name: 'program_id', label: 'Programa', type: 'select', optionKey: 'programs', required: true },
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'slug', label: 'Identificador URL', type: 'text', required: true, placeholder: 'convocatoria-2027' },
      { name: 'description', label: 'Descripción', type: 'textarea', full: true },
      { name: 'opens_at', label: 'Apertura', type: 'datetime-local' },
      { name: 'closes_at', label: 'Cierre', type: 'datetime-local' },
      { name: 'places', label: 'Plazas', type: 'number', min: 0, required: true },
      { name: 'status', label: 'Estado', type: 'select', options: statuses.program, required: true },
      { name: 'contact_email', label: 'Correo de contacto', type: 'email' },
      { name: 'privacy_text', label: 'Información de privacidad', type: 'textarea', full: true },
    ],
    candidaturas: [
      { name: 'status', label: 'Estado de revisión', type: 'select', options: statuses.application, required: true, full: true },
    ],
    evaluaciones: [
      { name: 'application_id', label: 'Candidatura', type: 'select', optionKey: 'applications', required: true, createOnly: true },
      { name: 'evaluator_id', label: 'Evaluador', type: 'select', optionKey: 'evaluators', required: true, createOnly: true },
      { name: 'rubric_id', label: 'Rúbrica', type: 'select', optionKey: 'rubrics', required: true },
      { name: 'total_score', label: 'Puntuación total', type: 'number', min: 0, step: '0.01' },
      { name: 'shared_comments', label: 'Comentarios compartidos', type: 'textarea', full: true },
      { name: 'private_comments', label: 'Comentarios internos', type: 'textarea', full: true },
      { name: 'finalized', label: 'Cerrar y bloquear la evaluación', type: 'checkbox', full: true },
    ],
    cohortes: [
      { name: 'program_id', label: 'Programa', type: 'select', optionKey: 'programs', required: true },
      { name: 'call_id', label: 'Convocatoria', type: 'select', optionKey: 'calls' },
      { name: 'name', label: 'Nombre', type: 'text', required: true, full: true },
      { name: 'starts_on', label: 'Fecha de inicio', type: 'date' },
      { name: 'ends_on', label: 'Fecha de fin', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: statuses.basic, required: true },
    ],
    mentores: [
      { name: 'full_name', label: 'Nombre completo', type: 'text', required: true },
      { name: 'modality', label: 'Modalidad', type: 'select', options: [{ value: 'onsite', label: 'Presencial' }, { value: 'online', label: 'Online' }, { value: 'hybrid', label: 'Híbrida' }] },
      { name: 'biography', label: 'Biografía', type: 'textarea', full: true },
      { name: 'languages', label: 'Idiomas', type: 'text', placeholder: 'es, en, fr' },
      { name: 'linkedin_url', label: 'LinkedIn', type: 'url' },
      { name: 'internal_rate', label: 'Tarifa interna por hora', type: 'number', min: 0, step: '0.01' },
      { name: 'status', label: 'Estado', type: 'select', options: [{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }] },
    ],
    itinerarios: [
      { name: 'program_id', label: 'Programa', type: 'select', optionKey: 'programs' },
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'is_template', label: 'Guardar como plantilla reutilizable', type: 'checkbox', full: true },
    ],
    eventos: [
      { name: 'program_id', label: 'Programa', type: 'select', optionKey: 'programs' },
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'event_type', label: 'Tipo de evento', type: 'select', options: [{ value: 'workshop', label: 'Taller' }, { value: 'committee', label: 'Comité' }, { value: 'networking', label: 'Networking' }, { value: 'demo_day', label: 'Demo Day' }, { value: 'other', label: 'Otro' }], required: true },
      { name: 'starts_at', label: 'Inicio', type: 'datetime-local', required: true },
      { name: 'ends_at', label: 'Fin', type: 'datetime-local' },
      { name: 'capacity', label: 'Aforo', type: 'number', min: 0 },
      { name: 'location', label: 'Lugar', type: 'text' },
      { name: 'meeting_url', label: 'Enlace de reunión', type: 'url' },
    ],
    indicadores: [
      { name: 'program_id', label: 'Programa', type: 'select', optionKey: 'programs' },
      { name: 'project_id', label: 'Proyecto', type: 'select', optionKey: 'projects' },
      { name: 'code', label: 'Código', type: 'text', required: true },
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'data_type', label: 'Tipo de dato', type: 'select', options: [{ value: 'number', label: 'Número' }, { value: 'percentage', label: 'Porcentaje' }, { value: 'currency', label: 'Importe' }, { value: 'text', label: 'Texto' }], required: true },
      { name: 'unit', label: 'Unidad', type: 'text' },
      { name: 'target_value', label: 'Valor objetivo', type: 'text' },
      { name: 'frequency', label: 'Frecuencia', type: 'select', options: [{ value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }, { value: 'quarterly', label: 'Trimestral' }, { value: 'annual', label: 'Anual' }] },
      { name: 'source', label: 'Fuente', type: 'text', full: true },
    ],
    documentos: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'category', label: 'Categoría', type: 'text' },
      { name: 'description', label: 'Descripción', type: 'textarea', full: true },
      { name: 'visibility', label: 'Visibilidad', type: 'select', options: [{ value: 'private', label: 'Privado' }, { value: 'members', label: 'Miembros' }, { value: 'public', label: 'Público' }], required: true },
      { name: 'entity_type', label: 'Vincular a', type: 'select', options: [{ value: 'organization', label: 'Organización' }, { value: 'project', label: 'Proyecto' }], required: true },
      { name: 'entity_id', label: 'Proyecto vinculado', type: 'select', optionKey: 'projects' },
      { name: 'folder_path', label: 'Carpeta', type: 'text', placeholder: 'Legal/Bases' },
      { name: 'file', label: editing ? 'Nueva versión del archivo' : 'Archivo', type: 'file', required: !editing, full: true },
    ],
    informes: [
      { name: 'report_type', label: 'Nombre del informe', type: 'text', required: true, full: true },
      { name: 'scope', label: 'Contenido', type: 'select', options: [{ value: 'projects', label: 'Proyectos y progreso' }], required: true },
      { name: 'format', label: 'Formato', type: 'select', options: [{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }], required: true },
    ],
    usuarios: [
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true, createOnly: true },
      { name: 'display_name', label: 'Nombre visible', type: 'text', createOnly: true },
      { name: 'role_id', label: 'Rol', type: 'select', optionKey: 'roles', required: true },
      { name: 'status', label: 'Estado', type: 'select', options: [{ value: 'active', label: 'Activo' }, { value: 'invited', label: 'Invitado' }, { value: 'suspended', label: 'Suspendido' }], required: true },
    ],
    configuracion: [
      { name: 'contact_email', label: 'Correo de contacto', type: 'email' },
      { name: 'email_sender_name', label: 'Remitente de correo', type: 'text' },
      { name: 'primary_color', label: 'Color principal', type: 'color', required: true },
      { name: 'secondary_color', label: 'Color secundario', type: 'color', required: true },
      { name: 'retention_days', label: 'Retención de datos (días)', type: 'number', min: 1 },
      { name: 'legal_notice', label: 'Aviso legal', type: 'textarea', full: true },
      { name: 'privacy_policy', label: 'Política de privacidad', type: 'textarea', full: true },
      { name: 'ai_enabled', label: 'Habilitar funciones de IA', type: 'checkbox', full: true },
    ],
  }
  return (fields[kind] ?? []).filter((field) => !(editing && field.createOnly))
}

function fallbackItems(kind: string): WorkspaceItem[] {
  return (moduleConfig[kind]?.samples ?? []).map((title, index) => ({
    id: `sample-${kind}-${index}`,
    kind,
    title,
    description: 'Primera convocatoria ODISSEA',
    status: index === 1 ? 'En curso' : 'Disponible',
    owner: index % 2 ? 'Coordinación ODISSEA' : 'María Campos',
    updatedAt: new Date(2026, 6, index + 24).toISOString(),
  }))
}

export function ModulePage({ kind }: { kind: string }) {
  const config = moduleConfig[kind] ?? { title: 'Módulo', description: 'Área funcional de ODISSEA HUB.', item: 'registro' }
  const { role } = useAuth()
  const domainBacked = isSupabaseConfigured && domainBackedKinds.has(kind)
  const roleReadOnly = (role === 'participant' && kind === 'documentos') || (role === 'evaluator' && kind === 'candidaturas')
  const readOnly = Boolean(config.readonly) || roleReadOnly
  const [rows, setRows] = useState<WorkspaceItem[]>([])
  const [options, setOptions] = useState<DomainOptions>({})
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [editing, setEditing] = useState<WorkspaceItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<WorkspaceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const data = domainBacked ? await listDomainItems(kind) : await listWorkspaceItems(kind, undefined, fallbackItems(kind))
    setRows(data)
  }, [domainBacked, kind])

  useEffect(() => {
    let active = true
    const rowsRequest = domainBacked ? listDomainItems(kind) : listWorkspaceItems(kind, undefined, fallbackItems(kind))
    Promise.all([rowsRequest, domainBacked && !readOnly ? listDomainOptions() : Promise.resolve({})])
      .then(([rowData, optionData]) => {
        if (!active) return
        setRows(rowData)
        setOptions(optionData)
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar los datos.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [domainBacked, kind, readOnly])

  const filtered = useMemo(() => rows.filter((row) => {
    const matchesText = `${row.title} ${row.description} ${row.owner}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (status === 'Todos' || row.status === status)
  }), [query, rows, status])

  const closeEditor = () => {
    setCreating(false)
    setEditing(null)
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (domainBacked) {
        const fields = domainFields(kind, Boolean(editing))
        const values: DomainValues = {}
        for (const field of fields) {
          if (field.type === 'file') continue
          values[field.name] = field.type === 'checkbox' ? formData.get(field.name) === 'on' : String(formData.get(field.name) ?? '')
        }
        const selectedFile = formData.get('file')
        await saveDomainItem(kind, editing?.id, values, selectedFile instanceof File && selectedFile.size ? selectedFile : undefined)
        await refresh()
      } else {
        const saved = await saveWorkspaceItem({
          id: editing?.id,
          kind,
          title: String(formData.get('title')),
          description: String(formData.get('description') ?? ''),
          status: String(formData.get('status')) as WorkspaceItem['status'],
          owner: String(formData.get('owner')),
          dueDate: String(formData.get('dueDate') ?? '') || undefined,
        })
        setRows((current) => editing ? current.map((row) => row.id === saved.id ? saved : row) : [saved, ...current])
      }
      closeEditor()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se ha podido guardar.')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    setError('')
    try {
      if (domainBacked) {
        await removeDomainItem(kind, deleting)
        await refresh()
      } else {
        await removeWorkspaceItem(deleting)
        setRows((current) => current.filter((row) => row.id !== deleting.id))
      }
      setDeleting(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se ha podido eliminar.')
    } finally {
      setBusy(false)
    }
  }

  const download = async (row: WorkspaceItem) => {
    setBusy(true)
    setError('')
    try {
      const url = await getDomainDownloadUrl(row)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'No se ha podido descargar el archivo.')
    } finally {
      setBusy(false)
    }
  }

  const canCreate = !readOnly && !['candidaturas', 'configuracion'].includes(kind) && role !== 'evaluator'
  const canEdit = (row: WorkspaceItem) => !readOnly && kind !== 'informes' && Boolean(row)
  const canDelete = !readOnly && !['candidaturas', 'configuracion'].includes(kind) && role !== 'evaluator'
  const actionLabel = createLabels[kind] ?? `Nuevo ${config.item}`
  const actionIcon = kind === 'usuarios' ? <UserPlus size={17} /> : kind === 'configuracion' ? <Settings size={17} /> : <Plus size={17} />
  const headerAction = readOnly ? undefined : kind === 'configuracion'
    ? <Button disabled={!rows.length} onClick={() => rows[0] && setEditing(rows[0])} icon={actionIcon}>Editar configuración</Button>
    : canCreate ? <Button onClick={() => setCreating(true)} icon={actionIcon}>{actionLabel}</Button> : undefined

  return (
    <>
      <div className="breadcrumb">ODISSEA HUB / <span>{config.title}</span></div>
      <PageHeader title={config.title} description={config.description} action={headerAction} />
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} />
            <input className="field" style={{ paddingLeft: 39 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${config.item}...`} aria-label={`Buscar ${config.item}`} />
          </div>
          <select className="select" style={{ width: 170 }} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado">
            {['Todos', 'Disponible', 'En curso', 'Completado', 'Archivado'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="empty-state"><p>Cargando datos…</p></div>
        ) : filtered.length ? (
          <table>
            <thead><tr><th>Nombre</th><th>Estado</th><th>Actualización</th><th>Responsable</th>{!readOnly && <th><span className="sr-only">Acciones</span></th>}</tr></thead>
            <tbody>{filtered.map((row) => (
              <tr key={row.id}>
                <td><div className="table-title">{row.title}</div><div className="table-subtitle">{row.description || 'Sin descripción'}</div></td>
                <td data-label="Estado"><span className={`badge badge--${row.status === 'En curso' ? 'warning' : row.status === 'Archivado' ? 'neutral' : 'success'}`}>{row.status}</span></td>
                <td data-label="Actualización"><CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{new Date(row.updatedAt).toLocaleDateString('es-ES')}</td>
                <td data-label="Responsable">{row.owner}</td>
                {!readOnly && (
                  <td data-label="Acciones"><div className="row-actions">
                    {domainBacked && ['documentos', 'informes'].includes(kind) && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void download(row)} icon={<Download size={14} />}>Descargar</Button>}
                    {canEdit(row) && <Button size="sm" variant="ghost" onClick={() => setEditing(row)} icon={<Pencil size={14} />}>{kind === 'candidaturas' ? 'Revisar' : 'Editar'}</Button>}
                    {canDelete && <Button size="sm" variant="danger" onClick={() => setDeleting(row)} icon={<Trash2 size={14} />}>{['convocatorias', 'cohortes', 'mentores', 'usuarios'].includes(kind) ? 'Archivar' : 'Eliminar'}</Button>}
                  </div></td>
                )}
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <EmptyState title={`No hay ${config.title.toLowerCase()} con estos filtros`} description={readOnly ? 'No existen registros visibles para tu rol.' : 'Cambia la búsqueda o crea el primer registro.'} action={canCreate && <Button onClick={() => setCreating(true)} icon={<FileText size={16} />}>{actionLabel}</Button>} />
        )}
      </div>
      <div className="notice" style={{ marginTop: 18 }}><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 7 }} />{domainBacked ? readOnly ? 'Registro inmutable obtenido de Supabase.' : 'Acciones conectadas a las tablas oficiales de Supabase y protegidas por permisos.' : 'Los cambios se guardan de forma persistente y respetan los permisos de tu organización.'}</div>

      <Modal title={editing ? `${kind === 'candidaturas' ? 'Revisar' : 'Editar'} ${config.item}` : actionLabel} open={creating || Boolean(editing)} onClose={closeEditor}>
        <form key={`${kind}-${editing?.id ?? 'new'}`} onSubmit={submit}>
          {domainBacked ? (
            <div className="form-grid">
              {domainFields(kind, Boolean(editing)).map((field) => <DomainField key={field.name} field={field} value={editing?.metadata?.[field.name]} options={options} />)}
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group form-group--full"><label htmlFor="workspace-title">Nombre *</label><input className="field" id="workspace-title" name="title" defaultValue={editing?.title} required /></div>
              <div className="form-group form-group--full"><label htmlFor="workspace-description">Descripción</label><textarea className="textarea" id="workspace-description" name="description" defaultValue={editing?.description} /></div>
              <div className="form-group"><label htmlFor="workspace-status">Estado</label><select className="select" id="workspace-status" name="status" defaultValue={editing?.status ?? 'Disponible'}>{['Disponible', 'En curso', 'Completado', 'Archivado'].map((value) => <option key={value}>{value}</option>)}</select></div>
              <div className="form-group"><label htmlFor="workspace-owner">Responsable *</label><input className="field" id="workspace-owner" name="owner" defaultValue={editing?.owner ?? 'Coordinación ODISSEA'} required /></div>
              <div className="form-group form-group--full"><label htmlFor="workspace-due">Fecha objetivo</label><input className="field" id="workspace-due" name="dueDate" type="date" defaultValue={editing?.dueDate} /></div>
            </div>
          )}
          <div className="form-actions"><Button type="button" variant="secondary" onClick={closeEditor}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : kind === 'informes' ? 'Generar y guardar' : kind === 'usuarios' && !editing ? 'Enviar invitación' : 'Guardar'}</Button></div>
        </form>
      </Modal>

      <Modal title={`${['convocatorias', 'cohortes', 'mentores', 'usuarios'].includes(kind) ? 'Archivar' : 'Eliminar'} ${config.item}`} open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <p>Se procesará <strong>{deleting?.title}</strong>. La acción quedará registrada en la auditoría.</p>
        <div className="form-actions"><Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={confirmDelete}>{busy ? 'Procesando…' : 'Confirmar'}</Button></div>
      </Modal>
    </>
  )
}

function DomainField({ field, value, options }: { field: FormField; value: unknown; options: DomainOptions }) {
  const id = `domain-${field.name}`
  const className = `form-group${field.full ? ' form-group--full' : ''}`
  const fieldOptions = field.options ?? (field.optionKey ? options[field.optionKey] ?? [] : [])
  if (field.type === 'checkbox') {
    return <label className={`checkbox-row ${field.full ? 'form-group--full' : ''}`}><input id={id} name={field.name} type="checkbox" defaultChecked={Boolean(value)} /><span>{field.label}</span></label>
  }
  if (field.type === 'textarea') {
    return <div className={className}><label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label><textarea className="textarea" id={id} name={field.name} defaultValue={String(value ?? '')} required={field.required} placeholder={field.placeholder} /></div>
  }
  if (field.type === 'select') {
    return <div className={className}><label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label><select className="select" id={id} name={field.name} defaultValue={String(value ?? '')} required={field.required}><option value="">{field.required ? 'Selecciona una opción' : 'Sin asignar'}</option>{fieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
  }
  return <div className={className}><label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label><input className="field" id={id} name={field.name} type={field.type} defaultValue={field.type === 'file' ? undefined : String(value ?? '')} required={field.required} placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} /></div>
}

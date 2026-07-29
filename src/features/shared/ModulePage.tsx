import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, CheckCircle2, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { listWorkspaceItems, removeWorkspaceItem, saveWorkspaceItem } from '../../lib/repository'
import type { WorkspaceItem } from '../../types/domain'

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
  informes: { title: 'Informes', description: 'Genera vistas auditables con filtros y fecha de creación.', item: 'informe', samples: ['Informe mensual · Julio', 'Seguimiento de indicadores · T2'] },
  usuarios: { title: 'Usuarios y permisos', description: 'Gestiona membresías, roles y permisos por organización.', item: 'usuario', samples: ['Administrador ODISSEA', 'Coordinación del programa'] },
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

function fallbackItems(kind: string): WorkspaceItem[] {
  const samples = moduleConfig[kind]?.samples ?? []
  return samples.map((title, index) => ({
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
  const item = moduleConfig[kind] ?? { title: 'Módulo', description: 'Área funcional de ODISSEA HUB.', item: 'registro' }
  const [rows, setRows] = useState<WorkspaceItem[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [editing, setEditing] = useState<WorkspaceItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<WorkspaceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listWorkspaceItems(kind, undefined, fallbackItems(kind))
      .then((data) => {
        if (!active) return
        setRows(data)
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar los datos.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [kind])

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
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const saved = await saveWorkspaceItem({
        id: editing?.id,
        kind,
        title: String(data.get('title')),
        description: String(data.get('description') ?? ''),
        status: String(data.get('status')) as WorkspaceItem['status'],
        owner: String(data.get('owner')),
        dueDate: String(data.get('dueDate') ?? '') || undefined,
      })
      setRows((current) => editing
        ? current.map((row) => row.id === saved.id ? saved : row)
        : [saved, ...current])
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
    <>
      <div className="breadcrumb">ODISSEA HUB / <span>{item.title}</span></div>
      <PageHeader
        title={item.title}
        description={item.description}
        action={!item.readonly && <Button onClick={() => setCreating(true)} icon={<Plus size={17} />}>Nuevo {item.item}</Button>}
      />
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} />
            <input className="field" style={{ paddingLeft: 39 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${item.item}...`} aria-label={`Buscar ${item.item}`} />
          </div>
          <select className="select" style={{ width: 170 }} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado">
            {['Todos', 'Disponible', 'En curso', 'Completado', 'Archivado'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="empty-state"><p>Cargando datos…</p></div>
        ) : filtered.length ? (
          <table>
            <thead><tr><th>Nombre</th><th>Estado</th><th>Actualización</th><th>Responsable</th>{!item.readonly && <th><span className="sr-only">Acciones</span></th>}</tr></thead>
            <tbody>{filtered.map((row) => (
              <tr key={row.id}>
                <td><div className="table-title">{row.title}</div><div className="table-subtitle">{row.description || 'Sin descripción'}</div></td>
                <td data-label="Estado"><span className={`badge badge--${row.status === 'En curso' ? 'warning' : row.status === 'Archivado' ? 'neutral' : 'success'}`}>{row.status}</span></td>
                <td data-label="Actualización"><CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{new Date(row.updatedAt).toLocaleDateString('es-ES')}</td>
                <td data-label="Responsable">{row.owner}</td>
                {!item.readonly && (
                  <td data-label="Acciones"><div className="row-actions">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(row)} icon={<Pencil size={14} />}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(row)} icon={<Trash2 size={14} />}>Eliminar</Button>
                  </div></td>
                )}
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <EmptyState title={`No hay ${item.title.toLowerCase()} con estos filtros`} description="Cambia la búsqueda o crea el primer registro." action={!item.readonly && <Button onClick={() => setCreating(true)} icon={<FileText size={16} />}>Crear ahora</Button>} />
        )}
      </div>
      <div className="notice" style={{ marginTop: 18 }}><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 7 }} />Los cambios se guardan de forma persistente y respetan los permisos de tu organización.</div>

      <Modal title={editing ? `Editar ${item.item}` : `Nuevo ${item.item}`} open={creating || Boolean(editing)} onClose={closeEditor}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group form-group--full"><label htmlFor="workspace-title">Nombre *</label><input className="field" id="workspace-title" name="title" defaultValue={editing?.title} required /></div>
            <div className="form-group form-group--full"><label htmlFor="workspace-description">Descripción</label><textarea className="textarea" id="workspace-description" name="description" defaultValue={editing?.description} /></div>
            <div className="form-group"><label htmlFor="workspace-status">Estado</label><select className="select" id="workspace-status" name="status" defaultValue={editing?.status ?? 'Disponible'}>{['Disponible', 'En curso', 'Completado', 'Archivado'].map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="form-group"><label htmlFor="workspace-owner">Responsable *</label><input className="field" id="workspace-owner" name="owner" defaultValue={editing?.owner ?? 'Coordinación ODISSEA'} required /></div>
            <div className="form-group form-group--full"><label htmlFor="workspace-due">Fecha objetivo</label><input className="field" id="workspace-due" name="dueDate" type="date" defaultValue={editing?.dueDate} /></div>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={closeEditor}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button></div>
        </form>
      </Modal>

      <Modal title={`Eliminar ${item.item}`} open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <p>Se eliminará <strong>{deleting?.title}</strong>. Esta acción dejará de mostrar el registro en la aplicación.</p>
        <div className="form-actions"><Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={confirmDelete}>{busy ? 'Eliminando…' : 'Eliminar'}</Button></div>
      </Modal>
    </>
  )
}

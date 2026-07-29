import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { createProgram, duplicateProgram, listPrograms, removeProgram, updateProgram } from '../../lib/repository'
import type { Program } from '../../types/domain'

const tone = (status: Program['status']) => status === 'Activo' ? 'success' : status === 'Publicado' ? 'info' : status === 'Finalizado' ? 'neutral' : 'warning'

export function ProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [programs, setPrograms] = useState<Program[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [open, setOpen] = useState(searchParams.get('new') === '1')
  const [editing, setEditing] = useState<Program | null>(null)
  const [deleting, setDeleting] = useState<Program | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listPrograms()
      .then((data) => active && setPrograms(data))
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar los programas.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => programs.filter((program) => (
    program.name.toLowerCase().includes(query.toLowerCase())
    && (status === 'Todos' || program.status === status)
  )), [programs, query, status])

  const closeForm = () => {
    setOpen(false)
    setEditing(null)
    setError('')
  }

  const submitProgram = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (editing) {
        const saved = await updateProgram({
          ...editing,
          name: String(data.get('name')),
          places: Number(data.get('places')),
          status: String(data.get('status')) as Program['status'],
          startDate: String(data.get('startDate')),
          endDate: String(data.get('endDate')),
        })
        setPrograms((current) => current.map((program) => program.id === saved.id ? saved : program))
      } else {
        const saved = await createProgram({
          name: String(data.get('name')),
          places: Number(data.get('places')),
          startDate: String(data.get('startDate')),
          endDate: String(data.get('endDate')),
        })
        setPrograms((current) => [...current, saved])
      }
      closeForm()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se ha podido guardar el programa.')
    } finally {
      setBusy(false)
    }
  }

  const duplicate = async (program: Program) => {
    setBusy(true)
    setMenuId(null)
    setError('')
    try {
      const saved = await duplicateProgram(program)
      setPrograms((current) => [...current, saved])
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : 'No se ha podido duplicar.')
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (program: Program, nextStatus: Program['status']) => {
    setBusy(true)
    setMenuId(null)
    setError('')
    try {
      const saved = await updateProgram({ ...program, status: nextStatus })
      setPrograms((current) => current.map((item) => item.id === saved.id ? saved : item))
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se ha podido cambiar el estado.')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    setError('')
    try {
      await removeProgram(deleting.id)
      setPrograms((current) => current.filter((program) => program.id !== deleting.id))
      setDeleting(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se ha podido eliminar el programa.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="breadcrumb">Administración / <span>Programas</span></div>
      <PageHeader title="Programas" description="Configura convocatorias, cohortes e itinerarios desde una única vista." action={<Button onClick={() => setOpen(true)} icon={<Plus size={17} />}>Nuevo programa</Button>} />
      {error && <div className="notice notice--danger" role="alert">{error}</div>}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} /><input className="field" style={{ paddingLeft: 39 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar programa..." aria-label="Buscar programa" /></div>
          <select className="select" style={{ width: 190 }} aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)}>
            {['Todos', 'Borrador', 'Publicado', 'Activo', 'Finalizado'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        {loading ? <div className="empty-state"><p>Cargando programas…</p></div> : (
          <table>
            <thead><tr><th>Programa</th><th>Estado</th><th>Plazas</th><th>Proyectos</th><th>Progreso</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{filtered.map((program) => (
              <tr key={program.id}>
                <td><div className="table-title">{program.name}</div><div className="table-subtitle">{program.startDate || 'Sin fecha'} — {program.endDate || 'Sin fecha'}</div></td>
                <td data-label="Estado"><Badge tone={tone(program.status)}>{program.status}</Badge></td>
                <td data-label="Plazas">{program.places}</td>
                <td data-label="Proyectos">{program.projects}</td>
                <td data-label="Progreso"><ProgressBar value={program.progress} /></td>
                <td data-label="Acciones"><div className="row-actions action-menu-wrap">
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => duplicate(program)} icon={<Copy size={15} />}>Duplicar</Button>
                  <button className="icon-button" aria-label={`Más opciones para ${program.name}`} aria-expanded={menuId === program.id} onClick={() => setMenuId((current) => current === program.id ? null : program.id)}><MoreHorizontal size={17} /></button>
                  {menuId === program.id && (
                    <div className="action-menu" role="menu">
                      <button role="menuitem" onClick={() => { setEditing(program); setMenuId(null) }}><Pencil size={14} />Editar</button>
                      <button role="menuitem" onClick={() => changeStatus(program, 'Publicado')}>Publicar</button>
                      <button role="menuitem" onClick={() => changeStatus(program, 'Activo')}>Activar</button>
                      <button role="menuitem" onClick={() => changeStatus(program, 'Finalizado')}>Finalizar</button>
                      <button role="menuitem" className="danger-text" onClick={() => { setDeleting(program); setMenuId(null) }}><Trash2 size={14} />Eliminar</button>
                    </div>
                  )}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {!loading && !filtered.length && <div className="empty-state"><p>No hay programas con estos filtros.</p></div>}
      </div>

      <Modal title={editing ? 'Editar programa' : 'Crear programa'} open={open || Boolean(editing)} onClose={closeForm}>
        <form onSubmit={submitProgram}>
          <div className="form-grid">
            <div className="form-group form-group--full"><label htmlFor="name">Nombre *</label><input className="field" id="name" name="name" defaultValue={editing?.name} required placeholder="Ej. ODISSEA Crece 2027" /></div>
            <div className="form-group"><label htmlFor="places">Número de plazas *</label><input className="field" id="places" name="places" type="number" min="1" defaultValue={editing?.places ?? 8} required /></div>
            <div className="form-group"><label htmlFor="status">Estado</label><select className="select" id="status" name="status" defaultValue={editing?.status ?? 'Borrador'} disabled={!editing}>{['Borrador', 'Publicado', 'Activo', 'Finalizado'].map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="form-group"><label htmlFor="startDate">Fecha de inicio *</label><input className="field" id="startDate" name="startDate" type="date" defaultValue={editing?.startDate} required /></div>
            <div className="form-group"><label htmlFor="endDate">Fecha de fin *</label><input className="field" id="endDate" name="endDate" type="date" defaultValue={editing?.endDate} required /></div>
          </div>
          <div className="form-actions"><Button variant="secondary" type="button" onClick={closeForm}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear en borrador'}</Button></div>
        </form>
      </Modal>

      <Modal title="Eliminar programa" open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <p>Se archivará <strong>{deleting?.name}</strong> y dejará de aparecer en el listado.</p>
        <div className="form-actions"><Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={confirmDelete}>{busy ? 'Eliminando…' : 'Eliminar'}</Button></div>
      </Modal>
    </>
  )
}

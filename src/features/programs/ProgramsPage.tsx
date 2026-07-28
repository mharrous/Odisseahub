import { useMemo, useState, type FormEvent } from 'react'
import { Copy, MoreHorizontal, Plus, Search } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { initialPrograms } from '../../data/demo'
import { loadLocal, makeId, saveLocal } from '../../lib/storage'
import type { Program } from '../../types/domain'

const tone = (status: Program['status']) => status === 'Activo' ? 'success' : status === 'Publicado' ? 'info' : 'neutral'

export function ProgramsPage() {
  const [programs, setPrograms] = useState(() => loadLocal<Program[]>('odissea-programs', initialPrograms))
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => programs.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [programs, query])

  const createProgram = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next: Program = {
      id: makeId('program'),
      name: String(data.get('name')),
      entity: 'Cámara de Comercio de Ceuta',
      status: 'Borrador',
      places: Number(data.get('places')),
      projects: 0,
      progress: 0,
      startDate: String(data.get('startDate')),
      endDate: String(data.get('endDate')),
      color: '#13B8A6',
    }
    const updated = [...programs, next]
    setPrograms(updated)
    saveLocal('odissea-programs', updated)
    setOpen(false)
  }

  const duplicate = (program: Program) => {
    const updated = [...programs, { ...program, id: makeId('program'), name: `${program.name} — Copia`, status: 'Borrador' as const, projects: 0, progress: 0 }]
    setPrograms(updated)
    saveLocal('odissea-programs', updated)
  }

  return (
    <>
      <div className="breadcrumb">Administración / <span>Programas</span></div>
      <PageHeader title="Programas" description="Configura convocatorias, cohortes e itinerarios desde una única vista." action={<Button onClick={() => setOpen(true)} icon={<Plus size={17} />}>Nuevo programa</Button>} />
      <div className="table-card">
        <div className="table-toolbar"><div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} /><input className="field" style={{ paddingLeft: 39 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar programa..." aria-label="Buscar programa" /></div><select className="select" style={{ width: 170 }} aria-label="Filtrar por estado"><option>Todos los estados</option></select></div>
        <table>
          <thead><tr><th>Programa</th><th>Estado</th><th>Plazas</th><th>Proyectos</th><th>Progreso</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{filtered.map((program) => (
            <tr key={program.id}>
              <td><div className="table-title">{program.name}</div><div className="table-subtitle">{program.startDate} — {program.endDate}</div></td>
              <td data-label="Estado"><Badge tone={tone(program.status)}>{program.status}</Badge></td>
              <td data-label="Plazas">{program.places}</td>
              <td data-label="Proyectos">{program.projects}</td>
              <td data-label="Progreso"><ProgressBar value={program.progress} /></td>
              <td data-label="Acciones"><div className="row-actions"><Button size="sm" variant="ghost" onClick={() => duplicate(program)} icon={<Copy size={15} />}>Duplicar</Button><button className="icon-button" aria-label={`Más opciones para ${program.name}`}><MoreHorizontal size={17} /></button></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Modal title="Crear programa" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={createProgram}>
          <div className="form-grid">
            <div className="form-group form-group--full"><label htmlFor="name">Nombre *</label><input className="field" id="name" name="name" required placeholder="Ej. ODISSEA Crece 2027" /></div>
            <div className="form-group"><label htmlFor="places">Número de plazas *</label><input className="field" id="places" name="places" type="number" min="1" defaultValue="8" required /></div>
            <div className="form-group"><label htmlFor="status">Estado inicial</label><input className="field" id="status" value="Borrador" disabled /></div>
            <div className="form-group"><label htmlFor="startDate">Fecha de inicio *</label><input className="field" id="startDate" name="startDate" type="date" required /></div>
            <div className="form-group"><label htmlFor="endDate">Fecha de fin *</label><input className="field" id="endDate" name="endDate" type="date" required /></div>
          </div>
          <div className="form-actions"><Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Crear en borrador</Button></div>
        </form>
      </Modal>
    </>
  )
}

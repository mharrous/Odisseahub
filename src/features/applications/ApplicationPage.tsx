import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, Download, FileUp, Save } from 'lucide-react'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/Button'
import type { ApplicationDraft } from '../../types/domain'
import { loadLocal, saveLocal } from '../../lib/storage'

const emptyDraft: ApplicationDraft = { projectName: '', contactName: '', email: '', summary: '', consent: false, status: 'draft' }

export function ApplicationPage() {
  const [draft, setDraft] = useState(() => loadLocal<ApplicationDraft>('odissea-application', emptyDraft))
  const [saved, setSaved] = useState(false)

  const update = (key: keyof ApplicationDraft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }))
  const save = () => {
    saveLocal('odissea-application', draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const completed: ApplicationDraft = {
      ...draft,
      status: 'submitted',
      registration: `ODI-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      submittedAt: new Date().toISOString(),
    }
    setDraft(completed)
    saveLocal('odissea-application', completed)
  }
  const downloadReceipt = () => {
    const text = `RESGUARDO DE PRESENTACIÓN\nODISSEA HUB\n\nRegistro: ${draft.registration}\nProyecto: ${draft.projectName}\nTitular: ${draft.contactName}\nFecha: ${new Date(draft.submittedAt ?? '').toLocaleString('es-ES')}\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${draft.registration}-resguardo.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (draft.status === 'submitted') {
    return (
      <div className="application-shell">
        <header className="application-head"><Brand /><span className="badge badge--success">Presentada</span></header>
        <main className="application-main">
          <section className="card success-panel">
            <span className="success-icon"><Check size={30} /></span>
            <span className="eyebrow">Candidatura registrada</span>
            <h1>Tu proyecto ya está en ruta</h1>
            <p className="muted">Hemos registrado la candidatura de <strong>{draft.projectName}</strong>. Conserva el número de registro para futuras consultas.</p>
            <div className="card" style={{ margin: '25px auto', maxWidth: 420, background: '#f8fafc' }}><span className="muted" style={{ fontSize: '.7rem' }}>Número de registro</span><h2 style={{ margin: '5px 0 0' }}>{draft.registration}</h2></div>
            <Button onClick={downloadReceipt} icon={<Download size={17} />}>Descargar resguardo</Button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="application-shell">
      <header className="application-head"><Brand /><span className="muted" style={{ fontSize: '.75rem' }}>{saved ? 'Borrador guardado' : 'Guardado automático disponible'}</span></header>
      <main className="application-main">
        <span className="eyebrow">Primera convocatoria ODISSEA</span>
        <h1 style={{ margin: '8px 0' }}>Presenta tu candidatura</h1>
        <p className="muted">Completa la información básica. Podrás guardar el borrador antes de presentarlo.</p>
        <div className="application-steps"><span className="app-step active">01 · Proyecto</span><span className="app-step active">02 · Documentación</span><span className="app-step">03 · Presentación</span></div>
        <form className="card" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="projectName">Nombre del proyecto *</label><input className="field" id="projectName" value={draft.projectName} onChange={(event) => update('projectName', event.target.value)} required /></div>
            <div className="form-group"><label htmlFor="contactName">Persona de contacto *</label><input className="field" id="contactName" value={draft.contactName} onChange={(event) => update('contactName', event.target.value)} required /></div>
            <div className="form-group form-group--full"><label htmlFor="email">Correo electrónico *</label><input className="field" id="email" type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} required /></div>
            <div className="form-group form-group--full"><label htmlFor="summary">Resumen del proyecto *</label><textarea className="textarea" id="summary" minLength={40} maxLength={1000} value={draft.summary} onChange={(event) => update('summary', event.target.value)} required /><span className="form-hint">{draft.summary.length}/1000 · Explica el problema, la solución y su componente tecnológico.</span></div>
            <div className="form-group form-group--full">
              <label htmlFor="file">Documento del proyecto *</label>
              <input className="field" style={{ paddingTop: 10 }} id="file" type="file" accept=".pdf,.doc,.docx" onChange={(event: ChangeEvent<HTMLInputElement>) => update('fileName', event.target.files?.[0]?.name ?? '')} required={!draft.fileName} />
              <span className="form-hint"><FileUp size={13} style={{ verticalAlign: 'middle' }} /> PDF o Word, máximo indicado por la configuración de producción. {draft.fileName && `Seleccionado: ${draft.fileName}`}</span>
            </div>
            <label className="checkbox-row form-group--full"><input type="checkbox" checked={draft.consent} onChange={(event) => update('consent', event.target.checked)} required /><span>Confirmo que la información es correcta y acepto el tratamiento de datos descrito en la política de privacidad. *</span></label>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={save} icon={<Save size={16} />}>Guardar borrador</Button><Button type="submit" icon={<Check size={16} />}>Presentar candidatura</Button></div>
        </form>
      </main>
    </div>
  )
}

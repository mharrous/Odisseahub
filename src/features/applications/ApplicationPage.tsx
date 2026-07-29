import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, Download, FileUp, Save } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import type { ApplicationDraft, PublicCall, SubmittedApplication } from '../../types/domain'
import { getPublicCall, loadRemoteApplicationDraft, saveRemoteApplication, submitRemoteApplication } from '../../lib/applications'
import { isSupabaseConfigured } from '../../lib/supabase'
import { loadLocal, saveLocal } from '../../lib/storage'

const emptyDraft: ApplicationDraft = { projectName: '', contactName: '', email: '', summary: '', consent: false, status: 'draft' }

export function ApplicationPage() {
  const { slug = '' } = useParams()
  const [call, setCall] = useState<PublicCall | null>(null)
  const [draft, setDraft] = useState<ApplicationDraft>(() => isSupabaseConfigured ? emptyDraft : loadLocal<ApplicationDraft>('mentoria-application', emptyDraft))
  const [file, setFile] = useState<File | undefined>()
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPublicCall(slug)
      .then(async (publicCall) => {
        if (!active) return
        setCall(publicCall)
        if (publicCall && isSupabaseConfigured) {
          const remoteDraft = await loadRemoteApplicationDraft(publicCall)
          if (active && remoteDraft) setDraft(remoteDraft)
        }
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se ha podido iniciar la candidatura.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug])

  const update = (key: keyof ApplicationDraft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      if (isSupabaseConfigured) {
        if (!call) throw new Error('La convocatoria no está disponible.')
        await saveRemoteApplication(call, draft, file)
      } else {
        saveLocal('mentoria-application', draft)
      }
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se ha podido guardar el borrador.')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isSupabaseConfigured) {
        if (!call) throw new Error('La convocatoria no está disponible.')
        const result = await submitRemoteApplication(call, draft, file)
        setSubmitted(result)
      } else {
        const completed: SubmittedApplication = {
          id: 'demo-application',
          registration: `MEN-DEMO-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
          projectName: draft.projectName,
          contactName: draft.contactName,
          submittedAt: new Date().toISOString(),
        }
        setSubmitted(completed)
        saveLocal('mentoria-application', { ...draft, status: 'submitted', registration: completed.registration, submittedAt: completed.submittedAt })
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se ha podido presentar la candidatura.')
    } finally {
      setBusy(false)
    }
  }

  const downloadReceipt = () => {
    if (!submitted) return
    const text = `RESGUARDO DE PRESENTACIÓN\nMentoría\n\nRegistro: ${submitted.registration}\nIdentificador: ${submitted.id}\nProyecto: ${submitted.projectName}\nTitular: ${submitted.contactName}\nFecha: ${new Date(submitted.submittedAt).toLocaleString('es-ES')}\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${submitted.registration}-resguardo.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="application-shell"><div className="empty-state"><p>Preparando candidatura segura…</p></div></div>
  if (!call) return <div className="application-shell"><EmptyState title="Convocatoria no disponible" description={error || 'La convocatoria no existe o está cerrada.'} /></div>

  if (submitted) {
    return (
      <div className="application-shell">
        <header className="application-head"><Brand /><span className="badge badge--success">Presentada</span></header>
        <main className="application-main">
          <section className="card success-panel">
            <span className="success-icon"><Check size={30} /></span>
            <span className="eyebrow">Candidatura registrada</span>
            <h1>Tu proyecto ya está registrado</h1>
            <p className="muted">La candidatura de <strong>{submitted.projectName}</strong> se ha guardado en Mentoría. Conserva el número de registro.</p>
            <div className="card" style={{ margin: '25px auto', maxWidth: 420, background: '#f8fafc' }}><span className="muted" style={{ fontSize: '.7rem' }}>Número de registro</span><h2 style={{ margin: '5px 0 0' }}>{submitted.registration}</h2></div>
            <Button onClick={downloadReceipt} icon={<Download size={17} />}>Descargar resguardo</Button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="application-shell">
      <header className="application-head"><Brand /><span className="muted" style={{ fontSize: '.75rem' }}>{saved ? isSupabaseConfigured ? 'Borrador guardado en Supabase' : 'Borrador guardado' : 'Guardado seguro disponible'}</span></header>
      <main className="application-main">
        <span className="eyebrow">{call.name}</span>
        <h1 style={{ margin: '8px 0' }}>Presenta tu candidatura</h1>
        <p className="muted">Completa la información básica. El documento y el borrador se almacenan de forma privada.</p>
        <div className="application-steps"><span className="app-step active">01 · Proyecto</span><span className="app-step active">02 · Documentación</span><span className="app-step">03 · Presentación</span></div>
        {error && <div className="notice notice--danger" role="alert">{error}</div>}
        <form className="card" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="projectName">Nombre del proyecto *</label><input className="field" id="projectName" value={draft.projectName} onChange={(event) => update('projectName', event.target.value)} required /></div>
            <div className="form-group"><label htmlFor="contactName">Persona de contacto *</label><input className="field" id="contactName" value={draft.contactName} onChange={(event) => update('contactName', event.target.value)} required /></div>
            <div className="form-group form-group--full"><label htmlFor="email">Correo electrónico *</label><input className="field" id="email" type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} required /></div>
            <div className="form-group form-group--full"><label htmlFor="summary">Resumen del proyecto *</label><textarea className="textarea" id="summary" minLength={40} maxLength={1000} value={draft.summary} onChange={(event) => update('summary', event.target.value)} required /><span className="form-hint">{draft.summary.length}/1000 · Explica el problema, la solución y su componente tecnológico.</span></div>
            <div className="form-group form-group--full">
              <label htmlFor="file">Documento del proyecto *</label>
              <input className="field" style={{ paddingTop: 10 }} id="file" type="file" accept=".pdf,.doc,.docx" onChange={(event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0]; setFile(selected); update('fileName', selected?.name ?? '') }} required={!draft.fileName} />
              <span className="form-hint"><FileUp size={13} style={{ verticalAlign: 'middle' }} /> PDF o Word, máximo 10 MB. {draft.fileName && `Seleccionado: ${draft.fileName}`}</span>
            </div>
            <label className="checkbox-row form-group--full"><input type="checkbox" checked={draft.consent} onChange={(event) => update('consent', event.target.checked)} required /><span>Confirmo que la información es correcta y acepto el tratamiento de datos descrito en la política de privacidad. *</span></label>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={save} disabled={busy} icon={<Save size={16} />}>{busy ? 'Guardando…' : 'Guardar borrador'}</Button><Button type="submit" disabled={busy} icon={<Check size={16} />}>{busy ? 'Presentando…' : 'Presentar candidatura'}</Button></div>
        </form>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { getPublicCall } from '../../lib/applications'
import type { PublicCall } from '../../types/domain'

export function CallDetailPage() {
  const { slug = '' } = useParams()
  const [call, setCall] = useState<PublicCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPublicCall(slug)
      .then((data) => {
        if (!active) return
        setCall(data)
        if (!data) setError('La convocatoria no existe o ya no está publicada.')
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar la convocatoria.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug])

  if (loading) return <div className="public-shell"><div className="empty-state"><p>Cargando convocatoria…</p></div></div>
  if (!call) return <div className="public-shell"><EmptyState title="Convocatoria no disponible" description={error} /></div>

  return (
    <div className="public-shell">
      <header className="public-nav"><Brand /><div style={{ marginLeft: 'auto' }}><Link className="button button--secondary button--sm" to="/login">Acceder</Link></div></header>
      <main className="public-section" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Badge tone="success">Convocatoria abierta</Badge>
        <h1 style={{ maxWidth: 760, marginTop: 18 }}>{call.name}</h1>
        <p className="hero__lead">{call.description}</p>
        <div className="two-column" style={{ marginTop: 38 }}>
          <section className="card">
            <h2>Tu ruta en el programa</h2>
            <div className="milestone-list">
              <div className="milestone"><span className="milestone__dot" /><div><strong>Fase 1 · Incubación</strong><p>Propuesta de valor, modelo de negocio, mercado y validación.</p></div></div>
              <div className="milestone"><span className="milestone__dot" /><div><strong>Fase 2 · Consolidación</strong><p>Crecimiento, desarrollo comercial y preparación para inversión.</p></div></div>
            </div>
            <h2 style={{ marginTop: 28 }}>Qué incluye</h2>
            {['Mentoría especializada', 'Formación y recursos', 'Seguimiento de indicadores', 'Conexión con el ecosistema'].map((item) => <p key={item}><CheckCircle2 size={16} color="#13B8A6" style={{ verticalAlign: 'middle', marginRight: 8 }} />{item}</p>)}
          </section>
          <aside className="card" style={{ alignSelf: 'start' }}>
            <span className="eyebrow">Plazo de solicitud</span>
            <h2 style={{ marginTop: 8 }}>{call.closesAt ? new Date(call.closesAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha de cierre'}</h2>
            <p className="muted">Puedes guardar un borrador seguro y continuar más tarde.</p>
            <Link className="button button--primary" style={{ width: '100%' }} to={`/convocatorias/${call.slug}/solicitud`}>Iniciar candidatura <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </main>
    </div>
  )
}

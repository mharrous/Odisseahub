import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { listPublicCalls } from '../../lib/applications'
import type { PublicCall } from '../../types/domain'

export function CallsPage() {
  const [calls, setCalls] = useState<PublicCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listPublicCalls()
      .then((data) => active && setCalls(data))
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar las convocatorias.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <div className="public-shell">
      <header className="public-nav"><Brand /><div style={{ marginLeft: 'auto' }}><Link className="button button--secondary button--sm" to="/login">Acceder</Link></div></header>
      <main className="public-section" style={{ maxWidth: 1180, margin: '0 auto' }}>
        <span className="eyebrow">Oportunidades abiertas</span>
        <h1 style={{ marginTop: 8 }}>Convocatorias</h1>
        <p className="muted">Presenta tu proyecto a los programas de incubación y aceleración disponibles.</p>
        {error && <div className="notice notice--danger" role="alert">{error}</div>}
        {loading ? <div className="empty-state"><p>Cargando convocatorias…</p></div> : calls.length ? calls.map((call) => (
          <article className="card" style={{ marginTop: 35, maxWidth: 760 }} key={call.id}>
            <div className="card-head"><Badge tone="success">Abierta</Badge><span className="muted" style={{ fontSize: '.75rem' }}>{call.places} plazas</span></div>
            <h2>{call.name}</h2>
            <p className="muted" style={{ lineHeight: 1.7 }}>{call.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, margin: '20px 0', fontSize: '.77rem' }}>
              <span><CalendarDays size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />{call.closesAt ? `Hasta el ${new Date(call.closesAt).toLocaleDateString('es-ES')}` : 'Sin fecha de cierre'}</span>
              <span><MapPin size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Ceuta · Modalidad híbrida</span>
            </div>
            <Link className="button button--primary" to={`/convocatorias/${call.slug}`}>Consultar y solicitar <ArrowRight size={16} /></Link>
          </article>
        )) : <EmptyState title="No hay convocatorias abiertas" description="Vuelve a consultar esta página cuando se publique una nueva oportunidad." />}
      </main>
    </div>
  )
}

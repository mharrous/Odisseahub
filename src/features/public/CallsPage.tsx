import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Badge } from '../../components/ui/Badge'

export function CallsPage() {
  return (
    <div className="public-shell">
      <header className="public-nav"><Brand /><div style={{ marginLeft: 'auto' }}><Link className="button button--secondary button--sm" to="/login">Acceder</Link></div></header>
      <main className="public-section" style={{ maxWidth: 1180, margin: '0 auto' }}>
        <span className="eyebrow">Oportunidades abiertas</span>
        <h1 style={{ marginTop: 8 }}>Convocatorias</h1>
        <p className="muted">Presenta tu proyecto a los programas de incubación y aceleración disponibles.</p>
        <article className="card" style={{ marginTop: 35, maxWidth: 760 }}>
          <div className="card-head"><Badge tone="success">Abierta</Badge><span className="muted" style={{ fontSize: '.75rem' }}>8 plazas</span></div>
          <h2>Primera convocatoria ODISSEA</h2>
          <p className="muted" style={{ lineHeight: 1.7 }}>Programa de 12 meses para proyectos tecnológicos con potencial de crecimiento, validación de mercado y consolidación empresarial.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, margin: '20px 0', fontSize: '.77rem' }}>
            <span><CalendarDays size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Hasta el 30 de septiembre</span>
            <span><MapPin size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Ceuta · Modalidad híbrida</span>
          </div>
          <Link className="button button--primary" to="/convocatorias/primera-odissea">Consultar y solicitar <ArrowRight size={16} /></Link>
        </article>
      </main>
    </div>
  )
}

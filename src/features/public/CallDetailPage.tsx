import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Badge } from '../../components/ui/Badge'

export function CallDetailPage() {
  return (
    <div className="public-shell">
      <header className="public-nav"><Brand /><div style={{ marginLeft: 'auto' }}><Link className="button button--secondary button--sm" to="/login">Acceder</Link></div></header>
      <main className="public-section" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Badge tone="success">Convocatoria abierta</Badge>
        <h1 style={{ maxWidth: 760, marginTop: 18 }}>Primera convocatoria ODISSEA</h1>
        <p className="hero__lead">Doce meses de acompañamiento para convertir tecnología y conocimiento en empresas sostenibles y escalables.</p>
        <div className="two-column" style={{ marginTop: 38 }}>
          <section className="card">
            <h2>Tu ruta en el programa</h2>
            <div className="milestone-list">
              <div className="milestone"><span className="milestone__dot" /><div><strong>Fase 1 · Incubación</strong><p>4 meses · Propuesta de valor, modelo de negocio, mercado y Demo Day.</p></div></div>
              <div className="milestone"><span className="milestone__dot" /><div><strong>Fase 2 · Consolidación</strong><p>8 meses · Crecimiento, desarrollo comercial y preparación para inversión.</p></div></div>
            </div>
            <h2 style={{ marginTop: 28 }}>Qué incluye</h2>
            {['Mentoría especializada', 'Formación y recursos', 'Seguimiento de indicadores', 'Conexión con el ecosistema'].map((item) => <p key={item}><CheckCircle2 size={16} color="#13B8A6" style={{ verticalAlign: 'middle', marginRight: 8 }} />{item}</p>)}
          </section>
          <aside className="card" style={{ alignSelf: 'start' }}>
            <span className="eyebrow">Plazo de solicitud</span>
            <h2 style={{ marginTop: 8 }}>30 septiembre 2026</h2>
            <p className="muted">Puedes guardar el borrador y continuar más tarde.</p>
            <Link className="button button--primary" style={{ width: '100%' }} to="/convocatorias/primera-odissea/solicitud">Iniciar candidatura <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </main>
    </div>
  )
}

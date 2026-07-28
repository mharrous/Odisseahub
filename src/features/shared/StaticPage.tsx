import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'

export function StaticPage({ title }: { title: string }) {
  return (
    <div className="public-shell">
      <header className="public-nav"><Brand /><Link className="button button--secondary button--sm" style={{ marginLeft: 'auto' }} to="/">Volver al inicio</Link></header>
      <main className="public-section" style={{ maxWidth: 900, margin: '0 auto' }}>
        <span className="eyebrow">Información</span><h1 style={{ marginTop: 8 }}>{title}</h1>
        <section className="card"><p className="muted" style={{ lineHeight: 1.8 }}>Este contenido es configurable por organización. La versión definitiva debe validarse con el responsable jurídico y de accesibilidad antes de la publicación en producción.</p></section>
      </main>
    </div>
  )
}

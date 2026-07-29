import { ArrowRight, ChartNoAxesCombined, Compass, Route, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../components/Brand'

export function LandingPage() {
  return (
    <div className="public-shell">
      <header className="public-nav">
        <Brand />
        <nav className="public-nav__links" aria-label="Navegación pública">
          <Link to="/convocatorias">Convocatorias</Link>
          <a href="#plataforma">La plataforma</a>
          <Link to="/accesibilidad">Accesibilidad</Link>
        </nav>
        <Link className="button button--primary button--sm" to="/login">Acceder <ArrowRight size={15} /></Link>
      </header>
      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Incubadora de Alta Tecnología</span>
            <h1>Una ruta clara para <em>proyectos que avanzan.</em></h1>
            <p className="hero__lead">Mentoría conecta programas, talento y evidencias en un único espacio. Desde la candidatura hasta la consolidación empresarial.</p>
            <div className="hero__actions">
              <Link className="button button--primary" to="/convocatorias">Ver convocatoria <ArrowRight size={17} /></Link>
              <Link className="button button--secondary" to="/login">Entrar al espacio privado</Link>
            </div>
          </div>
          <div className="hero-visual" aria-label="Representación del progreso del programa">
            <div className="orbit" />
            <article className="hero-card hero-card--main">
              <div className="hero-card__top"><span className="eyebrow">Progreso global</span><ChartNoAxesCombined size={18} color="#1677FF" /></div>
              <h3>Primera convocatoria Mentoría</h3>
              <p>8 proyectos · Fase de incubación</p>
              <div className="progress-track" style={{ marginTop: 20 }}><span style={{ width: '56%' }} /></div>
              <div className="stat-line"><strong>56%</strong><span>+8% este mes</span></div>
            </article>
            <article className="hero-card hero-card--side">
              <div className="hero-card__top"><span className="eyebrow">Próximo hito</span><Compass size={18} color="#13B8A6" /></div>
              <h3>Validación de mercado</h3>
              <p>Entrega prevista · 14 agosto</p>
            </article>
          </div>
        </section>
        <section className="public-section" id="plataforma">
          <span className="eyebrow">Una visión compartida</span>
          <h2>Todo el programa, sin perder el rumbo</h2>
          <div className="feature-grid">
            <article className="feature-card"><Route size={25} /><h3>Itinerarios vivos</h3><p>Fases, actividades y entregables configurables que se adaptan a cada cohorte y proyecto.</p></article>
            <article className="feature-card"><ChartNoAxesCombined size={25} /><h3>Seguimiento con sentido</h3><p>Indicadores, alertas y evidencias reunidos para tomar decisiones y justificar resultados.</p></article>
            <article className="feature-card"><ShieldCheck size={25} /><h3>Privacidad por diseño</h3><p>Permisos reales en base de datos, documentos privados y trazabilidad de las acciones críticas.</p></article>
          </div>
        </section>
      </main>
    </div>
  )
}

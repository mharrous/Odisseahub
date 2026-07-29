import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, FileWarning, FolderKanban } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartData } from '../../data/demo'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'

const metrics = [
  { label: 'Proyectos activos', value: '8', change: '8 plazas cubiertas', icon: FolderKanban },
  { label: 'Progreso medio', value: '61%', change: '+7% desde junio', icon: ArrowUpRight },
  { label: 'Horas de mentoría', value: '133 h', change: '24 h este mes', icon: Clock3 },
  { label: 'Entregables pendientes', value: '12', change: '4 requieren revisión', icon: FileWarning },
]

export function AdminDashboard() {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow="Miércoles, 29 de julio" title="El programa, de un vistazo" description="Sigue el avance de la primera convocatoria y atiende lo que necesita una decisión." action={<Button onClick={() => navigate('/admin/programas?new=1')} icon={<BriefcaseBusiness size={17} />}>Nuevo programa</Button>} />
      <section className="metric-grid" aria-label="Indicadores principales">
        {metrics.map(({ label, value, change, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div><p>{label}</p><strong>{value}</strong></div><span className="metric-card__icon"><Icon size={20} /></span><small>{change}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="card">
          <div className="card-head"><div><h2>Evolución del programa</h2><span className="muted" style={{ fontSize: '.7rem' }}>Progreso agregado frente al objetivo</span></div><span className="badge badge--neutral">Últimos 6 meses</span></div>
          <div className="chart-wrap" aria-label="Gráfico: el progreso aumenta del 18 al 56 por ciento entre febrero y julio">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -22, right: 10, top: 10 }}>
                <defs><linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1677FF" stopOpacity={0.25}/><stop offset="100%" stopColor="#1677FF" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke="#e8edf3" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} domain={[0, 70]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e9f0', boxShadow: '0 10px 30px rgba(0,0,0,.08)' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="objetivo" stroke="#b7c1cd" fill="none" strokeDasharray="5 5" strokeWidth={2} />
                <Area isAnimationActive={false} type="monotone" dataKey="progreso" stroke="#1677FF" fill="url(#progressFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <table style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}><caption>Datos equivalentes del gráfico</caption><tbody>{chartData.map((row) => <tr key={row.month}><th>{row.month}</th><td>{row.progreso}%</td><td>{row.objetivo}% objetivo</td></tr>)}</tbody></table>
        </section>
        <aside className="card">
          <div className="card-head"><h2>Necesita atención</h2><span className="badge badge--danger">3 alertas</span></div>
          <div className="alert-list">
            <div className="alert-item"><span className="alert-item__icon"><AlertTriangle size={16} /></span><div><strong>2 proyectos sin actividad</strong><p>Ceuta Biolab y Orilla Health llevan más de 10 días sin registrar avance.</p></div></div>
            <div className="alert-item"><span className="alert-item__icon"><FileWarning size={16} /></span><div><strong>4 entregables por revisar</strong><p>Dos de ellos vencen en las próximas 48 horas.</p></div></div>
            <div className="alert-item"><span className="alert-item__icon"><CalendarDays size={16} /></span><div><strong>1 acta pendiente</strong><p>La sesión de Nauta AI del 24 de julio no tiene acta.</p></div></div>
          </div>
        </aside>
      </div>
      <div className="dashboard-grid dashboard-grid--split">
        <section className="card">
          <div className="card-head"><h2>Actividad reciente</h2><Button variant="ghost" size="sm" onClick={() => navigate('/admin/auditoria')}>Ver todo</Button></div>
          <div className="activity-list">
            <div className="activity-row"><span className="avatar" style={{ background: '#e6f7f3', color: '#087769' }}><CheckCircle2 size={16} /></span><div><p><strong>Abyla Robotics</strong> presentó “Validación técnica v2”</p><time>Hace 32 minutos</time></div></div>
            <div className="activity-row"><span className="avatar">LR</span><div><p><strong>Lucía Romero</strong> registró 2 horas de mentoría</p><time>Hace 2 horas</time></div></div>
            <div className="activity-row"><span className="avatar" style={{ background: '#eef5ff', color: '#1677ff' }}>NA</span><div><p><strong>Nauta AI</strong> completó el módulo de mercado</p><time>Ayer, 18:42</time></div></div>
          </div>
        </section>
        <section className="card">
          <div className="card-head"><h2>Próximos hitos</h2><Button variant="ghost" size="sm" onClick={() => navigate('/admin/eventos')}>Calendario</Button></div>
          <div className="milestone-list">
            <div className="milestone"><span className="milestone__dot" /><div><strong>Taller de estrategia comercial</strong><p>30 jul · 10:00 · Espacio ODISSEA</p></div></div>
            <div className="milestone"><span className="milestone__dot" /><div><strong>Cierre del entregable financiero</strong><p>2 ago · 4 proyectos pendientes</p></div></div>
            <div className="milestone"><span className="milestone__dot" /><div><strong>Comité mensual de seguimiento</strong><p>6 ago · 09:30 · Sesión online</p></div></div>
          </div>
        </section>
      </div>
    </>
  )
}

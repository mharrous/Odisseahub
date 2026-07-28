import {
  Bell, BookOpen, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, ClipboardCheck,
  FileStack, Gauge, GraduationCap, LayoutDashboard, Menu, MessageSquareText, Search,
  Settings, ShieldCheck, Users, X, FolderKanban, Route, Home, UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Brand } from '../Brand'
import { useAuth } from '../../features/auth/AuthContext'
import { roleLabels } from '../../data/demo'
import { isSupabaseConfigured } from '../../lib/supabase'

const adminNav = [
  ['Principal', [
    ['/admin', 'Resumen', LayoutDashboard],
    ['/admin/programas', 'Programas', BriefcaseBusiness],
    ['/admin/convocatorias', 'Convocatorias', ClipboardCheck],
    ['/admin/candidaturas', 'Candidaturas', FileStack],
    ['/admin/proyectos', 'Proyectos', FolderKanban],
  ]],
  ['Seguimiento', [
    ['/admin/itinerarios', 'Itinerarios', Route],
    ['/admin/mentores', 'Mentores', Users],
    ['/admin/eventos', 'Eventos', CalendarDays],
    ['/admin/indicadores', 'Indicadores', ChartNoAxesCombined],
    ['/admin/documentos', 'Documentos', BookOpen],
  ]],
  ['Sistema', [
    ['/admin/informes', 'Informes', Gauge],
    ['/admin/usuarios', 'Usuarios', Users],
    ['/admin/configuracion', 'Configuración', Settings],
    ['/admin/auditoria', 'Auditoría', ShieldCheck],
  ]],
] as const

const participantNav = [
  ['Mi programa', [
    ['/app', 'Mi espacio', LayoutDashboard],
    ['/app/itinerario', 'Itinerario', Route],
    ['/app/entregables', 'Entregables', ClipboardCheck],
    ['/app/mentorias', 'Mentorías', Users],
    ['/app/calendario', 'Calendario', CalendarDays],
    ['/app/comunidad', 'Comunidad', MessageSquareText],
    ['/app/documentos', 'Documentos', BookOpen],
  ]],
] as const

const mentorNav = [
  ['Mentoría', [
    ['/mentor', 'Resumen', LayoutDashboard],
    ['/mentor/proyectos', 'Proyectos', FolderKanban],
    ['/mentor/sesiones', 'Sesiones', CalendarDays],
    ['/mentor/entregables', 'Entregables', ClipboardCheck],
    ['/mentor/horas', 'Horas', Gauge],
    ['/mentor/calendario', 'Calendario', CalendarDays],
  ]],
] as const

const evaluatorNav = [
  ['Evaluación', [
    ['/evaluador', 'Resumen', LayoutDashboard],
    ['/evaluador/candidaturas', 'Candidaturas', FileStack],
    ['/evaluador/evaluaciones', 'Evaluaciones', ClipboardCheck],
  ]],
] as const

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { role, logout } = useAuth()
  const navigate = useNavigate()
  const nav = role === 'participant' ? participantNav : role === 'mentor' ? mentorNav : role === 'evaluator' ? evaluatorNav : adminNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Brand />
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {nav.map(([section, links]) => (
            <div key={section}>
              <div className="sidebar-nav__section">{section}</div>
              {links.map(([path, label, Icon]) => (
                <NavLink key={path} to={path} end={path === '/admin' || path === '/app' || path === '/mentor' || path === '/evaluador'} className="nav-link" onClick={() => setMenuOpen(false)}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button className="sidebar__footer" onClick={handleLogout} style={{ borderInline: 0, borderBottom: 0, background: 'transparent', color: 'white', textAlign: 'left', cursor: 'pointer' }}>
          <span className="avatar">MC</span>
          <span><strong>María Campos</strong><small>{role ? roleLabels[role] : 'Usuario'} · Cerrar sesión</small></span>
        </button>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="search">
            <Search size={18} aria-hidden="true" />
            <input aria-label="Buscar en ODISSEA HUB" placeholder="Buscar proyectos, personas o documentos..." />
          </div>
          <span className="environment-pill">{isSupabaseConfigured ? 'Supabase conectado' : 'Modo demostración'}</span>
          <div className="topbar__right">
            <button className="icon-button" aria-label="Ayuda"><GraduationCap size={19} /></button>
            <button className="icon-button" aria-label="Notificaciones"><Bell size={19} /></button>
          </div>
        </header>
        <main id="main-content" className="content">
          <Outlet />
        </main>
        {role === 'participant' && (
          <nav className="mobile-nav" aria-label="Navegación móvil">
            <NavLink to="/app"><span><Home size={20} />Inicio</span></NavLink>
            <NavLink to="/app/itinerario"><span><Route size={20} />Itinerario</span></NavLink>
            <NavLink to="/app/entregables"><span><ClipboardCheck size={20} />Entregas</span></NavLink>
            <NavLink to="/app/perfil"><span><UserRound size={20} />Perfil</span></NavLink>
          </nav>
        )}
      </div>
    </div>
  )
}

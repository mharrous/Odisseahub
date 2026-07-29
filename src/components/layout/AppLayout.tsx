import {
  Bell, BookOpen, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, ClipboardCheck,
  FileStack, Gauge, GraduationCap, LayoutDashboard, Menu, MessageSquareText, Search,
  Settings, ShieldCheck, Users, X, FolderKanban, Route, Home, UserRound, ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Brand } from '../Brand'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../features/auth/AuthContext'
import { roleLabels } from '../../data/demo'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getCurrentProfile, listNotifications, markNotificationRead } from '../../lib/repository'
import type { AppNotification, UserProfile } from '../../types/domain'

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

const coordinatorNav = [
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
    ['/admin/informes', 'Informes', Gauge],
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

type NavItem = readonly [path: string, label: string, icon: LucideIcon]
type NavSection = readonly [section: string, links: readonly NavItem[]]

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const { role, logout } = useAuth()
  const navigate = useNavigate()
  const nav: readonly NavSection[] = role === 'participant' ? participantNav : role === 'mentor' ? mentorNav : role === 'evaluator' ? evaluatorNav : role === 'coordinator' ? coordinatorNav : adminNav
  const searchResults = useMemo(() => {
    const value = searchQuery.trim().toLowerCase()
    if (value.length < 2) return []
    return nav.flatMap(([, links]) => links)
      .filter(([, label]) => label.toLowerCase().includes(value))
      .slice(0, 6)
  }, [nav, searchQuery])
  const unreadCount = notifications.filter((item) => !item.readAt).length
  const initials = (profile?.displayName ?? roleLabels[role ?? 'admin'])
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  useEffect(() => {
    let active = true
    Promise.all([getCurrentProfile(), listNotifications()])
      .then(([profileData, notificationData]) => {
        if (!active) return
        setProfile(profileData)
        setNotifications(notificationData)
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    if (searchResults[0]) {
      navigate(searchResults[0][0])
      setSearchQuery('')
    }
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
          <span className="avatar">{initials || 'OD'}</span>
          <span><strong>{profile?.displayName ?? 'Usuario ODISSEA'}</strong><small>{role ? roleLabels[role] : 'Usuario'} · Cerrar sesión</small></span>
        </button>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <form className="search" onSubmit={submitSearch}>
            <Search size={18} aria-hidden="true" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Buscar en ODISSEA HUB" placeholder="Buscar una sección..." autoComplete="off" />
            {searchQuery.trim().length >= 2 && (
              <div className="global-search-results" role="listbox" aria-label="Resultados de búsqueda">
                {searchResults.length ? searchResults.map(([path, label, Icon]) => (
                  <button type="button" role="option" aria-selected="false" key={path} onClick={() => { navigate(path); setSearchQuery('') }}><Icon size={17} /><span>{label}</span><ExternalLink size={14} /></button>
                )) : <p>No hay secciones que coincidan.</p>}
              </div>
            )}
          </form>
          <span className="environment-pill">{isSupabaseConfigured ? 'Supabase conectado' : 'Modo demostración'}</span>
          <div className="topbar__right">
            <button className="icon-button" aria-label="Ayuda" onClick={() => setHelpOpen(true)}><GraduationCap size={19} /></button>
            <button className="icon-button notification-button" aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`} onClick={() => setNotificationsOpen(true)}><Bell size={19} />{unreadCount > 0 && <span className="notification-dot" aria-hidden="true" />}</button>
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
      <Modal title="Ayuda de ODISSEA HUB" open={helpOpen} onClose={() => setHelpOpen(false)}>
        <div className="help-list">
          <section><strong>Navegación</strong><p>Usa el menú lateral para acceder a las áreas disponibles según tu rol.</p></section>
          <section><strong>Datos y permisos</strong><p>Los cambios se guardan en Supabase y solo son visibles para los miembros autorizados de tu organización.</p></section>
          <section><strong>Soporte</strong><p>Si una acción devuelve un error, copia el mensaje mostrado en pantalla y comunícalo al equipo administrador.</p></section>
        </div>
      </Modal>
      <Modal title="Notificaciones" open={notificationsOpen} onClose={() => setNotificationsOpen(false)}>
        <div className="notification-list">
          {notifications.length ? notifications.map((notification) => (
            <button key={notification.id} className={notification.readAt ? '' : 'is-unread'} onClick={async () => {
              if (!notification.readAt) {
                await markNotificationRead(notification.id)
                setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
              }
              if (notification.actionUrl) navigate(notification.actionUrl)
              setNotificationsOpen(false)
            }}>
              <Bell size={18} /><span><strong>{notification.title}</strong><small>{notification.body || new Date(notification.createdAt).toLocaleString('es-ES')}</small></span>
            </button>
          )) : <p className="muted">No tienes notificaciones pendientes.</p>}
        </div>
      </Modal>
    </div>
  )
}

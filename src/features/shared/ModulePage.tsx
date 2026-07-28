import { CalendarDays, CheckCircle2, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'

const config: Record<string, { title: string; description: string; item: string; samples?: string[] }> = {
  convocatorias: { title: 'Convocatorias', description: 'Publica oportunidades y gestiona sus formularios, plazos y criterios.', item: 'convocatoria', samples: ['Primera convocatoria ODISSEA'] },
  candidaturas: { title: 'Candidaturas', description: 'Revisa documentación, estados y trazabilidad de cada solicitud.', item: 'candidatura', samples: ['ODI-2026-0012 · HydroSense', 'ODI-2026-0015 · Gadir Cloud', 'ODI-2026-0018 · BioMarine Labs'] },
  evaluaciones: { title: 'Evaluaciones', description: 'Asigna evaluadores, configura rúbricas y consolida el ranking.', item: 'evaluación', samples: ['Rúbrica tecnológica · 5 criterios', 'Comité de selección · Septiembre'] },
  cohortes: { title: 'Cohortes', description: 'Agrupa los proyectos seleccionados y asigna su equipo de seguimiento.', item: 'cohorte', samples: ['Cohorte ODISSEA 2026 · 8 proyectos'] },
  itinerarios: { title: 'Itinerarios', description: 'Ordena fases, módulos y actividades para cada programa.', item: 'itinerario', samples: ['Itinerario base ODISSEA · 2 fases · 9 módulos'] },
  mentores: { title: 'Mentores', description: 'Gestiona perfiles, especialidades, disponibilidad y asignaciones.', item: 'mentor', samples: ['Lucía Romero · Estrategia', 'Álvaro Peña · Finanzas', 'Marta Soler · Comercialización'] },
  eventos: { title: 'Eventos', description: 'Coordina talleres, jornadas y sesiones con control de asistencia.', item: 'evento', samples: ['Taller de estrategia comercial · 30 jul', 'Comité de seguimiento · 6 ago'] },
  indicadores: { title: 'Indicadores', description: 'Controla metas, evidencias e histórico de valores del programa.', item: 'indicador', samples: ['RCO01 · 100%', 'RCO04 · 76%', 'Horas de mentoría · 133 h'] },
  documentos: { title: 'Documentos y evidencias', description: 'Repositorio privado con versiones, etiquetas y visibilidad controlada.', item: 'documento', samples: ['Bases reguladoras.pdf', 'Acta comité 02.pdf', 'Plantilla modelo financiero.xlsx'] },
  informes: { title: 'Informes', description: 'Genera vistas auditables con filtros y fecha de creación.', item: 'informe', samples: ['Informe mensual · Julio', 'Seguimiento de indicadores · T2'] },
  usuarios: { title: 'Usuarios y permisos', description: 'Gestiona membresías, roles y permisos por organización.', item: 'usuario', samples: ['2 coordinadores', '3 mentores', '2 evaluadores'] },
  configuracion: { title: 'Configuración', description: 'Marca, datos legales, notificaciones y funciones de la organización.', item: 'ajuste', samples: ['Identidad visual', 'Privacidad y textos legales', 'Preferencias de correo'] },
  auditoria: { title: 'Auditoría', description: 'Consulta acciones sensibles sin posibilidad de edición.', item: 'registro', samples: ['María Campos publicó una convocatoria', 'Lucía Romero registró un acta', 'Sistema bloqueó un acceso no autorizado'] },
  itinerario: { title: 'Mi itinerario', description: 'Continúa las actividades de tu fase actual.', item: 'actividad', samples: ['Propuesta de valor · Completado', 'Validación de mercado · En curso', 'Modelo financiero · Bloqueado'] },
  entregables: { title: 'Entregables', description: 'Prepara, presenta y consulta las revisiones de tus entregables.', item: 'entregable', samples: ['Validación de mercado · En curso', 'Canvas de negocio · Aprobado', 'Plan financiero · No iniciado'] },
  mentorias: { title: 'Mentorías', description: 'Consulta próximas sesiones, actas y acuerdos.', item: 'sesión', samples: ['Revisión del modelo comercial · 4 ago', 'Validación técnica · 18 ago'] },
  calendario: { title: 'Calendario', description: 'Sesiones, eventos y fechas límite en una sola agenda.', item: 'evento', samples: ['30 jul · Taller comercial', '4 ago · Mentoría', '6 ago · Comité mensual'] },
  comunidad: { title: 'Comunidad', description: 'Canales sencillos para compartir anuncios y recursos.', item: 'publicación', samples: ['Canal general · 3 publicaciones nuevas', 'Cohorte ODISSEA · Aviso fijado'] },
  perfil: { title: 'Mi perfil', description: 'Actualiza tus datos y preferencias de notificación.', item: 'dato', samples: ['Datos personales', 'Seguridad', 'Notificaciones'] },
  sesiones: { title: 'Sesiones', description: 'Programa sesiones y registra actas, acuerdos y horas.', item: 'sesión', samples: ['Abyla Robotics · 4 ago', 'Neptuno Secure · 8 ago'] },
  horas: { title: 'Control de horas', description: 'Registra horas justificables asociadas a cada proyecto.', item: 'registro', samples: ['Julio · 8 h', 'Junio · 12 h'] },
}

export function ModulePage({ kind }: { kind: string }) {
  const item = config[kind] ?? { title: 'Módulo', description: 'Área funcional de ODISSEA HUB.', item: 'registro' }
  return (
    <>
      <div className="breadcrumb">ODISSEA HUB / <span>{item.title}</span></div>
      <PageHeader title={item.title} description={item.description} action={<Button icon={<Plus size={17} />}>Nuevo {item.item}</Button>} />
      {item.samples?.length ? (
        <div className="table-card">
          <div className="table-toolbar"><div style={{ position: 'relative', flex: 1 }}><Search size={16} style={{ position: 'absolute', left: 13, top: 13, color: '#98a2b3' }} /><input className="field" style={{ paddingLeft: 39 }} placeholder={`Buscar ${item.item}...`} /></div><Button variant="secondary" icon={<SlidersHorizontal size={16} />}>Filtros</Button></div>
          <table><thead><tr><th>Nombre</th><th>Estado</th><th>Actualización</th><th>Responsable</th></tr></thead><tbody>{item.samples.map((sample, index) => <tr key={sample}><td><div className="table-title">{sample}</div><div className="table-subtitle">Primera convocatoria ODISSEA</div></td><td data-label="Estado"><span className={`badge badge--${index === 1 ? 'warning' : 'success'}`}>{index === 1 ? 'En curso' : 'Disponible'}</span></td><td data-label="Actualización"><CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{index + 24} jul 2026</td><td data-label="Responsable">{index % 2 ? 'Coordinación ODISSEA' : 'María Campos'}</td></tr>)}</tbody></table>
        </div>
      ) : (
        <div className="table-card"><EmptyState title={`Aún no hay ${item.title.toLowerCase()}`} description={`Cuando crees el primer ${item.item}, aparecerá aquí con sus permisos y trazabilidad.`} action={<Button icon={<FileText size={16} />}>Crear ahora</Button>} /></div>
      )}
      <div className="notice" style={{ marginTop: 18 }}><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 7 }} />Vista funcional de primera fase. Las operaciones avanzadas pendientes están detalladas en PROGRESS.md.</div>
    </>
  )
}

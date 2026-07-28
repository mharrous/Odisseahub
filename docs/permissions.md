# Matriz de permisos

| Capacidad | Admin org. | Coordinador | Evaluador | Mentor | Participante |
|---|---:|---:|---:|---:|---:|
| Gestionar programas y convocatorias | Sí | Asignados | No | No | No |
| Revisar candidaturas | Sí | Sí | Asignadas | No | Propia |
| Puntuar candidaturas | Supervisión | No | Asignadas | No | No |
| Ver todos los proyectos | Sí | Asignados | No | Asignados | Propio |
| Gestionar itinerario | Sí | Sí | No | No | Completar |
| Revisar entregables | Sí | Sí | No | Asignados | Presentar |
| Registrar actas y horas | Consulta | Sí | No | Asignados | Consulta visible |
| Indicadores e informes | Total | Programa | No | Asignados | Propios |
| Auditoría y permisos | Sí | No | No | No | No |

La interfaz aplica guardas por rol. PostgreSQL aplica RLS por organización, proyecto, asignación y usuario. Los permisos del esquema son configurables mediante `roles`, `permissions` y `role_permissions`.

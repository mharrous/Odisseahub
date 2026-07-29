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

## Reglas adicionales

- Una persona solicitante anónima solo lee y modifica su propio borrador.
- La presentación exige convocatoria abierta, datos completos y al menos un documento; después fija registro, fecha y bloqueo.
- El adjunto presentado no puede borrarse desde Storage por su titular.
- Un evaluador solo lee candidaturas y archivos de asignaciones propias.
- Un evaluador edita únicamente sus evaluaciones abiertas; no crea, elimina ni cambia el estado administrativo de candidaturas.
- Un mentor solo accede a proyectos asignados.
- Los documentos del participante se muestran sin controles administrativos; las altas, versiones y bajas exigen `documents.manage`.
- `workspace_items` no permite cambiar su organización, proyecto, autor o tipo para eludir las políticas.
- Los coordinadores reciben permisos operativos de programas, convocatorias, candidaturas, evaluaciones, proyectos y documentos; la gestión de usuarios y auditoría sigue reservada al administrador.
- Las invitaciones se procesan en `invite-user`: valida el JWT, `users.manage`, la organización y el rol antes de usar Admin Auth.

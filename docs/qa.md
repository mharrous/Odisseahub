# Informe de QA, accesibilidad y seguridad básica

## Automatización

- Lint sin errores ni avisos.
- TypeScript estricto sin errores.
- 3 pruebas unitarias aprobadas.
- 12 pruebas E2E de flujos prioritarios aprobadas en 1440 × 900 y 390 × 844.
- Build de producción generado correctamente.

## Consola

Las capturas automatizadas de dashboard no registraron errores de consola ni excepciones de página. Los resultados crudos están en `docs/screenshots/console-*.json`.

## Responsive

Se verificaron:

- Escritorio: navegación lateral, cuatro métricas, gráfico, alertas y actividad.
- Móvil: menú lateral desplegable, tablas convertidas en tarjetas, acciones apiladas y navegación inferior del participante.
- Los objetivos táctiles principales miden al menos 42 px.

## Accesibilidad

- Enlace para saltar al contenido.
- Navegación semántica y encabezados jerárquicos.
- Foco visible global.
- Labels en formularios y nombres accesibles en botones de icono.
- `progressbar` con valores ARIA.
- Texto y tabla equivalente para el gráfico principal.
- Contraste diseñado para WCAG AA con texto oscuro sobre superficies claras.

Pendiente antes de producción: ejecutar un análisis completo con axe y revisión manual con lector de pantalla sobre todos los formularios configurables.

## Seguridad básica

- No hay secretos en el frontend ni en `.env.example`.
- RLS habilitada por migración en todas las tablas públicas.
- Acceso a proyectos limitado por permiso, membresía o asignación.
- `workspace_items` impide cambiar autor, organización, proyecto o tipo durante una actualización.
- Evaluaciones cerradas no pueden modificarse por el evaluador.
- Auditoría sin políticas de modificación o borrado.
- Acciones administrativas con políticas específicas de escritura y validación de claves relacionadas dentro de la misma organización.
- Invitación de usuarios aislada en una Edge Function que verifica sesión, permiso, organización y rol; una llamada anónima devuelve `401`.
- Documentos e informes en bucket privado con URLs firmadas de un minuto y control `documents.manage`.
- Archivos de candidatura en bucket privado: el titular solo puede borrar mientras la solicitud sea borrador; revisores y evaluadores asignados disponen de lectura controlada.
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y protección de framing configuradas en `public/_headers`.
- La fuente abierta Manrope se sirve desde el propio bundle; la interfaz no solicita fuentes a terceros.

`npm audit --omit=dev` sigue señalando dos avisos altos del paquete React Router 7.18.1 vinculados al modo RSC/Server Actions. Mentoría utiliza exclusivamente `BrowserRouter` como SPA estática y no expone RSC, SSR ni Action handlers, por lo que esas rutas vulnerables no forman parte de la superficie actual. Se debe actualizar el paquete cuando exista una versión estable que resuelva el aviso. El audit completo también señala cinco rutas de desarrollo en ESLint/`brace-expansion`; no se empaquetan en producción.

Las migraciones, el seed y las correcciones de Auth/Storage/Data API están aplicadas en el proyecto remoto. El 29 de julio se verificaron las tres columnas nuevas de `applications`, las políticas y los disparadores de bloqueo, alcance y auditoría. Una candidatura anónima real guardó borrador y PDF, fue presentada como `MEN-2026-000001` y produjo tres eventos de auditoría. La base confirmó estado `submitted`, un archivo privado y fecha de presentación. `invite-user` quedó desplegada y rechazó una llamada sin sesión con `401`. Sigue pendiente automatizar el acceso autenticado con cuentas reales de mentor, evaluador y participante.

# Progreso

## Completado

- Arquitectura React + TypeScript + Vite y configuración Cloudflare Pages.
- Despliegue de producción en `https://odissea-hub.pages.dev`.
- Sistema de diseño responsive, accesible y con tokens centralizados.
- Navegación pública y privada por roles demo.
- Dashboard de administración con métricas, alertas y gráficos.
- Gestión persistente de programas con ciclo de vida completo y fallback demo.
- Candidatura pública real con Auth anónimo, borrador PostgreSQL, adjunto privado, presentación bloqueada y resguardo con registro correlativo.
- Listado filtrable de proyectos y ficha 360º con nueve pestañas operativas y CRUD persistente.
- Buscador global, ayuda, notificaciones y accesos directos funcionales.
- Repositorios reales para programas, proyectos, perfil, notificaciones, dashboard y entidades oficiales de dominio.
- Formularios especializados conectados a tablas oficiales para convocatorias, evaluaciones, cohortes, mentores, itinerarios, eventos, indicadores, documentos e informes.
- Revisión controlada de candidaturas, gestión de configuración y usuarios con invitación segura mediante Edge Function.
- Descarga firmada, versionado de documentos y exportación de informes CSV/JSON.
- Auditoría funcional autenticada y pruebas E2E ampliadas en escritorio y móvil.
- Vistas iniciales de participante, mentor y evaluador.
- Migración inicial multi-organización y endurecimiento RLS por permiso, autor, organización, proyecto y asignación.
- Auditoría automática de programas, convocatorias, candidaturas, proyectos, documentos, eventos, indicadores y registros flexibles.
- Adjuntos de candidaturas presentadas inmutables; lectura privada para titular, revisores y evaluadores asignados.
- Seed de demostración no personal.
- Proyecto Supabase de producción creado y migraciones/seed aplicados.
- Autenticación real con sesión persistente, cierre de sesión, roles y recuperación de contraseña.
- Administrador real invitado y membresía `organization_admin` activa.
- Buckets privados y trigger automático de perfiles.
- Data API pública limitada por RLS: solo convocatorias publicadas; programas y proyectos privados no se exponen.
- URL de producción y redirecciones de Auth configuradas.
- Auth anónimo habilitado y flujo remoto completo verificado con el registro `ODI-2026-000001`.
- CI de GitHub para lint, TypeScript, unitarias, E2E y build.
- Acciones administrativas protegidas por RLS, validación de relaciones multi-organización y auditoría ampliada.
- Prueba E2E exhaustiva de botones y modales de los módulos administrativos en escritorio y móvil.

## En curso

- Ampliación de formularios configurables y constructor drag and drop.

## Pendiente

- Plantillas de correo institucionales y proveedor SMTP propio.
- Editor enriquecido, calendario avanzado, comunidad y generación PDF/XLSX.
- Plantillas avanzadas de informes PDF/XLSX y correo institucional.
- Realtime selectivo.
- Copiloto ODISSEA (desactivado).
- Pruebas E2E autenticadas con cuentas reales de mentor, evaluador y participante.

## Bloqueos

- No hay proveedor SMTP institucional configurado; se usa el servicio de correo incluido por Supabase.

## Decisiones adoptadas

- Producción con Supabase; modo demo seguro solo para desarrollo y pruebas sin credenciales.
- Ninguna función pendiente se representa como operativa.
- Marca propia con motivos de navegación y nodos, sin recursos de terceros.

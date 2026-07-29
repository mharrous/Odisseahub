# Progreso

## Completado

- Arquitectura React + TypeScript + Vite y configuración Cloudflare Pages.
- Despliegue de producción en `https://odissea-hub.pages.dev`.
- Sistema de diseño responsive, accesible y con tokens centralizados.
- Navegación pública y privada por roles demo.
- Dashboard de administración con métricas, alertas y gráficos.
- Gestión persistente de programas con ciclo de vida completo y fallback demo.
- Candidatura pública con borrador, adjunto, envío y resguardo.
- Listado filtrable de proyectos y ficha 360º con nueve pestañas operativas y CRUD persistente.
- Buscador global, ayuda, notificaciones y accesos directos funcionales.
- CRUD persistente para módulos operativos mediante `workspace_items` con RLS.
- Auditoría funcional autenticada y pruebas E2E ampliadas en escritorio y móvil.
- Vistas iniciales de participante, mentor y evaluador.
- Migración inicial multi-organización con RLS y auditoría.
- Seed de demostración no personal.
- Proyecto Supabase de producción creado y migraciones/seed aplicados.
- Autenticación real con sesión persistente, cierre de sesión, roles y recuperación de contraseña.
- Administrador real invitado y membresía `organization_admin` activa.
- Buckets privados y trigger automático de perfiles.
- Data API pública limitada por RLS: solo convocatorias publicadas; programas y proyectos privados no se exponen.
- URL de producción y redirecciones de Auth configuradas.

## En curso

- Evolución de los formularios genéricos a flujos especializados por dominio.
- Ampliación de formularios configurables y constructor drag and drop.

## Pendiente

- Plantillas de correo institucionales y proveedor SMTP propio.
- Editor enriquecido, calendario avanzado, comunidad y generación PDF/XLSX.
- Edge Functions de informes, correo y enlaces firmados.
- Realtime selectivo.
- Copiloto ODISSEA (desactivado).
- Pruebas E2E autenticadas con cuentas reales de cada rol.

## Bloqueos

- No hay proveedor SMTP institucional configurado; se usa el servicio de correo incluido por Supabase.

## Decisiones adoptadas

- Producción con Supabase; modo demo seguro solo para desarrollo y pruebas sin credenciales.
- Ninguna función pendiente se representa como operativa.
- Marca propia con motivos de navegación y nodos, sin recursos de terceros.

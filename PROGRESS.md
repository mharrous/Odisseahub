# Progreso

## Completado

- Arquitectura React + TypeScript + Vite y configuración Cloudflare Pages.
- Despliegue de producción en `https://odissea-hub.pages.dev`.
- Sistema de diseño responsive, accesible y con tokens centralizados.
- Navegación pública y privada por roles demo.
- Dashboard de administración con métricas, alertas y gráficos.
- Gestión local persistente de programas en modo demo.
- Candidatura pública con borrador, adjunto, envío y resguardo.
- Listado de proyectos y ficha 360º.
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

- Sustitución progresiva de datos demo de los módulos por repositorios Supabase.
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

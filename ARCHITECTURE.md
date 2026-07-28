# Arquitectura de ODISSEA HUB

## Decisiones principales

ODISSEA HUB es una SPA React + TypeScript desplegable como contenido estático en Cloudflare Pages. Supabase es la autoridad para autenticación, PostgreSQL y archivos privados. El navegador solo utiliza la clave pública `anon`; las operaciones administrativas con secretos se reservan a Edge Functions.

La aplicación es multi-organización desde el esquema: las entidades de negocio incluyen `organization_id`, y la pertenencia se resuelve con `organization_members`. La autorización combina roles configurables y permisos, pero nunca depende solo de la interfaz: todas las tablas expuestas tienen RLS.

## Capas

- `app` y `routes`: composición, navegación y guardas.
- `features`: lógica y pantallas por dominio.
- `components`: primitivas visuales y layout reutilizable.
- `services`: adaptadores Supabase y modo demo.
- `lib`: utilidades sin estado.
- `supabase`: migraciones, seed y funciones privadas.

## Persistencia y modo demo

Con variables Supabase válidas se activa el adaptador remoto. Sin credenciales, el modo demo guarda los cambios del usuario en `localStorage`; esto permite ejecutar y probar los flujos sin inventar secretos. El modo demo no sustituye la validación RLS de producción.

## Seguridad

- UUID en entidades, integridad referencial e índices por organización.
- RLS obligatoria y funciones `security definer` limitadas para comprobar membresía.
- Documentos en buckets privados y acceso mediante URL firmada.
- Auditoría append-only para acciones sensibles.
- El cliente no contiene `service_role`, proveedores de correo ni claves de IA.
- `COPILOTO ODISSEA` permanece desactivado por feature flag.

## Alcance de la versión 0.1

La primera entrega implementa un corte vertical de administración, programas, proyectos, candidatura, entregables y vistas por rol. El modelo SQL deja preparadas las entidades principales y `PROGRESS.md` distingue de forma explícita los módulos terminados de los que requieren una siguiente iteración.

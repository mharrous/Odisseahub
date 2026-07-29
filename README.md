# Mentoría

Aplicación web para gestionar programas de incubación y aceleración: convocatorias, candidaturas, proyectos, itinerarios, mentorías, entregables, indicadores, documentos e informes.

Aplicación publicada: [https://mentoria-bsv.pages.dev](https://mentoria-bsv.pages.dev)

## Estado

La versión 0.4, publicada con la marca Mentoría, está conectada a Supabase en producción. Incluye autenticación real, roles dinámicos por organización, recuperación de contraseña, RLS endurecida, auditoría automática y almacenamiento privado. Los módulos administrativos disponen de formularios y acciones reales para convocatorias, candidaturas, evaluaciones, cohortes, mentores, itinerarios, eventos, indicadores, documentos, informes, usuarios y configuración. La candidatura pública crea una sesión anónima segura, guarda el borrador y el adjunto en Supabase, bloquea la solicitud presentada y genera un número de registro `MEN`. Sin variables Supabase conserva un modo demo local para desarrollo y pruebas automatizadas.

## Requisitos

- Node.js 25 o una versión moderna compatible con Vite 7.
- npm 11.
- Docker para Supabase local, si se desea validar la base de datos.
- Cuenta Supabase y Cloudflare Pages para producción.

## Instalación y ejecución

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abre `http://localhost:4173`. Sin variables Supabase se activa el modo demo y los cambios se guardan en `localStorage`.

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL pública del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` |
| `VITE_APP_MODE` | `demo` o `production` |
| `VITE_AI_ENABLED` | Feature flag; `false` por defecto |
| `VITE_EMAIL_PROVIDER` | `development` hasta configurar proveedor |

No añadas `service_role`, contraseñas, tokens de correo ni claves de IA a variables `VITE_*`.

## Supabase: migraciones y seed

```powershell
npx supabase start
npx supabase db reset
```

Las migraciones crean el modelo multi-organización, funciones de autorización, índices, RLS, perfiles de Auth, buckets privados y los privilegios mínimos de Data API. Las migraciones `202607290002_security_and_applications.sql` y `202607290003_storage_integrity.sql` añaden la candidatura verificable, el aislamiento por proyecto, la auditoría automática y la inmutabilidad de los adjuntos presentados. `202607290004_domain_actions.sql` incorpora las políticas de escritura, validaciones entre organizaciones, almacenamiento de documentos e informes y auditoría de las acciones administrativas. El seed aporta una organización, programa, convocatoria, cohorte, ocho proyectos, tres mentores, fases, módulos, indicadores, eventos y documentos ficticios.

Los perfiles demo solo aparecen cuando Supabase no está configurado. En producción, cada usuario interno debe existir en Supabase Auth y tener una membresía activa con rol en `organization_members`. Las personas solicitantes usan Auth anónimo y solo pueden acceder a su propia candidatura y a sus archivos.

## Calidad

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Cloudflare Pages

Build: `npm run build`. Salida: `dist`. El repositorio incluye fallback SPA y cabeceras defensivas. Sigue [docs/deployment.md](./docs/deployment.md).

## Arquitectura y documentación

- [ARCHITECTURE.md](./ARCHITECTURE.md): decisiones y capas.
- [docs/database.md](./docs/database.md): modelo y tipos.
- [docs/permissions.md](./docs/permissions.md): matriz de permisos.
- [docs/testing.md](./docs/testing.md): estrategia de QA.
- [docs/deployment.md](./docs/deployment.md): Supabase y Cloudflare.

## Limitaciones actuales

- La generación de informes incluye CSV y JSON; PDF/XLSX avanzado requiere una siguiente iteración.
- Calendario con vista mensual, comunidad en tiempo real y Copiloto requieren siguientes iteraciones.
- El correo de invitación usa el servicio incluido de Supabase hasta configurar SMTP institucional.
- Los textos legales son marcadores y requieren validación jurídica.

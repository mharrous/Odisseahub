# ODISSEA HUB

Aplicación web para gestionar programas de incubación y aceleración: convocatorias, candidaturas, proyectos, itinerarios, mentorías, entregables, indicadores, documentos e informes.

Aplicación publicada: [https://odissea-hub.pages.dev](https://odissea-hub.pages.dev)

## Estado

La versión 0.1 entrega una primera aplicación funcional y navegable con persistencia local de desarrollo y una base Supabase versionada. Consulta [PROGRESS.md](./PROGRESS.md) para ver el alcance exacto y las funciones pendientes.

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

La migración crea el modelo multi-organización, funciones de autorización, índices y RLS. El seed aporta una organización, programa, convocatoria, cohorte, ocho proyectos, tres mentores, fases, módulos, indicadores, eventos y documentos ficticios.

Los usuarios demo de la interfaz son perfiles locales y no representan cuentas de producción. En Supabase local, crea los usuarios mediante Auth o un script administrativo fuera del navegador.

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

- Sin credenciales se usa persistencia local, no un backend remoto.
- Correo, PDF/XLSX avanzado, calendario completo, comunidad y Copiloto requieren siguientes iteraciones.
- La migración debe probarse contra una instancia Supabase local/remota antes de producción.
- Los textos legales son marcadores y requieren validación jurídica.

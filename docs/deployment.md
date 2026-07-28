# Despliegue

## Supabase

1. Crea un proyecto y conserva las claves fuera del repositorio.
2. Enlaza el CLI con `npx supabase link --project-ref <ref>`.
3. Aplica migraciones con `npx supabase db push`.
4. Carga el seed solo en desarrollo con `npx supabase db reset`.
5. Crea buckets privados para candidaturas, entregables y documentos.
6. Configura en Cloudflare únicamente `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

La `service_role` nunca debe configurarse como variable `VITE_*` ni llegar al navegador.

## Cloudflare Pages

- Comando de build: `npm run build`
- Directorio de salida: `dist`
- Versión recomendada de Node: la definida en `.nvmrc`
- SPA fallback: `public/_redirects`
- Cabeceras básicas: `public/_headers`

También se admite despliegue directo:

```powershell
npx wrangler pages deploy .\dist --project-name=odissea-hub
```

No se ha realizado un despliegue sin autorización ni credenciales del usuario.

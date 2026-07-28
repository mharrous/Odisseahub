# Base de datos

La migración `supabase/migrations/202607280001_initial_schema.sql` crea el núcleo multi-organización, índices, restricciones, `updated_at` y RLS.

## Criterios

- UUID generados con `pgcrypto`.
- `organization_id` en datos pertenecientes a una entidad.
- Eliminación lógica en programas, proyectos y documentos.
- Evaluaciones cerradas no pueden editarse por la política del evaluador.
- Auditoría sin políticas de modificación o borrado.
- Rutas privadas de archivos almacenadas en PostgreSQL; la descarga debe resolverse mediante URL firmada en una Edge Function.

## Generar tipos

```powershell
npx supabase gen types typescript --local | Out-File -Encoding utf8 src/types/database.generated.ts
```

Los tipos generados deben regenerarse después de cada migración aplicada.

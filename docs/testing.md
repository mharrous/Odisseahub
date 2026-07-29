# Estrategia de pruebas

- Vitest: utilidades, validación y componentes.
- React Testing Library: contenido y comportamiento accesible.
- Playwright: flujos verticales en 1440 px y 390 px.
- RLS: aplicar la migración local y probar con JWT de cada rol antes de producción.
- CI: ejecuta lint, tipos, unitarias, E2E y build en cada `push` o `pull_request`.

Comandos:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Los E2E cubren creación persistente de programa, candidatura completa, bloqueo de una ruta administrativa para participante y la presencia/apertura de todas las acciones de convocatorias, candidaturas, evaluaciones, cohortes, mentores, itinerarios, eventos, indicadores, documentos, informes, usuarios, configuración y auditoría. Se ejecutan en escritorio y móvil. Por defecto usan el modo demo para ser deterministas.

## Verificación remota

Antes de publicar cambios de Auth, RLS o Storage:

1. Confirmar columnas, políticas y disparadores en PostgreSQL.
2. Abrir una convocatoria publicada sin sesión interna.
3. Crear la sesión anónima, guardar el borrador y subir un PDF de prueba.
4. Presentar y comprobar un registro generado por la base de datos.
5. Confirmar en SQL el estado `submitted`, el archivo, `locked_at` y los eventos de auditoría.
6. Verificar dashboard, candidaturas, perfil, notificaciones y cierre de sesión con una cuenta interna real.
7. Repetir una comprobación responsive y revisar la consola del navegador sobre la URL desplegada.
8. Probar altas, edición, archivado y eliminación con una cuenta administrativa real, incluido un documento de prueba y un informe.
9. Confirmar que `invite-user` rechaza peticiones sin sesión y que una invitación autorizada crea Auth, perfil y membresía.

La prueba remota manual del 29 de julio de 2026 completó los pasos 1 a 5 con `ODI-2026-000001`.

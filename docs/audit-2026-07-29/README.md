# Auditoría funcional — 29 de julio de 2026

## Alcance

Revisión autenticada de la navegación administrativa, barra superior, programas, módulos operativos, proyectos y ficha 360º, además de comprobaciones responsive en escritorio y móvil.

## Evidencias

- `01-admin-dashboard.png`: panel administrativo y accesos principales.
- `02-programas.png`: listado de programas.
- `03-modulo-convocatorias.png`: módulo operativo de primera fase.
- `04-proyecto-360.png`: resumen de proyecto.
- `05-proyecto-tab-placeholder.png`: estado anterior de las pestañas sin lógica.
- `06-final-dashboard.png`: dashboard final publicado.
- `07-final-modulo-crud.png`: escritura real verificada en un módulo.
- `08-final-programas-menu.png`: menú de ciclo de vida de Programas.
- `09-final-proyecto-tab.png`: pestaña Entregables conectada a Supabase.

## Hallazgos corregidos

- Los accesos `Nuevo programa`, `Ver todo` y `Calendario` ya navegan o abren la acción correspondiente.
- El buscador superior encuentra secciones permitidas por el rol.
- Ayuda y notificaciones abren paneles accesibles con destinos reales.
- Programas permite crear, buscar, filtrar, editar, duplicar, publicar, activar, finalizar y archivar.
- Los módulos permiten buscar, filtrar, crear, editar y eliminar con persistencia; Auditoría permanece en solo lectura.
- Proyectos se cargan desde el repositorio, tienen filtros y abren su ficha por UUID.
- Las nueve pestañas operativas de la ficha 360º dejaron de ser placeholders y permiten CRUD asociado al proyecto.
- Los accesos directos de participante, mentor y evaluador ya llevan al flujo correspondiente.

## Persistencia y seguridad

La migración `202607290001_workspace_items.sql` crea `workspace_items`, activa RLS y limita lectura y escritura a miembros y gestores autorizados. Se aplicó al proyecto remoto y se verificaron 20 tipos de registros activos. El modo demo conserva un fallback local para desarrollo y E2E.

## Verificación

- ESLint: aprobado.
- TypeScript estricto: aprobado.
- Unitarias: 3/3.
- E2E: 10/10 en escritorio y móvil.
- Build Vite de producción: aprobado.

import { expect, test } from '@playwright/test'

test('administración: acceso, dashboard y creación persistente de programa', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en mentoría/i }).click()
  await expect(page.getByRole('heading', { name: /el programa, de un vistazo/i })).toBeVisible()
  if ((page.viewportSize()?.width ?? 1440) < 700) {
    await page.getByRole('button', { name: 'Abrir menú' }).click()
  }
  await page.getByRole('link', { name: 'Programas' }).click()
  await page.getByRole('button', { name: 'Nuevo programa' }).click()
  await page.getByLabel('Nombre *').fill('Programa E2E')
  await page.getByLabel('Fecha de inicio *').fill('2027-01-10')
  await page.getByLabel('Fecha de fin *').fill('2027-10-10')
  await page.getByRole('button', { name: 'Crear en borrador' }).click()
  await expect(page.getByText('Programa E2E')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Programa E2E')).toBeVisible()
})

test('candidatura: borrador, documento, presentación y resguardo', async ({ page }) => {
  await page.goto('/convocatorias/primera-mentoria/solicitud')
  await page.getByLabel('Nombre del proyecto *').fill('Proyecto de prueba')
  await page.getByLabel('Persona de contacto *').fill('Persona Ficticia')
  await page.getByLabel('Correo electrónico *').fill('demo@example.invalid')
  await page.getByLabel('Resumen del proyecto *').fill('Proyecto tecnológico ficticio para validar el flujo completo de candidatura.')
  await page.getByLabel('Documento del proyecto *').setInputFiles({ name: 'memoria.pdf', mimeType: 'application/pdf', buffer: Buffer.from('demo') })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Guardar borrador' }).click()
  await expect(page.getByText('Borrador guardado')).toBeVisible()
  await page.getByRole('button', { name: 'Presentar candidatura' }).click()
  await expect(page.getByRole('heading', { name: 'Tu proyecto ya está registrado' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar resguardo' })).toBeVisible()
})

test('Rutas privadas bloquean a un participante', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Participante' }).click()
  await page.getByRole('button', { name: /entrar en mentoría/i }).click()
  await page.goto('/admin/auditoria')
  await expect(page.getByRole('heading', { name: /no tienes permiso/i })).toBeVisible()
})

test('administración: buscador, ayuda, módulo editable y ficha 360', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en mentoría/i }).click()

  if ((page.viewportSize()?.width ?? 1440) >= 700) {
    await page.getByLabel('Buscar en Mentoría').fill('eventos')
    await page.getByRole('option', { name: /eventos/i }).click()
    await expect(page.getByRole('heading', { name: 'Eventos' })).toBeVisible()
    await page.getByRole('button', { name: 'Ayuda' }).click()
    await expect(page.getByRole('heading', { name: 'Ayuda de Mentoría' })).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  }

  await page.goto('/admin/eventos')
  await page.getByRole('button', { name: 'Nuevo evento' }).click()
  await page.getByLabel('Nombre *').fill('Evento funcional E2E')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Evento funcional E2E')).toBeVisible()
  await page.getByRole('button', { name: 'Editar' }).filter({ visible: true }).last().click()
  await page.getByLabel('Nombre *').fill('Evento editado E2E')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Evento editado E2E')).toBeVisible()

  await page.goto('/admin/proyectos/p1')
  await page.getByRole('tab', { name: 'Entregables' }).click()
  await expect(page.getByText('Próximo entregable del proyecto')).toBeVisible()
  await page.getByRole('button', { name: 'Añadir entregable' }).click()
  await page.getByLabel('Nombre del entregable *').fill('Entregable ficha E2E')
  await page.getByLabel('Fecha límite *').fill('2027-06-30')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Entregable ficha E2E')).toBeVisible()
})

test('administración: cada sección del proyecto tiene su formulario y lógica específica', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en mentoría/i }).click()
  await page.goto('/admin/proyectos/p1')

  const sections = [
    { tab: 'Equipo', action: 'Añadir miembro', field: 'Correo electrónico *' },
    { tab: 'Itinerario', action: 'Añadir hito', field: 'Progreso (%)' },
    { tab: 'Entregables', action: 'Añadir entregable', field: 'Enlace a la evidencia' },
    { tab: 'Mentorías', action: 'Programar mentoría', field: 'Duración (minutos) *' },
    { tab: 'Sesiones', action: 'Programar sesión', field: 'Enlace de reunión' },
    { tab: 'Indicadores', action: 'Añadir indicador', field: 'Valor actual *' },
    { tab: 'Documentos', action: 'Añadir documento', field: 'Enlace al archivo *' },
    { tab: 'Actividad', action: 'Registrar actividad', field: 'Tipo' },
    { tab: 'Observaciones', action: 'Añadir observación', field: 'Visibilidad' },
  ]

  for (const section of sections) {
    await page.getByRole('tab', { name: section.tab }).click()
    await page.getByRole('button', { name: section.action }).click()
    await expect(page.getByRole('heading', { name: section.action })).toBeVisible()
    await expect(page.getByLabel(section.field)).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  }

  await page.getByRole('tab', { name: 'Mentorías' }).click()
  await page.getByRole('button', { name: 'Programar mentoría' }).click()
  await page.getByLabel('Tema de la mentoría *').fill('Validación comercial')
  await page.getByLabel('Mentor *').fill('Mentora E2E')
  await page.getByLabel('Fecha *').fill('2027-05-20')
  await page.getByLabel('Hora *').fill('10:30')
  await page.getByLabel('Duración (minutos) *').fill('60')
  await page.getByLabel('Modalidad').selectOption('Online')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Validación comercial')).toBeVisible()
  await expect(page.getByText('60 min')).toBeVisible()
  await expect(page.getByText('Online')).toBeVisible()
})

test('administración: todos los módulos muestran acciones funcionales completas', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en mentoría/i }).click()

  const modules = [
    { path: 'convocatorias', heading: 'Convocatorias', create: 'Nueva convocatoria', edit: 'Editar', remove: 'Archivar' },
    { path: 'evaluaciones', heading: 'Evaluaciones', create: 'Nueva evaluación', edit: 'Editar', remove: 'Eliminar' },
    { path: 'cohortes', heading: 'Cohortes', create: 'Nueva cohorte', edit: 'Editar', remove: 'Archivar' },
    { path: 'mentores', heading: 'Mentores', create: 'Nuevo mentor', edit: 'Editar', remove: 'Archivar' },
    { path: 'itinerarios', heading: 'Itinerarios', create: 'Nuevo itinerario', edit: 'Editar', remove: 'Eliminar' },
    { path: 'eventos', heading: 'Eventos', create: 'Nuevo evento', edit: 'Editar', remove: 'Eliminar' },
    { path: 'indicadores', heading: 'Indicadores', create: 'Nuevo indicador', edit: 'Editar', remove: 'Eliminar' },
    { path: 'documentos', heading: 'Documentos y evidencias', create: 'Nuevo documento', edit: 'Editar', remove: 'Eliminar' },
    { path: 'informes', heading: 'Informes', create: 'Generar informe', remove: 'Eliminar' },
    { path: 'usuarios', heading: 'Usuarios y permisos', create: 'Invitar usuario', edit: 'Editar', remove: 'Archivar' },
  ]

  for (const module of modules) {
    await page.goto(`/admin/${module.path}`)
    await expect(page.getByRole('heading', { name: module.heading })).toBeVisible()
    await expect(page.getByRole('button', { name: module.create, exact: true })).toBeVisible()
    if (module.edit) await expect(page.getByRole('button', { name: module.edit, exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: module.remove, exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: module.create, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  }

  await page.goto('/admin/candidaturas')
  await expect(page.getByRole('heading', { name: 'Candidaturas' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Revisar', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nueva candidatura', exact: true })).toHaveCount(0)

  await page.goto('/admin/configuracion')
  await page.getByRole('button', { name: 'Editar configuración', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()

  await page.goto('/admin/auditoria')
  await expect(page.getByText('Registro inmutable obtenido de Supabase.').or(page.getByText('Los cambios se guardan de forma persistente y respetan los permisos de tu organización.'))).toBeVisible()
  await expect(page.getByRole('button', { name: /nuevo|editar|eliminar|archivar/i })).toHaveCount(0)
})

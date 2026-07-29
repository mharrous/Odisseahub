import { expect, test } from '@playwright/test'

test('administración: acceso, dashboard y creación persistente de programa', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en odissea hub/i }).click()
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
  await page.goto('/convocatorias/primera-odissea/solicitud')
  await page.getByLabel('Nombre del proyecto *').fill('Proyecto de prueba')
  await page.getByLabel('Persona de contacto *').fill('Persona Ficticia')
  await page.getByLabel('Correo electrónico *').fill('demo@example.invalid')
  await page.getByLabel('Resumen del proyecto *').fill('Proyecto tecnológico ficticio para validar el flujo completo de candidatura.')
  await page.getByLabel('Documento del proyecto *').setInputFiles({ name: 'memoria.pdf', mimeType: 'application/pdf', buffer: Buffer.from('demo') })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Guardar borrador' }).click()
  await expect(page.getByText('Borrador guardado')).toBeVisible()
  await page.getByRole('button', { name: 'Presentar candidatura' }).click()
  await expect(page.getByRole('heading', { name: 'Tu proyecto ya está en ruta' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar resguardo' })).toBeVisible()
})

test('Rutas privadas bloquean a un participante', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Participante' }).click()
  await page.getByRole('button', { name: /entrar en odissea hub/i }).click()
  await page.goto('/admin/auditoria')
  await expect(page.getByRole('heading', { name: /no tienes permiso/i })).toBeVisible()
})

test('administración: buscador, ayuda, módulo editable y ficha 360', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en odissea hub/i }).click()

  if ((page.viewportSize()?.width ?? 1440) >= 700) {
    await page.getByLabel('Buscar en ODISSEA HUB').fill('eventos')
    await page.getByRole('option', { name: /eventos/i }).click()
    await expect(page.getByRole('heading', { name: 'Eventos' })).toBeVisible()
    await page.getByRole('button', { name: 'Ayuda' }).click()
    await expect(page.getByRole('heading', { name: 'Ayuda de ODISSEA HUB' })).toBeVisible()
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
  await page.getByRole('button', { name: 'Añadir' }).click()
  await page.getByLabel('Nombre *').fill('Entregable ficha E2E')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Entregable ficha E2E')).toBeVisible()
})

import { expect, test } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

test('captura dashboard y comprueba consola', async ({ page }, testInfo) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.goto('/login')
  await page.getByRole('button', { name: 'Administración' }).click()
  await page.getByRole('button', { name: /entrar en mentoría/i }).click()
  await expect(page.getByRole('heading', { name: /el programa, de un vistazo/i })).toBeVisible()
  await page.mouse.move(1, 1)

  mkdirSync('docs/screenshots', { recursive: true })
  await page.screenshot({ path: `docs/screenshots/dashboard-${testInfo.project.name}.png`, fullPage: true })
  writeFileSync(`docs/screenshots/console-${testInfo.project.name}.json`, JSON.stringify(consoleErrors, null, 2))

  expect(consoleErrors).toEqual([])
})

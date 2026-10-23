import { expect, test } from '@playwright/test'
import { mockCmsApi, seedSession } from './helpers'

test('unauthenticated /dashboard is redirected to the login gate', async ({ page }) => {
  // No cookies, no mocks: the middleware must bounce before any data call.
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('security headers are served on app routes', async ({ page }) => {
  const res = await page.request.get('/login')
  const headers = res.headers()
  expect(res.status()).toBe(200)
  // Locked in by the S1 hardening — these fail if the headers regress.
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
})

test('bad credentials surface the API error on the login form', async ({ page }) => {
  await mockCmsApi(page, { loginStatus: 401, loginMessage: 'Invalid credentials' })
  await page.goto('/login')
  await page.locator('input[type=email]').fill('nobody@rangani.test')
  await page.locator('input[type=password]').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText('Invalid credentials')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('successful login lands on the dashboard with the identity shown', async ({ page }) => {
  await mockCmsApi(page)
  // The middleware gate needs the refresh cookie present for the post-login
  // redirect; the BFF would set it in a real flow.
  await seedSession(page)
  await page.goto('/login')
  await page.locator('input[type=email]').fill('admin@rangani.test')
  await page.locator('input[type=password]').fill('correct-horse')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('link', { name: /Static Pages/ }).first()).toBeVisible()
  // Sidebar identity decoded from the access-token cookie.
  await expect(page.getByText('E2E Admin')).toBeVisible()
})

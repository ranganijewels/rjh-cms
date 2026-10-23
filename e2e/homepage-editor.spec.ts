import { expect, test } from '@playwright/test'
import { mockCmsApi, seedSession } from './helpers'

test('editing the Featured Collections heading saves via PUT', async ({ page }) => {
  await mockCmsApi(page)
  await seedSession(page)

  // Capture the save request the editor makes.
  let saved: any = null
  await page.route(
    (url) => /\/cms\/sections\/sec-1$/.test(url.pathname),
    async (route) => {
      if (route.request().method() === 'PUT') saved = route.request().postDataJSON()
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'sec-1' } }),
      })
    },
  )

  await page.goto('/homepage')
  const heading = page.getByPlaceholder('Featured Collections')
  await expect(heading).toBeVisible()
  await heading.fill('Jewels of E2E')

  // Featured Collections is the first section card on the page.
  await page.getByRole('button', { name: 'Save & Publish' }).first().click()

  // Success toast (the redesigned one — no alert()).
  await expect(page.getByText('Saved & published to the storefront')).toBeVisible()

  // The PUT carried the edited content for the right section.
  expect(saved).not.toBeNull()
  expect(saved.sectionKey).toBe('featured-collection')
  expect(saved.pageSlug).toBe('homepage')
  expect(saved.content.heading).toBe('Jewels of E2E')
})

test('save failure shows the inline error, not a crash', async ({ page }) => {
  await mockCmsApi(page)
  await seedSession(page)
  await page.route(
    (url) => /\/cms\/sections\/sec-1$/.test(url.pathname),
    (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Requires one of: admin' }),
      }),
  )

  await page.goto('/homepage')
  await page.getByRole('button', { name: 'Save & Publish' }).first().click()
  await expect(page.getByText('Requires one of: admin')).toBeVisible()
})

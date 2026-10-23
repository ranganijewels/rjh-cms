import { expect, test } from '@playwright/test'
import { mockCmsApi, seedSession } from './helpers'

test.beforeEach(async ({ page }) => {
  await mockCmsApi(page)
  await seedSession(page)
})

test('KPI tiles render with counts from the API', async ({ page }) => {
  await page.goto('/dashboard')
  // Fixture counts: pages 3, blogs 2, faqs 1, sections 2. Each label exists
  // as a sidebar link (no count), a hero KPI tile ("… 3 Manage") and a
  // glance row ("… 3 38%") — the count + "Manage" pins the hero tile.
  await expect(page.getByRole('link', { name: /Static Pages 3 Manage/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Blog Posts 2 Manage/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /FAQs 1 Manage/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Page Sections 2 Manage/ })).toBeVisible()
})

test('quick actions link to their editors', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: /Write a blog post/ })).toHaveAttribute('href', '/blog')
  await expect(page.getByRole('link', { name: /Edit navigation/ })).toHaveAttribute('href', '/navigation')
  await expect(page.getByRole('link', { name: /View contact inbox/ })).toHaveAttribute(
    'href',
    '/forms/contact',
  )
})

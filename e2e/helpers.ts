import type { Page } from '@playwright/test'

// ─── Hermetic CMS smoke helpers ─────────────────────────────────────────────
// Every browser → API call (including the /api/auth BFF routes) is answered
// by fixtures here, so the suite never reaches api.ranganijewelry.com and
// needs no credentials or secrets — it runs on any CI runner.

// The CMS only *decodes* the access token client-side (identity badge);
// no verification happens in the browser and every API call is mocked,
// so a structurally valid fake is as good as a real token here.
const b64url = (o: object) =>
  btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const ACCESS_TOKEN = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
  sub: 'e2e-admin',
  email: 'admin@rangani.test',
  fullName: 'E2E Admin',
  role: 'admin',
  tenantId: 'e2e-tenant',
  exp: Math.floor(Date.now() / 1000) + 900,
})}.e2e`

const SEED_USER = {
  id: 'e2e-admin',
  email: 'admin@rangani.test',
  role: 'admin',
  fullName: 'E2E Admin',
  tenantId: 'e2e-tenant',
}

const PAGES = [
  { id: 'p1', title: 'About Us', slug: 'about', isPublished: true },
  { id: 'p2', title: 'Contact', slug: 'contact', isPublished: true },
  { id: 'p3', title: 'Privacy', slug: 'privacy', isPublished: false },
]

const BLOGS = [
  { id: 'b1', title: 'How to choose a diamond', slug: 'choose-diamond', isPublished: true },
  { id: 'b2', title: 'Ring sizing guide', slug: 'ring-sizing', isPublished: false },
]

const FAQS = [{ id: 'f1', question: 'Do you ship worldwide?', isActive: true }]

// The homepage editor maps sections by sectionKey; sec-1 is the Featured
// Collections card the editor spec edits and saves.
const SECTIONS = [
  {
    id: 'sec-1',
    pageSlug: 'homepage',
    sectionKey: 'featured-collection',
    sectionType: 'featured-collection',
    label: 'Featured Collections',
    sortOrder: 0,
    isPublished: true,
    content: {
      heading: 'Featured Collections',
      subHeading: 'Handpicked favourites',
      banners: [
        { text: 'Diamond Rings', link: '/product?category=Rings', imageUrl: 'https://example.test/ring.jpg' },
      ],
    },
  },
  {
    id: 'sec-2',
    pageSlug: 'homepage',
    sectionKey: 'why-choose',
    sectionType: 'why-choose',
    label: 'Why Choose',
    sortOrder: 1,
    isPublished: true,
    content: {},
  },
]

const CONTACT_SUBMISSIONS = [{ id: 'c1', name: 'Test Customer', isRead: false, message: 'Hello' }]

// Upstream body shape: { success, data } — camelCase is fine, the axios
// interceptor adds snake_case aliases client-side.
const ok = (data: unknown) => ({
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data }),
})

/**
 * Register browser-level routes for the login BFF and every API endpoint the
 * covered pages call. `loginStatus >= 400` simulates bad credentials.
 */
export async function mockCmsApi(
  page: Page,
  opts: { loginStatus?: number; loginMessage?: string } = {},
) {
  await page.route(
    (url) => url.pathname.endsWith('/api/auth/login'),
    (route) =>
      route.fulfill(
        opts.loginStatus && opts.loginStatus >= 400
          ? {
              contentType: 'application/json',
              status: opts.loginStatus,
              body: JSON.stringify({
                success: false,
                message: opts.loginMessage || 'Invalid credentials',
              }),
            }
          : ok({ accessToken: ACCESS_TOKEN, user: SEED_USER }),
      ),
  )
  await page.route((url) => url.pathname.endsWith('/cms/pages'), (r) => r.fulfill(ok(PAGES)))
  await page.route((url) => url.pathname.endsWith('/cms/blogs'), (r) => r.fulfill(ok(BLOGS)))
  await page.route((url) => url.pathname.endsWith('/cms/faqs'), (r) => r.fulfill(ok(FAQS)))
  await page.route((url) => url.pathname.endsWith('/cms/sections'), (r) => r.fulfill(ok(SECTIONS)))
  await page.route(
    (url) => url.pathname.endsWith('/storefront/contact-submissions'),
    (r) => r.fulfill(ok(CONTACT_SUBMISSIONS)),
  )
}

/**
 * Seed the cookies a real login would leave behind. The middleware gate only
 * checks that cms_refresh_token EXISTS (real validation happens upstream on
 * every API call — covered by the BFF curl tests and manual login checks);
 * cms_access_token drives the sidebar identity.
 */
export async function seedSession(page: Page) {
  await page.context().addCookies([
    { name: 'cms_refresh_token', value: 'e2e-seed', domain: 'localhost', path: '/' },
    { name: 'cms_access_token', value: ACCESS_TOKEN, domain: 'localhost', path: '/' },
  ])
}

# RJ House CMS

Content-management studio for the Rangani storefront: homepage sections, hero
banners, blog, FAQs, coupons, navigation & mega menus, PDP copy, theme tokens
and the contact/lead inboxes. Next.js App Router + TypeScript + Tailwind.

## Ports

Local services follow one convention so nothing collides:

| Service        | Port |
| -------------- | ---- |
| Storefront     | 3000 |
| **This CMS**   | **3001** |
| Legacy admin   | 3002 |
| API (NestJS)   | 4000 |

`npm run dev` / `npm start` already bind 3001.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in values
npm run dev                        # http://localhost:3001
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base, e.g. `https://api.ranganijewelry.com/api/v1` |
| `NEXT_PUBLIC_TENANT_ID` | Tenant UUID sent as `x-tenant-id` on every request |
| `NEXT_PUBLIC_STOREFRONT_URL` | Storefront origin for "View on site" links |

## Architecture

- `src/app/(app)/…` — authenticated screens. The `(app)` group wraps every
  screen in `AppShell` (sidebar + top bar) and is gated by `src/middleware.ts`:
  no `cms_refresh_token` cookie → redirected to `/login`.
- `src/app/login/page.tsx` — signs in against the API and stores the JWT in
  `cms_access_token` (memory/cookie) with the refresh token in an httpOnly
  cookie.
- `src/lib/api.ts` — the single axios instance (tenant header, bearer token,
  refresh-on-401 interceptor). All screens go through it; none call `fetch`.
- `src/lib/nav.ts` — the single source of truth for the sidebar IA and the ⌘K
  command palette.
- `src/components/` — shared UI: `AppShell`, `Sidebar`, `CommandPalette`
  (⌘K), `DataTable` (pagination + search), `Dialog` (accessible modals),
  `Toast`, `PageHeader`, `EmptyState`, `MediaField`, `IconPicker`.
- `src/app/(app)/error.tsx`, `loading.tsx`, `src/app/not-found.tsx` — route
  boundaries so a failing screen never takes the shell down.

Content is served from CMS "sections" (`/cms/sections`, keyed by
`page_slug` + `sectionKey`); the storefront merges them over its defaults, so
every editor here is a thin form over one JSON blob.

## Scripts

```bash
npm run dev      # dev server on :3001
npm run build    # production build (also runs typecheck + lint)
npm run start    # serve the build on :3001
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit # strict-mode typecheck
npm run test:e2e     # Playwright smoke suite (builds + serves the prod build on :3100)
npm run test:e2e:ui  # same suite in Playwright UI mode
```

## E2E smoke tests

`e2e/` contains a hermetic Playwright suite: every browser → API call
(including the `/api/auth/*` BFF routes) is answered by fixtures in
`e2e/helpers.ts`, so the tests never reach `api.ranganijewelry.com` and need
no credentials — they run on any machine or CI runner. Coverage: middleware
login gate, security headers (CSP/nosniff/etc. locked in by the S1
hardening), login success + failure, dashboard KPI rendering, and the
homepage editor's save flow (success toast + inline error path). The suite
always runs against the **production** build, so the strict CSP is exercised
on every run.

## Quality gates

- `tsconfig.json` uses `"strict": true`.
- ESLint errors fail CI. `@typescript-eslint/no-explicit-any` is set to
  **warn** in `.eslintrc.json`: there are ~180 pre-existing `any`s across the
  legacy editors, kept visible as debt rather than hidden or mass-refactored.
- GitHub Actions (`.github/workflows/ci.yml`) runs install → typecheck →
  lint → build → Playwright smoke tests on every push/PR to `main`.

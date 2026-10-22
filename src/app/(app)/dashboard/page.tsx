'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import {
  FileText,
  Newspaper,
  HelpCircle,
  LayoutTemplate,
  Inbox,
  Tag,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Menu as MenuIcon,
} from 'lucide-react'

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'

interface Counts {
  pages: number
  blogs: number
  faqs: number
  sections: number
}

interface Errors {
  pages: boolean
  blogs: boolean
  faqs: boolean
  sections: boolean
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts>({ pages: 0, blogs: 0, faqs: 0, sections: 0 })
  const [errors, setErrors] = useState<Errors>({ pages: false, blogs: false, faqs: false, sections: false })
  const [loading, setLoading] = useState(true)
  const [contactCount, setContactCount] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      api.get('/cms/pages'),
      api.get('/cms/blogs'),
      api.get('/cms/faqs'),
      api.get('/cms/sections'),
    ]).then(([p, b, f, s]) => {
      const len = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' && Array.isArray(r.value?.data?.data) ? r.value.data.data.length : 0
      setCounts({ pages: len(p), blogs: len(b), faqs: len(f), sections: len(s) })
      setErrors({
        pages: p.status === 'rejected',
        blogs: b.status === 'rejected',
        faqs: f.status === 'rejected',
        sections: s.status === 'rejected',
      })
      setLoading(false)
    })

    api
      .get('/storefront/contact-submissions')
      .then((r) => {
        const list = Array.isArray(r?.data?.data) ? r.data.data : []
        const unread = list.filter((item: any) => !item?.isRead && !item?.read).length
        setContactCount(unread || list.length)
      })
      .catch(() => setContactCount(null))
  }, [])

  // The four headline numbers, each with its navy→gold segment colour used by
  // the "content at a glance" bar and its legend dots.
  const tiles = [
    { href: '/pages', label: 'Static Pages', icon: FileText, count: counts.pages, error: errors.pages, segment: 'bg-brand-900' },
    { href: '/blog', label: 'Blog Posts', icon: Newspaper, count: counts.blogs, error: errors.blogs, segment: 'bg-brand-700' },
    { href: '/faqs', label: 'FAQs', icon: HelpCircle, count: counts.faqs, error: errors.faqs, segment: 'bg-brand-500' },
    { href: '/sections', label: 'Page Sections', icon: LayoutTemplate, count: counts.sections, error: errors.sections, segment: 'bg-brand-gold' },
  ]

  const total = tiles.reduce((sum, t) => sum + t.count, 0)
  const withShare = tiles.map((t) => ({
    ...t,
    share: total ? Math.round((t.count / total) * 100) : 0,
  }))

  // NOTE: Blog/FAQs/Coupons pages open their create form via internal component
  // state (e.g. `showNewDialog`/`editing`), not a URL query param, so true deep
  // linking into the create flow would require adding query-param handling to
  // those pages too. Deferred as an out-of-scope, multi-file change — see
  // summary. Links below at least point at distinct, non-duplicated targets.
  const quick = [
    { href: '/blog', label: 'Write a blog post', hint: 'Editorial & buying guides', icon: Newspaper },
    { href: '/faqs', label: 'Add a FAQ', hint: 'Answer a common question', icon: HelpCircle },
    { href: '/coupons', label: 'Create coupon code', hint: 'Promotions & discounts', icon: Tag },
    { href: '/sections', label: 'Add a page section', hint: 'Compose a storefront page', icon: LayoutTemplate },
    { href: '/navigation', label: 'Edit navigation', hint: 'Menu items & mega menu', icon: MenuIcon },
    { href: '/forms/contact', label: 'View contact inbox', hint: 'Customer messages', icon: Inbox },
  ]

  // Rendered client-side only; suppressHydrationWarning keeps the server's
  // clock from disagreeing with the browser's on first paint.
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const today = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      {/* ── Welcome hero + headline numbers ─────────────────────────────── */}
      <section
        aria-busy={loading}
        className="overflow-hidden rounded-2xl bg-brand-navy text-white shadow-[0_12px_32px_rgba(11,20,36,0.22)]"
      >
        <div className="relative">
          {/* Gold bloom + faint grid, purely decorative. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-brand-gold/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]"
          />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <span className="mb-5 block h-px w-12 bg-brand-gold" aria-hidden="true" />
              <p className="text-sm text-white/60" suppressHydrationWarning>
                {greeting} · {today}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome to the Content Studio
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
                Manage what customers see on the storefront — pages, banners, blog, FAQs and
                promotions. Products and inventory are managed in the ERP.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-medium text-brand-navy shadow-sm transition hover:bg-[#e2bf58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                <Plus className="h-4 w-4" /> Write a post
              </Link>
              <a
                href={`${STOREFRONT}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                View storefront <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Headline numbers live inside the hero as a hairline-divided strip. */}
          <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
            {tiles.map((t) => {
              const Icon = t.icon
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="group bg-brand-navy px-5 py-5 transition hover:bg-white/5 sm:px-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Fixed height keeps every KPI number on the same baseline
                        whether the label wraps to one line or two. */}
                    <span className="flex h-8 items-start text-xs font-medium uppercase leading-4 tracking-wider text-white/45">
                      {t.label}
                    </span>
                    {t.error && (
                      <span
                        className="text-amber-400"
                        title="Failed to load"
                        aria-label="Failed to load"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div
                      className="mt-2 h-9 w-16 animate-pulse rounded bg-white/10"
                      aria-live="polite"
                      aria-label="Loading count"
                    />
                  ) : t.error ? (
                    <div className="mt-2 text-3xl font-semibold text-white/40">—</div>
                  ) : (
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {t.count}
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-white/45 transition group-hover:text-white/80">
                    Manage
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    <Icon className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-60" aria-hidden="true" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Content mix + inbox ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Content at a glance</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                How everything you manage is distributed across content types.
              </p>
            </div>
            {!loading && total > 0 && (
              <span className="badge bg-brand-50 text-brand-navy shrink-0">{total} items</span>
            )}
          </div>

          {loading ? (
            <div className="mt-5 animate-pulse space-y-4" aria-busy="true" aria-live="polite">
              <div className="h-3 rounded-full bg-slate-100" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded-lg bg-slate-100" />
                ))}
              </div>
            </div>
          ) : total === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No content yet — add a page section or write the first post to get started.
            </p>
          ) : (
            <>
              <div
                className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
                aria-hidden="true"
              >
                {withShare.map(
                  (m) =>
                    m.count > 0 && (
                      <div
                        key={m.href}
                        className={`${m.segment} h-full transition-all duration-500`}
                        style={{ width: `${m.share}%` }}
                      />
                    ),
                )}
              </div>

              <ul className="mt-5 grid gap-1 sm:grid-cols-2">
                {withShare.map((m) => {
                  const Icon = m.icon
                  return (
                    <li key={m.href}>
                      <Link
                        href={m.href}
                        className="group -mx-2 flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition hover:border-slate-200 hover:bg-slate-50"
                      >
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.segment} text-white`}
                          aria-hidden="true"
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-5 text-slate-700 group-hover:text-slate-900">
                            {m.label}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {m.error ? '—' : m.count}
                        </span>
                        <span className="w-10 text-right text-xs text-slate-400">
                          {m.error ? '' : `${m.share}%`}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        <section className="card flex flex-col p-6 lg:col-span-2">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Needs attention</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Customer messages waiting for a reply.
            </p>
          </div>

          <div className="mt-4 flex-1">
            <Link
              href="/forms/contact"
              className="group flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                <Inbox className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">
                  {contactCount === null
                    ? 'Contact inbox status unavailable'
                    : contactCount === 0
                    ? 'No new contact submissions'
                    : `${contactCount} contact submission${contactCount === 1 ? '' : 's'} to review`}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">Open the contact inbox</span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
            <span className="h-px w-6 bg-brand-gold" aria-hidden="true" />
            <a
              href={`${STOREFRONT}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-600 transition hover:text-slate-900"
            >
              Preview the live storefront
            </a>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </div>
        </section>
      </div>

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Quick actions</h2>
            <p className="mt-0.5 text-xs text-slate-500">Jump straight into a task.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quick.map((q) => {
            const Icon = q.icon
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50/30 hover:shadow-[0_2px_10px_rgba(11,20,36,0.06)]"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-navy transition group-hover:bg-brand-navy group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5 text-slate-800">{q.label}</span>
                  <span className="block text-xs leading-4 text-slate-500">{q.hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import api from '@/lib/api'
import {
  FileText,
  Newspaper,
  HelpCircle,
  LayoutTemplate,
  Inbox,
  Tag,
  AlertTriangle,
} from 'lucide-react'

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

  const tiles = [
    { href: '/pages', label: 'Static Pages', icon: FileText, count: counts.pages, error: errors.pages },
    { href: '/blog', label: 'Blog Posts', icon: Newspaper, count: counts.blogs, error: errors.blogs },
    { href: '/faqs', label: 'FAQs', icon: HelpCircle, count: counts.faqs, error: errors.faqs },
    { href: '/sections', label: 'Page Sections', icon: LayoutTemplate, count: counts.sections, error: errors.sections },
  ]

  // NOTE: Blog/FAQs/Coupons pages open their create form via internal component
  // state (e.g. `showNewDialog`/`editing`), not a URL query param, so true deep
  // linking into the create flow would require adding query-param handling to
  // those pages too. Deferred as an out-of-scope, multi-file change — see
  // summary. Links below at least point at distinct, non-duplicated targets.
  const quick = [
    { href: '/blog', label: 'Write a blog post', icon: Newspaper },
    { href: '/faqs', label: 'Add a FAQ', icon: HelpCircle },
    { href: '/coupons', label: 'Create coupon code', icon: Tag },
    { href: '/forms/contact', label: 'View contact inbox', icon: Inbox },
  ]

  return (
    <>
      <PageHeader
        title="Content Studio"
        description="Manage what customers see on the storefront — pages, banners, blog, FAQs, and promotions. Products and inventory are managed in the ERP."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-busy={loading}>
        {tiles.map((t) => {
          const Icon = t.icon
          return (
            <Link
              href={t.href}
              key={t.href}
              className="card p-5 hover:border-brand-300 hover:shadow-[0_2px_10px_rgba(11,20,36,0.08)] transition group relative"
            >
              {t.error && (
                <span
                  className="absolute top-3 right-3 text-amber-600"
                  title="Failed to load"
                  aria-label="Failed to load"
                >
                  <AlertTriangle className="w-4 h-4" />
                </span>
              )}
              <div className="w-10 h-10 rounded-lg bg-brand-navy/10 text-brand-navy flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              {loading ? (
                <div className="h-9 w-12 rounded animate-pulse bg-slate-200" aria-live="polite" aria-label="Loading count" />
              ) : t.error ? (
                <div className="text-3xl font-semibold text-slate-400">—</div>
              ) : (
                <div className="text-3xl font-semibold tracking-tight text-slate-900">{t.count}</div>
              )}
              <div className="text-sm text-slate-500 mt-1 group-hover:text-slate-800 transition flex items-center gap-1.5">
                {t.label}
                <span
                  aria-hidden="true"
                  className="h-px w-4 bg-brand-gold opacity-0 group-hover:opacity-100 transition"
                />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick actions</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {quick.map((q) => {
              const Icon = q.icon
              return (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition"
                >
                  <Icon className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-slate-700">{q.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Needs attention</h3>
          <Link
            href="/forms/contact"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition"
          >
            <Inbox className="w-4 h-4 text-brand-600" />
            <span className="text-sm text-slate-700">
              {contactCount === null
                ? 'Contact inbox status unavailable'
                : contactCount === 0
                ? 'No new contact submissions'
                : `${contactCount} contact submission${contactCount === 1 ? '' : 's'} to review`}
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}

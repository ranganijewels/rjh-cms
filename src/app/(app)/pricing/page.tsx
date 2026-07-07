'use client'

import PageHeader from '@/components/PageHeader'
import { DollarSign, ArrowUpRight } from 'lucide-react'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3003'

// Pricing is managed in the Admin panel — the CMS is content-only. This page
// stays as a signpost so old links/bookmarks don't 404.
export default function PricingMoved() {
  return (
    <>
      <PageHeader
        title="Pricing Configuration"
        description="Pricing is now managed in the Admin panel."
      />
      <div className="card p-6 text-sm text-slate-500 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="leading-relaxed">
            Metal, diamond and labour rates, price previews and margins are managed
            in the <strong className="text-slate-700">Admin panel → Pricing Engine</strong>.
            The CMS handles content, banners, blog and forms only.
          </p>
          <a
            href={`${ADMIN_URL}/dashboard/pricing/metal-rates`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex mt-4"
          >
            Open Pricing in Admin <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  )
}

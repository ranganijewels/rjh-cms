'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import { Plus, Trash2 } from 'lucide-react'

const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'
const PAGE = 'product'
const KEY = 'pdp-content'

const TRUST_ICONS = ['shipping', 'diamond', 'returns', 'lock', 'warranty', 'certificate']
const QUICK_ICONS = ['ruler', 'calendar', 'shipping']

// Editor for content shared by every Product Detail Page — trust badges, the
// why-choose features, the financing line, the shipping/returns + care
// accordions, and the brand pillars. One "pdp-content" section (pageSlug=product);
// the storefront /api/pdp-content serves it with defaults.
export default function PdpEditor() {
  const [content, setContent] = useState<any | null>(null)
  const [secId, setSecId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const r = await api.get('/cms/sections', { params: { pageSlug: PAGE } })
        const sec = (r.data?.data || []).find((s: any) => s.sectionKey === KEY)
        setSecId(sec?.id)
        if (sec?.content && typeof sec.content === 'object' && Object.keys(sec.content).length) {
          setContent(sec.content)
        } else {
          const res = await fetch(`${STOREFRONT}/api/pdp-content`)
          const json = await res.json()
          setContent(json?.data || {})
        }
      } catch (e: any) {
        setError(e?.message || 'Load failed')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function save() {
    setSaving(true)
    setError('')
    try {
      const body = { pageSlug: PAGE, sectionKey: KEY, sectionType: 'custom', label: 'Product Detail Content', sortOrder: 0, isPublished: true, content }
      const res = secId ? await api.put(`/cms/sections/${secId}`, body) : await api.post('/cms/sections', body)
      const newId = res.data?.data?.id || res.data?.id
      if (newId) setSecId(newId)
      toast.success('Saved & published to the storefront')
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !content) return (
    <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-4 bg-slate-200 rounded w-1/4" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  )

  const patch = (p: any) => setContent({ ...content, ...p })
  const badges: any[] = Array.isArray(content.trust_badges) ? content.trust_badges : []
  const why: any[] = Array.isArray(content.why_choose) ? content.why_choose : []
  const fin = content.financing || {}
  const ship: string[] = Array.isArray(content.shipping_returns) ? content.shipping_returns : []
  const care: string[] = Array.isArray(content.certification_care) ? content.certification_care : []
  const byo = content.build_your_own || {}
  const patchByo = (p: any) => patch({ build_your_own: { ...byo, ...p } })
  const ql = content.quick_links || {}
  const qlItems: any[] = Array.isArray(ql.items) ? ql.items : []
  const patchQl = (p: any) => patch({ quick_links: { ...ql, ...p } })
  const ec = content.expert_contact || {}
  const patchEc = (p: any) => patch({ expert_contact: { ...ec, ...p } })
  const diff = content.difference || {}
  const diffItems: any[] = Array.isArray(diff.items) ? diff.items : []
  const patchDiff = (p: any) => patch({ difference: { ...diff, ...p } })
  const bc = content.build_columns || {}
  const bcItems: any[] = Array.isArray(bc.items) ? bc.items : []
  const patchBc = (p: any) => patch({ build_columns: { ...bc, ...p } })

  const list = (items: any[], set: (n: any[]) => void, blank: () => any) => ({
    update: (i: number, v: any) => set(items.map((it, idx) => (idx === i ? (typeof it === 'string' ? v : { ...it, ...v }) : it))),
    remove: (i: number) => set(items.filter((_, idx) => idx !== i)),
    add: () => set([...items, blank()]),
  })
  const bl = list(badges, (n) => patch({ trust_badges: n }), () => ({ icon: 'shipping', label: '' }))
  const wl = list(why, (n) => patch({ why_choose: n }), () => ({ image: '', service_description: '' }))
  const sl = list(ship, (n) => patch({ shipping_returns: n }), () => '')
  const cl = list(care, (n) => patch({ certification_care: n }), () => '')
  const qll = list(qlItems, (n) => patchQl({ items: n }), () => ({ icon: 'ruler', label: '', url: '' }))
  const dl = list(diffItems, (n) => patchDiff({ items: n }), () => ({ title: '', body: '' }))
  const bcl = list(bcItems, (n) => patchBc({ items: n }), () => ({ image: '', title: '', text: '', linkText: '', linkUrl: '' }))

  return (
    <>
      <PageHeader
        title="Product Detail Content"
        description="Trust badges, why-choose features, financing line, shipping/care accordions and brand pillars — shown on every product page."
        actions={
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Trust badges */}
        <Card title="Trust Badges" description="The 4 reassurance badges under the Add-to-Bag button.">
          <div className="space-y-2">
            {badges.map((b, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select className="form-input w-36" value={b.icon || 'shipping'} onChange={(e) => bl.update(i, { icon: e.target.value })}>
                  {TRUST_ICONS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input className="form-input flex-1" value={b.label || ''} onChange={(e) => bl.update(i, { label: e.target.value })} placeholder="Free insured shipping" />
                <button onClick={() => bl.remove(i)} className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={bl.add} className="btn-outline"><Plus className="w-4 h-4" /> Add badge</button>
          </div>
        </Card>

        {/* Why choose features */}
        <Card title="Why Choose (feature icons)" description="The icon + text assurances lower on the product column.">
          <div className="grid sm:grid-cols-2 gap-3">
            {why.map((w, i) => (
              <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
                <div className="w-24 shrink-0">
                  <MediaField label="Icon" value={w.image || ''} onChange={(url) => wl.update(i, { image: url })} prefix="pdp/why" />
                </div>
                <div className="flex-1 space-y-2">
                  <textarea className="form-textarea min-h-[54px]" value={w.service_description || ''} onChange={(e) => wl.update(i, { service_description: e.target.value })} placeholder="100% Certified Conflict-Free Diamonds" />
                  <button onClick={() => wl.remove(i)} className="btn-danger !px-2 !py-1 text-xs"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={wl.add} className="btn-outline mt-3"><Plus className="w-4 h-4" /> Add feature</button>
        </Card>

        {/* Financing */}
        <Card title="Financing Line" description="The 'approximately $X/mo' line under the price.">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={fin.enabled !== false} onChange={(e) => patch({ financing: { ...fin, enabled: e.target.checked } })} />
              Show financing line
            </label>
            <div>
              <label className="form-label">Months</label>
              <input type="number" className="form-input w-24" value={fin.months ?? 4} onChange={(e) => patch({ financing: { ...fin, months: Number(e.target.value) } })} />
            </div>
            <div className="flex-1 min-w-[240px]">
              <label className="form-label">Note</label>
              <input className="form-input" value={fin.note ?? ''} onChange={(e) => patch({ financing: { ...fin, note: e.target.value } })} placeholder="interest-free installment plans coming soon" />
              <p className="text-xs text-slate-500 mt-1">Shown after the /mo line — clear it once BNPL is live.</p>
            </div>
          </div>
        </Card>

        {/* Shipping & Care accordions */}
        <Card title="Shipping & Returns" description="Bullet points in the Shipping & Returns accordion.">
          <BulletList items={ship} list={sl} placeholder="Complimentary insured shipping…" />
        </Card>
        <Card title="Certification & Care" description="Bullet points in the Certification & Care accordion.">
          <BulletList items={care} list={cl} placeholder="Each diamond is graded…" />
        </Card>

        {/* The RJ House Difference (story + accordions) */}
        <Card title="The RJ House Difference" description="Two-column band below the product: brand story + link on the left, accordions on the right.">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Heading</label>
              <input className="form-input" value={diff.heading || ''} onChange={(e) => patchDiff({ heading: e.target.value })} placeholder="The RJ House Difference" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Link text</label>
                <input className="form-input" value={diff.linkText || ''} onChange={(e) => patchDiff({ linkText: e.target.value })} placeholder="About RJ House" />
              </div>
              <div>
                <label className="form-label">Link URL</label>
                <input className="form-input" value={diff.linkUrl || ''} onChange={(e) => patchDiff({ linkUrl: e.target.value })} placeholder="/about-us" />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Story paragraph</label>
            <textarea className="form-textarea min-h-[70px]" value={diff.body || ''} onChange={(e) => patchDiff({ body: e.target.value })} placeholder="When you choose Rangani Jewelry House…" />
          </div>
          <div className="space-y-3">
            {diffItems.map((d, i) => (
              <div key={i} className="flex gap-2 items-start border border-slate-200 rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <input className="form-input" value={d.title || ''} onChange={(e) => dl.update(i, { title: e.target.value })} placeholder="Sustainable Materials" />
                  <textarea className="form-textarea min-h-[54px]" value={d.body || ''} onChange={(e) => dl.update(i, { body: e.target.value })} placeholder="Accordion body copy…" />
                </div>
                <button onClick={() => dl.remove(i)} className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={dl.add} className="btn-outline"><Plus className="w-4 h-4" /> Add accordion</button>
          </div>
        </Card>

        {/* Build your own — 3 columns */}
        <Card title="Build Your Own (3 columns)" description="The 3-up editorial (Personalized / Diamonds / Atelier) under the bespoke banner.">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bc.enabled !== false} onChange={(e) => patchBc({ enabled: e.target.checked })} />
              Show this section
            </label>
            <div className="flex-1 min-w-[240px]">
              <label className="form-label">Heading</label>
              <input className="form-input" value={bc.heading || ''} onChange={(e) => patchBc({ heading: e.target.value })} placeholder="Build your own Engagement Ring" />
            </div>
          </div>
          <div className="space-y-3">
            {bcItems.map((c, i) => (
              <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
                <div className="w-32 shrink-0">
                  <MediaField label="Image" value={c.image || ''} onChange={(url) => bcl.update(i, { image: url })} prefix="pdp/columns" />
                </div>
                <div className="flex-1 space-y-2">
                  <input className="form-input" value={c.title || ''} onChange={(e) => bcl.update(i, { title: e.target.value })} placeholder="Personalized Engagement Rings" />
                  <textarea className="form-textarea min-h-[54px]" value={c.text || ''} onChange={(e) => bcl.update(i, { text: e.target.value })} placeholder="Column copy…" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="form-input" value={c.linkText || ''} onChange={(e) => bcl.update(i, { linkText: e.target.value })} placeholder="Learn More" />
                    <input className="form-input" value={c.linkUrl || ''} onChange={(e) => bcl.update(i, { linkUrl: e.target.value })} placeholder="/customize" />
                  </div>
                </div>
                <button onClick={() => bcl.remove(i)} className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={bcl.add} className="btn-outline"><Plus className="w-4 h-4" /> Add column</button>
          </div>
        </Card>

        {/* Build Your Own CTA */}
        <Card title="Build Your Own (bespoke CTA)" description="The full-width image banner below the product that invites shoppers into the customize journey.">
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={byo.enabled !== false} onChange={(e) => patchByo({ enabled: e.target.checked })} />
            Show this section
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="form-label">Eyebrow</label>
                <input className="form-input" value={byo.eyebrow || ''} onChange={(e) => patchByo({ eyebrow: e.target.value })} placeholder="Bespoke" />
              </div>
              <div>
                <label className="form-label">Heading</label>
                <input className="form-input" value={byo.heading || ''} onChange={(e) => patchByo({ heading: e.target.value })} placeholder="Build a ring that's entirely yours" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea min-h-[70px]" value={byo.description || ''} onChange={(e) => patchByo({ description: e.target.value })} placeholder="Begin with a diamond or a setting…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Button text</label>
                  <input className="form-input" value={byo.buttonText || ''} onChange={(e) => patchByo({ buttonText: e.target.value })} placeholder="Start Designing" />
                </div>
                <div>
                  <label className="form-label">Button link</label>
                  <input className="form-input" value={byo.buttonUrl || ''} onChange={(e) => patchByo({ buttonUrl: e.target.value })} placeholder="/customize" />
                </div>
              </div>
            </div>
            <div>
              <MediaField label="Background image" value={byo.image || ''} onChange={(url) => patchByo({ image: url })} prefix="pdp/byo" />
            </div>
          </div>
        </Card>

        {/* Quick links strip */}
        <Card title="Quick Links" description="The 3-up icon link strip (Ring Size Guide / Book a Consultation / Shipping) below the brand pillars.">
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={ql.enabled !== false} onChange={(e) => patchQl({ enabled: e.target.checked })} />
            Show this section
          </label>
          <div className="space-y-2">
            {qlItems.map((q, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select className="form-input w-32" value={q.icon || 'ruler'} onChange={(e) => qll.update(i, { icon: e.target.value })}>
                  {QUICK_ICONS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input className="form-input flex-1" value={q.label || ''} onChange={(e) => qll.update(i, { label: e.target.value })} placeholder="Ring Size Guide" />
                <input className="form-input flex-1" value={q.url || ''} onChange={(e) => qll.update(i, { url: e.target.value })} placeholder="/ring-size-guide" />
                <button onClick={() => qll.remove(i)} className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={qll.add} className="btn-outline"><Plus className="w-4 h-4" /> Add link</button>
          </div>
        </Card>

        {/* Expert designers contact */}
        <Card title="Expert Designers Contact" description="The 'Get in touch with one of our Expert Designers' form near the bottom of the product page. Submissions arrive in Custom Requests.">
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={ec.enabled !== false} onChange={(e) => patchEc({ enabled: e.target.checked })} />
            Show this section
          </label>
          <div className="space-y-3 max-w-xl">
            <div>
              <label className="form-label">Eyebrow</label>
              <input className="form-input" value={ec.eyebrow || ''} onChange={(e) => patchEc({ eyebrow: e.target.value })} placeholder="Here To Help" />
            </div>
            <div>
              <label className="form-label">Heading</label>
              <input className="form-input" value={ec.heading || ''} onChange={(e) => patchEc({ heading: e.target.value })} placeholder="Get in touch with one of our Expert Designers" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-textarea min-h-[60px]" value={ec.description || ''} onChange={(e) => patchEc({ description: e.target.value })} placeholder="Questions about this piece…" />
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

function BulletList({ items, list, placeholder }: any) {
  return (
    <div className="space-y-2">
      {items.map((line: string, i: number) => (
        <div key={i} className="flex gap-2 items-center">
          <input className="form-input flex-1" value={line} onChange={(e) => list.update(i, e.target.value)} placeholder={placeholder} />
          <button onClick={() => list.remove(i)} className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={list.add} className="btn-outline"><Plus className="w-4 h-4" /> Add line</button>
    </div>
  )
}

function Card({ title, description, children }: any) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

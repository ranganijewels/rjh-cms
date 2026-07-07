'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import IconPicker from '@/components/IconPicker'
import api from '@/lib/api'
import { Plus, Trash2, GripVertical } from 'lucide-react'

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'
const PAGE = 'homepage'

type SectionContent = Record<string, any>
interface Loaded {
  id?: string
  sectionKey: string
  sectionType: string
  label: string
  sortOrder: number
  content: SectionContent
}

// Load all homepage sections keyed by sectionKey.
async function loadSections(): Promise<Record<string, Loaded>> {
  const r = await api.get('/cms/sections', { params: { pageSlug: PAGE } })
  const map: Record<string, Loaded> = {}
  for (const s of r.data?.data || []) {
    map[s.sectionKey] = {
      id: s.id,
      sectionKey: s.sectionKey,
      sectionType: s.sectionType || 'custom',
      label: s.label || s.sectionKey,
      sortOrder: s.sortOrder ?? 0,
      content: s.content || {},
    }
  }
  return map
}

async function saveSection(sec: Loaded) {
  const body = {
    pageSlug: PAGE,
    sectionType: sec.sectionType,
    label: sec.label,
    sortOrder: sec.sortOrder,
    isPublished: true,
    content: sec.content,
    sectionKey: sec.sectionKey,
  }
  if (sec.id) return api.put(`/cms/sections/${sec.id}`, body)
  return api.post('/cms/sections', body)
}

export default function HomepageEditor() {
  const [sections, setSections] = useState<Record<string, Loaded>>({})
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    try {
      setSections(await loadSections())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  if (loading) return <div className="card p-6 text-sm text-slate-500">Loading homepage…</div>

  const get = (key: string, type: string, label: string): Loaded =>
    sections[key] || { sectionKey: key, sectionType: type, label, sortOrder: 0, content: {} }

  const setContent = (key: string, content: SectionContent) =>
    setSections((prev) => ({
      ...prev,
      [key]: { ...get(key, prev[key]?.sectionType || 'custom', prev[key]?.label || key), content },
    }))

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Edit every image, video, banner and text block on the storefront home page. Changes publish immediately."
        actions={
          <a href={`${STOREFRONT}/`} target="_blank" rel="noopener noreferrer" className="btn-outline">
            View on site ↗
          </a>
        }
      />

      <div className="space-y-6">
        <p className="text-sm text-slate-500 -mt-2">
          The top hero banner (with video) is managed on{' '}
          <a href="/banners" className="text-brand-500 underline">Banners &amp; Hero</a>.
        </p>

        <FeaturedCollections sec={get('featured-collection', 'featured-collection', 'Featured Collections')} onChange={(c) => setContent('featured-collection', c)} onSaved={reload} save={saveSection} setSec={(s) => setSections((p) => ({ ...p, 'featured-collection': s }))} />

        <DiamondShapes sec={get('product-variants', 'product-variants', 'Diamond Shapes')} onChange={(c) => setContent('product-variants', c)} onSaved={reload} save={saveSection} setSec={(s) => setSections((p) => ({ ...p, 'product-variants': s }))} />

        <WhyChoose sec={get('why-choose', 'why-choose', 'Why Choose')} onChange={(c) => setContent('why-choose', c)} onSaved={reload} save={saveSection} setSec={(s) => setSections((p) => ({ ...p, 'why-choose': s }))} />

        <DiscoverStylesEditor sec={get('discover-styles', 'discover-styles', 'Discover Styles')} onChange={(c) => setContent('discover-styles', c)} onSaved={reload} save={saveSection} setSec={(s) => setSections((p) => ({ ...p, 'discover-styles': s }))} />

        <PromoBanner sec={get('promo-banner', 'banner', 'Promo Banner')} onChange={(c) => setContent('promo-banner', c)} onSaved={reload} save={saveSection} setSec={(s) => setSections((p) => ({ ...p, 'promo-banner': s }))} />

        <Reviews sec={get('customer-reviews', 'testimonials', 'Customer Reviews')} onChange={(c) => setContent('customer-reviews', c)} onSaved={reload} save={saveSection} setSec={(s) => setSections((p) => ({ ...p, 'customer-reviews': s }))} />
      </div>
    </>
  )
}

// ─── Shared section-card wrapper with Save ───────────────────────────────────

function SectionCard({
  title,
  description,
  sec,
  save,
  onSaved,
  children,
}: {
  title: string
  description: string
  sec: Loaded
  save: (s: Loaded) => Promise<any>
  onSaved: () => void
  children: React.ReactNode
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function doSave() {
    setSaving(true)
    setError('')
    try {
      await save(sec)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-600">Saved ✓</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button onClick={doSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// Small helper to edit a repeatable array of card items.
function useList<T>(items: T[], setItems: (next: T[]) => void, blank: () => T) {
  return {
    update: (i: number, patch: Partial<T>) =>
      setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))),
    remove: (i: number) => setItems(items.filter((_, idx) => idx !== i)),
    add: () => setItems([...items, blank()]),
    move: (i: number, dir: -1 | 1) => {
      const j = i + dir
      if (j < 0 || j >= items.length) return
      const next = [...items]
      ;[next[i], next[j]] = [next[j], next[i]]
      setItems(next)
    },
  }
}

// ─── Featured Collections ────────────────────────────────────────────────────

function FeaturedCollections({ sec, onChange, save, onSaved, setSec }: any) {
  const c = sec.content
  const banners: any[] = Array.isArray(c.banners) ? c.banners : []
  const list = useList(banners, (next) => onChange({ ...c, banners: next }), () => ({ text: '', link: '/product', imageUrl: '' }))
  return (
    <SectionCard title="Featured Collections" description="The 4 category cards below the hero (Diamond Rings, Necklaces, Earrings, Bangles…)." sec={sec} save={save} onSaved={onSaved}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Heading</label>
          <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Featured Collections" />
        </div>
        <div>
          <label className="form-label">Sub-heading</label>
          <input className="form-input" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {banners.map((b, i) => (
          <CardEditor key={i} index={i} count={banners.length} onRemove={() => list.remove(i)} onMove={(d) => list.move(i, d)}>
            <MediaField label="Image / video" value={b.imageUrl || ''} onChange={(url) => list.update(i, { imageUrl: url })} prefix="home/collections" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input className="form-input" value={b.text || ''} onChange={(e) => list.update(i, { text: e.target.value })} placeholder="Label (e.g. Diamond Rings)" />
              <input className="form-input" value={b.link || ''} onChange={(e) => list.update(i, { link: e.target.value })} placeholder="/product?category=Rings" />
            </div>
          </CardEditor>
        ))}
      </div>
      <button onClick={list.add} className="btn-outline mt-4"><Plus className="w-4 h-4" /> Add collection</button>
    </SectionCard>
  )
}

// ─── Diamond Shapes (Personalized Shopping Experience) ───────────────────────

function DiamondShapes({ sec, onChange, save, onSaved }: any) {
  const c = sec.content
  const banners: any[] = Array.isArray(c.banners) ? c.banners : []
  const list = useList(banners, (next) => onChange({ ...c, banners: next }), () => ({ text: '', link: '/product', imageUrl: '' }))
  return (
    <SectionCard title="Diamond Shapes (Personalized Shopping)" description="The shape thumbnails (Round, Oval, Pear, Princess…) in the Personalized Shopping Experience block." sec={sec} save={save} onSaved={onSaved}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Heading</label>
          <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Personalized Shopping Experience" />
        </div>
        <div>
          <label className="form-label">Sub-heading</label>
          <input className="form-input" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} />
        </div>
      </div>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {banners.map((b, i) => (
          <CardEditor key={i} index={i} count={banners.length} onRemove={() => list.remove(i)} onMove={(d) => list.move(i, d)}>
            <MediaField label="Shape image" value={b.imageUrl || ''} onChange={(url) => list.update(i, { imageUrl: url })} prefix="home/shapes" aspect="aspect-square" />
            <input className="form-input mt-2" value={b.text || ''} onChange={(e) => list.update(i, { text: e.target.value })} placeholder="Round" />
            <input className="form-input mt-2 text-xs" value={b.link || ''} onChange={(e) => list.update(i, { link: e.target.value })} placeholder="/product?shape=Round" />
          </CardEditor>
        ))}
      </div>
      <button onClick={list.add} className="btn-outline mt-4"><Plus className="w-4 h-4" /> Add shape</button>
    </SectionCard>
  )
}

// ─── Discover Styles (coverflow carousel) ───────────────────────────────────

function DiscoverStylesEditor({ sec, onChange, save, onSaved }: any) {
  const c = sec.content
  const styles: any[] = Array.isArray(c.styles) ? c.styles : []
  const list = useList(styles, (next) => onChange({ ...c, styles: next }), () => ({ title: '', description: '', imageUrl: '', link: '/product' }))
  return (
    <SectionCard title="Discover Styles" description="The coverflow carousel of ring styles (Solitaire, Halo, Three Stone…) after Why Choose." sec={sec} save={save} onSaved={onSaved}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Heading</label>
          <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Discover Styles" />
        </div>
        <div>
          <label className="form-label">Sub-heading</label>
          <input className="form-input" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} placeholder="Discover diverse engagement ring styles…" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {styles.map((st, i) => (
          <CardEditor key={i} index={i} count={styles.length} onRemove={() => list.remove(i)} onMove={(d) => list.move(i, d)}>
            <MediaField label="Style image" value={st.imageUrl || ''} onChange={(url) => list.update(i, { imageUrl: url })} prefix="home/styles" aspect="aspect-square" hint="Ring photo on a white background works best." />
            <input className="form-input mt-2" value={st.title || ''} onChange={(e) => list.update(i, { title: e.target.value })} placeholder="Style name (e.g. Hidden Halo)" />
            <input className="form-input mt-2 text-xs" value={st.description || ''} onChange={(e) => list.update(i, { description: e.target.value })} placeholder="Short description" />
            <input className="form-input mt-2 text-xs" value={st.link || ''} onChange={(e) => list.update(i, { link: e.target.value })} placeholder="/product?subcat=Halo" />
          </CardEditor>
        ))}
      </div>
      <button onClick={list.add} className="btn-outline mt-4"><Plus className="w-4 h-4" /> Add style</button>
    </SectionCard>
  )
}

// ─── Why Choose (with video) ─────────────────────────────────────────────────

function WhyChoose({ sec, onChange, save, onSaved }: any) {
  const c = sec.content
  const features: any[] = Array.isArray(c.features) ? c.features : []
  const list = useList(features, (next) => onChange({ ...c, features: next }), () => ({ icon: 'gem', title: '', description: '' }))
  return (
    <SectionCard title="Why Choose RJ House" description="The value-props block and its background video." sec={sec} save={save} onSaved={onSaved}>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div>
            <label className="form-label">Heading</label>
            <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Why Choose RJ House" />
          </div>
          <div>
            <label className="form-label">Sub-heading</label>
            <textarea className="form-textarea min-h-[60px]" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} />
          </div>
          {features.map((f, i) => (
            <div key={i} className="flex gap-2 items-start">
              <IconPicker value={f.icon} onChange={(key) => list.update(i, { icon: key })} />
              <input className="form-input flex-1" value={f.title || ''} onChange={(e) => list.update(i, { title: e.target.value })} placeholder="Certified Diamonds" />
              <input className="form-input flex-1" value={f.description || ''} onChange={(e) => list.update(i, { description: e.target.value })} placeholder="IGI & GIA certified" />
              <button onClick={() => { if (confirm('Remove this feature?')) list.remove(i) }} className="btn-danger-sm" aria-label="Remove feature"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={list.add} className="btn-outline"><Plus className="w-4 h-4" /> Add feature</button>
        </div>
        <MediaField label="Background video / image" value={c.videoUrl || ''} onChange={(url) => onChange({ ...c, videoUrl: url })} prefix="home/why-choose" hint="MP4 recommended; autoplays muted on loop." />
      </div>
    </SectionCard>
  )
}

// ─── Promo Banner ────────────────────────────────────────────────────────────

function PromoBanner({ sec, onChange, save, onSaved }: any) {
  const c = sec.content
  return (
    <SectionCard title="Promo Banner" description="The full-width 'Your Dream Jewelry Awaits' banner near the bottom of the home page." sec={sec} save={save} onSaved={onSaved}>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div>
            <label className="form-label">Heading</label>
            <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Your Dream Jewelry Awaits" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-textarea min-h-[70px]" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="form-input" value={c.cta1Text || ''} onChange={(e) => onChange({ ...c, cta1Text: e.target.value })} placeholder="Button 1 text" />
            <input className="form-input" value={c.cta1Link || ''} onChange={(e) => onChange({ ...c, cta1Link: e.target.value })} placeholder="/product" />
            <input className="form-input" value={c.cta2Text || ''} onChange={(e) => onChange({ ...c, cta2Text: e.target.value })} placeholder="Button 2 text" />
            <input className="form-input" value={c.cta2Link || ''} onChange={(e) => onChange({ ...c, cta2Link: e.target.value })} placeholder="/customize" />
          </div>
        </div>
        <MediaField label="Background image / video" value={c.imageUrl || c.videoUrl || ''} onChange={(url) => onChange({ ...c, imageUrl: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? '' : url, videoUrl: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? url : '' })} prefix="home/promo" />
      </div>
    </SectionCard>
  )
}

// ─── Customer Reviews ────────────────────────────────────────────────────────

function Reviews({ sec, onChange, save, onSaved }: any) {
  const c = sec.content
  const reviews: any[] = Array.isArray(c.reviews) ? c.reviews : []
  const list = useList(reviews, (next) => onChange({ ...c, reviews: next }), () => ({ text: '', description: '', rating: 5, imageUrl: '' }))
  return (
    <SectionCard title="Customer Reviews" description="Testimonials with optional customer photos." sec={sec} save={save} onSaved={onSaved}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Heading</label>
          <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Loved by Our Customers" />
        </div>
        <div>
          <label className="form-label">Sub-heading</label>
          <input className="form-input" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {reviews.map((r, i) => (
          <CardEditor key={i} index={i} count={reviews.length} onRemove={() => list.remove(i)} onMove={(d) => list.move(i, d)}>
            <div className="flex gap-3">
              <div className="w-24 shrink-0">
                <MediaField value={r.imageUrl || ''} onChange={(url) => list.update(i, { imageUrl: url })} prefix="home/reviews" aspect="aspect-square" />
              </div>
              <div className="flex-1 space-y-2">
                <input className="form-input" value={r.text || ''} onChange={(e) => list.update(i, { text: e.target.value })} placeholder="Customer name" />
                <select className="form-input" value={r.rating ?? 5} onChange={(e) => list.update(i, { rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
                <textarea className="form-textarea min-h-[60px]" value={r.description || ''} onChange={(e) => list.update(i, { description: e.target.value })} placeholder="Review text" />
              </div>
            </div>
          </CardEditor>
        ))}
      </div>
      <button onClick={list.add} className="btn-outline mt-4"><Plus className="w-4 h-4" /> Add review</button>
    </SectionCard>
  )
}

// ─── Repeatable card shell ───────────────────────────────────────────────────

function CardEditor({ children, index, count, onRemove, onMove }: {
  children: React.ReactNode
  index: number
  count: number
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [edited, setEdited] = useState(false)
  const editedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Briefly confirm that a field's change was captured into local state,
  // since only the parent SectionCard shows a "Saved" state after the
  // whole section is persisted.
  function handleBlurCapture() {
    setEdited(true)
    if (editedTimer.current) clearTimeout(editedTimer.current)
    editedTimer.current = setTimeout(() => setEdited(false), 1500)
  }

  useEffect(() => () => { if (editedTimer.current) clearTimeout(editedTimer.current) }, [])

  return (
    <div className="rounded-lg border border-slate-200 p-3 relative" onBlurCapture={handleBlurCapture}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 flex items-center gap-1"><GripVertical className="w-3 h-3" /> #{index + 1}</span>
        <div className="flex items-center gap-2">
          {edited && <span className="text-xs text-emerald-600">Edited ✓</span>}
          <button onClick={() => onMove(-1)} disabled={index === 0} className="text-xs text-slate-500 disabled:opacity-30 px-1">↑</button>
          <button onClick={() => onMove(1)} disabled={index === count - 1} className="text-xs text-slate-500 disabled:opacity-30 px-1">↓</button>
          <button onClick={() => { if (confirm('Remove this item?')) onRemove() }} className="text-xs text-red-600 hover:underline ml-1">Remove</button>
        </div>
      </div>
      {children}
    </div>
  )
}

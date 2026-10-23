'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import IconPicker from '@/components/IconPicker'
import { EditorSkeleton, SectionCard } from '@/components/editor'
import { useList, useSections, type SectionContent } from '@/lib/useSections'
import { Plus, Trash2, GripVertical } from 'lucide-react'

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'
const PAGE = 'homepage'

// All homepage section load/save state lives in useSections(); this page is
// pure UI — each card edits one sectionKey's content and saves through the
// hook (PUT when the section exists, POST otherwise).
export default function HomepageEditor() {
  const { loading, get, setContent, saveSection, reload } = useSections(PAGE)

  if (loading) return <EditorSkeleton />

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

        <FeaturedCollections sec={get('featured-collection', { sectionType: 'featured-collection', label: 'Featured Collections' })} onChange={(c: SectionContent) => setContent('featured-collection', c)} onSaved={reload} save={saveSection} />

        <DiamondShapes sec={get('product-variants', { sectionType: 'product-variants', label: 'Diamond Shapes' })} onChange={(c: SectionContent) => setContent('product-variants', c)} onSaved={reload} save={saveSection} />

        <WhyChoose sec={get('why-choose', { sectionType: 'why-choose', label: 'Why Choose' })} onChange={(c: SectionContent) => setContent('why-choose', c)} onSaved={reload} save={saveSection} />

        <DiscoverStylesEditor sec={get('discover-styles', { sectionType: 'discover-styles', label: 'Discover Styles' })} onChange={(c: SectionContent) => setContent('discover-styles', c)} onSaved={reload} save={saveSection} />

        <PromoBanner sec={get('promo-banner', { sectionType: 'banner', label: 'Promo Banner' })} onChange={(c: SectionContent) => setContent('promo-banner', c)} onSaved={reload} save={saveSection} />

        <Reviews sec={get('customer-reviews', { sectionType: 'testimonials', label: 'Customer Reviews' })} onChange={(c: SectionContent) => setContent('customer-reviews', c)} onSaved={reload} save={saveSection} />
      </div>
    </>
  )
}

// ─── Featured Collections ────────────────────────────────────────────────────

function FeaturedCollections({ sec, onChange, save, onSaved }: any) {
  const c = sec.content
  const banners: any[] = Array.isArray(c.banners) ? c.banners : []
  const list = useList(banners, (next) => onChange({ ...c, banners: next }), () => ({ text: '', link: '/product', imageUrl: '' }))
  return (
    <SectionCard title="Featured Collections" description="The 4 category cards below the hero (Diamond Rings, Necklaces, Earrings, Bangles…)." save={() => save(sec)} onSaved={onSaved}>
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
    <SectionCard title="Diamond Shapes (Personalized Shopping)" description="The shape thumbnails (Round, Oval, Pear, Princess…) in the Personalized Shopping Experience block." save={() => save(sec)} onSaved={onSaved}>
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
    <SectionCard title="Discover Styles" description="The coverflow carousel of ring styles (Solitaire, Halo, Three Stone…) after Why Choose." save={() => save(sec)} onSaved={onSaved}>
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
    <SectionCard title="Why Choose RJ House" description="The value-props block and its background video." save={() => save(sec)} onSaved={onSaved}>
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
    <SectionCard title="Promo Banner" description="The full-width 'Your Dream Jewelry Awaits' banner near the bottom of the home page." save={() => save(sec)} onSaved={onSaved}>
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
  const list = useList(reviews, (next) => onChange({ ...c, reviews: next }), () => ({ text: '', description: '', rating: 5, imageUrl: '', source: '', consent: false }))
  const live = reviews.filter((r) => r?.consent === true && String(r?.source || '').trim()).length
  return (
    <SectionCard title="Customer Reviews" description={`Testimonials shown on the site. Record each quote's source and the customer's permission (${live} of ${reviews.length} documented).`} save={() => save(sec)} onSaved={onSaved}>
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
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-28 shrink-0">
                  <MediaField value={r.imageUrl || ''} onChange={(url) => list.update(i, { imageUrl: url })} prefix="home/reviews" aspect="aspect-square" />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div>
                    <label className="form-label">Customer name</label>
                    <input className="form-input" value={r.text || ''} onChange={(e) => list.update(i, { text: e.target.value })} placeholder="e.g. Priya Sharma" />
                  </div>
                  <div>
                    <label className="form-label">Rating</label>
                    <select className="form-input w-28" value={r.rating ?? 5} onChange={(e) => list.update(i, { rating: Number(e.target.value) })}>
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label">Review</label>
                <textarea className="form-textarea min-h-[72px] resize-y" value={r.description || ''} onChange={(e) => list.update(i, { description: e.target.value })} placeholder="What the customer said…" />
              </div>
              <div>
                <label className="form-label">Source / evidence</label>
                <input className="form-input" value={r.source || ''} onChange={(e) => list.update(i, { source: e.target.value })} placeholder="Google review link, order #, or email date" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" className="accent-brand-navy" checked={r.consent === true} onChange={(e) => list.update(i, { consent: e.target.checked })} />
                  Customer gave permission to publish this quote and name
                </label>
                {!(r.consent === true && String(r.source || '').trim()) && (
                  <span className="text-xs text-amber-700">Source or permission still needed</span>
                )}
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

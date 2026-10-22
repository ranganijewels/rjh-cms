'use client'

import { useEffect, useId, useState, isValidElement, cloneElement } from 'react'
import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import { Plus, Trash2, ArrowUpRight } from 'lucide-react'

const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'
const PAGE = 'customize'
const KEY = 'customize-page'

// Editor for the storefront /customize page. Content is stored as a single CMS
// section ("customize-page", pageSlug "customize") in the exact nested shape the
// page reads; the storefront GET /api/customize serves it (falling back to
// defaults). We initialise from the storefront's own /api/customize so the
// default copy lives in ONE place (the storefront) — no duplication here.
export default function CustomizeEditor() {
  const [content, setContent] = useState<any | null>(null)
  const [secId, setSecId] = useState<string | undefined>()
  const [blogCats, setBlogCats] = useState<string[]>([]) // distinct blog categories (tags)
  const [blogCatsError, setBlogCatsError] = useState(false)
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
        if (sec?.content?.cms_page) {
          setContent(sec.content)
        } else {
          const res = await fetch(`${STOREFRONT}/api/customize`)
          const json = await res.json()
          setContent(json?.data || {})
        }
        // Distinct blog categories (a blog's category = its tag) for the picker.
        try {
          const b = await api.get('/cms/blogs')
          const set = new Set<string>()
          for (const post of b.data?.data || []) for (const t of post.tags || []) if (t) set.add(t)
          setBlogCats([...set].sort())
          setBlogCatsError(false)
        } catch {
          setBlogCatsError(true)
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
      const body = {
        pageSlug: PAGE,
        sectionKey: KEY,
        sectionType: 'custom',
        label: 'Customize Page',
        sortOrder: 0,
        isPublished: true,
        content,
      }
      const res = secId
        ? await api.put(`/cms/sections/${secId}`, body)
        : await api.post('/cms/sections', body)
      const newId = res.data?.data?.id || res.data?.id
      if (newId) setSecId(newId)
      toast.success('Saved & published to the storefront')
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !content)
    return (
      <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    )

  // ── nested accessors (content is stored in the storefront's nested shape) ──
  const cp = content.cms_page || {}
  const setCp = (patch: any) => setContent({ ...content, cms_page: { ...cp, ...patch } })

  const hero = cp.hero_section?.[0] || {}
  const setHero = (patch: any) => setCp({ hero_section: [{ category_name: null, ...hero, ...patch }] })
  const heroBtn = hero.buttons?.[0] || {}
  const setHeroBtn = (patch: any) => setHero({ buttons: [{ ...heroBtn, ...patch }] })

  const svc = cp.service_section?.[0] || {}
  const steps: any[] = svc.service_items || []
  const setSteps = (next: any[]) => setCp({ service_section: [{ ...svc, service_items: next }] })

  const galHead = cp.custom_creation_head?.[0] || {}
  const setGalHead = (patch: any) => setCp({ custom_creation_head: [{ ...galHead, ...patch }] })
  const gallery: any[] = cp.custom_creation || []
  const setGallery = (next: any[]) => setCp({ custom_creation: next })

  const banner = cp.banner_section?.[0] || {}
  const setBanner = (patch: any) => setCp({ banner_section: [{ ...banner, ...patch }] })
  const bannerBtn = banner.buttons?.[0] || {}
  const setBannerBtn = (patch: any) => setBanner({ buttons: [{ ...bannerBtn, ...patch }] })

  const guides = content.blog_category || {}
  const setGuides = (patch: any) => setContent({ ...content, blog_category: { ...guides, ...patch } })
  const selectedCats: string[] = Array.isArray(guides.categories) ? guides.categories : []
  const toggleCat = (cat: string) => {
    const set = new Set(selectedCats)
    set.has(cat) ? set.delete(cat) : set.add(cat)
    setGuides({ categories: [...set] })
  }

  const faq = content.faq_section || {}
  const setFaq = (patch: any) => setContent({ ...content, faq_section: { ...faq, ...patch } })
  const faqItems: any[] = faq.faqs || []
  const setFaqItems = (next: any[]) => setFaq({ faqs: next })

  const list = (items: any[], setItems: (n: any[]) => void, blank: () => any) => ({
    update: (i: number, patch: any) => setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))),
    remove: (i: number) => setItems(items.filter((_, idx) => idx !== i)),
    add: () => setItems([...items, blank()]),
  })
  const stepsL = list(steps, setSteps, () => ({ image: '', title: '', service_description: '' }))
  const galL = list(gallery, setGallery, () => ({ image: '', title: '' }))
  const faqL = list(faqItems, setFaqItems, () => ({ question: '', answer: '' }))

  return (
    <>
      <PageHeader
        title="Customize Page"
        description="Every block on the storefront /customize page — hero, process steps, gallery, banner, guides and FAQ."
        actions={
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <a href={`${STOREFRONT}/customize`} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center gap-1">
              View on site <ArrowUpRight className="w-4 h-4" />
            </a>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Hero */}
        <Card title="Hero" description="Top banner — video/image, headline and the primary button.">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <Field label="Title">
                <input className="form-input" value={hero.title || ''} onChange={(e) => setHero({ title: e.target.value })} />
              </Field>
              <Field label="Subtitle">
                <textarea className="form-textarea min-h-[60px]" value={hero.subtitle || ''} onChange={(e) => setHero({ subtitle: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Button text">
                  <input className="form-input" value={heroBtn.button_text || ''} onChange={(e) => setHeroBtn({ button_text: e.target.value })} placeholder="Start Your Design" />
                </Field>
                <Field label="Button link">
                  <input className="form-input" value={heroBtn.button_url || ''} onChange={(e) => setHeroBtn({ button_url: e.target.value })} placeholder="/customize/form/reference" />
                </Field>
              </div>
            </div>
            <MediaField label="Background video / image" value={hero.file || ''} onChange={(url) => setHero({ file: url })} prefix="customize/hero" hint="MP4 recommended; autoplays muted on loop." />
          </div>
        </Card>

        {/* How it works (steps) */}
        <Card title="How Custom Design Works" description="The step-by-step process (large image + text, alternating).">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Section heading">
              <input className="form-input" value={svc.headtitle || ''} onChange={(e) => setCp({ service_section: [{ ...svc, headtitle: e.target.value }] })} />
            </Field>
            <Field label="Section sub-text">
              <input className="form-input" value={svc.description || ''} onChange={(e) => setCp({ service_section: [{ ...svc, description: e.target.value }] })} />
            </Field>
          </div>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
                <div className="w-40 shrink-0">
                  <MediaField label={`Step ${i + 1} image`} value={s.image || ''} onChange={(url) => stepsL.update(i, { image: url })} prefix="customize/steps" />
                </div>
                <div className="flex-1 space-y-2">
                  <input className="form-input" value={s.title || ''} onChange={(e) => stepsL.update(i, { title: e.target.value })} placeholder="Step title" />
                  <textarea className="form-textarea min-h-[54px]" value={s.service_description || ''} onChange={(e) => stepsL.update(i, { service_description: e.target.value })} placeholder="What happens in this step" />
                </div>
                <button onClick={() => stepsL.remove(i)} aria-label="Remove step" className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={stepsL.add} className="btn-outline"><Plus className="w-4 h-4" /> Add step</button>
          </div>
        </Card>

        {/* Gallery */}
        <Card title="Custom Creations Gallery" description="Past client projects. An image appears on the site only when it is ticked as a real project published with the client's permission.">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Heading">
              <input className="form-input" value={galHead.title || ''} onChange={(e) => setGalHead({ title: e.target.value })} />
            </Field>
            <Field label="Description">
              <input className="form-input" value={galHead.description || ''} onChange={(e) => setGalHead({ description: e.target.value })} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {gallery.map((g, i) => (
              <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
                <div className="w-32 shrink-0">
                  <MediaField label={`Image ${i + 1}`} value={g.image || ''} onChange={(url) => galL.update(i, { image: url })} prefix="customize/gallery" />
                </div>
                <div className="flex-1 space-y-2">
                  <textarea className="form-textarea min-h-[70px]" value={g.title || ''} onChange={(e) => galL.update(i, { title: e.target.value })} placeholder="Caption (e.g. Oval solitaire engagement ring in 14K yellow gold)" />
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" checked={g.consent === true} onChange={(e) => galL.update(i, { consent: e.target.checked })} />
                    Real Rangani project, shown with the client's permission
                  </label>
                  <button onClick={() => galL.remove(i)} aria-label="Remove gallery image" className="btn-danger !px-2 !py-1 text-xs"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={galL.add} className="btn-outline mt-3"><Plus className="w-4 h-4" /> Add gallery image</button>
        </Card>

        {/* Banner CTA */}
        <Card title="Story Banner" description="The full-width video banner with a call to action.">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <Field label="Title">
                <input className="form-input" value={banner.title || ''} onChange={(e) => setBanner({ title: e.target.value })} />
              </Field>
              <Field label="Description">
                <textarea className="form-textarea min-h-[60px]" value={banner.description || ''} onChange={(e) => setBanner({ description: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Button text">
                  <input className="form-input" value={bannerBtn.button_text || ''} onChange={(e) => setBannerBtn({ button_text: e.target.value })} placeholder="Book a Consultation" />
                </Field>
                <Field label="Button link">
                  <input className="form-input" value={bannerBtn.button_url || ''} onChange={(e) => setBannerBtn({ button_url: e.target.value })} placeholder="/book-an-appointment" />
                </Field>
              </div>
            </div>
            <MediaField label="Banner video / image" value={banner.bg_file || ''} onChange={(url) => setBanner({ bg_file: url })} prefix="customize/banner" />
          </div>
        </Card>

        {/* Guides — pulled from Blog Posts by category (tag) */}
        <Card title="Design Guides" description="These cards come from your Blog Posts. Pick which categories to show — every published post in a selected category appears automatically.">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Field label="Heading">
              <input className="form-input" value={guides.heading || ''} onChange={(e) => setGuides({ heading: e.target.value })} />
            </Field>
            <Field label="Description">
              <input className="form-input" value={guides.description || ''} onChange={(e) => setGuides({ description: e.target.value })} />
            </Field>
          </div>

          <label className="form-label">Show these blog categories</label>
          {blogCatsError ? (
            <p role="status" aria-live="polite" className="text-sm text-red-600 mt-1">
              Couldn&apos;t load blog categories — try refreshing.
            </p>
          ) : blogCats.length === 0 ? (
            <p className="text-sm text-slate-500 mt-1">
              No blog categories found yet. Add a <b>Tag / Category</b> to your posts in{' '}
              <a href="/blog" className="text-brand-500 underline">Blog Posts</a> and they&apos;ll appear here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {blogCats.map((cat) => {
                const on = selectedCats.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      on
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">
            {selectedCats.length === 0
              ? 'Nothing selected → all recent published posts are shown.'
              : `Showing published posts tagged: ${selectedCats.join(', ')}.`}
          </p>
        </Card>

        {/* FAQ */}
        <Card title="FAQ" description="Frequently asked questions about custom design.">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Heading">
              <input className="form-input" value={faq.headtitle || ''} onChange={(e) => setFaq({ headtitle: e.target.value })} />
            </Field>
            <Field label="Description">
              <input className="form-input" value={faq.description || ''} onChange={(e) => setFaq({ description: e.target.value })} />
            </Field>
          </div>
          <div className="space-y-3">
            {faqItems.map((q, i) => (
              <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <input className="form-input" value={q.question || ''} onChange={(e) => faqL.update(i, { question: e.target.value })} placeholder="Question" />
                  <textarea className="form-textarea min-h-[54px]" value={q.answer || ''} onChange={(e) => faqL.update(i, { answer: e.target.value })} placeholder="Answer" />
                </div>
                <button onClick={() => faqL.remove(i)} aria-label="Remove FAQ item" className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={faqL.add} className="btn-outline"><Plus className="w-4 h-4" /> Add question</button>
          </div>
        </Card>
      </div>
    </>
  )
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId()
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, { id: (children as React.ReactElement<any>).props.id || id })
    : children
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      {control}
    </div>
  )
}

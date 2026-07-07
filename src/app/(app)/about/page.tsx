'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import api from '@/lib/api'
import { Plus, Trash2 } from 'lucide-react'

const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'
const PAGE = 'about-us'

type Content = Record<string, any>
interface Loaded {
  id?: string
  sectionKey: string
  sectionType: string
  label: string
  content: Content
}

async function loadSections(): Promise<Record<string, Loaded>> {
  const r = await api.get('/cms/sections', { params: { pageSlug: PAGE } })
  const map: Record<string, Loaded> = {}
  for (const s of r.data?.data || []) {
    map[s.sectionKey] = {
      id: s.id,
      sectionKey: s.sectionKey,
      sectionType: s.sectionType || 'custom',
      label: s.label || s.sectionKey,
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
    isPublished: true,
    content: sec.content,
    sectionKey: sec.sectionKey,
  }
  if (sec.id) return api.put(`/cms/sections/${sec.id}`, body)
  return api.post('/cms/sections', body)
}

// Editor for the storefront About Us page. The top hero is managed on Banners &
// Hero (About Us). Here we manage the Story/Explore blocks, the "Rangani
// Standard" services grid, and the CTA banner — each a CMS section that the
// /api/about route merges over its defaults.
export default function AboutEditor() {
  const [sections, setSections] = useState<Record<string, Loaded>>({})
  const [loading, setLoading] = useState(true)
  const [savingAll, setSavingAll] = useState(false)
  const [saveAllError, setSaveAllError] = useState('')
  const [saveAllOk, setSaveAllOk] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      setSections(await loadSections())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
  }, [])

  if (loading) return <div className="card p-6 text-sm text-slate-500">Loading About page…</div>

  const get = (key: string): Loaded =>
    sections[key] || { sectionKey: key, sectionType: 'custom', label: key, content: {} }
  const setContent = (key: string, content: Content) =>
    setSections((prev) => ({ ...prev, [key]: { ...get(key), content } }))
  const setSec = (key: string, s: Loaded) => setSections((prev) => ({ ...prev, [key]: s }))

  async function saveAll() {
    setSavingAll(true)
    setSaveAllError('')
    setSaveAllOk(false)
    try {
      for (const key of ['explore', 'services', 'cta-banner']) {
        await saveSection(get(key))
      }
      setSaveAllOk(true)
      setTimeout(() => setSaveAllOk(false), 2000)
      await reload()
    } catch (e: any) {
      setSaveAllError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSavingAll(false)
    }
  }

  return (
    <>
      <PageHeader
        title="About Page"
        description="Story, values and CTA on the storefront About Us page. The top hero is edited on Banners & Hero → About Us."
        actions={
          <div className="flex items-center gap-3">
            {saveAllOk && <span className="text-xs text-emerald-600">All sections saved ✓</span>}
            {saveAllError && <span className="text-xs text-red-600">{saveAllError}</span>}
            <a href={`${STOREFRONT}/about-us`} target="_blank" rel="noopener noreferrer" className="btn-outline">
              View on site ↗
            </a>
            <button onClick={saveAll} disabled={savingAll} className="btn-primary">
              {savingAll ? 'Saving all…' : 'Save all'}
            </button>
          </div>
        }
      />
      <div className="space-y-6">
        <p className="text-sm text-slate-500 -mt-2">
          The top hero banner is managed on{' '}
          <a href="/banners" className="text-brand-500 underline">Banners &amp; Hero</a> (select “About Us”). Each
          section below can also be saved individually, or use <strong>Save all</strong> above to publish every
          section at once.
        </p>

        <Explore sec={get('explore')} onChange={(c) => setContent('explore', c)} onSaved={reload} setSec={(s) => setSec('explore', s)} />
        <Services sec={get('services')} onChange={(c) => setContent('services', c)} onSaved={reload} setSec={(s) => setSec('services', s)} />
        <CtaBanner sec={get('cta-banner')} onChange={(c) => setContent('cta-banner', c)} onSaved={reload} setSec={(s) => setSec('cta-banner', s)} />
      </div>
    </>
  )
}

function SectionCard({ title, description, sec, onSaved, children }: any) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  async function doSave() {
    setSaving(true)
    setError('')
    try {
      await saveSection(sec)
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
          <h3 className="font-semibold text-slate-900">{title}</h3>
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

function useList(items: any[], setItems: (n: any[]) => void, blank: () => any) {
  return {
    update: (i: number, patch: any) => setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))),
    remove: (i: number) => setItems(items.filter((_, idx) => idx !== i)),
    add: () => setItems([...items, blank()]),
  }
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

// ── Explore / Story blocks ──
function Explore({ sec, onChange, onSaved }: any) {
  const c = sec.content
  const items: any[] = Array.isArray(c.items) ? c.items : []
  const list = useList(items, (next) => onChange({ ...c, items: next }), () => ({ title: '', description: '', file: '', quote: '' }))
  return (
    <SectionCard title="Story / Explore" description="The alternating image + text blocks (e.g. Our Story, Lab Grown Beyond Compare)." sec={sec} onSaved={onSaved}>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
            <div className="w-40 shrink-0">
              <MediaField label={`Image / video`} value={it.file || ''} onChange={(url) => list.update(i, { file: url })} prefix="about/story" />
            </div>
            <div className="flex-1 space-y-2">
              <input className="form-input" value={it.title || ''} onChange={(e) => list.update(i, { title: e.target.value })} placeholder="Block title (e.g. Our Story)" />
              <textarea className="form-textarea min-h-[70px]" value={it.description || ''} onChange={(e) => list.update(i, { description: e.target.value })} placeholder="Paragraph" />
              <input className="form-input" value={it.quote || ''} onChange={(e) => list.update(i, { quote: e.target.value })} placeholder="Pull-quote (optional)" />
            </div>
            <button onClick={() => list.remove(i)} className="btn-danger !px-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={list.add} className="btn-outline"><Plus className="w-4 h-4" /> Add block</button>
      </div>
    </SectionCard>
  )
}

// ── Services / values grid ──
function Services({ sec, onChange, onSaved }: any) {
  const c = sec.content
  const items: any[] = Array.isArray(c.service_items) ? c.service_items : []
  const list = useList(items, (next) => onChange({ ...c, service_items: next }), () => ({ icon: '', title: '', service_description: '' }))
  return (
    <SectionCard title="The Rangani Standard (values grid)" description="The grid of assurances — certified diamonds, warranty, shipping, etc." sec={sec} onSaved={onSaved}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="Heading">
          <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="The Rangani Standard" />
        </Field>
        <Field label="Sub-text">
          <input className="form-input" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} placeholder="Every piece, every order, every time." />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it, i) => (
          <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-lg p-3">
            <div className="w-24 shrink-0">
              <MediaField label="Icon" value={it.icon || ''} onChange={(url) => list.update(i, { icon: url })} prefix="about/icons" />
            </div>
            <div className="flex-1 space-y-2">
              <input className="form-input" value={it.title || ''} onChange={(e) => list.update(i, { title: e.target.value })} placeholder="Certified Diamonds" />
              <textarea className="form-textarea min-h-[48px]" value={it.service_description || ''} onChange={(e) => list.update(i, { service_description: e.target.value })} placeholder="IGI & GIA graded, conflict-free" />
              <button onClick={() => list.remove(i)} className="btn-danger !px-2 !py-1 text-xs"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={list.add} className="btn-outline mt-3"><Plus className="w-4 h-4" /> Add value</button>
    </SectionCard>
  )
}

// ── CTA banner ──
function CtaBanner({ sec, onChange, onSaved }: any) {
  const c = sec.content
  return (
    <SectionCard title="CTA Banner" description="The closing call-to-action banner (e.g. 'Begin Your Forever')." sec={sec} onSaved={onSaved}>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <Field label="Title">
            <input className="form-input" value={c.heading || ''} onChange={(e) => onChange({ ...c, heading: e.target.value })} placeholder="Begin Your Forever" />
          </Field>
          <Field label="Description">
            <textarea className="form-textarea min-h-[60px]" value={c.subHeading || ''} onChange={(e) => onChange({ ...c, subHeading: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text">
              <input className="form-input" value={c.cta1Text || ''} onChange={(e) => onChange({ ...c, cta1Text: e.target.value })} placeholder="Start Customizing" />
            </Field>
            <Field label="Button link">
              <input className="form-input" value={c.cta1Link || ''} onChange={(e) => onChange({ ...c, cta1Link: e.target.value })} placeholder="/customize" />
            </Field>
          </div>
        </div>
        <MediaField label="Background image / video" value={c.bg_file || c.imageUrl || ''} onChange={(url) => onChange({ ...c, bg_file: url })} prefix="about/cta" />
      </div>
    </SectionCard>
  )
}

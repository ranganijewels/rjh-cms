'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import Dialog from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import api, { getAccessToken } from '@/lib/api'
import { Image as ImageIcon, Film, Plus, UploadCloud, Trash2 } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '00000000-0000-0000-0000-000000000001'

interface Section {
  id?: string
  page_slug: string
  type: string
  title?: string
  position?: number
  is_visible?: boolean
  data?: Record<string, any>
  sectionKey?: string
}

// NestJS CmsSection uses camelCase; map both ways.
function fromApi(s: any): Section {
  return {
    id: s.id,
    page_slug: s.pageSlug ?? s.page_slug,
    type: s.sectionType ?? s.type ?? '',
    title: s.label ?? s.title ?? '',
    position: s.sortOrder ?? s.position ?? 0,
    is_visible: s.isPublished ?? s.is_visible ?? true,
    data: s.content ?? s.data ?? {},
    sectionKey: s.sectionKey,
  }
}
function toApi(s: Section, pageSlug: string): any {
  return {
    pageSlug,
    sectionType: s.type,
    label: s.title,
    sortOrder: s.position ?? 0,
    isPublished: s.is_visible !== false,
    content: s.data ?? {},
    sectionKey: s.sectionKey || `${s.type}-${s.position ?? 0}`,
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

const isVideoUrl = (u: string) =>
  /\.(mp4|webm|ogg|mov)(\?|$)/i.test(u || '')

/** Upload a file to NestJS media storage; returns the public URL.
 *  Uses fetch directly — the shared axios client JSON-encodes bodies. */
async function uploadMedia(file: File): Promise<string> {
  const doUpload = async () => {
    const form = new FormData()
    form.append('file', file, file.name)
    const token = getAccessToken() || readCookie('cms_access_token')
    return fetch(`${API_BASE}/media/upload?bucket=cms-media&prefix=hero`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-id': TENANT_ID,
      },
      body: form,
    })
  }

  let res = await doUpload()
  if (res.status === 401) {
    // Access token expired — an authed axios call runs the refresh flow
    // (interceptor updates the in-memory token + cookie), then retry once.
    try { await api.get('/auth/me') } catch { /* refresh failed → next attempt 401s too */ }
    res = await doUpload()
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Your session expired — please sign in again.'
        : data?.message || `Upload failed (${res.status})`,
    )
  }
  const url = data?.url ?? data?.data?.url
  if (!url) throw new Error('Upload succeeded but no URL returned')
  return url
}

// ─── Page hero editor (bound to the REAL storefront keys) ────────────────────

// Every storefront page whose top hero is CMS-driven via a `hero-banner` section.
const HERO_PAGES = [
  { slug: 'homepage', label: 'Home' },
  { slug: 'product-listing', label: 'Product Listing' },
  { slug: 'collections', label: 'Collections' },
  { slug: 'about-us', label: 'About Us' },
  { slug: 'blog', label: 'Blog' },
  { slug: 'gallery', label: 'Gallery' },
  { slug: 'reviews', label: 'Reviews' },
  { slug: 'craftsmanship', label: 'Craftsmanship' },
  { slug: 'sustainability', label: 'Sustainability' },
  { slug: 'customer-love', label: 'Customer Love' },
]

function HeroEditor() {
  const [pageSlug, setPageSlug] = useState('homepage')
  const [section, setSection] = useState<Section | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'' | 'desktop' | 'mobile'>('')
  const [error, setError] = useState('')
  const desktopInput = useRef<HTMLInputElement>(null)
  const mobileInput = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const d = section?.data || {}
  const setData = (k: string, v: any) =>
    setSection((s) => (s ? { ...s, data: { ...(s.data || {}), [k]: v } } : s))

  async function load() {
    setLoading(true)
    setError('')
    try {
      const r = await api.get('/cms/sections', { params: { pageSlug } })
      const all: Section[] = (r.data?.data || []).map(fromApi)
      let hero = all.find((s) => s.sectionKey === 'hero-banner')
      if (!hero) hero = all.find((s) => /hero/i.test(s.type))
      setSection(
        hero || {
          page_slug: pageSlug,
          type: 'hero',
          title: 'Hero Banner',
          sectionKey: 'hero-banner',
          position: 0,
          is_visible: true,
          data: {},
        },
      )
    } catch {
      setError('Could not load the hero section')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [pageSlug])

  async function save() {
    if (!section) return
    setSaving(true)
    setError('')
    try {
      if (section.id) {
        await api.put(`/cms/sections/${section.id}`, toApi(section, pageSlug))
      } else {
        await api.post('/cms/sections', toApi(section, pageSlug))
      }
      toast.success('Hero saved & published')
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(which: 'desktop' | 'mobile', file: File | undefined) {
    if (!file) return
    setUploading(which)
    setError('')
    try {
      const url = await uploadMedia(file)
      const video = file.type.startsWith('video/') || isVideoUrl(url)
      if (which === 'desktop') {
        if (video) setData('videoUrl', url)
        else setData('imageUrl', url)
      } else {
        if (video) setData('mobileVideoUrl', url)
        else setData('mobileImageUrl', url)
      }
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setUploading('')
    }
  }

  const heroMedia = d.videoUrl || d.imageUrl || ''
  const mobileMedia = d.mobileVideoUrl || d.mobileImageUrl || ''

  return (
    <div className="card mb-8 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-slate-900">Page Hero</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            The banner at the top of the selected storefront page. Upload a video for a motion hero — it autoplays muted on loop.
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            {HERO_PAGES.map((p) => (
              <button
                key={p.slug}
                onClick={() => setPageSlug(p.slug)}
                className={`px-3 py-1 rounded-lg text-xs ${pageSlug === p.slug ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="p-5 grid lg:grid-cols-2 gap-6">
        {/* Left: content fields */}
        <div className="space-y-4">
          <div>
            <label className="form-label">Heading</label>
            <input className="form-input" value={d.heading || ''} onChange={(e) => setData('heading', e.target.value)} placeholder="Timeless Beauty, Crafted Just for You" />
          </div>
          <div>
            <label className="form-label">Sub-heading</label>
            <textarea className="form-textarea min-h-[70px]" value={d.subHeading || ''} onChange={(e) => setData('subHeading', e.target.value)} placeholder="Exquisite handcrafted jewellery…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Button 1 text</label>
              <input className="form-input" value={d.cta1Text || ''} onChange={(e) => setData('cta1Text', e.target.value)} placeholder="Shop Collection" />
            </div>
            <div>
              <label className="form-label">Button 1 link</label>
              <input className="form-input" value={d.cta1Link || ''} onChange={(e) => setData('cta1Link', e.target.value)} placeholder="/product" />
            </div>
            <div>
              <label className="form-label">Button 2 text</label>
              <input className="form-input" value={d.cta2Text || ''} onChange={(e) => setData('cta2Text', e.target.value)} placeholder="Explore All" />
            </div>
            <div>
              <label className="form-label">Button 2 link</label>
              <input className="form-input" value={d.cta2Link || ''} onChange={(e) => setData('cta2Link', e.target.value)} placeholder="/product" />
            </div>
          </div>

        </div>

        {/* Right: media upload (primary) + live preview */}
        <div className="space-y-4">
          <div>
            <label className="form-label">Hero video / image</label>
            <input
              ref={desktopInput}
              type="file"
              accept="video/mp4,video/webm,image/*"
              className="hidden"
              onChange={(e) => { handleUpload('desktop', e.target.files?.[0]); e.target.value = '' }}
            />
            {/* Click or drop a file — this is THE way to change the hero media */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => uploading !== 'desktop' && desktopInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (uploading !== 'desktop') desktopInput.current?.click()
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (uploading !== 'desktop') handleUpload('desktop', e.dataTransfer.files?.[0])
              }}
              className="relative rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 overflow-hidden aspect-video flex items-center justify-center cursor-pointer transition-colors group focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {heroMedia ? (
                isVideoUrl(heroMedia) ? (
                  <video key={heroMedia} src={heroMedia} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={heroMedia} alt="Hero preview" width={800} height={450} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="text-center text-slate-400 text-sm py-10 pointer-events-none">
                  <Film className="w-8 h-8 mx-auto mb-2" />
                  No hero media yet
                </div>
              )}
              {/* Overlay CTA */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${heroMedia ? 'bg-black/45 opacity-0 group-hover:opacity-100' : ''}`}>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow ${heroMedia ? 'bg-white text-slate-800' : 'bg-brand-500 text-white'}`}>
                  <UploadCloud className="w-4 h-4" />
                  {uploading === 'desktop'
                    ? 'Uploading…'
                    : heroMedia
                      ? 'Replace — upload video / image'
                      : 'Upload video / image'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-500 truncate flex-1">
                {heroMedia ? (isVideoUrl(heroMedia) ? '▶ Video: ' : 'Image: ') + heroMedia : 'Click the box or drop a file. MP4 (H.264) plays on every device.'}
              </p>
              {d.videoUrl && (
                <button
                  className="text-xs text-red-600 hover:underline shrink-0 ml-2 inline-flex items-center gap-1"
                  title="Remove the video (hero falls back to the image)"
                  onClick={() => setData('videoUrl', '')}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove video
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Mobile override (optional)</label>
              <button
                className="btn-outline"
                disabled={uploading === 'mobile'}
                onClick={() => mobileInput.current?.click()}
              >
                <UploadCloud className="w-4 h-4" />
                {uploading === 'mobile' ? 'Uploading…' : 'Upload'}
              </button>
              <input
                ref={mobileInput}
                type="file"
                accept="video/mp4,video/webm,image/*"
                className="hidden"
                onChange={(e) => handleUpload('mobile', e.target.files?.[0])}
              />
            </div>
            {mobileMedia ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 truncate flex-1">{mobileMedia}</p>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => { setData('mobileVideoUrl', ''); setData('mobileImageUrl', '') }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Uses the desktop media when empty.</p>
            )}
          </div>

          {/* Advanced fallback for power users — upload is the primary flow */}
          <details className="pt-1">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
              Advanced: paste a media URL manually
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="form-label">Video URL</label>
                <input className="form-input" value={d.videoUrl || ''} onChange={(e) => setData('videoUrl', e.target.value)} placeholder="https://… .mp4" />
              </div>
              <div>
                <label className="form-label">Image URL (fallback when no video)</label>
                <input className="form-input" value={d.imageUrl || ''} onChange={(e) => setData('imageUrl', e.target.value)} placeholder="https://… .jpg" />
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

// ─── Other hero/banner sections (all pages) ──────────────────────────────────

const PAGES = ['homepage', 'collections', 'about-us']

export default function BannersPage() {
  const [pageSlug, setPageSlug] = useState('homepage')
  const [rows, setRows] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Section | null>(null)
  const { toast } = useToast()

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/cms/sections', { params: { pageSlug } })
      const all: Section[] = (r.data?.data || []).map(fromApi)
      // homepage hero has its own editor above — exclude it from this list
      setRows(all.filter((s) => /hero|banner/i.test(s.type) && s.sectionKey !== 'hero-banner'))
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [pageSlug])

  async function save() {
    if (!editing) return
    try {
      if (editing.id) {
        await api.put(`/cms/sections/${editing.id}`, toApi(editing, pageSlug))
      } else {
        await api.post('/cms/sections', toApi(editing, pageSlug))
      }
      setEditing(null)
      toast.success('Banner saved')
      reload()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to save banner')
    }
  }

  async function remove(s: Section) {
    if (!s.id) return
    if (!confirm(`Delete banner "${s.title || s.type}"?`)) return
    try {
      await api.delete(`/cms/sections/${s.id}`)
      toast.success('Banner deleted')
      reload()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to delete banner')
    }
  }

  return (
    <>
      <PageHeader
        title="Banners & Hero"
        description="The homepage hero (with video support) plus promotional banners across storefront pages."
        actions={
          <button
            onClick={() => setEditing({ page_slug: pageSlug, type: 'banner', is_visible: true, position: rows.length, data: {} })}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New banner
          </button>
        }
      />

      <HeroEditor />

      <h3 className="font-semibold text-slate-900 mb-3">Other banners</h3>
      <div className="card p-1.5 mb-5 flex items-center gap-1">
        {PAGES.map((p) => (
          <button
            key={p}
            onClick={() => setPageSlug(p)}
            aria-pressed={pageSlug === p}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap font-medium transition ${
              pageSlug === p ? 'bg-brand-navy text-white shadow-[0_1px_2px_rgba(11,20,36,0.2)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            /{p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      ) : !rows.length ? (
        <EmptyState
          icon={<ImageIcon className="w-6 h-6" />}
          title={`No extra banners on /${pageSlug}`}
          description="Promotional banners for this page appear here. The homepage hero is managed above."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="card overflow-hidden transition hover:border-brand-300 hover:shadow-[0_2px_10px_rgba(11,20,36,0.08)]">
              {(r.data?.imageUrl || r.data?.image) && (
                <img
                  src={r.data.imageUrl || r.data.image}
                  alt={`Banner: ${r.data?.heading || r.data?.hero_text || r.title || 'Untitled'}`}
                  width={800}
                  height={176}
                  className="w-full h-44 object-cover"
                />
              )}
              <div className="p-4">
                <span className="badge bg-slate-100 text-slate-700 mb-2">{r.type}</span>
                <h3 className="font-semibold text-slate-900">{r.data?.heading || r.data?.hero_text || r.title || 'Untitled banner'}</h3>
                {(r.data?.subHeading || r.data?.hero_description) && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.data.subHeading || r.data.hero_description}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditing(r)} className="btn-outline flex-1 justify-center">Edit</button>
                  <button onClick={() => remove(r)} className="btn-danger">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BannerModal
          banner={editing}
          onClose={() => setEditing(null)}
          onChange={setEditing}
          onSave={save}
        />
      )}
    </>
  )
}

function BannerModal({ banner, onClose, onChange, onSave }: {
  banner: any
  onClose: () => void
  onChange: (b: any) => void
  onSave: () => void
}) {
  const d = banner.data || {}
  const setData = (k: string, v: any) => onChange({ ...banner, data: { ...d, [k]: v } })
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  async function handleUpload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadMedia(file)
      setData(file.type.startsWith('video/') ? 'videoUrl' : 'imageUrl', url)
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      onClose={onClose}
      title={banner.id ? 'Edit banner' : 'New banner'}
      maxWidth="max-w-2xl"
      bodyClassName=""
      confirmOnDirty
      footer={
        <>
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={onSave} className="btn-primary">Save banner</button>
        </>
      }
    >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={banner.type} onChange={(e) => onChange({ ...banner, type: e.target.value })}>
                <option value="hero">Hero</option>
                <option value="banner">Banner</option>
              </select>
            </div>
            <div>
              <label className="form-label">Position</label>
              <input type="number" className="form-input" value={banner.position ?? 0} onChange={(e) => onChange({ ...banner, position: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="form-label">Headline</label>
            <input className="form-input" value={d.heading || d.hero_text || ''} onChange={(e) => setData('heading', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-textarea min-h-[80px]" value={d.subHeading || d.hero_description || ''} onChange={(e) => setData('subHeading', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Button text</label>
              <input className="form-input" value={d.cta1Text || d.button_text || ''} onChange={(e) => setData('cta1Text', e.target.value)} placeholder="Shop now" />
            </div>
            <div>
              <label className="form-label">Button URL</label>
              <input className="form-input" value={d.cta1Link || d.button_url || ''} onChange={(e) => setData('cta1Link', e.target.value)} placeholder="/product" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="form-label">Media (image or video)</label>
              <button className="btn-outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
                <UploadCloud className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input ref={fileInput} type="file" accept="video/mp4,video/webm,image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
            </div>
            <input className="form-input mt-2" value={d.videoUrl || d.imageUrl || d.image || ''} onChange={(e) => setData(isVideoUrl(e.target.value) ? 'videoUrl' : 'imageUrl', e.target.value)} placeholder="https://…" />
            {(d.videoUrl || d.imageUrl || d.image) && (
              isVideoUrl(d.videoUrl || d.imageUrl || d.image) ? (
                <video src={d.videoUrl || d.imageUrl || d.image} autoPlay loop muted playsInline className="mt-3 rounded-lg w-full max-h-48 object-cover" />
              ) : (
                <img src={d.videoUrl || d.imageUrl || d.image} alt="" className="mt-3 rounded-lg w-full max-h-48 object-cover" />
              )
            )}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={banner.is_visible !== false} onChange={(e) => onChange({ ...banner, is_visible: e.target.checked })} />
            <span className="text-sm">Visible</span>
          </label>
        </div>
    </Dialog>
  )
}

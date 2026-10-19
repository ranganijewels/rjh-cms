'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import api from '@/lib/api'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

const PAGE = 'homepage'
const KEY = 'instagram-reels'

interface Reel { media: string; thumbnail: string; link: string; caption: string }
const blank = (): Reel => ({ media: '', thumbnail: '', link: '', caption: '' })

// Hand-managed "As Seen on Instagram" strip on the home page. No Instagram
// login or API token needed: upload each reel's video (or a photo), paste the
// reel's Instagram link, add a caption. Videos get a poster image automatically.
export default function InstagramReelsEditor() {
  const [items, setItems] = useState<Reel[]>([])
  const [secId, setSecId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await api.get('/cms/sections', { params: { pageSlug: PAGE } })
        const sec = (r.data?.data || []).find((s: any) => s.sectionKey === KEY)
        setSecId(sec?.id)
        setItems(Array.isArray(sec?.content?.items) ? sec.content.items : [])
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
      const clean = items.filter((i) => i.media)
      const body = { pageSlug: PAGE, sectionKey: KEY, sectionType: 'custom', label: 'Instagram Reels', sortOrder: 90, isPublished: true, content: { items: clean } }
      const res = secId ? await api.put(`/cms/sections/${secId}`, body) : await api.post('/cms/sections', body)
      const id = res.data?.data?.id || res.data?.id
      if (id) setSecId(id)
      setItems(clean)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const set = (i: number, p: Partial<Reel>) => setItems(items.map((x, n) => (n === i ? { ...x, ...p } : x)))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const a = [...items]; [a[i], a[j]] = [a[j], a[i]]; setItems(a)
  }

  if (loading) return <div className="card p-6 text-sm text-slate-500">Loading…</div>

  return (
    <>
      <PageHeader
        title="Instagram Reels"
        description="The “As Seen on Instagram” strip on the home page. Add each reel by hand — no Instagram login needed. Shown in this order (vertical 9:16 videos look best)."
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-emerald-600">Saved — live within a minute</span>}
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        }
      />
      {error && <div className="card p-3 mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Reel {i + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} aria-label="Move up" className="p-1 hover:bg-slate-100 rounded"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} aria-label="Move down" className="p-1 hover:bg-slate-100 rounded"><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => setItems(items.filter((_, n) => n !== i))} aria-label="Remove" className="p-1 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <MediaField label="Reel video or photo" value={it.media} onChange={(v) => set(i, { media: v })} prefix="reels" aspect="aspect-[9/16]" hint="Upload the reel video (mp4) or a photo." />
            <div>
              <label className="form-label">Instagram link (opens when clicked)</label>
              <input className="form-input" value={it.link} onChange={(e) => set(i, { link: e.target.value })} placeholder="https://www.instagram.com/reel/…" />
            </div>
            <div>
              <label className="form-label">Caption</label>
              <input className="form-input" value={it.caption} onChange={(e) => set(i, { caption: e.target.value })} placeholder="Crafted with love ✨" />
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setItems([...items, blank()])} className="btn-outline mt-4"><Plus className="w-4 h-4" /> Add reel</button>
    </>
  )
}

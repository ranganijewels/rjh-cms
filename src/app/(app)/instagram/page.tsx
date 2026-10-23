'use client'

import PageHeader from '@/components/PageHeader'
import MediaField from '@/components/MediaField'
import { EditorSkeleton } from '@/components/editor'
import { useSection } from '@/lib/useSections'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

const PAGE = 'homepage'
const KEY = 'instagram-reels'

interface Reel { media: string; thumbnail: string; link: string; caption: string }
const blank = (): Reel => ({ media: '', thumbnail: '', link: '', caption: '' })

// Hand-managed "As Seen on Instagram" strip on the home page. No Instagram
// login or API token needed: upload each reel's video (or a photo), paste the
// reel's Instagram link, add a caption. Videos get a poster image
// automatically. Section lifecycle (load/save/id) lives in useSection().
export default function InstagramReelsEditor() {
  const { content, setContent, loading, saving, error, save } = useSection(PAGE, KEY, {
    createDefaults: { sectionType: 'custom', label: 'Instagram Reels', sortOrder: 90 },
  })

  const items: Reel[] = Array.isArray(content?.items) ? content.items : []
  const setItems = (next: Reel[]) => setContent({ ...(content || {}), items: next })

  async function saveReels() {
    // Drop reels with no media before publishing.
    const clean = items.filter((i) => i.media)
    await save({
      content: { items: clean },
      successMessage: 'Reels saved — live on the homepage within a minute',
    })
    setItems(clean)
  }

  const set = (i: number, p: Partial<Reel>) => setItems(items.map((x, n) => (n === i ? { ...x, ...p } : x)))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const a = [...items]; [a[i], a[j]] = [a[j], a[i]]; setItems(a)
  }

  if (loading) return <EditorSkeleton />

  return (
    <>
      <PageHeader
        title="Instagram Reels"
        description="The “As Seen on Instagram” strip on the home page. Add each reel by hand — no Instagram login needed. Shown in this order (vertical 9:16 videos look best)."
        actions={
          <div className="flex items-center gap-3">
            {error && <span className="text-sm text-red-600">{error}</span>}
            <button onClick={() => setItems([...items, blank()])} className="btn-outline"><Plus className="w-4 h-4" /> Add reel</button>
            <button onClick={saveReels} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        }
      />
      {error && <div className="card p-3 mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!items.length && (
          <button
            onClick={() => setItems([blank()])}
            className="card flex min-h-[180px] flex-col items-center justify-center gap-2 border-dashed text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Add your first reel</span>
            <span className="text-xs text-slate-400">Vertical 9:16 videos look best</span>
          </button>
        )}
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
    </>
  )
}

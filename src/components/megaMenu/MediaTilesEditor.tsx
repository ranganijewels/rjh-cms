'use client'

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import MediaField from '@/components/MediaField'
import { makeListHelpers } from '@/lib/megaMenuListHelpers'

const iconBtn =
  'inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed'

// Editor for the "tiles" mega-menu layout: a grid of image tiles (no columns,
// no CTA panel).
export default function MediaTilesEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const tiles: any[] = Array.isArray(content.mediaTiles) ? content.mediaTiles : []
  const list = makeListHelpers<any>(
    tiles,
    (next) => onChange({ ...content, mediaTiles: next }),
    () => ({ label: '', image: '', link: '' })
  )

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <h3 className="font-medium text-sm mb-3">Media Tiles</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
            <MediaField
              value={tile.image || ''}
              onChange={(url) => list.update(idx, { image: url })}
              prefix="mega-menu/customize"
              aspect="aspect-square"
            />
            <input
              className="form-input mt-2"
              value={tile.label || ''}
              onChange={(e) => list.update(idx, { label: e.target.value })}
              placeholder="Label (e.g. Engagement Rings)"
              aria-label={`Tile ${idx + 1} label`}
            />
            <input
              className="form-input mt-2 text-xs"
              value={tile.link || ''}
              onChange={(e) => list.update(idx, { link: e.target.value })}
              placeholder="/customize?category=ring"
              aria-label={`Tile ${idx + 1} URL`}
            />
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                className={iconBtn}
                onClick={() => list.move(idx, -1)}
                disabled={idx === 0}
                aria-label="Move tile up"
                title="Move tile up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={iconBtn}
                onClick={() => list.move(idx, 1)}
                disabled={idx === tiles.length - 1}
                aria-label="Move tile down"
                title="Move tile down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`${iconBtn} text-red-600 hover:bg-red-50`}
                onClick={() => list.remove(idx)}
                aria-label="Delete tile"
                title="Delete tile"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn-outline mt-4" onClick={list.add}>
        <Plus className="w-4 h-4" /> Add tile
      </button>
    </div>
  )
}

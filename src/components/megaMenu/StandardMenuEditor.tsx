'use client'

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import MediaField from '@/components/MediaField'
import { makeListHelpers } from '@/lib/megaMenuListHelpers'

const iconBtn =
  'inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed'

// Editor for a "columns" mega-menu: a repeatable list of Columns (title +
// repeatable {label, link} items) plus one CTA image/title/description/button
// panel.
export default function StandardMenuEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const columns: any[] = Array.isArray(content.columns) ? content.columns : []
  const imageSection = content.imageSection || {
    imageUrl: '',
    title: '',
    description: '',
    ctaText: '',
    ctaUrl: '',
  }

  const colList = makeListHelpers<any>(
    columns,
    (next) => onChange({ ...content, columns: next }),
    () => ({ title: '', link: '', items: [] })
  )

  const setImageSection = (patch: any) =>
    onChange({ ...content, imageSection: { ...imageSection, ...patch } })

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-medium text-sm mb-3">Columns</h3>
        <div className="space-y-4">
          {columns.map((col, colIdx) => {
            const items: any[] = Array.isArray(col.items) ? col.items : []
            const itemList = makeListHelpers<any>(
              items,
              (next) => colList.update(colIdx, { items: next }),
              () => ({ label: '', link: '' })
            )
            return (
              <div key={colIdx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <input
                    className="form-input flex-1 min-w-[12rem]"
                    value={col.title || ''}
                    onChange={(e) => colList.update(colIdx, { title: e.target.value })}
                    placeholder="Column title (e.g. Shop by Style)"
                  />
                  <input
                    className="form-input flex-1 min-w-[12rem]"
                    value={col.link || ''}
                    onChange={(e) => colList.update(colIdx, { link: e.target.value })}
                    placeholder="Title link (optional)"
                  />
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => colList.move(colIdx, -1)}
                    disabled={colIdx === 0}
                    aria-label="Move column up"
                    title="Move column up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => colList.move(colIdx, 1)}
                    disabled={colIdx === columns.length - 1}
                    aria-label="Move column down"
                    title="Move column down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} text-red-600 hover:bg-red-50`}
                    onClick={() => colList.remove(colIdx)}
                    aria-label="Delete column"
                    title="Delete column"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex flex-wrap items-center gap-2">
                      <input
                        className="form-input flex-1 min-w-[10rem]"
                        value={item.label || ''}
                        onChange={(e) => itemList.update(itemIdx, { label: e.target.value })}
                        placeholder="Label (e.g. Solitaire)"
                        aria-label={`Link ${itemIdx + 1} label`}
                      />
                      <input
                        className="form-input flex-1 min-w-[10rem]"
                        value={item.link || ''}
                        onChange={(e) => itemList.update(itemIdx, { link: e.target.value })}
                        placeholder="/product?subcat=Solitaire"
                        aria-label={`Link ${itemIdx + 1} URL`}
                      />
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => itemList.move(itemIdx, -1)}
                        disabled={itemIdx === 0}
                        aria-label="Move link up"
                        title="Move link up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => itemList.move(itemIdx, 1)}
                        disabled={itemIdx === items.length - 1}
                        aria-label="Move link down"
                        title="Move link down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={`${iconBtn} text-red-600 hover:bg-red-50`}
                        onClick={() => itemList.remove(itemIdx)}
                        aria-label="Delete link"
                        title="Delete link"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-outline !py-1 !px-2 text-xs"
                    onClick={itemList.add}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add link
                  </button>
                </div>
              </div>
            )
          })}
          <button type="button" className="btn-outline" onClick={colList.add}>
            <Plus className="w-4 h-4" /> Add column
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-medium text-sm mb-3">CTA Panel (right-side image + button)</h3>
        <div className="space-y-3 max-w-md">
          <MediaField
            label="Image"
            value={imageSection.imageUrl}
            onChange={(url) => setImageSection({ imageUrl: url })}
            prefix="mega-menu"
          />
          <div>
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={imageSection.title || ''}
              onChange={(e) => setImageSection({ title: e.target.value })}
              placeholder="Not Sure Where to Start?"
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <input
              className="form-input"
              value={imageSection.description || ''}
              onChange={(e) => setImageSection({ description: e.target.value })}
              placeholder="Short supporting copy"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Button text</label>
              <input
                className="form-input"
                value={imageSection.ctaText || ''}
                onChange={(e) => setImageSection({ ctaText: e.target.value })}
                placeholder="BOOK A VIRTUAL APPOINTMENT"
              />
            </div>
            <div>
              <label className="form-label">Button link</label>
              <input
                className="form-input"
                value={imageSection.ctaUrl || ''}
                onChange={(e) => setImageSection({ ctaUrl: e.target.value })}
                placeholder="#book-appointment"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  slugPlaceholder?: string
  onClose: () => void
  onCreate: (slug: string) => void
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function NewItemDialog({ title, slugPlaceholder = 'e.g. about-us', onClose, onCreate }: Props) {
  const [slug, setSlug] = useState('')

  function handleCreate() {
    const cleaned = slugify(slug)
    if (!cleaned) return
    onCreate(cleaned)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="-mr-2 p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="new-item-slug" className="form-label">
              Slug
            </label>
            <input
              id="new-item-slug"
              autoFocus
              className="form-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
              }}
              placeholder={slugPlaceholder}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-xl">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!slugify(slug)} className="btn-primary">
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

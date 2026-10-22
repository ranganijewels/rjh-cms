'use client'

import { useState } from 'react'
import Dialog from '@/components/Dialog'

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
    <Dialog
      onClose={onClose}
      title={title}
      confirmOnDirty
      footer={
        <>
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!slugify(slug)} className="btn-primary">
            Create
          </button>
        </>
      }
    >
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
    </Dialog>
  )
}

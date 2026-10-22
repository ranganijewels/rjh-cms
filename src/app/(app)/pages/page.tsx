'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import Dialog from '@/components/Dialog'
import api from '@/lib/api'
import { FileText, Plus, Search } from 'lucide-react'

interface Page {
  id?: string
  slug: string
  title: string
  status?: string
  is_published?: boolean
  updated_at?: string
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function PagesIndex() {
  const router = useRouter()
  const [rows, setRows] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newSlugInput, setNewSlugInput] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/cms/pages')
      .then((r) => setRows(r.data?.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.title?.toLowerCase().includes(q) || r.slug?.toLowerCase().includes(q)
    )
  }, [rows, search])

  const previewSlug = slugify(newSlugInput)

  function openCreate() {
    setNewSlugInput('')
    setSlugError(null)
    setCreating(true)
  }

  function confirmCreate() {
    const slug = previewSlug
    if (!slug) {
      setSlugError('Enter a slug (letters, numbers, and hyphens only).')
      return
    }
    if (rows.some((r) => r.slug?.toLowerCase() === slug)) {
      setSlugError('A page with this slug already exists.')
      return
    }
    setCreating(false)
    router.push(`/pages/${slug}`)
  }

  return (
    <>
      <PageHeader
        title="Static Pages"
        description="Marketing pages on the storefront — About, Contact, Policies, FAQs landing, and any custom page."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                aria-label="Search pages"
                className="form-input pl-8 py-1.5 text-sm w-48"
              />
            </div>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" /> New page
            </button>
          </div>
        }
      />

      <DataTable
        loading={loading}
        rows={filteredRows}
        onRowClick={(r) => router.push(`/pages/${r.slug}`)}
        columns={[
          { key: 'title', header: 'Title', cell: (r) => <span className="font-medium text-slate-900">{r.title || r.slug}</span> },
          { key: 'slug', header: 'Slug', cell: (r) => <code className="text-xs text-slate-500">{r.slug}</code> },
          {
            key: 'status',
            header: 'Status',
            cell: (r) =>
              r.is_published || r.status === 'published' ? (
                <span className="badge bg-emerald-50 text-emerald-700">Published</span>
              ) : (
                <span className="badge bg-slate-100 text-slate-600">Draft</span>
              ),
          },
        ]}
        empty={
          search ? (
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="No matching pages"
              description="Try a different search term."
            />
          ) : (
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="No pages yet"
              description="Create static pages like About Us, Contact, Shipping Policy, etc."
              action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Create your first page</button>}
            />
          )
        }
      />

      {creating && (
        <Dialog
          onClose={() => setCreating(false)}
          title="New page"
          confirmOnDirty
          footer={
            <>
              <button onClick={() => setCreating(false)} className="btn-outline">Cancel</button>
              <button onClick={confirmCreate} className="btn-primary">Create page</button>
            </>
          }
        >
            <div className="space-y-4">
              <div>
                <label htmlFor="new-page-slug" className="form-label">Slug</label>
                <input
                  id="new-page-slug"
                  autoFocus
                  className="form-input"
                  value={newSlugInput}
                  onChange={(e) => {
                    setNewSlugInput(e.target.value)
                    setSlugError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && confirmCreate()}
                  placeholder="about-us"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Will be created as: <code className="text-slate-500">/{previewSlug || '...'}</code>
                </p>
                {slugError && <p className="text-xs text-red-600 mt-1">{slugError}</p>}
              </div>
            </div>
        </Dialog>
      )}
    </>
  )
}

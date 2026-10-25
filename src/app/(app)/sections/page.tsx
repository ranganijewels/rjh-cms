'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import Dialog from '@/components/Dialog'
import api from '@/lib/api'
import { useToast } from '@/components/Toast'
import { LayoutTemplate, Plus } from 'lucide-react'

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

// NestJS CmsSection uses camelCase field names; map both ways.
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

const PAGES = ['homepage', 'about-us', 'contact-us', 'blog', 'collections']

export default function SectionsPage() {
  const { toast } = useToast()
  const [pageSlug, setPageSlug] = useState('homepage')
  const [rows, setRows] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Section | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/cms/sections', { params: { pageSlug } })
      setRows((r.data?.data || []).map(fromApi))
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [pageSlug])

  const errMsg = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

  async function save() {
    if (!editing) return
    const isNew = !editing.id
    try {
      if (editing.id) {
        await api.put(`/cms/sections/${editing.id}`, toApi(editing, pageSlug))
      } else {
        await api.post('/cms/sections', toApi(editing, pageSlug))
      }
      toast.success(isNew ? 'Section added' : 'Section saved')
      setEditing(null)
      reload()
    } catch (e: any) {
      toast.error(errMsg(e, 'Failed to save section'))
    }
  }

  async function remove(s: Section) {
    if (!s.id) return
    if (!confirm(`Delete section "${s.title || s.type}"?`)) return
    try {
      await api.delete(`/cms/sections/${s.id}`)
      toast.success('Section deleted')
      reload()
    } catch (e: any) {
      toast.error(errMsg(e, 'Failed to delete section'))
    }
  }

  async function seedDefaults() {
    if (!confirm(`Seed default sections for /${pageSlug}?`)) return
    try {
      await api.post('/cms/sections/seed', { pageSlug })
      toast.success('Default sections added')
      reload()
    } catch (e: any) {
      toast.error(errMsg(e, 'Failed to seed sections'))
    }
  }

  return (
    <>
      <PageHeader
        title="Page Sections"
        description="Compose storefront pages from sections — hero, featured collections, testimonials, newsletter, etc."
        actions={
          <>
            <a
              href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'}${
                pageSlug === 'homepage' ? '/' : `/${pageSlug}`
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              View on site ↗
            </a>
            <button onClick={seedDefaults} className="btn-outline">Seed defaults</button>
            <button
              onClick={() => setEditing({ page_slug: pageSlug, type: 'hero', is_visible: true, position: rows.length })}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add section
            </button>
          </>
        }
      />

      <div className="card p-1.5 mb-5 flex items-center gap-1 overflow-x-auto">
        {PAGES.map((p) => (
          <button
            key={p}
            onClick={() => setPageSlug(p)}
            aria-pressed={pageSlug === p}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap font-medium transition ${
              pageSlug === p
                ? 'bg-brand-navy text-white shadow-[0_1px_2px_rgba(11,20,36,0.2)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            /{p}
          </button>
        ))}
      </div>

      <DataTable
        loading={loading}
        rows={rows}
        onRowClick={(r) => setEditing(r)}
        columns={[
          { key: 'position', header: '#', cell: (r) => <span className="text-xs text-slate-400">{r.position ?? '—'}</span> },
          { key: 'type', header: 'Type', cell: (r) => <span className="badge bg-slate-100 text-slate-700">{r.type}</span> },
          { key: 'title', header: 'Title', cell: (r) => <span className="font-medium text-slate-900">{r.title || <span className="text-slate-500">Untitled</span>}</span> },
          { key: 'is_visible', header: 'Visible', cell: (r) => r.is_visible !== false ? <span className="badge bg-emerald-50 text-emerald-700">Yes</span> : <span className="badge bg-slate-100 text-slate-600">No</span> },
          {
            key: '_actions',
            header: '',
            cell: (r) => (
              <button
                onClick={(e) => { e.stopPropagation(); remove(r) }}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            ),
          },
        ]}
        empty={
          <EmptyState
            icon={<LayoutTemplate className="w-6 h-6" />}
            title={`No sections on /${pageSlug}`}
            description="Add sections like hero, banner, featured collection, or testimonials."
            action={
              <button
                onClick={() => setEditing({ page_slug: pageSlug, type: 'hero', is_visible: true, position: 0 })}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" /> Add first section
              </button>
            }
          />
        }
      />

      {editing && (
        <SectionModal
          section={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onChange={setEditing}
        />
      )}
    </>
  )
}

// Common storefront section keys — helps editors bind to the right block.
const SECTION_KEY_HINTS: Record<string, string> = {
  hero: 'hero-banner',
  banner: 'banner',
  'featured-collection': 'featured-collection',
  testimonials: 'customer-reviews',
  'text-block': 'text-block',
  'two-col-grid': 'two-col-grid',
  newsletter: 'newsletter',
  custom: 'custom',
}

function SectionModal({ section, onClose, onSave, onChange }: {
  section: Section
  onClose: () => void
  onSave: () => void
  onChange: (s: Section) => void
}) {
  const [dataText, setDataText] = useState(JSON.stringify(section.data || {}, null, 2))
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleDataChange = (text: string) => {
    setDataText(text)
    if (!text.trim()) {
      setJsonError(null)
      onChange({ ...section, data: {} })
      return
    }
    try {
      const parsed = JSON.parse(text)
      setJsonError(null)
      onChange({ ...section, data: parsed })
    } catch (e: any) {
      // Surface the error instead of silently dropping the edit.
      setJsonError(e?.message || 'Invalid JSON')
    }
  }

  const prettify = () => {
    try {
      setDataText(JSON.stringify(JSON.parse(dataText), null, 2))
      setJsonError(null)
    } catch (e: any) {
      setJsonError(e?.message || 'Invalid JSON')
    }
  }

  const parsedPreview = (() => {
    try { return JSON.parse(dataText || '{}') } catch { return null }
  })()

  return (
    <Dialog
      onClose={onClose}
      title={section.id ? 'Edit section' : 'New section'}
      maxWidth="max-w-2xl"
      // The body keeps its own padding div, so Dialog doesn't add a second one.
      bodyClassName=""
      confirmOnDirty
      footer={
        <>
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button
            onClick={onSave}
            disabled={!!jsonError}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            title={jsonError ? 'Fix the JSON error first' : 'Changes are published immediately'}
          >
            Save & Publish
          </button>
        </>
      }
    >
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={section.type}
                onChange={(e) => {
                  const type = e.target.value
                  onChange({
                    ...section,
                    type,
                    // Suggest the storefront section key for this type.
                    sectionKey: section.sectionKey || SECTION_KEY_HINTS[type],
                  })
                }}
              >
                <option value="hero">Hero</option>
                <option value="banner">Banner</option>
                <option value="featured-collection">Featured Collection</option>
                <option value="testimonials">Testimonials</option>
                <option value="text-block">Text Block</option>
                <option value="two-col-grid">Two Column Grid</option>
                <option value="newsletter">Newsletter</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="form-label">Position</label>
              <input type="number" className="form-input" value={section.position ?? 0} onChange={(e) => onChange({ ...section, position: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="form-label">Title</label>
            <input className="form-input" value={section.title || ''} onChange={(e) => onChange({ ...section, title: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Data (JSON)</label>
              <button type="button" onClick={prettify} className="text-xs text-brand-500 hover:underline">
                Format JSON
              </button>
            </div>
            <textarea
              aria-invalid={!!jsonError}
              className={`form-textarea font-mono text-xs min-h-[200px] ${jsonError ? 'border-red-400 focus:border-red-500' : ''}`}
              value={dataText}
              onChange={(e) => handleDataChange(e.target.value)}
            />
            {jsonError ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span aria-hidden="true">⚠</span> Invalid JSON — {jsonError}. Fix before saving.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Valid JSON ✓ · e.g. {`{ "heading": "…", "subHeading": "…" }`}</p>
            )}
          </div>

          {/* Live key preview so editors can see the structure they'll publish */}
          {parsedPreview && typeof parsedPreview === 'object' && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Fields in this section</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(parsedPreview).length === 0 ? (
                  <span className="text-xs text-slate-400">Empty</span>
                ) : (
                  Object.keys(parsedPreview).map((k) => (
                    <span key={k} className="text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600">
                      {k}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={section.is_visible !== false} onChange={(e) => onChange({ ...section, is_visible: e.target.checked })} />
            <span className="text-sm">Visible on storefront</span>
          </label>
        </div>
    </Dialog>
  )
}

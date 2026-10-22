'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import Dialog from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import { HelpCircle, Plus } from 'lucide-react'

const DEFAULT_PDP = ['BUYING & PRODUCT QUESTIONS', 'SIZING & AFTERCARE']

interface Faq {
  id?: string
  question: string
  answer: string
  category?: string
  is_active?: boolean
  position?: number
}

export default function FaqsPage() {
  const [rows, setRows] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [filter, setFilter] = useState('')
  const [newCat, setNewCat] = useState(false)
  const [pdpCats, setPdpCats] = useState<string[]>([])
  const [settingsId, setSettingsId] = useState<string | undefined>()
  const [settingsError, setSettingsError] = useState('')
  const { toast } = useToast()

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/cms/faqs/admin/all')
      setRows(r.data?.data || [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  // Which categories the product pages show (stored as a CMS section).
  useEffect(() => {
    ;(async () => {
      try {
        const r = await api.get('/cms/sections', { params: { pageSlug: 'faqs' } })
        const sec = (r.data?.data || []).find((s: any) => s.sectionKey === 'faq-settings')
        setSettingsId(sec?.id)
        if (Array.isArray(sec?.content?.pdp_categories)) setPdpCats(sec.content.pdp_categories)
        else setPdpCats(DEFAULT_PDP)
      } catch {
        setPdpCats(DEFAULT_PDP)
      }
    })()
  }, [])

  async function saveSettings() {
    setSettingsError('')
    try {
      const body = { pageSlug: 'faqs', sectionKey: 'faq-settings', sectionType: 'custom', label: 'FAQ settings', sortOrder: 0, isPublished: true, content: { pdp_categories: pdpCats } }
      const res = settingsId ? await api.put(`/cms/sections/${settingsId}`, body) : await api.post('/cms/sections', body)
      const id = res.data?.data?.id || res.data?.id
      if (id) setSettingsId(id)
      toast.success('FAQ settings saved')
    } catch (e: any) {
      setSettingsError(e?.response?.data?.message || e?.message || 'Save failed')
    }
  }

  const categories = Array.from(new Set(rows.map((r) => (r.category || '').trim()).filter(Boolean))).sort()
  const countOf = (c: string) => rows.filter((r) => (r.category || '').trim() === c).length
  const visibleRows = filter === '__none' ? rows.filter((r) => !(r.category || '').trim()) : filter ? rows.filter((r) => (r.category || '').trim() === filter) : rows

  async function save() {
    if (!editing) return
    if (editing.id) {
      await api.put(`/cms/faqs/${editing.id}`, editing)
    } else {
      await api.post('/cms/faqs', editing)
    }
    setEditing(null)
    reload()
  }

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Frequently asked questions shown on the storefront help center."
        actions={
          <button
            onClick={() => setEditing({ question: '', answer: '', category: '', is_active: true })}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        }
      />

      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-sm">Show on product pages</h3>
        <p className="text-xs text-slate-500 mt-1 mb-3">Tick the categories whose FAQs appear in the FAQ section of every product page. The full list always appears on the FAQs page, grouped by category.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {categories.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pdpCats.some((x) => x.toLowerCase() === c.toLowerCase())}
                onChange={(e) => setPdpCats(e.target.checked ? [...pdpCats, c] : pdpCats.filter((x) => x.toLowerCase() !== c.toLowerCase()))} />
              {c} <span className="text-slate-400">({countOf(c)})</span>
            </label>
          ))}
          {!categories.length && <span className="text-sm text-slate-400">Add FAQs with a category first.</span>}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveSettings} className="btn-primary">Save</button>
          {settingsError && <span className="text-sm text-red-600">{settingsError}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {[{ k: '', label: `All (${rows.length})` }, ...categories.map((c) => ({ k: c, label: `${c} (${countOf(c)})` })),
          ...(rows.some((r) => !(r.category || '').trim()) ? [{ k: '__none', label: `Uncategorised (${rows.filter((r) => !(r.category || '').trim()).length})` }] : [])].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)}
            className={`px-3 py-1 rounded-full text-xs border ${filter === t.k ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        loading={loading}
        rows={visibleRows}
        onRowClick={(r) => { setNewCat(false); setEditing(r) }}
        columns={[
          { key: 'question', header: 'Question', cell: (r) => <span className="font-medium text-slate-900">{r.question}</span> },
          { key: 'category', header: 'Category', cell: (r) => r.category || <span className="text-slate-400">—</span> },
          { key: 'is_active', header: 'Status', cell: (r) => r.is_active ? <span className="badge bg-emerald-50 text-emerald-700">Active</span> : <span className="badge bg-slate-100 text-slate-600">Hidden</span> },
        ]}
        empty={
          <EmptyState
            icon={<HelpCircle className="w-6 h-6" />}
            title="No FAQs yet"
            description="Add common customer questions to reduce support load."
            action={
              <button
                onClick={() => setEditing({ question: '', answer: '', category: '', is_active: true })}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" /> Add the first FAQ
              </button>
            }
          />
        }
      />

      {editing && (
        <Dialog
          onClose={() => setEditing(null)}
          title={editing.id ? 'Edit FAQ' : 'New FAQ'}
          maxWidth="max-w-2xl"
          bodyClassName=""
          confirmOnDirty
          footer={
            <>
              <button onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
              <button onClick={save} className="btn-primary">Save FAQ</button>
            </>
          }
        >
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Question</label>
                <input autoFocus className="form-input" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Answer</label>
                <textarea className="form-textarea" value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  {newCat ? (
                    <div className="flex gap-2">
                      <input className="form-input" autoFocus value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value.toUpperCase() })} placeholder="NEW CATEGORY NAME" />
                      <button type="button" className="btn-outline" onClick={() => { setNewCat(false); setEditing({ ...editing, category: '' }) }}>Back</button>
                    </div>
                  ) : (
                    <select className="form-input" value={editing.category || ''}
                      onChange={(e) => { if (e.target.value === '__new') { setNewCat(true); setEditing({ ...editing, category: '' }) } else setEditing({ ...editing, category: e.target.value }) }}>
                      <option value="">Select category…</option>
                      {Array.from(new Set([...categories, ...(editing.category ? [editing.category] : [])])).map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__new">+ New category…</option>
                    </select>
                  )}
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2">
                    <input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
            </div>
        </Dialog>
      )}
    </>
  )
}

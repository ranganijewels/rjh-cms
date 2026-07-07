'use client'

import { useEffect, useRef, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import api from '@/lib/api'
import { HelpCircle, Plus, X } from 'lucide-react'

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
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!editing) return
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setEditing(null)
    document.addEventListener('keydown', close)
    firstFieldRef.current?.focus()
    return () => document.removeEventListener('keydown', close)
  }, [editing])

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/cms/faqs')
      setRows(r.data?.data || [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

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

      <DataTable
        loading={loading}
        rows={rows}
        onRowClick={(r) => setEditing(r)}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl" role="dialog" aria-modal="true" aria-labelledby="faq-modal-title">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 id="faq-modal-title" className="font-semibold">{editing.id ? 'Edit FAQ' : 'New FAQ'}</h3>
              <button onClick={() => setEditing(null)} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Question</label>
                <input ref={firstFieldRef} className="form-input" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Answer</label>
                <textarea className="form-textarea" value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <input className="form-input" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Shipping, Care, Returns…" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2">
                    <input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
              <button onClick={save} className="btn-primary">Save FAQ</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

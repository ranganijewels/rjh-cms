'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Inbox, X } from 'lucide-react'
import EmptyState from './EmptyState'
import PageHeader from './PageHeader'

interface Field {
  key: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'date' | 'long'
}

interface Props {
  title: string
  description: string
  endpoint: string
  fields: Field[]
  primaryField: string
}

export default function InboxView({ title, description, endpoint, fields, primaryField }: Props) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [open, setOpen] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const STATUSES = endpoint.includes('appointments')
    ? ['pending', 'confirmed', 'completed', 'cancelled']
    : ['new', 'in_progress', 'responded', 'closed']
  const submittedAt = (r: any) => (r?.createdAt || r?.created_at || '').slice(0, 16).replace('T', ' ')

  // Same record the admin Communication screens read — changing it here
  // changes it there too.
  async function setStatus(row: any, status: string) {
    setSaving(true)
    try {
      await api.put(`${endpoint}/${row.id}`, { status })
      const next = { ...row, status, overdue: false }
      setRows((rs) => rs.map((r) => (r.id === row.id ? next : r)))
      setOpen(next)
    } finally {
      setSaving(false)
    }
  }

  const load = () => {
    setLoading(true)
    setLoadError(false)
    setSetupNeeded(false)
    api
      .get(endpoint)
      .then((r) => {
        const data = r.data?.data
        setRows(Array.isArray(data) ? data : data?.records || [])
      })
      .catch((err) => {
        setRows([])
        if (err?.response?.status === 404) {
          // Backend controller for this endpoint hasn't been added yet.
          setSetupNeeded(true)
        } else {
          setLoadError(true)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open])

  return (
    <>
      <PageHeader title={title} description={description} />

      {setupNeeded && (
        <div className="mb-5 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {/* Backend setup needed: NestJS doesn't yet expose {endpoint}. Add a controller in the storefront module to surface submissions here. */}
          This inbox isn&apos;t connected yet. Check back later.
        </div>
      )}

      {loadError && (
        <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between gap-4">
          <span>Couldn&apos;t load submissions — try again.</span>
          <button onClick={load} className="btn-outline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="card divide-y divide-slate-100" aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4 animate-pulse">
              <div className="h-3.5 bg-slate-200/80 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : !rows.length ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="Inbox is empty"
          description="Submissions from customers will appear here."
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {rows.map((row, i) => (
            <button
              key={row.id || i}
              onClick={() => setOpen(row)}
              aria-current={open?.id === row.id ? 'true' : undefined}
              className={`w-full text-left px-5 py-4 hover:bg-slate-50 flex items-start gap-4 ${
                open && row.id === open?.id ? 'bg-brand-50 border-l-4 border-brand-navy' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">
                  {row[primaryField] || 'Untitled submission'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {[row.email || row.phone, submittedAt(row)].filter(Boolean).join(' · ')}
                </div>
              </div>
              {row.isTest && <span className="badge bg-amber-50 text-amber-700">test</span>}
              {row.overdue && <span className="badge bg-red-50 text-red-700">overdue</span>}
              {row.status && (
                <span className="badge bg-slate-100 text-slate-700">{row.status}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-title"
            className="card w-full max-w-sm sm:max-w-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 id="submission-title" className="text-base font-semibold text-slate-900">{open[primaryField] || 'Submission'}</h3>
              <button onClick={() => setOpen(null)} aria-label="Close" className="-mr-2 p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pt-4 flex items-center gap-2">
              <label htmlFor="submission-status" className="text-xs text-slate-600">Status</label>
              <select
                id="submission-status"
                className="form-input !w-auto !py-1 text-sm"
                value={open.status || STATUSES[0]}
                disabled={saving}
                onChange={(e) => setStatus(open, e.target.value)}
              >
                {[...new Set([open.status, ...STATUSES].filter(Boolean))].map((st) => (
                  <option key={st} value={st}>{st.replace('_', ' ')}</option>
                ))}
              </select>
              {open.isTest && <span className="badge bg-amber-50 text-amber-700">looks like a test</span>}
            </div>
            <dl className="px-6 py-4 space-y-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <dt className="text-xs text-slate-600 mb-0.5">{f.label}</dt>
                  <dd className="text-sm text-slate-900">
                    {f.type === 'long'
                      ? <p className="whitespace-pre-wrap">{open[f.key] || '—'}</p>
                      : (f.key === 'created_at' ? submittedAt(open) : open[f.key]) || <span className="text-slate-600">—</span>
                    }
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  )
}

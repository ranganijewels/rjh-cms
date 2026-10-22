'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import Dialog from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import { Tag, Plus } from 'lucide-react'

interface Coupon {
  id?: string
  code: string
  description?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_value?: number
  max_uses?: number
  used_count?: number
  expires_at?: string
  is_active?: boolean
}

export default function CouponsPage() {
  const [rows, setRows] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { toast } = useToast()

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/coupons').catch(() => api.get('/promotions/coupons'))
      setRows(r.data?.data || [])
      setSetupNeeded(false)
    } catch {
      setRows([])
      setSetupNeeded(true)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    setSaveError(null)
    try {
      if (editing.id) {
        await api.put(`/coupons/${editing.id}`, editing)
      } else {
        await api.post('/coupons', editing)
      }
      setEditing(null)
      toast.success('Coupon saved')
      reload()
    } catch (e: any) {
      console.error('Failed to save coupon:', e)
      setSaveError('Could not save coupon, please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Coupons & Discounts"
        description="Promotional codes customers can apply at checkout."
        actions={
          <button
            onClick={() => setEditing({ code: '', discount_type: 'percent', discount_value: 10, is_active: true })}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New coupon
          </button>
        }
      />

      {setupNeeded && (
        <div className="mb-5 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <strong>Backend setup required:</strong> NestJS doesn&apos;t yet expose <code className="break-all whitespace-pre-wrap">/coupons</code>. Ask the API team to add a Promotions module to <code className="break-all whitespace-pre-wrap">rj-house-api</code> with CRUD on <code className="break-all whitespace-pre-wrap">jeos_coupons</code>. The storefront already reads/applies via <code className="break-all whitespace-pre-wrap">/storefront/cart/coupon</code>.
        </div>
      )}

      <DataTable
        loading={loading}
        rows={rows}
        onRowClick={(r) => setEditing(r)}
        columns={[
          { key: 'code', header: 'Code', cell: (r) => <code className="font-mono text-sm font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{r.code}</code> },
          { key: 'discount', header: 'Discount', cell: (r) => r.discount_type === 'percent' ? `${r.discount_value}%` : `$${r.discount_value}` },
          { key: 'min_order_value', header: 'Min order', cell: (r) => r.min_order_value ? `$${r.min_order_value}` : <span className="text-slate-400">—</span> },
          { key: 'used', header: 'Used', cell: (r) => `${r.used_count ?? 0}${r.max_uses ? ` / ${r.max_uses}` : ''}` },
          { key: 'is_active', header: 'Status', cell: (r) => r.is_active ? <span className="badge bg-emerald-50 text-emerald-700">Active</span> : <span className="badge bg-slate-100 text-slate-600">Inactive</span> },
        ]}
        empty={
          <EmptyState
            icon={<Tag className="w-6 h-6" />}
            title="No coupons yet"
            description="Create promotional codes that customers can apply at checkout."
            action={
              <button
                onClick={() => setEditing({ code: '', discount_type: 'percent', discount_value: 10, is_active: true })}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" /> Create first coupon
              </button>
            }
          />
        }
      />

      {editing && (
        <Dialog
          onClose={() => setEditing(null)}
          title={editing.id ? 'Edit coupon' : 'New coupon'}
          busy={saving}
          confirmOnDirty
          footer={
            <>
              <button onClick={() => setEditing(null)} className="btn-outline" disabled={saving}>Cancel</button>
              <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save coupon'}</button>
            </>
          }
        >
            <div className="space-y-4">
              {saveError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {saveError}
                </div>
              )}
              <div>
                <label className="form-label">Code</label>
                <input disabled={saving} className="form-input font-mono uppercase" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="WELCOME10" />
                <p className="text-xs text-slate-400 mt-1">Letters and numbers only, no spaces.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Type</label>
                  <select disabled={saving} className="form-input" value={editing.discount_type} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as any })}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Value</label>
                  <input disabled={saving} type="number" className="form-input" value={editing.discount_value} onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Min order $</label>
                  <input disabled={saving} type="number" className="form-input" value={editing.min_order_value || ''} onChange={(e) => setEditing({ ...editing, min_order_value: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="form-label">Max uses</label>
                  <input disabled={saving} type="number" className="form-input" value={editing.max_uses || ''} onChange={(e) => setEditing({ ...editing, max_uses: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="form-label">Expires at</label>
                <input disabled={saving} type="date" className="form-input" value={editing.expires_at?.slice(0, 10) || ''} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea disabled={saving} className="form-textarea min-h-[60px]" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <label className="flex items-center gap-2">
                <input disabled={saving} type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <span className="text-sm">Active</span>
              </label>
            </div>
        </Dialog>
      )}
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import api from '@/lib/api'
import { Menu as MenuIcon, Plus, X } from 'lucide-react'

interface NavItem {
  id?: string
  label: string
  url: string
  parent_id?: string | null
  position?: number
  children?: NavItem[]
}

export default function NavigationPage() {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<NavItem | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/cms/navigation')
      const data = r.data?.data
      setItems(Array.isArray(data) ? data : data?.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  async function save() {
    if (!editing) return
    await api.post('/cms/navigation', editing)
    setEditing(null)
    reload()
  }

  return (
    <>
      <PageHeader
        title="Navigation Menu"
        description="Top navigation shown across the storefront. Add categories, collections, or external links."
        actions={
          <button
            onClick={() => setEditing({ label: '', url: '', position: items.length })}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Add menu item
          </button>
        }
      />

      {loading ? (
        <div className="card p-6 text-sm text-slate-500">Loading…</div>
      ) : !items.length ? (
        <EmptyState
          icon={<MenuIcon className="w-6 h-6" />}
          title="No navigation items yet"
          description="Build the top menu — Rings, Necklaces, Collections, About, etc."
          action={
            <button
              onClick={() => setEditing({ label: '', url: '', position: 0 })}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add first menu item
            </button>
          }
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {items.map((item, i) => (
            <div key={item.id || i} className="px-5 py-4 flex items-center gap-4">
              <div className="text-xs text-slate-400 w-6 font-mono">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500">{item.url}</div>
              </div>
              {item.children?.length ? (
                <div className="text-xs text-slate-500">{item.children.length} children</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold">New menu item</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Label</label>
                <input className="form-input" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Rings" />
              </div>
              <div>
                <label className="form-label">URL</label>
                <input className="form-input" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="/product?category=rings" />
              </div>
              <div>
                <label className="form-label">Position</label>
                <input type="number" className="form-input" value={editing.position} onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })} />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
              <button onClick={save} className="btn-primary">Add to menu</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

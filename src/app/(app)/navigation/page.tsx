'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import Dialog from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import {
  Menu as MenuIcon,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

interface NavItem {
  id?: string
  label: string
  url: string
  parentId?: string | null
  sortOrder?: number
  target?: string
  isActive?: boolean
  metadata?: Record<string, any>
}

const LINK_TYPES = [
  { value: 'custom', label: 'Custom URL' },
  { value: 'collection', label: 'Collection' },
  { value: 'category', label: 'Category' },
  { value: 'style', label: 'Style' },
  { value: 'static_page', label: 'Static Page' },
]

const EMPTY: NavItem = {
  label: '',
  linkType: 'custom',
  url: '',
  refValue: '',
  target: '_self',
  isActive: true,
  hasMegaMenu: false,
  megaMenuLayout: 'columns',
} as any

const selectCls = 'form-input'

// Add/edit modal for one navigation item. Link Type picks what the second field
// offers (a Collection/Category/Style/Static Page picker, or a plain URL box for
// Custom) and auto-computes the stored `url`. `metadata.linkType`/`refValue` are
// stored alongside the computed url so re-opening for edit can restore
// "this points at Collection: Bridal" instead of a raw URL under Custom.
function NavItemModal({
  open,
  onClose,
  onSuccess,
  editData,
  parentId,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData: NavItem | null
  parentId: string | null
}) {
  const [form, setForm] = useState<NavItem>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [collections, setCollections] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [styles, setStyles] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])

  const isSubLink = !!(parentId || editData?.parentId)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const [colRes, catRes, styleRes, pageRes] = await Promise.allSettled([
          api.get('/collections', { params: { all: true } }),
          api.get('/catalog-masters', { params: { kind: 'category' } }),
          api.get('/catalog-masters', { params: { kind: 'style' } }),
          api.get('/cms/pages'),
        ])
        const arr = (r: any) => {
          if (r?.status !== 'fulfilled') return []
          const d = r.value?.data?.data ?? r.value?.data
          return Array.isArray(d) ? d : []
        }
        setCollections(arr(colRes))
        setCategories(arr(catRes))
        setStyles(arr(styleRes))
        setPages(arr(pageRes))
      } catch {
        /* Custom URL still works even if these lookups fail */
      }
    })()
  }, [open])

  useEffect(() => {
    if (!open) return
    if (editData) {
      setForm({
        ...editData,
        linkType: editData.metadata?.linkType || 'custom',
        refValue: editData.metadata?.refValue || '',
        target: editData.target || '_self',
        isActive: editData.isActive ?? true,
        hasMegaMenu: editData.metadata?.hasMegaMenu ?? false,
        megaMenuLayout: editData.metadata?.megaMenuLayout || 'columns',
      } as any)
    } else {
      setForm(EMPTY)
    }
    setError('')
  }, [editData, open])

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }) as NavItem)

  const computeUrl = (linkType: string, refValue: string) => {
    if (linkType === 'collection') {
      const c = collections.find((x) => x.name === refValue)
      return c ? `/collections/${c.slug}` : ''
    }
    if (linkType === 'category')
      return refValue ? `/product?category_id=${encodeURIComponent(refValue)}` : ''
    if (linkType === 'style')
      return refValue ? `/product?subcat=${encodeURIComponent(refValue)}` : ''
    if (linkType === 'static_page') {
      const p = pages.find((x) => x.slug === refValue)
      return p ? `/static-page/${p.slug}` : ''
    }
    return (form as any).url
  }

  const handleLinkTypeChange = (linkType: string) =>
    setForm((f) => ({ ...f, linkType, refValue: '', url: linkType === 'custom' ? (f as any).url : '' }) as any)

  const handleRefChange = (refValue: string) =>
    setForm((f) => ({ ...f, refValue, url: computeUrl((f as any).linkType, refValue) }) as any)

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      setError('Label is required')
      return
    }
    if (!form.url.trim()) {
      setError('A link is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Stable across renames — generated once when "Rich mega-menu" is first
      // enabled, then reused so the linked CMS content keyed by this string is
      // never orphaned.
      const megaMenuKey = (form as any).hasMegaMenu
        ? editData?.metadata?.megaMenuKey || crypto.randomUUID()
        : undefined
      const payload = {
        label: form.label.trim(),
        url: form.url.trim(),
        target: form.target,
        isActive: form.isActive,
        parentId: editData ? editData.parentId ?? null : parentId ?? null,
        metadata: {
          linkType: (form as any).linkType,
          refValue: (form as any).refValue || undefined,
          hasMegaMenu: isSubLink ? false : (form as any).hasMegaMenu,
          ...(megaMenuKey && !isSubLink
            ? { megaMenuKey, megaMenuLayout: (form as any).megaMenuLayout }
            : {}),
        },
      }
      if (editData) {
        await api.put(`/cms/navigation/${editData.id}`, payload)
      } else {
        await api.post('/cms/navigation', payload)
      }
      onClose()
      onSuccess()
      toast.success(editData ? 'Navigation item updated' : 'Navigation item added')
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const refOptions =
    (form as any).linkType === 'collection'
      ? collections.map((c) => ({ value: c.name, label: c.name }))
      : (form as any).linkType === 'category'
        ? categories.map((c) => ({ value: c.name, label: c.name }))
        : (form as any).linkType === 'style'
          ? styles.map((s) => ({ value: s.name, label: s.name }))
          : (form as any).linkType === 'static_page'
            ? pages.map((p) => ({ value: p.slug, label: p.title || p.slug }))
            : []

  if (!open) return null

  return (
    <Dialog
      onClose={onClose}
      title={`${editData ? 'Edit' : 'Add'} ${isSubLink ? 'Sub-Link' : 'Navigation Item'}`}
      busy={saving}
      confirmOnDirty
      footer={
        <>
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
        <div className="space-y-4">
          <div>
            <label className="form-label">Label *</label>
            <input
              autoFocus
              className="form-input"
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="e.g. Sale"
            />
          </div>

          <div>
            <label className="form-label">Link Type</label>
            <select
              className={selectCls}
              value={(form as any).linkType}
              onChange={(e) => handleLinkTypeChange(e.target.value)}
            >
              {LINK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {(form as any).linkType === 'custom' ? (
            <div>
              <label className="form-label">URL</label>
              <input
                className="form-input"
                value={form.url}
                onChange={(e) => set('url', e.target.value)}
                placeholder="/customize or https://…"
              />
            </div>
          ) : (
            <div>
              <label className="form-label">
                {LINK_TYPES.find((t) => t.value === (form as any).linkType)?.label}
              </label>
              <select
                className={selectCls}
                value={(form as any).refValue}
                onChange={(e) => handleRefChange(e.target.value)}
              >
                <option value="">Select…</option>
                {refOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {form.url && <p className="text-[11px] text-slate-500 mt-1">→ {form.url}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Open In</label>
              <select
                className={selectCls}
                value={form.target}
                onChange={(e) => set('target', e.target.value)}
              >
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>

          {!isSubLink && (
            <div className="border-t border-slate-200 pt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!(form as any).hasMegaMenu}
                  onChange={(e) => set('hasMegaMenu', e.target.checked)}
                />
                Rich mega-menu (images/columns/CTA)
              </label>
              {(form as any).hasMegaMenu && (
                <div className="mt-2">
                  <label className="form-label">Layout</label>
                  <select
                    className={selectCls}
                    value={(form as any).megaMenuLayout}
                    onChange={(e) => set('megaMenuLayout', e.target.value)}
                  >
                    <option value="columns">Columns + CTA</option>
                    <option value="tiles">Media Tiles</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Edit the actual columns/links/images in{' '}
                    <Link href="/mega-menu" className="text-brand-600 hover:underline">
                      Mega Menu
                    </Link>{' '}
                    after saving.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    </Dialog>
  )
}

export default function NavigationPage() {
  const [list, setList] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<NavItem | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)
  const { toast } = useToast()

  async function reload() {
    setLoading(true)
    try {
      const r = await api.get('/cms/navigation/admin/all')
      const data = r.data?.data
      setList(Array.isArray(data) ? data : data?.items || [])
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
  }, [])

  const { topLevel, childrenByParent } = useMemo(() => {
    const top: NavItem[] = []
    const byParent: Record<string, NavItem[]> = {}
    ;(list || []).forEach((item) => {
      if (item.parentId) {
        ;(byParent[item.parentId] = byParent[item.parentId] || []).push(item)
      } else {
        top.push(item)
      }
    })
    const bySort = (a: NavItem, b: NavItem) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    top.sort(bySort)
    Object.values(byParent).forEach((arr) => arr.sort(bySort))
    return { topLevel: top, childrenByParent: byParent }
  }, [list])

  const handleAddTop = () => {
    setEditData(null)
    setAddParentId(null)
    setDialogOpen(true)
  }
  const handleAddChild = (parentId: string) => {
    setEditData(null)
    setAddParentId(parentId)
    setDialogOpen(true)
  }
  const handleEdit = (item: NavItem) => {
    setEditData(item)
    setAddParentId(item.parentId || null)
    setDialogOpen(true)
  }

  const move = async (item: NavItem, siblings: NavItem[], direction: 'up' | 'down') => {
    const idx = siblings.findIndex((s) => s.id === item.id)
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= siblings.length) return
    const orderedIds = siblings.map((s) => s.id)
    ;[orderedIds[idx], orderedIds[swapWith]] = [orderedIds[swapWith], orderedIds[idx]]
    try {
      await api.post('/cms/navigation/reorder', {
        parentId: item.parentId || null,
        orderedIds,
      })
      reload()
    } catch {
      toast.error('Failed to reorder — please try again')
    }
  }

  const remove = async (item: NavItem) => {
    if (!confirm(`Delete "${item.label}"? This action cannot be undone.`)) return
    try {
      await api.delete(`/cms/navigation/${item.id}`)
      reload()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to delete')
    }
  }

  const iconBtn =
    'inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed'

  const actions = (item: NavItem, siblings: NavItem[], idx: number) => (
    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
      <button
        className={iconBtn}
        onClick={() => move(item, siblings, 'up')}
        disabled={idx === 0}
        aria-label="Move up"
        title="Move up"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        className={iconBtn}
        onClick={() => move(item, siblings, 'down')}
        disabled={idx === siblings.length - 1}
        aria-label="Move down"
        title="Move down"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button className={iconBtn} onClick={() => handleEdit(item)} aria-label="Edit item" title="Edit item">
        <Pencil className="h-4 w-4" />
      </button>
      <button
        className={`${iconBtn} text-red-600 hover:bg-red-50`}
        onClick={() => remove(item)}
        aria-label="Delete item"
        title="Delete item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <>
      <PageHeader
        title="Navigation Menu"
        description="Top navigation shown across the storefront. Add categories, collections, or external links."
        actions={
          <button onClick={handleAddTop} className="btn-primary">
            <Plus className="w-4 h-4" /> Add menu item
          </button>
        }
      />

      {loading ? (
        <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      ) : !topLevel.length ? (
        <EmptyState
          icon={<MenuIcon className="w-6 h-6" />}
          title="No navigation items yet"
          description="Build the top menu — Rings, Necklaces, Collections, About, etc."
          action={
            <button onClick={handleAddTop} className="btn-primary">
              <Plus className="w-4 h-4" /> Add first menu item
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {topLevel.map((item, idx) => {
            const children = childrenByParent[item.id as string] || []
            return (
              <div key={item.id} className="border-b border-slate-100 last:border-b-0">
                {/* Top-level row */}
                <div className="group flex items-start gap-4 px-6 py-5">
                  <span className="w-6 shrink-0 text-sm leading-6 text-slate-400 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base font-semibold truncate" title={item.label}>
                        {item.label}
                      </span>
                      {!item.isActive && (
                        <span className="badge bg-slate-100 text-slate-500 shrink-0">Inactive</span>
                      )}
                    </div>
                    <div
                      className="text-sm text-slate-500 flex items-center gap-1 min-w-0"
                      title={item.url}
                    >
                      <span className="truncate">{item.url}</span>
                      {item.target === '_blank' && (
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>
                  </div>
                  {actions(item, topLevel, idx)}
                </div>

                {/* Child sub-links */}
                {children.map((child, cIdx) => (
                  <div
                    key={child.id}
                    className="group flex items-start gap-4 pl-14 pr-6 py-2"
                  >
                    <div className="min-w-0 flex-1 border-l border-slate-200 pl-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate" title={child.label}>
                          {child.label}
                        </span>
                        {!child.isActive && (
                          <span className="badge bg-slate-100 text-slate-500 shrink-0 text-[10px]">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div
                        className="text-xs text-slate-500 flex items-center gap-1 min-w-0"
                        title={child.url}
                      >
                        <span className="truncate">{child.url}</span>
                        {child.target === '_blank' && (
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        )}
                      </div>
                    </div>
                    {actions(child, children, cIdx)}
                  </div>
                ))}

                {/* Subtle Add Sub-Link */}
                <div className="pl-14 pr-6 pb-3">
                  <button
                    onClick={() => handleAddChild(item.id as string)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Sub-Link
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NavItemModal
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditData(null)
        }}
        onSuccess={reload}
        editData={editData}
        parentId={addParentId}
      />
    </>
  )
}

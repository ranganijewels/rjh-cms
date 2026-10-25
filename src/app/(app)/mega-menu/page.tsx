'use client'

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import api from '@/lib/api'
import { useToast } from '@/components/Toast'
import StandardMenuEditor from '@/components/megaMenu/StandardMenuEditor'
import MediaTilesEditor from '@/components/megaMenu/MediaTilesEditor'
import { LayoutGrid, Loader2 } from 'lucide-react'

const PAGE_SLUG = 'mega-menu'

// Backend starter content is keyed by these legacy menu names. When an item
// was created through the Navigation editor it gets a fresh `megaMenuKey`, so
// cloning the matching legacy section onto that key keeps "Load starter
// content" useful instead of seeding keys nothing points at.
const LEGACY_STARTER_KEYS: Record<string, string> = {
  Engagement: 'engagement',
  Wedding: 'wedding',
  Jewelry: 'jewelry',
  Customize: 'customize',
  'About us': 'about-us',
}

interface NavMenuEntry {
  key: string
  navId: string
  label: string
  layout: 'columns' | 'tiles'
}

const blankContent = (layout: 'columns' | 'tiles') =>
  layout === 'tiles' ? { mediaTiles: [] } : { columns: [], imageSection: null }

// Editor for the storefront's rich mega-menu dropdowns. The list is every
// top-level item in CMS → Navigation that has "Rich mega-menu" enabled, keyed
// by that item's stable metadata.megaMenuKey. Content itself is stored in the
// generic CmsSection system (pageSlug='mega-menu'), which the storefront reads
// by the same key.
export default function MegaMenuPage() {
  const [navMenuItems, setNavMenuItems] = useState<NavMenuEntry[]>([])
  const [sections, setSections] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [navRes, secRes] = await Promise.all([
        api.get('/cms/navigation/admin/all'),
        api.get('/cms/sections', { params: { pageSlug: PAGE_SLUG } }),
      ])

      const navData = navRes.data?.data ?? navRes.data
      const items: NavMenuEntry[] = (Array.isArray(navData) ? navData : [])
        .filter(
          (item: any) =>
            !item.parentId && item.metadata?.hasMegaMenu && item.metadata?.megaMenuKey
        )
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((item: any) => ({
          key: item.metadata.megaMenuKey,
          navId: item.id,
          label: item.label,
          layout: item.metadata.megaMenuLayout === 'tiles' ? 'tiles' : 'columns',
        }))
      setNavMenuItems(items)

      const secData = secRes.data?.data ?? secRes.data
      const map: Record<string, any> = {}
      ;(Array.isArray(secData) ? secData : []).forEach((s: any) => {
        map[s.sectionKey] = s
      })
      setSections(map)

      setActive((prev) =>
        items.some((m) => m.key === prev) ? prev : items[0]?.key || null
      )
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load mega menu content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activeItem = navMenuItems.find((m) => m.key === active)
  const current = active ? sections[active] : null
  const content = current?.content || blankContent(activeItem?.layout || 'columns')

  const setContent = (next: any) => {
    if (!activeItem) return
    setSections((prev) => ({
      ...prev,
      [activeItem.key]: {
        ...(prev[activeItem.key] || {
          sectionKey: activeItem.key,
          sectionType: activeItem.layout === 'tiles' ? 'mega-menu-tiles' : 'mega-menu',
          label: activeItem.label,
          sortOrder: navMenuItems.findIndex((m) => m.key === activeItem.key),
        }),
        content: next,
      },
    }))
  }

  async function handleSeed() {
    setSeeding(true)
    setError('')
    setMessage('')
    try {
      const res = await api.post('/cms/sections/seed', { pageSlug: PAGE_SLUG })
      const seededData = res.data?.data ?? res.data
      const seeded: Record<string, any> = {}
      ;(Array.isArray(seededData) ? seededData : []).forEach((s: any) => {
        seeded[s.sectionKey] = s
      })

      // Clone legacy starter content onto each item's stable key (only for
      // items that don't have content yet).
      let cloned = 0
      for (let i = 0; i < navMenuItems.length; i++) {
        const item = navMenuItems[i]
        if (sections[item.key] || seeded[item.key]) continue
        const legacyKey = LEGACY_STARTER_KEYS[item.label]
        const src = legacyKey ? seeded[legacyKey] : null
        if (!src) continue
        await api.post('/cms/sections', {
          pageSlug: PAGE_SLUG,
          sectionKey: item.key,
          sectionType: item.layout === 'tiles' ? 'mega-menu-tiles' : 'mega-menu',
          label: item.label,
          sortOrder: i,
          isPublished: true,
          content: src.content,
        })
        cloned++
      }

      await load()
      toast.success(
        cloned > 0
          ? `Starter content loaded for ${cloned} menu${cloned === 1 ? '' : 's'}`
          : 'Starter content loaded'
      )
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load starter content'
      setError(msg)
      toast.error(msg)
    } finally {
      setSeeding(false)
    }
  }

  async function handleSave() {
    if (!activeItem) return
    const sec =
      current || {
        sectionKey: activeItem.key,
        sectionType: activeItem.layout === 'tiles' ? 'mega-menu-tiles' : 'mega-menu',
        label: activeItem.label,
        sortOrder: navMenuItems.findIndex((m) => m.key === activeItem.key),
        content: blankContent(activeItem.layout),
      }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        pageSlug: PAGE_SLUG,
        sectionKey: sec.sectionKey,
        // Derive from the nav item's CURRENT layout: an existing row can
        // carry the type from before a layout flip (tiles ↔ columns), and
        // the storefront dispatches its renderer on this value — a stale
        // type makes it keep rendering the old panel.
        sectionType: activeItem.layout === 'tiles' ? 'mega-menu-tiles' : 'mega-menu',
        label: activeItem.label,
        sortOrder: sec.sortOrder ?? 0,
        isPublished: true,
        content: sec.content,
      }
      const res = sec.id
        ? await api.put(`/cms/sections/${sec.id}`, payload)
        : await api.post('/cms/sections', payload)
      const saved = res.data?.data ?? res.data
      setSections((prev) => ({ ...prev, [activeItem.key]: saved }))
      toast.success(`${activeItem.label} menu saved & published`)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Save failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const missingCount = useMemo(
    () => navMenuItems.filter((m) => !sections[m.key]).length,
    [navMenuItems, sections]
  )

  return (
    <>
      <PageHeader
        title="Mega Menu Content"
        description='Edit the images, columns, links, and CTA for any nav item with "Rich mega-menu" enabled — turn that on per item in Navigation Menu.'
        actions={
          !loading && missingCount > 0 ? (
            <button onClick={handleSeed} disabled={seeding} className="btn-outline">
              {seeding ? 'Loading…' : 'Load starter content'}
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      ) : navMenuItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <LayoutGrid className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No nav items have a rich mega-menu yet. Go to Navigation Menu, edit (or add) a
            top-level item, and check &quot;Rich mega-menu&quot; — it&apos;ll show up here to
            edit.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {navMenuItems.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setActive(m.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  active === m.key
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m.label}
                {!sections[m.key] && (
                  <span className="ml-1.5 text-[10px] opacity-70">(not set up)</span>
                )}
              </button>
            ))}
          </div>

          {!current && (
            <p className="text-sm text-slate-500 mb-3">
              No content saved yet for {activeItem?.label} — build it below and Save &amp;
              Publish.
            </p>
          )}

          {activeItem?.layout === 'tiles' ? (
            <MediaTilesEditor content={content} onChange={setContent} />
          ) : (
            <StandardMenuEditor content={content} onChange={setContent} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {message && <span className="text-sm text-emerald-600 mr-auto">{message}</span>}
            {error && <span className="text-sm text-red-600 mr-auto">{error}</span>}
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
          </div>
        </>
      )}
    </>
  )
}

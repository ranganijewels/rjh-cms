import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/Toast'
import api from './api'

// ─── Shared section-editor data layer (React Query) ─────────────────────────
// Every storefront-page editor in the CMS is built on `cms_sections` rows:
// load them for a page, edit `content`, PUT (or POST when new) back. This
// module owns that lifecycle so pages only carry their unique UI.
//
// Server state lives in the React Query cache (keyed per page/section):
// - background refetch when a page remounts within staleTime (30s),
// - automatic retry (once) + dedupe of concurrent loads,
// - editors that open the same page (e.g. homepage + instagram) share one
//   cached section list.
// The public API below is unchanged from the pre-React-Query version, so
// pages are pure consumers.

export type SectionContent = Record<string, any>

export interface SectionRecord {
  id?: string
  sectionKey: string
  sectionType: string
  label: string
  sortOrder: number
  content: SectionContent
}

// API row → SectionRecord. The axios response interceptor adds snake_case
// aliases, so reading the camelCase fields below always works.
function toRecord(s: any): SectionRecord {
  return {
    id: s.id,
    sectionKey: s.sectionKey,
    sectionType: s.sectionType || 'custom',
    label: s.label || s.sectionKey,
    sortOrder: s.sortOrder ?? 0,
    content: s.content && typeof s.content === 'object' ? s.content : {},
  }
}

const idOf = (res: any): string | undefined => res?.data?.data?.id || res?.data?.id

function sectionBody(pageSlug: string, sec: SectionRecord, content: SectionContent) {
  return {
    pageSlug,
    sectionKey: sec.sectionKey,
    sectionType: sec.sectionType,
    label: sec.label,
    sortOrder: sec.sortOrder,
    isPublished: true,
    content,
  }
}

async function fetchSectionMap(pageSlug: string): Promise<Record<string, SectionRecord>> {
  const r = await api.get('/cms/sections', { params: { pageSlug } })
  const map: Record<string, SectionRecord> = {}
  for (const s of r.data?.data || []) map[s.sectionKey] = toRecord(s)
  return map
}

/**
 * All sections of one page, keyed by sectionKey — the shape the multi-card
 * editors (homepage, about) work with.
 *
 * - `get(key, defaults?)` — a section, or a ready-to-edit blank with the
 *   given defaults.
 * - `setContent(key, content)` / `setSec(key, sec)` — local edits, written
 *   straight into the cache.
 * - `saveSection(sec, content?)` — PUT when the section exists, POST
 *   otherwise; remembers the new id so the next save updates.
 * - `saveKeys(keys)` — sequential save-all (aborts on first error).
 */
export function useSections(pageSlug: string) {
  const queryClient = useQueryClient()
  const queryKey = ['cms-sections', pageSlug] as const

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSectionMap(pageSlug),
  })

  // Edits are written into the cache itself — one source of truth, and the
  // pre-React-Query API (sections/setSections-shaped helpers) is preserved.
  const sections = query.data ?? {}

  const get = useCallback(
    (key: string, defaults?: Partial<SectionRecord>): SectionRecord =>
      sections[key] || {
        sectionKey: key,
        sectionType: 'custom',
        label: key,
        sortOrder: 0,
        content: {},
        ...defaults,
      },
    [sections],
  )

  const setContent = useCallback(
    (key: string, content: SectionContent) => {
      queryClient.setQueryData<Record<string, SectionRecord>>(queryKey, (prev) => {
        const base =
          prev?.[key] || { sectionKey: key, sectionType: 'custom', label: key, sortOrder: 0, content: {} }
        return { ...(prev || {}), [key]: { ...base, content } }
      })
    },
    [queryClient, pageSlug],
  )

  const setSec = useCallback(
    (key: string, sec: SectionRecord) => {
      queryClient.setQueryData<Record<string, SectionRecord>>(queryKey, (prev) => ({
        ...(prev || {}),
        [key]: sec,
      }))
    },
    [queryClient, pageSlug],
  )

  const saveSection = useCallback(
    async (sec: SectionRecord, content?: SectionContent) => {
      const nextContent = content ?? sec.content
      const res = sec.id
        ? await api.put(`/cms/sections/${sec.id}`, sectionBody(pageSlug, sec, nextContent))
        : await api.post('/cms/sections', sectionBody(pageSlug, sec, nextContent))
      const newId = idOf(res)
      if (newId && !sec.id) {
        // Remember the id so a second save updates instead of duplicating.
        queryClient.setQueryData<Record<string, SectionRecord>>(queryKey, (prev) => ({
          ...(prev || {}),
          [sec.sectionKey]: { ...(prev?.[sec.sectionKey] || sec), id: newId, content: nextContent },
        }))
      }
      return res
    },
    [queryClient, pageSlug],
  )

  const saveKeys = useCallback(
    async (keys: string[]) => {
      for (const key of keys) await saveSection(get(key))
    },
    [saveSection, get],
  )

  const reload = useCallback(async () => {
    await query.refetch()
  }, [query])

  return {
    sections,
    loading: query.isPending,
    error: query.isError ? (query.error as any)?.message || 'Load failed' : '',
    reload,
    get,
    setContent,
    setSec,
    saveSection,
    saveKeys,
  }
}

export interface UseSectionOptions {
  /** Content used when the section is missing/empty (e.g. the storefront's defaults). */
  fetchDefaults?: () => Promise<SectionContent>
  /** How to name the section the first time it's created. */
  createDefaults?: Partial<Pick<SectionRecord, 'sectionType' | 'label' | 'sortOrder'>>
  successMessage?: string
}

/**
 * ONE section of one page — the single-card editors (pdp, instagram).
 * Tracks the section record + the content object being edited; `save()`
 * PUTs/POSTs, records a freshly created id, and toasts on success.
 */
export function useSection(pageSlug: string, sectionKey: string, opts: UseSectionOptions = {}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const queryKey = ['cms-section', pageSlug, sectionKey] as const
  // Option closures are recreated each render; keep the latest without
  // making them effect dependencies (that would refetch forever).
  const optsRef = useRef(opts)
  optsRef.current = opts

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const r = await api.get('/cms/sections', { params: { pageSlug } })
      const found = (r.data?.data || []).find((s: any) => s.sectionKey === sectionKey)
      const record = found ? toRecord(found) : null
      if (found?.content && typeof found.content === 'object' && Object.keys(found.content).length) {
        return record!
      }
      if (optsRef.current.fetchDefaults) {
        const fallback = await optsRef.current.fetchDefaults()
        return { ...(record || { sectionKey, sectionType: 'custom', label: sectionKey, sortOrder: 0 }), content: fallback }
      }
      return record || { sectionKey, sectionType: 'custom', label: sectionKey, sortOrder: 0, content: {} }
    },
  })

  const sec = query.data ?? null
  const content: SectionContent | null = sec?.content ?? null

  const setContent = useCallback(
    (next: SectionContent) => {
      queryClient.setQueryData<SectionRecord>(queryKey, (prev) =>
        prev ? { ...prev, content: next } : prev,
      )
    },
    [queryClient, pageSlug, sectionKey],
  )

  const patch = useCallback(
    (p: SectionContent) => {
      queryClient.setQueryData<SectionRecord>(queryKey, (prev) =>
        prev ? { ...prev, content: { ...(prev.content || {}), ...p } } : prev,
      )
    },
    [queryClient, pageSlug, sectionKey],
  )

  async function save(overrides?: { content?: SectionContent; successMessage?: string }) {
    setSaving(true)
    setError('')
    try {
      const nextContent = overrides?.content ?? content ?? {}
      const base: SectionRecord = sec || {
        sectionKey,
        sectionType: optsRef.current.createDefaults?.sectionType || 'custom',
        label: optsRef.current.createDefaults?.label || sectionKey,
        sortOrder: optsRef.current.createDefaults?.sortOrder ?? 0,
        content: {},
      }
      const res = base.id
        ? await api.put(`/cms/sections/${base.id}`, sectionBody(pageSlug, base, nextContent))
        : await api.post('/cms/sections', sectionBody(pageSlug, base, nextContent))
      const newId = idOf(res)
      if (newId && !sec?.id) {
        queryClient.setQueryData<SectionRecord>(queryKey, {
          ...base,
          id: newId,
          content: nextContent,
        })
      }
      toast.success(
        overrides?.successMessage || optsRef.current.successMessage || 'Saved & published to the storefront',
      )
      return res
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return {
    sec,
    content,
    setContent,
    patch,
    loading: query.isPending,
    saving,
    error: error || (query.isError ? (query.error as any)?.message || 'Load failed' : ''),
    save,
  }
}

/**
 * Shared list-editor operations for repeatable card items. Handles arrays of
 * objects (merge the patch in) and arrays of strings (replace the element) —
 * the PDP accordion bullets are the latter.
 */
export function useList<T extends object | string>(
  items: T[],
  setItems: (next: T[]) => void,
  blank: () => T,
) {
  return {
    update: (i: number, patch: Partial<T> | T) =>
      setItems(
        items.map((it, idx) =>
          idx === i
            ? ((typeof it === 'string'
                ? patch
                : { ...(it as object), ...(patch as object) }) as T)
            : it,
        ),
      ),
    remove: (i: number) => setItems(items.filter((_, idx) => idx !== i)),
    add: () => setItems([...items, blank()]),
    move: (i: number, dir: -1 | 1) => {
      const j = i + dir
      if (j < 0 || j >= items.length) return
      const next = [...items]
      ;[next[i], next[j]] = [next[j], next[i]]
      setItems(next)
    },
  }
}

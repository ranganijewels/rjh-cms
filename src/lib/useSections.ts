import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/Toast'
import api from './api'

// ─── Shared section-editor data layer ───────────────────────────────────────
// Every storefront-page editor in the CMS is built on `cms_sections` rows:
// load them for a page, edit `content`, PUT (or POST when new) back. This
// module owns that lifecycle so pages only carry their unique UI.
//
// Increment S4a of the data-layer refactor. S4b (React Query) swaps the
// internals here for a cache — the pages above this API don't change.

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

/**
 * All sections of one page, keyed by sectionKey — the shape the multi-card
 * editors (homepage, about) work with.
 *
 * - `get(key, defaults?)` — a section, or a ready-to-edit blank with the
 *   given defaults.
 * - `setContent(key, content)` / `setSec(key, sec)` — local edits.
 * - `saveSection(sec, content?)` — PUT when the section exists, POST
 *   otherwise; remembers the new id so the next save updates.
 * - `saveKeys(keys)` — sequential save-all (aborts on first error).
 */
export function useSections(pageSlug: string) {
  const [sections, setSections] = useState<Record<string, SectionRecord>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.get('/cms/sections', { params: { pageSlug } })
      const map: Record<string, SectionRecord> = {}
      for (const s of r.data?.data || []) map[s.sectionKey] = toRecord(s)
      setSections(map)
    } catch (e: any) {
      setError(e?.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [pageSlug])

  useEffect(() => {
    reload()
  }, [reload])

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

  const setContent = useCallback((key: string, content: SectionContent) => {
    setSections((prev) => {
      const base =
        prev[key] || { sectionKey: key, sectionType: 'custom', label: key, sortOrder: 0, content: {} }
      return { ...prev, [key]: { ...base, content } }
    })
  }, [])

  const setSec = useCallback((key: string, sec: SectionRecord) => {
    setSections((prev) => ({ ...prev, [key]: sec }))
  }, [])

  const saveSection = useCallback(
    async (sec: SectionRecord, content?: SectionContent) => {
      const nextContent = content ?? sec.content
      const res = sec.id
        ? await api.put(`/cms/sections/${sec.id}`, sectionBody(pageSlug, sec, nextContent))
        : await api.post('/cms/sections', sectionBody(pageSlug, sec, nextContent))
      const newId = idOf(res)
      if (newId && !sec.id) {
        // Remember the id so a second save updates instead of duplicating.
        setSections((prev) => ({
          ...prev,
          [sec.sectionKey]: { ...prev[sec.sectionKey], id: newId, content: nextContent },
        }))
      }
      return res
    },
    [pageSlug],
  )

  const saveKeys = useCallback(
    async (keys: string[]) => {
      for (const key of keys) await saveSection(get(key))
    },
    [saveSection, get],
  )

  return { sections, loading, error, reload, get, setContent, setSec, saveSection, saveKeys }
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
  const [sec, setSec] = useState<SectionRecord | null>(null)
  const [content, setContent] = useState<SectionContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()
  // Option closures are recreated each render; keep the latest without
  // making them effect dependencies (that would refetch forever).
  const optsRef = useRef(opts)
  optsRef.current = opts

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const r = await api.get('/cms/sections', { params: { pageSlug } })
        const found = (r.data?.data || []).find((s: any) => s.sectionKey === sectionKey)
        if (cancelled) return
        setSec(found ? toRecord(found) : null)
        if (found?.content && typeof found.content === 'object' && Object.keys(found.content).length) {
          setContent(found.content)
        } else if (optsRef.current.fetchDefaults) {
          setContent(await optsRef.current.fetchDefaults())
        } else {
          setContent(found?.content || {})
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageSlug, sectionKey])

  const patch = useCallback((p: SectionContent) => {
    setContent((prev) => ({ ...(prev || {}), ...p }))
  }, [])

  async function save(overrides?: { content?: SectionContent; successMessage?: string }) {
    setSaving(true)
    setError('')
    try {
      const nextContent = overrides?.content ?? content ?? {}
      const base: SectionRecord = sec || {
        sectionKey,
        sectionType: opts.createDefaults?.sectionType || 'custom',
        label: opts.createDefaults?.label || sectionKey,
        sortOrder: opts.createDefaults?.sortOrder ?? 0,
        content: {},
      }
      const res = base.id
        ? await api.put(`/cms/sections/${base.id}`, sectionBody(pageSlug, base, nextContent))
        : await api.post('/cms/sections', sectionBody(pageSlug, base, nextContent))
      const newId = idOf(res)
      if (newId && !sec) setSec({ ...base, id: newId, content: nextContent })
      if (overrides?.content) setContent(nextContent)
      toast.success(overrides?.successMessage || opts.successMessage || 'Saved & published to the storefront')
      return res
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return { sec, content, setContent, patch, loading, saving, error, save }
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

import { useState, type ReactNode } from 'react'
import { useToast } from './Toast'

// ─── Shared section-editor UI ───────────────────────────────────────────────
// The visual shells every page editor repeats: loading skeleton, labelled
// field, plain grouping card, and the card with its own Save & Publish.

/** Loading placeholder shown while an editor fetches its sections. */
export function EditorSkeleton() {
  return (
    <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-4 bg-slate-200 rounded w-1/4" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  )
}

/** Label + control pair used across the editors. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

/** Plain grouped card without a save affordance (the PDP-style shell). */
export function EditorCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/**
 * Card with its own Save & Publish button, success toast and inline error —
 * the shared shell of every per-section editor. `save` persists the section
 * (usually `saveSection` from useSections()); `onSaved` typically reloads
 * the page's sections so ids stay fresh.
 */
export function SectionCard({
  title,
  description,
  save,
  onSaved,
  children,
}: {
  title: string
  description?: string
  save: () => Promise<unknown>
  onSaved: () => void
  children: ReactNode
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  async function doSave() {
    setSaving(true)
    setError('')
    try {
      await save()
      toast.success('Saved & published to the storefront')
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button onClick={doSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

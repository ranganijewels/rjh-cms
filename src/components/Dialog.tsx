'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  onClose: () => void
  title: string
  /** Extra width on top of the `w-full` default, e.g. `max-w-2xl`. */
  maxWidth?: string
  /** Layout classes for the scrollable body region. */
  bodyClassName?: string
  /** Rendered pinned to the bottom of the panel (actions row). */
  footer?: React.ReactNode
  /** Locks close affordances while an async action is in flight. */
  busy?: boolean
  /** Ask before discarding an edited form (uses a native confirm). */
  confirmOnDirty?: boolean
  children: React.ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared modal shell: one implementation of the things every screen used to
 * re-invent (or get wrong) — Escape to close, backdrop close, focus trap with
 * focus restored to the trigger, background scroll lock, labelled dialog ARIA,
 * a max-height panel so long forms scroll inside instead of pushing the page,
 * and an optional "discard changes?" guard for forms.
 *
 * The modal is only mounted when open (all call sites render it
 * conditionally), so mount = open.
 */
export default function Dialog({
  onClose,
  title,
  maxWidth = 'max-w-lg',
  bodyClassName = 'px-6 py-5 space-y-4',
  footer,
  busy = false,
  confirmOnDirty = false,
  children,
}: DialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const dirtyRef = useRef(false)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  /** Central close path: honour busy, confirm when the form was edited. */
  function requestClose() {
    if (busy) return
    if (confirmOnDirty && dirtyRef.current) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return
    }
    onClose()
  }

  // Mount: move focus into the dialog (unless something like an input's
  // autoFocus already grabbed it), lock background scroll, and remember what
  // was focused so it can be restored on close.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) panel.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      const restore = restoreFocusRef.current
      if (restore && document.contains(restore)) restore.focus()
    }
  }, [])

  // Track whether the user typed anything so confirmOnDirty can ask first.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const markDirty = () => {
      dirtyRef.current = true
    }
    panel.addEventListener('input', markDirty, true)
    panel.addEventListener('change', markDirty, true)
    return () => {
      panel.removeEventListener('input', markDirty, true)
      panel.removeEventListener('change', markDirty, true)
    }
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      requestClose()
      return
    }
    if (e.key !== 'Tab') return
    // Simple focus trap: cycle Tab/Shift+Tab through the focusable elements
    // inside the panel only.
    const panel = panelRef.current
    if (!panel) return
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        // Only a click that starts on the backdrop closes — no accidental
        // loss when a drag ends outside a field.
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`card relative flex max-h-[90vh] w-full flex-col outline-none ${maxWidth}`}
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h3 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close dialog"
            className="-mr-1.5 shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>

        {footer && (
          <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

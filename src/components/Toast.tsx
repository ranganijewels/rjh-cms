'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Success/error feedback for actions that used to surface as blocking
 * `alert()`s or inline "Saved ✓" text. Mounted once in the root layout, so
 * every screen (including login) can call `useToast()`.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current
      // Keep at most four on screen; errors linger longer than successes.
      setItems((list) => [...list.slice(-3), { id, kind, message }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      success: (m: string) => push('success', m),
      error: (m: string) => push('error', m),
      info: (m: string) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Single polite live region: screen readers announce each toast as it
          arrives without stealing focus mid-edit. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const styles =
    item.kind === 'success'
      ? { chip: 'bg-emerald-50 text-emerald-600', Icon: CheckCircle2 }
      : item.kind === 'error'
        ? { chip: 'bg-red-50 text-red-600', Icon: XCircle }
        : { chip: 'bg-brand-50 text-brand-navy', Icon: Info }
  const { chip, Icon } = styles

  return (
    <div className="card pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 px-4 py-3 shadow-lg motion-reduce:animate-none">
      <span
        aria-hidden="true"
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${chip}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 pt-0.5 text-sm text-slate-700">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1.5 shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

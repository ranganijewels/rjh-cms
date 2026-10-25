'use client'

import { createContext, useContext, useMemo } from 'react'
import { Toaster, toast as sonner } from 'sonner'

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
 * every screen (including login) can call `useToast()`. Rendering is
 * delegated to Sonner; the hook's shape is unchanged so call sites don't care.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const toast = {
  success: (m: string) => void sonner.success(m),
  // Errors linger longer than successes.
  error: (m: string) => void sonner.error(m, { duration: 6000 }),
  info: (m: string) => void sonner.info(m),
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ toast }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3500}
        visibleToasts={4}
        toastOptions={{ style: { fontFamily: 'inherit' } }}
      />
    </ToastContext.Provider>
  )
}

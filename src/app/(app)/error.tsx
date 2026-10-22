'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Route-level error boundary for every authenticated screen. Catches render
 * and data-loading failures inside (app) pages without taking the whole CMS
 * down — the sidebar shell above this stays usable, and `reset()` re-renders
 * just this segment.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface in the console for debugging; the digest is the server-side id.
    console.error('CMS screen error:', error)
  }, [error])

  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">This screen failed to load</h2>
      <p className="mt-2 text-sm text-slate-600">
        Something went wrong while rendering this page. Your content is safe —
        try again, or jump back to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate-500">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/dashboard" className="btn-outline">
          Back to dashboard
        </a>
      </div>
    </div>
  )
}

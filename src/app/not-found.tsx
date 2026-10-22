import Link from 'next/link'
import BrandMark from '@/components/BrandMark'

/** Global 404 — styled, with a way back in. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rule-gold mx-auto mb-6" />
      <BrandMark variant="wordmark" width={140} className="mx-auto mb-10" />
      <p className="text-xs2 font-semibold uppercase tracking-widest text-slate-500">
        404 — Page not found
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        That page doesn’t exist
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        The link may be out of date, or the page was renamed. Head back to the
        CMS dashboard to keep editing.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          Back to dashboard
        </Link>
        <Link href="/login" className="btn-outline">
          Sign in
        </Link>
      </div>
    </div>
  )
}

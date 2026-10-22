/**
 * Segment-level loading state for authenticated routes — shown while a page's
 * data requests resolve, inside the already-rendered app shell.
 */
export default function AppLoading() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" aria-busy="true">
      <div className="rule-gold mb-4" />
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />
      <div className="mt-8 space-y-3">
        <div className="card p-6">
          <div className="h-4 w-1/3 rounded bg-slate-200/80" />
          <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

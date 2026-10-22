'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import EmptyState from './EmptyState'

interface Column<T> {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  rows: T[]
  columns: Column<T>[]
  loading?: boolean
  empty?: React.ReactNode
  error?: React.ReactNode
  onRowClick?: (row: T) => void
  /** Render a search box that filters rows client-side across these keys. */
  searchKeys?: string[]
  /** Rows per page once the list grows (0 disables pagination entirely). */
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 25

export default function DataTable<T extends { id?: string; slug?: string }>({
  rows,
  columns,
  loading,
  empty,
  error,
  onRowClick,
  searchKeys,
  pageSize = DEFAULT_PAGE_SIZE,
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // Client-side filter over the declared keys — the API list endpoints return
  // the full set, so filtering here is instant and adds no requests.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !searchKeys?.length) return rows
    return rows.filter((r) =>
      searchKeys.some((k) => String((r as any)[k] ?? '').toLowerCase().includes(q)),
    )
  }, [rows, query, searchKeys])

  // Start from the top whenever the data or the filter changes.
  useEffect(() => {
    setPage(1)
  }, [rows, query])

  const showSearch = !!searchKeys?.length
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1
  const current = Math.min(page, pageCount)
  const visible =
    pageSize > 0 && filtered.length > pageSize
      ? filtered.slice((current - 1) * pageSize, current * pageSize)
      : filtered

  const toolbar = showSearch && (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="relative w-full max-w-[16rem]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${columns[0]?.header ? columns[0].header.toLowerCase() : 'rows'}`}
          placeholder="Search…"
          className="form-input !py-1.5 !pl-8 text-sm"
        />
      </div>
      {/* Announced politely so screen-reader users hear the count change. */}
      <span aria-live="polite" className="shrink-0 text-xs text-slate-500">
        {filtered.length === rows.length
          ? `${rows.length} total`
          : `${filtered.length} of ${rows.length}`}
      </span>
    </div>
  )

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        description={typeof error === 'string' ? error : 'Please try again.'}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      />
    )
  }
  if (loading) {
    return (
      <div className="card overflow-hidden" aria-busy="true" aria-live="polite">
        {/* Header row mirroring .table-base's tinted thead. */}
        <div className="h-11 bg-slate-50/70 border-b border-slate-200" />
        <div className="divide-y divide-slate-100">
          {[70, 45, 60, 35, 52].map((w, i) => (
            <div key={i} className="px-4 py-3.5">
              <div
                className="h-3.5 bg-slate-200/80 rounded animate-pulse motion-reduce:animate-none"
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (!rows.length) return <>{empty}</>

  // Filter matched nothing — keep the toolbar usable instead of showing the
  // "no data yet" empty state, which would be a lie.
  if (!visible.length) {
    return (
      <div className="card overflow-hidden">
        {toolbar}
        <div className="px-4 py-10 text-center text-sm text-slate-500">
          No rows match “{query}”.
          <button
            type="button"
            onClick={() => setQuery('')}
            className="ml-2 text-brand-600 underline-offset-2 hover:underline"
          >
            Clear search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {toolbar}
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={c.className}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={(row as any).id || (row as any).slug || i}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(row)
                  }
                }}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={
                  onRowClick
                    ? 'cursor-pointer min-h-[44px] hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50 focus-visible:bg-slate-50'
                    : ''
                }
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.className}>
                    {c.cell ? c.cell(row) : (row as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5">
          <span className="text-xs text-slate-500">
            Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              aria-label="Previous page"
              className="btn-outline !px-2 !py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-slate-600">
              Page {current} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount}
              aria-label="Next page"
              className="btn-outline !px-2 !py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

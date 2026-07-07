'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
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
}

export default function DataTable<T extends { id?: string; slug?: string }>({
  rows,
  columns,
  loading,
  empty,
  error,
  onRowClick,
}: Props<T>) {
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
      <div className="card overflow-hidden">
        <div className="animate-pulse p-6 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }
  if (!rows.length) return <>{empty}</>
  return (
    <div className="card overflow-hidden">
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
            {rows.map((row, i) => (
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
    </div>
  )
}

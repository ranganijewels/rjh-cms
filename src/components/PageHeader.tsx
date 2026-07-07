import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  description?: string
  actions?: React.ReactNode
  back?: { href: string; label: string }
}

export default function PageHeader({ title, description, actions, back }: Props) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="text-xs text-slate-600 hover:text-slate-800 mb-2 inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

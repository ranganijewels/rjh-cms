import { Inbox } from 'lucide-react'

interface Props {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export default function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="card p-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-navy mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

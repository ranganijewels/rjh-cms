type Status = 'published' | 'draft'

interface Props {
  status: Status
  publishedLabel?: string
  draftLabel?: string
}

const STYLES: Record<Status, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-600',
}

export default function StatusBadge({ status, publishedLabel = 'Published', draftLabel = 'Draft' }: Props) {
  return (
    <span className={`badge ${STYLES[status]}`}>
      {status === 'published' ? publishedLabel : draftLabel}
    </span>
  )
}

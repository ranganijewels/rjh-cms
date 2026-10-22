'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import NewItemDialog from '@/components/NewItemDialog'
import api from '@/lib/api'
import { Newspaper, Plus } from 'lucide-react'

interface Blog {
  id?: string
  slug: string
  title: string
  isPublished?: boolean
  publishedAt?: string
  tags?: string[]
  updatedAt?: string
}

export default function BlogIndex() {
  const router = useRouter()
  const [rows, setRows] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)

  useEffect(() => {
    api
      .get('/cms/blogs/admin/all', { params: { limit: 100 } })
      .then((r) => {
        const data = r.data?.data
        setRows(Array.isArray(data) ? data : data?.records || [])
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  function createNew() {
    setShowNewDialog(true)
  }

  function handleCreateSlug(slug: string) {
    setShowNewDialog(false)
    router.push(`/blog/${slug}`)
  }

  return (
    <>
      <PageHeader
        title="Blog Posts"
        description="Storytelling, buying guides, and editorial content shown on the storefront blog."
        actions={
          <button onClick={createNew} className="btn-primary">
            <Plus className="w-4 h-4" /> Write a post
          </button>
        }
      />

      <DataTable
        loading={loading}
        rows={rows}
        searchKeys={['title', 'slug']}
        onRowClick={(r) => router.push(`/blog/${r.slug}`)}
        columns={[
          { key: 'title', header: 'Title', cell: (r) => <span className="font-medium text-slate-900">{r.title}</span> },
          { key: 'slug', header: 'Slug', cell: (r) => <code className="text-xs text-slate-500">{r.slug}</code> },
          { key: 'tag', header: 'Tags', cell: (r) => r.tags?.length ? <span className="badge bg-brand-50 text-brand-navy">{r.tags.join(', ')}</span> : <span className="text-slate-400">—</span> },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.isPublished ? 'published' : 'draft'} /> },
        ]}
        empty={
          <EmptyState
            icon={<Newspaper className="w-6 h-6" />}
            title="No blog posts yet"
            description="Publish stories and guides to drive engagement."
            action={<button onClick={createNew} className="btn-primary"><Plus className="w-4 h-4" /> Write the first post</button>}
          />
        }
      />

      {showNewDialog && (
        <NewItemDialog
          title="New blog post"
          slugPlaceholder="e.g. choosing-the-perfect-diamond"
          onClose={() => setShowNewDialog(false)}
          onCreate={handleCreateSlug}
        />
      )}
    </>
  )
}

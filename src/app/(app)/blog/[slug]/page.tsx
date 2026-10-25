'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import PageHeader from '@/components/PageHeader'
import api from '@/lib/api'
import { useToast } from '@/components/Toast'

export default function BlogEditor() {
  const { slug } = useParams<{ slug: string }>()
  // Field names match the API entity (cms_blogs) exactly, so this editor and
  // Admin → CMS → Blog Manager always read and write the same values.
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    featuredImageUrl: '',
    author: '',
    isPublished: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [message, setMessage] = useState('')

  useEffect(() => {
    api
      .get(`/cms/blogs/admin/slug/${slug}`)
      .then((r) => {
        const p = r.data?.data || {}
        setForm({
          title: p.title || '',
          excerpt: p.excerpt || '',
          content: p.content || '',
          tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
          featuredImageUrl: p.featuredImageUrl || '',
          author: p.author || '',
          isPublished: p.isPublished === true,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      await api.put(`/cms/blogs/${slug}`, {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      toast.success('Blog post saved')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  if (loading) return (
    <div className="card p-6 animate-pulse space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  )

  return (
    <>
      <PageHeader
        back={{ href: '/blog', label: 'All posts' }}
        title={form.title || slug}
        description={`/blog/${slug}`}
        actions={
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save post'}
          </button>
        }
      />

      {message && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <label className="form-label mt-4">Excerpt</label>
            <textarea className="form-textarea min-h-[80px]" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
            <label className="form-label mt-4">Body</label>
            <textarea
              className="form-textarea min-h-[400px] font-mono text-xs"
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <label className="form-label">Cover image URL</label>
            <input className="form-input" value={form.featuredImageUrl} onChange={(e) => set('featuredImageUrl', e.target.value)} />
            {form.featuredImageUrl && (
              <div className="relative mt-3 rounded-lg w-full h-48 overflow-hidden">
                <Image
                  src={form.featuredImageUrl}
                  alt={form.title ? `Cover image for ${form.title}` : 'Blog cover preview'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
            <label className="form-label mt-4">Tags / Categories</label>
            <input className="form-input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="e.g. Guides, Engagement" />
            <label className="form-label mt-4">Author</label>
            <input className="form-input" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Rangani Jewelry House" />
          </div>
          <div className="card p-5">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
              <span className="text-sm">Published</span>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import PageHeader from '@/components/PageHeader'
import api from '@/lib/api'

export default function BlogEditor() {
  const { slug } = useParams<{ slug: string }>()
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    body: '',
    tag: '',
    cover_image: '',
    is_published: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api
      .get(`/cms/blogs/${slug}`)
      .then((r) => {
        const p = r.data?.data || {}
        setForm({
          title: p.title || '',
          excerpt: p.excerpt || '',
          body: p.body || p.content || '',
          tag: p.tag || '',
          cover_image: p.cover_image || p.image || '',
          is_published: p.is_published || false,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      await api.put(`/cms/blogs/${slug}`, form)
      setMessage('Saved')
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>

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
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <label className="form-label">Cover image URL</label>
            <input className="form-input" value={form.cover_image} onChange={(e) => set('cover_image', e.target.value)} />
            {form.cover_image && (
              <div className="relative mt-3 rounded-lg w-full h-48 overflow-hidden">
                <Image
                  src={form.cover_image}
                  alt={form.title ? `Cover image for ${form.title}` : 'Blog cover preview'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
            <label className="form-label mt-4">Tag / Category</label>
            <input className="form-input" value={form.tag} onChange={(e) => set('tag', e.target.value)} placeholder="e.g. Buying Guide" />
          </div>
          <div className="card p-5">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
              <span className="text-sm">Published</span>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

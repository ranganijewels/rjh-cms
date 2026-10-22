'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import api from '@/lib/api'

// Lightweight client-side sanitizer for the live preview only.
// The server is still the source of truth for sanitization at save-time;
// this just strips the obviously dangerous bits before a momentary preview render.
function sanitizePreviewHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*"(\s*javascript:[^"]*)"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'(\s*javascript:[^']*)'/gi, "$1='#'")
}

// Formatting toolbar actions — wrap the current selection in HTML tags.
const FORMAT_ACTIONS: { label: string; wrap: [string, string] }[] = [
  { label: 'H2', wrap: ['<h2>', '</h2>'] },
  { label: 'H3', wrap: ['<h3>', '</h3>'] },
  { label: 'P', wrap: ['<p>', '</p>'] },
  { label: 'Bold', wrap: ['<strong>', '</strong>'] },
  { label: 'Italic', wrap: ['<em>', '</em>'] },
  { label: 'Link', wrap: ['<a href="https://">', '</a>'] },
  { label: 'List', wrap: ['<ul>\n  <li>', '</li>\n</ul>'] },
  { label: 'Item', wrap: ['<li>', '</li>'] },
]

export default function PageEditor() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const applyFormat = ([open, close]: [string, string]) => {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart ?? body.length
    const end = ta.selectionEnd ?? body.length
    const selected = body.slice(start, end)
    const next = body.slice(0, start) + open + selected + close + body.slice(end)
    setBody(next)
    // Restore focus + caret after React re-render.
    requestAnimationFrame(() => {
      ta.focus()
      const caret = start + open.length + selected.length
      ta.setSelectionRange(caret, caret)
    })
  }

  useEffect(() => {
    api
      .get(`/cms/pages/${slug}`)
      .then((r) => {
        const p = r.data?.data || {}
        setTitle(p.title || '')
        setBody(p.body || p.content || '')
        setSeoTitle(p.seo_title || '')
        setSeoDescription(p.seo_description || '')
        setPublished(p.is_published ?? p.status === 'published')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      await api.put(`/cms/pages/${slug}`, {
        title,
        body,
        content: body,
        seo_title: seoTitle,
        seo_description: seoDescription,
        is_published: published,
        status: published ? 'published' : 'draft',
      })
      setMessage('Saved')
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus() {
    try {
      await api.patch(`/cms/pages/${slug}/status`, {})
      setPublished((p) => !p)
    } catch {}
  }

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
        back={{ href: '/pages', label: 'All pages' }}
        title={title || slug}
        description={`/${slug}`}
        actions={
          <>
            <a
              href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000'}/static-page/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              View on site ↗
            </a>
            <button onClick={toggleStatus} className="btn-outline">
              {published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
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
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />

            <div className="flex items-center justify-between mt-4 mb-2">
              <label className="form-label mb-0">Body (HTML)</label>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={`text-xs px-2.5 py-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${!showPreview ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={`text-xs px-2.5 py-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${showPreview ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
                >
                  Preview
                </button>
              </div>
            </div>

            {!showPreview ? (
              <>
                {/* Formatting toolbar — wraps the selection in HTML tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {FORMAT_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => applyFormat(a.wrap)}
                      aria-label={`Wrap selection in ${a.label} tag`}
                      title={`Wrap selection in ${a.label} tag`}
                      className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={bodyRef}
                  className="form-textarea min-h-[400px] font-mono text-xs"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="<h2>About us</h2><p>...</p>"
                />
                <p className="text-xs text-slate-500 mt-1">
                  HTML is sanitized on save — scripts, styles and event handlers are stripped automatically.
                </p>
              </>
            ) : (
              <div
                className="prose prose-sm max-w-none min-h-[400px] rounded-lg border border-slate-200 p-4 overflow-auto"
                // Client-side sanitized for preview; the server also sanitizes the same HTML on save.
                dangerouslySetInnerHTML={{
                  __html: sanitizePreviewHtml(body) || '<p class="text-slate-400">Nothing to preview yet.</p>',
                }}
              />
            )}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">SEO</h3>
            <label className="form-label">SEO title</label>
            <input className="form-input" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            <label className="form-label mt-3">SEO description</label>
            <textarea
              className="form-textarea min-h-[80px]"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Status</h3>
            <label htmlFor="published" className="flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span className="text-sm">Published</span>
            </label>
            <p className="text-xs text-slate-500 mt-2">
              Toggle here is saved with the form. Use the Publish button above for immediate state change.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

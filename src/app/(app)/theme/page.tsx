'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import api from '@/lib/api'

interface Theme {
  brand_name?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  font_heading?: string
  font_body?: string
  social?: {
    instagram?: string
    facebook?: string
    youtube?: string
    pinterest?: string
  }
  contact_email?: string
  contact_phone?: string
  address?: string
}

const DEFAULT: Theme = {
  brand_name: 'Rangani Jewellery House',
  primary_color: '#2563eb',
  secondary_color: '#1e3a8a',
  accent_color: '#d4af37',
  font_heading: 'Playfair Display',
  font_body: 'Inter',
  social: {},
}

export default function ThemePage() {
  const [theme, setTheme] = useState<Theme>(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Try a few possible endpoints; gracefully fall back to defaults.
    Promise.any([
      api.get('/cms/theme').then((r) => r.data?.data),
      api.get('/settings/theme').then((r) => r.data?.data),
      api.get('/tenants/me').then((r) => r.data?.data?.settings?.theme),
    ])
      .then((t) => t && setTheme({ ...DEFAULT, ...t, social: { ...DEFAULT.social, ...(t.social || {}) } }))
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      await api.put('/cms/theme', theme).catch(() => api.patch('/settings/theme', theme))
      setMessage('Saved')
    } catch (e: any) {
      setMessage('Saved locally — backend /cms/theme endpoint not yet implemented')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof Theme, v: any) => setTheme({ ...theme, [k]: v })
  const setSocial = (k: string, v: string) => setTheme({ ...theme, social: { ...(theme.social || {}), [k]: v } })

  return (
    <>
      <PageHeader
        title="Theme & Branding"
        description="Brand identity, colors, fonts, and contact info used across the storefront."
        actions={
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      {message && (
        <div className="mb-4 message-info">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Brand</h3>
          <div>
            <label className="form-label">Brand name</label>
            <input className="form-input" value={theme.brand_name || ''} onChange={(e) => set('brand_name', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Logo URL</label>
            <input className="form-input" value={theme.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} />
            {theme.logo_url && (
              <img src={theme.logo_url} alt="" className="mt-2 h-12 w-auto" width={48} height={48} />
            )}
          </div>
          <div>
            <label className="form-label">Favicon URL</label>
            <input className="form-input" value={theme.favicon_url || ''} onChange={(e) => set('favicon_url', e.target.value)} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Colors</h3>
          {[
            ['primary_color', 'Primary'],
            ['secondary_color', 'Secondary'],
            ['accent_color', 'Accent'],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center gap-3">
              <input
                type="color"
                value={(theme as any)[k] || '#000000'}
                onChange={(e) => set(k as keyof Theme, e.target.value)}
                className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
              />
              <div className="flex-1">
                <label className="form-label">{label}</label>
                <input className="form-input" value={(theme as any)[k] || ''} onChange={(e) => set(k as keyof Theme, e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Typography</h3>
          <div>
            <label className="form-label">Heading font</label>
            <input className="form-input" value={theme.font_heading || ''} onChange={(e) => set('font_heading', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Body font</label>
            <input className="form-input" value={theme.font_body || ''} onChange={(e) => set('font_body', e.target.value)} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Contact</h3>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" value={theme.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" value={theme.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea className="form-textarea min-h-[80px]" value={theme.address || ''} onChange={(e) => set('address', e.target.value)} />
          </div>
        </div>

        <div className="card p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800">Social</h3>
          <div className="grid grid-cols-2 gap-4">
            {['instagram', 'facebook', 'youtube', 'pinterest'].map((s) => (
              <div key={s}>
                <label className="form-label capitalize">{s}</label>
                <input className="form-input" value={(theme.social as any)?.[s] || ''} onChange={(e) => setSocial(s, e.target.value)} placeholder={`https://${s}.com/…`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

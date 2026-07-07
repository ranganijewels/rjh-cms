'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth'
import BrandMark from '@/components/BrandMark'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      window.location.href = redirect
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <BrandMark
            size={64}
            rounded="rounded-2xl"
            className="mx-auto mb-4 shadow-lg text-2xl"
          />
          <h1 className="text-2xl font-bold text-slate-900">Rangani Jewellery House</h1>
          <p className="text-slate-500 text-sm mt-1">CMS — Content Studio</p>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            Sign in to manage content
          </h2>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ranganijewellery.com"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Rangani Jewellery House
        </p>
      </div>
    </div>
  )
}

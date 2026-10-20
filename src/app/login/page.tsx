'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { signIn } from '@/lib/auth'
import BrandMark from '@/components/BrandMark'

// useSearchParams() requires a Suspense boundary during static prerendering
// (Next.js App Router build fails otherwise: "missing Suspense boundary").
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — desktop only. The house photo sits under a navy scrim so
          the inverted wordmark and tagline stay legible. */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-navy p-12">
        <img
          src="/images/login-banner.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/75 to-brand-navy/45" />

        <div className="relative">
          <BrandMark variant="wordmark-inverted" width={220} />
        </div>

        <div className="relative max-w-md">
          <div className="h-px w-12 bg-brand-gold mb-6" />
          <h2 className="text-3xl font-semibold leading-snug tracking-tight text-white">
            Fine jewelry, crafted with intention.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Content Studio lets you manage everything the storefront shows — pages,
            banners, navigation, blog, FAQs and promotions.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          {/* On small screens the brand panel is hidden, so the wordmark moves up here. */}
          <div className="mb-10 flex flex-col items-center text-center lg:hidden">
            <BrandMark variant="wordmark" width={210} />
            <p className="mt-3 text-sm text-slate-500">CMS — Content Studio</p>
          </div>

          <div className="card p-7 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 h-px w-10 bg-brand-gold" />
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Use your Rangani admin account to manage content.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    className="form-input pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@ranganijewellery.com"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="form-input pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5"
              >
                {loading ? (
                  'Signing in…'
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {year} Rangani Jewelry House
          </p>
        </div>
      </main>
    </div>
  )
}

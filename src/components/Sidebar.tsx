'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { signOut, currentUserFromToken } from '@/lib/auth'
import BrandMark from '@/components/BrandMark'
import { navSections } from '@/lib/nav'
import { CommandTrigger } from './CommandPalette'

// Shown in the footer as a guard against editing the wrong environment.
const API_HOST = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1')
  .replace(/^https?:\/\//, '')
  .split('/')[0]
const IS_LIVE_API = API_HOST.includes('ranganijewelry.com')

interface Props {
  /** `drawer` is the mobile slide-over variant: never collapsed, closes on navigate. */
  variant?: 'desktop' | 'drawer'
  onNavigate?: () => void
}

function initials(user: { email?: string; name?: string }) {
  const source = (user.name || user.email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

export default function Sidebar({ variant = 'desktop', onNavigate }: Props) {
  const path = usePathname()
  const isDrawer = variant === 'drawer'
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [user, setUser] = useState<{ email?: string; name?: string; role?: string } | null>(null)
  const activeRef = useRef<HTMLAnchorElement | null>(null)
  const asideRef = useRef<HTMLElement | null>(null)

  // Restore the collapse preference after mount — the server always renders
  // expanded, so reading storage during render would mismatch hydration.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('cms_sidebar_collapsed') === '1')
    } catch {}
  }, [])

  // The nav scrolls independently of the page, so deep routes (e.g. the four
  // inboxes) can leave the active link below the fold — keep it in view.
  // Re-run after the identity footer renders or the rail collapses, since both
  // change how much room the list has.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [path, user, collapsed])

  // Identity comes from the JWT already in the cookie (no extra request).
  useEffect(() => {
    setUser(currentUserFromToken())
  }, [])

  // Keyboard users land in the drawer when it opens, not behind it.
  useEffect(() => {
    if (isDrawer) asideRef.current?.focus()
  }, [isDrawer])

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('cms_sidebar_collapsed', next ? '1' : '0')
      } catch {}
      return next
    })
  }

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      window.location.href = '/login'
    } catch {
      setSigningOut(false)
    }
  }

  const railCollapsed = collapsed && !isDrawer

  return (
    <aside
      ref={asideRef}
      tabIndex={isDrawer ? -1 : undefined}
      aria-label="Sidebar"
      className={`group ${
        railCollapsed ? 'w-16' : 'w-64'
      } flex flex-col border-r border-slate-200 bg-white outline-none transition-all duration-200 ${
        isDrawer ? 'h-full' : 'sticky top-0 h-screen'
      }`}
    >
      <div
        className={`relative flex items-center justify-between gap-2 border-b border-slate-200 py-3.5 ${
          railCollapsed ? 'justify-center px-2' : 'px-3'
        }`}
      >
        {railCollapsed ? (
          // The wide wordmark is illegible in the 64px rail, so it falls back
          // to the RJ monogram there.
          <BrandMark size={32} className="shrink-0 text-xs" />
        ) : (
          <BrandMark variant="wordmark" width={124} className="shrink-0" />
        )}

        <div className="flex items-center gap-0.5">
          {!railCollapsed && !isDrawer && <CommandTrigger className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition" />}
          {!isDrawer &&
            (railCollapsed ? (
              // Keep the 64px rail clean: the expander appears on hover/focus.
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                className="absolute right-1 top-3 p-1 rounded-md text-slate-500 opacity-0 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            ))}
          {isDrawer && (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="p-1.5 rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {/* Gold hairline carried over from the login screen's brand panel. */}
      <div className="h-px bg-brand-gold/70 shrink-0" />

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((sec) => (
          <div key={sec.label}>
            {!railCollapsed && (
              <div className="px-2 mb-2 text-xs2 font-semibold uppercase tracking-wider text-slate-500">
                {sec.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {sec.items.map((it) => {
                const active = path === it.href || path?.startsWith(it.href + '/')
                const Icon = it.icon
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      ref={active ? activeRef : undefined}
                      onClick={onNavigate}
                      title={railCollapsed ? it.label : undefined}
                      aria-label={railCollapsed ? it.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                        railCollapsed ? 'justify-center' : ''
                      } ${
                        active
                          ? 'bg-brand-navy font-medium text-white shadow-[0_1px_2px_rgba(11,20,36,0.2)]'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {/* Gold marker on the active item — echoes the login rule. */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-gold"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {!railCollapsed && <span>{it.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-200 p-3">
        {user && (
          <div
            className={`flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2 ${
              railCollapsed ? 'justify-center px-1' : ''
            }`}
            title={railCollapsed ? (user.name || user.email) + (user.role ? ` · ${user.role}` : '') : undefined}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-semibold text-white"
            >
              {initials(user)}
            </span>
            {!railCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-slate-800">
                  {user.name || user.email}
                </span>
                {user.role && (
                  <span className="block truncate text-[11px] capitalize text-slate-500">
                    {user.role}
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={signingOut}
          aria-busy={signingOut}
          title={railCollapsed ? 'Sign out' : undefined}
          aria-label={railCollapsed ? 'Sign out' : undefined}
          className={`btn-ghost w-full ${railCollapsed ? 'justify-center px-2' : 'justify-start'} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!railCollapsed && <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>

        {!railCollapsed && (
          <div className="px-1">
            <span
              className={`badge !px-2 !py-0.5 !text-[10px] ${
                IS_LIVE_API ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
              title={`CMS is talking to ${API_HOST}`}
            >
              {IS_LIVE_API ? 'Live API' : `Local · ${API_HOST}`}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}

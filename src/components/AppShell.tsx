'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import Sidebar from './Sidebar'
import BrandMark from '@/components/BrandMark'
import { CommandPaletteProvider, useCommandPalette } from './CommandPalette'

/**
 * Frame around every authenticated screen: skip link, desktop sidebar, a
 * mobile top bar + slide-over drawer (the sidebar used to be permanently
 * pinned and was unusable below lg), and the shared main container.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <ShellBody>{children}</ShellBody>
    </CommandPaletteProvider>
  )
}

function ShellBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { open: openCommand } = useCommandPalette()

  // Any route change closes the drawer — it sits on top of the page the user
  // just navigated to.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // While the drawer is open: lock background scroll and allow Escape to close.
  useEffect(() => {
    if (!drawerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen])

  return (
    <>
      {/* WCAG 2.4.1 — first focusable element on every page. */}
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Mobile top bar — replaces the pinned sidebar below lg. */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="-ml-1 p-1.5 rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BrandMark variant="wordmark" width={118} className="shrink-0" />
        <button
          type="button"
          onClick={openCommand}
          aria-label="Search pages (Command K)"
          className="-mr-1 ml-auto p-1.5 rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Search className="h-5 w-5" />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
          />
          <div className="absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] shadow-2xl">
            <Sidebar variant="drawer" onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </>
  )
}

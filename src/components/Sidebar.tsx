'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  HelpCircle,
  Menu as MenuIcon,
  LayoutTemplate,
  Tag,
  Inbox,
  Palette,
  Image as ImageIcon,
  Home as HomeIcon,
  Wand2,
  Gem,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import BrandMark from '@/components/BrandMark'

const sections = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Storefront Content',
    items: [
      { href: '/homepage', icon: HomeIcon, label: 'Homepage' },
      { href: '/customize', icon: Wand2, label: 'Customize Page' },
      { href: '/about', icon: FileText, label: 'About Page' },
      { href: '/pdp', icon: Gem, label: 'Product Detail' },
      { href: '/banners', icon: ImageIcon, label: 'Banners & Hero' },
      { href: '/sections', icon: LayoutTemplate, label: 'Page Sections' },
      { href: '/navigation', icon: MenuIcon, label: 'Navigation Menu' },
      { href: '/theme', icon: Palette, label: 'Theme & Branding' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/pages', icon: FileText, label: 'Static Pages' },
      { href: '/blog', icon: Newspaper, label: 'Blog Posts' },
      { href: '/faqs', icon: HelpCircle, label: 'FAQs' },
    ],
  },
  {
    label: 'Promotions',
    items: [
      { href: '/coupons', icon: Tag, label: 'Coupons & Discounts' },
    ],
  },
  {
    label: 'Customer Inbox',
    items: [
      { href: '/forms/custom-requests', icon: Inbox, label: 'Custom Requests' },
      { href: '/forms/resize-repair', icon: Inbox, label: 'Resize & Repair' },
      { href: '/forms/appointments', icon: Inbox, label: 'Appointments' },
      { href: '/forms/contact', icon: Inbox, label: 'Contact Form' },
    ],
  },
]

export default function Sidebar() {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

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

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 transition-all duration-200`}
    >
      <div className="px-3 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark size={36} className="shrink-0 text-sm" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-sm leading-tight truncate">RJ House</div>
              <div className="text-xs text-slate-500 truncate">CMS Studio</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 hidden lg:inline-flex"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((sec) => (
          <div key={sec.label}>
            {!collapsed && (
              <div className="px-2 mb-2 text-xs2 font-semibold text-slate-500 uppercase tracking-wider">
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
                      title={collapsed ? it.label : undefined}
                      aria-label={collapsed ? it.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        active
                          ? 'bg-brand-500/10 text-brand-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{it.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          disabled={signingOut}
          aria-busy={signingOut}
          title={collapsed ? 'Sign out' : undefined}
          aria-label={collapsed ? 'Sign out' : undefined}
          className={`w-full btn-ghost ${collapsed ? 'justify-center' : 'justify-start'} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>
    </aside>
  )
}

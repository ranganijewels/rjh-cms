import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Home,
  Wand2,
  FileText,
  Gem,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Files,
  Menu as MenuIcon,
  LayoutGrid,
  Palette,
  BadgeDollarSign,
  Newspaper,
  HelpCircle,
  Tag,
  Inbox,
  Scissors,
  CalendarClock,
  Mail,
} from 'lucide-react'

// Single source of truth for the CMS navigation. The sidebar, the mobile
// drawer and the ⌘K command palette all render from this list, so adding a
// route here shows up everywhere (including palette keyword search).
export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Extra search terms for the command palette ("promo code", "booking"…). */
  keywords?: string[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: ['home', 'stats', 'overview', 'content studio'] },
    ],
  },
  {
    label: 'Site Pages',
    items: [
      { href: '/homepage', label: 'Homepage', icon: Home, keywords: ['hero', 'landing', 'home'] },
      { href: '/customize', label: 'Customize Page', icon: Wand2, keywords: ['layout', 'design', 'styles'] },
      { href: '/about', label: 'About Page', icon: FileText, keywords: ['story', 'brand', 'craftsmanship'] },
      { href: '/pdp', label: 'Product Detail', icon: Gem, keywords: ['pdp', 'product', 'jewelry'] },
      { href: '/sections', label: 'Page Sections', icon: LayoutTemplate, keywords: ['blocks', 'composer', 'modules'] },
      { href: '/pages', label: 'Static Pages', icon: Files, keywords: ['legal', 'terms', 'policy'] },
    ],
  },
  {
    label: 'Media & Banners',
    items: [
      { href: '/banners', label: 'Banners & Hero', icon: ImageIcon, keywords: ['carousel', 'slider', 'promo', 'image'] },
      { href: '/instagram', label: 'Instagram Reels', icon: Film, keywords: ['reels', 'social', 'video'] },
    ],
  },
  {
    label: 'Site Setup',
    items: [
      { href: '/navigation', label: 'Navigation Menu', icon: MenuIcon, keywords: ['nav', 'menu', 'links'] },
      { href: '/mega-menu', label: 'Mega Menu', icon: LayoutGrid, keywords: ['dropdown', 'menu'] },
      { href: '/theme', label: 'Theme & Branding', icon: Palette, keywords: ['colors', 'logo', 'fonts'] },
      { href: '/pricing', label: 'Pricing', icon: BadgeDollarSign, keywords: ['price', 'settings'] },
    ],
  },
  {
    label: 'Editorial & Promotions',
    items: [
      { href: '/blog', label: 'Blog Posts', icon: Newspaper, keywords: ['articles', 'posts', 'editorial'] },
      { href: '/faqs', label: 'FAQs', icon: HelpCircle, keywords: ['questions', 'answers', 'support'] },
      { href: '/coupons', label: 'Coupons & Discounts', icon: Tag, keywords: ['promo code', 'discount', 'sale'] },
    ],
  },
  {
    label: 'Support Inbox',
    items: [
      { href: '/forms/custom-requests', label: 'Custom Requests', icon: Inbox, keywords: ['bespoke', 'enquiry'] },
      { href: '/forms/resize-repair', label: 'Resize & Repair', icon: Scissors, keywords: ['ring size', 'repair'] },
      { href: '/forms/appointments', label: 'Appointments', icon: CalendarClock, keywords: ['booking', 'visit', 'store'] },
      { href: '/forms/contact', label: 'Contact Form', icon: Mail, keywords: ['enquiry', 'message', 'contact'] },
    ],
  },
]

import type { Metadata } from 'next'
import { Cabin } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

// Cabin is the CMS typeface: a humanist sans that stays legible at the small
// sizes the dense content tables are full of, while keeping enough character
// for headings. The variable font is used, so the whole weight range comes
// down in a single file.
const cabin = Cabin({
  variable: '--font-cabin',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Rangani CMS Studio',
  description: 'Content management for Rangani Jewelry House',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={cabin.variable}>
        {/* Toasts live above the app shell so feedback survives route changes. */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}

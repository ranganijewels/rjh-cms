import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RJ House CMS',
  description: 'Content management for Rangani Jewellery House',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Static assets that must stay reachable without a session: framework chunks,
// the brand logos in /public/brand, the app icon (app/icon.svg is served under
// /icon) and the API proxy.
const PUBLIC = ['/login', '/_next', '/favicon', '/icon', '/brand', '/images', '/api']

// Redirects must use the public address the visitor used (nginx passes it in
// Host / X-Forwarded-*). req.url carries the app's internal 127.0.0.1 bind address.
function publicUrl(req: NextRequest, path: string) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return new URL(path, `${proto}://${host}`)
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()
  // Presence check only: any value passes here. The cookie is now the
  // HttpOnly one set by the /api/auth/* BFF routes (JS can't touch it);
  // real validation happens upstream on every API call, and a dead session
  // cookie is cleared on its next failed refresh.
  const refresh = req.cookies.get('cms_refresh_token')?.value
  if (!refresh) {
    const url = publicUrl(req, '/login')
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

import { NextRequest, NextResponse } from 'next/server'

// Server-side auth proxy (BFF). The upstream API is unchanged — it still
// hands the refresh token back in the JSON body — but the exchange now
// happens here: the browser JS never sees the refresh token, it lives in an
// HttpOnly cookie only this server and src/middleware.ts can read. XSS on
// the CMS origin can steal at most the short-lived access token.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID || '00000000-0000-0000-0000-000000000001'

export const REFRESH_COOKIE = 'cms_refresh_token'
const REFRESH_MAX_AGE = 604800 // 7 days — same window the old JS-set cookie used

// Honour the scheme the visitor actually used (nginx terminates TLS and
// passes X-Forwarded-Proto; req.nextUrl is the internal bind address).
// Secure cookies are rejected over plain http, so localhost dev stays as-is.
function isHttps(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (proto) return proto === 'https'
  return req.nextUrl.protocol === 'https:'
}

function cookieOptions(req: NextRequest) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: REFRESH_MAX_AGE,
    secure: isHttps(req),
  }
}

export function setRefreshCookie(res: NextResponse, req: NextRequest, token: string) {
  res.cookies.set(REFRESH_COOKIE, token, cookieOptions(req))
}

export function clearRefreshCookie(res: NextResponse, req: NextRequest) {
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(req), maxAge: 0 })
}

// Forward an auth call to the API, preserving the caller's IP and user agent —
// login throttling and the audit log key off them.
export async function callApi(
  req: NextRequest,
  path: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<{ ok: boolean; status: number; json: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
    ...extraHeaders,
  }
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) headers['x-forwarded-for'] = fwd
  const ua = req.headers.get('user-agent')
  if (ua) headers['user-agent'] = ua

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 502, json: { message: 'Auth service unreachable' } }
  }
  const json = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, json }
}

// The API wraps payloads as { data: {...} }; tolerate the unwrapped shape too.
export const payloadOf = (json: any) => json?.data ?? json

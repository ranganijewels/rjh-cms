import { NextRequest, NextResponse } from 'next/server'
import {
  REFRESH_COOKIE,
  callApi,
  clearRefreshCookie,
  payloadOf,
  setRefreshCookie,
} from '@/lib/authProxy'

// POST /api/auth/refresh — reads the HttpOnly refresh cookie server-side and
// rotates it upstream. JavaScript never handles the refresh token. The new
// access token goes back to the caller; the rotated refresh token only lands
// in the replacement cookie.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(REFRESH_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ message: 'No active session' }, { status: 401 })
  }

  const up = await callApi(req, '/auth/refresh', { refreshToken: token })
  if (up.status === 502) {
    // Upstream unreachable — transient, keep the session cookie intact.
    return NextResponse.json(up.json, { status: 502 })
  }

  const payload = payloadOf(up.json)
  if (!up.ok || !payload?.accessToken) {
    // Rejected upstream (expired / revoked / reuse detection) — clear the
    // cookie too so the middleware gate closes instead of letting a dead
    // session shell through.
    const res = NextResponse.json(up.json ?? { message: 'Session expired' }, {
      status: up.status || 401,
    })
    clearRefreshCookie(res, req)
    return res
  }

  const res = NextResponse.json({ data: { accessToken: payload.accessToken } })
  if (payload.refreshToken) setRefreshCookie(res, req, payload.refreshToken) // rotation
  return res
}

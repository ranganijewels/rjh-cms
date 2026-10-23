import { NextRequest, NextResponse } from 'next/server'
import { callApi, payloadOf, setRefreshCookie } from '@/lib/authProxy'

// POST /api/auth/login — proxies credentials to the API, gives the client the
// short-lived access token, and keeps the refresh token in an HttpOnly cookie.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const up = await callApi(req, '/auth/login', body)
  const payload = payloadOf(up.json)
  if (!up.ok || !payload?.accessToken) {
    // Pass API errors straight through — the login form reads .message.
    return NextResponse.json(up.json ?? { message: 'Login failed' }, {
      status: up.status || 500,
    })
  }

  const res = NextResponse.json({
    data: { accessToken: payload.accessToken, user: payload.user },
  })
  if (payload.refreshToken) setRefreshCookie(res, req, payload.refreshToken)
  return res
}

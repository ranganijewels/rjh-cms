import { NextRequest, NextResponse } from 'next/server'
import { REFRESH_COOKIE, callApi, clearRefreshCookie } from '@/lib/authProxy'

// POST /api/auth/logout — revokes the refresh token upstream (best effort)
// and always clears the HttpOnly cookie. JavaScript cannot clear an HttpOnly
// cookie itself, so this route is what actually closes the middleware gate.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(REFRESH_COOKIE)?.value
  const auth = req.headers.get('authorization')

  if (token && auth) {
    // Ignore the outcome: logout must never soft-brick the client. An expired
    // access token upstream just means the session is already over.
    await callApi(req, '/auth/logout', { refreshToken: token }, { Authorization: auth })
  }

  const res = NextResponse.json({ data: { message: 'Logged out' } })
  clearRefreshCookie(res, req)
  return res
}

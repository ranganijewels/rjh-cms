import axios from 'axios'
import api, { getAccessToken, readCookie, setAccessToken } from './api'

export interface CmsUser {
  id: string
  email: string
  role: string
  fullName?: string
  tenantId: string
}

export async function signIn(email: string, password: string) {
  // Same-origin BFF: /api/auth/login forwards to the API and stores the
  // refresh token in an HttpOnly cookie — the browser script only ever gets
  // the short-lived access token back.
  const { data } = await axios.post('/api/auth/login', { email, password })
  const { accessToken, user } = data.data
  setAccessToken(accessToken)
  if (typeof window !== 'undefined') {
    // The access cookie stays JS-readable on purpose: it feeds the sidebar
    // identity badge and survives reloads for 15 min. The long-lived secret
    // (refresh) lives only in the HttpOnly cookie now.
    document.cookie = `cms_access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`
  }
  return user as CmsUser
}

export async function signOut() {
  try {
    // The BFF route reads the refresh token from the HttpOnly cookie itself;
    // we only forward the access token so the API can verify the caller.
    const token = getAccessToken() || readCookie('cms_access_token')
    await axios.post('/api/auth/logout', {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {}
  setAccessToken(null)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cms_refresh_token') // legacy pre-BFF copy
    document.cookie = 'cms_access_token=; path=/; max-age=0'
    // The HttpOnly refresh cookie is cleared server-side by /api/auth/logout.
  }
}

export async function getMe(): Promise<CmsUser | null> {
  try {
    const { data } = await api.get('/auth/me')
    return data.data as CmsUser
  } catch {
    return null
  }
}

// Read the identity out of the access token already sitting in the cookie —
// no network call, so the shell can show who is signed in without adding a
// request (or a 401) to every page load. Returns null when the token is
// missing, malformed or not a JWT; callers should hide the identity block.
export function currentUserFromToken(): { email?: string; name?: string; role?: string } | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(^|; )cms_access_token=([^;]+)/)
  if (!match) return null
  try {
    const payload = match[2].split('.')[1]
    if (!payload) return null
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    // atob only handles Latin-1; percent-encode each byte so multi-byte
    // UTF-8 (names) survives JSON.parse.
    const json = decodeURIComponent(
      Array.from(atob(b64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    const claims = JSON.parse(json)
    if (!claims || typeof claims !== 'object') return null
    return {
      email: typeof claims.email === 'string' ? claims.email : undefined,
      name:
        (typeof claims.fullName === 'string' && claims.fullName) ||
        (typeof claims.name === 'string' && claims.name) ||
        (typeof claims.username === 'string' && claims.username) ||
        undefined,
      role: typeof claims.role === 'string' ? claims.role : undefined,
    }
  } catch {
    return null
  }
}

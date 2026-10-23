import axios, { AxiosInstance } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID || '00000000-0000-0000-0000-000000000001'

let memoryToken: string | null = null
export const setAccessToken = (t: string | null) => {
  memoryToken = t
}
export const getAccessToken = () => memoryToken

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

// Migration: the refresh token used to live in localStorage (pre-BFF). The
// HttpOnly cookie managed by /api/auth/* is the source of truth now — drop
// any legacy copy so scripts can't read it. Existing sessions keep working:
// the cookie was always set alongside the localStorage entry at login.
if (typeof window !== 'undefined') localStorage.removeItem('cms_refresh_token')

// Refresh the CMS access token through the same-origin BFF
// (/api/auth/refresh), which reads the HttpOnly refresh cookie server-side
// and rotates it upstream — JS never touches the refresh token. Returns the
// new access token (and updates memory + the short-lived access cookie),
// or null if refresh isn't possible.
// Exported so raw fetch() callers (file uploads) can refresh like axios does.
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    // Bare axios (not the `api` instance) so a failed refresh can't re-enter
    // the 401 interceptor below and loop.
    const { data } = await axios.post('/api/auth/refresh')
    const newAccess = data?.data?.accessToken
    if (!newAccess) return null
    setAccessToken(newAccess)
    document.cookie = `cms_access_token=${newAccess}; path=/; max-age=900; SameSite=Lax`
    return newAccess
  } catch {
    return null
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
  },
})

api.interceptors.request.use((config) => {
  const token = memoryToken || readCookie('cms_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Convert TOP-LEVEL snake_case keys in the request body to camelCase for NestJS.
  // Nested objects (e.g. section `content`) are left untouched so storefront keys survive.
  if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
    const snakeToCamel = (k: string) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    const out: any = {}
    for (const k of Object.keys(config.data)) {
      const camel = snakeToCamel(k)
      if (!(camel in out)) out[camel] = (config.data as any)[k]
    }
    config.data = out
  }
  return config
})

// NestJS returns camelCase; CMS components also read snake_case (is_active,
// is_published, cover_image, seo_title...). Add snake_case aliases on every object.
function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase()).replace(/^_/, '')
}
function addSnakeAliases(value: any): any {
  if (Array.isArray(value)) return value.map(addSnakeAliases)
  if (value && typeof value === 'object') {
    const out: any = { ...value }
    for (const k of Object.keys(value)) {
      out[k] = addSnakeAliases(value[k])
      const snake = camelToSnake(k)
      if (snake !== k && !(snake in out)) out[snake] = out[k]
    }
    return out
  }
  return value
}

api.interceptors.response.use(
  (response) => {
    if (response?.data?.data !== undefined) {
      response.data.data = addSnakeAliases(response.data.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Same-origin BFF refresh — reads the HttpOnly cookie server-side.
        const newAccess = await refreshAccessToken()
        if (!newAccess) throw new Error('Refresh failed')
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch {
        // Hard logout: drop local credentials and close the middleware gate
        // (the BFF logout is what clears the HttpOnly cookie — JS can't).
        setAccessToken(null)
        if (typeof window !== 'undefined') {
          document.cookie = 'cms_access_token=; path=/; max-age=0'
          axios.post('/api/auth/logout').catch(() => {})
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api

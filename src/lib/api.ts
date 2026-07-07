import axios, { AxiosInstance } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID || '00000000-0000-0000-0000-000000000001'

let memoryToken: string | null = null
export const setAccessToken = (t: string | null) => {
  memoryToken = t
}
export const getAccessToken = () => memoryToken

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

// Refresh the CMS access token via the refresh token. Returns the new access
// token (and updates memory + cookies), or null if refresh isn't possible.
// Exported so raw fetch() callers (file uploads) can refresh like axios does.
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('cms_refresh_token') : null
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
    const newAccess = data.data.accessToken
    const newRefresh = data.data.refreshToken
    setAccessToken(newAccess)
    if (typeof window !== 'undefined') {
      if (newRefresh) localStorage.setItem('cms_refresh_token', newRefresh)
      document.cookie = `cms_access_token=${newAccess}; path=/; max-age=900; SameSite=Lax`
      if (newRefresh) {
        document.cookie = `cms_refresh_token=${newRefresh}; path=/; max-age=604800; SameSite=Lax`
      }
    }
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
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('cms_refresh_token')
            : null
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        })
        const newAccess = data.data.accessToken
        const newRefresh = data.data.refreshToken
        setAccessToken(newAccess)
        if (typeof window !== 'undefined') {
          if (newRefresh) localStorage.setItem('cms_refresh_token', newRefresh)
          document.cookie = `cms_access_token=${newAccess}; path=/; max-age=900; SameSite=Lax`
          if (newRefresh) {
            document.cookie = `cms_refresh_token=${newRefresh}; path=/; max-age=604800; SameSite=Lax`
          }
        }
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch {
        setAccessToken(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cms_refresh_token')
          document.cookie = 'cms_access_token=; path=/; max-age=0'
          document.cookie = 'cms_refresh_token=; path=/; max-age=0'
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

import { getAccessToken, refreshAccessToken } from './api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
const TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID || '00000000-0000-0000-0000-000000000001'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

export const isVideoUrl = (u: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(u || '')

// One multipart POST with a given bearer token. FormData must NOT get a JSON
// content-type — the browser sets the multipart boundary itself.
async function postUpload(file: File, prefix: string, token: string | null): Promise<Response> {
  const form = new FormData()
  form.append('file', file, file.name)
  return fetch(
    `${API_BASE}/media/upload?bucket=cms-media&prefix=${encodeURIComponent(prefix)}`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-id': TENANT_ID,
      },
      body: form,
    },
  )
}

/**
 * Upload a file to NestJS media storage; returns the public URL.
 * Uses fetch directly (axios would JSON-encode the body). Because this bypasses
 * the axios auto-refresh, on a 401 (the 15-min access token expired) we refresh
 * the token ourselves and retry once — otherwise long-open editor tabs fail
 * with "Invalid or expired token".
 */
export async function uploadMedia(file: File, prefix = 'cms'): Promise<string> {
  let token = getAccessToken() || readCookie('cms_access_token')
  let res = await postUpload(file, prefix, token)

  if (res.status === 401) {
    const fresh = await refreshAccessToken()
    if (fresh) {
      res = await postUpload(file, prefix, fresh)
    }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Your session expired — please refresh the page and sign in again.')
    }
    throw new Error(data?.message || `Upload failed (${res.status})`)
  }
  const url = data?.url ?? data?.data?.url
  if (!url) throw new Error('Upload succeeded but no URL returned')
  return url
}

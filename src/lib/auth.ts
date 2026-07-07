import api, { setAccessToken } from './api'

export interface CmsUser {
  id: string
  email: string
  role: string
  fullName?: string
  tenantId: string
}

export async function signIn(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  const { accessToken, refreshToken, user } = data.data
  setAccessToken(accessToken)
  if (typeof window !== 'undefined') {
    localStorage.setItem('cms_refresh_token', refreshToken)
    document.cookie = `cms_access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`
    document.cookie = `cms_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`
  }
  return user as CmsUser
}

export async function signOut() {
  try {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('cms_refresh_token')
        : null
    await api.post('/auth/logout', { refreshToken })
  } catch {}
  setAccessToken(null)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cms_refresh_token')
    document.cookie = 'cms_access_token=; path=/; max-age=0'
    document.cookie = 'cms_refresh_token=; path=/; max-age=0'
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

// frontend/src/lib/auth.ts
import { z } from 'zod'

export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ---------- Types ----------
export type UserPublic = {
  id: number
  email: string
  username: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number // seconds
  user: UserPublic
}

export type LoginRequest = {
  email_or_username: string
  password: string
}

export type RegisterRequest = {
  email: string
  username: string
  password: string
}

export type ProfileUpdate = Partial<{
  email: string
  username: string
  password: string
}>

export type ChatHistoryItem = {
  id: number
  question: string
  answer: string
  sources?: any
  confidence?: number
  is_bookmarked: boolean
  created_at: string
}

// ---------- Token storage ----------
type StoredTokens = {
  access_token: string
  refresh_token: string
  // ms timestamp when access token expires
  expires_at: number
}

const TOKEN_KEY = 'ptl_tokens'

export function getStoredTokens(): StoredTokens | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

export function setStoredTokens(res: TokenResponse) {
  const expires_at = Date.now() + res.expires_in * 1000
  const data: StoredTokens = {
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    expires_at,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAccessExpired(marginSec = 30): boolean {
  const t = getStoredTokens()
  if (!t) return true
  return Date.now() > (t.expires_at - marginSec * 1000)
}

// ---------- Low-level fetch with Authorization + auto refresh ----------
async function doRefresh(): Promise<TokenResponse> {
  const tokens = getStoredTokens()
  if (!tokens?.refresh_token) throw new Error('No refresh token')
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  })
  if (!res.ok) {
    clearStoredTokens()
    throw new Error('Refresh failed')
  }
  const data: TokenResponse = await res.json()
  setStoredTokens(data)
  return data
}

function buildAuthHeaders(init?: RequestInit, token?: string) {
  const headers = new Headers(init?.headers || undefined)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

export async function authorizedRequest(input: string, init?: RequestInit, _retry = false): Promise<Response> {
  let tokens = getStoredTokens()
  // Try preemptive refresh if token is expired/nearly
  if (tokens && isAccessExpired()) {
    try {
      const refreshed = await doRefresh()
      tokens = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: Date.now() + refreshed.expires_in * 1000,
      }
    } catch {
      // proceed without auth (public endpoints) or fail later
      tokens = null
    }
  }

  const res = await fetch(input, {
    ...init,
    headers: buildAuthHeaders(init, tokens?.access_token),
  })

  if (res.status === 401 && !_retry && getStoredTokens()?.refresh_token) {
    try {
      await doRefresh()
      const retryTokens = getStoredTokens()
      return fetch(input, {
        ...init,
        headers: buildAuthHeaders(init, retryTokens?.access_token),
      })
    } catch {
      // fallthrough
    }
  }

  return res
}

// ---------- Auth API helpers (used by AuthContext) ----------
export async function authLogin(payload: LoginRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.text()) || 'Login failed')
  const data: TokenResponse = await res.json()
  setStoredTokens(data)
  return data
}

export async function authRegister(payload: RegisterRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.text()) || 'Register failed')
  const data: TokenResponse = await res.json()
  setStoredTokens(data)
  return data
}

export async function authMe(): Promise<UserPublic> {
  const res = await authorizedRequest(`${API_URL}/api/auth/me`, { method: 'GET' })
  if (!res.ok) throw new Error('Failed to load user')
  return res.json()
}

export async function authLogout(): Promise<void> {
  const tokens = getStoredTokens()
  if (tokens?.refresh_token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      })
    } catch {
      // ignore
    }
  }
  clearStoredTokens()
}

export async function authUpdateProfile(payload: ProfileUpdate): Promise<UserPublic> {
  const res = await authorizedRequest(`${API_URL}/api/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.text()) || 'Update failed')
  return res.json()
}

// History
export async function authGetHistory(): Promise<ChatHistoryItem[]> {
  const res = await authorizedRequest(`${API_URL}/api/auth/history`, { method: 'GET' })
  if (!res.ok) throw new Error((await res.text()) || 'Failed to get history')
  return res.json()
}

export async function authDeleteHistory(id: number): Promise<void> {
  const res = await authorizedRequest(`${API_URL}/api/auth/history/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error((await res.text()) || 'Failed to delete')
}

export async function authBookmarkHistory(id: number, is_bookmarked: boolean): Promise<void> {
  const res = await authorizedRequest(`${API_URL}/api/auth/history/${id}/bookmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_bookmarked }),
  })
  if (!res.ok) throw new Error((await res.text()) || 'Failed to bookmark')
}
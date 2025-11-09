// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  UserPublic,
  TokenResponse,
  authLogin,
  authRegister,
  authMe,
  authLogout,
  authUpdateProfile,
  getStoredTokens,
  isAccessExpired,
} from '@/lib/auth'
import { useToast } from '@/components/ui/use-toast'

type AuthContextType = {
  user: UserPublic | null
  isLoading: boolean
  isAdmin: boolean
  login: (email_or_username: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<{ email: string; username: string; password: string }>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimer = useRef<number | null>(null)
  const { toast } = useToast()

  // Schedule refresh slightly before expiry
  const scheduleRefresh = () => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current)
      refreshTimer.current = null
    }
    const tokens = getStoredTokens()
    if (!tokens) return
    const msUntil = Math.max(tokens.expires_at - Date.now() - 30_000, 5_000)
    refreshTimer.current = window.setTimeout(async () => {
      // Passive refresh: me() will refresh on demand via authorizedRequest retry
      try {
        await authMe() // keeps session warm if token valid
      } catch {
        // ignore; next API call will try refresh or fail
      } finally {
        scheduleRefresh()
      }
    }, msUntil)
  }

  useEffect(() => {
    // initial load
    const init = async () => {
      setIsLoading(true)
      try {
        if (getStoredTokens()) {
          const me = await authMe()
          setUser(me)
          scheduleRefresh()
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    init()

    // sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ptl_tokens') {
        if (e.newValue) {
          // token added/changed elsewhere
          authMe().then(setUser).catch(() => setUser(null))
          scheduleRefresh()
        } else {
          // logged out elsewhere
          setUser(null)
          if (refreshTimer.current) {
            window.clearTimeout(refreshTimer.current)
            refreshTimer.current = null
          }
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email_or_username: string, password: string) => {
    const res: TokenResponse = await authLogin({ email_or_username, password })
    setUser(res.user)
    scheduleRefresh()
    toast({ title: 'Welcome back 👋', description: `Logged in as ${res.user.username}` })
  }

  const signup = async (email: string, username: string, password: string) => {
    const res: TokenResponse = await authRegister({ email, username, password })
    setUser(res.user)
    scheduleRefresh()
    toast({ title: 'Account created 🎉', description: `Welcome, ${res.user.username}` })
  }

  const logout = async () => {
    await authLogout()
    setUser(null)
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current)
      refreshTimer.current = null
    }
    toast({ title: 'Logged out', description: 'See you soon!' })
  }

  const updateProfile = async (data: Partial<{ email: string; username: string; password: string }>) => {
    const updated = await authUpdateProfile(data)
    setUser(updated)
    toast({ title: 'Profile updated', description: 'Your changes are saved.' })
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
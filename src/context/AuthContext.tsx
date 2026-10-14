import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, setAuthToken, getAuthToken } from '../services/api'

export type UserRole = 'citizen' | 'field_reporter' | 'officer' | 'rescue_team'

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  district: string
  phone?: string
  badge_or_unit?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (usernameOrEmail: string, password: string) => Promise<User>
  register: (payload: { username: string; email: string; password: string; full_name: string; district?: string }) => Promise<User>
  logout: () => void
  hasRole: (allowedRoles: UserRole | UserRole[]) => boolean
  switchDemoRole: (role: UserRole) => Promise<User>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const DEMO_CREDENTIALS: Record<UserRole, { username: string; pass: string; label: string }> = {
  officer: {
    username: 'officer@sentinel.ner',
    pass: 'officer123',
    label: 'Officer Control Center (Officer Ananya Sharma)',
  },
  field_reporter: {
    username: 'field@sentinel.ner',
    pass: 'field123',
    label: 'Field Reporter Portal (Rohan Singh)',
  },
  rescue_team: {
    username: 'rescue@sentinel.ner',
    pass: 'rescue123',
    label: 'Rescue Operations Portal (NDRF Unit Alpha)',
  },
  citizen: {
    username: 'citizen@sentinel.ner',
    pass: 'citizen123',
    label: 'Citizen Portal (Priya Sharma)',
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verify stored token on mount
  useEffect(() => {
    async function verify() {
      const storedToken = getAuthToken()
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const res = await authApi.getMe()
        setUser(res.user)
      } catch (err) {
        console.warn('Session expired or invalid, clearing token.')
        setAuthToken(null)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const login = async (usernameOrEmail: string, password: string): Promise<User> => {
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.login(usernameOrEmail, password)
      setAuthToken(res.access_token)
      setToken(res.access_token)
      setUser(res.user)
      return res.user
    } catch (err: any) {
      setError(err.message || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload: { username: string; email: string; password: string; full_name: string; district?: string }): Promise<User> => {
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.register(payload)
      setAuthToken(res.access_token)
      setToken(res.access_token)
      setUser(res.user)
      return res.user
    } catch (err: any) {
      setError(err.message || 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    setError(null)
  }

  const hasRole = (allowedRoles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    return roles.includes(user.role)
  }

  const switchDemoRole = async (targetRole: UserRole): Promise<User> => {
    const creds = DEMO_CREDENTIALS[targetRole]
    if (!creds) throw new Error(`Unknown role ${targetRole}`)
    return await login(creds.username, creds.pass)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        hasRole,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

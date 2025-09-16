/**
 * Authentication Hook
 * Custom hook for managing authentication state and operations
 */

'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { AuthUser, LoginCredentials, RegisterCredentials, UserSession, GuestSession } from '../../lib/auth/types'
import { getOrCreateGuestSession, clearGuestSession, migrateGuestData } from '../../lib/auth/services/guest'

interface AuthContextType {
  user: AuthUser | null
  session: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  startGuestMode: () => GuestSession
  upgradeGuest: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          setSession({
            user: data.user,
            tokens: data.tokens || {},
            isAuthenticated: true,
          } as UserSession)
          return
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }

    // If no authenticated user, check for guest session
    const guestSession = getOrCreateGuestSession()
    setSession(guestSession)
    setIsLoading(false)
  }

  async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        setSession({
          user: data.user,
          tokens: data.tokens,
          isAuthenticated: true,
        } as UserSession)

        // Clear guest session on successful login
        clearGuestSession()
        return { success: true }
      } else {
        return {
          success: false,
          error: data.message || 'Login failed',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
      }
    }
  }

  async function register(credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        setSession({
          user: data.user,
          tokens: data.tokens,
          isAuthenticated: true,
        } as UserSession)

        // Migrate guest data if available
        try {
          const guestData = await migrateGuestData(data.user.id)
          // In a full implementation, we would send this data to the server
          console.log('Guest data to migrate:', guestData)
        } catch (error) {
          console.warn('Failed to migrate guest data:', error)
        }

        return { success: true }
      } else {
        return {
          success: false,
          error: data.message || 'Registration failed',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
      }
    }
  }

  async function logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setUser(null)
      // Create new guest session after logout
      const guestSession = getOrCreateGuestSession()
      setSession(guestSession)
    }
  }

  async function refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Token was refreshed successfully, verify the new token
        await checkAuthStatus()
        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  function startGuestMode(): GuestSession {
    const guestSession = getOrCreateGuestSession()
    setSession(guestSession)
    setUser(null)
    return guestSession
  }

  function upgradeGuest(): void {
    // This would typically show a registration modal or redirect
    // For now, it's a placeholder for the upgrade flow
    console.log('Guest upgrade requested')
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isGuest: !user && !!session && !session.isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    startGuestMode,
    upgradeGuest,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
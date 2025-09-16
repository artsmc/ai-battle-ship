/**
 * Authentication Types
 * Core types for user authentication, sessions, and tokens
 */

export interface AuthUser {
  id: string
  username: string
  email: string
  display_name?: string | null
  avatar_url?: string | null
  is_premium: boolean
  created_at: Date
  last_active: Date
}

export interface JWTPayload {
  userId: string
  username: string
  email: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface AuthSession {
  user: AuthUser
  tokens: AuthTokens
  isAuthenticated: true
}

export interface GuestSession {
  isAuthenticated: false
  guestId: string
  createdAt: Date
}

export type UserSession = AuthSession | GuestSession

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  tokens?: AuthTokens
  message?: string
  errors?: Record<string, string[]>
}

export interface TokenValidationResult {
  valid: boolean
  payload?: JWTPayload
  expired?: boolean
  error?: string
}

export interface PasswordResetRequest {
  email: string
  resetToken: string
  expiresAt: Date
  createdAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: {
    email: boolean
    browser: boolean
    gameUpdates: boolean
    achievements: boolean
  }
  gameSettings: {
    soundEffects: boolean
    backgroundMusic: boolean
    animationSpeed: 'slow' | 'normal' | 'fast'
    autoConfirmMoves: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowFriendRequests: boolean
    showGameHistory: boolean
  }
}

export interface AuthError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>
}

export interface AuthConfig {
  jwtSecret: string
  jwtRefreshSecret: string
  accessTokenExpiresIn: string
  refreshTokenExpiresIn: string
  bcryptSaltRounds: number
  sessionCookieName: string
  refreshCookieName: string
  cookieMaxAge: number
  cookieSecure: boolean
  cookieHttpOnly: boolean
  cookieSameSite: 'strict' | 'lax' | 'none'
}
/**
 * Authentication Configuration
 * Environment variables and configuration for auth system
 */

import { AuthConfig } from './types'

export const AUTH_CONFIG: AuthConfig = {
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'battleship-dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'battleship-refresh-dev-secret-change-in-production',
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Password Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),

  // Cookie Configuration
  sessionCookieName: 'battleship_session',
  refreshCookieName: 'battleship_refresh',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieHttpOnly: true,
  cookieSameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
}

// Validation for required environment variables
export function validateAuthConfig(): void {
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET']

  if (process.env.NODE_ENV === 'production') {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables for production: ${missingVars.join(', ')}`
      )
    }
  }
}

// Constants
export const TOKEN_TYPES = {
  ACCESS: 'access' as const,
  REFRESH: 'refresh' as const,
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
} as const
/**
 * JWT Token Management
 * Utilities for creating, verifying, and managing JWT tokens
 */

import jwt from 'jsonwebtoken'
import { AUTH_CONFIG, TOKEN_TYPES } from '../config'
import { JWTPayload, TokenValidationResult, AuthTokens } from '../types'

/**
 * Generate an access token for a user
 */
export function generateAccessToken(userId: string, username: string, email: string): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    username,
    email,
    type: TOKEN_TYPES.ACCESS,
  }

  return jwt.sign(payload, AUTH_CONFIG.jwtSecret, {
    expiresIn: AUTH_CONFIG.accessTokenExpiresIn,
    issuer: 'battleship-naval-strategy',
    audience: 'battleship-users',
  })
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(userId: string, username: string, email: string): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    username,
    email,
    type: TOKEN_TYPES.REFRESH,
  }

  return jwt.sign(payload, AUTH_CONFIG.jwtRefreshSecret, {
    expiresIn: AUTH_CONFIG.refreshTokenExpiresIn,
    issuer: 'battleship-naval-strategy',
    audience: 'battleship-users',
  })
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, username: string, email: string): AuthTokens {
  const accessToken = generateAccessToken(userId, username, email)
  const refreshToken = generateRefreshToken(userId, username, email)

  // Calculate expiration dates
  const accessTokenExpiresAt = new Date()
  accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + 15) // 15 minutes

  const refreshTokenExpiresAt = new Date()
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7) // 7 days

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  }
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): TokenValidationResult {
  try {
    const payload = jwt.verify(token, AUTH_CONFIG.jwtSecret, {
      issuer: 'battleship-naval-strategy',
      audience: 'battleship-users',
    }) as JWTPayload

    if (payload.type !== TOKEN_TYPES.ACCESS) {
      return {
        valid: false,
        error: 'Invalid token type',
      }
    }

    return {
      valid: true,
      payload,
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        expired: true,
        error: 'Token expired',
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      }
    }

    return {
      valid: false,
      error: 'Token verification failed',
    }
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): TokenValidationResult {
  try {
    const payload = jwt.verify(token, AUTH_CONFIG.jwtRefreshSecret, {
      issuer: 'battleship-naval-strategy',
      audience: 'battleship-users',
    }) as JWTPayload

    if (payload.type !== TOKEN_TYPES.REFRESH) {
      return {
        valid: false,
        error: 'Invalid token type',
      }
    }

    return {
      valid: true,
      payload,
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        expired: true,
        error: 'Refresh token expired',
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid refresh token',
      }
    }

    return {
      valid: false,
      error: 'Refresh token verification failed',
    }
  }
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Check if a token is expired without verification
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return true

  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}

/**
 * Get token expiration time
 */
export function getTokenExpirationDate(token: string): Date | null {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return null

  return new Date(decoded.exp * 1000)
}

/**
 * Refresh an access token using a refresh token
 */
export function refreshAccessToken(refreshToken: string): { accessToken: string; expiresAt: Date } | null {
  const validation = verifyRefreshToken(refreshToken)

  if (!validation.valid || !validation.payload) {
    return null
  }

  const { userId, username, email } = validation.payload
  const accessToken = generateAccessToken(userId, username, email)

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 15)

  return {
    accessToken,
    expiresAt,
  }
}
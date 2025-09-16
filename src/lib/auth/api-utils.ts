/**
 * API Utilities for Authentication
 * Helper functions for authentication API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { AUTH_CONFIG, AUTH_ERRORS } from './config'
import { AuthError, AuthResponse } from './types'
import { verifyAccessToken, verifyRefreshToken } from './tokens/jwt'

/**
 * Create an authentication error
 */
export function createAuthError(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>
): AuthError {
  const error = new Error(message) as AuthError
  error.code = code
  error.statusCode = statusCode
  error.details = details
  return error
}

/**
 * Create a success response
 */
export function createSuccessResponse(data: Partial<AuthResponse>, statusCode: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status: statusCode }
  )
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status: statusCode }
  )
}

/**
 * Validate request body using Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const field = err.path.join('.')
        if (!fieldErrors[field]) {
          fieldErrors[field] = []
        }
        fieldErrors[field].push(err.message)
      })

      return {
        data: null,
        error: createErrorResponse('Validation failed', 400, fieldErrors),
      }
    }

    return {
      data: null,
      error: createErrorResponse('Invalid request body', 400),
    }
  }
}

/**
 * Set authentication cookies
 */
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): void {
  const cookieOptions = {
    httpOnly: AUTH_CONFIG.cookieHttpOnly,
    secure: AUTH_CONFIG.cookieSecure,
    sameSite: AUTH_CONFIG.cookieSameSite,
    maxAge: AUTH_CONFIG.cookieMaxAge,
    path: '/',
  }

  response.cookies.set(AUTH_CONFIG.sessionCookieName, accessToken, cookieOptions)
  response.cookies.set(AUTH_CONFIG.refreshCookieName, refreshToken, cookieOptions)
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    httpOnly: true,
    secure: AUTH_CONFIG.cookieSecure,
    sameSite: AUTH_CONFIG.cookieSameSite,
    maxAge: 0,
    path: '/',
  }

  response.cookies.set(AUTH_CONFIG.sessionCookieName, '', cookieOptions)
  response.cookies.set(AUTH_CONFIG.refreshCookieName, '', cookieOptions)
}

/**
 * Get tokens from cookies
 */
export function getTokensFromCookies(request: NextRequest): {
  accessToken: string | null
  refreshToken: string | null
} {
  const accessToken = request.cookies.get(AUTH_CONFIG.sessionCookieName)?.value || null
  const refreshToken = request.cookies.get(AUTH_CONFIG.refreshCookieName)?.value || null

  return { accessToken, refreshToken }
}

/**
 * Get tokens from Authorization header
 */
export function getTokenFromHeader(request: NextRequest): string | null {
  const authorization = request.headers.get('Authorization')
  if (!authorization) return null

  const [type, token] = authorization.split(' ')
  if (type !== 'Bearer' || !token) return null

  return token
}

/**
 * Extract user from access token
 */
export function extractUserFromToken(request: NextRequest): {
  userId: string | null
  username: string | null
  email: string | null
  error: string | null
} {
  // Try to get token from header first, then cookies
  let token = getTokenFromHeader(request)
  if (!token) {
    const { accessToken } = getTokensFromCookies(request)
    token = accessToken
  }

  if (!token) {
    return {
      userId: null,
      username: null,
      email: null,
      error: 'No token provided',
    }
  }

  const validation = verifyAccessToken(token)
  if (!validation.valid || !validation.payload) {
    return {
      userId: null,
      username: null,
      email: null,
      error: validation.error || 'Invalid token',
    }
  }

  return {
    userId: validation.payload.userId,
    username: validation.payload.username,
    email: validation.payload.email,
    error: null,
  }
}

/**
 * Require authentication for a route
 */
export function requireAuth(request: NextRequest): {
  authenticated: boolean
  userId?: string
  username?: string
  email?: string
  response?: NextResponse
} {
  const { userId, username, email, error } = extractUserFromToken(request)

  if (!userId || error) {
    return {
      authenticated: false,
      response: createErrorResponse(
        error === 'No token provided' ? 'Authentication required' : 'Invalid or expired token',
        401
      ),
    }
  }

  return {
    authenticated: true,
    userId,
    username,
    email,
  }
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }

  const current = rateLimitMap.get(identifier) || { count: 0, resetTime: now + windowMs }

  if (current.resetTime < now) {
    // Reset the window
    current.count = 0
    current.resetTime = now + windowMs
  }

  current.count++
  rateLimitMap.set(identifier, current)

  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
    resetTime: current.resetTime,
  }
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof AuthError) {
    return createErrorResponse(error.message, error.statusCode)
  }

  if (error instanceof Error) {
    return createErrorResponse('Internal server error', 500)
  }

  return createErrorResponse('An unexpected error occurred', 500)
}
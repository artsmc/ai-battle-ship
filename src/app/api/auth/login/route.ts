/**
 * User Login API Route
 * POST /api/auth/login
 */

import { NextRequest } from 'next/server'
import { loginSchema } from '../../../../lib/auth/validation/schemas'
import { authenticateUser, createUserSession } from '../../../../lib/auth/services/user'
import { generateTokenPair } from '../../../../lib/auth/tokens/jwt'
import {
  validateRequestBody,
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  setAuthCookies,
  checkRateLimit,
  getClientIP,
} from '../../../../lib/auth/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 login attempts per 15 minutes per IP
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000) // 15 minutes

    if (!rateLimit.allowed) {
      return createErrorResponse(
        'Too many login attempts. Please try again later.',
        429
      )
    }

    // Validate request body
    const { data: credentials, error } = await validateRequestBody(request, loginSchema)
    if (error) return error

    // Authenticate user
    const user = await authenticateUser(credentials.email, credentials.password)

    // Generate JWT tokens
    const tokens = generateTokenPair(user.id, user.username, user.email)

    // Create user session
    const userAgent = request.headers.get('user-agent') || undefined
    await createUserSession(user.id, tokens.accessToken, clientIP, userAgent)

    // Create success response
    const response = createSuccessResponse({
      user,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      },
      message: 'Login successful',
    })

    // Set authentication cookies if "remember me" is checked
    if (credentials.rememberMe) {
      setAuthCookies(response, tokens.accessToken, tokens.refreshToken)
    } else {
      // Set session-only cookies (expire when browser closes)
      response.cookies.set('battleship_session', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }

    return response
  } catch (error) {
    return handleApiError(error)
  }
}

// Handle unsupported methods
export async function GET() {
  return createErrorResponse('Method not allowed', 405)
}

export async function PUT() {
  return createErrorResponse('Method not allowed', 405)
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 405)
}
/**
 * Token Refresh API Route
 * POST /api/auth/refresh
 */

import { NextRequest } from 'next/server'
import { getUserById } from '../../../../lib/auth/services/user'
import { refreshAccessToken } from '../../../../lib/auth/tokens/jwt'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  getTokensFromCookies,
  setAuthCookies,
  checkRateLimit,
  getClientIP,
} from '../../../../lib/auth/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 refresh attempts per minute per IP
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`refresh:${clientIP}`, 10, 60 * 1000) // 1 minute

    if (!rateLimit.allowed) {
      return createErrorResponse(
        'Too many refresh attempts. Please try again later.',
        429
      )
    }

    // Get refresh token from cookies
    const { refreshToken } = getTokensFromCookies(request)

    if (!refreshToken) {
      return createErrorResponse('Refresh token not found', 401)
    }

    // Refresh the access token
    const result = refreshAccessToken(refreshToken)

    if (!result) {
      return createErrorResponse('Invalid or expired refresh token', 401)
    }

    // Get user data to include in response
    // Note: We extract user ID from the refresh token payload, but we should validate the user still exists
    const { accessToken } = result

    // For now, we'll create a success response with just the new token
    // In a full implementation, we would verify the user still exists and is active
    const response = createSuccessResponse({
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      message: 'Token refreshed successfully',
    })

    // Update the access token cookie (keep the same refresh token)
    response.cookies.set('battleship_session', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    })

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
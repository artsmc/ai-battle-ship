/**
 * User Registration API Route
 * POST /api/auth/register
 */

import { NextRequest } from 'next/server'
import { registerSchema } from '../../../../lib/auth/validation/schemas'
import { createUser } from '../../../../lib/auth/services/user'
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
    // Rate limiting - 3 registration attempts per hour per IP
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`register:${clientIP}`, 3, 60 * 60 * 1000) // 1 hour

    if (!rateLimit.allowed) {
      return createErrorResponse(
        'Too many registration attempts. Please try again later.',
        429
      )
    }

    // Validate request body
    const { data: credentials, error } = await validateRequestBody(request, registerSchema)
    if (error) return error

    // Create user account
    const user = await createUser(credentials)

    // Generate JWT tokens
    const tokens = generateTokenPair(user.id, user.username, user.email)

    // Create success response
    const response = createSuccessResponse(
      {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        },
        message: 'Account created successfully',
      },
      201
    )

    // Set authentication cookies
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken)

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
/**
 * User Logout API Route
 * POST /api/auth/logout
 */

import { NextRequest } from 'next/server'
import { endUserSession } from '../../../../lib/auth/services/user'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  clearAuthCookies,
  getTokensFromCookies,
  getTokenFromHeader,
} from '../../../../lib/auth/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Get token from header or cookies
    let token = getTokenFromHeader(request)
    if (!token) {
      const { accessToken } = getTokensFromCookies(request)
      token = accessToken
    }

    // End user session if token exists
    if (token) {
      await endUserSession(token)
    }

    // Create success response
    const response = createSuccessResponse({
      message: 'Logout successful',
    })

    // Clear authentication cookies
    clearAuthCookies(response)

    return response
  } catch (error) {
    // Even if there's an error, we should still clear cookies and respond with success
    // for security reasons (don't reveal internal errors during logout)
    const response = createSuccessResponse({
      message: 'Logout successful',
    })

    clearAuthCookies(response)
    return response
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
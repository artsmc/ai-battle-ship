/**
 * Token Verification API Route
 * GET /api/auth/verify
 */

import { NextRequest } from 'next/server'
import { getUserById } from '../../../../lib/auth/services/user'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  extractUserFromToken,
} from '../../../../lib/auth/api-utils'

export async function GET(request: NextRequest) {
  try {
    // Extract user information from token
    const { userId, username, email, error } = extractUserFromToken(request)

    if (!userId || error) {
      return createErrorResponse(
        error === 'No token provided' ? 'Authentication required' : 'Invalid or expired token',
        401
      )
    }

    // Get current user data from database
    const user = await getUserById(userId)

    if (!user) {
      return createErrorResponse('User not found', 404)
    }

    // Return user information
    return createSuccessResponse({
      user,
      message: 'Token is valid',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Handle unsupported methods
export async function POST() {
  return createErrorResponse('Method not allowed', 405)
}

export async function PUT() {
  return createErrorResponse('Method not allowed', 405)
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 405)
}
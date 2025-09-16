/**
 * User Profile API Route
 * GET /api/user/profile - Get user profile
 * PUT /api/user/profile - Update user profile
 */

import { NextRequest } from 'next/server'
import { getUserProfile, updateUserProfile } from '../../../../lib/auth/services/user'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  requireAuth,
} from '../../../../lib/auth/api-utils'
import { z } from 'zod'

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  country_code: z.string().length(2).optional(),
  preferred_language: z.string().max(10).optional(),
  avatar_url: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response || createErrorResponse('Authentication required', 401)
    }

    const profile = await getUserProfile(authResult.userId!)

    if (!profile) {
      return createErrorResponse('Profile not found', 404)
    }

    return createSuccessResponse({
      profile,
      message: 'Profile retrieved successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response || createErrorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse('Invalid profile data', 400, {
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const updatedProfile = await updateUserProfile(authResult.userId!, validation.data)

    return createSuccessResponse({
      profile: updatedProfile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Handle unsupported methods
export async function POST() {
  return createErrorResponse('Method not allowed', 405)
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 405)
}
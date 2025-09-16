/**
 * User Preferences API Route
 * GET /api/user/preferences - Get user preferences
 * PUT /api/user/preferences - Update user preferences
 */

import { NextRequest } from 'next/server'
import { getUserPreferences, updateUserPreferences } from '../../../../lib/auth/services/user'
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  requireAuth,
} from '../../../../lib/auth/api-utils'
import { z } from 'zod'

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().max(10).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    browser: z.boolean().optional(),
    gameUpdates: z.boolean().optional(),
    achievements: z.boolean().optional(),
  }).optional(),
  gameSettings: z.object({
    soundEffects: z.boolean().optional(),
    backgroundMusic: z.boolean().optional(),
    animationSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
    autoConfirmMoves: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    showOnlineStatus: z.boolean().optional(),
    allowFriendRequests: z.boolean().optional(),
    showGameHistory: z.boolean().optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response || createErrorResponse('Authentication required', 401)
    }

    const preferences = await getUserPreferences(authResult.userId!)

    return createSuccessResponse({
      preferences,
      message: 'Preferences retrieved successfully',
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
    const validation = preferencesSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse('Invalid preferences data', 400, {
        errors: validation.error.flatten().fieldErrors,
      })
    }

    const updatedPreferences = await updateUserPreferences(authResult.userId!, validation.data)

    return createSuccessResponse({
      preferences: updatedPreferences,
      message: 'Preferences updated successfully',
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
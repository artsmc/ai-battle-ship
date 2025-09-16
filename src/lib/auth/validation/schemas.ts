/**
 * Authentication Validation Schemas
 * Zod schemas for validating authentication-related data
 */

import { z } from 'zod'
import { PASSWORD_REQUIREMENTS } from '../config'

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  .refine(
    (password) => {
      if (!PASSWORD_REQUIREMENTS.requireUppercase) return true
      return /[A-Z]/.test(password)
    },
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => {
      if (!PASSWORD_REQUIREMENTS.requireLowercase) return true
      return /[a-z]/.test(password)
    },
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => {
      if (!PASSWORD_REQUIREMENTS.requireNumbers) return true
      return /[0-9]/.test(password)
    },
    'Password must contain at least one number'
  )
  .refine(
    (password) => {
      if (!PASSWORD_REQUIREMENTS.requireSpecialChars) return true
      return /[^A-Za-z0-9]/.test(password)
    },
    'Password must contain at least one special character'
  )

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must not exceed 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
  .refine((username) => !username.startsWith('-') && !username.endsWith('-'), 'Username cannot start or end with hyphens')
  .refine((username) => !username.startsWith('_') && !username.endsWith('_'), 'Username cannot start or end with underscores')

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters')
  .toLowerCase()
  .trim()

/**
 * Display name validation schema
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Display name cannot be empty')
  .max(50, 'Display name must not exceed 50 characters')
  .trim()
  .optional()

/**
 * User registration schema
 */
export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
  display_name: displayNameSchema,
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .trim()
    .optional(),
  country_code: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .toUpperCase()
    .optional(),
  preferred_language: z
    .string()
    .length(2, 'Language code must be 2 characters')
    .toLowerCase()
    .optional(),
})

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().length(2).toLowerCase().default('en'),
  notifications: z
    .object({
      email: z.boolean().default(true),
      browser: z.boolean().default(true),
      gameUpdates: z.boolean().default(true),
      achievements: z.boolean().default(true),
    })
    .default({}),
  gameSettings: z
    .object({
      soundEffects: z.boolean().default(true),
      backgroundMusic: z.boolean().default(true),
      animationSpeed: z.enum(['slow', 'normal', 'fast']).default('normal'),
      autoConfirmMoves: z.boolean().default(false),
    })
    .default({}),
  privacy: z
    .object({
      showOnlineStatus: z.boolean().default(true),
      allowFriendRequests: z.boolean().default(true),
      showGameHistory: z.boolean().default(true),
    })
    .default({}),
})

/**
 * Change password schema (for authenticated users)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

/**
 * JWT token validation schema
 */
export const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

/**
 * Guest session schema
 */
export const guestSessionSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID format'),
  preferences: userPreferencesSchema.partial().optional(),
})
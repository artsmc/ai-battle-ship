/**
 * Password Utilities
 * Functions for hashing, verifying, and validating passwords
 */

import bcrypt from 'bcrypt'
import { AUTH_CONFIG } from '../config'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(AUTH_CONFIG.bcryptSaltRounds)
    return await bcrypt.hash(password, salt)
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    // Log the error but don't throw it - return false for security
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include uppercase letters')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include numbers')
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include special characters')
  }

  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|abcdef|qwerty/i, // Common sequences
    /password|123456789|qwertyuiop/i, // Common passwords
  ]

  let hasCommonPattern = false
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      hasCommonPattern = true
      break
    }
  }

  if (hasCommonPattern) {
    score -= 1
    feedback.push('Avoid common patterns and sequences')
  }

  // Dictionary words check (simplified)
  const commonWords = ['password', 'battleship', 'naval', 'strategy', 'game', 'user', 'admin']
  const lowerPassword = password.toLowerCase()
  const hasCommonWord = commonWords.some(word => lowerPassword.includes(word))

  if (hasCommonWord) {
    score -= 1
    feedback.push('Avoid common words')
  }

  const isStrong = score >= 4 && feedback.length === 0

  return {
    score: Math.max(0, Math.min(5, score)), // Clamp between 0-5
    feedback,
    isStrong,
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Generate a password reset token
 */
export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''

  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }

  return token
}

/**
 * Validate password meets requirements
 */
export function validatePasswordRequirements(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
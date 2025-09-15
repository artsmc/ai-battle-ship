/**
 * Security Module
 * Comprehensive security validation, sanitization, and anti-cheat mechanisms
 */

import { createHash, randomUUID } from 'crypto'
import { ValidationResult, ValidationError, Coordinate, GamePlayer } from '../types'

// =============================================
// SECURE ID GENERATION
// =============================================

/**
 * Generate cryptographically secure unique identifier
 * Uses crypto.randomUUID() for collision-resistant IDs
 */
export function generateSecureId(prefix: string = ''): string {
  const uuid = randomUUID()
  const timestamp = Date.now()
  const hash = createHash('sha256')
    .update(`${uuid}-${timestamp}`)
    .digest('hex')
    .substring(0, 8)

  return prefix ? `${prefix}_${timestamp}_${hash}` : `${timestamp}_${hash}`
}

/**
 * Generate secure game ID with validation
 */
export function generateGameId(): string {
  return generateSecureId('game')
}

/**
 * Generate secure event ID
 */
export function generateEventId(): string {
  return generateSecureId('event')
}

/**
 * Generate secure player session token
 */
export function generateSessionToken(): string {
  return randomUUID()
}

// =============================================
// INPUT SANITIZATION
// =============================================

/**
 * Sanitize and validate coordinate input
 * Prevents injection attacks and ensures valid bounds
 */
export function sanitizeCoordinate(
  input: unknown,
  boardWidth: number = 10,
  boardHeight: number = 10
): { valid: boolean; coordinate?: Coordinate; error?: string } {
  // Type validation
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid coordinate format' }
  }

  const coord = input as Record<string, unknown>

  // Extract and validate x coordinate
  const x = Number(coord.x)
  if (!Number.isInteger(x) || x < 0 || x >= boardWidth) {
    return {
      valid: false,
      error: `Invalid X coordinate: must be integer between 0 and ${boardWidth - 1}`
    }
  }

  // Extract and validate y coordinate
  const y = Number(coord.y)
  if (!Number.isInteger(y) || y < 0 || y >= boardHeight) {
    return {
      valid: false,
      error: `Invalid Y coordinate: must be integer between 0 and ${boardHeight - 1}`
    }
  }

  return {
    valid: true,
    coordinate: { x, y }
  }
}

/**
 * Sanitize player ID input
 * Prevents injection and validates format
 */
export function sanitizePlayerId(input: unknown): { valid: boolean; playerId?: string; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Player ID must be a string' }
  }

  // Remove whitespace and validate length
  const cleaned = input.trim()
  if (cleaned.length === 0 || cleaned.length > 100) {
    return { valid: false, error: 'Invalid player ID length' }
  }

  // Check for malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /[<>'"]/,
    /\.\./,
    /\\/
  ]

  for (const pattern of maliciousPatterns) {
    if (pattern.test(cleaned)) {
      return { valid: false, error: 'Invalid characters in player ID' }
    }
  }

  return { valid: true, playerId: cleaned }
}

/**
 * Sanitize ship placement data
 */
export function sanitizeShipPlacement(
  input: unknown,
  boardWidth: number = 10,
  boardHeight: number = 10
): { valid: boolean; coordinates?: Coordinate[]; error?: string } {
  if (!Array.isArray(input)) {
    return { valid: false, error: 'Ship placement must be an array of coordinates' }
  }

  const sanitizedCoords: Coordinate[] = []

  for (const coord of input) {
    const result = sanitizeCoordinate(coord, boardWidth, boardHeight)
    if (!result.valid || !result.coordinate) {
      return { valid: false, error: result.error }
    }
    sanitizedCoords.push(result.coordinate)
  }

  // Validate ship placement constraints
  if (sanitizedCoords.length < 2 || sanitizedCoords.length > 5) {
    return { valid: false, error: 'Invalid ship size (must be 2-5 cells)' }
  }

  return { valid: true, coordinates: sanitizedCoords }
}

// =============================================
// AUTHORIZATION SYSTEM
// =============================================

export interface AuthorizationContext {
  playerId: string
  sessionToken: string
  permissions: Set<string>
}

export class AuthorizationManager {
  private sessions: Map<string, AuthorizationContext> = new Map()
  private playerSessions: Map<string, string> = new Map() // playerId -> sessionToken

  /**
   * Create new authorized session
   */
  createSession(playerId: string, permissions: string[] = []): string {
    // Invalidate existing session if exists
    this.invalidateSession(playerId)

    const sessionToken = generateSessionToken()
    const context: AuthorizationContext = {
      playerId,
      sessionToken,
      permissions: new Set(permissions)
    }

    this.sessions.set(sessionToken, context)
    this.playerSessions.set(playerId, sessionToken)

    return sessionToken
  }

  /**
   * Validate session and get authorization context
   */
  validateSession(sessionToken: string): AuthorizationContext | null {
    return this.sessions.get(sessionToken) || null
  }

  /**
   * Check if player is authorized for action
   */
  isAuthorized(
    sessionToken: string,
    requiredPermission: string,
    targetPlayerId?: string
  ): boolean {
    const context = this.validateSession(sessionToken)
    if (!context) return false

    // Check permission
    if (!context.permissions.has(requiredPermission) && !context.permissions.has('admin')) {
      return false
    }

    // If targeting specific player, verify ownership
    if (targetPlayerId && targetPlayerId !== context.playerId && !context.permissions.has('admin')) {
      return false
    }

    return true
  }

  /**
   * Invalidate session
   */
  invalidateSession(playerId: string): void {
    const token = this.playerSessions.get(playerId)
    if (token) {
      this.sessions.delete(token)
      this.playerSessions.delete(playerId)
    }
  }

  /**
   * Check if action is authorized for game state mutation
   */
  authorizeStateChange(
    sessionToken: string,
    action: string,
    targetData?: { playerId?: string; gameId?: string }
  ): ValidationResult {
    const errors: ValidationError[] = []

    const context = this.validateSession(sessionToken)
    if (!context) {
      errors.push({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired session'
      })
      return { isValid: false, errors, warnings: [] }
    }

    // Define action permissions
    const actionPermissions: Record<string, string> = {
      'add_player': 'game.join',
      'remove_player': 'game.leave',
      'place_ship': 'ship.place',
      'attack': 'combat.attack',
      'use_powerup': 'combat.powerup',
      'surrender': 'game.surrender',
      'pause_game': 'game.pause',
      'resume_game': 'game.resume'
    }

    const requiredPermission = actionPermissions[action]
    if (!requiredPermission) {
      errors.push({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action: ${action}`
      })
      return { isValid: false, errors, warnings: [] }
    }

    // Check authorization
    if (!this.isAuthorized(sessionToken, requiredPermission, targetData?.playerId)) {
      errors.push({
        code: 'PERMISSION_DENIED',
        message: `Not authorized for action: ${action}`
      })
      return { isValid: false, errors, warnings: [] }
    }

    return { isValid: true, errors: [], warnings: [] }
  }
}

// =============================================
// RATE LIMITING
// =============================================

export interface RateLimitConfig {
  maxActions: number
  windowMs: number
  cooldownMs?: number
}

export class RateLimiter {
  private actionHistory: Map<string, number[]> = new Map()
  private cooldowns: Map<string, number> = new Map()

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if action is rate limited
   */
  checkRateLimit(playerId: string, actionType: string = 'default'): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    const key = `${playerId}:${actionType}`
    const now = Date.now()

    // Check cooldown
    const cooldownEnd = this.cooldowns.get(key)
    if (cooldownEnd && now < cooldownEnd) {
      const remainingMs = cooldownEnd - now
      errors.push({
        code: 'RATE_LIMITED',
        message: `Action on cooldown for ${Math.ceil(remainingMs / 1000)} seconds`
      })
      return { isValid: false, errors, warnings }
    }

    // Get action history
    let history = this.actionHistory.get(key) || []

    // Remove old entries outside window
    history = history.filter(timestamp => now - timestamp < this.config.windowMs)

    // Check if limit exceeded
    if (history.length >= this.config.maxActions) {
      // Set cooldown if configured
      if (this.config.cooldownMs) {
        this.cooldowns.set(key, now + this.config.cooldownMs)
      }

      errors.push({
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Maximum ${this.config.maxActions} actions per ${this.config.windowMs / 1000} seconds`
      })
      return { isValid: false, errors, warnings }
    }

    // Add current action to history
    history.push(now)
    this.actionHistory.set(key, history)

    // Warn if approaching limit
    if (history.length >= this.config.maxActions * 0.8) {
      warnings.push(`Approaching rate limit (${history.length}/${this.config.maxActions})`)
    }

    return { isValid: true, errors, warnings }
  }

  /**
   * Reset rate limit for player
   */
  resetLimit(playerId: string, actionType?: string): void {
    if (actionType) {
      const key = `${playerId}:${actionType}`
      this.actionHistory.delete(key)
      this.cooldowns.delete(key)
    } else {
      // Reset all actions for player
      for (const key of this.actionHistory.keys()) {
        if (key.startsWith(`${playerId}:`)) {
          this.actionHistory.delete(key)
          this.cooldowns.delete(key)
        }
      }
    }
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.actionHistory.clear()
    this.cooldowns.clear()
  }
}

// =============================================
// ANTI-CHEAT VALIDATION
// =============================================

/**
 * Validate ship placement for cheating attempts
 */
export function validateShipPlacementIntegrity(
  coordinates: Coordinate[],
  shipSize: number,
  boardWidth: number = 10,
  boardHeight: number = 10
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Size validation
  if (coordinates.length !== shipSize) {
    errors.push({
      code: 'CHEAT_INVALID_SIZE',
      message: `Ship size mismatch: expected ${shipSize}, got ${coordinates.length}`
    })
  }

  // Bounds validation
  for (const coord of coordinates) {
    if (coord.x < 0 || coord.x >= boardWidth || coord.y < 0 || coord.y >= boardHeight) {
      errors.push({
        code: 'CHEAT_OUT_OF_BOUNDS',
        message: `Coordinate out of bounds: (${coord.x}, ${coord.y})`
      })
    }
  }

  // Contiguity validation - ships must be in straight lines
  if (coordinates.length > 1) {
    const isHorizontal = coordinates.every(c => c.y === coordinates[0].y)
    const isVertical = coordinates.every(c => c.x === coordinates[0].x)

    if (!isHorizontal && !isVertical) {
      errors.push({
        code: 'CHEAT_INVALID_SHAPE',
        message: 'Ship must be placed in a straight line'
      })
    } else {
      // Check for gaps
      const sortedCoords = [...coordinates].sort((a, b) =>
        isHorizontal ? a.x - b.x : a.y - b.y
      )

      for (let i = 1; i < sortedCoords.length; i++) {
        const diff = isHorizontal
          ? sortedCoords[i].x - sortedCoords[i - 1].x
          : sortedCoords[i].y - sortedCoords[i - 1].y

        if (diff !== 1) {
          errors.push({
            code: 'CHEAT_GAPS_IN_SHIP',
            message: 'Ship placement contains gaps'
          })
          break
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Validate attack pattern for suspicious behavior
 */
export function validateAttackPattern(
  recentAttacks: Coordinate[],
  timeWindow: number = 5000 // 5 seconds
): { suspicious: boolean; reason?: string } {
  if (recentAttacks.length < 3) {
    return { suspicious: false }
  }

  // Check for impossible patterns (e.g., perfect hit rate on hidden ships)
  // This would need game state context to fully implement

  // Check for programmatic patterns
  const timings: number[] = []
  for (let i = 1; i < recentAttacks.length; i++) {
    // In real implementation, we'd have timestamps
    timings.push(100) // Placeholder
  }

  // Check if all timings are identical (bot behavior)
  const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length
  const variance = timings.reduce((sum, t) => sum + Math.pow(t - avgTiming, 2), 0) / timings.length

  if (variance < 10) { // Very low variance suggests bot
    return {
      suspicious: true,
      reason: 'Attack timing pattern suggests automated behavior'
    }
  }

  return { suspicious: false }
}

// =============================================
// EXPORT DEFAULT SECURITY CONFIG
// =============================================

export const defaultSecurityConfig = {
  rateLimits: {
    attack: { maxActions: 1, windowMs: 2000, cooldownMs: 1000 }, // 1 attack per 2 seconds
    powerup: { maxActions: 3, windowMs: 60000, cooldownMs: 5000 }, // 3 powerups per minute
    shipPlacement: { maxActions: 20, windowMs: 60000 }, // 20 placements per minute
    general: { maxActions: 30, windowMs: 60000 } // 30 general actions per minute
  },
  sessionTimeout: 3600000, // 1 hour
  maxReconnectAttempts: 3,
  antiCheatEnabled: true
}
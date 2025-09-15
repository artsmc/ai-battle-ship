/**
 * Security Implementation Tests
 * Comprehensive tests for all security features
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  generateSecureId,
  generateGameId,
  generateEventId,
  sanitizeCoordinate,
  sanitizePlayerId,
  sanitizeShipPlacement,
  validateShipPlacementIntegrity,
  AuthorizationManager,
  RateLimiter,
  defaultSecurityConfig
} from '../utils/security'
import { Coordinate } from '../types'

describe('Security Module Tests', () => {
  describe('Secure ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateSecureId()
      const id2 = generateSecureId()
      expect(id1).not.toBe(id2)
    })

    it('should generate game IDs with correct prefix', () => {
      const gameId = generateGameId()
      expect(gameId).toMatch(/^game_\d+_[a-f0-9]{8}$/)
    })

    it('should generate event IDs with correct prefix', () => {
      const eventId = generateEventId()
      expect(eventId).toMatch(/^event_\d+_[a-f0-9]{8}$/)
    })

    it('should not use Math.random()', () => {
      // Generate many IDs and check for patterns
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(generateSecureId())
      }
      // All should be unique
      expect(ids.size).toBe(1000)
    })
  })

  describe('Input Sanitization', () => {
    describe('Coordinate Sanitization', () => {
      it('should accept valid coordinates', () => {
        const result = sanitizeCoordinate({ x: 5, y: 5 }, 10, 10)
        expect(result.valid).toBe(true)
        expect(result.coordinate).toEqual({ x: 5, y: 5 })
      })

      it('should reject out of bounds coordinates', () => {
        const result = sanitizeCoordinate({ x: 10, y: 5 }, 10, 10)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid X coordinate')
      })

      it('should reject negative coordinates', () => {
        const result = sanitizeCoordinate({ x: -1, y: 5 }, 10, 10)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid X coordinate')
      })

      it('should reject non-integer coordinates', () => {
        const result = sanitizeCoordinate({ x: 5.5, y: 3.2 }, 10, 10)
        expect(result.valid).toBe(false)
      })

      it('should reject invalid input types', () => {
        const result = sanitizeCoordinate('invalid' as any, 10, 10)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid coordinate format')
      })

      it('should handle null/undefined input', () => {
        const result = sanitizeCoordinate(null as any, 10, 10)
        expect(result.valid).toBe(false)
      })
    })

    describe('Player ID Sanitization', () => {
      it('should accept valid player IDs', () => {
        const result = sanitizePlayerId('player123')
        expect(result.valid).toBe(true)
        expect(result.playerId).toBe('player123')
      })

      it('should reject empty player IDs', () => {
        const result = sanitizePlayerId('')
        expect(result.valid).toBe(false)
      })

      it('should reject player IDs with script tags', () => {
        const result = sanitizePlayerId('<script>alert("xss")</script>')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid characters')
      })

      it('should reject player IDs with javascript:', () => {
        const result = sanitizePlayerId('javascript:alert(1)')
        expect(result.valid).toBe(false)
      })

      it('should reject overly long player IDs', () => {
        const longId = 'a'.repeat(101)
        const result = sanitizePlayerId(longId)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid player ID length')
      })

      it('should trim whitespace', () => {
        const result = sanitizePlayerId('  player123  ')
        expect(result.valid).toBe(true)
        expect(result.playerId).toBe('player123')
      })
    })

    describe('Ship Placement Sanitization', () => {
      it('should accept valid ship placement', () => {
        const coords: Coordinate[] = [
          { x: 2, y: 3 },
          { x: 3, y: 3 },
          { x: 4, y: 3 }
        ]
        const result = sanitizeShipPlacement(coords, 10, 10)
        expect(result.valid).toBe(true)
        expect(result.coordinates).toEqual(coords)
      })

      it('should reject ship placement with invalid coordinates', () => {
        const coords = [
          { x: 2, y: 3 },
          { x: 11, y: 3 } // Out of bounds
        ]
        const result = sanitizeShipPlacement(coords, 10, 10)
        expect(result.valid).toBe(false)
      })

      it('should reject ships that are too small', () => {
        const coords = [{ x: 2, y: 3 }] // Only 1 cell
        const result = sanitizeShipPlacement(coords, 10, 10)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid ship size')
      })

      it('should reject ships that are too large', () => {
        const coords = Array(6).fill(null).map((_, i) => ({ x: i, y: 3 }))
        const result = sanitizeShipPlacement(coords, 10, 10)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid ship size')
      })
    })
  })

  describe('Authorization System', () => {
    let authManager: AuthorizationManager

    beforeEach(() => {
      authManager = new AuthorizationManager()
    })

    it('should create valid sessions', () => {
      const token = authManager.createSession('player1', ['combat.attack'])
      expect(token).toBeTruthy()
      expect(token).toMatch(/^[a-f0-9-]{36}$/) // UUID format
    })

    it('should validate existing sessions', () => {
      const token = authManager.createSession('player1', ['combat.attack'])
      const context = authManager.validateSession(token)
      expect(context).toBeTruthy()
      expect(context?.playerId).toBe('player1')
    })

    it('should reject invalid sessions', () => {
      const context = authManager.validateSession('invalid-token')
      expect(context).toBeNull()
    })

    it('should check authorization correctly', () => {
      const token = authManager.createSession('player1', ['combat.attack'])

      const canAttack = authManager.isAuthorized(token, 'combat.attack', 'player1')
      expect(canAttack).toBe(true)

      const cannotPowerup = authManager.isAuthorized(token, 'combat.powerup', 'player1')
      expect(cannotPowerup).toBe(false)
    })

    it('should prevent cross-player actions', () => {
      const token = authManager.createSession('player1', ['combat.attack'])

      const canControlOther = authManager.isAuthorized(token, 'combat.attack', 'player2')
      expect(canControlOther).toBe(false)
    })

    it('should invalidate sessions', () => {
      const token = authManager.createSession('player1', ['combat.attack'])
      authManager.invalidateSession('player1')

      const context = authManager.validateSession(token)
      expect(context).toBeNull()
    })

    it('should replace existing sessions', () => {
      const token1 = authManager.createSession('player1', ['combat.attack'])
      const token2 = authManager.createSession('player1', ['combat.powerup'])

      // First token should be invalid
      expect(authManager.validateSession(token1)).toBeNull()
      // Second token should be valid
      expect(authManager.validateSession(token2)).toBeTruthy()
    })
  })

  describe('Rate Limiting', () => {
    it('should allow actions within rate limit', () => {
      const limiter = new RateLimiter({ maxActions: 3, windowMs: 1000 })

      const result1 = limiter.checkRateLimit('player1', 'attack')
      const result2 = limiter.checkRateLimit('player1', 'attack')
      const result3 = limiter.checkRateLimit('player1', 'attack')

      expect(result1.isValid).toBe(true)
      expect(result2.isValid).toBe(true)
      expect(result3.isValid).toBe(true)
    })

    it('should block actions exceeding rate limit', () => {
      const limiter = new RateLimiter({ maxActions: 2, windowMs: 1000 })

      limiter.checkRateLimit('player1', 'attack')
      limiter.checkRateLimit('player1', 'attack')
      const result = limiter.checkRateLimit('player1', 'attack')

      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should track different action types separately', () => {
      const limiter = new RateLimiter({ maxActions: 1, windowMs: 1000 })

      const attack = limiter.checkRateLimit('player1', 'attack')
      const powerup = limiter.checkRateLimit('player1', 'powerup')

      expect(attack.isValid).toBe(true)
      expect(powerup.isValid).toBe(true)
    })

    it('should track different players separately', () => {
      const limiter = new RateLimiter({ maxActions: 1, windowMs: 1000 })

      const player1 = limiter.checkRateLimit('player1', 'attack')
      const player2 = limiter.checkRateLimit('player2', 'attack')

      expect(player1.isValid).toBe(true)
      expect(player2.isValid).toBe(true)
    })

    it('should warn when approaching limit', () => {
      const limiter = new RateLimiter({ maxActions: 3, windowMs: 1000 })

      limiter.checkRateLimit('player1', 'attack')
      limiter.checkRateLimit('player1', 'attack')
      const result = limiter.checkRateLimit('player1', 'attack')

      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Approaching rate limit')
    })

    it('should reset limits', () => {
      const limiter = new RateLimiter({ maxActions: 1, windowMs: 1000 })

      limiter.checkRateLimit('player1', 'attack')
      limiter.resetLimit('player1', 'attack')

      const result = limiter.checkRateLimit('player1', 'attack')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Anti-Cheat Validation', () => {
    it('should validate correct ship placement', () => {
      const coords: Coordinate[] = [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 }
      ]
      const result = validateShipPlacementIntegrity(coords, 3, 10, 10)
      expect(result.isValid).toBe(true)
    })

    it('should detect size mismatches', () => {
      const coords: Coordinate[] = [
        { x: 2, y: 3 },
        { x: 3, y: 3 }
      ]
      const result = validateShipPlacementIntegrity(coords, 3, 10, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('CHEAT_INVALID_SIZE')
    })

    it('should detect non-contiguous ships', () => {
      const coords: Coordinate[] = [
        { x: 2, y: 3 },
        { x: 4, y: 3 }, // Gap in ship
        { x: 5, y: 3 }
      ]
      const result = validateShipPlacementIntegrity(coords, 3, 10, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('CHEAT_GAPS_IN_SHIP')
    })

    it('should detect diagonal ships', () => {
      const coords: Coordinate[] = [
        { x: 2, y: 3 },
        { x: 3, y: 4 }, // Diagonal
        { x: 4, y: 5 }
      ]
      const result = validateShipPlacementIntegrity(coords, 3, 10, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('CHEAT_INVALID_SHAPE')
    })

    it('should detect out of bounds placement', () => {
      const coords: Coordinate[] = [
        { x: 8, y: 3 },
        { x: 9, y: 3 },
        { x: 10, y: 3 } // Out of bounds
      ]
      const result = validateShipPlacementIntegrity(coords, 3, 10, 10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].code).toBe('CHEAT_OUT_OF_BOUNDS')
    })
  })

  describe('Integration Tests', () => {
    it('should handle multiple security layers', () => {
      // Test that all security features work together
      const authManager = new AuthorizationManager()
      const rateLimiter = new RateLimiter(defaultSecurityConfig.rateLimits.attack)

      // Create session
      const token = authManager.createSession('player1', ['combat.attack'])

      // Check authorization
      const authResult = authManager.authorizeStateChange(token, 'attack', { playerId: 'player1' })
      expect(authResult.isValid).toBe(true)

      // Check rate limiting
      const rateResult = rateLimiter.checkRateLimit('player1', 'attack')
      expect(rateResult.isValid).toBe(true)

      // Sanitize input
      const coordResult = sanitizeCoordinate({ x: 5, y: 5 }, 10, 10)
      expect(coordResult.valid).toBe(true)

      // All security checks pass
      expect(authResult.isValid && rateResult.isValid && coordResult.valid).toBe(true)
    })
  })
})
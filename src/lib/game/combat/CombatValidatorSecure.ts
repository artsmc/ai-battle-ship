/**
 * CombatValidatorSecure
 * Enhanced combat validator with security features, rate limiting, and input sanitization
 */

import { GameState } from '../GameState'
import { Coordinate, ValidationResult, ValidationError } from '../types'
import { PowerupType, GameStatus } from '../../database/types/enums'
import { CombatConfig } from './CombatEngine'
import {
  sanitizeCoordinate,
  sanitizePlayerId,
  RateLimiter,
  defaultSecurityConfig
} from '../utils/security'

export interface AttackValidation extends ValidationResult {
  canAttack: boolean
  reason?: string
}

export interface PowerupValidation extends ValidationResult {
  canUsePowerup: boolean
  powerupAvailable: boolean
}

export class CombatValidatorSecure {
  private config: CombatConfig
  private rateLimiters: Map<string, RateLimiter> = new Map()

  constructor(config: CombatConfig) {
    this.config = config
    this.initializeRateLimiters()
  }

  private initializeRateLimiters(): void {
    // Initialize rate limiters for different action types
    this.rateLimiters.set('attack', new RateLimiter(defaultSecurityConfig.rateLimits.attack))
    this.rateLimiters.set('powerup', new RateLimiter(defaultSecurityConfig.rateLimits.powerup))
    this.rateLimiters.set('ability', new RateLimiter(defaultSecurityConfig.rateLimits.powerup))
  }

  /**
   * Validate turn start with enhanced security
   */
  validateTurnStart(
    gameState: GameState,
    attackerId: string,
    defenderId: string
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Sanitize player IDs
    const sanitizedAttackerId = sanitizePlayerId(attackerId)
    const sanitizedDefenderId = sanitizePlayerId(defenderId)

    if (!sanitizedAttackerId.valid || !sanitizedAttackerId.playerId) {
      errors.push({
        code: 'INVALID_ATTACKER_ID',
        message: sanitizedAttackerId.error || 'Invalid attacker ID'
      })
    }

    if (!sanitizedDefenderId.valid || !sanitizedDefenderId.playerId) {
      errors.push({
        code: 'INVALID_DEFENDER_ID',
        message: sanitizedDefenderId.error || 'Invalid defender ID'
      })
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }

    attackerId = sanitizedAttackerId.playerId!
    defenderId = sanitizedDefenderId.playerId!

    // Check game status
    const status = gameState.getStatus()
    if (status !== GameStatus.PLAYING) {
      errors.push({
        code: 'INVALID_GAME_STATUS',
        message: `Game is not in playing state (current: ${status})`
      })
    }

    // Check phase
    const phase = gameState.getPhase()
    if (phase.current !== 'battle') {
      errors.push({
        code: 'INVALID_PHASE',
        message: `Game is not in battle phase (current: ${phase.current})`
      })
    }

    // Validate attacker
    const attacker = gameState.getPlayer(attackerId)
    if (!attacker) {
      errors.push({
        code: 'ATTACKER_NOT_FOUND',
        message: 'Attacker not found in game'
      })
    } else {
      // Check if it's attacker's turn
      const currentPlayer = gameState.getCurrentPlayer()
      if (currentPlayer?.id !== attackerId) {
        errors.push({
          code: 'NOT_YOUR_TURN',
          message: 'It is not the attacker\'s turn'
        })
      }

      // Check attacker status
      if (!attacker.isActive) {
        errors.push({
          code: 'ATTACKER_INACTIVE',
          message: 'Attacker is not active'
        })
      }

      if (attacker.connectionStatus === 'disconnected') {
        warnings.push('Attacker is disconnected')
      }
    }

    // Validate defender
    const defender = gameState.getPlayer(defenderId)
    if (!defender) {
      errors.push({
        code: 'DEFENDER_NOT_FOUND',
        message: 'Defender not found in game'
      })
    } else {
      // Check defender status
      if (!defender.isActive) {
        warnings.push('Defender is not active')
      }

      if (defender.connectionStatus === 'disconnected') {
        warnings.push('Defender is disconnected')
      }
    }

    // Check if players are different
    if (attackerId === defenderId) {
      errors.push({
        code: 'SELF_ATTACK',
        message: 'Cannot attack yourself'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate attack action with enhanced security
   */
  validateAttack(
    gameState: GameState,
    attackerId: string,
    coordinate: Coordinate
  ): AttackValidation {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Sanitize attacker ID
    const sanitizedAttackerId = sanitizePlayerId(attackerId)
    if (!sanitizedAttackerId.valid || !sanitizedAttackerId.playerId) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_ATTACKER_ID',
          message: sanitizedAttackerId.error || 'Invalid attacker ID'
        }],
        warnings: [],
        canAttack: false,
        reason: 'Invalid attacker ID'
      }
    }
    attackerId = sanitizedAttackerId.playerId

    // Check rate limiting for attacks
    const rateLimiter = this.rateLimiters.get('attack')
    if (rateLimiter) {
      const rateLimitCheck = rateLimiter.checkRateLimit(attackerId, 'attack')
      if (!rateLimitCheck.isValid) {
        return {
          ...rateLimitCheck,
          canAttack: false,
          reason: 'Rate limit exceeded'
        }
      }
      warnings.push(...rateLimitCheck.warnings)
    }

    // Basic turn validation
    const turnValidation = this.validateBasicTurnRules(gameState, attackerId)
    if (!turnValidation.isValid) {
      return {
        ...turnValidation,
        canAttack: false,
        reason: 'Turn validation failed'
      }
    }

    // Get attacker
    const attacker = gameState.getPlayer(attackerId)
    if (!attacker) {
      return {
        isValid: false,
        errors: [{
          code: 'ATTACKER_NOT_FOUND',
          message: 'Attacker not found'
        }],
        warnings: [],
        canAttack: false
      }
    }

    // Sanitize and validate coordinate
    const boardWidth = attacker.board.width || 10
    const boardHeight = attacker.board.height || 10
    const sanitizedCoord = sanitizeCoordinate(coordinate, boardWidth, boardHeight)

    if (!sanitizedCoord.valid || !sanitizedCoord.coordinate) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_COORDINATE',
          message: sanitizedCoord.error || 'Invalid coordinate'
        }],
        warnings,
        canAttack: false,
        reason: 'Invalid coordinate'
      }
    }

    const validatedCoordinate = sanitizedCoord.coordinate
    const coordValidation = this.validateCoordinate(
      validatedCoordinate,
      boardWidth,
      boardHeight
    )

    if (!coordValidation.isValid) {
      return {
        ...coordValidation,
        canAttack: false,
        reason: 'Invalid coordinate'
      }
    }

    // Check if coordinate has already been attacked
    const state = gameState.getState()
    const opponent = state.players.find(p => p.id !== attackerId)

    if (opponent) {
      const cell = opponent.board.cells[validatedCoordinate.y]?.[validatedCoordinate.x]
      if (cell?.isHit) {
        warnings.push('Cell has already been attacked')
      }
    }

    // Check turn time limit
    if (this.config.turnTimeLimit) {
      const currentTurn = gameState.getCurrentTurn()
      if (currentTurn) {
        const turnDuration = Date.now() - currentTurn.startTime.getTime()
        if (turnDuration > this.config.turnTimeLimit) {
          errors.push({
            code: 'TURN_TIME_EXCEEDED',
            message: 'Turn time limit exceeded'
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canAttack: errors.length === 0
    }
  }

  /**
   * Validate powerup use with enhanced security
   */
  validatePowerup(
    gameState: GameState,
    playerId: string,
    powerupType: PowerupType
  ): PowerupValidation {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Sanitize player ID
    const sanitizedPlayerId = sanitizePlayerId(playerId)
    if (!sanitizedPlayerId.valid || !sanitizedPlayerId.playerId) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_PLAYER_ID',
          message: sanitizedPlayerId.error || 'Invalid player ID'
        }],
        warnings: [],
        canUsePowerup: false,
        powerupAvailable: false
      }
    }
    playerId = sanitizedPlayerId.playerId

    // Check rate limiting for powerups
    const rateLimiter = this.rateLimiters.get('powerup')
    if (rateLimiter) {
      const rateLimitCheck = rateLimiter.checkRateLimit(playerId, 'powerup')
      if (!rateLimitCheck.isValid) {
        return {
          ...rateLimitCheck,
          canUsePowerup: false,
          powerupAvailable: false
        }
      }
      warnings.push(...rateLimitCheck.warnings)
    }

    // Check if powerups are enabled
    if (!this.config.allowPowerups) {
      return {
        isValid: false,
        errors: [{
          code: 'POWERUPS_DISABLED',
          message: 'Powerups are not enabled in this game'
        }],
        warnings: [],
        canUsePowerup: false,
        powerupAvailable: false
      }
    }

    // Basic turn validation
    const turnValidation = this.validateBasicTurnRules(gameState, playerId)
    if (!turnValidation.isValid) {
      return {
        ...turnValidation,
        canUsePowerup: false,
        powerupAvailable: false
      }
    }

    // Get player
    const player = gameState.getPlayer(playerId)
    if (!player) {
      return {
        isValid: false,
        errors: [{
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found'
        }],
        warnings: [],
        canUsePowerup: false,
        powerupAvailable: false
      }
    }

    // Check if player has the powerup
    const powerup = player.powerups.find(p => p.type === powerupType)
    if (!powerup) {
      return {
        isValid: false,
        errors: [{
          code: 'POWERUP_NOT_FOUND',
          message: 'Player does not have this powerup'
        }],
        warnings: [],
        canUsePowerup: false,
        powerupAvailable: false
      }
    }

    // Check powerup availability
    if (powerup.remainingUses <= 0) {
      errors.push({
        code: 'NO_USES_REMAINING',
        message: 'No uses remaining for this powerup'
      })
    }

    if (powerup.currentCooldown > 0) {
      errors.push({
        code: 'POWERUP_ON_COOLDOWN',
        message: `Powerup on cooldown for ${powerup.currentCooldown} turns`
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canUsePowerup: errors.length === 0,
      powerupAvailable: true
    }
  }

  /**
   * Validate coordinate with enhanced security checks
   */
  private validateCoordinate(
    coordinate: Coordinate,
    boardWidth: number,
    boardHeight: number
  ): ValidationResult {
    const errors: ValidationError[] = []

    // Ensure coordinates are integers
    if (!Number.isInteger(coordinate.x) || !Number.isInteger(coordinate.y)) {
      errors.push({
        code: 'NON_INTEGER_COORDINATE',
        message: 'Coordinates must be integers',
        field: 'coordinate',
        value: coordinate
      })
      return { isValid: false, errors, warnings: [] }
    }

    // Validate bounds with proper range checking
    if (coordinate.x < 0 || coordinate.x >= boardWidth) {
      errors.push({
        code: 'INVALID_X_COORDINATE',
        message: `X coordinate ${coordinate.x} is out of bounds (0-${boardWidth - 1})`,
        field: 'x',
        value: coordinate.x
      })
    }

    if (coordinate.y < 0 || coordinate.y >= boardHeight) {
      errors.push({
        code: 'INVALID_Y_COORDINATE',
        message: `Y coordinate ${coordinate.y} is out of bounds (0-${boardHeight - 1})`,
        field: 'y',
        value: coordinate.y
      })
    }

    // Additional security check for reasonable board sizes
    if (boardWidth > 20 || boardHeight > 20) {
      errors.push({
        code: 'INVALID_BOARD_SIZE',
        message: 'Board size exceeds maximum allowed dimensions',
        field: 'board',
        value: { width: boardWidth, height: boardHeight }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * Validate basic turn rules
   */
  private validateBasicTurnRules(
    gameState: GameState,
    playerId: string
  ): ValidationResult {
    const errors: ValidationError[] = []

    // Check game status
    if (gameState.getStatus() !== GameStatus.PLAYING) {
      errors.push({
        code: 'GAME_NOT_ACTIVE',
        message: 'Game is not active'
      })
    }

    // Check if it's player's turn
    const currentPlayer = gameState.getCurrentPlayer()
    if (!currentPlayer || currentPlayer.id !== playerId) {
      errors.push({
        code: 'NOT_YOUR_TURN',
        message: 'It is not your turn'
      })
    }

    // Check phase
    if (gameState.getPhase().current !== 'battle') {
      errors.push({
        code: 'NOT_BATTLE_PHASE',
        message: 'Game is not in battle phase'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * Reset rate limits for a player (useful for testing or admin actions)
   */
  resetRateLimits(playerId: string): void {
    for (const rateLimiter of this.rateLimiters.values()) {
      rateLimiter.resetLimit(playerId)
    }
  }

  /**
   * Clear all rate limits (useful for game reset)
   */
  clearAllRateLimits(): void {
    for (const rateLimiter of this.rateLimiters.values()) {
      rateLimiter.clearAll()
    }
  }
}
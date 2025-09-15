/**
 * CombatValidator
 * Validates combat actions and ensures game rules are followed
 */

import { GameState } from '../GameState'
import { Coordinate, ValidationResult, ValidationError } from '../types'
import { PowerupType, GameStatus } from '../../database/types/enums'
import { CombatConfig } from './CombatEngine'

export interface AttackValidation extends ValidationResult {
  canAttack: boolean
  reason?: string
}

export interface PowerupValidation extends ValidationResult {
  canUsePowerup: boolean
  powerupAvailable: boolean
}

export class CombatValidator {
  private config: CombatConfig

  constructor(config: CombatConfig) {
    this.config = config
  }

  /**
   * Validate turn start
   */
  validateTurnStart(
    gameState: GameState,
    attackerId: string,
    defenderId: string
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

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
   * Validate attack action
   */
  validateAttack(
    gameState: GameState,
    attackerId: string,
    coordinate: Coordinate
  ): AttackValidation {
    const errors: ValidationError[] = []
    const warnings: string[] = []

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

    // Validate coordinate
    const coordValidation = this.validateCoordinate(
      coordinate,
      attacker.board.width,
      attacker.board.height
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
      const cell = opponent.board.cells[coordinate.y]?.[coordinate.x]
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
   * Validate powerup use
   */
  validatePowerup(
    gameState: GameState,
    playerId: string,
    powerupType: PowerupType
  ): PowerupValidation {
    const errors: ValidationError[] = []
    const warnings: string[] = []

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
   * Validate ship ability use
   */
  validateShipAbility(
    gameState: GameState,
    playerId: string,
    shipId: string,
    abilityId: string
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Check if abilities are enabled
    if (!this.config.enableSpecialAbilities) {
      errors.push({
        code: 'ABILITIES_DISABLED',
        message: 'Ship abilities are not enabled in this game'
      })
    }

    // Basic turn validation
    const turnValidation = this.validateBasicTurnRules(gameState, playerId)
    if (!turnValidation.isValid) {
      return turnValidation
    }

    // Get player and ship
    const player = gameState.getPlayer(playerId)
    if (!player) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found'
      })
      return { isValid: false, errors, warnings }
    }

    const ship = player.fleet.find(s => s.id === shipId)
    if (!ship) {
      errors.push({
        code: 'SHIP_NOT_FOUND',
        message: 'Ship not found in player fleet'
      })
      return { isValid: false, errors, warnings }
    }

    // Check if ship is sunk
    if (ship.damage.isSunk) {
      errors.push({
        code: 'SHIP_SUNK',
        message: 'Cannot use abilities on sunk ships'
      })
    }

    // Check ability
    const ability = ship.abilities.find(a => a.id === abilityId)
    if (!ability) {
      errors.push({
        code: 'ABILITY_NOT_FOUND',
        message: 'Ability not found on ship'
      })
    } else {
      if (!ability.isActive) {
        errors.push({
          code: 'ABILITY_INACTIVE',
          message: 'Ability is not active'
        })
      }

      if (ability.currentCooldown > 0) {
        errors.push({
          code: 'ABILITY_ON_COOLDOWN',
          message: `Ability on cooldown for ${ability.currentCooldown} turns`
        })
      }

      if (ability.remainingUses <= 0) {
        errors.push({
          code: 'NO_ABILITY_USES',
          message: 'No uses remaining for this ability'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate coordinate
   */
  validateCoordinate(
    coordinate: Coordinate,
    boardWidth: number,
    boardHeight: number
  ): ValidationResult {
    const errors: ValidationError[] = []

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
   * Validate area of effect
   */
  validateAreaOfEffect(
    coordinates: Coordinate[],
    boardWidth: number,
    boardHeight: number,
    maxArea: number = 9
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    if (coordinates.length > maxArea) {
      errors.push({
        code: 'AREA_TOO_LARGE',
        message: `Area contains ${coordinates.length} cells, maximum is ${maxArea}`
      })
    }

    // Validate each coordinate
    for (const coord of coordinates) {
      const validation = this.validateCoordinate(coord, boardWidth, boardHeight)
      if (!validation.isValid) {
        errors.push(...validation.errors)
      }
    }

    // Check for duplicate coordinates
    const uniqueCoords = new Set(coordinates.map(c => `${c.x},${c.y}`))
    if (uniqueCoords.size !== coordinates.length) {
      warnings.push('Area contains duplicate coordinates')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}
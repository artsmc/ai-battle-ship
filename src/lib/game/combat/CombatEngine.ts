/**
 * CombatEngine
 * Main combat processing engine that orchestrates all combat operations
 */

import { GameState } from '../GameState'
import { AttackProcessor } from './AttackProcessor'
import { HitDetector } from './HitDetector'
import { DamageCalculator } from './DamageCalculator'
import { WinConditions } from './WinConditions'
import { CombatValidator } from './CombatValidator'
import { CombatEngineAdapter } from './CombatEngineAdapter'
import { AbilityEngine } from '../../ships/AbilityEngine'
import {
  Coordinate,
  AttackResult,
  ValidationResult,
  GamePlayer
} from '../types'
import { MoveResult, PowerupType } from '../../database/types/enums'

export interface CombatConfig {
  allowPowerups: boolean
  fogOfWar: boolean
  turnTimeLimit?: number
  enableSpecialAbilities: boolean
}

export interface CombatTurn {
  turnNumber: number
  attackerId: string
  defenderId: string
  actions: CombatAction[]
  startTime: Date
  endTime?: Date
  isComplete: boolean
}

export interface CombatAction {
  id: string
  type: 'attack' | 'powerup' | 'ability'
  coordinate?: Coordinate
  result?: AttackResult
  timestamp: Date
}

export interface CombatStatistics {
  totalShots: number
  totalHits: number
  totalMisses: number
  shipsDestroyed: number
  damageDealt: number
  powerupsUsed: number
  accuracy: number
  averageTurnTime: number
}

export class CombatEngine {
  private gameState: GameState
  private attackProcessor: AttackProcessor
  private hitDetector: HitDetector
  private damageCalculator: DamageCalculator
  private winConditions: WinConditions
  private validator: CombatValidator
  private abilityEngine: AbilityEngine
  private config: CombatConfig
  private combatHistory: CombatTurn[] = []
  private currentTurn: CombatTurn | null = null

  constructor(gameState: GameState, config: CombatConfig) {
    this.gameState = gameState
    this.config = config
    this.attackProcessor = new AttackProcessor()
    this.hitDetector = new HitDetector()
    this.damageCalculator = new DamageCalculator(config.enableSpecialAbilities)
    this.winConditions = new WinConditions()
    this.validator = new CombatValidator(config)
    this.abilityEngine = new AbilityEngine({
      enableAbilities: config.enableSpecialAbilities,
      syncEnabled: false,
      maxAbilitiesPerShip: 2
    })
  }

  // =============================================
  // TURN MANAGEMENT
  // =============================================

  startCombatTurn(attackerId: string, defenderId: string): ValidationResult {
    const validation = this.validator.validateTurnStart(
      this.gameState,
      attackerId,
      defenderId
    )

    if (!validation.isValid) {
      return validation
    }

    this.currentTurn = {
      turnNumber: this.combatHistory.length + 1,
      attackerId,
      defenderId,
      actions: [],
      startTime: new Date(),
      isComplete: false
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  endCombatTurn(): void {
    if (!this.currentTurn) {
      return
    }

    this.currentTurn.endTime = new Date()
    this.currentTurn.isComplete = true
    this.combatHistory.push(this.currentTurn)
    this.currentTurn = null

    // Update turn in game state
    this.gameState.endCurrentTurn()
  }

  // =============================================
  // ATTACK PROCESSING
  // =============================================

  processAttack(
    attackerId: string,
    defenderId: string,
    coordinate: Coordinate,
    attackType: 'normal' | 'special' = 'normal'
  ): AttackResult | null {
    // Validate attack
    const validation = this.validator.validateAttack(
      this.gameState,
      attackerId,
      coordinate
    )

    if (!validation.isValid) {
      console.error('Attack validation failed:', validation.errors)
      return null
    }

    // Get players
    const attacker = this.gameState.getPlayer(attackerId)
    const defender = this.gameState.getPlayer(defenderId)

    if (!attacker || !defender) {
      return null
    }

    // Get attacking ship if applicable
    const attackingShip = attacker.fleet.find(ship =>
      !ship.damage.isSunk && ship.abilities.length > 0
    )

    // Apply ability modifiers to damage if applicable
    let baseDamage = 1 // Default damage
    if (attackingShip && this.config.enableSpecialAbilities) {
      baseDamage = this.abilityEngine.applyAttackModifiers(attackingShip, baseDamage)
    }

    // Process attack using adapter
    const result = CombatEngineAdapter.processAttackOnPlayer(defender, coordinate)

    // Trigger attack abilities if enabled
    if (attackingShip && this.config.enableSpecialAbilities) {
      this.abilityEngine.onAttack(attackingShip, coordinate, result)
    }

    // Update attacker statistics
    CombatEngineAdapter.updateAttackerStats(
      attacker,
      coordinate,
      result.result !== MoveResult.MISS
    )

    // Record combat action
    if (this.currentTurn) {
      this.currentTurn.actions.push({
        id: `action_${Date.now()}`,
        type: 'attack',
        coordinate,
        result,
        timestamp: new Date()
      })
    }

    // Check win conditions
    if (CombatEngineAdapter.areAllShipsSunk(defender)) {
      this.gameState.endGame(attackerId, 'all_ships_sunk')
    }

    return result
  }

  // =============================================
  // POWERUP PROCESSING
  // =============================================

  processPowerup(
    playerId: string,
    powerupType: PowerupType,
    targetArea?: Coordinate[]
  ): ValidationResult {
    const validation = this.validator.validatePowerup(
      this.gameState,
      playerId,
      powerupType
    )

    if (!validation.isValid) {
      return validation
    }

    const player = this.gameState.getPlayer(playerId)
    if (!player) {
      return {
        isValid: false,
        errors: [{ code: 'PLAYER_NOT_FOUND', message: 'Player not found' }],
        warnings: []
      }
    }

    // Check and use powerup
    const powerup = player.powerups.find(p => p.type === powerupType)
    if (!powerup) {
      return {
        isValid: false,
        errors: [{ code: 'POWERUP_NOT_FOUND', message: 'Powerup not found' }],
        warnings: []
      }
    }

    if (powerup.remainingUses <= 0) {
      return {
        isValid: false,
        errors: [{ code: 'NO_USES', message: 'No uses remaining' }],
        warnings: []
      }
    }

    if (powerup.currentCooldown > 0) {
      return {
        isValid: false,
        errors: [{ code: 'ON_COOLDOWN', message: 'Powerup on cooldown' }],
        warnings: []
      }
    }

    // Use the powerup
    powerup.remainingUses--
    powerup.currentCooldown = powerup.cooldown

    // Process powerup effects
    const results = this.processPowerupEffects(player, powerupType, targetArea)

    // Record combat action
    if (this.currentTurn) {
      this.currentTurn.actions.push({
        id: `action_${Date.now()}`,
        type: 'powerup',
        timestamp: new Date()
      })
    }

    return results
  }

  private processPowerupEffects(
    player: GamePlayer,
    powerupType: PowerupType,
    targetArea?: Coordinate[]
  ): ValidationResult {
    switch (powerupType) {
      case PowerupType.RADAR_SCAN:
        return this.processRadarScan(player, targetArea)
      case PowerupType.BARRAGE:
        return this.processBarrage(player, targetArea)
      case PowerupType.SONAR_PING:
        return this.processSonarPing(player, targetArea)
      default:
        return {
          isValid: false,
          errors: [{ code: 'UNKNOWN_POWERUP', message: 'Unknown powerup type' }],
          warnings: []
        }
    }
  }

  private processRadarScan(player: GamePlayer, targetArea?: Coordinate[]): ValidationResult {
    if (!targetArea || targetArea.length === 0) {
      return {
        isValid: false,
        errors: [{ code: 'NO_TARGET_AREA', message: 'Target area required for radar scan' }],
        warnings: []
      }
    }

    // Reveal cells in target area
    const opponent = this.getOpponent(player.id)
    if (opponent) {
      targetArea.forEach(coord => {
        const cell = opponent.board.cells[coord.y]?.[coord.x]
        if (cell) {
          cell.isRevealed = true
        }
      })
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  private processBarrage(player: GamePlayer, targetArea?: Coordinate[]): ValidationResult {
    if (!targetArea || targetArea.length !== 5) {
      return {
        isValid: false,
        errors: [{ code: 'INVALID_BARRAGE_AREA', message: 'Barrage requires 5 target coordinates' }],
        warnings: []
      }
    }

    const opponent = this.getOpponent(player.id)
    if (!opponent) {
      return {
        isValid: false,
        errors: [{ code: 'NO_OPPONENT', message: 'No opponent found' }],
        warnings: []
      }
    }

    // Process each barrage shot
    targetArea.forEach(coord => {
      this.processAttack(player.id, opponent.id, coord, 'normal')
    })

    return { isValid: true, errors: [], warnings: [] }
  }

  private processSonarPing(player: GamePlayer, targetArea?: Coordinate[]): ValidationResult {
    if (!targetArea || targetArea.length !== 1) {
      return {
        isValid: false,
        errors: [{ code: 'INVALID_SONAR_TARGET', message: 'Sonar requires single target coordinate' }],
        warnings: []
      }
    }

    const opponent = this.getOpponent(player.id)
    if (!opponent) {
      return {
        isValid: false,
        errors: [{ code: 'NO_OPPONENT', message: 'No opponent found' }],
        warnings: []
      }
    }

    // Check 3x3 area around target
    const center = targetArea[0]
    let shipDetected = false

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const coord = { x: center.x + dx, y: center.y + dy }
        const cell = opponent.board.cells[coord.y]?.[coord.x]
        if (cell?.hasShip) {
          shipDetected = true
          break
        }
      }
    }

    return {
      isValid: true,
      errors: [],
      warnings: shipDetected ? ['Ship detected in area'] : ['No ships in area']
    }
  }

  private getOpponent(playerId: string): GamePlayer | null {
    const state = this.gameState.getState()
    const opponent = state.players.find(p => p.id !== playerId)
    return opponent ? this.gameState.getPlayer(opponent.id) || null : null
  }

  // =============================================
  // SPECIAL ABILITIES
  // =============================================

  async processShipAbility(
    playerId: string,
    shipId: string,
    abilityId: string,
    targetData?: unknown
  ): Promise<ValidationResult> {
    if (!this.config.enableSpecialAbilities) {
      return {
        isValid: false,
        errors: [{ code: 'ABILITIES_DISABLED', message: 'Special abilities are disabled' }],
        warnings: []
      }
    }

    const player = this.gameState.getPlayer(playerId)
    if (!player) {
      return {
        isValid: false,
        errors: [{ code: 'PLAYER_NOT_FOUND', message: 'Player not found' }],
        warnings: []
      }
    }

    const ship = player.fleet.find(s => s.id === shipId)
    if (!ship) {
      return {
        isValid: false,
        errors: [{ code: 'SHIP_NOT_FOUND', message: 'Ship not found' }],
        warnings: []
      }
    }

    const opponent = this.getOpponent(playerId)

    // Use the new AbilityEngine to process the ability
    const result = await this.abilityEngine.activateAbility(
      shipId,
      abilityId,
      {
        ship,
        player,
        opponent: opponent || undefined,
        boardState: player.board,
        currentTurn: this.currentTurn?.turnNumber || 0,
        targetData: targetData ? { coordinates: targetData as Coordinate[] } : undefined
      }
    )

    // Record combat action if successful
    if (result.success && this.currentTurn) {
      this.currentTurn.actions.push({
        id: `action_${Date.now()}`,
        type: 'ability',
        timestamp: new Date()
      })
    }

    return {
      isValid: result.success,
      errors: result.errors?.map(e => ({ code: 'ABILITY_ERROR', message: e })) || [],
      warnings: result.messages || []
    }
  }

  // =============================================
  // STATISTICS
  // =============================================

  getCombatStatistics(playerId: string): CombatStatistics {
    const playerTurns = this.combatHistory.filter(t => t.attackerId === playerId)
    const attacks = playerTurns.flatMap(t => t.actions.filter(a => a.type === 'attack'))
    const hits = attacks.filter(a => a.result?.result !== MoveResult.MISS)

    const totalTurnTime = playerTurns.reduce(
      (sum, t) => sum + (t.endTime ? t.endTime.getTime() - t.startTime.getTime() : 0),
      0
    )

    return {
      totalShots: attacks.length,
      totalHits: hits.length,
      totalMisses: attacks.length - hits.length,
      shipsDestroyed: hits.filter(a => a.result?.shipSunk).length,
      damageDealt: hits.reduce((sum, a) => sum + (a.result?.damageDealt || 0), 0),
      powerupsUsed: playerTurns.flatMap(t => t.actions.filter(a => a.type === 'powerup')).length,
      accuracy: attacks.length > 0 ? (hits.length / attacks.length) * 100 : 0,
      averageTurnTime: playerTurns.length > 0 ? totalTurnTime / playerTurns.length : 0
    }
  }

  getCombatHistory(): readonly CombatTurn[] {
    return Object.freeze([...this.combatHistory])
  }

  getCurrentTurn(): CombatTurn | null {
    return this.currentTurn
  }
}
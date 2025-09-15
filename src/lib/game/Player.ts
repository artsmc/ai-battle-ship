/**
 * Player Class
 * Manages player entities, fleet management, and player statistics
 */

import { ShipClass, PowerupType, MoveResult } from '../database/types/enums'
import {
  GamePlayer,
  GameShip,
  PlayerStats,
  PlayerPowerup,
  BoardState,
  AILevel,
  ConnectionStatus,
  Coordinate,
  AttackResult,
  ValidationResult,
  ShipPosition
} from './types'

export class Player implements GamePlayer {
  public readonly id: string
  public readonly userId?: string
  public name: string
  public readonly isAI: boolean
  public readonly aiDifficulty?: AILevel
  public board: BoardState
  public fleet: GameShip[]
  public stats: PlayerStats
  public powerups: PlayerPowerup[]
  public isReady: boolean
  public isActive: boolean
  public connectionStatus: ConnectionStatus

  constructor(config: PlayerConfig) {
    this.id = config.id || this.generatePlayerId()
    this.userId = config.userId
    this.name = config.name
    this.isAI = config.isAI || false
    this.aiDifficulty = config.aiDifficulty
    this.board = this.initializeBoard(config.boardWidth, config.boardHeight)
    this.fleet = []
    this.stats = this.initializeStats()
    this.powerups = this.initializePowerups(config.allowPowerups)
    this.isReady = false
    this.isActive = true
    this.connectionStatus = 'connected'
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeBoard(width: number, height: number): BoardState {
    const cells = Array(height).fill(null).map((_, y) =>
      Array(width).fill(null).map((_, x) => ({
        coordinate: { x, y },
        hasShip: false,
        isHit: false,
        isRevealed: false
      }))
    )

    return {
      width,
      height,
      cells,
      ships: new Map(),
      hits: [],
      misses: []
    }
  }

  private initializeStats(): PlayerStats {
    return {
      shotsTotal: 0,
      shotsHit: 0,
      shotsMissed: 0,
      accuracy: 0,
      shipsRemaining: 0,
      shipsSunk: 0,
      damageDealt: 0,
      damageTaken: 0
    }
  }

  private initializePowerups(allowPowerups: boolean): PlayerPowerup[] {
    if (!allowPowerups) {
      return []
    }

    return [
      {
        type: PowerupType.RADAR_SCAN,
        uses: 3,
        remainingUses: 3,
        cooldown: 3,
        currentCooldown: 0
      },
      {
        type: PowerupType.BARRAGE,
        uses: 1,
        remainingUses: 1,
        cooldown: 5,
        currentCooldown: 0
      },
      {
        type: PowerupType.SONAR_PING,
        uses: 2,
        remainingUses: 2,
        cooldown: 4,
        currentCooldown: 0
      }
    ]
  }

  // =============================================
  // FLEET MANAGEMENT
  // =============================================

  addShip(ship: GameShip): ValidationResult {
    // Check if ship already exists
    if (this.fleet.find(s => s.id === ship.id)) {
      return {
        isValid: false,
        errors: [{
          code: 'SHIP_EXISTS',
          message: 'Ship already exists in fleet'
        }],
        warnings: []
      }
    }

    // Check fleet size limits
    const maxShips = this.getMaxShipsByClass(ship.class)
    const currentShips = this.fleet.filter(s => s.class === ship.class).length

    if (currentShips >= maxShips) {
      return {
        isValid: false,
        errors: [{
          code: 'MAX_SHIPS_EXCEEDED',
          message: `Maximum number of ${ship.class} ships exceeded`
        }],
        warnings: []
      }
    }

    ship.playerId = this.id
    this.fleet.push(ship)
    this.stats.shipsRemaining++

    return { isValid: true, errors: [], warnings: [] }
  }

  removeShip(shipId: string): boolean {
    const index = this.fleet.findIndex(s => s.id === shipId)
    if (index === -1) {
      return false
    }

    const ship = this.fleet[index]

    // Remove from board if placed
    if (ship.position) {
      this.board.ships.delete(shipId)
      ship.position.coordinates.forEach(coord => {
        const cell = this.board.cells[coord.y]?.[coord.x]
        if (cell) {
          cell.hasShip = false
          cell.shipId = undefined
        }
      })
    }

    this.fleet.splice(index, 1)
    this.stats.shipsRemaining--
    return true
  }

  placeShip(shipId: string, position: ShipPosition): ValidationResult {
    const ship = this.fleet.find(s => s.id === shipId)
    if (!ship) {
      return {
        isValid: false,
        errors: [{
          code: 'SHIP_NOT_FOUND',
          message: 'Ship not found in fleet'
        }],
        warnings: []
      }
    }

    // Validate position
    const validation = this.validateShipPlacement(ship, position)
    if (!validation.isValid) {
      return validation
    }

    // Place ship on board
    ship.position = position
    this.board.ships.set(shipId, position)

    position.coordinates.forEach(coord => {
      const cell = this.board.cells[coord.y][coord.x]
      cell.hasShip = true
      cell.shipId = shipId
    })

    return { isValid: true, errors: [], warnings: [] }
  }

  private validateShipPlacement(ship: GameShip, position: ShipPosition): ValidationResult {
    const errors = []

    // Check if all coordinates are within bounds
    for (const coord of position.coordinates) {
      if (coord.x < 0 || coord.x >= this.board.width ||
          coord.y < 0 || coord.y >= this.board.height) {
        errors.push({
          code: 'OUT_OF_BOUNDS',
          message: `Coordinate (${coord.x}, ${coord.y}) is out of bounds`
        })
      }
    }

    // Check for overlaps with existing ships
    for (const coord of position.coordinates) {
      const cell = this.board.cells[coord.y]?.[coord.x]
      if (cell?.hasShip && cell.shipId !== ship.id) {
        errors.push({
          code: 'OVERLAP',
          message: `Position (${coord.x}, ${coord.y}) is already occupied`
        })
      }
    }

    // Check if coordinates match ship size
    if (position.coordinates.length !== ship.size) {
      errors.push({
        code: 'SIZE_MISMATCH',
        message: `Ship size (${ship.size}) doesn't match coordinates (${position.coordinates.length})`
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private getMaxShipsByClass(shipClass: ShipClass): number {
    switch (shipClass) {
      case ShipClass.CARRIER:
        return 1
      case ShipClass.BATTLESHIP:
        return 1
      case ShipClass.HEAVY_CRUISER:
      case ShipClass.LIGHT_CRUISER:
        return 2
      case ShipClass.DESTROYER:
        return 3
      case ShipClass.SUBMARINE:
        return 2
      default:
        return 1
    }
  }

  // =============================================
  // COMBAT MANAGEMENT
  // =============================================

  recordShot(coordinate: Coordinate, hit: boolean): void {
    this.stats.shotsTotal++

    if (hit) {
      this.stats.shotsHit++
      this.board.hits.push(coordinate)
    } else {
      this.stats.shotsMissed++
      this.board.misses.push(coordinate)
    }

    this.stats.accuracy = this.stats.shotsTotal > 0
      ? (this.stats.shotsHit / this.stats.shotsTotal) * 100
      : 0
  }

  receiveAttack(coordinate: Coordinate): AttackResult {
    const cell = this.board.cells[coordinate.y]?.[coordinate.x]

    if (!cell) {
      return {
        coordinate,
        result: MoveResult.MISS,
        damageDealt: 0
      }
    }

    if (cell.isHit) {
      return {
        coordinate,
        result: MoveResult.MISS,
        damageDealt: 0
      }
    }

    cell.isHit = true
    cell.hitAt = new Date()

    if (!cell.hasShip || !cell.shipId) {
      return {
        coordinate,
        result: MoveResult.MISS,
        damageDealt: 0
      }
    }

    // Hit a ship
    const ship = this.fleet.find(s => s.id === cell.shipId)
    if (!ship) {
      return {
        coordinate,
        result: MoveResult.MISS,
        damageDealt: 0
      }
    }

    // Record damage
    ship.damage.hitPositions.push(coordinate)
    ship.damage.totalHits++
    ship.hitPoints = Math.max(0, ship.hitPoints - 1)
    this.stats.damageTaken++

    // Check if ship is sunk
    if (ship.hitPoints === 0 && !ship.damage.isSunk) {
      ship.damage.isSunk = true
      ship.damage.sunkAt = new Date()
      this.stats.shipsRemaining--
      this.stats.shipsSunk++

      return {
        coordinate,
        result: MoveResult.SUNK,
        shipHit: ship.id,
        shipSunk: true,
        shipType: ship.name,
        damageDealt: 1
      }
    }

    return {
      coordinate,
      result: MoveResult.HIT,
      shipHit: ship.id,
      shipSunk: false,
      damageDealt: 1
    }
  }

  // =============================================
  // POWERUP MANAGEMENT
  // =============================================

  usePowerup(powerupType: PowerupType): ValidationResult {
    const powerup = this.powerups.find(p => p.type === powerupType)

    if (!powerup) {
      return {
        isValid: false,
        errors: [{
          code: 'POWERUP_NOT_FOUND',
          message: 'Powerup not available'
        }],
        warnings: []
      }
    }

    if (powerup.remainingUses <= 0) {
      return {
        isValid: false,
        errors: [{
          code: 'NO_USES_REMAINING',
          message: 'No uses remaining for this powerup'
        }],
        warnings: []
      }
    }

    if (powerup.currentCooldown > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'ON_COOLDOWN',
          message: `Powerup on cooldown for ${powerup.currentCooldown} more turns`
        }],
        warnings: []
      }
    }

    powerup.remainingUses--
    powerup.currentCooldown = powerup.cooldown

    return { isValid: true, errors: [], warnings: [] }
  }

  updatePowerupCooldowns(): void {
    this.powerups.forEach(powerup => {
      if (powerup.currentCooldown > 0) {
        powerup.currentCooldown--
      }
    })
  }

  // =============================================
  // STATUS MANAGEMENT
  // =============================================

  setReady(ready: boolean): void {
    this.isReady = ready
  }

  setActive(active: boolean): void {
    this.isActive = active
  }

  setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
  }

  isDefeated(): boolean {
    return this.stats.shipsRemaining === 0
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  resetBoard(): void {
    this.board = this.initializeBoard(this.board.width, this.board.height)
    this.fleet.forEach(ship => {
      ship.position = undefined
      ship.damage = {
        hitPositions: [],
        totalHits: 0,
        isSunk: false
      }
      ship.hitPoints = ship.maxHitPoints
    })
    this.stats = this.initializeStats()
    this.stats.shipsRemaining = this.fleet.length
  }

  getFleetStatus(): FleetStatus {
    const totalShips = this.fleet.length
    const shipsAlive = this.fleet.filter(s => !s.damage.isSunk).length
    const shipsSunk = totalShips - shipsAlive
    const totalHealth = this.fleet.reduce((sum, s) => sum + s.maxHitPoints, 0)
    const currentHealth = this.fleet.reduce((sum, s) => sum + s.hitPoints, 0)

    return {
      totalShips,
      shipsAlive,
      shipsSunk,
      healthPercentage: totalHealth > 0 ? (currentHealth / totalHealth) * 100 : 0
    }
  }

  toJSON(): GamePlayer {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      isAI: this.isAI,
      aiDifficulty: this.aiDifficulty,
      board: this.board,
      fleet: this.fleet,
      stats: this.stats,
      powerups: this.powerups,
      isReady: this.isReady,
      isActive: this.isActive,
      connectionStatus: this.connectionStatus
    }
  }
}

// =============================================
// TYPES
// =============================================

export interface PlayerConfig {
  id?: string
  userId?: string
  name: string
  isAI?: boolean
  aiDifficulty?: AILevel
  boardWidth: number
  boardHeight: number
  allowPowerups: boolean
}

export interface FleetStatus {
  totalShips: number
  shipsAlive: number
  shipsSunk: number
  healthPercentage: number
}
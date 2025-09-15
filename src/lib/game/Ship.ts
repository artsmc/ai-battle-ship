/**
 * Ship Class
 * Manages ship entities with positioning, health, and damage tracking
 */

import { ShipClass } from '../database/types/enums'
import { ShipType as DatabaseShipType } from '../database/types/ship'
import {
  GameShip,
  ShipPosition,
  ShipDamage,
  ShipAbility,
  Coordinate,
  Orientation,
  ValidationResult
} from './types'

export class Ship implements GameShip {
  public readonly id: string
  public readonly typeId: string
  public readonly name: string
  public readonly class: ShipClass
  public readonly size: number
  public position?: ShipPosition
  public damage: ShipDamage
  public hitPoints: number
  public readonly maxHitPoints: number
  public abilities: ShipAbility[]
  public playerId: string

  // Additional properties for advanced features
  private readonly armorRating: number
  private readonly maneuverability: number
  private readonly detectionRange: number

  constructor(config: ShipConfig) {
    this.id = config.id || this.generateShipId()
    this.typeId = config.typeId
    this.name = config.name
    this.class = config.class
    this.size = config.size
    this.maxHitPoints = config.hitPoints || config.size
    this.hitPoints = this.maxHitPoints
    this.position = undefined
    this.damage = this.initializeDamage()
    this.abilities = config.abilities || []
    this.playerId = config.playerId || ''

    // Advanced properties
    this.armorRating = config.armorRating || 1
    this.maneuverability = config.maneuverability || 1
    this.detectionRange = config.detectionRange || 3
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private generateShipId(): string {
    return `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeDamage(): ShipDamage {
    return {
      hitPositions: [],
      totalHits: 0,
      isSunk: false,
      sunkAt: undefined
    }
  }

  // =============================================
  // POSITIONING
  // =============================================

  setPosition(startCoordinate: Coordinate, orientation: Orientation): ValidationResult {
    const coordinates = this.calculateCoordinates(startCoordinate, orientation)

    if (coordinates.length !== this.size) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_POSITION',
          message: 'Invalid position for ship size'
        }],
        warnings: []
      }
    }

    this.position = {
      shipId: this.id,
      coordinates,
      orientation,
      startPosition: startCoordinate
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  private calculateCoordinates(start: Coordinate, orientation: Orientation): Coordinate[] {
    const coordinates: Coordinate[] = []

    for (let i = 0; i < this.size; i++) {
      if (orientation === 'horizontal') {
        coordinates.push({ x: start.x + i, y: start.y })
      } else {
        coordinates.push({ x: start.x, y: start.y + i })
      }
    }

    return coordinates
  }

  clearPosition(): void {
    this.position = undefined
  }

  isPositioned(): boolean {
    return this.position !== undefined
  }

  occupiesCoordinate(coordinate: Coordinate): boolean {
    if (!this.position) {
      return false
    }

    return this.position.coordinates.some(
      coord => coord.x === coordinate.x && coord.y === coordinate.y
    )
  }

  // =============================================
  // DAMAGE MANAGEMENT
  // =============================================

  takeDamage(coordinate: Coordinate, damageAmount: number = 1): DamageResult {
    if (!this.occupiesCoordinate(coordinate)) {
      return {
        success: false,
        damage: 0,
        isSunk: false,
        message: 'Coordinate not occupied by ship'
      }
    }

    // Check if already hit at this position
    const alreadyHit = this.damage.hitPositions.some(
      pos => pos.x === coordinate.x && pos.y === coordinate.y
    )

    if (alreadyHit) {
      return {
        success: false,
        damage: 0,
        isSunk: false,
        message: 'Position already hit'
      }
    }

    // Apply armor reduction
    const actualDamage = Math.max(1, damageAmount - (this.armorRating - 1))

    // Record the hit
    this.damage.hitPositions.push(coordinate)
    this.damage.totalHits++
    this.hitPoints = Math.max(0, this.hitPoints - actualDamage)

    // Check if ship is sunk
    if (this.hitPoints === 0 && !this.damage.isSunk) {
      this.damage.isSunk = true
      this.damage.sunkAt = new Date()
      this.disableAllAbilities()

      return {
        success: true,
        damage: actualDamage,
        isSunk: true,
        message: `${this.name} has been sunk!`
      }
    }

    return {
      success: true,
      damage: actualDamage,
      isSunk: false,
      message: `Hit on ${this.name}`
    }
  }

  repair(amount: number): number {
    if (this.damage.isSunk) {
      return 0
    }

    const previousHealth = this.hitPoints
    this.hitPoints = Math.min(this.maxHitPoints, this.hitPoints + amount)
    return this.hitPoints - previousHealth
  }

  getDamagePercentage(): number {
    return ((this.maxHitPoints - this.hitPoints) / this.maxHitPoints) * 100
  }

  getHealthPercentage(): number {
    return (this.hitPoints / this.maxHitPoints) * 100
  }

  isCriticallyDamaged(): boolean {
    return this.getHealthPercentage() <= 25
  }

  // =============================================
  // ABILITY MANAGEMENT
  // =============================================

  useAbility(abilityId: string): ValidationResult {
    const ability = this.abilities.find(a => a.id === abilityId)

    if (!ability) {
      return {
        isValid: false,
        errors: [{
          code: 'ABILITY_NOT_FOUND',
          message: 'Ability not found'
        }],
        warnings: []
      }
    }

    if (!ability.isActive) {
      return {
        isValid: false,
        errors: [{
          code: 'ABILITY_DISABLED',
          message: 'Ability is disabled'
        }],
        warnings: []
      }
    }

    if (ability.currentCooldown > 0) {
      return {
        isValid: false,
        errors: [{
          code: 'ABILITY_ON_COOLDOWN',
          message: `Ability on cooldown for ${ability.currentCooldown} turns`
        }],
        warnings: []
      }
    }

    if (ability.remainingUses <= 0) {
      return {
        isValid: false,
        errors: [{
          code: 'NO_USES_REMAINING',
          message: 'No uses remaining for this ability'
        }],
        warnings: []
      }
    }

    // Use the ability
    ability.remainingUses--
    ability.currentCooldown = ability.cooldown

    return { isValid: true, errors: [], warnings: [] }
  }

  updateAbilityCooldowns(): void {
    this.abilities.forEach(ability => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown--
      }
    })
  }

  private disableAllAbilities(): void {
    this.abilities.forEach(ability => {
      ability.isActive = false
    })
  }

  resetAbilities(): void {
    this.abilities.forEach(ability => {
      ability.currentCooldown = 0
      ability.remainingUses = ability.uses
      ability.isActive = true
    })
  }

  // =============================================
  // SPECIAL FEATURES
  // =============================================

  getDetectionRadius(): number {
    // Reduced detection when critically damaged
    if (this.isCriticallyDamaged()) {
      return Math.max(1, Math.floor(this.detectionRange * 0.5))
    }
    return this.detectionRange
  }

  getManeuverabilityBonus(): number {
    // Reduced maneuverability when damaged
    const healthPercentage = this.getHealthPercentage()
    return this.maneuverability * (healthPercentage / 100)
  }

  canEvade(): boolean {
    return this.getManeuverabilityBonus() > Math.random()
  }

  // =============================================
  // STATE MANAGEMENT
  // =============================================

  reset(): void {
    this.position = undefined
    this.damage = this.initializeDamage()
    this.hitPoints = this.maxHitPoints
    this.resetAbilities()
  }

  clone(): Ship {
    const cloned = new Ship({
      id: this.generateShipId(),
      typeId: this.typeId,
      name: this.name,
      class: this.class,
      size: this.size,
      hitPoints: this.maxHitPoints,
      abilities: this.abilities.map(a => ({ ...a })),
      playerId: this.playerId,
      armorRating: this.armorRating,
      maneuverability: this.maneuverability,
      detectionRange: this.detectionRange
    })

    if (this.position) {
      cloned.position = {
        ...this.position,
        coordinates: [...this.position.coordinates]
      }
    }

    return cloned
  }

  // =============================================
  // SERIALIZATION
  // =============================================

  toJSON(): GameShip {
    return {
      id: this.id,
      typeId: this.typeId,
      name: this.name,
      class: this.class,
      size: this.size,
      position: this.position,
      damage: this.damage,
      hitPoints: this.hitPoints,
      maxHitPoints: this.maxHitPoints,
      abilities: this.abilities,
      playerId: this.playerId
    }
  }

  static fromDatabaseType(shipType: DatabaseShipType, playerId: string): Ship {
    const abilities: ShipAbility[] = shipType.special_abilities.map((ability, index) => ({
      id: `ability_${index}`,
      name: ability.name,
      description: ability.description,
      cooldown: ability.cooldown || 3,
      currentCooldown: 0,
      uses: ability.uses || 3,
      remainingUses: ability.uses || 3,
      isActive: true
    }))

    return new Ship({
      typeId: shipType.id,
      name: shipType.name,
      class: shipType.class,
      size: shipType.size,
      hitPoints: shipType.hit_points,
      abilities,
      playerId,
      armorRating: shipType.armor_rating,
      maneuverability: shipType.maneuverability,
      detectionRange: shipType.detection_range
    })
  }
}

// =============================================
// TYPES
// =============================================

export interface ShipConfig {
  id?: string
  typeId: string
  name: string
  class: ShipClass
  size: number
  hitPoints?: number
  abilities?: ShipAbility[]
  playerId?: string
  armorRating?: number
  maneuverability?: number
  detectionRange?: number
}

export interface DamageResult {
  success: boolean
  damage: number
  isSunk: boolean
  message: string
}
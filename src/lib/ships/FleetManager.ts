/**
 * Fleet Manager Module
 * Fleet composition management and point-based balancing system
 */

import { ShipClass, ShipEra } from '../database/types/enums'
import { ShipType } from '../database/types/ship'
import { Ship } from '../game/Ship'
import { ShipStatCalculator, ShipStatistics } from './ShipClasses'
import { HistoricalPeriods } from './ShipTypes'
import { FleetRules, DefaultFleetRules, FleetValidator } from './FleetRules'

// Re-export types
export { FleetRules, DefaultFleetRules } from './FleetRules'

/**
 * Fleet Configuration
 */
export interface FleetConfig {
  id: string
  name: string
  era: ShipEra
  totalPoints: number
  maxShips: number
  ships: FleetShip[]
  isValid: boolean
  validationErrors: string[]
}

/**
 * Fleet Ship Entry
 */
export interface FleetShip {
  shipTypeId: string
  shipClass: ShipClass
  shipEra: ShipEra
  pointValue: number
  quantity: number
  ship?: Ship
}

/**
 * Validation Result
 */
export interface ValidationResult {
  success: boolean
  errors: string[]
}

/**
 * Fleet Summary
 */
export interface FleetSummary {
  fleetId: string
  fleetName: string
  totalPoints: number
  totalShips: number
  primaryEra: ShipEra
  classBreakdown: Record<string, number>
  eraBreakdown: Record<string, number>
  isValid: boolean
  validationErrors: string[]
}

/**
 * Fleet Manager Class
 */
export class FleetManager {
  private fleet: FleetConfig
  private rules: FleetRules
  private shipTypes: Map<string, ShipType>

  constructor(rules: FleetRules = DefaultFleetRules.STANDARD) {
    this.rules = rules
    this.shipTypes = new Map()
    this.fleet = this.createEmptyFleet()
  }

  /**
   * Create an empty fleet configuration
   */
  private createEmptyFleet(): FleetConfig {
    return {
      id: this.generateFleetId(),
      name: 'New Fleet',
      era: ShipEra.MODERN,
      totalPoints: 0,
      maxShips: this.rules.maxShips,
      ships: [],
      isValid: false,
      validationErrors: []
    }
  }

  /**
   * Generate unique fleet ID
   */
  private generateFleetId(): string {
    return `fleet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set available ship types
   */
  setShipTypes(shipTypes: ShipType[]): void {
    this.shipTypes.clear()
    shipTypes.forEach(ship => {
      this.shipTypes.set(ship.id, ship)
    })
  }

  /**
   * Add ship to fleet
   */
  addShip(shipTypeId: string, quantity: number = 1): ValidationResult {
    const shipType = this.shipTypes.get(shipTypeId)
    if (!shipType) {
      return {
        success: false,
        errors: ['Ship type not found']
      }
    }

    // Check if ship already exists in fleet
    const existingShip = this.fleet.ships.find(s => s.shipTypeId === shipTypeId)
    if (existingShip) {
      existingShip.quantity += quantity
    } else {
      // Calculate point value
      const stats = this.calculateShipStats(shipType)
      const pointValue = ShipStatCalculator.calculatePointValue(
        shipType.class,
        shipType.era,
        stats
      )

      this.fleet.ships.push({
        shipTypeId,
        shipClass: shipType.class,
        shipEra: shipType.era,
        pointValue,
        quantity
      })
    }

    // Validate fleet after addition
    return this.validateFleet()
  }

  /**
   * Remove ship from fleet
   */
  removeShip(shipTypeId: string, quantity: number = 1): ValidationResult {
    const shipIndex = this.fleet.ships.findIndex(s => s.shipTypeId === shipTypeId)
    if (shipIndex === -1) {
      return {
        success: false,
        errors: ['Ship not found in fleet']
      }
    }

    const ship = this.fleet.ships[shipIndex]
    if (ship.quantity <= quantity) {
      this.fleet.ships.splice(shipIndex, 1)
    } else {
      ship.quantity -= quantity
    }

    return this.validateFleet()
  }

  /**
   * Set fleet era
   */
  setFleetEra(era: ShipEra): ValidationResult {
    this.fleet.era = era

    // Merge with era-specific rules
    this.rules = FleetValidator.mergeWithEraRules(this.rules, era)

    // Remove ships that don't belong to this era if mixed eras not allowed
    if (!this.rules.allowMixedEras) {
      this.fleet.ships = this.fleet.ships.filter(ship => ship.shipEra === era)
    }

    return this.validateFleet()
  }

  /**
   * Validate fleet composition
   */
  validateFleet(): ValidationResult {
    const errors: string[] = []

    // Calculate totals
    let totalPoints = 0
    let totalShips = 0
    const classCounts = new Map<ShipClass, number>()
    const shipEras: ShipEra[] = []
    const fleetClasses: ShipClass[] = []

    this.fleet.ships.forEach(ship => {
      totalPoints += ship.pointValue * ship.quantity
      totalShips += ship.quantity

      const current = classCounts.get(ship.shipClass) || 0
      classCounts.set(ship.shipClass, current + ship.quantity)

      for (let i = 0; i < ship.quantity; i++) {
        shipEras.push(ship.shipEra)
        fleetClasses.push(ship.shipClass)
      }
    })

    this.fleet.totalPoints = totalPoints

    // Run validations
    errors.push(...FleetValidator.validatePoints(totalPoints, this.rules))
    errors.push(...FleetValidator.validateShipCount(totalShips, this.rules))
    errors.push(...FleetValidator.validateEraConsistency(shipEras, this.rules))
    errors.push(...FleetValidator.validateClassRequirements(fleetClasses, this.rules))
    errors.push(...FleetValidator.validateComposition(classCounts, this.rules))

    // Update fleet validation status
    this.fleet.isValid = errors.length === 0
    this.fleet.validationErrors = errors

    return {
      success: this.fleet.isValid,
      errors
    }
  }

  /**
   * Auto-balance fleet to target points
   */
  autoBalance(targetPoints: number): ValidationResult {
    const tolerance = 5 // Allow 5 points variance

    // Remove ships if over budget
    while (this.fleet.totalPoints > targetPoints + tolerance && this.fleet.ships.length > 0) {
      // Remove the most expensive ship
      const mostExpensive = this.fleet.ships.reduce((prev, current) =>
        prev.pointValue > current.pointValue ? prev : current
      )

      if (mostExpensive.quantity > 1) {
        mostExpensive.quantity--
      } else {
        const index = this.fleet.ships.indexOf(mostExpensive)
        this.fleet.ships.splice(index, 1)
      }

      this.validateFleet()
    }

    // Add ships if under budget
    if (this.fleet.totalPoints < targetPoints - tolerance) {
      const remainingPoints = targetPoints - this.fleet.totalPoints
      const affordableShips = this.getAffordableShips(remainingPoints)

      // Add random affordable ships
      while (this.fleet.totalPoints < targetPoints - tolerance && affordableShips.length > 0) {
        const randomShip = affordableShips[Math.floor(Math.random() * affordableShips.length)]
        this.addShip(randomShip.id, 1)

        // Recalculate affordable ships
        const newRemaining = targetPoints - this.fleet.totalPoints
        affordableShips.length = 0
        affordableShips.push(...this.getAffordableShips(newRemaining))
      }
    }

    return this.validateFleet()
  }

  /**
   * Get ships that fit within point budget
   */
  private getAffordableShips(maxPoints: number): ShipType[] {
    const affordable: ShipType[] = []

    this.shipTypes.forEach(shipType => {
      const stats = this.calculateShipStats(shipType)
      const points = ShipStatCalculator.calculatePointValue(
        shipType.class,
        shipType.era,
        stats
      )

      if (points <= maxPoints) {
        affordable.push(shipType)
      }
    })

    return affordable
  }

  /**
   * Calculate ship statistics
   */
  private calculateShipStats(shipType: ShipType): ShipStatistics {
    return {
      armor: shipType.armor_rating,
      firepower: shipType.firepower_rating,
      accuracy: 7, // Default accuracy
      speed: Math.round((shipType.max_speed_knots || 20) / 5),
      maneuverability: shipType.maneuverability,
      detection: shipType.detection_range,
      stealth: 5, // Default stealth
      hitPoints: shipType.hit_points,
      criticalThreshold: 30, // Default threshold
      specialAbilitySlots: shipType.special_abilities.length
    }
  }


  /**
   * Get fleet summary
   */
  getFleetSummary(): FleetSummary {
    const classBreakdown = new Map<ShipClass, number>()
    const eraBreakdown = new Map<ShipEra, number>()

    this.fleet.ships.forEach(ship => {
      classBreakdown.set(ship.shipClass, (classBreakdown.get(ship.shipClass) || 0) + ship.quantity)
      eraBreakdown.set(ship.shipEra, (eraBreakdown.get(ship.shipEra) || 0) + ship.quantity)
    })

    return {
      fleetId: this.fleet.id,
      fleetName: this.fleet.name,
      totalPoints: this.fleet.totalPoints,
      totalShips: this.fleet.ships.reduce((sum, ship) => sum + ship.quantity, 0),
      primaryEra: this.fleet.era,
      classBreakdown: Object.fromEntries(classBreakdown),
      eraBreakdown: Object.fromEntries(eraBreakdown),
      isValid: this.fleet.isValid,
      validationErrors: this.fleet.validationErrors
    }
  }

  /**
   * Export fleet configuration
   */
  exportFleet(): FleetConfig {
    return { ...this.fleet }
  }

  /**
   * Import fleet configuration
   */
  importFleet(config: FleetConfig): ValidationResult {
    this.fleet = { ...config }
    return this.validateFleet()
  }
}
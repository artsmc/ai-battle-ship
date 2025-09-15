/**
 * Fleet Rules Module
 * Fleet rules configuration and validation logic
 */

import { ShipClass, ShipEra } from '../database/types/enums'
import { FleetCompositionRule } from './ShipTypes'

/**
 * Fleet Rules Configuration
 */
export interface FleetRules {
  minPoints: number
  maxPoints: number
  minShips: number
  maxShips: number
  allowMixedEras: boolean
  requiredClasses?: ShipClass[]
  bannedClasses?: ShipClass[]
  compositionRules?: FleetCompositionRule[]
}

/**
 * Default Fleet Rules by Game Mode
 */
export const DefaultFleetRules: Record<string, FleetRules> = {
  STANDARD: {
    minPoints: 100,
    maxPoints: 200,
    minShips: 5,
    maxShips: 10,
    allowMixedEras: false
  },
  HISTORICAL: {
    minPoints: 150,
    maxPoints: 250,
    minShips: 8,
    maxShips: 15,
    allowMixedEras: false
  },
  UNLIMITED: {
    minPoints: 50,
    maxPoints: 500,
    minShips: 3,
    maxShips: 20,
    allowMixedEras: true
  },
  TOURNAMENT: {
    minPoints: 175,
    maxPoints: 175, // Exact point match
    minShips: 7,
    maxShips: 12,
    allowMixedEras: false
  },
  SKIRMISH: {
    minPoints: 50,
    maxPoints: 100,
    minShips: 3,
    maxShips: 6,
    allowMixedEras: false
  },
  GRAND_BATTLE: {
    minPoints: 300,
    maxPoints: 500,
    minShips: 15,
    maxShips: 25,
    allowMixedEras: true
  }
}

/**
 * Era-specific Fleet Rules
 */
export const EraFleetRules: Record<ShipEra, Partial<FleetRules>> = {
  [ShipEra.PRE_DREADNOUGHT]: {
    bannedClasses: [ShipClass.CARRIER, ShipClass.SUBMARINE],
    compositionRules: [
      { class: ShipClass.BATTLESHIP, min: 1, max: 4 },
      { class: ShipClass.HEAVY_CRUISER, min: 1, max: 4 },
      { class: ShipClass.DESTROYER, min: 2, max: 8 }
    ]
  },
  [ShipEra.DREADNOUGHT]: {
    bannedClasses: [ShipClass.CARRIER],
    compositionRules: [
      { class: ShipClass.BATTLESHIP, min: 1, max: 3 },
      { class: ShipClass.BATTLECRUISER, min: 0, max: 2 },
      { class: ShipClass.DESTROYER, min: 3, max: 10 }
    ]
  },
  [ShipEra.SUPER_DREADNOUGHT]: {
    compositionRules: [
      { class: ShipClass.BATTLESHIP, min: 0, max: 3 },
      { class: ShipClass.HEAVY_CRUISER, min: 1, max: 4 },
      { class: ShipClass.DESTROYER, min: 4, max: 12 },
      { class: ShipClass.SUBMARINE, min: 0, max: 4 }
    ]
  },
  [ShipEra.BATTLECRUISER]: {
    requiredClasses: [ShipClass.BATTLECRUISER],
    compositionRules: [
      { class: ShipClass.BATTLECRUISER, min: 1, max: 3 },
      { class: ShipClass.LIGHT_CRUISER, min: 2, max: 4 },
      { class: ShipClass.DESTROYER, min: 4, max: 8 }
    ]
  },
  [ShipEra.MODERN]: {
    compositionRules: [
      { class: ShipClass.CARRIER, min: 0, max: 2 },
      { class: ShipClass.DESTROYER, min: 2, max: 8 },
      { class: ShipClass.SUBMARINE, min: 0, max: 3 },
      { class: ShipClass.FRIGATE, min: 0, max: 4 }
    ]
  },
  [ShipEra.FICTIONAL]: {
    // No specific restrictions for fictional era
  }
}

/**
 * Fleet Validation Rules
 */
export class FleetValidator {
  /**
   * Validate fleet points
   */
  static validatePoints(totalPoints: number, rules: FleetRules): string[] {
    const errors: string[] = []

    if (totalPoints < rules.minPoints) {
      errors.push(`Fleet must have at least ${rules.minPoints} points (current: ${totalPoints})`)
    }
    if (totalPoints > rules.maxPoints) {
      errors.push(`Fleet cannot exceed ${rules.maxPoints} points (current: ${totalPoints})`)
    }

    return errors
  }

  /**
   * Validate ship count
   */
  static validateShipCount(totalShips: number, rules: FleetRules): string[] {
    const errors: string[] = []

    if (totalShips < rules.minShips) {
      errors.push(`Fleet must have at least ${rules.minShips} ships (current: ${totalShips})`)
    }
    if (totalShips > rules.maxShips) {
      errors.push(`Fleet cannot exceed ${rules.maxShips} ships (current: ${totalShips})`)
    }

    return errors
  }

  /**
   * Validate era consistency
   */
  static validateEraConsistency(
    shipEras: ShipEra[],
    rules: FleetRules
  ): string[] {
    const errors: string[] = []

    if (!rules.allowMixedEras) {
      const uniqueEras = new Set(shipEras)
      if (uniqueEras.size > 1) {
        errors.push('Mixed era fleets are not allowed in this game mode')
      }
    }

    return errors
  }

  /**
   * Validate class requirements
   */
  static validateClassRequirements(
    fleetClasses: ShipClass[],
    rules: FleetRules
  ): string[] {
    const errors: string[] = []
    const uniqueClasses = new Set(fleetClasses)

    // Check required classes
    if (rules.requiredClasses) {
      rules.requiredClasses.forEach(requiredClass => {
        if (!uniqueClasses.has(requiredClass)) {
          errors.push(`Fleet must contain at least one ${requiredClass}`)
        }
      })
    }

    // Check banned classes
    if (rules.bannedClasses) {
      fleetClasses.forEach(shipClass => {
        if (rules.bannedClasses?.includes(shipClass)) {
          errors.push(`${shipClass} is not allowed in this game mode`)
        }
      })
    }

    return errors
  }

  /**
   * Validate composition rules
   */
  static validateComposition(
    classCounts: Map<ShipClass, number>,
    rules: FleetRules
  ): string[] {
    const errors: string[] = []

    if (rules.compositionRules) {
      rules.compositionRules.forEach(rule => {
        const count = classCounts.get(rule.class) || 0
        if (count < rule.min) {
          errors.push(`Fleet must have at least ${rule.min} ${rule.class} ships (current: ${count})`)
        }
        if (count > rule.max) {
          errors.push(`Fleet cannot have more than ${rule.max} ${rule.class} ships (current: ${count})`)
        }
      })
    }

    return errors
  }

  /**
   * Merge fleet rules with era-specific rules
   */
  static mergeWithEraRules(baseRules: FleetRules, era: ShipEra): FleetRules {
    const eraRules = EraFleetRules[era]

    return {
      ...baseRules,
      requiredClasses: eraRules.requiredClasses || baseRules.requiredClasses,
      bannedClasses: eraRules.bannedClasses || baseRules.bannedClasses,
      compositionRules: eraRules.compositionRules || baseRules.compositionRules
    }
  }
}
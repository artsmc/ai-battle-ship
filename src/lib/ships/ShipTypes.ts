/**
 * Ship Types Module
 * Historical ship classifications and hierarchies for the Battleship Naval Strategy Game
 */

import { ShipClass, ShipEra } from '../database/types/enums'
import { ShipType } from '../database/types/ship'

/**
 * Ship Classification Hierarchy
 * Defines the relationship between ship eras and classes
 */
export const ShipClassHierarchy = {
  [ShipEra.PRE_DREADNOUGHT]: {
    availableClasses: [
      ShipClass.BATTLESHIP,
      ShipClass.HEAVY_CRUISER,
      ShipClass.LIGHT_CRUISER,
      ShipClass.DESTROYER
    ],
    characteristics: {
      armorRange: { min: 2, max: 4 },
      speedRange: { min: 12, max: 18 },
      firepowerRange: { min: 2, max: 4 },
      yearRange: { min: 1870, max: 1905 }
    }
  },
  [ShipEra.DREADNOUGHT]: {
    availableClasses: [
      ShipClass.BATTLESHIP,
      ShipClass.BATTLECRUISER,
      ShipClass.HEAVY_CRUISER,
      ShipClass.LIGHT_CRUISER,
      ShipClass.DESTROYER
    ],
    characteristics: {
      armorRange: { min: 3, max: 6 },
      speedRange: { min: 18, max: 23 },
      firepowerRange: { min: 4, max: 7 },
      yearRange: { min: 1906, max: 1919 }
    }
  },
  [ShipEra.SUPER_DREADNOUGHT]: {
    availableClasses: [
      ShipClass.BATTLESHIP,
      ShipClass.BATTLECRUISER,
      ShipClass.HEAVY_CRUISER,
      ShipClass.LIGHT_CRUISER,
      ShipClass.DESTROYER,
      ShipClass.SUBMARINE
    ],
    characteristics: {
      armorRange: { min: 5, max: 8 },
      speedRange: { min: 21, max: 28 },
      firepowerRange: { min: 6, max: 10 },
      yearRange: { min: 1920, max: 1945 }
    }
  },
  [ShipEra.BATTLECRUISER]: {
    availableClasses: [
      ShipClass.BATTLECRUISER,
      ShipClass.HEAVY_CRUISER,
      ShipClass.LIGHT_CRUISER,
      ShipClass.DESTROYER
    ],
    characteristics: {
      armorRange: { min: 3, max: 5 },
      speedRange: { min: 25, max: 32 },
      firepowerRange: { min: 5, max: 8 },
      yearRange: { min: 1908, max: 1945 }
    }
  },
  [ShipEra.MODERN]: {
    availableClasses: [
      ShipClass.CARRIER,
      ShipClass.BATTLESHIP,
      ShipClass.HEAVY_CRUISER,
      ShipClass.LIGHT_CRUISER,
      ShipClass.DESTROYER,
      ShipClass.SUBMARINE,
      ShipClass.FRIGATE,
      ShipClass.CORVETTE
    ],
    characteristics: {
      armorRange: { min: 2, max: 9 },
      speedRange: { min: 25, max: 35 },
      firepowerRange: { min: 5, max: 12 },
      yearRange: { min: 1946, max: 2025 }
    }
  },
  [ShipEra.FICTIONAL]: {
    availableClasses: Object.values(ShipClass),
    characteristics: {
      armorRange: { min: 1, max: 15 },
      speedRange: { min: 10, max: 50 },
      firepowerRange: { min: 1, max: 20 },
      yearRange: { min: 0, max: 9999 }
    }
  }
}

/**
 * Fleet Composition Rule
 */
export interface FleetCompositionRule {
  class: ShipClass
  min: number
  max: number
}

/**
 * Historical Ship Period Definitions
 */
export interface HistoricalPeriod {
  era: ShipEra
  name: string
  description: string
  yearRange: { start: number; end: number }
  keyInnovations: string[]
  typicalFleetComposition: FleetCompositionRule[]
}

export const HistoricalPeriods: Record<ShipEra, HistoricalPeriod> = {
  [ShipEra.PRE_DREADNOUGHT]: {
    era: ShipEra.PRE_DREADNOUGHT,
    name: 'Pre-Dreadnought Era',
    description: 'The age of ironclad warships with mixed battery armaments',
    yearRange: { start: 1870, end: 1905 },
    keyInnovations: ['Ironclad armor', 'Steam propulsion', 'Breech-loading guns'],
    typicalFleetComposition: [
      { class: ShipClass.BATTLESHIP, min: 2, max: 4 },
      { class: ShipClass.HEAVY_CRUISER, min: 2, max: 3 },
      { class: ShipClass.LIGHT_CRUISER, min: 2, max: 4 },
      { class: ShipClass.DESTROYER, min: 4, max: 8 }
    ]
  },
  [ShipEra.DREADNOUGHT]: {
    era: ShipEra.DREADNOUGHT,
    name: 'Dreadnought Revolution',
    description: 'All-big-gun battleships that made previous designs obsolete',
    yearRange: { start: 1906, end: 1919 },
    keyInnovations: ['All-big-gun armament', 'Turbine propulsion', 'Fire control systems'],
    typicalFleetComposition: [
      { class: ShipClass.BATTLESHIP, min: 2, max: 3 },
      { class: ShipClass.BATTLECRUISER, min: 1, max: 2 },
      { class: ShipClass.HEAVY_CRUISER, min: 2, max: 3 },
      { class: ShipClass.DESTROYER, min: 6, max: 12 }
    ]
  },
  [ShipEra.SUPER_DREADNOUGHT]: {
    era: ShipEra.SUPER_DREADNOUGHT,
    name: 'Super-Dreadnought Era',
    description: 'Larger caliber guns and improved armor protection',
    yearRange: { start: 1920, end: 1945 },
    keyInnovations: ['Larger caliber guns', 'All-or-nothing armor', 'Radar', 'Aircraft'],
    typicalFleetComposition: [
      { class: ShipClass.BATTLESHIP, min: 1, max: 3 },
      { class: ShipClass.BATTLECRUISER, min: 0, max: 2 },
      { class: ShipClass.HEAVY_CRUISER, min: 2, max: 4 },
      { class: ShipClass.LIGHT_CRUISER, min: 3, max: 5 },
      { class: ShipClass.DESTROYER, min: 8, max: 16 },
      { class: ShipClass.SUBMARINE, min: 2, max: 6 }
    ]
  },
  [ShipEra.BATTLECRUISER]: {
    era: ShipEra.BATTLECRUISER,
    name: 'Battlecruiser Era',
    description: 'Fast capital ships trading armor for speed',
    yearRange: { start: 1908, end: 1945 },
    keyInnovations: ['High speed', 'Long-range gunnery', 'Scouting capability'],
    typicalFleetComposition: [
      { class: ShipClass.BATTLECRUISER, min: 2, max: 3 },
      { class: ShipClass.HEAVY_CRUISER, min: 2, max: 3 },
      { class: ShipClass.LIGHT_CRUISER, min: 3, max: 4 },
      { class: ShipClass.DESTROYER, min: 6, max: 10 }
    ]
  },
  [ShipEra.MODERN]: {
    era: ShipEra.MODERN,
    name: 'Modern Naval Era',
    description: 'Missile age with aircraft carriers as capital ships',
    yearRange: { start: 1946, end: 2025 },
    keyInnovations: ['Guided missiles', 'Nuclear propulsion', 'AEGIS systems', 'Stealth'],
    typicalFleetComposition: [
      { class: ShipClass.CARRIER, min: 1, max: 2 },
      { class: ShipClass.HEAVY_CRUISER, min: 1, max: 2 },
      { class: ShipClass.DESTROYER, min: 4, max: 8 },
      { class: ShipClass.SUBMARINE, min: 2, max: 4 },
      { class: ShipClass.FRIGATE, min: 2, max: 4 }
    ]
  },
  [ShipEra.FICTIONAL]: {
    era: ShipEra.FICTIONAL,
    name: 'Fictional/Fantasy',
    description: 'Imaginary vessels with unique capabilities',
    yearRange: { start: 0, end: 9999 },
    keyInnovations: ['Energy weapons', 'Shield systems', 'Experimental technology'],
    typicalFleetComposition: []
  }
}

/**
 * Ship Type Validator
 */
export class ShipTypeValidator {
  static isValidShipForEra(shipClass: ShipClass, era: ShipEra): boolean {
    const hierarchy = ShipClassHierarchy[era]
    return hierarchy.availableClasses.includes(shipClass)
  }

  static validateShipStats(ship: Partial<ShipType>, era: ShipEra): ValidationErrors {
    const errors: ValidationErrors = []
    const characteristics = ShipClassHierarchy[era].characteristics

    if (ship.armor_rating !== undefined) {
      if (ship.armor_rating < characteristics.armorRange.min ||
          ship.armor_rating > characteristics.armorRange.max) {
        errors.push({
          field: 'armor_rating',
          message: `Armor rating must be between ${characteristics.armorRange.min} and ${characteristics.armorRange.max} for ${era}`
        })
      }
    }

    if (ship.max_speed_knots !== undefined && ship.max_speed_knots !== null) {
      if (ship.max_speed_knots < characteristics.speedRange.min ||
          ship.max_speed_knots > characteristics.speedRange.max) {
        errors.push({
          field: 'max_speed_knots',
          message: `Speed must be between ${characteristics.speedRange.min} and ${characteristics.speedRange.max} knots for ${era}`
        })
      }
    }

    if (ship.firepower_rating !== undefined) {
      if (ship.firepower_rating < characteristics.firepowerRange.min ||
          ship.firepower_rating > characteristics.firepowerRange.max) {
        errors.push({
          field: 'firepower_rating',
          message: `Firepower must be between ${characteristics.firepowerRange.min} and ${characteristics.firepowerRange.max} for ${era}`
        })
      }
    }

    return errors
  }
}

type ValidationErrors = Array<{ field: string; message: string }>
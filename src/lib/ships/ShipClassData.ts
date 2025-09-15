/**
 * Ship Class Data Module
 * Ship class definitions with base statistics
 */

import { ShipClass, ShipEra } from '../database/types/enums'

/**
 * Ship Statistics Interface
 */
export interface ShipStatistics {
  // Combat Stats
  armor: number         // Damage reduction (1-10)
  firepower: number     // Attack power (1-10)
  accuracy: number      // Hit chance modifier (1-10)

  // Mobility Stats
  speed: number         // Movement capability (1-10)
  maneuverability: number // Evasion capability (1-10)

  // Detection Stats
  detection: number     // Sensor range (1-10)
  stealth: number       // Detection avoidance (1-10)

  // Durability
  hitPoints: number     // Maximum health
  criticalThreshold: number // HP% for critical damage

  // Special
  specialAbilitySlots: number // Number of ability slots
}

/**
 * Point Cost Configuration
 */
export interface PointCost {
  baseValue: number
  perStatPoint: number
  perHitPoint: number
  perAbilitySlot: number
  eraModifier: number
  classModifier: number
}

/**
 * Ship Class Configuration
 */
export interface ShipClassConfig {
  name: string
  code: ShipClass
  baseSize: number
  baseStats: ShipStatistics
  pointCost: PointCost
  description: string
}

/**
 * Ship Class Definitions with Base Statistics
 */
export const ShipClassDefinitions: Record<ShipClass, ShipClassConfig> = {
  [ShipClass.CARRIER]: {
    name: 'Aircraft Carrier',
    code: ShipClass.CARRIER,
    baseSize: 5,
    baseStats: {
      armor: 4,
      firepower: 8,
      accuracy: 7,
      speed: 5,
      maneuverability: 2,
      detection: 9,
      stealth: 2,
      hitPoints: 6,
      criticalThreshold: 30,
      specialAbilitySlots: 3
    },
    pointCost: {
      baseValue: 50,
      perStatPoint: 3,
      perHitPoint: 5,
      perAbilitySlot: 10,
      eraModifier: 1.2,
      classModifier: 1.5
    },
    description: 'Floating airbase with long-range strike capability'
  },

  [ShipClass.BATTLESHIP]: {
    name: 'Battleship',
    code: ShipClass.BATTLESHIP,
    baseSize: 5,
    baseStats: {
      armor: 8,
      firepower: 9,
      accuracy: 6,
      speed: 4,
      maneuverability: 2,
      detection: 5,
      stealth: 1,
      hitPoints: 7,
      criticalThreshold: 25,
      specialAbilitySlots: 2
    },
    pointCost: {
      baseValue: 45,
      perStatPoint: 3,
      perHitPoint: 5,
      perAbilitySlot: 8,
      eraModifier: 1.0,
      classModifier: 1.3
    },
    description: 'Heavily armored capital ship with devastating firepower'
  },

  [ShipClass.BATTLECRUISER]: {
    name: 'Battlecruiser',
    code: ShipClass.BATTLECRUISER,
    baseSize: 4,
    baseStats: {
      armor: 5,
      firepower: 7,
      accuracy: 7,
      speed: 7,
      maneuverability: 4,
      detection: 6,
      stealth: 3,
      hitPoints: 5,
      criticalThreshold: 30,
      specialAbilitySlots: 2
    },
    pointCost: {
      baseValue: 40,
      perStatPoint: 3,
      perHitPoint: 4,
      perAbilitySlot: 8,
      eraModifier: 1.0,
      classModifier: 1.2
    },
    description: 'Fast capital ship trading armor for speed'
  },

  [ShipClass.HEAVY_CRUISER]: {
    name: 'Heavy Cruiser',
    code: ShipClass.HEAVY_CRUISER,
    baseSize: 3,
    baseStats: {
      armor: 5,
      firepower: 6,
      accuracy: 7,
      speed: 6,
      maneuverability: 5,
      detection: 6,
      stealth: 4,
      hitPoints: 4,
      criticalThreshold: 35,
      specialAbilitySlots: 2
    },
    pointCost: {
      baseValue: 30,
      perStatPoint: 2,
      perHitPoint: 3,
      perAbilitySlot: 6,
      eraModifier: 1.0,
      classModifier: 1.0
    },
    description: 'Versatile warship with balanced capabilities'
  },

  [ShipClass.LIGHT_CRUISER]: {
    name: 'Light Cruiser',
    code: ShipClass.LIGHT_CRUISER,
    baseSize: 3,
    baseStats: {
      armor: 3,
      firepower: 4,
      accuracy: 8,
      speed: 8,
      maneuverability: 7,
      detection: 7,
      stealth: 5,
      hitPoints: 3,
      criticalThreshold: 40,
      specialAbilitySlots: 2
    },
    pointCost: {
      baseValue: 25,
      perStatPoint: 2,
      perHitPoint: 3,
      perAbilitySlot: 5,
      eraModifier: 1.0,
      classModifier: 0.9
    },
    description: 'Fast scout and destroyer leader'
  },

  [ShipClass.DESTROYER]: {
    name: 'Destroyer',
    code: ShipClass.DESTROYER,
    baseSize: 2,
    baseStats: {
      armor: 2,
      firepower: 4,
      accuracy: 8,
      speed: 9,
      maneuverability: 8,
      detection: 7,
      stealth: 6,
      hitPoints: 2,
      criticalThreshold: 40,
      specialAbilitySlots: 1
    },
    pointCost: {
      baseValue: 15,
      perStatPoint: 2,
      perHitPoint: 2,
      perAbilitySlot: 4,
      eraModifier: 1.0,
      classModifier: 0.8
    },
    description: 'Fast attack vessel for escort and patrol'
  },

  [ShipClass.SUBMARINE]: {
    name: 'Submarine',
    code: ShipClass.SUBMARINE,
    baseSize: 2,
    baseStats: {
      armor: 1,
      firepower: 5,
      accuracy: 6,
      speed: 5,
      maneuverability: 6,
      detection: 4,
      stealth: 9,
      hitPoints: 2,
      criticalThreshold: 50,
      specialAbilitySlots: 2
    },
    pointCost: {
      baseValue: 20,
      perStatPoint: 2,
      perHitPoint: 3,
      perAbilitySlot: 6,
      eraModifier: 1.1,
      classModifier: 1.0
    },
    description: 'Stealthy underwater predator'
  },

  [ShipClass.FRIGATE]: {
    name: 'Frigate',
    code: ShipClass.FRIGATE,
    baseSize: 2,
    baseStats: {
      armor: 3,
      firepower: 3,
      accuracy: 7,
      speed: 7,
      maneuverability: 7,
      detection: 8,
      stealth: 5,
      hitPoints: 2,
      criticalThreshold: 45,
      specialAbilitySlots: 1
    },
    pointCost: {
      baseValue: 12,
      perStatPoint: 1.5,
      perHitPoint: 2,
      perAbilitySlot: 3,
      eraModifier: 1.0,
      classModifier: 0.7
    },
    description: 'Multi-role escort vessel'
  },

  [ShipClass.CORVETTE]: {
    name: 'Corvette',
    code: ShipClass.CORVETTE,
    baseSize: 1,
    baseStats: {
      armor: 2,
      firepower: 2,
      accuracy: 8,
      speed: 9,
      maneuverability: 9,
      detection: 6,
      stealth: 7,
      hitPoints: 1,
      criticalThreshold: 50,
      specialAbilitySlots: 1
    },
    pointCost: {
      baseValue: 8,
      perStatPoint: 1,
      perHitPoint: 2,
      perAbilitySlot: 2,
      eraModifier: 1.0,
      classModifier: 0.6
    },
    description: 'Small, fast patrol craft'
  },

  [ShipClass.PATROL_BOAT]: {
    name: 'Patrol Boat',
    code: ShipClass.PATROL_BOAT,
    baseSize: 1,
    baseStats: {
      armor: 1,
      firepower: 1,
      accuracy: 7,
      speed: 10,
      maneuverability: 10,
      detection: 5,
      stealth: 8,
      hitPoints: 1,
      criticalThreshold: 50,
      specialAbilitySlots: 0
    },
    pointCost: {
      baseValue: 5,
      perStatPoint: 1,
      perHitPoint: 1,
      perAbilitySlot: 2,
      eraModifier: 1.0,
      classModifier: 0.5
    },
    description: 'Minimal combat vessel for scouting'
  }
}

/**
 * Stat Modifiers Interface
 */
export interface StatModifiers {
  armor: number
  firepower: number
  accuracy: number
  speed: number
  maneuverability: number
  detection: number
  stealth: number
  hitPoints: number
  pointMultiplier: number
}

/**
 * Era Modifiers for Ship Statistics
 */
export const EraModifiers: Record<ShipEra, StatModifiers> = {
  [ShipEra.PRE_DREADNOUGHT]: {
    armor: 0.7,
    firepower: 0.6,
    accuracy: 0.5,
    speed: 0.5,
    maneuverability: 0.6,
    detection: 0.3,
    stealth: 1.2,
    hitPoints: 0.8,
    pointMultiplier: 0.8
  },
  [ShipEra.DREADNOUGHT]: {
    armor: 0.85,
    firepower: 0.8,
    accuracy: 0.6,
    speed: 0.7,
    maneuverability: 0.7,
    detection: 0.4,
    stealth: 1.0,
    hitPoints: 0.9,
    pointMultiplier: 0.9
  },
  [ShipEra.SUPER_DREADNOUGHT]: {
    armor: 1.0,
    firepower: 1.0,
    accuracy: 0.75,
    speed: 0.85,
    maneuverability: 0.8,
    detection: 0.6,
    stealth: 0.8,
    hitPoints: 1.0,
    pointMultiplier: 1.0
  },
  [ShipEra.BATTLECRUISER]: {
    armor: 0.7,
    firepower: 0.9,
    accuracy: 0.8,
    speed: 1.1,
    maneuverability: 0.9,
    detection: 0.7,
    stealth: 0.9,
    hitPoints: 0.85,
    pointMultiplier: 0.95
  },
  [ShipEra.MODERN]: {
    armor: 0.9,
    firepower: 1.3,
    accuracy: 1.2,
    speed: 1.2,
    maneuverability: 1.1,
    detection: 1.5,
    stealth: 0.7,
    hitPoints: 1.1,
    pointMultiplier: 1.2
  },
  [ShipEra.FICTIONAL]: {
    armor: 1.5,
    firepower: 1.5,
    accuracy: 1.3,
    speed: 1.3,
    maneuverability: 1.3,
    detection: 1.3,
    stealth: 1.0,
    hitPoints: 1.3,
    pointMultiplier: 1.5
  }
}
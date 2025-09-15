/**
 * Ship Templates Module
 * Predefined ship type templates for different eras
 */

import { ShipClass, ShipEra } from '../database/types/enums'

/**
 * Ship Type Templates
 * Predefined configurations for common ship types
 */
export const ShipTypeTemplates = {
  // Pre-Dreadnought Era
  PRE_DREADNOUGHT_BATTLESHIP: {
    class: ShipClass.BATTLESHIP,
    era: ShipEra.PRE_DREADNOUGHT,
    size: 4,
    baseStats: {
      armor: 3,
      speed: 15,
      firepower: 3,
      detection: 3,
      hitPoints: 4
    }
  },
  IRONCLAD_CRUISER: {
    class: ShipClass.HEAVY_CRUISER,
    era: ShipEra.PRE_DREADNOUGHT,
    size: 3,
    baseStats: {
      armor: 2,
      speed: 16,
      firepower: 2,
      detection: 4,
      hitPoints: 3
    }
  },

  // Dreadnought Era
  DREADNOUGHT_BATTLESHIP: {
    class: ShipClass.BATTLESHIP,
    era: ShipEra.DREADNOUGHT,
    size: 5,
    baseStats: {
      armor: 5,
      speed: 21,
      firepower: 6,
      detection: 4,
      hitPoints: 5
    }
  },
  EARLY_BATTLECRUISER: {
    class: ShipClass.BATTLECRUISER,
    era: ShipEra.DREADNOUGHT,
    size: 4,
    baseStats: {
      armor: 3,
      speed: 25,
      firepower: 5,
      detection: 5,
      hitPoints: 4
    }
  },

  // Super-Dreadnought Era
  SUPER_DREADNOUGHT: {
    class: ShipClass.BATTLESHIP,
    era: ShipEra.SUPER_DREADNOUGHT,
    size: 5,
    baseStats: {
      armor: 7,
      speed: 24,
      firepower: 9,
      detection: 5,
      hitPoints: 6
    }
  },
  FAST_BATTLESHIP: {
    class: ShipClass.BATTLESHIP,
    era: ShipEra.SUPER_DREADNOUGHT,
    size: 5,
    baseStats: {
      armor: 6,
      speed: 28,
      firepower: 8,
      detection: 5,
      hitPoints: 5
    }
  },
  FLEET_SUBMARINE: {
    class: ShipClass.SUBMARINE,
    era: ShipEra.SUPER_DREADNOUGHT,
    size: 2,
    baseStats: {
      armor: 1,
      speed: 20,
      firepower: 4,
      detection: 2,
      hitPoints: 2
    }
  },

  // Modern Era
  AIRCRAFT_CARRIER: {
    class: ShipClass.CARRIER,
    era: ShipEra.MODERN,
    size: 5,
    baseStats: {
      armor: 4,
      speed: 30,
      firepower: 10,
      detection: 8,
      hitPoints: 6
    }
  },
  GUIDED_MISSILE_DESTROYER: {
    class: ShipClass.DESTROYER,
    era: ShipEra.MODERN,
    size: 3,
    baseStats: {
      armor: 3,
      speed: 32,
      firepower: 7,
      detection: 7,
      hitPoints: 3
    }
  },
  NUCLEAR_SUBMARINE: {
    class: ShipClass.SUBMARINE,
    era: ShipEra.MODERN,
    size: 3,
    baseStats: {
      armor: 2,
      speed: 30,
      firepower: 8,
      detection: 3,
      hitPoints: 3
    }
  }
}
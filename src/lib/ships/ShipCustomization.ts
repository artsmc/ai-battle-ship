/**
 * Ship Customization Module
 * Ship customization profiles and configurations
 */

import { SpecialAbility } from '../database/types/ship'

/**
 * Ship Customization Profile
 */
export interface ShipCustomization {
  statModifiers: Partial<ShipStatModifiers>
  abilityEnhancements: AbilityEnhancement[]
  specialTraits: ShipTrait[]
  visualCustomization?: VisualCustomization
}

/**
 * Stat Modifiers for Customization
 */
export interface ShipStatModifiers {
  armor?: number
  firepower?: number
  accuracy?: number
  speed?: number
  maneuverability?: number
  detection?: number
  stealth?: number
  hitPoints?: number
}

/**
 * Ability Enhancement
 */
export interface AbilityEnhancement {
  abilityName: string
  cooldownReduction: number
  additionalUses: number
  enhancedEffect?: string
}

/**
 * Ship Trait
 */
export interface ShipTrait {
  name: string
  description: string
  effect: TraitEffect
}

/**
 * Trait Effect
 */
export interface TraitEffect {
  statModifier?: Partial<ShipStatModifiers>
  combatModifier?: CombatModifier
  specialCondition?: string
}

/**
 * Combat Modifier
 */
export interface CombatModifier {
  damageBonus?: number
  damageReduction?: number
  criticalChance?: number
  evasionChance?: number
}

/**
 * Visual Customization
 */
export interface VisualCustomization {
  hullColor?: string
  flagDesign?: string
  nameplate?: string
  effectsEnabled?: boolean
}

/**
 * Preset Ship Configurations
 */
export const PresetConfigurations = {
  AGGRESSIVE: {
    statModifiers: {
      firepower: 2,
      accuracy: 1,
      armor: -1,
      speed: -1
    },
    traits: [
      {
        name: 'Gunboat Doctrine',
        description: 'Enhanced firepower at the cost of defense',
        effect: {
          combatModifier: {
            damageBonus: 1.25,
            damageReduction: 0.9
          }
        }
      }
    ]
  },
  DEFENSIVE: {
    statModifiers: {
      armor: 2,
      hitPoints: 1,
      firepower: -1,
      speed: -1
    },
    traits: [
      {
        name: 'Fortress Protocol',
        description: 'Superior defense and damage mitigation',
        effect: {
          combatModifier: {
            damageReduction: 1.3,
            damageBonus: 0.85
          }
        }
      }
    ]
  },
  STEALTH: {
    statModifiers: {
      stealth: 3,
      detection: -1,
      armor: -1,
      hitPoints: -1
    },
    traits: [
      {
        name: 'Silent Running',
        description: 'Hard to detect but fragile',
        effect: {
          combatModifier: {
            evasionChance: 0.2,
            criticalChance: 0.15
          }
        }
      }
    ]
  },
  SCOUT: {
    statModifiers: {
      speed: 2,
      detection: 2,
      maneuverability: 1,
      armor: -2,
      firepower: -1
    },
    traits: [
      {
        name: 'Advanced Reconnaissance',
        description: 'Superior detection and mobility',
        effect: {
          statModifier: {
            detection: 2
          }
        }
      }
    ]
  },
  BALANCED: {
    statModifiers: {},
    traits: [
      {
        name: 'Versatile Design',
        description: 'Well-rounded performance in all areas',
        effect: {
          combatModifier: {
            damageBonus: 1.0,
            damageReduction: 1.0
          }
        }
      }
    ]
  }
}

/**
 * Default Abilities for Ships
 */
export const DefaultShipAbilities: SpecialAbility[] = [
  {
    name: 'Rapid Fire',
    description: 'Fire an additional shot this turn',
    cooldown: 3,
    uses: 2
  },
  {
    name: 'Evasive Maneuvers',
    description: 'Increase evasion chance for next turn',
    cooldown: 4,
    uses: 3
  },
  {
    name: 'Damage Control',
    description: 'Repair 1 point of damage',
    cooldown: 5,
    uses: 1
  },
  {
    name: 'Target Lock',
    description: 'Increase accuracy for next shot',
    cooldown: 2,
    uses: 3
  },
  {
    name: 'Smoke Screen',
    description: 'Reduce enemy accuracy for one turn',
    cooldown: 4,
    uses: 2
  },
  {
    name: 'Emergency Repairs',
    description: 'Restore 2 hit points immediately',
    cooldown: 6,
    uses: 1
  },
  {
    name: 'Full Speed Ahead',
    description: 'Increase speed and maneuverability',
    cooldown: 3,
    uses: 3
  },
  {
    name: 'Armor Piercing Rounds',
    description: 'Ignore enemy armor for next shot',
    cooldown: 5,
    uses: 2
  }
]
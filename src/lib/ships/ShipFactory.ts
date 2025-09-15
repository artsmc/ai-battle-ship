/**
 * Ship Factory Module
 * Ship instance creation, configuration, and integration
 */

import { ShipClass, ShipEra } from '../database/types/enums'
import { ShipType, SpecialAbility } from '../database/types/ship'
import { Ship, ShipConfig } from '../game/Ship'
import { ShipAbility } from '../game/types'
import { ShipStatCalculator, ShipStatistics, ShipClassDefinitions } from './ShipClasses'
import { ShipTypeTemplates } from './ShipTemplates'
import { ShipTypeValidator } from './ShipTypes'
import {
  ShipCustomization,
  PresetConfigurations,
  DefaultShipAbilities,
  ShipTrait,
  AbilityEnhancement
} from './ShipCustomization'

// Re-export customization types
export type {
  ShipCustomization,
  AbilityEnhancement,
  ShipTrait
} from './ShipCustomization'

export { PresetConfigurations } from './ShipCustomization'

/**
 * Ship Creation Options
 */
export interface ShipCreationOptions {
  playerId: string
  customName?: string
  customStats?: Partial<ShipStatistics>
  additionalAbilities?: SpecialAbility[]
  startingDamage?: number
  positionPreset?: 'bow' | 'stern' | 'port' | 'starboard' | 'center'
}

/**
 * Ship Validation Result
 */
export interface ShipValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Ship Factory Class
 */
export class ShipFactory {
  private shipTypeCache: Map<string, ShipType>
  private customizationProfiles: Map<string, ShipCustomization>

  constructor() {
    this.shipTypeCache = new Map()
    this.customizationProfiles = new Map()
    this.initializePresetProfiles()
  }

  /**
   * Initialize preset customization profiles
   */
  private initializePresetProfiles(): void {
    Object.entries(PresetConfigurations).forEach(([name, config]) => {
      this.customizationProfiles.set(name, {
        statModifiers: config.statModifiers,
        abilityEnhancements: [],
        specialTraits: config.traits as ShipTrait[]
      })
    })
  }

  /**
   * Set available ship types
   */
  setShipTypes(shipTypes: ShipType[]): void {
    this.shipTypeCache.clear()
    shipTypes.forEach(ship => {
      this.shipTypeCache.set(ship.id, ship)
    })
  }

  /**
   * Create ship from database type
   */
  createShip(
    shipTypeId: string,
    options: ShipCreationOptions
  ): Ship | null {
    const shipType = this.shipTypeCache.get(shipTypeId)
    if (!shipType) {
      console.error(`Ship type ${shipTypeId} not found`)
      return null
    }

    // Calculate final statistics
    const baseStats = ShipStatCalculator.calculateStats(
      shipType.class,
      shipType.era,
      options.customStats
    )

    // Convert special abilities to game abilities
    const abilities = this.createAbilities(
      shipType.special_abilities,
      options.additionalAbilities
    )

    // Create ship configuration
    const config: ShipConfig = {
      typeId: shipType.id,
      name: options.customName || shipType.name,
      class: shipType.class,
      size: shipType.size,
      hitPoints: baseStats.hitPoints,
      abilities,
      playerId: options.playerId,
      armorRating: baseStats.armor,
      maneuverability: baseStats.maneuverability,
      detectionRange: baseStats.detection
    }

    // Create ship instance
    const ship = new Ship(config)

    // Apply starting damage if specified
    if (options.startingDamage && options.startingDamage > 0) {
      ship.hitPoints = Math.max(1, ship.hitPoints - options.startingDamage)
    }

    return ship
  }

  /**
   * Create ship from template
   */
  createShipFromTemplate(
    templateName: keyof typeof ShipTypeTemplates,
    options: ShipCreationOptions
  ): Ship {
    const template = ShipTypeTemplates[templateName]

    // Create a virtual ship type from template
    const virtualShipType: ShipType = {
      id: `template_${templateName}`,
      name: templateName.replace(/_/g, ' '),
      class: template.class,
      era: template.era,
      size: template.size,
      hit_points: template.baseStats.hitPoints,
      armor_rating: template.baseStats.armor,
      firepower_rating: template.baseStats.firepower,
      maneuverability: template.baseStats.speed,
      detection_range: template.baseStats.detection,
      special_abilities: [],
      is_premium: false,
      unlock_level: 1,
      unlock_cost: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Cache the virtual type temporarily
    this.shipTypeCache.set(virtualShipType.id, virtualShipType)

    const ship = this.createShip(virtualShipType.id, options)

    // Remove from cache
    this.shipTypeCache.delete(virtualShipType.id)

    return ship!
  }

  /**
   * Create custom ship
   */
  createCustomShip(
    baseClass: ShipClass,
    era: ShipEra,
    customization: ShipCustomization,
    options: ShipCreationOptions
  ): Ship {
    // Get base configuration
    const baseConfig = ShipClassDefinitions[baseClass]

    // Apply customization
    const customStats = ShipStatCalculator.calculateStats(
      baseClass,
      era,
      customization.statModifiers as Partial<ShipStatistics>
    )

    // Create abilities with enhancements
    const abilities = this.createEnhancedAbilities(
      customStats.specialAbilitySlots,
      customization.abilityEnhancements
    )

    // Create ship configuration
    const config: ShipConfig = {
      typeId: `custom_${Date.now()}`,
      name: options.customName || `Custom ${baseConfig.name}`,
      class: baseClass,
      size: baseConfig.baseSize,
      hitPoints: customStats.hitPoints,
      abilities,
      playerId: options.playerId,
      armorRating: customStats.armor,
      maneuverability: customStats.maneuverability,
      detectionRange: customStats.detection
    }

    return new Ship(config)
  }

  /**
   * Apply preset configuration to ship
   */
  applyPresetConfiguration(
    ship: Ship,
    presetName: keyof typeof PresetConfigurations
  ): Ship {
    const preset = this.customizationProfiles.get(presetName)
    if (!preset) {
      console.warn(`Preset ${presetName} not found`)
      return ship
    }

    // Create a new ship with modified stats
    const modifiedConfig: ShipConfig = {
      id: ship.id,
      typeId: ship.typeId,
      name: ship.name,
      class: ship.class,
      size: ship.size,
      hitPoints: ship.maxHitPoints,
      abilities: [...ship.abilities],
      playerId: ship.playerId,
      armorRating: Math.max(1, (ship as any).armorRating + (preset.statModifiers.armor || 0)),
      maneuverability: Math.max(1, (ship as any).maneuverability + (preset.statModifiers.maneuverability || 0)),
      detectionRange: Math.max(1, (ship as any).detectionRange + (preset.statModifiers.detection || 0))
    }

    return new Ship(modifiedConfig)
  }

  /**
   * Clone and customize ship
   */
  cloneAndCustomize(
    originalShip: Ship,
    customization: Partial<ShipCustomization>
  ): Ship {
    const cloned = originalShip.clone()

    // Apply ability enhancements
    if (customization.abilityEnhancements) {
      customization.abilityEnhancements.forEach(enhancement => {
        const ability = cloned.abilities.find(a => a.name === enhancement.abilityName)
        if (ability) {
          ability.cooldown = Math.max(1, ability.cooldown - enhancement.cooldownReduction)
          ability.uses += enhancement.additionalUses
          ability.remainingUses = ability.uses
        }
      })
    }

    return cloned
  }

  /**
   * Create abilities from special abilities
   */
  private createAbilities(
    specialAbilities: SpecialAbility[],
    additionalAbilities?: SpecialAbility[]
  ): ShipAbility[] {
    const allAbilities = [...specialAbilities]
    if (additionalAbilities) {
      allAbilities.push(...additionalAbilities)
    }

    return allAbilities.map((ability, index) => ({
      id: `ability_${index}`,
      name: ability.name,
      description: ability.description,
      cooldown: ability.cooldown || 3,
      currentCooldown: 0,
      uses: ability.uses || 3,
      remainingUses: ability.uses || 3,
      isActive: true
    }))
  }

  /**
   * Create enhanced abilities
   */
  private createEnhancedAbilities(
    slotCount: number,
    enhancements: AbilityEnhancement[]
  ): ShipAbility[] {
    const abilities: ShipAbility[] = []

    // Add default abilities up to slot count
    for (let i = 0; i < slotCount && i < DefaultShipAbilities.length; i++) {
      const defaultAbility = DefaultShipAbilities[i]
      abilities.push({
        id: `ability_${i}`,
        name: defaultAbility.name,
        description: defaultAbility.description,
        cooldown: defaultAbility.cooldown || 3,
        currentCooldown: 0,
        uses: defaultAbility.uses || 3,
        remainingUses: defaultAbility.uses || 3,
        isActive: true
      })
    }

    // Apply enhancements
    enhancements.forEach(enhancement => {
      const ability = abilities.find(a => a.name === enhancement.abilityName)
      if (ability) {
        ability.cooldown = Math.max(1, ability.cooldown - enhancement.cooldownReduction)
        ability.uses += enhancement.additionalUses
        ability.remainingUses = ability.uses
      }
    })

    return abilities
  }

  /**
   * Validate ship configuration
   */
  validateShipConfiguration(ship: Ship): ShipValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate ship class and era compatibility
    const shipType = this.shipTypeCache.get(ship.typeId)
    if (shipType) {
      const isValidForEra = ShipTypeValidator.isValidShipForEra(shipType.class, shipType.era)
      if (!isValidForEra) {
        errors.push(`${shipType.class} is not available in ${shipType.era}`)
      }

      // Validate stats for era
      const statErrors = ShipTypeValidator.validateShipStats(shipType, shipType.era)
      errors.push(...statErrors.map(e => e.message))
    }

    // Check ability limits
    if (ship.abilities.length > 5) {
      warnings.push('Ship has more than 5 abilities, which may affect game balance')
    }

    // Check health status
    if (ship.hitPoints <= 0) {
      errors.push('Ship has no hit points remaining')
    }

    if (ship.hitPoints < ship.maxHitPoints * 0.25) {
      warnings.push('Ship is critically damaged')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

}

/**
 * Factory singleton instance
 */
export const shipFactory = new ShipFactory()
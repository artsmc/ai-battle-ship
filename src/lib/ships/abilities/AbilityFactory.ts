/**
 * Ability Factory
 * Creates and manages ability instances for ships
 */

import { BaseAbility } from './BaseAbility'
import {
  AbilityDefinition,
  AbilityInstance,
  AbilityRegistry,
  AbilityType
} from './types'
import {
  AllBigGunsAbility,
  SpeedAdvantageAbility,
  AirScoutAbility,
  SilentRunningAbility,
  SonarPingAbility,
  ArmorPiercingAbility
} from './implementations'
import { ShipClass, ShipEra } from '../../database/types/enums'
import { GameShip } from '../../game/types'

export class AbilityFactory {
  private static registry: AbilityRegistry = {
    definitions: new Map(),
    shipAbilities: new Map(),
    eraAbilities: new Map()
  }

  private static initialized = false

  /**
   * Initialize the ability registry
   */
  static initialize(): void {
    if (this.initialized) return

    // Register all ability definitions
    this.registerAbility(AllBigGunsAbility.DEFINITION)
    this.registerAbility(SpeedAdvantageAbility.DEFINITION)
    this.registerAbility(AirScoutAbility.DEFINITION)
    this.registerAbility(SilentRunningAbility.DEFINITION)
    this.registerAbility(SonarPingAbility.DEFINITION)
    this.registerAbility(ArmorPiercingAbility.DEFINITION)

    // Map abilities to ship classes
    this.mapShipClassAbilities()

    // Map abilities to eras
    this.mapEraAbilities()

    this.initialized = true
  }

  /**
   * Register an ability definition
   */
  private static registerAbility(definition: AbilityDefinition): void {
    this.registry.definitions.set(definition.id, definition)
  }

  /**
   * Map abilities to ship classes
   */
  private static mapShipClassAbilities(): void {
    // Battleships
    this.registry.shipAbilities.set(ShipClass.BATTLESHIP, [
      'all_big_guns',
      'armor_piercing'
    ])

    // Battlecruisers
    this.registry.shipAbilities.set(ShipClass.BATTLECRUISER, [
      'speed_advantage',
      'all_big_guns'
    ])

    // Carriers
    this.registry.shipAbilities.set(ShipClass.CARRIER, [
      'air_scout'
    ])

    // Submarines
    this.registry.shipAbilities.set(ShipClass.SUBMARINE, [
      'silent_running'
    ])

    // Destroyers
    this.registry.shipAbilities.set(ShipClass.DESTROYER, [
      'sonar_ping'
    ])

    // Frigates
    this.registry.shipAbilities.set(ShipClass.FRIGATE, [
      'sonar_ping'
    ])

    // Heavy Cruisers
    this.registry.shipAbilities.set(ShipClass.HEAVY_CRUISER, [
      'sonar_ping'
    ])
  }

  /**
   * Map abilities to eras
   */
  private static mapEraAbilities(): void {
    // Dreadnought Era
    this.registry.eraAbilities.set(ShipEra.DREADNOUGHT, [
      'all_big_guns',
      'speed_advantage'
    ])

    // Super-Dreadnought Era
    this.registry.eraAbilities.set(ShipEra.SUPER_DREADNOUGHT, [
      'all_big_guns',
      'armor_piercing',
      'speed_advantage',
      'silent_running'
    ])

    // Battlecruiser Era
    this.registry.eraAbilities.set(ShipEra.BATTLECRUISER, [
      'speed_advantage',
      'all_big_guns'
    ])

    // Modern Era
    this.registry.eraAbilities.set(ShipEra.MODERN, [
      'air_scout',
      'sonar_ping',
      'silent_running'
    ])
  }

  /**
   * Create ability instances for a ship
   */
  static createAbilitiesForShip(
    ship: GameShip,
    era: ShipEra
  ): BaseAbility[] {
    this.initialize()

    const abilities: BaseAbility[] = []
    const abilityIds = new Set<string>()

    // Get abilities for ship class
    const classAbilities = this.registry.shipAbilities.get(ship.class) || []
    classAbilities.forEach(id => abilityIds.add(id))

    // Filter by era requirements
    abilityIds.forEach(abilityId => {
      const definition = this.registry.definitions.get(abilityId)
      if (!definition) return

      // Check era requirements
      if (definition.requiredEra && !definition.requiredEra.includes(era)) {
        abilityIds.delete(abilityId)
        return
      }

      // Check ship size requirements
      if (definition.minShipSize && ship.size < definition.minShipSize) {
        abilityIds.delete(abilityId)
        return
      }
    })

    // Create ability instances
    abilityIds.forEach(abilityId => {
      const ability = this.createAbility(abilityId, ship.id, ship.playerId)
      if (ability) {
        abilities.push(ability)
      }
    })

    return abilities
  }

  /**
   * Create a single ability instance
   */
  static createAbility(
    abilityId: string,
    shipId: string,
    playerId: string
  ): BaseAbility | null {
    this.initialize()

    const definition = this.registry.definitions.get(abilityId)
    if (!definition) {
      console.error(`Ability definition not found: ${abilityId}`)
      return null
    }

    // Create instance
    const instance: AbilityInstance = {
      definitionId: abilityId,
      shipId,
      playerId,
      isActive: true,
      currentCooldown: 0,
      remainingUses: definition.maxUses,
      activeEffects: [],
      timesUsed: 0
    }

    // Create the appropriate ability class
    switch (abilityId) {
      case 'all_big_guns':
        return new AllBigGunsAbility(definition, instance)
      case 'speed_advantage':
        return new SpeedAdvantageAbility(definition, instance)
      case 'air_scout':
        return new AirScoutAbility(definition, instance)
      case 'silent_running':
        return new SilentRunningAbility(definition, instance)
      case 'sonar_ping':
        return new SonarPingAbility(definition, instance)
      case 'armor_piercing':
        return new ArmorPiercingAbility(definition, instance)
      default:
        console.error(`No implementation for ability: ${abilityId}`)
        return null
    }
  }

  /**
   * Get all available abilities for a ship class
   */
  static getAbilitiesForClass(shipClass: ShipClass): AbilityDefinition[] {
    this.initialize()

    const abilityIds = this.registry.shipAbilities.get(shipClass) || []
    const abilities: AbilityDefinition[] = []

    abilityIds.forEach(id => {
      const definition = this.registry.definitions.get(id)
      if (definition) {
        abilities.push(definition)
      }
    })

    return abilities
  }

  /**
   * Get all available abilities for an era
   */
  static getAbilitiesForEra(era: ShipEra): AbilityDefinition[] {
    this.initialize()

    const abilityIds = this.registry.eraAbilities.get(era) || []
    const abilities: AbilityDefinition[] = []

    abilityIds.forEach(id => {
      const definition = this.registry.definitions.get(id)
      if (definition) {
        abilities.push(definition)
      }
    })

    return abilities
  }

  /**
   * Get ability definition by ID
   */
  static getAbilityDefinition(abilityId: string): AbilityDefinition | undefined {
    this.initialize()
    return this.registry.definitions.get(abilityId)
  }

  /**
   * Get all registered abilities
   */
  static getAllAbilities(): AbilityDefinition[] {
    this.initialize()
    return Array.from(this.registry.definitions.values())
  }

  /**
   * Filter abilities by type
   */
  static getAbilitiesByType(type: AbilityType): AbilityDefinition[] {
    this.initialize()
    return Array.from(this.registry.definitions.values())
      .filter(def => def.type === type)
  }
}
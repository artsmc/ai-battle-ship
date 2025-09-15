/**
 * Ability Engine
 * Main orchestrator for the ability system
 * Integrates with combat system and manages all ability operations
 */

import { BaseAbility } from './abilities/BaseAbility'
import { AbilityFactory } from './abilities/AbilityFactory'
import { AbilityProcessor, ProcessorConfig } from './abilities/AbilityProcessor'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityTrigger,
  AbilitySyncData,
  ActiveEffect
} from './abilities/types'
import { GameShip, GamePlayer, Coordinate, AttackResult } from '../game/types'
import { ShipEra } from '../database/types/enums'

export interface AbilityEngineConfig extends ProcessorConfig {
  enableAbilities: boolean
  syncEnabled: boolean
  maxAbilitiesPerShip: number
}

export class AbilityEngine {
  private processor: AbilityProcessor
  private shipAbilities: Map<string, BaseAbility[]> = new Map()
  private config: AbilityEngineConfig
  private currentTurn: number = 0

  constructor(config: Partial<AbilityEngineConfig> = {}) {
    this.config = {
      enableAbilities: true,
      syncEnabled: false,
      maxAbilitiesPerShip: 2,
      enableValidation: true,
      enableLogging: true,
      maxAbilitiesPerTurn: 1,
      globalCooldownTurns: 0,
      ...config
    }

    this.processor = new AbilityProcessor(this.config)
    AbilityFactory.initialize()
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  /**
   * Initialize abilities for a ship
   */
  initializeShipAbilities(ship: GameShip, era: ShipEra): void {
    if (!this.config.enableAbilities) return

    // Create abilities for the ship
    const abilities = AbilityFactory.createAbilitiesForShip(ship, era)

    // Limit abilities per ship
    const limitedAbilities = abilities.slice(0, this.config.maxAbilitiesPerShip)

    // Store abilities
    this.shipAbilities.set(ship.id, limitedAbilities)

    // Update ship's ability references
    ship.abilities = limitedAbilities.map(ability => ({
      id: ability.id,
      name: ability.name,
      description: ability.description,
      cooldown: ability.getDefinition().cooldownTurns,
      currentCooldown: ability.cooldownRemaining,
      uses: ability.getDefinition().maxUses || 999,
      remainingUses: ability.usesRemaining || 999,
      isActive: ability.getInstance().isActive
    }))
  }

  /**
   * Initialize abilities for entire fleet
   */
  initializeFleetAbilities(fleet: GameShip[], era: ShipEra): void {
    fleet.forEach(ship => this.initializeShipAbilities(ship, era))
  }

  // =============================================
  // ABILITY ACTIVATION
  // =============================================

  /**
   * Activate a ship ability
   */
  async activateAbility(
    shipId: string,
    abilityId: string,
    context: Partial<AbilityContext>
  ): Promise<AbilityExecutionResult> {
    if (!this.config.enableAbilities) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Abilities are disabled']
      }
    }

    // Get ship abilities
    const abilities = this.shipAbilities.get(shipId)
    if (!abilities) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['No abilities found for ship']
      }
    }

    // Find specific ability
    const ability = abilities.find(a => a.id === abilityId)
    if (!ability) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Ability not found']
      }
    }

    // Build full context
    const fullContext: AbilityContext = {
      currentTurn: this.currentTurn,
      ...context
    } as AbilityContext

    // Process activation
    const result = await this.processor.processAbilityActivation(ability, fullContext)

    // Sync if enabled
    if (this.config.syncEnabled && result.success) {
      this.syncAbilityState(shipId)
    }

    return result
  }

  // =============================================
  // TRIGGERED ABILITIES
  // =============================================

  /**
   * Process attack trigger
   */
  onAttack(
    attacker: GameShip,
    target: Coordinate,
    result: AttackResult
  ): AbilityExecutionResult[] {
    const abilities = this.shipAbilities.get(attacker.id) || []
    const context: Partial<AbilityContext> = {
      ship: attacker,
      currentTurn: this.currentTurn,
      attackContext: {
        coordinate: target,
        result: result.result,
        damage: result.damageDealt || 0
      }
    }

    return this.processor.processTriggeredAbilities(
      AbilityTrigger.ON_ATTACK,
      context as AbilityContext,
      abilities
    )
  }

  /**
   * Process damage trigger
   */
  onDamage(
    ship: GameShip,
    damage: number,
    source: string
  ): AbilityExecutionResult[] {
    const abilities = this.shipAbilities.get(ship.id) || []
    const context: Partial<AbilityContext> = {
      ship,
      currentTurn: this.currentTurn,
      damageContext: {
        source,
        amount: damage,
        isCritical: damage > ship.maxHitPoints * 0.3
      }
    }

    return this.processor.processTriggeredAbilities(
      AbilityTrigger.ON_DAMAGE,
      context as AbilityContext,
      abilities
    )
  }

  /**
   * Process turn start trigger
   */
  onTurnStart(player: GamePlayer): void {
    player.fleet.forEach(ship => {
      const abilities = this.shipAbilities.get(ship.id) || []
      const context: Partial<AbilityContext> = {
        ship,
        player,
        currentTurn: this.currentTurn
      }

      this.processor.processTriggeredAbilities(
        AbilityTrigger.ON_TURN_START,
        context as AbilityContext,
        abilities
      )
    })
  }

  // =============================================
  // COMBAT INTEGRATION
  // =============================================

  /**
   * Apply ability modifiers to attack
   */
  applyAttackModifiers(
    attacker: GameShip,
    baseDamage: number
  ): number {
    let modifiedDamage = baseDamage

    // Check for damage boost effects
    if (this.processor.hasEffect(attacker.id, 'damage_boost')) {
      const multiplier = 1 + (this.processor.getEffectMagnitude(attacker.id, 'damage_boost') - 1)
      modifiedDamage = Math.round(modifiedDamage * multiplier)
    }

    // Check for armor piercing
    if (this.processor.hasEffect(attacker.id, 'armor_piercing')) {
      // This would be applied against target armor in actual combat
      // Handled in damage calculation
    }

    return modifiedDamage
  }

  /**
   * Check if ship is hidden
   */
  isShipHidden(ship: GameShip): boolean {
    return this.processor.hasEffect(ship.id, 'stealth')
  }

  /**
   * Check if ship can detect hidden ships
   */
  canDetectHidden(ship: GameShip): boolean {
    return this.processor.hasEffect(ship.id, 'detection')
  }

  /**
   * Get detection power
   */
  getDetectionPower(ship: GameShip): number {
    return this.processor.getEffectMagnitude(ship.id, 'detection')
  }

  // =============================================
  // TURN MANAGEMENT
  // =============================================

  /**
   * Update engine at turn end
   */
  endTurn(player: GamePlayer): void {
    // Update all abilities
    player.fleet.forEach(ship => {
      const abilities = this.shipAbilities.get(ship.id) || []
      abilities.forEach(ability => ability.updateTurnEnd())

      // Sync ship ability states
      ship.abilities.forEach(shipAbility => {
        const ability = abilities.find(a => a.id === shipAbility.id)
        if (ability) {
          shipAbility.currentCooldown = ability.cooldownRemaining
          shipAbility.remainingUses = ability.usesRemaining || 999
        }
      })
    })

    // Update processor
    this.processor.updateTurnEnd(player.id, player.fleet)
  }

  /**
   * Start new turn
   */
  startTurn(turnNumber: number): void {
    this.currentTurn = turnNumber
  }

  // =============================================
  // EFFECT QUERIES
  // =============================================

  /**
   * Get all active effects for a ship
   */
  getShipEffects(shipId: string): ActiveEffect[] {
    return this.processor.getActiveEffects(shipId)
  }

  /**
   * Check if area is revealed
   */
  isAreaRevealed(coordinate: Coordinate, playerId: string): boolean {
    // Check all ships for reveal effects
    const player = { fleet: [] } as GamePlayer // Would get from game state
    for (const ship of player.fleet) {
      const effects = this.processor.getActiveEffects(ship.id)
      for (const effect of effects) {
        if (effect.effect.type === 'reveal' &&
            effect.target?.type === 'area') {
          const area = effect.target.value as Coordinate[]
          if (area.some(c => c.x === coordinate.x && c.y === coordinate.y)) {
            return true
          }
        }
      }
    }
    return false
  }

  // =============================================
  // SYNCHRONIZATION
  // =============================================

  /**
   * Get sync data for multiplayer
   */
  getSyncData(): AbilitySyncData {
    const abilityStates = new Map<string, any>()
    const allEffects: ActiveEffect[] = []

    this.shipAbilities.forEach((abilities, shipId) => {
      abilities.forEach(ability => {
        abilityStates.set(
          `${shipId}_${ability.id}`,
          ability.getInstance()
        )
      })
      allEffects.push(...this.processor.getActiveEffects(shipId))
    })

    return {
      abilityStates,
      activeEffects: allEffects,
      pendingActivations: this.processor.getActivationHistory()
    }
  }

  /**
   * Apply sync data from multiplayer
   */
  applySyncData(data: AbilitySyncData): void {
    // Apply ability states
    data.abilityStates.forEach((state, key) => {
      const [shipId, abilityId] = key.split('_')
      const abilities = this.shipAbilities.get(shipId)
      if (abilities) {
        const ability = abilities.find(a => a.id === abilityId)
        if (ability) {
          // Update ability instance state
          const instance = ability.getInstance()
          Object.assign(instance, state)
        }
      }
    })

    // Apply active effects
    // This would need more sophisticated merging in production
  }

  /**
   * Sync ability state for a ship
   */
  private syncAbilityState(shipId: string): void {
    if (!this.config.syncEnabled) return

    // In production, this would send state updates to server/peers
    const abilities = this.shipAbilities.get(shipId)
    if (abilities) {
      const states = abilities.map(a => ({
        id: a.id,
        instance: a.getInstance()
      }))
      // Send to sync system
      console.log('[AbilityEngine] Syncing abilities for ship:', shipId, states)
    }
  }

  // =============================================
  // UTILITY
  // =============================================

  /**
   * Reset engine for new game
   */
  reset(): void {
    this.shipAbilities.clear()
    this.processor.reset()
    this.currentTurn = 0
  }

  /**
   * Get ability by ID for a ship
   */
  getShipAbility(shipId: string, abilityId: string): BaseAbility | undefined {
    const abilities = this.shipAbilities.get(shipId)
    return abilities?.find(a => a.id === abilityId)
  }

  /**
   * Get all abilities for a ship
   */
  getShipAbilities(shipId: string): BaseAbility[] {
    return this.shipAbilities.get(shipId) || []
  }
}
/**
 * Ability Processor
 * Handles ability execution pipeline and validation
 */

import { BaseAbility } from './BaseAbility'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityValidation,
  AbilityActivationEvent,
  ActiveEffect
} from './types'
import { GameShip } from '../../game/types'

export interface ProcessorConfig {
  enableValidation: boolean
  enableLogging: boolean
  maxAbilitiesPerTurn: number
  globalCooldownTurns: number
}

export class AbilityProcessor {
  private config: ProcessorConfig
  private activationHistory: AbilityActivationEvent[] = []
  private activeEffects: Map<string, ActiveEffect[]> = new Map()
  private globalCooldowns: Map<string, number> = new Map()

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = {
      enableValidation: true,
      enableLogging: true,
      maxAbilitiesPerTurn: 1,
      globalCooldownTurns: 0,
      ...config
    }
  }

  /**
   * Process ability activation
   */
  async processAbilityActivation(
    ability: BaseAbility,
    context: AbilityContext
  ): Promise<AbilityExecutionResult> {
    // Pre-execution validation
    if (this.config.enableValidation) {
      const validation = this.validateAbilityActivation(ability, context)
      if (!validation.canActivate) {
        return {
          success: false,
          effects: [],
          messages: [],
          errors: [validation.reason || 'Ability validation failed']
        }
      }
    }

    // Check global cooldown
    const globalCooldown = this.globalCooldowns.get(context.player.id) || 0
    if (globalCooldown > 0) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: [`Global cooldown active: ${globalCooldown} turns remaining`]
      }
    }

    // Execute ability
    const result = ability.activate(context)

    if (result.success) {
      // Record activation
      const event: AbilityActivationEvent = {
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        playerId: context.player.id,
        shipId: context.ship.id,
        abilityId: ability.id,
        targetData: context.targetData,
        result
      }
      this.activationHistory.push(event)

      // Apply global cooldown if configured
      if (this.config.globalCooldownTurns > 0) {
        this.globalCooldowns.set(context.player.id, this.config.globalCooldownTurns)
      }

      // Store active effects
      if (result.statusEffectsApplied) {
        this.storeActiveEffects(context.ship.id, result.statusEffectsApplied)
      }

      // Log activation
      if (this.config.enableLogging) {
        this.logAbilityActivation(ability, context, result)
      }
    }

    return result
  }

  /**
   * Validate ability activation
   */
  private validateAbilityActivation(
    ability: BaseAbility,
    context: AbilityContext
  ): AbilityValidation {
    // Check ability's own validation
    const abilityValidation = ability.validate(context)
    if (!abilityValidation.canActivate) {
      return abilityValidation
    }

    // Check abilities per turn limit
    const turnsThisTurn = this.getAbilitiesUsedThisTurn(
      context.player.id,
      context.currentTurn
    )
    if (turnsThisTurn >= this.config.maxAbilitiesPerTurn) {
      return {
        canActivate: false,
        reason: `Maximum ${this.config.maxAbilitiesPerTurn} abilities per turn`
      }
    }

    // Check if ship has moved (for certain abilities)
    // This would need to be tracked in actual game state

    return { canActivate: true }
  }

  /**
   * Process triggered abilities
   */
  processTriggeredAbilities(
    trigger: string,
    context: AbilityContext,
    abilities: BaseAbility[]
  ): AbilityExecutionResult[] {
    const results: AbilityExecutionResult[] = []

    abilities.forEach(ability => {
      const definition = ability.getDefinition()

      // Check if ability has this trigger
      if (definition.triggers && definition.triggers.includes(trigger as any)) {
        // Check if ability can be triggered
        const validation = ability.validate(context)
        if (validation.canActivate) {
          const result = ability.activate(context)
          results.push(result)
        }
      }
    })

    return results
  }

  /**
   * Update all abilities at turn end
   */
  updateTurnEnd(playerId: string, ships: GameShip[]): void {
    // Update global cooldowns
    const globalCooldown = this.globalCooldowns.get(playerId) || 0
    if (globalCooldown > 0) {
      this.globalCooldowns.set(playerId, globalCooldown - 1)
    }

    // Update active effects
    ships.forEach(ship => {
      const effects = this.activeEffects.get(ship.id) || []
      const updatedEffects = effects.filter(effect => {
        if (effect.remainingDuration > 0) {
          effect.remainingDuration--
          return effect.remainingDuration > 0
        }
        return false
      })
      this.activeEffects.set(ship.id, updatedEffects)

      // Update abilities on the ship
      ship.abilities.forEach(shipAbility => {
        if (shipAbility.currentCooldown > 0) {
          shipAbility.currentCooldown--
        }
      })
    })
  }

  /**
   * Get all active effects for a ship
   */
  getActiveEffects(shipId: string): ActiveEffect[] {
    return this.activeEffects.get(shipId) || []
  }

  /**
   * Check if a ship has a specific effect type
   */
  hasEffect(shipId: string, effectType: string): boolean {
    const effects = this.getActiveEffects(shipId)
    return effects.some(e => e.effect.type === effectType && e.remainingDuration > 0)
  }

  /**
   * Get effect magnitude for a ship
   */
  getEffectMagnitude(shipId: string, effectType: string): number {
    const effects = this.getActiveEffects(shipId)
    const effect = effects.find(
      e => e.effect.type === effectType && e.remainingDuration > 0
    )
    return effect ? effect.effect.magnitude : 0
  }

  /**
   * Remove all effects of a specific type
   */
  removeEffects(shipId: string, effectType: string): void {
    const effects = this.activeEffects.get(shipId) || []
    const filtered = effects.filter(e => e.effect.type !== effectType)
    this.activeEffects.set(shipId, filtered)
  }

  /**
   * Clear all effects for a ship
   */
  clearShipEffects(shipId: string): void {
    this.activeEffects.delete(shipId)
  }

  /**
   * Store active effects
   */
  private storeActiveEffects(shipId: string, effects: ActiveEffect[]): void {
    const existing = this.activeEffects.get(shipId) || []
    this.activeEffects.set(shipId, [...existing, ...effects])
  }

  /**
   * Get abilities used this turn
   */
  private getAbilitiesUsedThisTurn(playerId: string, turnNumber: number): number {
    const turnStart = new Date()
    turnStart.setMinutes(turnStart.getMinutes() - 5) // Last 5 minutes

    return this.activationHistory.filter(
      event => event.playerId === playerId &&
               event.timestamp >= turnStart
    ).length
  }

  /**
   * Log ability activation
   */
  private logAbilityActivation(
    ability: BaseAbility,
    context: AbilityContext,
    result: AbilityExecutionResult
  ): void {
    console.log('[AbilityProcessor]', {
      ability: ability.name,
      ship: context.ship.name,
      player: context.player.id,
      success: result.success,
      effects: result.effects.length,
      messages: result.messages
    })
  }

  /**
   * Get activation history
   */
  getActivationHistory(playerId?: string): AbilityActivationEvent[] {
    if (playerId) {
      return this.activationHistory.filter(e => e.playerId === playerId)
    }
    return [...this.activationHistory]
  }

  /**
   * Clear all data (for new game)
   */
  reset(): void {
    this.activationHistory = []
    this.activeEffects.clear()
    this.globalCooldowns.clear()
  }
}
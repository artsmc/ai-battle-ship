/**
 * Base Ability Abstract Class
 * Foundation for all ship abilities in the game
 */

import {
  AbilityDefinition,
  AbilityInstance,
  AbilityContext,
  AbilityExecutionResult,
  AbilityValidation,
  AbilityType,
  AbilityEffect,
  ActiveEffect,
  AppliedEffect
} from './types'
import { Coordinate } from '../../game/types'

export abstract class BaseAbility {
  protected definition: AbilityDefinition
  protected instance: AbilityInstance

  constructor(definition: AbilityDefinition, instance: AbilityInstance) {
    this.definition = definition
    this.instance = instance
  }

  // =============================================
  // ABSTRACT METHODS
  // =============================================

  /**
   * Execute the ability's main effect
   */
  protected abstract executeEffect(context: AbilityContext): AbilityExecutionResult

  /**
   * Calculate ability-specific targeting
   */
  protected abstract calculateTargets(context: AbilityContext): Coordinate[] | string[]

  // =============================================
  // PUBLIC METHODS
  // =============================================

  /**
   * Validate if ability can be activated
   */
  validate(context: AbilityContext): AbilityValidation {
    // Check if ability is active
    if (!this.instance.isActive) {
      return {
        canActivate: false,
        reason: 'Ability is disabled'
      }
    }

    // Check cooldown
    if (this.instance.currentCooldown > 0) {
      return {
        canActivate: false,
        reason: 'Ability is on cooldown',
        cooldownRemaining: this.instance.currentCooldown
      }
    }

    // Check uses
    if (this.definition.maxUses !== undefined && this.instance.remainingUses !== undefined) {
      if (this.instance.remainingUses <= 0) {
        return {
          canActivate: false,
          reason: 'No uses remaining',
          usesRemaining: 0
        }
      }
    }

    // Check ship requirements
    if (this.definition.requiredShipClass &&
        !this.definition.requiredShipClass.includes(context.ship.class)) {
      return {
        canActivate: false,
        reason: 'Ship class cannot use this ability',
        missingRequirements: [`Ship class: ${this.definition.requiredShipClass.join(', ')}`]
      }
    }

    // Check custom validation
    if (this.definition.canActivate && !this.definition.canActivate(context)) {
      return {
        canActivate: false,
        reason: 'Ability conditions not met'
      }
    }

    // Check if ship is sunk
    if (context.ship.damage.isSunk) {
      return {
        canActivate: false,
        reason: 'Ship is sunk'
      }
    }

    return {
      canActivate: true,
      usesRemaining: this.instance.remainingUses,
      cooldownRemaining: 0
    }
  }

  /**
   * Activate the ability
   */
  activate(context: AbilityContext): AbilityExecutionResult {
    // Validate activation
    const validation = this.validate(context)
    if (!validation.canActivate) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: [validation.reason || 'Cannot activate ability']
      }
    }

    // Execute the ability effect
    const result = this.executeEffect(context)

    if (result.success) {
      // Update cooldown
      this.instance.currentCooldown = this.definition.cooldownTurns

      // Update uses
      if (this.instance.remainingUses !== undefined) {
        this.instance.remainingUses--
      }

      // Update statistics
      this.instance.timesUsed++
      this.instance.lastUsedTurn = context.currentTurn

      // Track damage if applicable
      if (result.damageDealt) {
        this.instance.totalDamageDealt =
          (this.instance.totalDamageDealt || 0) + result.damageDealt
      }
    }

    return result
  }

  /**
   * Update ability state at turn end
   */
  updateTurnEnd(): void {
    // Reduce cooldown
    if (this.instance.currentCooldown > 0) {
      this.instance.currentCooldown--
    }

    // Update active effects
    this.instance.activeEffects = this.instance.activeEffects.filter(effect => {
      if (effect.remainingDuration > 0) {
        effect.remainingDuration--
        return effect.remainingDuration > 0
      }
      return false
    })
  }

  // =============================================
  // PROTECTED HELPER METHODS
  // =============================================

  /**
   * Create an active effect from ability execution
   */
  protected createActiveEffect(
    effect: AbilityEffect,
    duration: number,
    target?: { type: string; value: Coordinate | string | Coordinate[] }
  ): ActiveEffect {
    return {
      id: `effect_${Date.now()}_${Math.random()}`,
      effect,
      startTurn: this.instance.lastUsedTurn || 0,
      remainingDuration: duration,
      source: {
        abilityId: this.definition.id,
        shipId: this.instance.shipId,
        playerId: this.instance.playerId
      },
      target
    }
  }

  /**
   * Create an applied effect for result reporting
   */
  protected createAppliedEffect(
    type: string,
    target: string | Coordinate | Coordinate[],
    magnitude: number,
    description: string
  ): AppliedEffect {
    return {
      type,
      target,
      magnitude,
      description
    }
  }

  /**
   * Get coordinates in area around center
   */
  protected getAreaCoordinates(
    center: Coordinate,
    radius: number,
    boardSize: number = 10
  ): Coordinate[] {
    const coordinates: Coordinate[] = []

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = center.x + dx
        const y = center.y + dy

        // Check bounds
        if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
          coordinates.push({ x, y })
        }
      }
    }

    return coordinates
  }

  /**
   * Get coordinates in a line
   */
  protected getLineCoordinates(
    start: Coordinate,
    direction: 'horizontal' | 'vertical' | 'diagonal',
    length: number,
    boardSize: number = 10
  ): Coordinate[] {
    const coordinates: Coordinate[] = []
    let dx = 0, dy = 0

    switch (direction) {
      case 'horizontal':
        dx = 1
        break
      case 'vertical':
        dy = 1
        break
      case 'diagonal':
        dx = 1
        dy = 1
        break
    }

    for (let i = 0; i < length; i++) {
      const x = start.x + (dx * i)
      const y = start.y + (dy * i)

      if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
        coordinates.push({ x, y })
      }
    }

    return coordinates
  }

  // =============================================
  // GETTERS
  // =============================================

  get id(): string {
    return this.definition.id
  }

  get name(): string {
    return this.definition.name
  }

  get description(): string {
    return this.definition.description
  }

  get type(): AbilityType {
    return this.definition.type
  }

  get cooldownRemaining(): number {
    return this.instance.currentCooldown
  }

  get usesRemaining(): number | undefined {
    return this.instance.remainingUses
  }

  get isReady(): boolean {
    return this.instance.isActive && this.instance.currentCooldown === 0
  }

  getDefinition(): AbilityDefinition {
    return this.definition
  }

  getInstance(): AbilityInstance {
    return this.instance
  }
}
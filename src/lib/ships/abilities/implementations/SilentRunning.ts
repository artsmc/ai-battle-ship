/**
 * Silent Running Ability
 * Submarine special ability - Remain hidden until first attack
 */

import { BaseAbility } from '../BaseAbility'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityDefinition,
  AbilityType,
  AbilityCategory,
  AbilityTargetType,
  AbilityValidation,
  StealthEffect
} from '../types'
import { ShipClass, ShipEra } from '../../../database/types/enums'
import { Coordinate } from '../../../game/types'

export class SilentRunningAbility extends BaseAbility {
  static readonly DEFINITION: AbilityDefinition = {
    id: 'silent_running',
    name: 'Silent Running',
    description: 'Submarine remains undetectable until it makes its first attack',
    type: AbilityType.PASSIVE,
    category: AbilityCategory.DEFENSIVE,
    targetType: AbilityTargetType.SELF,

    // Requirements
    requiredShipClass: [ShipClass.SUBMARINE],
    requiredEra: [ShipEra.SUPER_DREADNOUGHT, ShipEra.MODERN],

    // Costs (passive ability, always active)
    cooldownTurns: 0,

    // Effects
    effects: [
      {
        type: 'stealth',
        magnitude: 100, // 100% detection resistance
        duration: -1, // Until broken
        stackable: false
      } as StealthEffect
    ],

    // UI
    icon: 'submarine-stealth',
    sound: 'submarine-dive'
  }

  private hasAttacked: boolean = false

  protected calculateTargets(context: AbilityContext): string[] {
    return [context.ship.id]
  }

  protected executeEffect(context: AbilityContext): AbilityExecutionResult {
    // Check if submarine has already attacked
    if (this.hasAttacked) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Silent Running already broken - submarine has attacked']
      }
    }

    const stealthEffect: StealthEffect = {
      type: 'stealth',
      magnitude: 100,
      detectionResistance: 100,
      breakOnAttack: true,
      duration: -1, // Permanent until broken
      stackable: false
    }

    // Create active effect
    const activeEffect = this.createActiveEffect(
      stealthEffect,
      999, // Effectively permanent
      { type: 'ship', value: context.ship.id }
    )

    // Clear any existing stealth effects
    this.instance.activeEffects = this.instance.activeEffects.filter(
      e => e.effect.type !== 'stealth'
    )

    // Add new stealth effect
    this.instance.activeEffects.push(activeEffect)

    // Make ship cells hidden on opponent's tracking
    if (context.ship.position) {
      context.ship.position.coordinates.forEach(coord => {
        const cell = context.boardState.cells[coord.y]?.[coord.x]
        if (cell && cell.shipId === context.ship.id) {
          cell.isRevealed = false
        }
      })
    }

    const appliedEffect = this.createAppliedEffect(
      'stealth',
      context.ship.id,
      100,
      'Submarine is running silent - undetectable until first attack'
    )

    return {
      success: true,
      effects: [appliedEffect],
      messages: [
        `${context.ship.name} engages Silent Running`,
        'Submarine is now undetectable'
      ],
      statusEffectsApplied: [activeEffect]
    }
  }

  /**
   * Break stealth when submarine attacks
   */
  breakStealth(context: AbilityContext): void {
    this.hasAttacked = true

    // Remove stealth effects
    this.instance.activeEffects = this.instance.activeEffects.filter(
      effect => effect.effect.type !== 'stealth'
    )

    // Reveal submarine position
    if (context.ship.position) {
      context.ship.position.coordinates.forEach(coord => {
        const cell = context.boardState.cells[coord.y]?.[coord.x]
        if (cell && cell.shipId === context.ship.id) {
          cell.isRevealed = true
        }
      })
    }
  }

  /**
   * Check if stealth is active
   */
  isStealthActive(): boolean {
    if (this.hasAttacked) {
      return false
    }

    return this.instance.activeEffects.some(
      effect => effect.effect.type === 'stealth' && effect.remainingDuration > 0
    )
  }

  /**
   * Get detection resistance level
   */
  getDetectionResistance(): number {
    if (this.hasAttacked) {
      return 0
    }

    const stealthEffect = this.instance.activeEffects.find(
      effect => effect.effect.type === 'stealth' && effect.remainingDuration > 0
    )

    if (stealthEffect && stealthEffect.effect.type === 'stealth') {
      return (stealthEffect.effect as StealthEffect).detectionResistance
    }

    return 0
  }

  /**
   * Check if submarine can be detected by a specific detection level
   */
  canBeDetected(detectionPower: number): boolean {
    const resistance = this.getDetectionResistance()
    return detectionPower > resistance
  }

  /**
   * Handle attack event - breaks stealth
   */
  onAttack(context: AbilityContext): void {
    if (!this.hasAttacked && this.isStealthActive()) {
      this.breakStealth(context)
    }
  }

  /**
   * Reset stealth (for new game)
   */
  reset(): void {
    this.hasAttacked = false
    this.instance.activeEffects = []
  }

  /**
   * Override validate to always allow passive ability
   */
  validate(context: AbilityContext): AbilityValidation {
    // Passive ability is always valid if ship meets requirements
    if (!context.ship.damage.isSunk &&
        this.definition.requiredShipClass?.includes(context.ship.class)) {
      return {
        canActivate: true
      }
    }

    return {
      canActivate: false,
      reason: 'Ship requirements not met'
    }
  }
}
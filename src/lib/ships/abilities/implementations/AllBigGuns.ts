/**
 * All Big Guns Ability
 * Dreadnought special ability - Extra damage for one attack
 */

import { BaseAbility } from '../BaseAbility'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityDefinition,
  AbilityType,
  AbilityCategory,
  AbilityTargetType,
  DamageBoostEffect
} from '../types'
import { ShipClass, ShipEra } from '../../../database/types/enums'
import { Coordinate } from '../../../game/types'

export class AllBigGunsAbility extends BaseAbility {
  static readonly DEFINITION: AbilityDefinition = {
    id: 'all_big_guns',
    name: 'All Big Guns',
    description: 'Fire a devastating salvo with +50% damage on your next attack',
    type: AbilityType.ACTIVE,
    category: AbilityCategory.OFFENSIVE,
    targetType: AbilityTargetType.SELF,

    // Requirements
    requiredShipClass: [ShipClass.BATTLESHIP],
    requiredEra: [ShipEra.DREADNOUGHT, ShipEra.SUPER_DREADNOUGHT],
    minShipSize: 4,

    // Costs
    cooldownTurns: 3,
    maxUses: 2,

    // Effects
    effects: [
      {
        type: 'damage_boost',
        magnitude: 1.5,
        duration: 1,
        stackable: false
      } as DamageBoostEffect
    ],

    // UI
    icon: 'cannon-salvo',
    sound: 'heavy-artillery'
  }

  protected calculateTargets(context: AbilityContext): Coordinate[] | string[] {
    // This ability affects the ship itself
    return [context.ship.id]
  }

  protected executeEffect(context: AbilityContext): AbilityExecutionResult {
    const damageBoostEffect: DamageBoostEffect = {
      type: 'damage_boost',
      magnitude: 1.5,
      damageMultiplier: 1.5,
      duration: 1,
      stackable: false,
      attackTypes: ['normal', 'critical']
    }

    // Create active effect
    const activeEffect = this.createActiveEffect(
      damageBoostEffect,
      1,
      { type: 'ship', value: context.ship.id }
    )

    // Add to ship's active effects
    this.instance.activeEffects.push(activeEffect)

    // Create result
    const appliedEffect = this.createAppliedEffect(
      'damage_boost',
      context.ship.id,
      50,
      'Next attack will deal +50% damage'
    )

    return {
      success: true,
      effects: [appliedEffect],
      messages: [
        `${context.ship.name} prepares All Big Guns!`,
        'Next attack will deal +50% damage'
      ],
      statusEffectsApplied: [activeEffect]
    }
  }

  /**
   * Check if damage boost is active
   */
  isDamageBoostActive(): boolean {
    return this.instance.activeEffects.some(
      effect => effect.effect.type === 'damage_boost' && effect.remainingDuration > 0
    )
  }

  /**
   * Get current damage multiplier
   */
  getDamageMultiplier(): number {
    const boostEffect = this.instance.activeEffects.find(
      effect => effect.effect.type === 'damage_boost' && effect.remainingDuration > 0
    )

    if (boostEffect && boostEffect.effect.type === 'damage_boost') {
      return (boostEffect.effect as DamageBoostEffect).damageMultiplier
    }

    return 1.0
  }

  /**
   * Consume damage boost on attack
   */
  consumeDamageBoost(): void {
    const boostIndex = this.instance.activeEffects.findIndex(
      effect => effect.effect.type === 'damage_boost'
    )

    if (boostIndex !== -1) {
      // Remove the effect after use
      this.instance.activeEffects.splice(boostIndex, 1)
    }
  }
}
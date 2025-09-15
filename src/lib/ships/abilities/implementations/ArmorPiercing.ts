/**
 * Armor Piercing Ability
 * Super-Dreadnought special ability - Ignore light armor
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

export class ArmorPiercingAbility extends BaseAbility {
  static readonly DEFINITION: AbilityDefinition = {
    id: 'armor_piercing',
    name: 'Armor-Piercing Shells',
    description: 'Load armor-piercing rounds that ignore up to 3 points of armor',
    type: AbilityType.ACTIVE,
    category: AbilityCategory.OFFENSIVE,
    targetType: AbilityTargetType.SELF,

    // Requirements
    requiredShipClass: [ShipClass.BATTLESHIP],
    requiredEra: [ShipEra.SUPER_DREADNOUGHT],
    minShipSize: 5,

    // Costs
    cooldownTurns: 4,
    maxUses: 3,

    // Effects
    effects: [
      {
        type: 'armor_piercing',
        magnitude: 3, // Ignore 3 armor points
        duration: 2, // Lasts for 2 turns
        stackable: false
      }
    ],

    // UI
    icon: 'armor-piercing-shell',
    sound: 'heavy-shell-load'
  }

  protected calculateTargets(context: AbilityContext): string[] {
    return [context.ship.id]
  }

  protected executeEffect(context: AbilityContext): AbilityExecutionResult {
    const armorPiercingEffect = {
      type: 'armor_piercing',
      magnitude: 3,
      armorPenetration: 3,
      duration: 2,
      stackable: false
    }

    // Create active effect
    const activeEffect = this.createActiveEffect(
      armorPiercingEffect,
      2,
      { type: 'ship', value: context.ship.id }
    )

    // Clear any existing armor piercing effects
    this.instance.activeEffects = this.instance.activeEffects.filter(
      e => e.effect.type !== 'armor_piercing'
    )

    // Add new effect
    this.instance.activeEffects.push(activeEffect)

    const appliedEffect = this.createAppliedEffect(
      'armor_piercing',
      context.ship.id,
      3,
      'Attacks will ignore up to 3 points of armor for 2 turns'
    )

    return {
      success: true,
      effects: [appliedEffect],
      messages: [
        `${context.ship.name} loads Armor-Piercing Shells!`,
        'Next 2 turns will penetrate heavy armor'
      ],
      statusEffectsApplied: [activeEffect]
    }
  }

  /**
   * Check if armor piercing is active
   */
  isArmorPiercingActive(): boolean {
    return this.instance.activeEffects.some(
      effect => effect.effect.type === 'armor_piercing' && effect.remainingDuration > 0
    )
  }

  /**
   * Get armor penetration value
   */
  getArmorPenetration(): number {
    const apEffect = this.instance.activeEffects.find(
      effect => effect.effect.type === 'armor_piercing' && effect.remainingDuration > 0
    )

    if (apEffect) {
      return apEffect.effect.magnitude
    }

    return 0
  }

  /**
   * Calculate effective damage against armored target
   */
  calculateEffectiveDamage(baseDamage: number, targetArmor: number): number {
    const penetration = this.getArmorPenetration()
    const effectiveArmor = Math.max(0, targetArmor - penetration)

    // Calculate damage reduction from remaining armor
    const armorReduction = effectiveArmor * 0.1 // 10% reduction per armor point
    const damageMultiplier = Math.max(0.2, 1 - armorReduction) // Minimum 20% damage

    return Math.round(baseDamage * damageMultiplier)
  }

  /**
   * Get remaining turns for armor piercing
   */
  getRemainingTurns(): number {
    const apEffect = this.instance.activeEffects.find(
      effect => effect.effect.type === 'armor_piercing' && effect.remainingDuration > 0
    )

    return apEffect ? apEffect.remainingDuration : 0
  }
}
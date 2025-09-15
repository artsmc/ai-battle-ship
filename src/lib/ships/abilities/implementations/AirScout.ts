/**
 * Air Scout Ability
 * Aircraft Carrier special ability - Reveal ship positions in area
 */

import { BaseAbility } from '../BaseAbility'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityDefinition,
  AbilityType,
  AbilityCategory,
  AbilityTargetType,
  RevealEffect
} from '../types'
import { ShipClass, ShipEra } from '../../../database/types/enums'
import { Coordinate } from '../../../game/types'

export class AirScoutAbility extends BaseAbility {
  static readonly DEFINITION: AbilityDefinition = {
    id: 'air_scout',
    name: 'Air Scout',
    description: 'Launch reconnaissance aircraft to reveal a 3x3 area for 3 turns',
    type: AbilityType.ACTIVE,
    category: AbilityCategory.DETECTION,
    targetType: AbilityTargetType.AREA,

    // Requirements
    requiredShipClass: [ShipClass.CARRIER],
    requiredEra: [ShipEra.MODERN],

    // Costs
    cooldownTurns: 4,
    maxUses: 3,

    // Effects
    effects: [
      {
        type: 'reveal',
        magnitude: 3,
        duration: 3,
        stackable: false
      } as RevealEffect
    ],

    // UI
    icon: 'aircraft-scout',
    sound: 'aircraft-launch'
  }

  protected calculateTargets(context: AbilityContext): Coordinate[] {
    if (!context.targetData?.coordinates || context.targetData.coordinates.length === 0) {
      return []
    }

    // Get 3x3 area around target coordinate
    const center = context.targetData.coordinates[0]
    return this.getAreaCoordinates(center, 1, 10) // radius 1 = 3x3 area
  }

  protected executeEffect(context: AbilityContext): AbilityExecutionResult {
    // Validate target data
    if (!context.targetData?.coordinates || context.targetData.coordinates.length === 0) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Air Scout requires target coordinates']
      }
    }

    const center = context.targetData.coordinates[0]
    const targetArea = this.calculateTargets(context)

    if (targetArea.length === 0) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Invalid target area']
      }
    }

    const revealEffect: RevealEffect = {
      type: 'reveal',
      magnitude: 3,
      revealRadius: 1,
      revealDuration: 3,
      duration: 3,
      stackable: false
    }

    // Create active effect
    const activeEffect = this.createActiveEffect(
      revealEffect,
      3,
      { type: 'area', value: targetArea }
    )

    // Add to active effects
    this.instance.activeEffects.push(activeEffect)

    // Reveal cells in opponent's board
    const revealedCoordinates: Coordinate[] = []
    const shipsRevealed: string[] = []

    if (context.opponent) {
      targetArea.forEach(coord => {
        const cell = context.opponent!.board.cells[coord.y]?.[coord.x]
        if (cell) {
          if (!cell.isRevealed) {
            cell.isRevealed = true
            revealedCoordinates.push(coord)
          }
          if (cell.hasShip && cell.shipId) {
            if (!shipsRevealed.includes(cell.shipId)) {
              shipsRevealed.push(cell.shipId)
            }
          }
        }
      })
    }

    const appliedEffect = this.createAppliedEffect(
      'reveal',
      targetArea,
      targetArea.length,
      `Revealed ${targetArea.length} cells for 3 turns`
    )

    const messages = [`${context.ship.name} launches reconnaissance aircraft!`]
    if (shipsRevealed.length > 0) {
      messages.push(`${shipsRevealed.length} enemy ship(s) detected in the area!`)
    } else {
      messages.push('No enemy ships detected in the scouted area')
    }

    return {
      success: true,
      effects: [appliedEffect],
      messages,
      coordinatesRevealed: revealedCoordinates,
      shipsRevealed,
      statusEffectsApplied: [activeEffect]
    }
  }

  /**
   * Get currently revealed areas
   */
  getRevealedAreas(): Coordinate[][] {
    const areas: Coordinate[][] = []

    this.instance.activeEffects.forEach(effect => {
      if (effect.effect.type === 'reveal' &&
          effect.remainingDuration > 0 &&
          effect.target?.type === 'area') {
        areas.push(effect.target.value as Coordinate[])
      }
    })

    return areas
  }

  /**
   * Check if a coordinate is currently revealed by this ability
   */
  isCoordinateRevealed(coord: Coordinate): boolean {
    return this.instance.activeEffects.some(effect => {
      if (effect.effect.type === 'reveal' &&
          effect.remainingDuration > 0 &&
          effect.target?.type === 'area') {
        const area = effect.target.value as Coordinate[]
        return area.some(c => c.x === coord.x && c.y === coord.y)
      }
      return false
    })
  }

  /**
   * Get remaining reveal duration for an area
   */
  getRevealDuration(coord: Coordinate): number {
    const effect = this.instance.activeEffects.find(e => {
      if (e.effect.type === 'reveal' &&
          e.remainingDuration > 0 &&
          e.target?.type === 'area') {
        const area = e.target.value as Coordinate[]
        return area.some(c => c.x === coord.x && c.y === coord.y)
      }
      return false
    })

    return effect ? effect.remainingDuration : 0
  }
}
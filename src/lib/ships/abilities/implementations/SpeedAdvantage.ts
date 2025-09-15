/**
 * Speed Advantage Ability
 * Battlecruiser special ability - Move after being hit
 */

import { BaseAbility } from '../BaseAbility'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityDefinition,
  AbilityType,
  AbilityCategory,
  AbilityTargetType,
  AbilityTrigger,
  MovementEffect
} from '../types'
import { ShipClass, ShipEra } from '../../../database/types/enums'
import { Coordinate } from '../../../game/types'

export class SpeedAdvantageAbility extends BaseAbility {
  static readonly DEFINITION: AbilityDefinition = {
    id: 'speed_advantage',
    name: 'Speed Advantage',
    description: 'Use superior speed to reposition after taking damage',
    type: AbilityType.TRIGGERED,
    category: AbilityCategory.MOVEMENT,
    targetType: AbilityTargetType.SELF,

    // Requirements
    requiredShipClass: [ShipClass.BATTLECRUISER],
    requiredEra: [
      ShipEra.DREADNOUGHT,
      ShipEra.SUPER_DREADNOUGHT,
      ShipEra.BATTLECRUISER
    ],

    // Costs
    cooldownTurns: 2,
    maxUses: 3,

    // Effects
    effects: [
      {
        type: 'movement',
        magnitude: 1,
        duration: 1,
        stackable: false
      } as MovementEffect
    ],

    // Triggers
    triggers: [AbilityTrigger.ON_DAMAGE],

    // UI
    icon: 'speed-boost',
    sound: 'engine-boost'
  }

  protected calculateTargets(context: AbilityContext): Coordinate[] | string[] {
    return [context.ship.id]
  }

  protected executeEffect(context: AbilityContext): AbilityExecutionResult {
    // Check if triggered by damage
    if (!context.damageContext) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Speed Advantage requires damage context']
      }
    }

    // Calculate available movement positions
    const currentPosition = context.ship.position
    if (!currentPosition) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Ship has no position']
      }
    }

    // Get adjacent empty positions for movement
    const availablePositions = this.getAvailableMovementPositions(
      context,
      currentPosition.startPosition,
      2 // Movement range
    )

    if (availablePositions.length === 0) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['No available positions to move to']
      }
    }

    const movementEffect: MovementEffect = {
      type: 'movement',
      magnitude: 2,
      allowExtraMove: true,
      movementRange: 2,
      duration: 1,
      stackable: false
    }

    // Create active effect
    const activeEffect = this.createActiveEffect(
      movementEffect,
      1,
      { type: 'ship', value: context.ship.id }
    )

    // Add to ship's active effects
    this.instance.activeEffects.push(activeEffect)

    const appliedEffect = this.createAppliedEffect(
      'movement',
      context.ship.id,
      2,
      'Ship can reposition up to 2 cells'
    )

    return {
      success: true,
      effects: [appliedEffect],
      messages: [
        `${context.ship.name} uses Speed Advantage!`,
        'Ship can now reposition to avoid further damage'
      ],
      statusEffectsApplied: [activeEffect]
    }
  }

  /**
   * Get available positions for movement
   */
  private getAvailableMovementPositions(
    context: AbilityContext,
    currentPos: Coordinate,
    range: number
  ): Coordinate[] {
    const positions: Coordinate[] = []
    const boardSize = 10

    // Check all positions within range
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (dx === 0 && dy === 0) continue // Skip current position

        const newX = currentPos.x + dx
        const newY = currentPos.y + dy

        // Check bounds
        if (newX < 0 || newX >= boardSize || newY < 0 || newY >= boardSize) {
          continue
        }

        // Check if position is valid for ship placement
        const newPos = { x: newX, y: newY }
        if (this.isValidMovementPosition(context, newPos)) {
          positions.push(newPos)
        }
      }
    }

    return positions
  }

  /**
   * Check if a position is valid for movement
   */
  private isValidMovementPosition(
    context: AbilityContext,
    position: Coordinate
  ): boolean {
    // Check if position is empty
    const cell = context.boardState.cells[position.y]?.[position.x]
    if (!cell || cell.hasShip) {
      return false
    }

    // Check if entire ship can fit at new position
    const shipSize = context.ship.size
    const orientation = context.ship.position?.orientation || 'horizontal'

    for (let i = 0; i < shipSize; i++) {
      const checkX = orientation === 'horizontal' ? position.x + i : position.x
      const checkY = orientation === 'vertical' ? position.y + i : position.y

      // Check bounds
      if (checkX >= 10 || checkY >= 10) {
        return false
      }

      // Check if cell is occupied
      const checkCell = context.boardState.cells[checkY]?.[checkX]
      if (!checkCell || (checkCell.hasShip && checkCell.shipId !== context.ship.id)) {
        return false
      }
    }

    return true
  }

  /**
   * Check if movement is available
   */
  isMovementAvailable(): boolean {
    return this.instance.activeEffects.some(
      effect => effect.effect.type === 'movement' && effect.remainingDuration > 0
    )
  }

  /**
   * Get movement range
   */
  getMovementRange(): number {
    const movementEffect = this.instance.activeEffects.find(
      effect => effect.effect.type === 'movement' && effect.remainingDuration > 0
    )

    if (movementEffect && movementEffect.effect.type === 'movement') {
      return (movementEffect.effect as MovementEffect).movementRange
    }

    return 0
  }
}
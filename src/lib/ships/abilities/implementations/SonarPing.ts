/**
 * Sonar Ping Ability
 * Modern ship special ability - Detect submarines with advanced sensors
 */

import { BaseAbility } from '../BaseAbility'
import {
  AbilityContext,
  AbilityExecutionResult,
  AbilityDefinition,
  AbilityType,
  AbilityCategory,
  AbilityTargetType,
  DetectionEffect
} from '../types'
import { ShipClass, ShipEra } from '../../../database/types/enums'
import { Coordinate, GameShip } from '../../../game/types'

export class SonarPingAbility extends BaseAbility {
  static readonly DEFINITION: AbilityDefinition = {
    id: 'sonar_ping',
    name: 'Sonar Ping',
    description: 'Use advanced sonar to detect hidden ships including submarines in a 5x5 area',
    type: AbilityType.ACTIVE,
    category: AbilityCategory.DETECTION,
    targetType: AbilityTargetType.AREA,

    // Requirements
    requiredShipClass: [
      ShipClass.DESTROYER,
      ShipClass.FRIGATE,
      ShipClass.HEAVY_CRUISER
    ],
    requiredEra: [ShipEra.MODERN],

    // Costs
    cooldownTurns: 3,
    maxUses: 4,

    // Effects
    effects: [
      {
        type: 'detection',
        magnitude: 150, // Can overcome 100% stealth
        duration: 2,
        stackable: false
      } as DetectionEffect
    ],

    // UI
    icon: 'sonar-wave',
    sound: 'sonar-ping'
  }

  protected calculateTargets(context: AbilityContext): Coordinate[] {
    if (!context.targetData?.coordinates || context.targetData.coordinates.length === 0) {
      return []
    }

    // Get 5x5 area around target coordinate
    const center = context.targetData.coordinates[0]
    return this.getAreaCoordinates(center, 2, 10) // radius 2 = 5x5 area
  }

  protected executeEffect(context: AbilityContext): AbilityExecutionResult {
    // Validate target data
    if (!context.targetData?.coordinates || context.targetData.coordinates.length === 0) {
      return {
        success: false,
        effects: [],
        messages: [],
        errors: ['Sonar Ping requires target coordinates']
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

    const detectionEffect: DetectionEffect = {
      type: 'detection',
      magnitude: 150,
      detectionRange: 2,
      detectHidden: true,
      detectSubmarine: true,
      duration: 2,
      stackable: false
    }

    // Create active effect
    const activeEffect = this.createActiveEffect(
      detectionEffect,
      2,
      { type: 'area', value: targetArea }
    )

    // Add to active effects
    this.instance.activeEffects.push(activeEffect)

    // Detect all ships in area, including hidden ones
    const detectedShips: string[] = []
    const submarinesDetected: string[] = []
    const revealedCoordinates: Coordinate[] = []

    if (context.opponent) {
      targetArea.forEach(coord => {
        const cell = context.opponent!.board.cells[coord.y]?.[coord.x]
        if (cell && cell.hasShip && cell.shipId) {
          // Reveal the cell
          if (!cell.isRevealed) {
            cell.isRevealed = true
            revealedCoordinates.push(coord)
          }

          // Track detected ships
          if (!detectedShips.includes(cell.shipId)) {
            detectedShips.push(cell.shipId)

            // Check if it's a submarine
            const ship = context.opponent!.fleet.find(s => s.id === cell.shipId)
            if (ship && ship.class === ShipClass.SUBMARINE) {
              submarinesDetected.push(cell.shipId)

              // Break submarine stealth if it has Silent Running
              this.breakSubmarineStealth(ship, context)
            }
          }
        }
      })
    }

    const appliedEffect = this.createAppliedEffect(
      'detection',
      targetArea,
      detectedShips.length,
      `Detected ${detectedShips.length} ship(s) in 5x5 area`
    )

    const messages = [`${context.ship.name} activates Sonar Ping!`]

    if (detectedShips.length > 0) {
      messages.push(`${detectedShips.length} enemy ship(s) detected!`)
      if (submarinesDetected.length > 0) {
        messages.push(`WARNING: ${submarinesDetected.length} submarine(s) detected!`)
      }
    } else {
      messages.push('No enemy ships detected in the area')
    }

    return {
      success: true,
      effects: [appliedEffect],
      messages,
      shipsRevealed: detectedShips,
      coordinatesRevealed: revealedCoordinates,
      statusEffectsApplied: [activeEffect]
    }
  }

  /**
   * Break submarine stealth when detected
   */
  private breakSubmarineStealth(submarine: GameShip, context: AbilityContext): void {
    // Remove stealth effects from submarine
    const subAbilities = submarine.abilities
    if (subAbilities) {
      subAbilities.forEach((ability) => {
        if (ability.id === 'silent_running') {
          // Force reveal submarine
          ability.isActive = false
        }
      })
    }
  }

  /**
   * Check if sonar is currently active
   */
  isSonarActive(): boolean {
    return this.instance.activeEffects.some(
      effect => effect.effect.type === 'detection' && effect.remainingDuration > 0
    )
  }

  /**
   * Get current detection power
   */
  getDetectionPower(): number {
    const detectionEffect = this.instance.activeEffects.find(
      effect => effect.effect.type === 'detection' && effect.remainingDuration > 0
    )

    if (detectionEffect) {
      return detectionEffect.effect.magnitude
    }

    return 0
  }

  /**
   * Check if a coordinate is in active sonar range
   */
  isInSonarRange(coord: Coordinate): boolean {
    return this.instance.activeEffects.some(effect => {
      if (effect.effect.type === 'detection' &&
          effect.remainingDuration > 0 &&
          effect.target?.type === 'area') {
        const area = effect.target.value as Coordinate[]
        return area.some(c => c.x === coord.x && c.y === coord.y)
      }
      return false
    })
  }

  /**
   * Get all currently monitored areas
   */
  getMonitoredAreas(): Coordinate[][] {
    const areas: Coordinate[][] = []

    this.instance.activeEffects.forEach(effect => {
      if (effect.effect.type === 'detection' &&
          effect.remainingDuration > 0 &&
          effect.target?.type === 'area') {
        areas.push(effect.target.value as Coordinate[])
      }
    })

    return areas
  }
}
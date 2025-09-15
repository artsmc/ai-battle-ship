/**
 * DamageCalculator
 * Calculates damage based on ship abilities, armor, and special conditions
 */

import { Coordinate, ShipAbility, GameShip } from '../types'
import { ShipClass } from '../../database/types/enums'

export interface DamageCalculation {
  baseDamage: number
  armorReduction: number
  abilityModifier: number
  criticalHit: boolean
  totalDamage: number
  description: string
}

export interface ShipVulnerability {
  isVulnerable: boolean
  vulnerableSpots: Coordinate[]
  criticalChance: number
}

export class DamageCalculator {
  private enableSpecialAbilities: boolean
  private criticalHitChance: number = 0.05 // 5% base crit chance
  private criticalDamageMultiplier: number = 2.0

  constructor(enableSpecialAbilities: boolean = true) {
    this.enableSpecialAbilities = enableSpecialAbilities
  }

  /**
   * Calculate damage for a hit on a ship
   */
  calculateDamage(
    ship: GameShip,
    hitCoordinate: Coordinate,
    baseDamage: number = 1,
    attackerAbilities?: ShipAbility[]
  ): DamageCalculation {
    let damage = baseDamage
    let armorReduction = 0
    let abilityModifier = 0
    let criticalHit = false
    const descriptions: string[] = []

    // Calculate armor reduction
    armorReduction = this.calculateArmorReduction(ship)
    damage = Math.max(1, damage - armorReduction)

    if (armorReduction > 0) {
      descriptions.push(`Armor reduced damage by ${armorReduction}`)
    }

    // Check for critical hit
    if (this.checkCriticalHit(ship, hitCoordinate)) {
      criticalHit = true
      damage = Math.ceil(damage * this.criticalDamageMultiplier)
      descriptions.push('Critical hit!')
    }

    // Apply ability modifiers if enabled
    if (this.enableSpecialAbilities) {
      // Defender abilities (damage reduction)
      const defenderModifier = this.calculateDefenderAbilities(ship)
      if (defenderModifier !== 0) {
        damage = Math.max(1, damage + defenderModifier)
        abilityModifier += defenderModifier
        descriptions.push(`Defensive abilities modified damage by ${defenderModifier}`)
      }

      // Attacker abilities (damage increase)
      if (attackerAbilities) {
        const attackerModifier = this.calculateAttackerAbilities(attackerAbilities)
        if (attackerModifier !== 0) {
          damage = Math.ceil(damage * (1 + attackerModifier))
          abilityModifier += attackerModifier * baseDamage
          descriptions.push(`Attack abilities increased damage by ${Math.round(attackerModifier * 100)}%`)
        }
      }
    }

    // Apply ship class specific modifiers
    const classModifier = this.getShipClassModifier(ship.class)
    if (classModifier !== 1) {
      damage = Math.ceil(damage * classModifier)
      descriptions.push(`${ship.class} class modifier: ${Math.round(classModifier * 100)}%`)
    }

    // Minimum damage is always 1
    damage = Math.max(1, damage)

    return {
      baseDamage,
      armorReduction,
      abilityModifier,
      criticalHit,
      totalDamage: damage,
      description: descriptions.join(', ')
    }
  }

  /**
   * Calculate armor reduction
   */
  private calculateArmorReduction(ship: GameShip): number {
    // Base armor value from ship (if available)
    let armorValue = 0

    // Reduce armor effectiveness if ship is critically damaged
    const healthPercentage = (ship.hitPoints / ship.maxHitPoints) * 100
    if (healthPercentage <= 25) {
      armorValue = Math.floor(armorValue * 0.5)
    }

    return armorValue
  }

  /**
   * Check if hit is critical
   */
  private checkCriticalHit(ship: GameShip, coordinate: Coordinate): boolean {
    // Base critical chance
    let critChance = this.criticalHitChance

    // Check if hit is on a vulnerable spot
    const vulnerability = this.checkShipVulnerability(ship)
    if (vulnerability.isVulnerable) {
      const isVulnerableSpot = vulnerability.vulnerableSpots.some(
        spot => spot.x === coordinate.x && spot.y === coordinate.y
      )
      if (isVulnerableSpot) {
        critChance += vulnerability.criticalChance
      }
    }

    // Ship is more vulnerable when critically damaged
    const healthPercentage = (ship.hitPoints / ship.maxHitPoints) * 100
    if (healthPercentage <= 25) {
      critChance += 0.1 // +10% crit chance
    }

    return Math.random() < critChance
  }

  /**
   * Check ship vulnerability
   */
  checkShipVulnerability(ship: GameShip): ShipVulnerability {
    const vulnerableSpots: Coordinate[] = []
    let criticalChance = 0

    if (!ship.position) {
      return {
        isVulnerable: false,
        vulnerableSpots: [],
        criticalChance: 0
      }
    }

    // Calculate vulnerable spots based on ship class
    switch (ship.class) {
      case ShipClass.CARRIER:
        // Carriers are vulnerable in the middle (flight deck)
        if (ship.position.coordinates.length >= 3) {
          const midIndex = Math.floor(ship.position.coordinates.length / 2)
          vulnerableSpots.push(ship.position.coordinates[midIndex])
          criticalChance = 0.15
        }
        break

      case ShipClass.BATTLESHIP:
        // Battleships are vulnerable at ammunition storage (front third)
        if (ship.position.coordinates.length >= 2) {
          vulnerableSpots.push(ship.position.coordinates[0])
          criticalChance = 0.12
        }
        break

      case ShipClass.SUBMARINE:
        // Submarines are vulnerable at periscope depth (any hit has higher crit)
        criticalChance = 0.20
        vulnerableSpots.push(...ship.position.coordinates)
        break

      default:
        // Other ships have standard vulnerability at engine (rear)
        if (ship.position.coordinates.length >= 1) {
          vulnerableSpots.push(
            ship.position.coordinates[ship.position.coordinates.length - 1]
          )
          criticalChance = 0.10
        }
    }

    return {
      isVulnerable: vulnerableSpots.length > 0,
      vulnerableSpots,
      criticalChance
    }
  }

  /**
   * Calculate defender ability modifiers
   */
  private calculateDefenderAbilities(ship: GameShip): number {
    let modifier = 0

    for (const ability of ship.abilities) {
      if (!ability.isActive) continue

      // Check for damage reduction abilities
      if (ability.name.toLowerCase().includes('armor') ||
          ability.name.toLowerCase().includes('shield')) {
        modifier -= 1 // Reduce damage by 1
      }

      // Evasion abilities might negate damage entirely (handled elsewhere)
      if (ability.name.toLowerCase().includes('evasion')) {
        // Random evasion chance
        if (Math.random() < 0.2) {
          modifier -= 999 // Effectively negates damage
        }
      }
    }

    return modifier
  }

  /**
   * Calculate attacker ability modifiers
   */
  private calculateAttackerAbilities(abilities: ShipAbility[]): number {
    let modifier = 0

    for (const ability of abilities) {
      if (!ability.isActive || ability.currentCooldown > 0) continue

      // Check for damage increase abilities
      if (ability.name.toLowerCase().includes('piercing') ||
          ability.name.toLowerCase().includes('power')) {
        modifier += 0.5 // 50% damage increase
      }

      if (ability.name.toLowerCase().includes('critical')) {
        this.criticalHitChance += 0.1 // Temporary crit chance increase
      }
    }

    return modifier
  }

  /**
   * Get ship class specific damage modifier
   */
  private getShipClassModifier(shipClass: ShipClass): number {
    switch (shipClass) {
      case ShipClass.BATTLESHIP:
        return 1.2 // Battleships deal 20% more damage
      case ShipClass.HEAVY_CRUISER:
        return 1.1 // Heavy cruisers deal 10% more damage
      case ShipClass.DESTROYER:
        return 0.9 // Destroyers deal 10% less damage but faster
      case ShipClass.SUBMARINE:
        return 1.3 // Submarines deal 30% more damage (torpedo)
      default:
        return 1.0
    }
  }

  /**
   * Calculate chain reaction damage
   */
  calculateChainDamage(
    primaryDamage: number,
    distance: number,
    maxDistance: number = 3
  ): number {
    if (distance > maxDistance) return 0

    // Damage falls off with distance
    const falloff = 1 - (distance / (maxDistance + 1))
    return Math.max(1, Math.ceil(primaryDamage * falloff))
  }

  /**
   * Calculate damage over time effects
   */
  calculateBurnDamage(turnsActive: number, initialDamage: number = 1): number {
    // Burn damage decreases over time
    const burnMultiplier = Math.max(0.25, 1 - (turnsActive * 0.25))
    return Math.ceil(initialDamage * burnMultiplier)
  }

  /**
   * Reset calculator state
   */
  reset(): void {
    this.criticalHitChance = 0.05
    this.criticalDamageMultiplier = 2.0
  }
}
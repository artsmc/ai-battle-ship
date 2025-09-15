/**
 * CombatEngineAdapter
 * Adapter to work with GamePlayer interface instead of Player class
 */

import { GamePlayer, GameShip, Coordinate, AttackResult } from '../types'
import { MoveResult } from '../../database/types/enums'

export class CombatEngineAdapter {
  /**
   * Process an attack on a player using the GamePlayer interface
   */
  static processAttackOnPlayer(
    defender: GamePlayer,
    coordinate: Coordinate
  ): AttackResult {
    // Check if coordinate is valid
    if (!this.isValidCoordinate(coordinate, defender.board)) {
      return {
        coordinate,
        result: MoveResult.MISS,
        damageDealt: 0
      }
    }

    // Get cell
    const cell = defender.board.cells[coordinate.y][coordinate.x]

    // Check if already hit
    if (cell.isHit) {
      return {
        coordinate,
        result: MoveResult.MISS,
        damageDealt: 0
      }
    }

    // Mark as hit
    cell.isHit = true
    cell.hitAt = new Date()

    // Check if it's a ship hit
    if (cell.hasShip && cell.shipId) {
      const ship = defender.fleet.find(s => s.id === cell.shipId)

      if (ship) {
        // Apply damage to ship
        const damageResult = this.applyDamageToShip(ship, coordinate)

        // Update statistics
        defender.stats.damageTaken++

        if (damageResult.isSunk) {
          defender.stats.shipsRemaining--
          defender.stats.shipsSunk++

          return {
            coordinate,
            result: MoveResult.SUNK,
            shipHit: ship.id,
            shipSunk: true,
            shipType: ship.name,
            damageDealt: 1
          }
        } else {
          return {
            coordinate,
            result: MoveResult.HIT,
            shipHit: ship.id,
            shipSunk: false,
            damageDealt: 1
          }
        }
      }
    }

    // It's a miss
    defender.board.misses.push(coordinate)

    return {
      coordinate,
      result: MoveResult.MISS,
      damageDealt: 0
    }
  }

  /**
   * Apply damage to a ship
   */
  static applyDamageToShip(
    ship: GameShip,
    coordinate: Coordinate
  ): { isSunk: boolean; damage: number } {
    // Add hit position
    ship.damage.hitPositions.push(coordinate)
    ship.damage.totalHits++

    // Reduce hit points
    ship.hitPoints = Math.max(0, ship.hitPoints - 1)

    // Check if sunk
    if (ship.hitPoints === 0 && !ship.damage.isSunk) {
      ship.damage.isSunk = true
      ship.damage.sunkAt = new Date()

      // Disable all abilities
      ship.abilities.forEach(ability => {
        ability.isActive = false
      })

      return { isSunk: true, damage: 1 }
    }

    return { isSunk: false, damage: 1 }
  }

  /**
   * Update player statistics after an attack
   */
  static updateAttackerStats(
    attacker: GamePlayer,
    coordinate: Coordinate,
    isHit: boolean
  ): void {
    attacker.stats.shotsTotal++

    if (isHit) {
      attacker.stats.shotsHit++
      attacker.board.hits.push(coordinate)
    } else {
      attacker.stats.shotsMissed++
      attacker.board.misses.push(coordinate)
    }

    // Update accuracy
    attacker.stats.accuracy = attacker.stats.shotsTotal > 0
      ? (attacker.stats.shotsHit / attacker.stats.shotsTotal) * 100
      : 0
  }

  /**
   * Check if all ships are sunk for a player
   */
  static areAllShipsSunk(player: GamePlayer): boolean {
    if (!player.fleet || player.fleet.length === 0) {
      return true
    }

    return player.fleet.every(ship => ship.damage.isSunk)
  }

  /**
   * Validate coordinate
   */
  private static isValidCoordinate(
    coordinate: Coordinate,
    board: { width: number; height: number }
  ): boolean {
    return coordinate.x >= 0 &&
           coordinate.x < board.width &&
           coordinate.y >= 0 &&
           coordinate.y < board.height
  }
}
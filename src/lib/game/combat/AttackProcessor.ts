/**
 * AttackProcessor
 * Handles attack processing logic and result generation
 */

import { Coordinate, AttackResult, GamePlayer } from '../types'
import { MoveResult } from '../../database/types/enums'

export interface AttackInfo {
  coordinate: Coordinate
  isHit: boolean
  shipId?: string
  alreadyHit: boolean
  isValid: boolean
}

export interface ProcessedAttack {
  result: AttackResult
  cellsAffected: Coordinate[]
  wasSuccessful: boolean
}

export class AttackProcessor {
  /**
   * Process an attack at the specified coordinate
   */
  processAttack(
    coordinate: Coordinate,
    hitInfo: AttackInfo,
    defender: GamePlayer,
    attackType: 'normal' | 'special'
  ): AttackResult {
    // Check if attack is valid
    if (!hitInfo.isValid) {
      return this.createMissResult(coordinate, 'Invalid coordinate')
    }

    // Check if already hit
    if (hitInfo.alreadyHit) {
      return this.createMissResult(coordinate, 'Already attacked')
    }

    // Process based on hit/miss
    if (hitInfo.isHit && hitInfo.shipId) {
      return this.processHit(coordinate, hitInfo.shipId, defender, attackType)
    } else {
      return this.processMiss(coordinate, defender)
    }
  }

  /**
   * Process a hit on a ship
   */
  private processHit(
    coordinate: Coordinate,
    shipId: string,
    defender: GamePlayer,
    attackType: 'normal' | 'special'
  ): AttackResult {
    const ship = defender.fleet.find(s => s.id === shipId)

    if (!ship) {
      return this.createMissResult(coordinate, 'Ship not found')
    }

    // Calculate base damage
    const damageDealt = attackType === 'special' ? 2 : 1

    // Apply damage to the ship
    const damageResult = this.applyDamageToShip(ship, coordinate, damageDealt)

    // Update board state
    const cell = defender.board.cells[coordinate.y]?.[coordinate.x]
    if (cell) {
      cell.isHit = true
      cell.hitAt = new Date()
    }

    // Create result based on ship status
    if (damageResult.isSunk) {
      return {
        coordinate,
        result: MoveResult.SUNK,
        shipHit: ship.id,
        shipSunk: true,
        shipType: ship.name,
        damageDealt: damageResult.damage
      }
    } else {
      return {
        coordinate,
        result: MoveResult.HIT,
        shipHit: ship.id,
        shipSunk: false,
        damageDealt: damageResult.damage
      }
    }
  }

  /**
   * Process a miss
   */
  private processMiss(coordinate: Coordinate, defender: GamePlayer): AttackResult {
    // Update board state
    const cell = defender.board.cells[coordinate.y]?.[coordinate.x]
    if (cell) {
      cell.isHit = true
      cell.hitAt = new Date()
    }

    // Add to misses
    defender.board.misses.push(coordinate)

    return {
      coordinate,
      result: MoveResult.MISS,
      damageDealt: 0
    }
  }

  /**
   * Create a miss result with optional message
   */
  private createMissResult(coordinate: Coordinate, _reason?: string): AttackResult {
    return {
      coordinate,
      result: MoveResult.MISS,
      damageDealt: 0
    }
  }

  /**
   * Process a chain of attacks (for special abilities)
   */
  processChainAttack(
    coordinates: Coordinate[],
    defender: GamePlayer,
    damageMultiplier: number = 1
  ): AttackResult[] {
    const results: AttackResult[] = []

    for (const coord of coordinates) {
      const cell = defender.board.cells[coord.y]?.[coord.x]

      if (!cell || cell.isHit) {
        results.push(this.createMissResult(coord))
        continue
      }

      if (cell.hasShip && cell.shipId) {
        const ship = defender.fleet.find(s => s.id === cell.shipId)
        if (ship) {
          const damage = Math.ceil(1 * damageMultiplier)
          const damageResult = this.applyDamageToShip(ship, coord, damage)

          cell.isHit = true
          cell.hitAt = new Date()

          results.push({
            coordinate: coord,
            result: damageResult.isSunk ? MoveResult.SUNK : MoveResult.HIT,
            shipHit: ship.id,
            shipSunk: damageResult.isSunk,
            shipType: damageResult.isSunk ? ship.name : undefined,
            damageDealt: damage
          })
        }
      } else {
        cell.isHit = true
        cell.hitAt = new Date()
        results.push(this.createMissResult(coord))
      }
    }

    return results
  }

  /**
   * Process area of effect attack
   */
  processAreaAttack(
    center: Coordinate,
    radius: number,
    defender: GamePlayer,
    damageMultiplier: number = 0.5
  ): ProcessedAttack {
    const affectedCoords: Coordinate[] = []
    // const results: AttackResult[] = []

    // Calculate affected coordinates
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const coord = { x: center.x + dx, y: center.y + dy }

        // Check if coordinate is within board bounds
        if (coord.x >= 0 && coord.x < defender.board.width &&
            coord.y >= 0 && coord.y < defender.board.height) {
          affectedCoords.push(coord)
        }
      }
    }

    // Process each coordinate
    const chainResults = this.processChainAttack(affectedCoords, defender, damageMultiplier)

    // Combine results
    const mainResult: AttackResult = {
      coordinate: center,
      result: chainResults.some(r => r.result === MoveResult.HIT) ? MoveResult.HIT : MoveResult.MISS,
      damageDealt: chainResults.reduce((sum, r) => sum + r.damageDealt, 0),
      chainReaction: chainResults
    }

    return {
      result: mainResult,
      cellsAffected: affectedCoords,
      wasSuccessful: mainResult.result !== MoveResult.MISS
    }
  }

  /**
   * Validate attack coordinate
   */
  validateAttackCoordinate(
    coordinate: Coordinate,
    boardWidth: number,
    boardHeight: number
  ): boolean {
    return coordinate.x >= 0 &&
           coordinate.x < boardWidth &&
           coordinate.y >= 0 &&
           coordinate.y < boardHeight
  }

  /**
   * Calculate attack pattern for special weapons
   */
  calculateAttackPattern(
    center: Coordinate,
    pattern: 'single' | 'cross' | 'square' | 'line',
    direction?: 'horizontal' | 'vertical'
  ): Coordinate[] {
    const coords: Coordinate[] = []

    switch (pattern) {
      case 'single':
        coords.push(center)
        break

      case 'cross':
        coords.push(center)
        coords.push({ x: center.x - 1, y: center.y })
        coords.push({ x: center.x + 1, y: center.y })
        coords.push({ x: center.x, y: center.y - 1 })
        coords.push({ x: center.x, y: center.y + 1 })
        break

      case 'square':
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            coords.push({ x: center.x + dx, y: center.y + dy })
          }
        }
        break

      case 'line':
        if (direction === 'horizontal') {
          for (let dx = -2; dx <= 2; dx++) {
            coords.push({ x: center.x + dx, y: center.y })
          }
        } else {
          for (let dy = -2; dy <= 2; dy++) {
            coords.push({ x: center.x, y: center.y + dy })
          }
        }
        break
    }

    return coords
  }

  /**
   * Apply damage to a ship (helper method for GameShip interface)
   */
  private applyDamageToShip(
    ship: any,
    coordinate: Coordinate,
    damageAmount: number
  ): { isSunk: boolean; damage: number } {
    // Add hit position
    ship.damage.hitPositions.push(coordinate)
    ship.damage.totalHits++

    // Reduce hit points
    ship.hitPoints = Math.max(0, ship.hitPoints - damageAmount)

    // Check if sunk
    if (ship.hitPoints === 0 && !ship.damage.isSunk) {
      ship.damage.isSunk = true
      ship.damage.sunkAt = new Date()

      // Disable all abilities
      ship.abilities.forEach((ability: any) => {
        ability.isActive = false
      })

      return { isSunk: true, damage: damageAmount }
    }

    return { isSunk: false, damage: damageAmount }
  }
}
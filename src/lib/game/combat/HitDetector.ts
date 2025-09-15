/**
 * HitDetector
 * Handles hit/miss detection logic for combat
 */

import { BoardState, BoardCell, Coordinate } from '../types'
import { AttackInfo } from './AttackProcessor'

export interface HitDetectionResult {
  isHit: boolean
  shipId?: string
  shipSegment?: number
  cellState: 'empty' | 'ship' | 'hit' | 'miss'
}

export interface ProximityInfo {
  hasAdjacentShip: boolean
  nearbyShipCount: number
  directions: {
    north: boolean
    south: boolean
    east: boolean
    west: boolean
  }
}

export class HitDetector {
  /**
   * Detect if an attack hits a ship at the given coordinate
   */
  detectHit(board: BoardState, coordinate: Coordinate): AttackInfo {
    // Validate coordinate
    if (!this.isValidCoordinate(coordinate, board.width, board.height)) {
      return {
        coordinate,
        isHit: false,
        alreadyHit: false,
        isValid: false
      }
    }

    // Get cell
    const cell = board.cells[coordinate.y][coordinate.x]

    // Check if already hit
    if (cell.isHit) {
      return {
        coordinate,
        isHit: false,
        shipId: cell.shipId,
        alreadyHit: true,
        isValid: true
      }
    }

    // Check for ship
    if (cell.hasShip && cell.shipId) {
      return {
        coordinate,
        isHit: true,
        shipId: cell.shipId,
        alreadyHit: false,
        isValid: true
      }
    }

    // Miss
    return {
      coordinate,
      isHit: false,
      alreadyHit: false,
      isValid: true
    }
  }

  /**
   * Batch detection for multiple coordinates
   */
  detectMultipleHits(board: BoardState, coordinates: Coordinate[]): AttackInfo[] {
    return coordinates.map(coord => this.detectHit(board, coord))
  }

  /**
   * Get detailed hit detection result
   */
  getDetailedHitInfo(board: BoardState, coordinate: Coordinate): HitDetectionResult {
    if (!this.isValidCoordinate(coordinate, board.width, board.height)) {
      return {
        isHit: false,
        cellState: 'empty'
      }
    }

    const cell = board.cells[coordinate.y][coordinate.x]

    let cellState: 'empty' | 'ship' | 'hit' | 'miss'
    if (cell.isHit) {
      cellState = cell.hasShip ? 'hit' : 'miss'
    } else {
      cellState = cell.hasShip ? 'ship' : 'empty'
    }

    return {
      isHit: cell.hasShip && !cell.isHit,
      shipId: cell.shipId,
      cellState
    }
  }

  /**
   * Check proximity to ships (for AI or sonar)
   */
  checkProximity(board: BoardState, coordinate: Coordinate, radius: number = 1): ProximityInfo {
    const directions = {
      north: false,
      south: false,
      east: false,
      west: false
    }

    let nearbyShipCount = 0
    const checkedShips = new Set<string>()

    // Check in radius
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue

        const checkCoord = {
          x: coordinate.x + dx,
          y: coordinate.y + dy
        }

        if (this.isValidCoordinate(checkCoord, board.width, board.height)) {
          const cell = board.cells[checkCoord.y][checkCoord.x]

          if (cell.hasShip && cell.shipId && !cell.isHit) {
            if (!checkedShips.has(cell.shipId)) {
              checkedShips.add(cell.shipId)
              nearbyShipCount++
            }

            // Update directions for immediate neighbors
            if (radius === 1) {
              if (dy === -1 && dx === 0) directions.north = true
              if (dy === 1 && dx === 0) directions.south = true
              if (dx === 1 && dy === 0) directions.east = true
              if (dx === -1 && dy === 0) directions.west = true
            }
          }
        }
      }
    }

    return {
      hasAdjacentShip: nearbyShipCount > 0,
      nearbyShipCount,
      directions
    }
  }

  /**
   * Find potential targets around a hit (for AI strategy)
   */
  findPotentialTargets(board: BoardState, lastHit: Coordinate): Coordinate[] {
    const targets: Coordinate[] = []
    const offsets = [
      { x: 0, y: -1 }, // North
      { x: 0, y: 1 },  // South
      { x: 1, y: 0 },  // East
      { x: -1, y: 0 }  // West
    ]

    for (const offset of offsets) {
      const coord = {
        x: lastHit.x + offset.x,
        y: lastHit.y + offset.y
      }

      if (this.isValidCoordinate(coord, board.width, board.height)) {
        const cell = board.cells[coord.y][coord.x]
        if (!cell.isHit) {
          targets.push(coord)
        }
      }
    }

    return targets
  }

  /**
   * Analyze hit pattern to determine ship orientation
   */
  analyzeHitPattern(board: BoardState, shipId: string): {
    orientation: 'horizontal' | 'vertical' | 'unknown'
    hitCoordinates: Coordinate[]
  } {
    const hitCoords: Coordinate[] = []

    // Find all hit coordinates for this ship
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const cell = board.cells[y][x]
        if (cell.shipId === shipId && cell.isHit) {
          hitCoords.push({ x, y })
        }
      }
    }

    if (hitCoords.length < 2) {
      return { orientation: 'unknown', hitCoordinates: hitCoords }
    }

    // Sort coordinates
    hitCoords.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

    // Check if all have same Y (horizontal) or same X (vertical)
    const sameY = hitCoords.every(c => c.y === hitCoords[0].y)
    const sameX = hitCoords.every(c => c.x === hitCoords[0].x)

    if (sameY) {
      return { orientation: 'horizontal', hitCoordinates: hitCoords }
    } else if (sameX) {
      return { orientation: 'vertical', hitCoordinates: hitCoords }
    } else {
      return { orientation: 'unknown', hitCoordinates: hitCoords }
    }
  }

  /**
   * Get hit statistics for a board area
   */
  getAreaStatistics(
    board: BoardState,
    topLeft: Coordinate,
    bottomRight: Coordinate
  ): {
    totalCells: number
    hitCells: number
    shipCells: number
    emptyHits: number
    accuracy: number
  } {
    let totalCells = 0
    let hitCells = 0
    let shipCells = 0
    let emptyHits = 0

    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      for (let x = topLeft.x; x <= bottomRight.x; x++) {
        if (this.isValidCoordinate({ x, y }, board.width, board.height)) {
          totalCells++
          const cell = board.cells[y][x]

          if (cell.isHit) {
            hitCells++
            if (!cell.hasShip) {
              emptyHits++
            }
          }

          if (cell.hasShip) {
            shipCells++
          }
        }
      }
    }

    const accuracy = hitCells > 0
      ? ((hitCells - emptyHits) / hitCells) * 100
      : 0

    return {
      totalCells,
      hitCells,
      shipCells,
      emptyHits,
      accuracy
    }
  }

  /**
   * Validate coordinate is within board bounds
   */
  private isValidCoordinate(
    coordinate: Coordinate,
    width: number,
    height: number
  ): boolean {
    return coordinate.x >= 0 &&
           coordinate.x < width &&
           coordinate.y >= 0 &&
           coordinate.y < height
  }
}
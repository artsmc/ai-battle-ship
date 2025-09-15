/**
 * Placement Utilities
 * Helper functions for placement calculations and validations
 */

import { Coordinate, Orientation, GameShip } from '../../types'
import { Board } from '../../Board'
import { PlacementValidator } from '../PlacementValidator'
import { PlacementConstraint, PlacementPattern, AutoPlacementConfig } from './types'

export class PlacementUtils {
  private readonly board: Board
  private readonly validator: PlacementValidator
  private readonly config: AutoPlacementConfig

  constructor(
    board: Board,
    validator: PlacementValidator,
    config: AutoPlacementConfig
  ) {
    this.board = board
    this.validator = validator
    this.config = config
  }

  calculateShipCoordinates(
    start: Coordinate,
    size: number,
    orientation: Orientation
  ): Coordinate[] {
    const coordinates: Coordinate[] = []

    for (let i = 0; i < size; i++) {
      if (orientation === 'horizontal') {
        coordinates.push({ x: start.x + i, y: start.y })
      } else {
        coordinates.push({ x: start.x, y: start.y + i })
      }
    }

    return coordinates
  }

  isValidPlacement(
    ship: GameShip,
    position: Coordinate,
    orientation: Orientation
  ): boolean {
    const validation = this.validator.validateSinglePlacement(
      ship.id,
      ship.size,
      position,
      orientation
    )

    return (
      validation.isValid ||
      (this.config.allowAdjacency &&
        validation.errors.every(
          e => e.code !== 'SHIP_OVERLAP' && e.code !== 'OUT_OF_BOUNDS'
        ))
    )
  }

  generateRandomPosition(
    bounds: any,
    shipSize: number,
    constraint?: PlacementConstraint
  ): Coordinate {
    if (constraint?.requiredPosition) {
      return constraint.requiredPosition
    }

    const maxX = bounds.maxX - (shipSize - 1)
    const maxY = bounds.maxY - (shipSize - 1)

    return {
      x: Math.floor(Math.random() * (maxX - bounds.minX + 1)) + bounds.minX,
      y: Math.floor(Math.random() * (maxY - bounds.minY + 1)) + bounds.minY
    }
  }

  generateRandomOrientation(constraint?: PlacementConstraint): Orientation {
    if (constraint?.requiredOrientation) {
      return constraint.requiredOrientation
    }

    return Math.random() < 0.5 ? 'horizontal' : 'vertical'
  }

  satisfiesConstraint(
    placement: { startPosition: Coordinate; orientation: Orientation },
    constraint?: PlacementConstraint
  ): boolean {
    if (!constraint) return true

    if (
      constraint.requiredPosition &&
      (placement.startPosition.x !== constraint.requiredPosition.x ||
        placement.startPosition.y !== constraint.requiredPosition.y)
    ) {
      return false
    }

    if (
      constraint.requiredOrientation &&
      placement.orientation !== constraint.requiredOrientation
    ) {
      return false
    }

    return true
  }

  getPositionsNear(
    coordinates: Coordinate[],
    minDistance: number,
    maxDistance: number
  ): Coordinate[] {
    const positions: Coordinate[] = []
    const bounds = this.board.getBounds()

    for (const coord of coordinates) {
      for (let dx = -maxDistance; dx <= maxDistance; dx++) {
        for (let dy = -maxDistance; dy <= maxDistance; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance >= minDistance && distance <= maxDistance) {
            const newPos = { x: coord.x + dx, y: coord.y + dy }
            if (
              newPos.x >= bounds.minX &&
              newPos.x <= bounds.maxX &&
              newPos.y >= bounds.minY &&
              newPos.y <= bounds.maxY
            ) {
              positions.push(newPos)
            }
          }
        }
      }
    }

    return positions
  }

  getPlacementPatterns(shipSize: number): PlacementPattern[] {
    // Simple patterns - can be extended with more sophisticated patterns
    const bounds = this.board.getBounds()
    const patterns: PlacementPattern[] = []

    // Diagonal pattern
    for (let i = 0; i < Math.min(bounds.maxX - shipSize, bounds.maxY); i++) {
      patterns.push({
        position: { x: i, y: i },
        orientation: 'horizontal'
      })
    }

    // Edge patterns
    patterns.push(
      { position: { x: 0, y: 0 }, orientation: 'horizontal' },
      { position: { x: bounds.maxX - shipSize + 1, y: 0 }, orientation: 'horizontal' },
      { position: { x: 0, y: bounds.maxY }, orientation: 'horizontal' },
      {
        position: { x: bounds.maxX - shipSize + 1, y: bounds.maxY },
        orientation: 'horizontal'
      }
    )

    return patterns
  }

  getDistanceFromEdge(position: Coordinate): number {
    const bounds = this.board.getBounds()
    return Math.min(
      position.x - bounds.minX,
      bounds.maxX - position.x,
      position.y - bounds.minY,
      bounds.maxY - position.y
    )
  }

  getMinDistanceToShip(position: Coordinate, shipCoordinates: Coordinate[]): number {
    let minDistance = Infinity

    for (const shipCoord of shipCoordinates) {
      const distance = Math.sqrt(
        Math.pow(position.x - shipCoord.x, 2) + Math.pow(position.y - shipCoord.y, 2)
      )
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }
}
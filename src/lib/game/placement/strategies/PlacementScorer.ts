/**
 * Placement Scoring System
 * Calculates scores for different placement strategies
 */

import { Coordinate, Orientation, GameShip } from '../../types'
import { Board } from '../../Board'
import { PlacementSuggestion } from '../PlacementValidator'
import { PlacementScore, AutoPlacementConfig } from './types'

export class PlacementScorer {
  private readonly board: Board
  private readonly config: AutoPlacementConfig

  constructor(board: Board, config: AutoPlacementConfig) {
    this.board = board
    this.config = config
  }

  calculateStrategicScore(ship: GameShip, suggestion: PlacementSuggestion): number {
    let score = suggestion.score

    // Prefer edges for larger ships (harder to find)
    if (ship.size >= 4) {
      const edgeDistance = this.getDistanceFromEdge(suggestion.startPosition)
      score += (3 - edgeDistance) * 20
    }

    // Prefer corners for carriers
    if (ship.size === 5) {
      const cornerDistance = this.getDistanceFromCorner(suggestion.startPosition)
      score += (5 - cornerDistance) * 15
    }

    return score
  }

  calculateBalancedScore(ship: GameShip, suggestion: PlacementSuggestion): number {
    const scores = this.calculatePlacementScore(
      ship,
      suggestion.startPosition,
      suggestion.orientation
    )

    return (
      scores.total +
      scores.spacing * 0.3 +
      scores.coverage * 0.2 +
      Math.random() * 20 * this.config.randomnessFactor
    )
  }

  calculateClusteringScore(
    ship: GameShip,
    position: Coordinate,
    orientation: Orientation,
    existingPlacements: any[]
  ): number {
    let score = 0

    // Calculate proximity to existing ships
    const coordinates = this.calculateShipCoordinates(position, ship.size, orientation)

    for (const coord of coordinates) {
      for (const placement of existingPlacements) {
        const minDistance = this.getMinDistanceToShip(coord, placement.coordinates)
        if (minDistance <= 3) {
          score += (4 - minDistance) * 10
        }
      }
    }

    return score
  }

  calculateDispersionScore(
    suggestion: PlacementSuggestion,
    existingPlacements: any[]
  ): number {
    if (existingPlacements.length === 0) return 100

    let minDistance = Infinity

    for (const coord of suggestion.coordinates) {
      for (const placement of existingPlacements) {
        const distance = this.getMinDistanceToShip(coord, placement.coordinates)
        minDistance = Math.min(minDistance, distance)
      }
    }

    return minDistance * 20
  }

  calculatePlacementScore(
    ship: GameShip,
    position: Coordinate,
    orientation: Orientation
  ): PlacementScore {
    const coordinates = this.calculateShipCoordinates(position, ship.size, orientation)
    const bounds = this.board.getBounds()

    let coverage = 0
    let spacing = 0
    let edge = 0
    let center = 0
    const clustering = 0
    const strategic = 0

    for (const coord of coordinates) {
      // Coverage score (how much area is covered)
      coverage += 10

      // Spacing score (distance from other ships)
      const nearbyShips = this.countNearbyShips(coord, 2)
      spacing += Math.max(0, 10 - nearbyShips * 3)

      // Edge score
      const edgeDistance = Math.min(
        coord.x - bounds.minX,
        bounds.maxX - coord.x,
        coord.y - bounds.minY,
        bounds.maxY - coord.y
      )
      edge += this.config.preferEdges ? (3 - edgeDistance) * 5 : edgeDistance * 2

      // Center score
      const centerX = (bounds.maxX - bounds.minX) / 2
      const centerY = (bounds.maxY - bounds.minY) / 2
      const distanceFromCenter = Math.sqrt(
        Math.pow(coord.x - centerX, 2) + Math.pow(coord.y - centerY, 2)
      )
      center += Math.max(0, 10 - distanceFromCenter)
    }

    const total = coverage + spacing + edge + center + clustering + strategic

    return { total, coverage, spacing, edge, center, clustering, strategic }
  }

  calculatePatternScore(
    ship: GameShip,
    pattern: { position: Coordinate; orientation: Orientation }
  ): number {
    // Basic pattern score - can be extended with specific pattern logic
    return 50 + Math.random() * 20
  }

  // Utility methods
  private calculateShipCoordinates(
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

  private getDistanceFromEdge(position: Coordinate): number {
    const bounds = this.board.getBounds()
    return Math.min(
      position.x - bounds.minX,
      bounds.maxX - position.x,
      position.y - bounds.minY,
      bounds.maxY - position.y
    )
  }

  private getDistanceFromCorner(position: Coordinate): number {
    const bounds = this.board.getBounds()
    const corners = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.maxX, y: bounds.maxY }
    ]

    let minDistance = Infinity
    for (const corner of corners) {
      const distance = Math.sqrt(
        Math.pow(position.x - corner.x, 2) + Math.pow(position.y - corner.y, 2)
      )
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  private getMinDistanceToShip(
    position: Coordinate,
    shipCoordinates: Coordinate[]
  ): number {
    let minDistance = Infinity

    for (const shipCoord of shipCoordinates) {
      const distance = Math.sqrt(
        Math.pow(position.x - shipCoord.x, 2) + Math.pow(position.y - shipCoord.y, 2)
      )
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  private countNearbyShips(center: Coordinate, radius: number): number {
    let count = 0

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue

        const checkCoord = { x: center.x + dx, y: center.y + dy }
        const cell = this.board.getCell(checkCoord)

        if (cell?.hasShip) {
          count++
        }
      }
    }

    return count
  }
}
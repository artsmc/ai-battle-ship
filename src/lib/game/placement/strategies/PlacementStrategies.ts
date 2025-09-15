/**
 * Placement Strategy Implementations
 * Individual strategy methods for ship placement
 */

import { GameShip, Coordinate, Orientation } from '../../types'
import { Board } from '../../Board'
import { PlacementValidator } from '../PlacementValidator'
import { CollisionDetector } from '../CollisionDetector'
import { PlacementScorer } from './PlacementScorer'
import { PlacementUtils } from './PlacementUtils'
import { ShipPlacement, PlacementConstraint, AutoPlacementConfig } from './types'

export class PlacementStrategies {
  private readonly board: Board
  private readonly validator: PlacementValidator
  private readonly collisionDetector: CollisionDetector
  private readonly scorer: PlacementScorer
  private readonly utils: PlacementUtils
  private readonly config: AutoPlacementConfig
  private currentAttempt: number = 0

  constructor(
    board: Board,
    validator: PlacementValidator,
    collisionDetector: CollisionDetector,
    config: AutoPlacementConfig
  ) {
    this.board = board
    this.validator = validator
    this.collisionDetector = collisionDetector
    this.config = config
    this.scorer = new PlacementScorer(board, config)
    this.utils = new PlacementUtils(board, validator, config)
  }

  setCurrentAttempt(attempt: number): void {
    this.currentAttempt = attempt
  }

  incrementAttempt(): void {
    this.currentAttempt++
  }

  async placeShipRandomly(
    ship: GameShip,
    constraint?: PlacementConstraint
  ): Promise<ShipPlacement | null> {
    const bounds = this.board.getBounds()
    const attempts = Math.min(100, this.config.maxAttempts)

    for (let i = 0; i < attempts; i++) {
      this.currentAttempt++

      const position = this.utils.generateRandomPosition(bounds, ship.size, constraint)
      const orientation = this.utils.generateRandomOrientation(constraint)

      if (this.utils.isValidPlacement(ship, position, orientation)) {
        return {
          shipId: ship.id,
          shipSize: ship.size,
          position,
          orientation,
          score: this.scorer.calculatePlacementScore(ship, position, orientation).total
        }
      }
    }

    return null
  }

  async placeShipStrategically(
    ship: GameShip,
    constraint?: PlacementConstraint
  ): Promise<ShipPlacement | null> {
    const suggestions = this.validator.suggestValidPlacements(ship.size, 50)

    // Score suggestions based on strategic value
    const scoredSuggestions = suggestions
      .map(suggestion => ({
        ...suggestion,
        strategicScore: this.scorer.calculateStrategicScore(ship, suggestion)
      }))
      .sort((a, b) => b.strategicScore - a.strategicScore)

    for (const suggestion of scoredSuggestions) {
      this.currentAttempt++

      if (this.utils.satisfiesConstraint(suggestion, constraint)) {
        return {
          shipId: ship.id,
          shipSize: ship.size,
          position: suggestion.startPosition,
          orientation: suggestion.orientation,
          score: suggestion.strategicScore
        }
      }
    }

    return null
  }

  async placeShipBalanced(
    ship: GameShip,
    constraint?: PlacementConstraint
  ): Promise<ShipPlacement | null> {
    const suggestions = this.validator.suggestValidPlacements(ship.size, 30)

    // Score based on balanced criteria
    const scoredSuggestions = suggestions
      .map(suggestion => ({
        ...suggestion,
        balancedScore: this.scorer.calculateBalancedScore(ship, suggestion)
      }))
      .sort((a, b) => b.balancedScore - a.balancedScore)

    // Add some randomness to avoid predictable patterns
    const topSuggestions = scoredSuggestions.slice(
      0,
      Math.max(5, Math.floor(scoredSuggestions.length * 0.3))
    )
    const randomIndex = Math.floor(Math.random() * topSuggestions.length)
    const selectedSuggestion = topSuggestions[randomIndex]

    if (selectedSuggestion && this.utils.satisfiesConstraint(selectedSuggestion, constraint)) {
      this.currentAttempt++

      return {
        shipId: ship.id,
        shipSize: ship.size,
        position: selectedSuggestion.startPosition,
        orientation: selectedSuggestion.orientation,
        score: selectedSuggestion.balancedScore
      }
    }

    return null
  }

  async placeShipClustered(
    ship: GameShip,
    constraint?: PlacementConstraint
  ): Promise<ShipPlacement | null> {
    const existingPlacements = Array.from(this.board.getAllShipPositions())

    if (existingPlacements.length === 0) {
      // First ship - place centrally
      return this.placeShipBalanced(ship, constraint)
    }

    // Find positions near existing ships
    const clusterCandidates: Array<{
      position: Coordinate
      orientation: Orientation
      score: number
    }> = []

    for (const placement of existingPlacements) {
      const nearbyPositions = this.utils.getPositionsNear(placement.coordinates, 2, 4)

      for (const pos of nearbyPositions) {
        for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
          if (this.utils.isValidPlacement(ship, pos, orientation)) {
            const score = this.scorer.calculateClusteringScore(
              ship,
              pos,
              orientation,
              existingPlacements
            )
            clusterCandidates.push({ position: pos, orientation, score })
          }
        }
      }
    }

    if (clusterCandidates.length > 0) {
      // Sort by clustering score and add randomness
      clusterCandidates.sort((a, b) => b.score - a.score)
      const topCandidates = clusterCandidates.slice(
        0,
        Math.max(3, Math.floor(clusterCandidates.length * 0.3))
      )
      const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]

      this.currentAttempt++

      return {
        shipId: ship.id,
        shipSize: ship.size,
        position: selected.position,
        orientation: selected.orientation,
        score: selected.score
      }
    }

    // Fallback to balanced placement
    return this.placeShipBalanced(ship, constraint)
  }

  async placeShipDispersed(
    ship: GameShip,
    constraint?: PlacementConstraint
  ): Promise<ShipPlacement | null> {
    const suggestions = this.validator.suggestValidPlacements(ship.size, 50)
    const existingPlacements = Array.from(this.board.getAllShipPositions())

    // Score based on distance from existing ships
    const dispersedSuggestions = suggestions
      .map(suggestion => ({
        ...suggestion,
        dispersionScore: this.scorer.calculateDispersionScore(suggestion, existingPlacements)
      }))
      .sort((a, b) => b.dispersionScore - a.dispersionScore)

    for (const suggestion of dispersedSuggestions.slice(0, 10)) {
      this.currentAttempt++

      if (this.utils.satisfiesConstraint(suggestion, constraint)) {
        return {
          shipId: ship.id,
          shipSize: ship.size,
          position: suggestion.startPosition,
          orientation: suggestion.orientation,
          score: suggestion.dispersionScore
        }
      }
    }

    return null
  }

  async placeShipPattern(
    ship: GameShip,
    constraint?: PlacementConstraint
  ): Promise<ShipPlacement | null> {
    // Implement pattern-based placement (e.g., alternating orientations, geometric patterns)
    const patterns = this.utils.getPlacementPatterns(ship.size)

    for (const pattern of patterns) {
      if (
        this.utils.isValidPlacement(ship, pattern.position, pattern.orientation) &&
        this.utils.satisfiesConstraint(
          { startPosition: pattern.position, orientation: pattern.orientation },
          constraint
        )
      ) {
        this.currentAttempt++

        return {
          shipId: ship.id,
          shipSize: ship.size,
          position: pattern.position,
          orientation: pattern.orientation,
          score: this.scorer.calculatePatternScore(ship, pattern)
        }
      }
    }

    // Fallback to balanced placement
    return this.placeShipBalanced(ship, constraint)
  }

  async findAlternativePlacement(
    ship: GameShip,
    previousPlacement: ShipPlacement,
    constraints: PlacementConstraint[]
  ): Promise<ShipPlacement | null> {
    const suggestions = this.validator.suggestValidPlacements(ship.size, 20)

    // Filter out the previous placement
    const alternatives = suggestions.filter(
      s =>
        s.startPosition.x !== previousPlacement.position.x ||
        s.startPosition.y !== previousPlacement.position.y ||
        s.orientation !== previousPlacement.orientation
    )

    if (alternatives.length > 0) {
      const selected = alternatives[0]
      return {
        shipId: ship.id,
        shipSize: ship.size,
        position: selected.startPosition,
        orientation: selected.orientation,
        score: selected.score
      }
    }

    return null
  }
}
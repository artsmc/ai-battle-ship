/**
 * Auto Placer
 *
 * Coordinates automatic ship placement using various strategies.
 * This is the main entry point that orchestrates placement strategies,
 * scoring, and utilities through dedicated modules.
 */

import { GameShip } from '../types'
import { Board } from '../Board'
import { PlacementValidator } from './PlacementValidator'
import { CollisionDetector } from './CollisionDetector'
import { PlacementStrategies } from './strategies/PlacementStrategies'
import {
  AutoPlacementConfig,
  PlacementStrategy,
  PlacementResult,
  ShipPlacement,
  PlacementConstraint
} from './strategies/types'

// Re-export types for backward compatibility
export type {
  AutoPlacementConfig,
  PlacementStrategy,
  PlacementResult,
  ShipPlacement,
  PlacementScore,
  PlacementConstraint
} from './strategies/types'

export class AutoPlacer {
  private readonly board: Board
  private readonly validator: PlacementValidator
  private readonly collisionDetector: CollisionDetector
  private readonly config: AutoPlacementConfig
  private readonly strategies: PlacementStrategies

  // State management
  private placementHistory: Map<string, ShipPlacement[]>
  private currentAttempt: number
  private startTime: number

  constructor(
    board: Board,
    validator: PlacementValidator,
    collisionDetector: CollisionDetector,
    config: Partial<AutoPlacementConfig> = {}
  ) {
    this.board = board
    this.validator = validator
    this.collisionDetector = collisionDetector
    this.config = {
      strategy: 'balanced',
      maxAttempts: 1000,
      allowAdjacency: false,
      preferEdges: false,
      clusteringFactor: 0.5,
      randomnessFactor: 0.3,
      timeoutMs: 5000,
      ...config
    }

    this.strategies = new PlacementStrategies(
      board,
      validator,
      collisionDetector,
      this.config
    )

    this.placementHistory = new Map()
    this.currentAttempt = 0
    this.startTime = 0
  }

  /**
   * Places all ships on the board according to the configured strategy
   */
  async placeAllShips(
    ships: GameShip[],
    constraints: PlacementConstraint[] = []
  ): Promise<PlacementResult> {
    this.startTime = Date.now()
    this.currentAttempt = 0
    this.strategies.setCurrentAttempt(0)

    // Sort ships by size (largest first for better placement success)
    const sortedShips = [...ships].sort((a, b) => b.size - a.size)

    try {
      const placements = await this.executeStrategy(sortedShips, constraints)

      return {
        success: placements.length === ships.length,
        placements,
        attempts: this.currentAttempt,
        duration: Date.now() - this.startTime,
        strategy: this.config.strategy,
        failureReason:
          placements.length < ships.length ? 'Could not place all ships' : undefined
      }
    } catch (error) {
      return {
        success: false,
        placements: [],
        attempts: this.currentAttempt,
        duration: Date.now() - this.startTime,
        strategy: this.config.strategy,
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Places a single ship according to the configured strategy
   */
  async placeSingleShip(
    ship: GameShip,
    constraints: PlacementConstraint[] = []
  ): Promise<ShipPlacement | null> {
    const constraint = constraints.find(c => c.shipId === ship.id)

    switch (this.config.strategy) {
      case 'random':
        return this.strategies.placeShipRandomly(ship, constraint)
      case 'strategic':
        return this.strategies.placeShipStrategically(ship, constraint)
      case 'balanced':
        return this.strategies.placeShipBalanced(ship, constraint)
      case 'clustered':
        return this.strategies.placeShipClustered(ship, constraint)
      case 'dispersed':
        return this.strategies.placeShipDispersed(ship, constraint)
      case 'pattern':
        return this.strategies.placeShipPattern(ship, constraint)
      default:
        return this.strategies.placeShipBalanced(ship, constraint)
    }
  }

  /**
   * Executes the placement strategy for multiple ships
   */
  private async executeStrategy(
    ships: GameShip[],
    constraints: PlacementConstraint[]
  ): Promise<ShipPlacement[]> {
    const placements: ShipPlacement[] = []

    for (const ship of ships) {
      // Check timeout
      if (Date.now() - this.startTime > this.config.timeoutMs) {
        throw new Error('Placement timeout exceeded')
      }

      const placement = await this.placeSingleShip(ship, constraints)

      if (!placement) {
        // Try backtracking if we can't place this ship
        const backtrackResult = await this.attemptBacktrack(
          ships,
          placements,
          constraints
        )
        if (backtrackResult) {
          return backtrackResult
        }
        throw new Error(`Could not place ship: ${ship.id}`)
      }

      placements.push(placement)

      // Actually place the ship on the board
      const success = this.applyPlacement(placement)
      if (!success) {
        throw new Error(`Failed to apply placement for ship: ${ship.id}`)
      }

      // Update attempt counter
      this.currentAttempt++
      this.strategies.incrementAttempt()
    }

    // Store in history
    const strategyHistory = this.placementHistory.get(this.config.strategy) || []
    strategyHistory.push(...placements)
    this.placementHistory.set(this.config.strategy, strategyHistory)

    return placements
  }

  /**
   * Attempts to backtrack and find alternative placements
   */
  private async attemptBacktrack(
    allShips: GameShip[],
    currentPlacements: ShipPlacement[],
    constraints: PlacementConstraint[]
  ): Promise<ShipPlacement[] | null> {
    if (currentPlacements.length === 0) return null

    // Remove the last placement
    const lastPlacement = currentPlacements.pop()!
    this.board.removeShip(lastPlacement.shipId)

    // Try a different placement for the last ship
    const lastShip = allShips.find(s => s.id === lastPlacement.shipId)
    if (!lastShip) return null

    const alternativePlacement = await this.strategies.findAlternativePlacement(
      lastShip,
      lastPlacement,
      constraints
    )

    if (alternativePlacement) {
      currentPlacements.push(alternativePlacement)
      this.applyPlacement(alternativePlacement)

      // Try to continue with remaining ships
      const remainingShips = allShips.slice(currentPlacements.length)
      if (remainingShips.length === 0) {
        return currentPlacements
      }

      const completePlacements = await this.executeStrategy(
        remainingShips,
        constraints
      )
      return [...currentPlacements, ...completePlacements]
    }

    // If we can't find an alternative, try backtracking further
    if (currentPlacements.length > 0) {
      return this.attemptBacktrack(allShips, currentPlacements, constraints)
    }

    return null
  }

  /**
   * Applies a placement to the board
   */
  private applyPlacement(placement: ShipPlacement): boolean {
    try {
      // This would typically call the board's placeShip method
      // For now, we assume it succeeds
      // In a real implementation, this would interact with the board
      return true
    } catch {
      return false
    }
  }

  /**
   * Clears placement history
   */
  clearHistory(): void {
    this.placementHistory.clear()
  }

  /**
   * Gets placement history for analysis
   */
  getPlacementHistory(): Map<string, ShipPlacement[]> {
    return new Map(this.placementHistory)
  }

  /**
   * Updates configuration dynamically
   */
  updateConfig(newConfig: Partial<AutoPlacementConfig>): void {
    Object.assign(this.config, newConfig)
  }

  /**
   * Gets current configuration
   */
  getConfig(): AutoPlacementConfig {
    return { ...this.config }
  }

  /**
   * Resets the placer state
   */
  reset(): void {
    this.currentAttempt = 0
    this.startTime = 0
    this.strategies.setCurrentAttempt(0)
  }
}
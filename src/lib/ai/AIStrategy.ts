/**
 * AI Strategy System
 * Strategy pattern implementation for AI decision-making
 */

import {
  Coordinate,
  GameShip,
  ShipPosition,
  BoardState,
  AttackResult,
  ValidationResult
} from '../game/types'
import { PowerupType, ShipClass } from '../database/types/enums'
import { AbilityInstance } from '../ships/abilities/types'
import {
  AIContext,
  AIStrategy,
  StrategyResult,
  BoardAnalysis,
  TargetOpportunity,
  BehaviorProfile,
  DifficultyLevel
} from './types'

// =============================================
// BASE STRATEGY CLASS
// =============================================

export abstract class BaseStrategy implements AIStrategy {
  public readonly name: string
  public readonly type: 'placement' | 'targeting' | 'ability' | 'overall'

  constructor(name: string, type: 'placement' | 'targeting' | 'ability' | 'overall') {
    this.name = name
    this.type = type
  }

  abstract isApplicable(context: AIContext): boolean
  abstract calculatePriority(context: AIContext): number
  abstract execute(context: AIContext): StrategyResult

  /**
   * Helper method to create a strategy result
   */
  protected createResult(
    action: any,
    confidence: number,
    reasoning: string[],
    alternatives: any[] = []
  ): StrategyResult {
    return {
      recommendedAction: action,
      confidence: Math.max(0, Math.min(1, confidence)),
      reasoning,
      alternatives
    }
  }
}

// =============================================
// TARGETING STRATEGIES
// =============================================

/**
 * Hunt and Target Strategy
 * Classic battleship targeting - hunt for ships, then target adjacent cells
 */
export class HuntTargetStrategy extends BaseStrategy {
  constructor() {
    super('Hunt and Target', 'targeting')
  }

  isApplicable(context: AIContext): boolean {
    // Always applicable for targeting
    return true
  }

  calculatePriority(context: AIContext): number {
    const { aiState } = context
    const hasActiveTargets = aiState.memory.hits.some(hit =>
      !aiState.memory.sunkenShips.some(ship =>
        ship.positions.some(pos => pos.x === hit.coordinate.x && pos.y === hit.coordinate.y)
      )
    )

    // High priority if we have unsunk hits
    return hasActiveTargets ? 0.9 : 0.5
  }

  execute(context: AIContext): StrategyResult {
    const { aiState, gameState } = context
    const board = gameState.opponentBoard as BoardState

    // Check for unsunk hits to target
    const activeHits = this.findActiveHits(aiState, board)

    if (activeHits.length > 0) {
      // Target mode - shoot adjacent to hits
      const target = this.selectAdjacentTarget(activeHits[0], board, aiState)
      if (target) {
        return this.createResult(
          { type: 'attack', coordinate: target },
          0.8,
          ['Targeting adjacent to confirmed hit', 'Following up on damaged ship']
        )
      }
    }

    // Hunt mode - systematic search
    const huntTarget = this.selectHuntTarget(board, aiState)
    return this.createResult(
      { type: 'attack', coordinate: huntTarget },
      0.5,
      ['Hunting for new ships', 'Systematic grid search']
    )
  }

  private findActiveHits(aiState: any, board: BoardState): Coordinate[] {
    return aiState.memory.hits
      .filter((hit: any) => {
        // Check if this hit is part of a sunken ship
        const isSunk = aiState.memory.sunkenShips.some((ship: any) =>
          ship.positions.some((pos: Coordinate) =>
            pos.x === hit.coordinate.x && pos.y === hit.coordinate.y
          )
        )
        return !isSunk
      })
      .map((hit: any) => hit.coordinate)
  }

  private selectAdjacentTarget(hit: Coordinate, board: BoardState, aiState: any): Coordinate | null {
    const adjacent = [
      { x: hit.x - 1, y: hit.y },
      { x: hit.x + 1, y: hit.y },
      { x: hit.x, y: hit.y - 1 },
      { x: hit.x, y: hit.y + 1 }
    ]

    // Filter valid, unshot positions
    const validTargets = adjacent.filter(coord =>
      coord.x >= 0 && coord.x < board.width &&
      coord.y >= 0 && coord.y < board.height &&
      !aiState.memory.shotsFired.some((shot: Coordinate) =>
        shot.x === coord.x && shot.y === coord.y
      )
    )

    return validTargets.length > 0 ? validTargets[0] : null
  }

  private selectHuntTarget(board: BoardState, aiState: any): Coordinate {
    // Create a checkerboard pattern for efficient hunting
    const targets: Coordinate[] = []

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        // Checkerboard pattern based on smallest ship size (usually 2)
        if ((x + y) % 2 === 0) {
          const coord = { x, y }
          const alreadyShot = aiState.memory.shotsFired.some((shot: Coordinate) =>
            shot.x === coord.x && shot.y === coord.y
          )

          if (!alreadyShot) {
            targets.push(coord)
          }
        }
      }
    }

    // Return random target from available
    return targets.length > 0
      ? targets[Math.floor(Math.random() * targets.length)]
      : { x: Math.floor(Math.random() * board.width), y: Math.floor(Math.random() * board.height) }
  }
}

/**
 * Probability Density Strategy
 * Uses probability calculations to find most likely ship locations
 */
export class ProbabilityDensityStrategy extends BaseStrategy {
  constructor() {
    super('Probability Density', 'targeting')
  }

  isApplicable(context: AIContext): boolean {
    // Only for advanced and expert AI
    const difficulty = context.aiState.performanceMetrics.difficultyMetrics.keys().next().value
    return difficulty === 'advanced' || difficulty === 'expert'
  }

  calculatePriority(context: AIContext): number {
    // Higher priority for more analytical AI
    return context.aiState.boardAnalysis.probabilityGrid ? 0.7 : 0.3
  }

  execute(context: AIContext): StrategyResult {
    const { aiState, gameState } = context
    const board = gameState.opponentBoard as BoardState

    // Calculate probability grid
    const probGrid = this.calculateProbabilityGrid(board, aiState)

    // Find highest probability cell
    let maxProb = 0
    let bestTarget: Coordinate = { x: 0, y: 0 }

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (probGrid[y][x] > maxProb) {
          maxProb = probGrid[y][x]
          bestTarget = { x, y }
        }
      }
    }

    return this.createResult(
      { type: 'attack', coordinate: bestTarget },
      maxProb / 100, // Convert probability to confidence
      [
        'Using probability density analysis',
        `Highest probability cell: ${maxProb.toFixed(1)}%`,
        'Considering all possible ship placements'
      ]
    )
  }

  private calculateProbabilityGrid(board: BoardState, aiState: any): number[][] {
    const grid = Array(board.height).fill(null).map(() => Array(board.width).fill(0))

    // Get remaining ships (simplified - would need actual ship tracking)
    const remainingShipSizes = [5, 4, 3, 3, 2] // Standard battleship fleet

    remainingShipSizes.forEach(size => {
      // Check horizontal placements
      for (let y = 0; y < board.height; y++) {
        for (let x = 0; x <= board.width - size; x++) {
          if (this.canPlaceShip(x, y, size, 'horizontal', board, aiState)) {
            for (let i = 0; i < size; i++) {
              grid[y][x + i]++
            }
          }
        }
      }

      // Check vertical placements
      for (let y = 0; y <= board.height - size; y++) {
        for (let x = 0; x < board.width; x++) {
          if (this.canPlaceShip(x, y, size, 'vertical', board, aiState)) {
            for (let i = 0; i < size; i++) {
              grid[y + i][x]++
            }
          }
        }
      }
    })

    // Normalize to percentages
    const maxValue = Math.max(...grid.flat())
    if (maxValue > 0) {
      for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
          grid[y][x] = (grid[y][x] / maxValue) * 100
        }
      }
    }

    return grid
  }

  private canPlaceShip(
    x: number,
    y: number,
    size: number,
    orientation: 'horizontal' | 'vertical',
    board: BoardState,
    aiState: any
  ): boolean {
    for (let i = 0; i < size; i++) {
      const checkX = orientation === 'horizontal' ? x + i : x
      const checkY = orientation === 'vertical' ? y + i : y

      // Check if already shot and missed
      const wasMiss = aiState.memory.misses.some((miss: Coordinate) =>
        miss.x === checkX && miss.y === checkY
      )

      if (wasMiss) return false
    }

    return true
  }
}

// =============================================
// PLACEMENT STRATEGIES
// =============================================

/**
 * Clustered Placement Strategy
 * Groups ships together for mutual protection
 */
export class ClusteredPlacementStrategy extends BaseStrategy {
  constructor() {
    super('Clustered Placement', 'placement')
  }

  isApplicable(context: AIContext): boolean {
    return true
  }

  calculatePriority(context: AIContext): number {
    // Higher priority for defensive behavior
    return context.aiState.performanceMetrics.difficultyMetrics.get('defensive' as any) ? 0.7 : 0.4
  }

  execute(context: AIContext): StrategyResult {
    const { gameState } = context
    const board = gameState.playerBoard as BoardState
    const ships = gameState.playerFleet as GameShip[]

    const placements: ShipPosition[] = []
    const quadrant = this.selectQuadrant(board)

    ships.forEach(ship => {
      const position = this.findClusteredPosition(ship, quadrant, board, placements)
      if (position) {
        placements.push(position)
      }
    })

    return this.createResult(
      { type: 'place_ships', placements },
      0.7,
      ['Using clustered placement strategy', 'Ships grouped for mutual protection']
    )
  }

  private selectQuadrant(board: BoardState): { minX: number, maxX: number, minY: number, maxY: number } {
    const halfWidth = Math.floor(board.width / 2)
    const halfHeight = Math.floor(board.height / 2)

    const quadrants = [
      { minX: 0, maxX: halfWidth, minY: 0, maxY: halfHeight },
      { minX: halfWidth, maxX: board.width, minY: 0, maxY: halfHeight },
      { minX: 0, maxX: halfWidth, minY: halfHeight, maxY: board.height },
      { minX: halfWidth, maxX: board.width, minY: halfHeight, maxY: board.height }
    ]

    return quadrants[Math.floor(Math.random() * quadrants.length)]
  }

  private findClusteredPosition(
    ship: GameShip,
    quadrant: any,
    board: BoardState,
    existingPlacements: ShipPosition[]
  ): ShipPosition | null {
    // Simplified placement - would need proper collision detection
    const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical'

    for (let attempt = 0; attempt < 100; attempt++) {
      const x = quadrant.minX + Math.floor(Math.random() * (quadrant.maxX - quadrant.minX))
      const y = quadrant.minY + Math.floor(Math.random() * (quadrant.maxY - quadrant.minY))

      const position: ShipPosition = {
        shipId: ship.id,
        coordinates: [],
        orientation: orientation as any,
        startPosition: { x, y }
      }

      // Generate coordinates
      for (let i = 0; i < ship.size; i++) {
        const coord = {
          x: orientation === 'horizontal' ? x + i : x,
          y: orientation === 'vertical' ? y + i : y
        }

        if (coord.x >= board.width || coord.y >= board.height) break
        position.coordinates.push(coord)
      }

      if (position.coordinates.length === ship.size) {
        // Check for collisions
        const hasCollision = existingPlacements.some(existing =>
          existing.coordinates.some(ec =>
            position.coordinates.some(pc => ec.x === pc.x && ec.y === pc.y)
          )
        )

        if (!hasCollision) {
          return position
        }
      }
    }

    return null
  }
}

/**
 * Distributed Placement Strategy
 * Spreads ships across the board
 */
export class DistributedPlacementStrategy extends BaseStrategy {
  constructor() {
    super('Distributed Placement', 'placement')
  }

  isApplicable(context: AIContext): boolean {
    return true
  }

  calculatePriority(context: AIContext): number {
    return 0.6
  }

  execute(context: AIContext): StrategyResult {
    const { gameState } = context
    const board = gameState.playerBoard as BoardState
    const ships = gameState.playerFleet as GameShip[]

    const placements: ShipPosition[] = []
    const zones = this.createZones(board, ships.length)

    ships.forEach((ship, index) => {
      const position = this.placeInZone(ship, zones[index], board, placements)
      if (position) {
        placements.push(position)
      }
    })

    return this.createResult(
      { type: 'place_ships', placements },
      0.6,
      ['Using distributed placement strategy', 'Ships spread across the board']
    )
  }

  private createZones(board: BoardState, count: number): any[] {
    const zones = []
    const zoneWidth = Math.floor(board.width / Math.ceil(Math.sqrt(count)))
    const zoneHeight = Math.floor(board.height / Math.ceil(Math.sqrt(count)))

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / Math.ceil(Math.sqrt(count)))
      const col = i % Math.ceil(Math.sqrt(count))

      zones.push({
        minX: col * zoneWidth,
        maxX: Math.min((col + 1) * zoneWidth, board.width),
        minY: row * zoneHeight,
        maxY: Math.min((row + 1) * zoneHeight, board.height)
      })
    }

    return zones
  }

  private placeInZone(
    ship: GameShip,
    zone: any,
    board: BoardState,
    existingPlacements: ShipPosition[]
  ): ShipPosition | null {
    // Similar to clustered placement but within specific zone
    return this.findValidPosition(ship, zone, board, existingPlacements)
  }

  private findValidPosition(
    ship: GameShip,
    zone: any,
    board: BoardState,
    existingPlacements: ShipPosition[]
  ): ShipPosition | null {
    // Implementation similar to ClusteredPlacementStrategy.findClusteredPosition
    // but constrained to the zone
    const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical'

    for (let attempt = 0; attempt < 50; attempt++) {
      const x = zone.minX + Math.floor(Math.random() * (zone.maxX - zone.minX))
      const y = zone.minY + Math.floor(Math.random() * (zone.maxY - zone.minY))

      const position: ShipPosition = {
        shipId: ship.id,
        coordinates: [],
        orientation: orientation as any,
        startPosition: { x, y }
      }

      for (let i = 0; i < ship.size; i++) {
        const coord = {
          x: orientation === 'horizontal' ? x + i : x,
          y: orientation === 'vertical' ? y + i : y
        }

        if (coord.x >= zone.maxX || coord.y >= zone.maxY) break
        position.coordinates.push(coord)
      }

      if (position.coordinates.length === ship.size) {
        const hasCollision = existingPlacements.some(existing =>
          existing.coordinates.some(ec =>
            position.coordinates.some(pc => ec.x === pc.x && ec.y === pc.y)
          )
        )

        if (!hasCollision) {
          return position
        }
      }
    }

    return null
  }
}

// =============================================
// ABILITY STRATEGIES
// =============================================

/**
 * Offensive Ability Strategy
 * Prioritizes damage-dealing abilities
 */
export class OffensiveAbilityStrategy extends BaseStrategy {
  constructor() {
    super('Offensive Abilities', 'ability')
  }

  isApplicable(context: AIContext): boolean {
    const hasOffensiveAbilities = context.currentPlayer.fleet.some((ship: GameShip) =>
      ship.abilities.some(ability => this.isOffensiveAbility(ability))
    )
    return hasOffensiveAbilities
  }

  calculatePriority(context: AIContext): number {
    const behavior = context.aiState.performanceMetrics.difficultyMetrics.get('aggressive' as any)
    return behavior ? 0.8 : 0.5
  }

  execute(context: AIContext): StrategyResult {
    const availableAbilities = this.getAvailableAbilities(context)
    const offensiveAbilities = availableAbilities.filter(a => this.isOffensiveAbility(a))

    if (offensiveAbilities.length === 0) {
      return this.createResult(null, 0, ['No offensive abilities available'])
    }

    // Select highest damage ability
    const bestAbility = offensiveAbilities[0] // Simplified selection

    return this.createResult(
      { type: 'use_ability', abilityId: bestAbility.id },
      0.7,
      ['Using offensive ability', 'Maximizing damage output']
    )
  }

  private isOffensiveAbility(ability: any): boolean {
    // Check ability type/name for offensive capabilities
    const offensiveKeywords = ['damage', 'attack', 'strike', 'barrage', 'armor piercing']
    return offensiveKeywords.some(keyword =>
      ability.name.toLowerCase().includes(keyword)
    )
  }

  private getAvailableAbilities(context: AIContext): any[] {
    const abilities: any[] = []

    context.currentPlayer.fleet.forEach((ship: GameShip) => {
      ship.abilities.forEach(ability => {
        if (ability.remainingUses > 0 && ability.currentCooldown === 0) {
          abilities.push(ability)
        }
      })
    })

    return abilities
  }
}

/**
 * Defensive Ability Strategy
 * Prioritizes protection and evasion abilities
 */
export class DefensiveAbilityStrategy extends BaseStrategy {
  constructor() {
    super('Defensive Abilities', 'ability')
  }

  isApplicable(context: AIContext): boolean {
    // Apply when under threat
    const threatLevel = context.aiState.threatAssessment.threatLevel
    return threatLevel > 0.5
  }

  calculatePriority(context: AIContext): number {
    const threatLevel = context.aiState.threatAssessment.threatLevel
    return threatLevel * 0.9
  }

  execute(context: AIContext): StrategyResult {
    const availableAbilities = this.getAvailableAbilities(context)
    const defensiveAbilities = availableAbilities.filter(a => this.isDefensiveAbility(a))

    if (defensiveAbilities.length === 0) {
      return this.createResult(null, 0, ['No defensive abilities available'])
    }

    const bestAbility = defensiveAbilities[0]

    return this.createResult(
      { type: 'use_ability', abilityId: bestAbility.id },
      0.8,
      ['Using defensive ability', 'Protecting critical ships']
    )
  }

  private isDefensiveAbility(ability: any): boolean {
    const defensiveKeywords = ['shield', 'evade', 'repair', 'armor', 'defense', 'silent']
    return defensiveKeywords.some(keyword =>
      ability.name.toLowerCase().includes(keyword)
    )
  }

  private getAvailableAbilities(context: AIContext): any[] {
    // Same as OffensiveAbilityStrategy.getAvailableAbilities
    const abilities: any[] = []

    context.currentPlayer.fleet.forEach((ship: GameShip) => {
      ship.abilities.forEach(ability => {
        if (ability.remainingUses > 0 && ability.currentCooldown === 0) {
          abilities.push(ability)
        }
      })
    })

    return abilities
  }
}

// =============================================
// STRATEGY FACTORY
// =============================================

export class StrategyFactory {
  private static strategies: Map<string, AIStrategy> = new Map()

  static {
    // Register default strategies
    this.registerStrategy(new HuntTargetStrategy())
    this.registerStrategy(new ProbabilityDensityStrategy())
    this.registerStrategy(new ClusteredPlacementStrategy())
    this.registerStrategy(new DistributedPlacementStrategy())
    this.registerStrategy(new OffensiveAbilityStrategy())
    this.registerStrategy(new DefensiveAbilityStrategy())
  }

  /**
   * Register a strategy
   */
  static registerStrategy(strategy: AIStrategy): void {
    this.strategies.set(strategy.name, strategy)
  }

  /**
   * Get all applicable strategies for a context
   */
  static getApplicableStrategies(context: AIContext, type?: string): AIStrategy[] {
    const applicable: AIStrategy[] = []

    this.strategies.forEach(strategy => {
      if ((!type || strategy.type === type) && strategy.isApplicable(context)) {
        applicable.push(strategy)
      }
    })

    // Sort by priority
    applicable.sort((a, b) =>
      b.calculatePriority(context) - a.calculatePriority(context)
    )

    return applicable
  }

  /**
   * Get best strategy for a context
   */
  static getBestStrategy(context: AIContext, type?: string): AIStrategy | null {
    const strategies = this.getApplicableStrategies(context, type)
    return strategies.length > 0 ? strategies[0] : null
  }

  /**
   * Get strategy by name
   */
  static getStrategy(name: string): AIStrategy | undefined {
    return this.strategies.get(name)
  }

  /**
   * Get all registered strategies
   */
  static getAllStrategies(): AIStrategy[] {
    return Array.from(this.strategies.values())
  }
}
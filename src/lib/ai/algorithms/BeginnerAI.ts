/**
 * Beginner AI Implementation
 * Simple, predictable AI with random targeting and basic ship placement
 */

import { AIPlayer, AIPlayerConfig } from '../AIPlayer'
import {
  Coordinate,
  GameShip,
  ShipPosition,
  BoardState,
  AttackResult,
  GameAction,
  Orientation,
  MoveResult
} from '../../game/types'
import { PowerupType } from '../../database/types/enums'
import { AbilityInstance } from '../../ships/abilities/types'
import {
  AIDecision,
  AIContext,
  BoardAnalysis,
  ThreatAssessment,
  DecisionReasoning
} from '../types'

export class BeginnerAI extends AIPlayer {
  // Track last few shots to avoid immediate repeats
  private recentShots: Coordinate[] = []
  private maxRecentMemory = 5

  constructor(config: Omit<AIPlayerConfig, 'difficulty'>) {
    super({
      ...config,
      difficulty: 'beginner'
    })
  }

  /**
   * Make a decision - Beginner AI uses simple random selection
   */
  async makeDecision(context: AIContext): Promise<AIDecision> {
    // Simulate thinking time for realism
    await this.simulateThinking()

    const board = context.gameState.players.find((p: any) => p.id !== this.id)?.board
    if (!board) {
      throw new Error('Opponent board not found')
    }

    // Simple decision: just attack a random cell
    const target = this.selectTarget(board)

    const action: GameAction = {
      id: `action_${Date.now()}`,
      type: 'attack',
      playerId: this.id,
      timestamp: new Date(),
      data: {
        targetCoordinate: target,
        attackType: 'normal'
      }
    }

    const reasoning: DecisionReasoning = {
      primaryFactors: ['Random selection', 'Avoiding recent shots'],
      riskAssessment: 0.5,
      expectedOutcome: 'Unknown - random targeting',
      confidenceFactors: ['Low confidence - beginner strategy']
    }

    const decision: AIDecision = {
      id: `decision_${Date.now()}`,
      turnNumber: context.turnNumber,
      type: 'attack',
      action,
      confidence: 0.3, // Low confidence for random shots
      reasoning,
      alternatives: [],
      timestamp: new Date()
    }

    this.decisionHistory.push(decision)
    return decision
  }

  /**
   * Select target - Random with basic avoidance of recent shots
   */
  selectTarget(board: BoardState): Coordinate {
    const availableTargets: Coordinate[] = []

    // Find all cells that haven't been hit
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const cell = board.cells[y][x]
        if (!cell.isHit && !this.wasRecentlyShot({ x, y })) {
          availableTargets.push({ x, y })
        }
      }
    }

    // If we've shot at most cells recently, include them again
    if (availableTargets.length === 0) {
      for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
          if (!board.cells[y][x].isHit) {
            availableTargets.push({ x, y })
          }
        }
      }
    }

    // Random selection with slight preference for center cells
    if (Math.random() < 0.3 && availableTargets.length > 0) {
      // 30% chance to prefer center area
      const centerTargets = availableTargets.filter(coord => {
        const distFromCenterX = Math.abs(coord.x - board.width / 2)
        const distFromCenterY = Math.abs(coord.y - board.height / 2)
        return distFromCenterX <= 2 && distFromCenterY <= 2
      })

      if (centerTargets.length > 0) {
        const selected = centerTargets[Math.floor(Math.random() * centerTargets.length)]
        this.recordRecentShot(selected)
        return selected
      }
    }

    // Default random selection
    const selected = availableTargets[Math.floor(Math.random() * availableTargets.length)]
    this.recordRecentShot(selected)
    return selected
  }

  /**
   * Place fleet - Simple random placement with basic validation
   */
  placeFleet(ships: GameShip[]): ShipPosition[] {
    const positions: ShipPosition[] = []
    const occupiedCells = new Set<string>()

    for (const ship of ships) {
      let placed = false
      let attempts = 0
      const maxAttempts = 100

      while (!placed && attempts < maxAttempts) {
        attempts++

        // Random orientation
        const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'

        // Random starting position
        const maxX = orientation === 'horizontal' ?
          this.board.width - ship.size : this.board.width - 1
        const maxY = orientation === 'vertical' ?
          this.board.height - ship.size : this.board.height - 1

        const startX = Math.floor(Math.random() * (maxX + 1))
        const startY = Math.floor(Math.random() * (maxY + 1))

        // Calculate coordinates
        const coordinates: Coordinate[] = []
        for (let i = 0; i < ship.size; i++) {
          const x = orientation === 'horizontal' ? startX + i : startX
          const y = orientation === 'vertical' ? startY + i : startY
          coordinates.push({ x, y })
        }

        // Check if placement is valid (no overlaps)
        const isValid = coordinates.every(coord =>
          !occupiedCells.has(`${coord.x},${coord.y}`)
        )

        if (isValid) {
          // Mark cells as occupied
          coordinates.forEach(coord => {
            occupiedCells.add(`${coord.x},${coord.y}`)
          })

          positions.push({
            shipId: ship.id,
            coordinates,
            orientation,
            startPosition: { x: startX, y: startY }
          })

          placed = true
        }
      }

      if (!placed) {
        console.error(`Failed to place ship ${ship.id} after ${maxAttempts} attempts`)
      }
    }

    return positions
  }

  /**
   * Select ability - Beginner AI rarely uses abilities
   */
  selectAbility(available: AbilityInstance[]): AbilityInstance | null {
    // Only 20% chance to use an ability
    if (Math.random() > 0.2) {
      return null
    }

    // If we decide to use one, pick randomly
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)]
    }

    return null
  }

  /**
   * Select powerup - Beginner AI rarely uses powerups effectively
   */
  selectPowerup(available: PowerupType[]): PowerupType | null {
    // Only 15% chance to use a powerup
    if (Math.random() > 0.15) {
      return null
    }

    // Random selection if using
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)]
    }

    return null
  }

  /**
   * Analyze board - Simple analysis for beginner AI
   */
  analyzeBoard(board: BoardState): BoardAnalysis {
    const analysis = this.state.boardAnalysis

    // Very basic heat map - just mark hits and nearby cells
    for (const hit of this.state.memory.hits) {
      const { coordinate } = hit
      if (coordinate.y < analysis.heatMap.length && coordinate.x < analysis.heatMap[0].length) {
        analysis.heatMap[coordinate.y][coordinate.x] = 1

        // Mark adjacent cells as slightly interesting
        const adjacent = this.getAdjacentCells(coordinate, board)
        adjacent.forEach(adj => {
          if (adj.y < analysis.heatMap.length && adj.x < analysis.heatMap[0].length) {
            analysis.heatMap[adj.y][adj.x] = Math.max(
              analysis.heatMap[adj.y][adj.x],
              0.5
            )
          }
        })
      }
    }

    return analysis
  }

  /**
   * Assess threats - Beginner AI has poor threat assessment
   */
  assessThreats(context: AIContext): ThreatAssessment {
    // Very basic threat assessment
    const playerShips = this.fleet.filter(s => !s.damage.isSunk)
    const threatsCount = playerShips.filter(s => s.damage.totalHits > 0).length

    return {
      immediateThreats: [],
      potentialThreats: [],
      threatLevel: threatsCount > 2 ? 0.6 : 0.3,
      criticalShips: []
    }
  }

  /**
   * Override updateMemory to handle beginner's limited memory
   */
  updateMemory(result: AttackResult): void {
    super.updateMemory(result)

    // Beginner AI has limited pattern recognition
    // Only remember if we hit something
    if (result.result === MoveResult.HIT && !result.shipSunk) {
      // Sometimes (30% chance) try to target nearby cells
      if (Math.random() < 0.3) {
        const adjacent = this.getAdjacentCells(result.coordinate, this.board)
        // Store these as potential targets (though beginner often forgets)
        this.state.boardAnalysis.highValueTargets = adjacent.slice(0, 2)
      }
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private wasRecentlyShot(coord: Coordinate): boolean {
    return this.recentShots.some(shot =>
      shot.x === coord.x && shot.y === coord.y
    )
  }

  private recordRecentShot(coord: Coordinate): void {
    this.recentShots.push(coord)
    if (this.recentShots.length > this.maxRecentMemory) {
      this.recentShots.shift()
    }
  }

  private getAdjacentCells(coord: Coordinate, board: BoardState): Coordinate[] {
    const adjacent: Coordinate[] = []
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }  // left
    ]

    for (const dir of directions) {
      const x = coord.x + dir.dx
      const y = coord.y + dir.dy

      if (x >= 0 && x < board.width && y >= 0 && y < board.height) {
        if (!board.cells[y][x].isHit) {
          adjacent.push({ x, y })
        }
      }
    }

    return adjacent
  }
}
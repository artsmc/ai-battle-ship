/**
 * Intermediate AI Implementation
 * Hunt/target strategy with improved ship placement and basic pattern recognition
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
import {
  AIDecision,
  AIContext,
  BoardAnalysis,
  ThreatAssessment,
  DecisionReasoning,
  HitMemory
} from '../types'

type HuntMode = 'hunt' | 'target' | 'finish'

export class IntermediateAI extends AIPlayer {
  private mode: HuntMode = 'hunt'
  private currentTargets: Coordinate[] = []
  private targetShipOrientation: Orientation | null = null
  private checkerboardPattern: Coordinate[] = []
  private patternIndex = 0

  constructor(config: Omit<AIPlayerConfig, 'difficulty'>) {
    super({
      ...config,
      difficulty: 'intermediate'
    })
    this.initializeCheckerboardPattern()
  }

  /**
   * Initialize checkerboard hunting pattern
   */
  private initializeCheckerboardPattern(): void {
    // Create a checkerboard pattern for efficient hunting
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        // Create checkerboard with spacing of 2 (can hit any ship of size 2+)
        if ((x + y) % 2 === 0) {
          this.checkerboardPattern.push({ x, y })
        }
      }
    }
    // Shuffle for less predictability
    this.shuffleArray(this.checkerboardPattern)
  }

  /**
   * Make a decision - Uses hunt/target strategy
   */
  async makeDecision(context: AIContext): Promise<AIDecision> {
    await this.simulateThinking()

    const board = context.gameState.players.find(p => p.id !== this.id)?.board
    if (!board) {
      throw new Error('Opponent board not found')
    }

    // Update mode based on current state
    this.updateMode()

    const target = this.selectTarget(board)

    // Occasionally use abilities (40% chance when available)
    let selectedAbility: AbilityInstance | null = null
    if (Math.random() < 0.4) {
      const availableAbilities = this.getAvailableAbilities()
      selectedAbility = this.selectAbility(availableAbilities)
    }

    const action: GameAction = {
      id: `action_${Date.now()}`,
      type: 'attack',
      playerId: this.id,
      timestamp: new Date(),
      data: {
        targetCoordinate: target,
        attackType: selectedAbility ? 'special' : 'normal'
      }
    }

    const reasoning: DecisionReasoning = {
      primaryFactors: [
        `Mode: ${this.mode}`,
        this.mode === 'target' ? 'Following up on hit' : 'Systematic hunting',
        selectedAbility ? `Using ability: ${selectedAbility.name}` : 'Standard attack'
      ],
      riskAssessment: 0.3,
      expectedOutcome: this.mode === 'target' ? 'Likely hit on damaged ship' : 'Searching for ships',
      confidenceFactors: this.mode === 'target' ?
        ['High confidence - targeting known ship'] :
        ['Medium confidence - systematic search']
    }

    const decision: AIDecision = {
      id: `decision_${Date.now()}`,
      turnNumber: context.turnNumber,
      type: 'attack',
      action,
      confidence: this.mode === 'target' ? 0.7 : 0.5,
      reasoning,
      alternatives: [],
      timestamp: new Date()
    }

    this.decisionHistory.push(decision)
    return decision
  }

  /**
   * Update hunting mode based on game state
   */
  private updateMode(): void {
    // Check if we have active targets
    if (this.currentTargets.length > 0) {
      this.mode = 'target'
    } else if (this.state.memory.confirmedShips.some(s => s.remainingHealth && s.remainingHealth > 0)) {
      this.mode = 'finish'
    } else {
      this.mode = 'hunt'
    }
  }

  /**
   * Select target - Hunt/Target strategy
   */
  selectTarget(board: BoardState): Coordinate {
    switch (this.mode) {
      case 'target':
        return this.selectTargetMode(board)
      case 'finish':
        return this.selectFinishMode(board)
      default:
        return this.selectHuntMode(board)
    }
  }

  /**
   * Hunt mode - Systematic search using checkerboard pattern
   */
  private selectHuntMode(board: BoardState): Coordinate {
    // Try checkerboard pattern first
    while (this.patternIndex < this.checkerboardPattern.length) {
      const coord = this.checkerboardPattern[this.patternIndex++]
      if (!board.cells[coord.y][coord.x].isHit) {
        return coord
      }
    }

    // If pattern exhausted, find any unhit cell
    const availableTargets: Coordinate[] = []
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.cells[y][x].isHit) {
          availableTargets.push({ x, y })
        }
      }
    }

    if (availableTargets.length > 0) {
      // Prefer cells with higher probability
      const weighted = availableTargets.map(coord => ({
        coord,
        weight: this.calculateCellProbability(coord, board)
      }))

      weighted.sort((a, b) => b.weight - a.weight)
      return weighted[0].coord
    }

    // Fallback to first available
    return { x: 0, y: 0 }
  }

  /**
   * Target mode - Focus on hitting adjacent cells to known hits
   */
  private selectTargetMode(board: BoardState): Coordinate {
    if (this.currentTargets.length > 0) {
      // Sort targets by priority
      this.currentTargets.sort((a, b) => {
        const priorityA = this.calculateTargetPriority(a, board)
        const priorityB = this.calculateTargetPriority(b, board)
        return priorityB - priorityA
      })

      const target = this.currentTargets.shift()!
      return target
    }

    // Fallback to hunt mode if no targets
    this.mode = 'hunt'
    return this.selectHuntMode(board)
  }

  /**
   * Finish mode - Complete sinking partially damaged ships
   */
  private selectFinishMode(board: BoardState): Coordinate {
    // Find ships that are hit but not sunk
    for (const ship of this.state.memory.confirmedShips) {
      if (ship.knownPositions.length > 0) {
        // Try to find remaining parts of the ship
        const targets = this.generateShipTargets(ship, board)
        if (targets.length > 0) {
          return targets[0]
        }
      }
    }

    // Fallback to hunt mode
    this.mode = 'hunt'
    return this.selectHuntMode(board)
  }

  /**
   * Calculate probability that a cell contains a ship
   */
  private calculateCellProbability(coord: Coordinate, board: BoardState): number {
    let probability = 1.0

    // Check adjacent cells for hits
    const adjacent = this.getAdjacentCells(coord, board)
    const adjacentHits = adjacent.filter(c =>
      board.cells[c.y][c.x].isHit &&
      board.cells[c.y][c.x].hasShip
    ).length

    probability += adjacentHits * 0.5

    // Prefer cells that could fit remaining ships
    const remainingShipSizes = [5, 4, 3, 3, 2] // Standard fleet
    for (const size of remainingShipSizes) {
      if (this.canFitShip(coord, size, 'horizontal', board)) {
        probability += 0.2
      }
      if (this.canFitShip(coord, size, 'vertical', board)) {
        probability += 0.2
      }
    }

    return probability
  }

  /**
   * Calculate priority for a target cell
   */
  private calculateTargetPriority(coord: Coordinate, board: BoardState): number {
    let priority = 1.0

    // Higher priority if it continues a line of hits
    if (this.targetShipOrientation) {
      const lastHit = this.state.memory.hits[this.state.memory.hits.length - 1]
      if (lastHit) {
        if (this.targetShipOrientation === 'horizontal' && coord.y === lastHit.coordinate.y) {
          priority += 2.0
        } else if (this.targetShipOrientation === 'vertical' && coord.x === lastHit.coordinate.x) {
          priority += 2.0
        }
      }
    }

    return priority
  }

  /**
   * Generate potential targets for a partially hit ship
   */
  private generateShipTargets(ship: any, board: BoardState): Coordinate[] {
    const targets: Coordinate[] = []

    if (ship.orientation) {
      // We know the orientation, target along the line
      const positions = ship.knownPositions
      const minX = Math.min(...positions.map((p: Coordinate) => p.x))
      const maxX = Math.max(...positions.map((p: Coordinate) => p.x))
      const minY = Math.min(...positions.map((p: Coordinate) => p.y))
      const maxY = Math.max(...positions.map((p: Coordinate) => p.y))

      if (ship.orientation === 'horizontal') {
        // Check ends
        if (minX > 0 && !board.cells[minY][minX - 1].isHit) {
          targets.push({ x: minX - 1, y: minY })
        }
        if (maxX < board.width - 1 && !board.cells[minY][maxX + 1].isHit) {
          targets.push({ x: maxX + 1, y: minY })
        }
      } else {
        // Vertical
        if (minY > 0 && !board.cells[minY - 1][minX].isHit) {
          targets.push({ x: minX, y: minY - 1 })
        }
        if (maxY < board.height - 1 && !board.cells[maxY + 1][minX].isHit) {
          targets.push({ x: minX, y: maxY + 1 })
        }
      }
    } else {
      // Unknown orientation, check all adjacent
      for (const pos of ship.knownPositions) {
        const adjacent = this.getAdjacentCells(pos, board)
        targets.push(...adjacent.filter(c => !board.cells[c.y][c.x].isHit))
      }
    }

    return targets
  }

  /**
   * Check if a ship of given size can fit at position
   */
  private canFitShip(start: Coordinate, size: number, orientation: Orientation, board: BoardState): boolean {
    for (let i = 0; i < size; i++) {
      const x = orientation === 'horizontal' ? start.x + i : start.x
      const y = orientation === 'vertical' ? start.y + i : start.y

      if (x >= board.width || y >= board.height || board.cells[y][x].isHit) {
        return false
      }
    }
    return true
  }

  /**
   * Place fleet - Distributed placement with spacing
   */
  placeFleet(ships: GameShip[]): ShipPosition[] {
    const positions: ShipPosition[] = []
    const occupiedCells = new Set<string>()
    const shipBuffer = 1 // Minimum spacing between ships

    // Sort ships by size (place larger ships first)
    const sortedShips = [...ships].sort((a, b) => b.size - a.size)

    for (const ship of sortedShips) {
      let placed = false
      let attempts = 0
      const maxAttempts = 200

      while (!placed && attempts < maxAttempts) {
        attempts++

        // Prefer edges for larger ships, center for smaller
        const preferEdge = ship.size >= 4
        const orientation: Orientation = Math.random() < 0.6 ? 'horizontal' : 'vertical'

        let startX: number, startY: number

        if (preferEdge && Math.random() < 0.7) {
          // Place near edges
          if (Math.random() < 0.5) {
            // Top or bottom edge
            startY = Math.random() < 0.5 ? 0 : this.board.height - 1
            startX = Math.floor(Math.random() * this.board.width)
          } else {
            // Left or right edge
            startX = Math.random() < 0.5 ? 0 : this.board.width - 1
            startY = Math.floor(Math.random() * this.board.height)
          }
        } else {
          // Random placement
          const maxX = orientation === 'horizontal' ?
            this.board.width - ship.size : this.board.width - 1
          const maxY = orientation === 'vertical' ?
            this.board.height - ship.size : this.board.height - 1

          startX = Math.floor(Math.random() * (maxX + 1))
          startY = Math.floor(Math.random() * (maxY + 1))
        }

        // Calculate coordinates
        const coordinates: Coordinate[] = []
        for (let i = 0; i < ship.size; i++) {
          const x = orientation === 'horizontal' ? startX + i : startX
          const y = orientation === 'vertical' ? startY + i : startY
          if (x >= this.board.width || y >= this.board.height) {
            break
          }
          coordinates.push({ x, y })
        }

        if (coordinates.length !== ship.size) {
          continue
        }

        // Check placement validity with buffer
        const isValid = this.isPlacementValid(coordinates, occupiedCells, shipBuffer)

        if (isValid) {
          // Mark cells as occupied (including buffer)
          this.markOccupied(coordinates, occupiedCells, shipBuffer)

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
        // Fallback: place without buffer
        const fallbackPos = this.fallbackPlacement(ship, occupiedCells)
        if (fallbackPos) {
          positions.push(fallbackPos)
          fallbackPos.coordinates.forEach(coord => {
            occupiedCells.add(`${coord.x},${coord.y}`)
          })
        }
      }
    }

    return positions
  }

  /**
   * Check if placement is valid with buffer spacing
   */
  private isPlacementValid(coordinates: Coordinate[], occupied: Set<string>, buffer: number): boolean {
    for (const coord of coordinates) {
      // Check the cell and surrounding buffer
      for (let dy = -buffer; dy <= buffer; dy++) {
        for (let dx = -buffer; dx <= buffer; dx++) {
          const checkX = coord.x + dx
          const checkY = coord.y + dy
          if (occupied.has(`${checkX},${checkY}`)) {
            return false
          }
        }
      }
    }
    return true
  }

  /**
   * Mark cells as occupied including buffer zone
   */
  private markOccupied(coordinates: Coordinate[], occupied: Set<string>, buffer: number): void {
    for (const coord of coordinates) {
      for (let dy = -buffer; dy <= buffer; dy++) {
        for (let dx = -buffer; dx <= buffer; dx++) {
          const x = coord.x + dx
          const y = coord.y + dy
          if (x >= 0 && x < this.board.width && y >= 0 && y < this.board.height) {
            occupied.add(`${x},${y}`)
          }
        }
      }
    }
  }

  /**
   * Fallback placement without buffer requirements
   */
  private fallbackPlacement(ship: GameShip, occupied: Set<string>): ShipPosition | null {
    for (let attempts = 0; attempts < 100; attempts++) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'
      const maxX = orientation === 'horizontal' ?
        this.board.width - ship.size : this.board.width - 1
      const maxY = orientation === 'vertical' ?
        this.board.height - ship.size : this.board.height - 1

      const startX = Math.floor(Math.random() * (maxX + 1))
      const startY = Math.floor(Math.random() * (maxY + 1))

      const coordinates: Coordinate[] = []
      let valid = true

      for (let i = 0; i < ship.size; i++) {
        const x = orientation === 'horizontal' ? startX + i : startX
        const y = orientation === 'vertical' ? startY + i : startY

        if (occupied.has(`${x},${y}`)) {
          valid = false
          break
        }
        coordinates.push({ x, y })
      }

      if (valid && coordinates.length === ship.size) {
        return {
          shipId: ship.id,
          coordinates,
          orientation,
          startPosition: { x: startX, y: startY }
        }
      }
    }

    return null
  }

  /**
   * Select ability - Basic strategic usage
   */
  selectAbility(available: any[]): any | null {
    if (available.length === 0) return null

    // Prioritize abilities based on game state
    const prioritized = available.map(ability => ({
      ability,
      priority: this.calculateAbilityPriority(ability)
    }))

    prioritized.sort((a, b) => b.priority - a.priority)

    // Use highest priority ability if it's worth it
    if (prioritized[0].priority > 0.5) {
      return prioritized[0].ability
    }

    return null
  }

  /**
   * Calculate priority for ability usage
   */
  private calculateAbilityPriority(ability: any): number {
    // Base priority based on ability type
    let priority = 0.5

    // Higher priority if we're in target mode (have active targets)
    if (this.mode === 'target') {
      priority += 0.3
    }

    // Higher priority if many ships are damaged
    const damagedShips = this.state.memory.confirmedShips.filter(s =>
      s.knownPositions.length > 0
    ).length
    priority += damagedShips * 0.1

    return Math.min(1, priority)
  }

  /**
   * Select powerup - Strategic usage based on game state
   */
  selectPowerup(available: PowerupType[]): PowerupType | null {
    if (available.length === 0) return null

    // Use powerups more strategically
    if (this.mode === 'target' && available.includes(PowerupType.SONAR_PING)) {
      return PowerupType.SONAR_PING
    }

    if (this.state.memory.confirmedShips.length >= 2 && available.includes(PowerupType.BARRAGE)) {
      return PowerupType.BARRAGE
    }

    // 30% chance to use any available powerup
    if (Math.random() < 0.3) {
      return available[Math.floor(Math.random() * available.length)]
    }

    return null
  }

  /**
   * Analyze board - Improved analysis with pattern recognition
   */
  analyzeBoard(board: BoardState): BoardAnalysis {
    const analysis = super.analyzeBoard(board)

    // Update probability grid based on known information
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.cells[y][x].isHit) {
          analysis.probabilityGrid[y][x] = this.calculateCellProbability({ x, y }, board)
        } else {
          analysis.probabilityGrid[y][x] = 0
        }
      }
    }

    // Identify high-value targets
    analysis.highValueTargets = []
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (analysis.probabilityGrid[y][x] > 0.7) {
          analysis.highValueTargets.push({ x, y })
        }
      }
    }

    return analysis
  }

  /**
   * Assess threats - Improved threat assessment
   */
  assessThreats(context: AIContext): ThreatAssessment {
    const threats = super.assessThreats(context)

    // Calculate threat level based on fleet status
    const fleetStatus = this.getFleetStatus()
    threats.threatLevel = 1 - (fleetStatus.healthPercentage / 100)

    // Identify critical ships
    threats.criticalShips = this.fleet
      .filter(s => !s.damage.isSunk && s.damage.totalHits > 0)
      .map(s => s.id)

    return threats
  }

  /**
   * Override updateMemory to implement hunt/target logic
   */
  updateMemory(result: AttackResult): void {
    super.updateMemory(result)

    if (result.result === MoveResult.HIT && !result.shipSunk) {
      // Switch to target mode
      this.mode = 'target'

      // Add adjacent cells as targets
      const adjacent = this.getAdjacentCells(result.coordinate, this.board)
      this.currentTargets.push(...adjacent)

      // Try to determine ship orientation if we have multiple hits
      const shipHits = this.state.memory.hits.filter(h => h.shipId === result.shipHit)
      if (shipHits.length >= 2) {
        const coords = shipHits.map(h => h.coordinate)
        if (coords.every(c => c.x === coords[0].x)) {
          this.targetShipOrientation = 'vertical'
        } else if (coords.every(c => c.y === coords[0].y)) {
          this.targetShipOrientation = 'horizontal'
        }
      }
    } else if (result.result === MoveResult.SUNK) {
      // Clear targets for this ship and return to hunt mode
      this.currentTargets = []
      this.targetShipOrientation = null
      this.mode = 'hunt'
    } else if (result.result === MoveResult.MISS && this.mode === 'target') {
      // Remove similar targets if we missed
      if (this.targetShipOrientation) {
        this.currentTargets = this.currentTargets.filter(t => {
          if (this.targetShipOrientation === 'horizontal') {
            return t.y === result.coordinate.y
          } else {
            return t.x === result.coordinate.x
          }
        })
      }
    }
  }

  /**
   * Get available abilities from fleet
   */
  private getAvailableAbilities(): any[] {
    const abilities: any[] = []

    for (const ship of this.fleet) {
      if (!ship.damage.isSunk) {
        for (const ability of ship.abilities) {
          if (ability.isActive && ability.remainingUses > 0 && ability.currentCooldown === 0) {
            abilities.push({
              id: ability.id,
              name: ability.name,
              shipId: ship.id,
              cooldown: ability.cooldown,
              currentCooldown: ability.currentCooldown,
              uses: ability.uses,
              remainingUses: ability.remainingUses
            })
          }
        }
      }
    }

    return abilities
  }

  // =============================================
  // HELPER METHODS
  // =============================================

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

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }
}
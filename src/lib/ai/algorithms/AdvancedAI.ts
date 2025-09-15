/**
 * Advanced AI Implementation
 * Probability-based targeting with strategic ship placement and ability coordination
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
import { PowerupType, ShipClass } from '../../database/types/enums'
import {
  AIDecision,
  AIContext,
  BoardAnalysis,
  ThreatAssessment,
  DecisionReasoning,
  TargetOpportunity,
  DetectedPattern
} from '../types'

interface ProbabilityCell {
  coordinate: Coordinate
  probability: number
  canFitShips: number[]
}

interface ShipProbability {
  shipClass: ShipClass
  size: number
  remaining: number
  positions: Array<{
    start: Coordinate
    orientation: Orientation
    probability: number
  }>
}

export class AdvancedAI extends AIPlayer {
  private probabilityMap: number[][] = []
  private shipProbabilities: Map<ShipClass, ShipProbability> = new Map()
  private hitDensityMap: number[][] = []
  private opponentShotPattern: Coordinate[] = []
  private abilityComboChains: Map<string, string[]> = new Map()

  constructor(config: Omit<AIPlayerConfig, 'difficulty'>) {
    super({
      ...config,
      difficulty: 'advanced'
    })
    this.initializeProbabilityMaps()
    this.initializeAbilityChains()
  }

  /**
   * Initialize probability and density maps
   */
  private initializeProbabilityMaps(): void {
    const size = 10
    this.probabilityMap = Array(size).fill(null).map(() => Array(size).fill(0))
    this.hitDensityMap = Array(size).fill(null).map(() => Array(size).fill(0))

    // Initialize ship probabilities for standard fleet
    this.shipProbabilities.set(ShipClass.CARRIER, {
      shipClass: ShipClass.CARRIER,
      size: 5,
      remaining: 1,
      positions: []
    })
    this.shipProbabilities.set(ShipClass.BATTLESHIP, {
      shipClass: ShipClass.BATTLESHIP,
      size: 4,
      remaining: 1,
      positions: []
    })
    this.shipProbabilities.set(ShipClass.DESTROYER, {
      shipClass: ShipClass.DESTROYER,
      size: 3,
      remaining: 2,
      positions: []
    })
    this.shipProbabilities.set(ShipClass.SUBMARINE, {
      shipClass: ShipClass.SUBMARINE,
      size: 2,
      remaining: 1,
      positions: []
    })
  }

  /**
   * Initialize ability combination chains
   */
  private initializeAbilityChains(): void {
    // Define synergistic ability combinations
    this.abilityComboChains.set('sonar_barrage', ['SonarPing', 'Barrage'])
    this.abilityComboChains.set('scout_precision', ['AirScout', 'ArmorPiercing'])
    this.abilityComboChains.set('silent_ambush', ['SilentRunning', 'AllBigGuns'])
  }

  /**
   * Make a decision - Advanced probability-based strategy
   */
  async makeDecision(context: AIContext): Promise<AIDecision> {
    await this.simulateThinking()

    const board = context.gameState.players.find(p => p.id !== this.id)?.board
    if (!board) {
      throw new Error('Opponent board not found')
    }

    // Update probability maps
    this.updateProbabilityMap(board)
    this.analyzeOpponentPatterns(context)

    // Determine best action type
    const actionType = this.determineOptimalActionType(context)

    let action: GameAction
    let reasoning: DecisionReasoning

    switch (actionType) {
      case 'ability_combo':
        const combo = this.selectAbilityCombo(context)
        if (combo) {
          action = this.createAbilityAction(combo.ability, combo.target)
          reasoning = this.createAbilityReasoning(combo)
          break
        }
        // Fallthrough to normal attack if no combo available

      case 'powerup':
        const powerup = this.selectOptimalPowerup(context)
        if (powerup) {
          action = this.createPowerupAction(powerup.type, powerup.targets)
          reasoning = this.createPowerupReasoning(powerup)
          break
        }
        // Fallthrough to normal attack if no powerup available

      default:
        const target = this.selectTarget(board)
        action = {
          id: `action_${Date.now()}`,
          type: 'attack',
          playerId: this.id,
          timestamp: new Date(),
          data: {
            targetCoordinate: target,
            attackType: 'normal'
          }
        }
        reasoning = this.createAttackReasoning(target, board)
    }

    const confidence = this.calculateAdvancedConfidence(reasoning, context)

    const decision: AIDecision = {
      id: `decision_${Date.now()}`,
      turnNumber: context.turnNumber,
      type: actionType === 'ability_combo' ? 'ability_use' :
            actionType === 'powerup' ? 'powerup_use' : 'attack',
      action,
      confidence,
      reasoning,
      alternatives: this.generateAlternatives(context, board),
      timestamp: new Date()
    }

    this.decisionHistory.push(decision)
    return decision
  }

  /**
   * Determine optimal action type based on game state
   */
  private determineOptimalActionType(context: AIContext): 'attack' | 'ability_combo' | 'powerup' {
    // Check for ability combo opportunities
    if (this.hasAbilityComboAvailable() && Math.random() < 0.6) {
      return 'ability_combo'
    }

    // Check for powerup opportunities
    if (this.hasPowerupAvailable() && this.shouldUsePowerup(context)) {
      return 'powerup'
    }

    return 'attack'
  }

  /**
   * Update probability map based on current board state
   */
  private updateProbabilityMap(board: BoardState): void {
    // Reset probability map
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        this.probabilityMap[y][x] = 0
      }
    }

    // Calculate probabilities for each remaining ship
    for (const [shipClass, shipProb] of this.shipProbabilities) {
      if (shipProb.remaining > 0) {
        this.calculateShipPlacements(shipProb, board)
      }
    }

    // Update hit density map
    this.updateHitDensityMap(board)

    // Combine probability and density maps
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.cells[y][x].isHit) {
          this.probabilityMap[y][x] += this.hitDensityMap[y][x] * 0.3
        }
      }
    }
  }

  /**
   * Calculate possible ship placements
   */
  private calculateShipPlacements(shipProb: ShipProbability, board: BoardState): void {
    shipProb.positions = []

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        // Try horizontal placement
        if (this.canPlaceShip(x, y, shipProb.size, 'horizontal', board)) {
          const prob = this.calculatePlacementProbability(x, y, shipProb.size, 'horizontal', board)
          shipProb.positions.push({
            start: { x, y },
            orientation: 'horizontal',
            probability: prob
          })

          // Update probability map
          for (let i = 0; i < shipProb.size; i++) {
            this.probabilityMap[y][x + i] += prob * shipProb.remaining
          }
        }

        // Try vertical placement
        if (this.canPlaceShip(x, y, shipProb.size, 'vertical', board)) {
          const prob = this.calculatePlacementProbability(x, y, shipProb.size, 'vertical', board)
          shipProb.positions.push({
            start: { x, y },
            orientation: 'vertical',
            probability: prob
          })

          // Update probability map
          for (let i = 0; i < shipProb.size; i++) {
            this.probabilityMap[y + i][x] += prob * shipProb.remaining
          }
        }
      }
    }
  }

  /**
   * Check if ship can be placed at position
   */
  private canPlaceShip(x: number, y: number, size: number, orientation: Orientation, board: BoardState): boolean {
    for (let i = 0; i < size; i++) {
      const checkX = orientation === 'horizontal' ? x + i : x
      const checkY = orientation === 'vertical' ? y + i : y

      if (checkX >= board.width || checkY >= board.height) {
        return false
      }

      const cell = board.cells[checkY][checkX]
      if (cell.isHit && !cell.hasShip) {
        // It's a miss, ship can't be here
        return false
      }
    }

    return true
  }

  /**
   * Calculate probability for a specific ship placement
   */
  private calculatePlacementProbability(x: number, y: number, size: number, orientation: Orientation, board: BoardState): number {
    let probability = 1.0
    let hits = 0
    let unknowns = 0

    for (let i = 0; i < size; i++) {
      const checkX = orientation === 'horizontal' ? x + i : x
      const checkY = orientation === 'vertical' ? y + i : y

      const cell = board.cells[checkY][checkX]
      if (cell.isHit && cell.hasShip) {
        hits++
      } else if (!cell.isHit) {
        unknowns++
      }
    }

    // Higher probability if placement includes known hits
    if (hits > 0) {
      probability *= (1 + hits * 0.5)
    }

    // Adjust based on historical opponent placement patterns
    if (this.state.patterns.length > 0) {
      const edgeBonus = this.isNearEdge(x, y, board) ? 0.2 : 0
      probability += edgeBonus
    }

    return probability
  }

  /**
   * Update hit density map
   */
  private updateHitDensityMap(board: BoardState): void {
    // Decay existing density
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        this.hitDensityMap[y][x] *= 0.9
      }
    }

    // Increase density around hits
    for (const hit of this.state.memory.hits) {
      const { coordinate } = hit
      if (!this.isShipSunk(hit.shipId)) {
        // Increase density around unsunk ship hits
        const adjacent = this.getAdjacentCells(coordinate, board)
        adjacent.forEach(adj => {
          if (!board.cells[adj.y][adj.x].isHit) {
            this.hitDensityMap[adj.y][adj.x] += 2.0
          }
        })

        // Increase density along likely ship orientation
        const orientation = this.predictShipOrientation(hit.shipId)
        if (orientation) {
          this.increaseDensityAlongLine(coordinate, orientation, board)
        }
      }
    }
  }

  /**
   * Increase density along a line from a hit
   */
  private increaseDensityAlongLine(start: Coordinate, orientation: Orientation, board: BoardState): void {
    const directions = orientation === 'horizontal' ?
      [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }] :
      [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }]

    for (const dir of directions) {
      for (let i = 1; i <= 4; i++) {
        const x = start.x + dir.dx * i
        const y = start.y + dir.dy * i

        if (x >= 0 && x < board.width && y >= 0 && y < board.height) {
          if (!board.cells[y][x].isHit) {
            this.hitDensityMap[y][x] += (1.5 / i)
          } else {
            break // Stop if we hit an already targeted cell
          }
        }
      }
    }
  }

  /**
   * Predict ship orientation based on hits
   */
  private predictShipOrientation(shipId?: string): Orientation | null {
    if (!shipId) return null

    const ship = this.state.memory.confirmedShips.find(s => s.shipId === shipId)
    if (ship && ship.orientation) {
      return ship.orientation
    }

    // Try to infer from hit positions
    const shipHits = this.state.memory.hits.filter(h => h.shipId === shipId)
    if (shipHits.length >= 2) {
      const coords = shipHits.map(h => h.coordinate)
      if (coords.every(c => c.x === coords[0].x)) {
        return 'vertical'
      } else if (coords.every(c => c.y === coords[0].y)) {
        return 'horizontal'
      }
    }

    return null
  }

  /**
   * Select target based on probability map
   */
  selectTarget(board: BoardState): Coordinate {
    let maxProbability = -1
    let bestTargets: Coordinate[] = []

    // Find cells with highest probability
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.cells[y][x].isHit) {
          const prob = this.probabilityMap[y][x]
          if (prob > maxProbability) {
            maxProbability = prob
            bestTargets = [{ x, y }]
          } else if (prob === maxProbability) {
            bestTargets.push({ x, y })
          }
        }
      }
    }

    // If multiple best targets, choose based on additional criteria
    if (bestTargets.length > 1) {
      return this.selectFromBestTargets(bestTargets, board)
    }

    return bestTargets[0] || { x: 0, y: 0 }
  }

  /**
   * Select from multiple equally good targets
   */
  private selectFromBestTargets(targets: Coordinate[], board: BoardState): Coordinate {
    // Prefer targets that could reveal ship orientation
    const scoredTargets = targets.map(target => ({
      target,
      score: this.scoreTarget(target, board)
    }))

    scoredTargets.sort((a, b) => b.score - a.score)
    return scoredTargets[0].target
  }

  /**
   * Score a target based on strategic value
   */
  private scoreTarget(target: Coordinate, board: BoardState): number {
    let score = 0

    // Prefer targets that could reveal multiple ships
    const adjacent = this.getAdjacentCells(target, board)
    const adjacentHits = adjacent.filter(c =>
      board.cells[c.y][c.x].isHit && board.cells[c.y][c.x].hasShip
    ).length
    score += adjacentHits * 2

    // Prefer targets that complete patterns
    if (this.completesPattern(target)) {
      score += 3
    }

    // Prefer targets away from opponent's defensive zones
    if (!this.isInOpponentDefensiveZone(target)) {
      score += 1
    }

    return score
  }

  /**
   * Check if target completes a known pattern
   */
  private completesPattern(target: Coordinate): boolean {
    // Check if this target would complete a line of hits
    const hits = this.state.memory.hits.map(h => h.coordinate)

    // Check horizontal completion
    const sameRow = hits.filter(h => h.y === target.y)
    if (sameRow.length >= 2) {
      const sortedX = sameRow.map(h => h.x).sort((a, b) => a - b)
      if (target.x === sortedX[0] - 1 || target.x === sortedX[sortedX.length - 1] + 1) {
        return true
      }
    }

    // Check vertical completion
    const sameCol = hits.filter(h => h.x === target.x)
    if (sameCol.length >= 2) {
      const sortedY = sameCol.map(h => h.y).sort((a, b) => a - b)
      if (target.y === sortedY[0] - 1 || target.y === sortedY[sortedY.length - 1] + 1) {
        return true
      }
    }

    return false
  }

  /**
   * Place fleet with defensive positioning
   */
  placeFleet(ships: GameShip[]): ShipPosition[] {
    const positions: ShipPosition[] = []
    const occupiedCells = new Set<string>()

    // Analyze opponent's historical targeting patterns
    const hotZones = this.analyzeOpponentTargetingPatterns()

    // Sort ships for strategic placement
    const sortedShips = this.sortShipsForPlacement(ships)

    for (const ship of sortedShips) {
      const position = this.findStrategicPlacement(ship, occupiedCells, hotZones)
      if (position) {
        positions.push(position)
        position.coordinates.forEach(coord => {
          occupiedCells.add(`${coord.x},${coord.y}`)
        })
      }
    }

    return positions
  }

  /**
   * Sort ships for strategic placement order
   */
  private sortShipsForPlacement(ships: GameShip[]): GameShip[] {
    return [...ships].sort((a, b) => {
      // Place high-value ships in safer positions first
      const valueA = this.getShipStrategicValue(a)
      const valueB = this.getShipStrategicValue(b)
      return valueB - valueA
    })
  }

  /**
   * Get strategic value of a ship
   */
  private getShipStrategicValue(ship: GameShip): number {
    let value = ship.size // Base value is size

    // Add value for abilities
    value += ship.abilities.length * 2

    // Carriers and battleships are high value
    if (ship.class === ShipClass.CARRIER || ship.class === ShipClass.BATTLESHIP) {
      value += 5
    }

    return value
  }

  /**
   * Find strategic placement for a ship
   */
  private findStrategicPlacement(
    ship: GameShip,
    occupied: Set<string>,
    hotZones: number[][]
  ): ShipPosition | null {
    const candidates: Array<{
      position: ShipPosition
      score: number
    }> = []

    // Generate candidate positions
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
          const position = this.tryPlaceShip(ship, { x, y }, orientation, occupied)
          if (position) {
            const score = this.scorePlacement(position, hotZones, ship)
            candidates.push({ position, score })
          }
        }
      }
    }

    // Select best placement
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score)
      // Add some randomness to avoid being too predictable
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length))
      return topCandidates[Math.floor(Math.random() * topCandidates.length)].position
    }

    return null
  }

  /**
   * Try to place ship at position
   */
  private tryPlaceShip(
    ship: GameShip,
    start: Coordinate,
    orientation: Orientation,
    occupied: Set<string>
  ): ShipPosition | null {
    const coordinates: Coordinate[] = []

    for (let i = 0; i < ship.size; i++) {
      const x = orientation === 'horizontal' ? start.x + i : start.x
      const y = orientation === 'vertical' ? start.y + i : start.y

      if (x >= this.board.width || y >= this.board.height) {
        return null
      }

      if (occupied.has(`${x},${y}`)) {
        return null
      }

      coordinates.push({ x, y })
    }

    return {
      shipId: ship.id,
      coordinates,
      orientation,
      startPosition: start
    }
  }

  /**
   * Score a ship placement
   */
  private scorePlacement(position: ShipPosition, hotZones: number[][], ship: GameShip): number {
    let score = 100

    // Penalize placement in hot zones
    for (const coord of position.coordinates) {
      score -= hotZones[coord.y][coord.x] * 10
    }

    // Bonus for edge placement (harder to surround)
    const edgeCount = position.coordinates.filter(c =>
      c.x === 0 || c.x === this.board.width - 1 ||
      c.y === 0 || c.y === this.board.height - 1
    ).length
    score += edgeCount * 3

    // Bonus for corner placement for small ships
    if (ship.size <= 3) {
      const cornerCount = position.coordinates.filter(c =>
        (c.x === 0 || c.x === this.board.width - 1) &&
        (c.y === 0 || c.y === this.board.height - 1)
      ).length
      score += cornerCount * 5
    }

    // Penalty for clustering (makes ships easier to find)
    const adjacentOccupied = position.coordinates.filter(c => {
      const adjacent = this.getAdjacentCells(c, this.board)
      return adjacent.some(adj => this.board.cells[adj.y][adj.x].hasShip)
    }).length
    score -= adjacentOccupied * 2

    return score
  }

  /**
   * Analyze opponent's targeting patterns
   */
  private analyzeOpponentTargetingPatterns(): number[][] {
    const heatMap = Array(this.board.height).fill(null).map(() =>
      Array(this.board.width).fill(0)
    )

    // Analyze historical games if available
    if (this.state.patterns.length > 0) {
      for (const pattern of this.state.patterns) {
        if (pattern.type === 'targeting_sequence') {
          const examples = pattern.pattern.examples as Coordinate[]
          examples.forEach(coord => {
            if (coord.y < heatMap.length && coord.x < heatMap[0].length) {
              heatMap[coord.y][coord.x] += pattern.confidence
            }
          })
        }
      }
    }

    // Default patterns if no history
    if (this.state.patterns.length === 0) {
      // Most players target center initially
      const centerY = Math.floor(this.board.height / 2)
      const centerX = Math.floor(this.board.width / 2)
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const y = centerY + dy
          const x = centerX + dx
          if (y >= 0 && y < heatMap.length && x >= 0 && x < heatMap[0].length) {
            heatMap[y][x] += 0.5 / (Math.abs(dy) + Math.abs(dx) + 1)
          }
        }
      }
    }

    return heatMap
  }

  /**
   * Analyze opponent patterns from game history
   */
  private analyzeOpponentPatterns(context: AIContext): void {
    const opponentActions = context.gameState.turns
      .filter(turn => turn.playerId !== this.id)
      .flatMap(turn => turn.actions)

    // Track shot patterns
    const attacks = opponentActions.filter(a => a.type === 'attack')
    if (attacks.length > 5) {
      const recentAttacks = attacks.slice(-10)
      const coordinates = recentAttacks.map(a => (a.data as any).targetCoordinate as Coordinate)

      // Detect patterns
      const pattern = this.detectOpponentPattern(coordinates)
      if (pattern) {
        this.storePattern(pattern)
      }
    }
  }

  /**
   * Detect patterns in opponent's moves
   */
  private detectOpponentPattern(coordinates: Coordinate[]): DetectedPattern | null {
    // Check for diagonal patterns
    if (this.isDiagonalPattern(coordinates)) {
      return {
        id: `pattern_diagonal_${Date.now()}`,
        type: 'targeting_sequence',
        pattern: {
          description: 'Diagonal targeting pattern',
          parameters: { type: 'diagonal' },
          examples: coordinates
        },
        confidence: 0.7,
        occurrences: 1,
        lastDetected: new Date()
      }
    }

    // Check for spiral patterns
    if (this.isSpiralPattern(coordinates)) {
      return {
        id: `pattern_spiral_${Date.now()}`,
        type: 'targeting_sequence',
        pattern: {
          description: 'Spiral targeting pattern',
          parameters: { type: 'spiral' },
          examples: coordinates
        },
        confidence: 0.6,
        occurrences: 1,
        lastDetected: new Date()
      }
    }

    return null
  }

  /**
   * Check for diagonal pattern
   */
  private isDiagonalPattern(coordinates: Coordinate[]): boolean {
    if (coordinates.length < 3) return false

    let diagonalCount = 0
    for (let i = 1; i < coordinates.length; i++) {
      const dx = Math.abs(coordinates[i].x - coordinates[i - 1].x)
      const dy = Math.abs(coordinates[i].y - coordinates[i - 1].y)
      if (dx === dy && dx === 1) {
        diagonalCount++
      }
    }

    return diagonalCount >= coordinates.length * 0.6
  }

  /**
   * Check for spiral pattern
   */
  private isSpiralPattern(coordinates: Coordinate[]): boolean {
    if (coordinates.length < 4) return false

    // Check if coordinates form an expanding pattern from center
    const centerX = this.board.width / 2
    const centerY = this.board.height / 2

    const distances = coordinates.map(c =>
      Math.sqrt(Math.pow(c.x - centerX, 2) + Math.pow(c.y - centerY, 2))
    )

    // Check if distances are increasing
    let increasing = 0
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] > distances[i - 1]) {
        increasing++
      }
    }

    return increasing >= distances.length * 0.6
  }

  /**
   * Select ability combination
   */
  private selectAbilityCombo(context: AIContext): { ability: any; target: Coordinate } | null {
    const availableAbilities = this.getAvailableAbilities()
    if (availableAbilities.length === 0) return null

    // Check for combo opportunities
    for (const [comboName, abilityNames] of this.abilityComboChains) {
      const comboAbilities = availableAbilities.filter(a =>
        abilityNames.includes(a.name)
      )

      if (comboAbilities.length > 0) {
        // Select best target for combo
        const target = this.selectTarget(context.gameState.players[0].board)
        return {
          ability: comboAbilities[0],
          target
        }
      }
    }

    return null
  }

  /**
   * Select optimal powerup
   */
  private selectOptimalPowerup(context: AIContext): { type: PowerupType; targets: Coordinate[] } | null {
    const available = this.powerups.filter(p =>
      p.remainingUses > 0 && p.currentCooldown === 0
    )

    if (available.length === 0) return null

    // Prioritize based on game state
    const confirmedShips = this.state.memory.confirmedShips.length
    const accuracy = this.stats.accuracy

    if (available.some(p => p.type === PowerupType.BARRAGE) && confirmedShips >= 2) {
      // Use barrage when multiple ships are confirmed
      const targets = this.selectBarrageTargets()
      return { type: PowerupType.BARRAGE, targets }
    }

    if (available.some(p => p.type === PowerupType.SONAR_PING) && accuracy < 40) {
      // Use sonar when accuracy is low
      const targets = this.selectSonarTargets()
      return { type: PowerupType.SONAR_PING, targets }
    }

    if (available.some(p => p.type === PowerupType.RADAR_SCAN)) {
      // Use radar scan strategically
      const targets = this.selectRadarTargets()
      return { type: PowerupType.RADAR_SCAN, targets }
    }

    return null
  }

  /**
   * Select ability - Strategic coordination
   */
  selectAbility(available: any[]): any | null {
    if (available.length === 0) return null

    // Score each ability based on current situation
    const scored = available.map(ability => ({
      ability,
      score: this.scoreAbility(ability)
    }))

    scored.sort((a, b) => b.score - a.score)

    // Use best ability if score is high enough
    if (scored[0].score > 0.6) {
      return scored[0].ability
    }

    return null
  }

  /**
   * Score an ability
   */
  private scoreAbility(ability: any): number {
    let score = 0.5

    // Score based on game phase
    const fleetStatus = this.getFleetStatus()
    if (fleetStatus.healthPercentage < 50) {
      // Defensive abilities score higher when damaged
      if (ability.name === 'SilentRunning' || ability.name === 'SpeedAdvantage') {
        score += 0.3
      }
    } else {
      // Offensive abilities score higher when healthy
      if (ability.name === 'AllBigGuns' || ability.name === 'ArmorPiercing') {
        score += 0.3
      }
    }

    // Score based on current targets
    const highValueTargets = this.state.boardAnalysis.highValueTargets
    if (highValueTargets.length > 0) {
      if (ability.name === 'SonarPing' || ability.name === 'AirScout') {
        score += 0.2
      }
    }

    return Math.min(1, score)
  }

  /**
   * Select powerup - Strategic usage
   */
  selectPowerup(available: PowerupType[]): PowerupType | null {
    if (available.length === 0) return null

    // Strategic powerup selection based on game state
    const accuracy = this.stats.accuracy
    const confirmedShips = this.state.memory.confirmedShips.length

    if (accuracy < 30 && available.includes(PowerupType.SONAR_PING)) {
      return PowerupType.SONAR_PING
    }

    if (confirmedShips >= 2 && available.includes(PowerupType.BARRAGE)) {
      return PowerupType.BARRAGE
    }

    if (this.state.boardAnalysis.highValueTargets.length > 3 &&
        available.includes(PowerupType.RADAR_SCAN)) {
      return PowerupType.RADAR_SCAN
    }

    // 50% chance to use any available powerup
    if (Math.random() < 0.5) {
      return available[Math.floor(Math.random() * available.length)]
    }

    return null
  }

  /**
   * Analyze board - Advanced probability analysis
   */
  analyzeBoard(board: BoardState): BoardAnalysis {
    const analysis = super.analyzeBoard(board)

    // Use probability map for analysis
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        analysis.probabilityGrid[y][x] = this.probabilityMap[y][x]
      }
    }

    // Identify high-value targets
    analysis.highValueTargets = []
    const threshold = this.getAdaptiveProbabilityThreshold()

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (this.probabilityMap[y][x] > threshold && !board.cells[y][x].isHit) {
          analysis.highValueTargets.push({ x, y })
        }
      }
    }

    // Sort by probability
    analysis.highValueTargets.sort((a, b) =>
      this.probabilityMap[b.y][b.x] - this.probabilityMap[a.y][a.x]
    )

    // Identify danger zones (areas opponent is likely targeting)
    analysis.dangerZones = this.identifyDangerZones()

    return analysis
  }

  /**
   * Get adaptive probability threshold
   */
  private getAdaptiveProbabilityThreshold(): number {
    // Adjust threshold based on game progress
    const totalCells = this.board.width * this.board.height
    const shotsFired = this.state.memory.shotsFired.length
    const progress = shotsFired / totalCells

    // Lower threshold as game progresses
    return 0.7 - (progress * 0.3)
  }

  /**
   * Identify danger zones
   */
  private identifyDangerZones(): Coordinate[] {
    const dangerZones: Coordinate[] = []

    // Analyze opponent's recent shots
    const recentShots = this.opponentShotPattern.slice(-10)
    if (recentShots.length >= 3) {
      // Predict next likely targets
      const predicted = this.predictNextTargets(recentShots)
      dangerZones.push(...predicted)
    }

    return dangerZones
  }

  /**
   * Predict opponent's next targets
   */
  private predictNextTargets(recentShots: Coordinate[]): Coordinate[] {
    const predictions: Coordinate[] = []

    // Simple linear prediction
    if (recentShots.length >= 2) {
      const last = recentShots[recentShots.length - 1]
      const secondLast = recentShots[recentShots.length - 2]

      const dx = last.x - secondLast.x
      const dy = last.y - secondLast.y

      const next = {
        x: last.x + dx,
        y: last.y + dy
      }

      if (next.x >= 0 && next.x < this.board.width &&
          next.y >= 0 && next.y < this.board.height) {
        predictions.push(next)
      }
    }

    return predictions
  }

  /**
   * Assess threats - Advanced threat assessment
   */
  assessThreats(context: AIContext): ThreatAssessment {
    const assessment = super.assessThreats(context)

    // Analyze immediate threats
    const damagedShips = this.fleet.filter(s =>
      !s.damage.isSunk && s.damage.totalHits > 0
    )

    for (const ship of damagedShips) {
      const threatLevel = this.calculateShipThreatLevel(ship)
      if (threatLevel > 0.5) {
        assessment.immediateThreats.push({
          source: 'opponent_targeting',
          type: 'attack',
          severity: threatLevel,
          targetedShips: [ship.id],
          estimatedDamage: ship.size - ship.hitPoints
        })
      }
    }

    // Update overall threat level
    assessment.threatLevel = this.calculateOverallThreatLevel(assessment)

    return assessment
  }

  /**
   * Calculate threat level for a specific ship
   */
  private calculateShipThreatLevel(ship: GameShip): number {
    const healthPercent = ship.hitPoints / ship.maxHitPoints
    const isHighValue = ship.class === ShipClass.CARRIER || ship.class === ShipClass.BATTLESHIP

    let threatLevel = 1 - healthPercent

    if (isHighValue) {
      threatLevel *= 1.5
    }

    // Higher threat if ship has valuable abilities
    if (ship.abilities.some(a => a.remainingUses > 0)) {
      threatLevel *= 1.2
    }

    return Math.min(1, threatLevel)
  }

  /**
   * Calculate overall threat level
   */
  private calculateOverallThreatLevel(assessment: ThreatAssessment): number {
    let totalThreat = 0

    for (const threat of assessment.immediateThreats) {
      totalThreat += threat.severity
    }

    for (const threat of assessment.potentialThreats) {
      totalThreat += threat.severity * 0.5
    }

    const fleetStatus = this.getFleetStatus()
    const healthFactor = 1 - (fleetStatus.healthPercentage / 100)

    return Math.min(1, (totalThreat + healthFactor) / 2)
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
        adjacent.push({ x, y })
      }
    }

    return adjacent
  }

  private isShipSunk(shipId?: string): boolean {
    if (!shipId) return false
    return this.state.memory.sunkenShips.some(s => s.shipId === shipId)
  }

  private isNearEdge(x: number, y: number, board: BoardState): boolean {
    return x === 0 || x === board.width - 1 || y === 0 || y === board.height - 1
  }

  private isInOpponentDefensiveZone(target: Coordinate): boolean {
    // Check if target is in a zone opponent is likely defending
    return this.state.boardAnalysis.dangerZones.some(zone =>
      zone.x === target.x && zone.y === target.y
    )
  }

  private hasAbilityComboAvailable(): boolean {
    const available = this.getAvailableAbilities()
    for (const [, abilityNames] of this.abilityComboChains) {
      if (abilityNames.some(name => available.some(a => a.name === name))) {
        return true
      }
    }
    return false
  }

  private hasPowerupAvailable(): boolean {
    return this.powerups.some(p => p.remainingUses > 0 && p.currentCooldown === 0)
  }

  private shouldUsePowerup(context: AIContext): boolean {
    // Strategic decision on powerup usage
    const gameProgress = context.turnNumber / 50 // Assume average 50 turns
    const fleetHealth = this.getFleetStatus().healthPercentage / 100

    // More likely to use powerups in mid-game or when losing
    return (gameProgress > 0.3 && gameProgress < 0.8) || fleetHealth < 0.5
  }

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

  private selectBarrageTargets(): Coordinate[] {
    // Select 3x3 area with highest probability
    let bestArea: Coordinate[] = []
    let bestScore = -1

    for (let y = 0; y <= this.board.height - 3; y++) {
      for (let x = 0; x <= this.board.width - 3; x++) {
        const area: Coordinate[] = []
        let score = 0

        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            const coord = { x: x + dx, y: y + dy }
            area.push(coord)
            score += this.probabilityMap[coord.y][coord.x]
          }
        }

        if (score > bestScore) {
          bestScore = score
          bestArea = area
        }
      }
    }

    return bestArea
  }

  private selectSonarTargets(): Coordinate[] {
    // Select high-probability cells for sonar
    const targets: Coordinate[] = []
    const sorted: Array<{ coord: Coordinate; prob: number }> = []

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        if (!this.board.cells[y][x].isHit) {
          sorted.push({
            coord: { x, y },
            prob: this.probabilityMap[y][x]
          })
        }
      }
    }

    sorted.sort((a, b) => b.prob - a.prob)
    return sorted.slice(0, 5).map(s => s.coord)
  }

  private selectRadarTargets(): Coordinate[] {
    // Select 2x2 area with highest probability
    let bestArea: Coordinate[] = []
    let bestScore = -1

    for (let y = 0; y <= this.board.height - 2; y++) {
      for (let x = 0; x <= this.board.width - 2; x++) {
        const area: Coordinate[] = []
        let score = 0

        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const coord = { x: x + dx, y: y + dy }
            area.push(coord)
            score += this.probabilityMap[coord.y][coord.x]
          }
        }

        if (score > bestScore) {
          bestScore = score
          bestArea = area
        }
      }
    }

    return bestArea
  }

  private createAbilityAction(ability: any, target: Coordinate): GameAction {
    return {
      id: `action_${Date.now()}`,
      type: 'attack',
      playerId: this.id,
      timestamp: new Date(),
      data: {
        targetCoordinate: target,
        attackType: 'special',
        abilityId: ability.id
      }
    }
  }

  private createPowerupAction(type: PowerupType, targets: Coordinate[]): GameAction {
    return {
      id: `action_${Date.now()}`,
      type: 'use_powerup',
      playerId: this.id,
      timestamp: new Date(),
      data: {
        powerupType: type,
        targetArea: targets
      }
    }
  }

  private createAbilityReasoning(combo: { ability: any; target: Coordinate }): DecisionReasoning {
    return {
      primaryFactors: [
        `Using ability combo: ${combo.ability.name}`,
        'High-value target identified',
        'Ability synergy detected'
      ],
      riskAssessment: 0.2,
      expectedOutcome: 'High damage potential with ability combo',
      confidenceFactors: ['Ability combination analysis', 'Target probability assessment']
    }
  }

  private createPowerupReasoning(powerup: { type: PowerupType; targets: Coordinate[] }): DecisionReasoning {
    return {
      primaryFactors: [
        `Using powerup: ${powerup.type}`,
        `Targeting ${powerup.targets.length} cells`,
        'Strategic advantage identified'
      ],
      riskAssessment: 0.3,
      expectedOutcome: 'Information gathering or area damage',
      confidenceFactors: ['Powerup timing analysis', 'Target area optimization']
    }
  }

  private createAttackReasoning(target: Coordinate, board: BoardState): DecisionReasoning {
    const probability = this.probabilityMap[target.y][target.x]
    return {
      primaryFactors: [
        `Target probability: ${(probability * 100).toFixed(1)}%`,
        'Probability-based targeting',
        'Pattern analysis applied'
      ],
      riskAssessment: 1 - probability,
      expectedOutcome: probability > 0.5 ? 'Likely hit' : 'Exploration shot',
      confidenceFactors: [
        'Probability map analysis',
        'Hit density calculation',
        'Ship placement analysis'
      ]
    }
  }

  private calculateAdvancedConfidence(reasoning: DecisionReasoning, context: AIContext): number {
    let confidence = 0.7 // Base confidence for advanced AI

    // Adjust based on game phase
    const gameProgress = context.turnNumber / 50
    if (gameProgress < 0.2) {
      confidence *= 0.9 // Early game uncertainty
    } else if (gameProgress > 0.7) {
      confidence *= 1.1 // Late game precision
    }

    // Adjust based on performance
    if (this.stats.accuracy > 50) {
      confidence *= 1.1
    }

    // Adjust based on risk
    confidence *= (1 - reasoning.riskAssessment * 0.3)

    return Math.max(0.5, Math.min(0.95, confidence))
  }

  private generateAlternatives(context: AIContext, board: BoardState): any[] {
    const alternatives: any[] = []

    // Get top 3 probability targets
    const topTargets: Array<{ coord: Coordinate; prob: number }> = []

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (!board.cells[y][x].isHit) {
          topTargets.push({
            coord: { x, y },
            prob: this.probabilityMap[y][x]
          })
        }
      }
    }

    topTargets.sort((a, b) => b.prob - a.prob)

    for (let i = 1; i < Math.min(4, topTargets.length); i++) {
      alternatives.push({
        action: {
          id: `alt_${i}`,
          type: 'attack',
          playerId: this.id,
          timestamp: new Date(),
          data: {
            targetCoordinate: topTargets[i].coord,
            attackType: 'normal'
          }
        },
        score: topTargets[i].prob,
        reasoning: `Alternative target with ${(topTargets[i].prob * 100).toFixed(1)}% probability`
      })
    }

    return alternatives
  }
}
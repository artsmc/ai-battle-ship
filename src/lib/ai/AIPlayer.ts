/**
 * Abstract AI Player Base Class
 * Foundation for all AI player implementations
 */

import { Player, PlayerConfig } from '../game/Player'
import {
  Coordinate,
  GameShip,
  ShipPosition,
  BoardState,
  AttackResult,
  GameAction,
  ValidationResult,
  AILevel
} from '../game/types'
import { PowerupType } from '../database/types/enums'
import {
  AIPlayerInterface,
  AIState,
  AIMemory,
  AIDecision,
  AIContext,
  DifficultyLevel,
  BehaviorTraits,
  BoardAnalysis,
  ThreatAssessment,
  OpponentModel,
  PerformanceMetrics,
  DetectedPattern,
  DecisionReasoning,
  HitMemory,
  ConfirmedShip,
  SuspectedShip,
  SunkenShip,
  PatternMemory,
  TendencyMemory
} from './types'

export abstract class AIPlayer extends Player implements AIPlayerInterface {
  // AI-specific properties
  public readonly difficulty: DifficultyLevel
  public behavior: BehaviorTraits
  public state: AIState

  // Performance tracking
  protected performanceMetrics: PerformanceMetrics
  protected decisionHistory: AIDecision[]
  protected learningEnabled: boolean

  constructor(config: AIPlayerConfig) {
    // Initialize as AI player
    const playerConfig: PlayerConfig = {
      ...config,
      isAI: true,
      aiDifficulty: mapDifficultyToAILevel(config.difficulty),
      name: config.name || `AI_${config.difficulty}`
    }

    super(playerConfig)

    // Initialize AI-specific properties
    this.difficulty = config.difficulty
    this.behavior = config.behavior || this.getDefaultBehavior()
    this.state = this.initializeAIState()
    this.performanceMetrics = this.initializePerformanceMetrics()
    this.decisionHistory = []
    this.learningEnabled = config.learningEnabled ?? true
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  protected initializeAIState(): AIState {
    return {
      memory: this.initializeMemory(),
      boardAnalysis: this.initializeBoardAnalysis(),
      threatAssessment: {
        immediateThreats: [],
        potentialThreats: [],
        threatLevel: 0,
        criticalShips: []
      },
      opportunityMap: {
        highValueTargets: [],
        vulnerableShips: [],
        abilityOpportunities: [],
        powerupOpportunities: []
      },
      previousDecisions: [],
      performanceMetrics: this.initializePerformanceMetrics(),
      patterns: [],
      opponentModel: this.initializeOpponentModel()
    }
  }

  protected initializeMemory(): AIMemory {
    return {
      shotsFired: [],
      hits: [],
      misses: [],
      confirmedShips: [],
      suspectedShips: [],
      sunkenShips: [],
      detectedPatterns: [],
      opponentTendencies: []
    }
  }

  protected initializeBoardAnalysis(): BoardAnalysis {
    const gridSize = 10 // Standard board size
    return {
      heatMap: Array(gridSize).fill(null).map(() => Array(gridSize).fill(0)),
      probabilityGrid: Array(gridSize).fill(null).map(() => Array(gridSize).fill(0)),
      dangerZones: [],
      safeZones: [],
      highValueTargets: []
    }
  }

  protected initializeOpponentModel(): OpponentModel {
    return {
      playerId: '',
      estimatedSkillLevel: 0.5,
      consistencyRating: 0.5,
      adaptabilityRating: 0.5,
      observedBehavior: 'balanced',
      preferredStrategies: [],
      weaknesses: [],
      strengths: [],
      placementPatterns: [],
      targetingPatterns: [],
      abilityUsagePatterns: []
    }
  }

  protected initializePerformanceMetrics(): PerformanceMetrics {
    return {
      winRate: 0,
      averageGameLength: 0,
      averageAccuracy: 0,
      optimalDecisionRate: 0,
      blunderRate: 0,
      averageConfidence: 0,
      averageThinkingTime: 0,
      decisionsPerTurn: 1,
      memoryEfficiency: 1,
      patternRecognitionRate: 0,
      adaptationSpeed: 0,
      predictionAccuracy: 0,
      difficultyMetrics: new Map()
    }
  }

  protected getDefaultBehavior(): BehaviorTraits {
    // Default behavior based on difficulty
    switch (this.difficulty) {
      case 'beginner':
        return {
          profile: 'balanced',
          aggression: 0.3,
          caution: 0.7,
          adaptability: 0.2,
          persistence: 0.4,
          creativity: 0.1,
          preferredTargetPriority: ['largest_ship', 'center_cells'],
          preferredPlacementStrategy: 'random',
          abilityUsageFrequency: 0.2,
          powerupConservation: 0.8
        }
      case 'intermediate':
        return {
          profile: 'balanced',
          aggression: 0.5,
          caution: 0.5,
          adaptability: 0.5,
          persistence: 0.6,
          creativity: 0.3,
          preferredTargetPriority: ['damaged_ship', 'high_value'],
          preferredPlacementStrategy: 'distributed',
          abilityUsageFrequency: 0.4,
          powerupConservation: 0.6
        }
      case 'advanced':
        return {
          profile: 'aggressive',
          aggression: 0.7,
          caution: 0.4,
          adaptability: 0.7,
          persistence: 0.8,
          creativity: 0.6,
          preferredTargetPriority: ['damaged_ship', 'clustered_area', 'high_value'],
          preferredPlacementStrategy: 'defensive',
          abilityUsageFrequency: 0.6,
          powerupConservation: 0.4
        }
      case 'expert':
        return {
          profile: 'unpredictable',
          aggression: 0.6,
          caution: 0.6,
          adaptability: 0.9,
          persistence: 0.9,
          creativity: 0.8,
          preferredTargetPriority: ['damaged_ship', 'high_value', 'clustered_area'],
          preferredPlacementStrategy: 'defensive',
          abilityUsageFrequency: 0.8,
          powerupConservation: 0.3
        }
    }
  }

  // =============================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // =============================================

  /**
   * Core decision-making method
   */
  abstract makeDecision(context: AIContext): Promise<AIDecision>

  /**
   * Select the next target coordinate
   */
  abstract selectTarget(board: BoardState): Coordinate

  /**
   * Place ships on the board
   */
  abstract placeFleet(ships: GameShip[]): ShipPosition[]

  /**
   * Select which ability to use
   */
  abstract selectAbility(available: any[]): any | null

  /**
   * Select which powerup to use
   */
  abstract selectPowerup(available: PowerupType[]): PowerupType | null

  /**
   * Analyze the current board state
   */
  abstract analyzeBoard(board: BoardState): BoardAnalysis

  /**
   * Assess current threats
   */
  abstract assessThreats(context: AIContext): ThreatAssessment

  // =============================================
  // STATE MANAGEMENT
  // =============================================

  /**
   * Update AI memory with attack result
   */
  updateMemory(result: AttackResult): void {
    const { coordinate, result: moveResult, shipHit, shipSunk, shipType } = result

    // Record the shot
    this.state.memory.shotsFired.push(coordinate)

    if (moveResult === 'HIT' || moveResult === 'SUNK') {
      // Record hit
      const hitMemory: HitMemory = {
        coordinate,
        turnNumber: this.state.previousDecisions.length,
        shipId: shipHit,
        followUpShots: []
      }
      this.state.memory.hits.push(hitMemory)

      // Update confirmed ships
      if (shipHit) {
        this.updateConfirmedShip(shipHit, coordinate)
      }

      // Handle sunk ship
      if (shipSunk && shipHit && shipType) {
        this.recordSunkenShip(shipHit, shipType)
      }
    } else {
      // Record miss
      this.state.memory.misses.push(coordinate)
    }

    // Update board analysis
    this.updateHeatMap(coordinate, moveResult === 'HIT' || moveResult === 'SUNK')
  }

  protected updateConfirmedShip(shipId: string, coordinate: Coordinate): void {
    let ship = this.state.memory.confirmedShips.find(s => s.shipId === shipId)

    if (!ship) {
      ship = {
        shipId,
        knownPositions: [coordinate],
        remainingHealth: undefined,
        orientation: undefined
      }
      this.state.memory.confirmedShips.push(ship)
    } else {
      ship.knownPositions.push(coordinate)

      // Try to determine orientation
      if (ship.knownPositions.length >= 2) {
        const [first, second] = ship.knownPositions
        ship.orientation = first.x === second.x ? 'vertical' : 'horizontal'
      }
    }
  }

  protected recordSunkenShip(shipId: string, shipClass: string): void {
    const confirmedShip = this.state.memory.confirmedShips.find(s => s.shipId === shipId)

    if (confirmedShip) {
      const sunkenShip: SunkenShip = {
        shipId,
        shipClass: shipClass as any, // Will be properly typed
        positions: confirmedShip.knownPositions,
        sunkAtTurn: this.state.previousDecisions.length
      }

      this.state.memory.sunkenShips.push(sunkenShip)

      // Remove from confirmed ships
      this.state.memory.confirmedShips = this.state.memory.confirmedShips.filter(
        s => s.shipId !== shipId
      )
    }
  }

  protected updateHeatMap(coordinate: Coordinate, isHit: boolean): void {
    const { heatMap } = this.state.boardAnalysis
    const value = isHit ? 1 : -0.5

    // Update heat map with decay
    for (let y = 0; y < heatMap.length; y++) {
      for (let x = 0; x < heatMap[y].length; x++) {
        const distance = Math.abs(x - coordinate.x) + Math.abs(y - coordinate.y)
        const influence = value / (1 + distance * 0.5)
        heatMap[y][x] = Math.max(-1, Math.min(1, heatMap[y][x] + influence))
      }
    }
  }

  // =============================================
  // OPPONENT MODELING
  // =============================================

  /**
   * Build a model of the opponent's behavior
   */
  modelOpponent(history: GameAction[]): OpponentModel {
    const model = this.state.opponentModel

    // Analyze action patterns
    const attackActions = history.filter(a => a.type === 'attack')
    const placementActions = history.filter(a => a.type === 'place_ship')

    // Update skill estimation based on accuracy
    const hits = attackActions.filter(a => {
      const data = a.data as any
      return data.result === 'HIT' || data.result === 'SUNK'
    })

    if (attackActions.length > 0) {
      model.estimatedSkillLevel = hits.length / attackActions.length
    }

    // Detect patterns (simplified for now)
    this.detectOpponentPatterns(history, model)

    return model
  }

  protected detectOpponentPatterns(history: GameAction[], model: OpponentModel): void {
    // This is a simplified pattern detection
    // Real implementation would be more sophisticated

    // Analyze targeting patterns
    const recentAttacks = history
      .filter(a => a.type === 'attack')
      .slice(-10)

    if (recentAttacks.length >= 5) {
      // Check for systematic patterns
      const coordinates = recentAttacks.map(a => (a.data as any).targetCoordinate)

      // Check for diagonal patterns
      const isDiagonal = this.checkDiagonalPattern(coordinates)
      if (isDiagonal) {
        model.targetingPatterns.push({
          pattern: 'diagonal',
          frequency: 0.8,
          effectiveness: 0.5
        })
      }
    }
  }

  protected checkDiagonalPattern(coordinates: Coordinate[]): boolean {
    if (coordinates.length < 3) return false

    // Check if coordinates form a diagonal
    for (let i = 2; i < coordinates.length; i++) {
      const dx1 = coordinates[i-1].x - coordinates[i-2].x
      const dy1 = coordinates[i-1].y - coordinates[i-2].y
      const dx2 = coordinates[i].x - coordinates[i-1].x
      const dy2 = coordinates[i].y - coordinates[i-1].y

      if (Math.abs(dx1) === Math.abs(dy1) && Math.abs(dx2) === Math.abs(dy2)) {
        return true
      }
    }

    return false
  }

  // =============================================
  // LEARNING AND ADAPTATION
  // =============================================

  /**
   * Learn from completed game
   */
  learnFromGame(gameHistory: GameAction[]): void {
    if (!this.learningEnabled) return

    // Analyze decision quality
    const decisions = this.decisionHistory
    let correctDecisions = 0
    const totalDecisions = decisions.length

    decisions.forEach(decision => {
      // Evaluate if decision was good based on outcome
      const wasGood = this.evaluateDecisionQuality(decision, gameHistory)
      if (wasGood > 0.6) correctDecisions++
    })

    // Update performance metrics
    if (totalDecisions > 0) {
      this.performanceMetrics.optimalDecisionRate = correctDecisions / totalDecisions
    }

    // Detect and store patterns
    const patterns = this.detectPatterns(gameHistory)
    patterns.forEach(pattern => {
      this.storePattern(pattern)
    })
  }

  protected evaluateDecisionQuality(decision: AIDecision, history: GameAction[]): number {
    // Simplified evaluation - real implementation would be more complex
    if (decision.type === 'attack') {
      const action = history.find(a => a.id === decision.action.id)
      if (action) {
        const data = action.data as any
        if (data.result === 'HIT' || data.result === 'SUNK') return 1
        if (data.result === 'MISS') return 0.3
      }
    }
    return 0.5
  }

  /**
   * Adapt strategy based on performance
   */
  adaptStrategy(performance: PerformanceMetrics): void {
    // Adjust behavior based on performance
    if (performance.winRate < 0.3) {
      // Losing too much - become more cautious
      this.behavior.caution = Math.min(1, this.behavior.caution + 0.1)
      this.behavior.aggression = Math.max(0, this.behavior.aggression - 0.1)
    } else if (performance.winRate > 0.7) {
      // Winning a lot - can be more aggressive
      this.behavior.aggression = Math.min(1, this.behavior.aggression + 0.1)
      this.behavior.creativity = Math.min(1, this.behavior.creativity + 0.1)
    }

    // Adjust based on accuracy
    if (performance.averageAccuracy < 0.3) {
      // Poor accuracy - need better targeting
      this.behavior.adaptability = Math.min(1, this.behavior.adaptability + 0.1)
    }
  }

  /**
   * Detect patterns in data
   */
  detectPatterns(data: unknown[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = []

    // This is a placeholder - real pattern detection would be more sophisticated
    // For now, just detect simple patterns in game actions
    const actions = data as GameAction[]

    // Detect repetitive targeting
    const targetingPattern = this.detectTargetingPattern(actions)
    if (targetingPattern) {
      patterns.push(targetingPattern)
    }

    return patterns
  }

  protected detectTargetingPattern(actions: GameAction[]): DetectedPattern | null {
    const attacks = actions.filter(a => a.type === 'attack')
    if (attacks.length < 5) return null

    // Check for patterns in coordinates
    const coordinates = attacks.map(a => (a.data as any).targetCoordinate)

    // Simple pattern: checking for grid patterns
    const xValues = coordinates.map(c => c.x)
    const yValues = coordinates.map(c => c.y)

    // Check if following a line
    const xDiffs = xValues.slice(1).map((x, i) => x - xValues[i])
    const yDiffs = yValues.slice(1).map((y, i) => y - yValues[i])

    const consistentX = xDiffs.every(d => d === xDiffs[0])
    const consistentY = yDiffs.every(d => d === yDiffs[0])

    if (consistentX && consistentY) {
      return {
        id: `pattern_${Date.now()}`,
        type: 'targeting_sequence',
        pattern: {
          description: 'Linear targeting pattern',
          parameters: { xStep: xDiffs[0], yStep: yDiffs[0] },
          examples: coordinates
        },
        confidence: 0.8,
        occurrences: 1,
        lastDetected: new Date()
      }
    }

    return null
  }

  protected storePattern(pattern: DetectedPattern): void {
    // Check if pattern already exists
    const existing = this.state.patterns.find(p =>
      p.type === pattern.type &&
      p.pattern.description === pattern.pattern.description
    )

    if (existing) {
      existing.occurrences++
      existing.lastDetected = new Date()
      existing.confidence = Math.min(1, existing.confidence + 0.1)
    } else {
      this.state.patterns.push(pattern)
    }
  }

  // =============================================
  // PERFORMANCE MONITORING
  // =============================================

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * Evaluate a decision's outcome
   */
  evaluateDecision(decision: AIDecision, outcome: unknown): number {
    // Calculate decision quality score (0-1)
    let score = 0.5 // Base score

    // Adjust based on confidence vs outcome
    if (decision.confidence > 0.7) {
      // High confidence decision
      const wasSuccessful = this.wasDecisionSuccessful(decision, outcome)
      score = wasSuccessful ? 1 : 0.2
    } else if (decision.confidence < 0.3) {
      // Low confidence decision
      const wasSuccessful = this.wasDecisionSuccessful(decision, outcome)
      score = wasSuccessful ? 0.8 : 0.4
    }

    // Update metrics
    this.updateDecisionMetrics(score)

    return score
  }

  protected wasDecisionSuccessful(decision: AIDecision, outcome: unknown): boolean {
    // Simplified success check
    if (decision.type === 'attack') {
      const result = outcome as AttackResult
      return result.result === 'HIT' || result.result === 'SUNK'
    }
    return true // Default to success for other decision types
  }

  protected updateDecisionMetrics(score: number): void {
    const metrics = this.performanceMetrics
    const history = this.decisionHistory

    // Update running averages
    const n = history.length
    if (n > 0) {
      metrics.averageConfidence = (metrics.averageConfidence * (n - 1) + score) / n

      if (score < 0.3) {
        metrics.blunderRate = (metrics.blunderRate * (n - 1) + 1) / n
      } else if (score > 0.7) {
        metrics.optimalDecisionRate = (metrics.optimalDecisionRate * (n - 1) + 1) / n
      }
    }
  }

  /**
   * Run performance benchmark
   */
  benchmarkPerformance(): void {
    // Calculate overall performance scores
    const metrics = this.performanceMetrics

    // Memory efficiency check
    const totalMemory = this.state.memory.shotsFired.length +
                       this.state.memory.hits.length +
                       this.state.memory.misses.length

    metrics.memoryEfficiency = totalMemory > 0 ?
      Math.min(1, 100 / totalMemory) : 1

    // Pattern recognition rate
    if (this.state.patterns.length > 0) {
      const highConfidencePatterns = this.state.patterns.filter(p => p.confidence > 0.7)
      metrics.patternRecognitionRate = highConfidencePatterns.length / this.state.patterns.length
    }

    // Update difficulty-specific metrics
    this.updateDifficultyMetrics()
  }

  protected updateDifficultyMetrics(): void {
    const currentMetrics = this.performanceMetrics.difficultyMetrics.get(this.difficulty) || {
      gamesPlayed: 0,
      winRate: 0,
      averageScore: 0,
      mostSuccessfulStrategies: []
    }

    currentMetrics.gamesPlayed++
    currentMetrics.winRate = this.performanceMetrics.winRate

    this.performanceMetrics.difficultyMetrics.set(this.difficulty, currentMetrics)
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Reset AI state for new game
   */
  resetAIState(): void {
    this.state = this.initializeAIState()
    this.decisionHistory = []
  }

  /**
   * Get AI decision confidence based on current state
   */
  protected calculateDecisionConfidence(reasoning: DecisionReasoning): number {
    let confidence = 0.5 // Base confidence

    // Adjust based on factors
    if (reasoning.primaryFactors.length > 3) {
      confidence += 0.1 * Math.min(reasoning.primaryFactors.length - 3, 3)
    }

    // Adjust based on risk
    confidence -= reasoning.riskAssessment * 0.2

    // Adjust based on difficulty
    switch (this.difficulty) {
      case 'beginner':
        confidence *= 0.7
        break
      case 'intermediate':
        confidence *= 0.85
        break
      case 'advanced':
        confidence *= 0.95
        break
      case 'expert':
        // Expert has full confidence
        break
    }

    return Math.max(0.1, Math.min(1, confidence))
  }

  /**
   * Simulate thinking time for more realistic AI behavior
   */
  protected async simulateThinking(): Promise<void> {
    const baseTime = 500 // Base thinking time in ms
    const difficultyMultiplier = {
      'beginner': 2,
      'intermediate': 1.5,
      'advanced': 1,
      'expert': 0.7
    }

    const thinkingTime = baseTime * difficultyMultiplier[this.difficulty]
    const variance = thinkingTime * 0.3
    const actualTime = thinkingTime + (Math.random() - 0.5) * variance

    await new Promise(resolve => setTimeout(resolve, actualTime))
  }
}

// =============================================
// HELPER TYPES AND FUNCTIONS
// =============================================

export interface AIPlayerConfig extends Omit<PlayerConfig, 'isAI' | 'aiDifficulty'> {
  difficulty: DifficultyLevel
  behavior?: BehaviorTraits
  learningEnabled?: boolean
}

function mapDifficultyToAILevel(difficulty: DifficultyLevel): AILevel {
  switch (difficulty) {
    case 'beginner':
      return 'easy'
    case 'intermediate':
      return 'medium'
    case 'advanced':
      return 'hard'
    case 'expert':
      return 'expert'
  }
}
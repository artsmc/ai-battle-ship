/**
 * AI System Type Definitions
 * Core types for the AI player framework
 */

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
import { ShipClass, PowerupType } from '../database/types/enums'

// =============================================
// AI DIFFICULTY TYPES
// =============================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface DifficultySettings {
  level: DifficultyLevel

  // Decision-making parameters
  searchDepth: number
  explorationFactor: number
  memoryCapacity: number
  learningRate: number

  // Targeting parameters
  targetingAccuracy: number
  patternRecognition: boolean
  probabilityAnalysis: boolean
  adaptiveTargeting: boolean

  // Strategy parameters
  aggressiveness: number
  defensiveness: number
  riskTolerance: number
  bluffingProbability: number

  // Performance thresholds
  thinkingTimeMin: number
  thinkingTimeMax: number
  mistakeProbability: number
  optimalMovePercentage: number
}

// =============================================
// AI BEHAVIOR TYPES
// =============================================

export type BehaviorProfile = 'aggressive' | 'defensive' | 'balanced' | 'unpredictable'

export interface BehaviorTraits {
  profile: BehaviorProfile

  // Personality metrics (0-1 scale)
  aggression: number
  caution: number
  adaptability: number
  persistence: number
  creativity: number

  // Tactical preferences
  preferredTargetPriority: TargetPriority[]
  preferredPlacementStrategy: PlacementStrategy
  abilityUsageFrequency: number
  powerupConservation: number
}

export type TargetPriority =
  | 'largest_ship'
  | 'smallest_ship'
  | 'damaged_ship'
  | 'high_value'
  | 'clustered_area'
  | 'edge_cells'
  | 'center_cells'

export type PlacementStrategy =
  | 'clustered'
  | 'distributed'
  | 'edge_heavy'
  | 'center_heavy'
  | 'random'
  | 'defensive'

// =============================================
// AI STATE MANAGEMENT
// =============================================

export interface AIState {
  // Memory
  memory: AIMemory

  // Current analysis
  boardAnalysis: BoardAnalysis
  threatAssessment: ThreatAssessment
  opportunityMap: OpportunityMap

  // Decision history
  previousDecisions: AIDecision[]
  performanceMetrics: PerformanceMetrics

  // Learning data
  patterns: DetectedPattern[]
  opponentModel: OpponentModel
}

export interface AIMemory {
  // Shot history
  shotsFired: Coordinate[]
  hits: HitMemory[]
  misses: Coordinate[]

  // Ship tracking
  confirmedShips: ConfirmedShip[]
  suspectedShips: SuspectedShip[]
  sunkenShips: SunkenShip[]

  // Pattern memory
  detectedPatterns: PatternMemory[]
  opponentTendencies: TendencyMemory[]
}

export interface HitMemory {
  coordinate: Coordinate
  turnNumber: number
  shipId?: string
  followUpShots: Coordinate[]
}

export interface ConfirmedShip {
  shipId: string
  shipClass?: ShipClass
  knownPositions: Coordinate[]
  orientation?: 'horizontal' | 'vertical'
  remainingHealth?: number
}

export interface SuspectedShip {
  probability: number
  possiblePositions: Coordinate[]
  shipClass?: ShipClass
}

export interface SunkenShip {
  shipId: string
  shipClass: ShipClass
  positions: Coordinate[]
  sunkAtTurn: number
}

export interface PatternMemory {
  type: 'placement' | 'targeting' | 'ability_usage'
  pattern: string
  occurrences: number
  lastSeen: number
}

export interface TendencyMemory {
  tendency: string
  confidence: number
  evidence: string[]
}

// =============================================
// AI ANALYSIS TYPES
// =============================================

export interface BoardAnalysis {
  heatMap: number[][]
  probabilityGrid: number[][]
  dangerZones: Coordinate[]
  safeZones: Coordinate[]
  highValueTargets: Coordinate[]
}

export interface ThreatAssessment {
  immediateThreats: Threat[]
  potentialThreats: Threat[]
  threatLevel: number // 0-1 scale
  criticalShips: string[]
}

export interface Threat {
  source: string
  type: 'attack' | 'ability' | 'powerup'
  severity: number // 0-1 scale
  targetedShips: string[]
  estimatedDamage: number
}

export interface OpportunityMap {
  highValueTargets: TargetOpportunity[]
  vulnerableShips: string[]
  abilityOpportunities: AbilityOpportunity[]
  powerupOpportunities: PowerupOpportunity[]
}

export interface TargetOpportunity {
  coordinate: Coordinate
  value: number
  reasoning: string[]
}

export interface AbilityOpportunity {
  abilityId: string
  shipId: string
  targetCoordinate?: Coordinate
  expectedValue: number
}

export interface PowerupOpportunity {
  powerupType: PowerupType
  targetArea?: Coordinate[]
  expectedValue: number
}

// =============================================
// AI DECISION TYPES
// =============================================

export interface AIDecision {
  id: string
  turnNumber: number
  type: DecisionType
  action: GameAction
  confidence: number
  reasoning: DecisionReasoning
  alternatives: AlternativeAction[]
  timestamp: Date
}

export type DecisionType =
  | 'attack'
  | 'ability_use'
  | 'powerup_use'
  | 'ship_placement'
  | 'defensive_action'

export interface DecisionReasoning {
  primaryFactors: string[]
  riskAssessment: number
  expectedOutcome: string
  confidenceFactors: string[]
}

export interface AlternativeAction {
  action: GameAction
  score: number
  reasoning: string
}

// =============================================
// OPPONENT MODELING
// =============================================

export interface OpponentModel {
  playerId: string

  // Skill assessment
  estimatedSkillLevel: number // 0-1 scale
  consistencyRating: number
  adaptabilityRating: number

  // Play style
  observedBehavior: BehaviorProfile
  preferredStrategies: string[]
  weaknesses: string[]
  strengths: string[]

  // Patterns
  placementPatterns: PlacementPattern[]
  targetingPatterns: TargetingPattern[]
  abilityUsagePatterns: AbilityPattern[]
}

export interface PlacementPattern {
  pattern: string
  frequency: number
  shipClasses: ShipClass[]
}

export interface TargetingPattern {
  pattern: string
  frequency: number
  effectiveness: number
}

export interface AbilityPattern {
  abilityType: string
  usageFrequency: number
  situationalTriggers: string[]
}

// =============================================
// PERFORMANCE METRICS
// =============================================

export interface PerformanceMetrics {
  // Overall performance
  winRate: number
  averageGameLength: number
  averageAccuracy: number

  // Decision quality
  optimalDecisionRate: number
  blunderRate: number
  averageConfidence: number

  // Efficiency metrics
  averageThinkingTime: number
  decisionsPerTurn: number
  memoryEfficiency: number

  // Learning metrics
  patternRecognitionRate: number
  adaptationSpeed: number
  predictionAccuracy: number

  // Per difficulty metrics
  difficultyMetrics: Map<DifficultyLevel, DifficultyPerformance>
}

export interface DifficultyPerformance {
  gamesPlayed: number
  winRate: number
  averageScore: number
  mostSuccessfulStrategies: string[]
}

// =============================================
// PATTERN DETECTION
// =============================================

export interface DetectedPattern {
  id: string
  type: PatternType
  pattern: PatternData
  confidence: number
  occurrences: number
  lastDetected: Date
}

export type PatternType =
  | 'ship_arrangement'
  | 'targeting_sequence'
  | 'ability_timing'
  | 'defensive_behavior'
  | 'offensive_behavior'

export interface PatternData {
  description: string
  parameters: Record<string, unknown>
  examples: unknown[]
}

// =============================================
// STRATEGY INTERFACES
// =============================================

export interface AIStrategy {
  name: string
  type: 'placement' | 'targeting' | 'ability' | 'overall'

  /**
   * Evaluate if this strategy is applicable
   */
  isApplicable(context: AIContext): boolean

  /**
   * Calculate the priority/score for this strategy
   */
  calculatePriority(context: AIContext): number

  /**
   * Execute the strategy and return recommended actions
   */
  execute(context: AIContext): StrategyResult
}

export interface AIContext {
  aiState: AIState
  gameState: any // Will be properly typed with GameState
  currentPlayer: any // Will be properly typed with Player
  opponent: any // Will be properly typed with Player
  turnNumber: number
  timeRemaining?: number
}

export interface StrategyResult {
  recommendedAction: GameAction
  confidence: number
  reasoning: string[]
  alternatives: GameAction[]
}

// =============================================
// AI PLAYER INTERFACE
// =============================================

export interface AIPlayerInterface {
  // Core properties
  playerId: string
  difficulty: DifficultyLevel
  behavior: BehaviorTraits
  state: AIState

  // Decision making
  makeDecision(context: AIContext): Promise<AIDecision>
  selectTarget(board: BoardState): Coordinate
  placeFleet(ships: GameShip[]): ShipPosition[]
  selectAbility(available: any[]): any | null
  selectPowerup(available: PowerupType[]): PowerupType | null

  // State management
  updateMemory(result: AttackResult): void
  analyzeBoard(board: BoardState): BoardAnalysis
  assessThreats(context: AIContext): ThreatAssessment
  modelOpponent(history: GameAction[]): OpponentModel

  // Learning and adaptation
  learnFromGame(gameHistory: GameAction[]): void
  adaptStrategy(performance: PerformanceMetrics): void
  detectPatterns(data: unknown[]): DetectedPattern[]

  // Performance monitoring
  getPerformanceMetrics(): PerformanceMetrics
  evaluateDecision(decision: AIDecision, outcome: unknown): number
  benchmarkPerformance(): void
}
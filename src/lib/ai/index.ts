/**
 * AI System Module Exports
 * Central export point for all AI-related components
 */

// Core AI Player
export { AIPlayer, type AIPlayerConfig } from './AIPlayer'

// AI Types
export type {
  // Core types
  DifficultyLevel,
  DifficultySettings,
  BehaviorProfile,
  BehaviorTraits,
  TargetPriority,
  PlacementStrategy,

  // State management
  AIState,
  AIMemory,
  HitMemory,
  ConfirmedShip,
  SuspectedShip,
  SunkenShip,
  PatternMemory,
  TendencyMemory,

  // Analysis types
  BoardAnalysis,
  ThreatAssessment,
  Threat,
  OpportunityMap,
  TargetOpportunity,
  AbilityOpportunity,
  PowerupOpportunity,

  // Decision types
  AIDecision,
  DecisionType,
  DecisionReasoning,
  AlternativeAction,

  // Opponent modeling
  OpponentModel,
  PlacementPattern,
  TargetingPattern,
  AbilityPattern,

  // Performance metrics
  PerformanceMetrics,
  DifficultyPerformance,

  // Pattern detection
  DetectedPattern,
  PatternType,
  PatternData,

  // Strategy interfaces
  AIStrategy,
  AIContext,
  StrategyResult,

  // AI Player interface
  AIPlayerInterface
} from './types'

// Difficulty Manager
export {
  DifficultyManager,
  type DifficultyAdjustmentRecommendation,
  type DifficultyStats,
  type DifficultyBenchmark
} from './DifficultyManager'

// AI Strategies
export {
  BaseStrategy,
  HuntTargetStrategy,
  ProbabilityDensityStrategy,
  ClusteredPlacementStrategy,
  DistributedPlacementStrategy,
  OffensiveAbilityStrategy,
  DefensiveAbilityStrategy,
  StrategyFactory
} from './AIStrategy'

// Performance Monitor
export {
  AIPerformanceMonitor,
  type PerformanceSnapshot,
  type DecisionAnalysis,
  type PerformanceReport,
  type ImprovementArea,
  type TimingMetrics,
  type DecisionTracker
} from './AIPerformanceMonitor'

// Behavior Configuration
export {
  AIBehaviorConfig,
  type BehaviorModifier,
  type AdaptiveBehavior,
  type BehaviorPreset
} from './AIBehaviorConfig'

// Utility functions
export { getAISettings, configureAIBehavior } from './utils'

// AI Algorithm Implementations
export {
  BeginnerAI,
  IntermediateAI,
  AdvancedAI,
  ExpertAI,
  createAIPlayer,
  getAIDescription,
  AI_DIFFICULTY_PRESETS
} from './algorithms'
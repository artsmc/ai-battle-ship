/**
 * AI System Utility Functions
 * Helper functions for AI player creation and configuration
 */

import { AIPlayer, AIPlayerConfig } from './AIPlayer'
import { DifficultyManager } from './DifficultyManager'
import { AIBehaviorConfig } from './AIBehaviorConfig'
import { createAIPlayer as createAI } from './algorithms'
import {
  DifficultyLevel,
  DifficultySettings,
  BehaviorTraits,
  BehaviorProfile
} from './types'

/**
 * Create an AI player with specified difficulty and behavior
 * Note: This function now uses the actual AI implementations from the algorithms module
 */
export function createAIPlayer(
  difficulty: DifficultyLevel,
  behaviorProfile?: BehaviorProfile | string,
  customConfig?: Partial<AIPlayerConfig>
): AIPlayer {
  // Get difficulty settings
  const difficultyManager = DifficultyManager.getInstance()
  const difficultySettings = difficultyManager.getSettings(difficulty)

  // Get behavior configuration
  const behaviorConfig = AIBehaviorConfig.getInstance()
  const behavior = behaviorProfile
    ? behaviorConfig.getBehavior(behaviorProfile)
    : behaviorConfig.selectBehavior(difficulty)

  // Create AI player configuration
  const config: AIPlayerConfig = {
    name: `AI_${difficulty}_${Date.now()}`,
    difficulty,
    behavior,
    learningEnabled: difficultySettings.learningRate > 0,
    boardWidth: 10,
    boardHeight: 10,
    allowPowerups: true,
    ...customConfig
  }

  // Use the actual AI implementation from algorithms module
  return createAI(config)
}

/**
 * Get AI settings for a difficulty level
 */
export function getAISettings(difficulty: DifficultyLevel): AISettings {
  const difficultyManager = DifficultyManager.getInstance()
  const behaviorConfig = AIBehaviorConfig.getInstance()

  const difficultySettings = difficultyManager.getSettings(difficulty)
  const defaultBehavior = behaviorConfig.selectBehavior(difficulty)

  return {
    difficulty,
    difficultySettings,
    defaultBehavior,
    availableProfiles: getAvailableProfiles(difficulty),
    recommendedStrategies: getRecommendedStrategies(difficulty),
    performanceBenchmarks: getPerformanceBenchmarks(difficulty)
  }
}

/**
 * Configure AI behavior for specific game scenarios
 */
export function configureAIBehavior(
  baseDifficulty: DifficultyLevel,
  scenario: GameScenario
): ConfiguredAI {
  const behaviorConfig = AIBehaviorConfig.getInstance()
  const difficultyManager = DifficultyManager.getInstance()

  let behavior: BehaviorTraits
  let difficultyAdjustment = 0

  switch (scenario.type) {
    case 'tutorial':
      // Easy, predictable AI for tutorials
      behavior = behaviorConfig.getBehavior('defensive')
      difficultyAdjustment = -0.3
      break

    case 'campaign':
      // Progressive difficulty in campaign
      behavior = behaviorConfig.selectBehavior(baseDifficulty, 'campaign', scenario.missionNumber / 20)
      difficultyAdjustment = (scenario.missionNumber - 1) * 0.05
      break

    case 'multiplayer':
      // Balanced AI for multiplayer
      behavior = behaviorConfig.getBehavior('balanced')
      break

    case 'tournament':
      // Competitive AI for tournaments
      behavior = behaviorConfig.createCustomBehavior('aggressive', {
        adaptability: 0.9,
        persistence: 0.8,
        abilityUsageFrequency: 0.7
      })
      difficultyAdjustment = 0.1
      break

    case 'practice':
      // Adaptive AI for practice
      behavior = behaviorConfig.getBehavior(scenario.preferredOpponent || 'balanced')
      break

    default:
      behavior = behaviorConfig.selectBehavior(baseDifficulty)
  }

  // Apply difficulty adjustment
  const settings = difficultyManager.getSettings(baseDifficulty)
  if (difficultyAdjustment !== 0) {
    settings.targetingAccuracy = Math.max(0, Math.min(1, settings.targetingAccuracy + difficultyAdjustment))
    settings.mistakeProbability = Math.max(0, Math.min(1, settings.mistakeProbability - difficultyAdjustment))
  }

  return {
    difficulty: baseDifficulty,
    adjustedSettings: settings,
    behavior,
    scenario,
    specialRules: getScenarioRules(scenario)
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get available behavior profiles for a difficulty level
 */
function getAvailableProfiles(difficulty: DifficultyLevel): BehaviorProfile[] {
  switch (difficulty) {
    case 'beginner':
      return ['defensive', 'balanced']
    case 'intermediate':
      return ['defensive', 'balanced', 'aggressive']
    case 'advanced':
      return ['balanced', 'aggressive', 'unpredictable']
    case 'expert':
      return ['aggressive', 'unpredictable', 'balanced', 'defensive']
  }
}

/**
 * Get recommended strategies for a difficulty level
 */
function getRecommendedStrategies(difficulty: DifficultyLevel): string[] {
  switch (difficulty) {
    case 'beginner':
      return ['Hunt and Target', 'Clustered Placement']
    case 'intermediate':
      return ['Hunt and Target', 'Distributed Placement', 'Defensive Abilities']
    case 'advanced':
      return ['Probability Density', 'Distributed Placement', 'Offensive Abilities']
    case 'expert':
      return ['Probability Density', 'Defensive Placement', 'Offensive Abilities', 'Defensive Abilities']
  }
}

/**
 * Get performance benchmarks for a difficulty level
 */
function getPerformanceBenchmarks(difficulty: DifficultyLevel): PerformanceBenchmarks {
  switch (difficulty) {
    case 'beginner':
      return {
        expectedWinRate: 0.3,
        expectedAccuracy: 0.4,
        expectedGameLength: 40,
        maxThinkingTime: 3000
      }
    case 'intermediate':
      return {
        expectedWinRate: 0.5,
        expectedAccuracy: 0.6,
        expectedGameLength: 35,
        maxThinkingTime: 2000
      }
    case 'advanced':
      return {
        expectedWinRate: 0.7,
        expectedAccuracy: 0.8,
        expectedGameLength: 30,
        maxThinkingTime: 1500
      }
    case 'expert':
      return {
        expectedWinRate: 0.85,
        expectedAccuracy: 0.95,
        expectedGameLength: 25,
        maxThinkingTime: 1000
      }
  }
}

/**
 * Get special rules for a game scenario
 */
function getScenarioRules(scenario: GameScenario): SpecialRules {
  const rules: SpecialRules = {
    allowPowerups: true,
    allowAbilities: true,
    fogOfWar: true,
    turnTimeLimit: null,
    specialConditions: []
  }

  switch (scenario.type) {
    case 'tutorial':
      rules.allowPowerups = false
      rules.allowAbilities = false
      rules.fogOfWar = false
      break

    case 'tournament':
      rules.turnTimeLimit = 60000 // 60 seconds
      rules.specialConditions.push('No takebacks', 'Best of 3')
      break

    case 'campaign':
      if (scenario.missionNumber && scenario.missionNumber < 5) {
        rules.allowPowerups = false
      }
      break

    case 'practice':
      rules.specialConditions.push('Unlimited retries', 'Hints available')
      break
  }

  return rules
}

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface AISettings {
  difficulty: DifficultyLevel
  difficultySettings: DifficultySettings
  defaultBehavior: BehaviorTraits
  availableProfiles: BehaviorProfile[]
  recommendedStrategies: string[]
  performanceBenchmarks: PerformanceBenchmarks
}

export interface GameScenario {
  type: 'tutorial' | 'campaign' | 'multiplayer' | 'tournament' | 'practice'
  missionNumber?: number
  preferredOpponent?: string
  customSettings?: Record<string, any>
}

export interface ConfiguredAI {
  difficulty: DifficultyLevel
  adjustedSettings: DifficultySettings
  behavior: BehaviorTraits
  scenario: GameScenario
  specialRules: SpecialRules
}

export interface PerformanceBenchmarks {
  expectedWinRate: number
  expectedAccuracy: number
  expectedGameLength: number
  maxThinkingTime: number
}

export interface SpecialRules {
  allowPowerups: boolean
  allowAbilities: boolean
  fogOfWar: boolean
  turnTimeLimit: number | null
  specialConditions: string[]
}

/**
 * Calculate AI strength rating based on performance
 */
export function calculateAIStrength(
  winRate: number,
  accuracy: number,
  avgGameLength: number
): number {
  // Weight factors for overall strength
  const winWeight = 0.5
  const accuracyWeight = 0.3
  const speedWeight = 0.2

  // Normalize game length (shorter is better, assuming 20-50 turn range)
  const speedScore = Math.max(0, Math.min(1, (50 - avgGameLength) / 30))

  const strength = (winRate * winWeight) + (accuracy * accuracyWeight) + (speedScore * speedWeight)

  return Math.max(0, Math.min(1, strength))
}

/**
 * Get AI difficulty recommendation based on player skill
 */
export function recommendDifficulty(
  playerWinRate: number,
  gamesPlayed: number
): DifficultyLevel {
  if (gamesPlayed < 3) {
    return 'beginner'
  }

  if (playerWinRate > 0.8) {
    return 'expert'
  } else if (playerWinRate > 0.6) {
    return 'advanced'
  } else if (playerWinRate > 0.4) {
    return 'intermediate'
  } else {
    return 'beginner'
  }
}

/**
 * Create AI player pool for tournaments
 */
export function createAIPlayerPool(
  count: number,
  minDifficulty: DifficultyLevel = 'beginner',
  maxDifficulty: DifficultyLevel = 'expert'
): AIPlayer[] {
  const difficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']
  const minIndex = difficulties.indexOf(minDifficulty)
  const maxIndex = difficulties.indexOf(maxDifficulty)
  const availableDifficulties = difficulties.slice(minIndex, maxIndex + 1)

  const players: AIPlayer[] = []

  for (let i = 0; i < count; i++) {
    const difficulty = availableDifficulties[Math.floor(Math.random() * availableDifficulties.length)]
    const behaviorConfig = AIBehaviorConfig.getInstance()
    const presets = behaviorConfig.getPresets()
    const randomPreset = presets[Math.floor(Math.random() * presets.length)]

    players.push(createAIPlayer(difficulty, randomPreset.profile, {
      name: `AI_${randomPreset.name}_${i + 1}`
    }))
  }

  return players
}
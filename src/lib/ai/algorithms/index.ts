/**
 * AI Algorithms Export
 * Central export point for all AI difficulty implementations
 */

export { BeginnerAI } from './BeginnerAI'
export { IntermediateAI } from './IntermediateAI'
export { AdvancedAI } from './AdvancedAI'
export { ExpertAI } from './ExpertAI'

// Factory function to create AI based on difficulty
import { DifficultyLevel } from '../types'
import { AIPlayer, AIPlayerConfig } from '../AIPlayer'
import { BeginnerAI } from './BeginnerAI'
import { IntermediateAI } from './IntermediateAI'
import { AdvancedAI } from './AdvancedAI'
import { ExpertAI } from './ExpertAI'

/**
 * Create an AI player instance based on difficulty level
 */
export function createAIPlayer(
  config: Omit<AIPlayerConfig, 'difficulty'> & { difficulty: DifficultyLevel }
): AIPlayer {
  const { difficulty, ...baseConfig } = config

  switch (difficulty) {
    case 'beginner':
      return new BeginnerAI(baseConfig)
    case 'intermediate':
      return new IntermediateAI(baseConfig)
    case 'advanced':
      return new AdvancedAI(baseConfig)
    case 'expert':
      return new ExpertAI(baseConfig)
    default:
      throw new Error(`Unknown difficulty level: ${difficulty}`)
  }
}

/**
 * Get AI description and capabilities
 */
export function getAIDescription(difficulty: DifficultyLevel): {
  name: string
  description: string
  capabilities: string[]
  strategy: string
} {
  switch (difficulty) {
    case 'beginner':
      return {
        name: 'Beginner AI',
        description: 'A novice opponent that makes random moves with basic strategy',
        capabilities: [
          'Random targeting with slight center preference',
          'Basic ship placement',
          'Occasional ability usage',
          'Limited memory of previous shots'
        ],
        strategy: 'Random selection with basic avoidance of recent shots'
      }

    case 'intermediate':
      return {
        name: 'Intermediate AI',
        description: 'A competent opponent using hunt/target strategy',
        capabilities: [
          'Hunt/target strategy for systematic searching',
          'Distributed ship placement with spacing',
          'Basic pattern recognition',
          'Strategic ability and powerup usage'
        ],
        strategy: 'Checkerboard hunting pattern with focused targeting when ships are hit'
      }

    case 'advanced':
      return {
        name: 'Advanced AI',
        description: 'A skilled opponent using probability-based targeting',
        capabilities: [
          'Probability density maps for targeting',
          'Defensive ship positioning',
          'Pattern analysis and exploitation',
          'Coordinated ability combinations',
          'Opponent behavior analysis'
        ],
        strategy: 'Probability maximization with adaptive strategy based on game state'
      }

    case 'expert':
      return {
        name: 'Expert AI',
        description: 'A master strategist using game theory and predictive modeling',
        capabilities: [
          'Game tree lookahead with minimax',
          'Neural network pattern recognition',
          'Bayesian inference for targeting',
          'Counter-strategy development',
          'Monte Carlo simulations',
          'Adaptive learning from opponent'
        ],
        strategy: 'Ensemble of strategies with game theory optimization and machine learning'
      }

    default:
      throw new Error(`Unknown difficulty level: ${difficulty}`)
  }
}

/**
 * AI difficulty configuration presets
 */
export const AI_DIFFICULTY_PRESETS = {
  beginner: {
    searchDepth: 1,
    explorationFactor: 0.8,
    memoryCapacity: 10,
    learningRate: 0.1,
    targetingAccuracy: 0.3,
    patternRecognition: false,
    probabilityAnalysis: false,
    adaptiveTargeting: false,
    thinkingTimeMin: 1000,
    thinkingTimeMax: 2000,
    mistakeProbability: 0.4,
    optimalMovePercentage: 0.2
  },
  intermediate: {
    searchDepth: 2,
    explorationFactor: 0.5,
    memoryCapacity: 25,
    learningRate: 0.3,
    targetingAccuracy: 0.5,
    patternRecognition: true,
    probabilityAnalysis: false,
    adaptiveTargeting: true,
    thinkingTimeMin: 750,
    thinkingTimeMax: 1500,
    mistakeProbability: 0.2,
    optimalMovePercentage: 0.5
  },
  advanced: {
    searchDepth: 3,
    explorationFactor: 0.3,
    memoryCapacity: 50,
    learningRate: 0.5,
    targetingAccuracy: 0.75,
    patternRecognition: true,
    probabilityAnalysis: true,
    adaptiveTargeting: true,
    thinkingTimeMin: 500,
    thinkingTimeMax: 1000,
    mistakeProbability: 0.1,
    optimalMovePercentage: 0.75
  },
  expert: {
    searchDepth: 4,
    explorationFactor: 0.15,
    memoryCapacity: 100,
    learningRate: 0.7,
    targetingAccuracy: 0.95,
    patternRecognition: true,
    probabilityAnalysis: true,
    adaptiveTargeting: true,
    thinkingTimeMin: 200,
    thinkingTimeMax: 500,
    mistakeProbability: 0.02,
    optimalMovePercentage: 0.95
  }
}
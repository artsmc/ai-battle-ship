/**
 * Difficulty Manager
 * Manages AI difficulty levels and dynamic difficulty adjustment
 */

import {
  DifficultyLevel,
  DifficultySettings,
  PerformanceMetrics,
  DifficultyPerformance
} from './types'

export class DifficultyManager {
  private static instance: DifficultyManager
  private difficultySettings: Map<DifficultyLevel, DifficultySettings>
  private performanceHistory: Map<DifficultyLevel, DifficultyPerformance[]>
  private dynamicAdjustmentEnabled: boolean
  private adjustmentThreshold: number

  private constructor() {
    this.difficultySettings = this.initializeDifficultySettings()
    this.performanceHistory = new Map()
    this.dynamicAdjustmentEnabled = false
    this.adjustmentThreshold = 0.3 // 30% win rate threshold for adjustment
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DifficultyManager {
    if (!DifficultyManager.instance) {
      DifficultyManager.instance = new DifficultyManager()
    }
    return DifficultyManager.instance
  }

  // =============================================
  // DIFFICULTY SETTINGS
  // =============================================

  private initializeDifficultySettings(): Map<DifficultyLevel, DifficultySettings> {
    const settings = new Map<DifficultyLevel, DifficultySettings>()

    // Beginner settings - Makes occasional mistakes, limited memory
    settings.set('beginner', {
      level: 'beginner',

      // Decision-making parameters
      searchDepth: 1,
      explorationFactor: 0.2,
      memoryCapacity: 5,
      learningRate: 0.1,

      // Targeting parameters
      targetingAccuracy: 0.4,
      patternRecognition: false,
      probabilityAnalysis: false,
      adaptiveTargeting: false,

      // Strategy parameters
      aggressiveness: 0.3,
      defensiveness: 0.7,
      riskTolerance: 0.2,
      bluffingProbability: 0.05,

      // Performance thresholds
      thinkingTimeMin: 1000,
      thinkingTimeMax: 3000,
      mistakeProbability: 0.3,
      optimalMovePercentage: 0.4
    })

    // Intermediate settings - Better targeting, some pattern recognition
    settings.set('intermediate', {
      level: 'intermediate',

      // Decision-making parameters
      searchDepth: 2,
      explorationFactor: 0.4,
      memoryCapacity: 15,
      learningRate: 0.3,

      // Targeting parameters
      targetingAccuracy: 0.6,
      patternRecognition: true,
      probabilityAnalysis: false,
      adaptiveTargeting: false,

      // Strategy parameters
      aggressiveness: 0.5,
      defensiveness: 0.5,
      riskTolerance: 0.4,
      bluffingProbability: 0.1,

      // Performance thresholds
      thinkingTimeMin: 800,
      thinkingTimeMax: 2000,
      mistakeProbability: 0.15,
      optimalMovePercentage: 0.6
    })

    // Advanced settings - Strong tactics, good memory, adaptive
    settings.set('advanced', {
      level: 'advanced',

      // Decision-making parameters
      searchDepth: 3,
      explorationFactor: 0.6,
      memoryCapacity: 30,
      learningRate: 0.5,

      // Targeting parameters
      targetingAccuracy: 0.8,
      patternRecognition: true,
      probabilityAnalysis: true,
      adaptiveTargeting: true,

      // Strategy parameters
      aggressiveness: 0.7,
      defensiveness: 0.4,
      riskTolerance: 0.6,
      bluffingProbability: 0.15,

      // Performance thresholds
      thinkingTimeMin: 500,
      thinkingTimeMax: 1500,
      mistakeProbability: 0.05,
      optimalMovePercentage: 0.8
    })

    // Expert settings - Near-optimal play, full capabilities
    settings.set('expert', {
      level: 'expert',

      // Decision-making parameters
      searchDepth: 5,
      explorationFactor: 0.8,
      memoryCapacity: 100,
      learningRate: 0.8,

      // Targeting parameters
      targetingAccuracy: 0.95,
      patternRecognition: true,
      probabilityAnalysis: true,
      adaptiveTargeting: true,

      // Strategy parameters
      aggressiveness: 0.6,
      defensiveness: 0.6,
      riskTolerance: 0.7,
      bluffingProbability: 0.2,

      // Performance thresholds
      thinkingTimeMin: 300,
      thinkingTimeMax: 1000,
      mistakeProbability: 0.01,
      optimalMovePercentage: 0.95
    })

    return settings
  }

  /**
   * Get settings for a specific difficulty level
   */
  getSettings(level: DifficultyLevel): DifficultySettings {
    const settings = this.difficultySettings.get(level)
    if (!settings) {
      throw new Error(`Invalid difficulty level: ${level}`)
    }
    return { ...settings }
  }

  /**
   * Update settings for a difficulty level
   */
  updateSettings(level: DifficultyLevel, updates: Partial<DifficultySettings>): void {
    const current = this.getSettings(level)
    const updated = { ...current, ...updates, level } // Ensure level stays consistent
    this.difficultySettings.set(level, updated)
  }

  // =============================================
  // DYNAMIC DIFFICULTY ADJUSTMENT
  // =============================================

  /**
   * Enable or disable dynamic difficulty adjustment
   */
  setDynamicAdjustment(enabled: boolean, threshold?: number): void {
    this.dynamicAdjustmentEnabled = enabled
    if (threshold !== undefined) {
      this.adjustmentThreshold = Math.max(0, Math.min(1, threshold))
    }
  }

  /**
   * Analyze performance and suggest difficulty adjustment
   */
  analyzeDifficulty(
    currentLevel: DifficultyLevel,
    performance: PerformanceMetrics,
    gamesPlayed: number
  ): DifficultyAdjustmentRecommendation {
    if (!this.dynamicAdjustmentEnabled || gamesPlayed < 5) {
      return {
        shouldAdjust: false,
        currentLevel,
        recommendedLevel: currentLevel,
        reason: 'Not enough data or dynamic adjustment disabled'
      }
    }

    const winRate = performance.winRate
    const accuracy = performance.averageAccuracy
    const optimalRate = performance.optimalDecisionRate

    // Calculate overall performance score
    const performanceScore = (winRate * 0.5) + (accuracy * 0.3) + (optimalRate * 0.2)

    // Determine if adjustment is needed
    let recommendedLevel = currentLevel
    let shouldAdjust = false
    let reason = ''

    if (performanceScore < this.adjustmentThreshold) {
      // Player is struggling - consider decreasing difficulty
      if (currentLevel !== 'beginner') {
        shouldAdjust = true
        recommendedLevel = this.decreaseDifficulty(currentLevel)
        reason = `Performance score (${(performanceScore * 100).toFixed(1)}%) below threshold`
      }
    } else if (performanceScore > (1 - this.adjustmentThreshold)) {
      // Player is dominating - consider increasing difficulty
      if (currentLevel !== 'expert') {
        shouldAdjust = true
        recommendedLevel = this.increaseDifficulty(currentLevel)
        reason = `Performance score (${(performanceScore * 100).toFixed(1)}%) above threshold`
      }
    }

    // Store performance for history
    this.recordPerformance(currentLevel, performance)

    return {
      shouldAdjust,
      currentLevel,
      recommendedLevel,
      reason,
      performanceScore,
      metrics: {
        winRate,
        accuracy,
        optimalDecisionRate: optimalRate
      }
    }
  }

  /**
   * Apply gradual difficulty adjustment
   */
  applyGradualAdjustment(
    currentLevel: DifficultyLevel,
    targetLevel: DifficultyLevel,
    transitionFactor: number
  ): DifficultySettings {
    const currentSettings = this.getSettings(currentLevel)
    const targetSettings = this.getSettings(targetLevel)

    // Interpolate between current and target settings
    const adjustedSettings: DifficultySettings = {
      level: currentLevel,

      // Interpolate decision-making parameters
      searchDepth: Math.round(
        currentSettings.searchDepth +
        (targetSettings.searchDepth - currentSettings.searchDepth) * transitionFactor
      ),
      explorationFactor: this.interpolate(
        currentSettings.explorationFactor,
        targetSettings.explorationFactor,
        transitionFactor
      ),
      memoryCapacity: Math.round(
        currentSettings.memoryCapacity +
        (targetSettings.memoryCapacity - currentSettings.memoryCapacity) * transitionFactor
      ),
      learningRate: this.interpolate(
        currentSettings.learningRate,
        targetSettings.learningRate,
        transitionFactor
      ),

      // Interpolate targeting parameters
      targetingAccuracy: this.interpolate(
        currentSettings.targetingAccuracy,
        targetSettings.targetingAccuracy,
        transitionFactor
      ),
      patternRecognition:
        transitionFactor > 0.5 ? targetSettings.patternRecognition : currentSettings.patternRecognition,
      probabilityAnalysis:
        transitionFactor > 0.5 ? targetSettings.probabilityAnalysis : currentSettings.probabilityAnalysis,
      adaptiveTargeting:
        transitionFactor > 0.5 ? targetSettings.adaptiveTargeting : currentSettings.adaptiveTargeting,

      // Interpolate strategy parameters
      aggressiveness: this.interpolate(
        currentSettings.aggressiveness,
        targetSettings.aggressiveness,
        transitionFactor
      ),
      defensiveness: this.interpolate(
        currentSettings.defensiveness,
        targetSettings.defensiveness,
        transitionFactor
      ),
      riskTolerance: this.interpolate(
        currentSettings.riskTolerance,
        targetSettings.riskTolerance,
        transitionFactor
      ),
      bluffingProbability: this.interpolate(
        currentSettings.bluffingProbability,
        targetSettings.bluffingProbability,
        transitionFactor
      ),

      // Interpolate performance thresholds
      thinkingTimeMin: Math.round(
        currentSettings.thinkingTimeMin +
        (targetSettings.thinkingTimeMin - currentSettings.thinkingTimeMin) * transitionFactor
      ),
      thinkingTimeMax: Math.round(
        currentSettings.thinkingTimeMax +
        (targetSettings.thinkingTimeMax - currentSettings.thinkingTimeMax) * transitionFactor
      ),
      mistakeProbability: this.interpolate(
        currentSettings.mistakeProbability,
        targetSettings.mistakeProbability,
        transitionFactor
      ),
      optimalMovePercentage: this.interpolate(
        currentSettings.optimalMovePercentage,
        targetSettings.optimalMovePercentage,
        transitionFactor
      )
    }

    return adjustedSettings
  }

  // =============================================
  // PERFORMANCE TRACKING
  // =============================================

  /**
   * Record performance for a difficulty level
   */
  recordPerformance(level: DifficultyLevel, metrics: PerformanceMetrics): void {
    const history = this.performanceHistory.get(level) || []

    const performance: DifficultyPerformance = {
      gamesPlayed: 1,
      winRate: metrics.winRate,
      averageScore: metrics.averageAccuracy,
      mostSuccessfulStrategies: []
    }

    history.push(performance)

    // Keep only last 100 records
    if (history.length > 100) {
      history.shift()
    }

    this.performanceHistory.set(level, history)
  }

  /**
   * Get performance statistics for a difficulty level
   */
  getPerformanceStats(level: DifficultyLevel): DifficultyStats {
    const history = this.performanceHistory.get(level) || []

    if (history.length === 0) {
      return {
        gamesPlayed: 0,
        averageWinRate: 0,
        averageScore: 0,
        winRateTrend: 'stable',
        recommendedAdjustment: null
      }
    }

    const totalGames = history.length
    const avgWinRate = history.reduce((sum, p) => sum + p.winRate, 0) / totalGames
    const avgScore = history.reduce((sum, p) => sum + p.averageScore, 0) / totalGames

    // Calculate trend (compare recent to overall)
    const recentGames = history.slice(-10)
    const recentWinRate = recentGames.reduce((sum, p) => sum + p.winRate, 0) / recentGames.length
    const trend = this.calculateTrend(avgWinRate, recentWinRate)

    // Determine recommended adjustment
    let recommendedAdjustment = null
    if (avgWinRate < 0.3 && level !== 'beginner') {
      recommendedAdjustment = this.decreaseDifficulty(level)
    } else if (avgWinRate > 0.7 && level !== 'expert') {
      recommendedAdjustment = this.increaseDifficulty(level)
    }

    return {
      gamesPlayed: totalGames,
      averageWinRate: avgWinRate,
      averageScore: avgScore,
      winRateTrend: trend,
      recommendedAdjustment
    }
  }

  /**
   * Benchmark AI performance across all difficulty levels
   */
  benchmarkAllDifficulties(): DifficultyBenchmark {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']
    const benchmarks: Record<DifficultyLevel, DifficultyStats> = {} as any

    levels.forEach(level => {
      benchmarks[level] = this.getPerformanceStats(level)
    })

    // Calculate overall statistics
    const totalGames = Object.values(benchmarks).reduce((sum, b) => sum + b.gamesPlayed, 0)
    const avgWinRate = totalGames > 0
      ? Object.values(benchmarks).reduce((sum, b) => sum + b.averageWinRate * b.gamesPlayed, 0) / totalGames
      : 0

    return {
      benchmarks,
      totalGamesPlayed: totalGames,
      overallWinRate: avgWinRate,
      mostPlayedDifficulty: this.getMostPlayedDifficulty(benchmarks),
      mostSuccessfulDifficulty: this.getMostSuccessfulDifficulty(benchmarks)
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'beginner':
        return 'intermediate'
      case 'intermediate':
        return 'advanced'
      case 'advanced':
        return 'expert'
      case 'expert':
        return 'expert'
    }
  }

  private decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'beginner':
        return 'beginner'
      case 'intermediate':
        return 'beginner'
      case 'advanced':
        return 'intermediate'
      case 'expert':
        return 'advanced'
    }
  }

  private interpolate(start: number, end: number, factor: number): number {
    return start + (end - start) * factor
  }

  private calculateTrend(overall: number, recent: number): 'improving' | 'declining' | 'stable' {
    const difference = recent - overall
    if (Math.abs(difference) < 0.05) return 'stable'
    return difference > 0 ? 'improving' : 'declining'
  }

  private getMostPlayedDifficulty(
    benchmarks: Record<DifficultyLevel, DifficultyStats>
  ): DifficultyLevel | null {
    let maxGames = 0
    let mostPlayed: DifficultyLevel | null = null

    Object.entries(benchmarks).forEach(([level, stats]) => {
      if (stats.gamesPlayed > maxGames) {
        maxGames = stats.gamesPlayed
        mostPlayed = level as DifficultyLevel
      }
    })

    return mostPlayed
  }

  private getMostSuccessfulDifficulty(
    benchmarks: Record<DifficultyLevel, DifficultyStats>
  ): DifficultyLevel | null {
    let bestWinRate = 0
    let mostSuccessful: DifficultyLevel | null = null

    Object.entries(benchmarks).forEach(([level, stats]) => {
      if (stats.gamesPlayed > 0 && stats.averageWinRate > bestWinRate) {
        bestWinRate = stats.averageWinRate
        mostSuccessful = level as DifficultyLevel
      }
    })

    return mostSuccessful
  }

  /**
   * Reset all performance history
   */
  resetHistory(): void {
    this.performanceHistory.clear()
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const data = {
      settings: Object.fromEntries(this.difficultySettings),
      history: Object.fromEntries(this.performanceHistory),
      dynamicAdjustment: {
        enabled: this.dynamicAdjustmentEnabled,
        threshold: this.adjustmentThreshold
      }
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Import performance data
   */
  importPerformanceData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)

      // Import settings
      if (data.settings) {
        Object.entries(data.settings).forEach(([level, settings]) => {
          this.difficultySettings.set(level as DifficultyLevel, settings as DifficultySettings)
        })
      }

      // Import history
      if (data.history) {
        Object.entries(data.history).forEach(([level, history]) => {
          this.performanceHistory.set(level as DifficultyLevel, history as DifficultyPerformance[])
        })
      }

      // Import dynamic adjustment settings
      if (data.dynamicAdjustment) {
        this.dynamicAdjustmentEnabled = data.dynamicAdjustment.enabled
        this.adjustmentThreshold = data.dynamicAdjustment.threshold
      }
    } catch (error) {
      console.error('Failed to import performance data:', error)
      throw new Error('Invalid performance data format')
    }
  }
}

// =============================================
// TYPES
// =============================================

export interface DifficultyAdjustmentRecommendation {
  shouldAdjust: boolean
  currentLevel: DifficultyLevel
  recommendedLevel: DifficultyLevel
  reason: string
  performanceScore?: number
  metrics?: {
    winRate: number
    accuracy: number
    optimalDecisionRate: number
  }
}

export interface DifficultyStats {
  gamesPlayed: number
  averageWinRate: number
  averageScore: number
  winRateTrend: 'improving' | 'declining' | 'stable'
  recommendedAdjustment: DifficultyLevel | null
}

export interface DifficultyBenchmark {
  benchmarks: Record<DifficultyLevel, DifficultyStats>
  totalGamesPlayed: number
  overallWinRate: number
  mostPlayedDifficulty: DifficultyLevel | null
  mostSuccessfulDifficulty: DifficultyLevel | null
}
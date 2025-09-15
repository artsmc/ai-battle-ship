/**
 * AI Performance Monitor
 * Tracks and analyzes AI decision-making performance
 */

import {
  PerformanceMetrics,
  AIDecision,
  DifficultyLevel,
  DifficultyPerformance,
  DecisionType,
  DetectedPattern
} from './types'
import { AttackResult } from '../game/types'

export interface PerformanceSnapshot {
  timestamp: Date
  metrics: PerformanceMetrics
  gameId?: string
  difficultyLevel: DifficultyLevel
}

export interface DecisionAnalysis {
  decision: AIDecision
  executionTime: number
  memoryUsage: number
  outcome?: unknown
  qualityScore: number
  efficiency: number
}

export interface PerformanceReport {
  overallMetrics: PerformanceMetrics
  decisionAnalysis: DecisionAnalysis[]
  patterns: DetectedPattern[]
  recommendations: string[]
  improvementAreas: ImprovementArea[]
}

export interface ImprovementArea {
  area: string
  currentPerformance: number
  targetPerformance: number
  suggestions: string[]
}

export interface TimingMetrics {
  averageDecisionTime: number
  minDecisionTime: number
  maxDecisionTime: number
  medianDecisionTime: number
  standardDeviation: number
}

export class AIPerformanceMonitor {
  private performanceHistory: PerformanceSnapshot[]
  private decisionHistory: DecisionAnalysis[]
  private timingData: number[]
  private memoryUsageData: number[]
  private currentSession: SessionMetrics
  private benchmarks: Map<DifficultyLevel, BenchmarkData>

  constructor() {
    this.performanceHistory = []
    this.decisionHistory = []
    this.timingData = []
    this.memoryUsageData = []
    this.currentSession = this.initializeSession()
    this.benchmarks = this.initializeBenchmarks()
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeSession(): SessionMetrics {
    return {
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      decisionsCount: 0,
      totalThinkingTime: 0,
      successfulDecisions: 0,
      failedDecisions: 0,
      averageConfidence: 0,
      peakMemoryUsage: 0
    }
  }

  private initializeBenchmarks(): Map<DifficultyLevel, BenchmarkData> {
    const benchmarks = new Map<DifficultyLevel, BenchmarkData>()

    benchmarks.set('beginner', {
      targetAccuracy: 0.4,
      targetWinRate: 0.3,
      maxThinkingTime: 3000,
      optimalDecisionRate: 0.4,
      acceptableBlunderRate: 0.3
    })

    benchmarks.set('intermediate', {
      targetAccuracy: 0.6,
      targetWinRate: 0.5,
      maxThinkingTime: 2000,
      optimalDecisionRate: 0.6,
      acceptableBlunderRate: 0.15
    })

    benchmarks.set('advanced', {
      targetAccuracy: 0.8,
      targetWinRate: 0.7,
      maxThinkingTime: 1500,
      optimalDecisionRate: 0.8,
      acceptableBlunderRate: 0.05
    })

    benchmarks.set('expert', {
      targetAccuracy: 0.95,
      targetWinRate: 0.85,
      maxThinkingTime: 1000,
      optimalDecisionRate: 0.95,
      acceptableBlunderRate: 0.01
    })

    return benchmarks
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // =============================================
  // DECISION TRACKING
  // =============================================

  /**
   * Start tracking a decision
   */
  startDecision(decision: AIDecision): DecisionTracker {
    const startTime = performance.now()
    const startMemory = this.getCurrentMemoryUsage()

    return {
      decision,
      startTime,
      startMemory,
      complete: (outcome?: unknown) => {
        this.completeDecision(decision, startTime, startMemory, outcome)
      }
    }
  }

  /**
   * Complete tracking a decision
   */
  private completeDecision(
    decision: AIDecision,
    startTime: number,
    startMemory: number,
    outcome?: unknown
  ): void {
    const executionTime = performance.now() - startTime
    const memoryUsage = this.getCurrentMemoryUsage() - startMemory

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(decision, outcome)

    // Calculate efficiency
    const efficiency = this.calculateEfficiency(executionTime, memoryUsage, qualityScore)

    const analysis: DecisionAnalysis = {
      decision,
      executionTime,
      memoryUsage,
      outcome,
      qualityScore,
      efficiency
    }

    // Update tracking data
    this.decisionHistory.push(analysis)
    this.timingData.push(executionTime)
    this.memoryUsageData.push(memoryUsage)

    // Update session metrics
    this.updateSessionMetrics(analysis)
  }

  private calculateQualityScore(decision: AIDecision, outcome?: unknown): number {
    let score = 0.5 // Base score

    // Adjust based on confidence accuracy
    if (outcome) {
      const wasSuccessful = this.evaluateOutcome(decision, outcome)
      if (wasSuccessful) {
        score = 0.5 + (decision.confidence * 0.5)
      } else {
        score = 0.5 - ((1 - decision.confidence) * 0.5)
      }
    }

    // Penalize for too many alternatives (indecisiveness)
    if (decision.alternatives.length > 5) {
      score *= 0.9
    }

    // Bonus for clear reasoning
    if (decision.reasoning.primaryFactors.length >= 3) {
      score *= 1.1
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateEfficiency(
    executionTime: number,
    memoryUsage: number,
    qualityScore: number
  ): number {
    // Normalize execution time (0-1, where 1 is fastest)
    const timeEfficiency = Math.max(0, 1 - (executionTime / 5000))

    // Normalize memory usage (0-1, where 1 is lowest)
    const memoryEfficiency = Math.max(0, 1 - (memoryUsage / 1000000))

    // Combined efficiency score
    return (timeEfficiency * 0.3) + (memoryEfficiency * 0.2) + (qualityScore * 0.5)
  }

  private evaluateOutcome(decision: AIDecision, outcome: unknown): boolean {
    // Evaluate based on decision type
    switch (decision.type) {
      case 'attack':
        const result = outcome as AttackResult
        return result.result === 'HIT' || result.result === 'SUNK'

      case 'ability_use':
      case 'powerup_use':
        // Assume successful if no error
        return outcome !== null && outcome !== undefined

      case 'ship_placement':
        // Placement is successful if ships weren't immediately destroyed
        return true

      default:
        return true
    }
  }

  private updateSessionMetrics(analysis: DecisionAnalysis): void {
    const session = this.currentSession

    session.decisionsCount++
    session.totalThinkingTime += analysis.executionTime

    if (analysis.qualityScore > 0.6) {
      session.successfulDecisions++
    } else if (analysis.qualityScore < 0.4) {
      session.failedDecisions++
    }

    // Update average confidence
    session.averageConfidence =
      (session.averageConfidence * (session.decisionsCount - 1) + analysis.decision.confidence) /
      session.decisionsCount

    // Update peak memory
    session.peakMemoryUsage = Math.max(session.peakMemoryUsage, analysis.memoryUsage)
  }

  // =============================================
  // PERFORMANCE ANALYSIS
  // =============================================

  /**
   * Analyze timing performance
   */
  analyzeTimingPerformance(): TimingMetrics {
    if (this.timingData.length === 0) {
      return {
        averageDecisionTime: 0,
        minDecisionTime: 0,
        maxDecisionTime: 0,
        medianDecisionTime: 0,
        standardDeviation: 0
      }
    }

    const sorted = [...this.timingData].sort((a, b) => a - b)
    const avg = this.timingData.reduce((sum, t) => sum + t, 0) / this.timingData.length
    const median = sorted[Math.floor(sorted.length / 2)]

    // Calculate standard deviation
    const variance = this.timingData.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / this.timingData.length
    const stdDev = Math.sqrt(variance)

    return {
      averageDecisionTime: avg,
      minDecisionTime: sorted[0],
      maxDecisionTime: sorted[sorted.length - 1],
      medianDecisionTime: median,
      standardDeviation: stdDev
    }
  }

  /**
   * Analyze move quality over time
   */
  analyzeMoveQuality(): QualityAnalysis {
    const recentDecisions = this.decisionHistory.slice(-20)
    const olderDecisions = this.decisionHistory.slice(-40, -20)

    const recentQuality = recentDecisions.length > 0
      ? recentDecisions.reduce((sum, d) => sum + d.qualityScore, 0) / recentDecisions.length
      : 0

    const olderQuality = olderDecisions.length > 0
      ? olderDecisions.reduce((sum, d) => sum + d.qualityScore, 0) / olderDecisions.length
      : 0

    const trend = recentQuality > olderQuality ? 'improving' :
                 recentQuality < olderQuality ? 'declining' : 'stable'

    // Analyze by decision type
    const typeAnalysis = new Map<DecisionType, number>()
    const types: DecisionType[] = ['attack', 'ability_use', 'powerup_use', 'ship_placement', 'defensive_action']

    types.forEach(type => {
      const decisions = this.decisionHistory.filter(d => d.decision.type === type)
      const avgQuality = decisions.length > 0
        ? decisions.reduce((sum, d) => sum + d.qualityScore, 0) / decisions.length
        : 0
      typeAnalysis.set(type, avgQuality)
    })

    return {
      overallQuality: recentQuality,
      trend,
      byDecisionType: typeAnalysis,
      bestDecisionType: this.getBestDecisionType(typeAnalysis),
      worstDecisionType: this.getWorstDecisionType(typeAnalysis)
    }
  }

  private getBestDecisionType(typeAnalysis: Map<DecisionType, number>): DecisionType | null {
    let best: DecisionType | null = null
    let bestScore = 0

    typeAnalysis.forEach((score, type) => {
      if (score > bestScore) {
        bestScore = score
        best = type
      }
    })

    return best
  }

  private getWorstDecisionType(typeAnalysis: Map<DecisionType, number>): DecisionType | null {
    let worst: DecisionType | null = null
    let worstScore = 1

    typeAnalysis.forEach((score, type) => {
      if (score < worstScore && score > 0) {
        worstScore = score
        worst = type
      }
    })

    return worst
  }

  // =============================================
  // BENCHMARKING
  // =============================================

  /**
   * Benchmark performance against difficulty standards
   */
  benchmarkPerformance(
    currentMetrics: PerformanceMetrics,
    difficulty: DifficultyLevel
  ): BenchmarkResult {
    const benchmark = this.benchmarks.get(difficulty)
    if (!benchmark) {
      throw new Error(`No benchmark for difficulty: ${difficulty}`)
    }

    const scores = {
      accuracy: currentMetrics.averageAccuracy / benchmark.targetAccuracy,
      winRate: currentMetrics.winRate / benchmark.targetWinRate,
      decisionSpeed: benchmark.maxThinkingTime / currentMetrics.averageThinkingTime,
      optimalDecisions: currentMetrics.optimalDecisionRate / benchmark.optimalDecisionRate,
      blunderControl: (1 - currentMetrics.blunderRate) / (1 - benchmark.acceptableBlunderRate)
    }

    const overallScore = Object.values(scores).reduce((sum, s) => sum + s, 0) / Object.values(scores).length

    return {
      difficulty,
      overallScore,
      scores,
      meetsStandard: overallScore >= 0.8,
      exceedsStandard: overallScore >= 1.2,
      recommendations: this.generateBenchmarkRecommendations(scores)
    }
  }

  private generateBenchmarkRecommendations(scores: Record<string, number>): string[] {
    const recommendations: string[] = []

    if (scores.accuracy < 0.8) {
      recommendations.push('Improve targeting accuracy through better pattern recognition')
    }

    if (scores.winRate < 0.8) {
      recommendations.push('Focus on strategic improvements and ship preservation')
    }

    if (scores.decisionSpeed < 0.8) {
      recommendations.push('Optimize decision algorithms for faster processing')
    }

    if (scores.optimalDecisions < 0.8) {
      recommendations.push('Enhance decision quality evaluation')
    }

    if (scores.blunderControl < 0.8) {
      recommendations.push('Implement better error checking and validation')
    }

    return recommendations
  }

  // =============================================
  // IMPROVEMENT SUGGESTIONS
  // =============================================

  /**
   * Generate improvement suggestions based on performance
   */
  generateImprovementSuggestions(metrics: PerformanceMetrics): ImprovementArea[] {
    const improvements: ImprovementArea[] = []

    // Accuracy improvement
    if (metrics.averageAccuracy < 0.7) {
      improvements.push({
        area: 'Targeting Accuracy',
        currentPerformance: metrics.averageAccuracy,
        targetPerformance: 0.7,
        suggestions: [
          'Implement probability density targeting',
          'Improve hit follow-up logic',
          'Use pattern recognition for ship locations',
          'Maintain better shot history'
        ]
      })
    }

    // Decision quality improvement
    if (metrics.optimalDecisionRate < 0.7) {
      improvements.push({
        area: 'Decision Quality',
        currentPerformance: metrics.optimalDecisionRate,
        targetPerformance: 0.7,
        suggestions: [
          'Increase search depth for decision trees',
          'Improve heuristic evaluation functions',
          'Better risk-reward assessment',
          'Learn from past successful decisions'
        ]
      })
    }

    // Speed improvement
    if (metrics.averageThinkingTime > 2000) {
      improvements.push({
        area: 'Decision Speed',
        currentPerformance: metrics.averageThinkingTime,
        targetPerformance: 1500,
        suggestions: [
          'Implement caching for repeated calculations',
          'Use alpha-beta pruning in decision trees',
          'Optimize memory access patterns',
          'Parallelize independent computations'
        ]
      })
    }

    // Learning improvement
    if (metrics.adaptationSpeed < 0.5) {
      improvements.push({
        area: 'Adaptation Speed',
        currentPerformance: metrics.adaptationSpeed,
        targetPerformance: 0.7,
        suggestions: [
          'Increase learning rate for pattern detection',
          'Implement online learning algorithms',
          'Better opponent modeling',
          'Faster strategy switching'
        ]
      })
    }

    return improvements
  }

  // =============================================
  // REPORTING
  // =============================================

  /**
   * Generate comprehensive performance report
   */
  generateReport(
    metrics: PerformanceMetrics,
    difficulty: DifficultyLevel,
    patterns: DetectedPattern[]
  ): PerformanceReport {
    const timingMetrics = this.analyzeTimingPerformance()
    const qualityAnalysis = this.analyzeMoveQuality()
    const benchmarkResult = this.benchmarkPerformance(metrics, difficulty)
    const improvements = this.generateImprovementSuggestions(metrics)

    const recommendations = [
      ...benchmarkResult.recommendations,
      ...this.generateGeneralRecommendations(metrics, timingMetrics, qualityAnalysis)
    ]

    return {
      overallMetrics: metrics,
      decisionAnalysis: this.decisionHistory.slice(-50), // Last 50 decisions
      patterns,
      recommendations,
      improvementAreas: improvements
    }
  }

  private generateGeneralRecommendations(
    metrics: PerformanceMetrics,
    timing: TimingMetrics,
    quality: QualityAnalysis
  ): string[] {
    const recommendations: string[] = []

    // Timing recommendations
    if (timing.standardDeviation > timing.averageDecisionTime * 0.5) {
      recommendations.push('Decision timing is inconsistent - implement more predictable algorithms')
    }

    // Quality trend recommendations
    if (quality.trend === 'declining') {
      recommendations.push('Decision quality is declining - review recent strategy changes')
    }

    // Memory efficiency recommendations
    if (metrics.memoryEfficiency < 0.5) {
      recommendations.push('Memory usage is high - implement data structure optimization')
    }

    // Pattern recognition recommendations
    if (metrics.patternRecognitionRate < 0.5) {
      recommendations.push('Pattern recognition is weak - enhance pattern detection algorithms')
    }

    return recommendations
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get current memory usage (simplified)
   */
  private getCurrentMemoryUsage(): number {
    // In a real implementation, this would use actual memory profiling
    // For now, return a simulated value based on data structure sizes
    return this.decisionHistory.length * 100 +
           this.timingData.length * 8 +
           this.memoryUsageData.length * 8
  }

  /**
   * Reset monitoring for new game
   */
  reset(): void {
    this.currentSession = this.initializeSession()
    this.decisionHistory = []
    this.timingData = []
    this.memoryUsageData = []
  }

  /**
   * Save performance snapshot
   */
  saveSnapshot(metrics: PerformanceMetrics, difficulty: DifficultyLevel, gameId?: string): void {
    this.performanceHistory.push({
      timestamp: new Date(),
      metrics: { ...metrics },
      gameId,
      difficultyLevel: difficulty
    })

    // Keep only last 1000 snapshots
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.shift()
    }
  }

  /**
   * Get performance history
   */
  getHistory(): PerformanceSnapshot[] {
    return [...this.performanceHistory]
  }

  /**
   * Export performance data
   */
  exportData(): string {
    return JSON.stringify({
      history: this.performanceHistory,
      currentSession: this.currentSession,
      decisionHistory: this.decisionHistory.slice(-100),
      timingData: this.timingData.slice(-100)
    }, null, 2)
  }
}

// =============================================
// SUPPORTING TYPES
// =============================================

interface SessionMetrics {
  sessionId: string
  startTime: Date
  decisionsCount: number
  totalThinkingTime: number
  successfulDecisions: number
  failedDecisions: number
  averageConfidence: number
  peakMemoryUsage: number
}

interface BenchmarkData {
  targetAccuracy: number
  targetWinRate: number
  maxThinkingTime: number
  optimalDecisionRate: number
  acceptableBlunderRate: number
}

interface BenchmarkResult {
  difficulty: DifficultyLevel
  overallScore: number
  scores: Record<string, number>
  meetsStandard: boolean
  exceedsStandard: boolean
  recommendations: string[]
}

interface QualityAnalysis {
  overallQuality: number
  trend: 'improving' | 'declining' | 'stable'
  byDecisionType: Map<DecisionType, number>
  bestDecisionType: DecisionType | null
  worstDecisionType: DecisionType | null
}

export interface DecisionTracker {
  decision: AIDecision
  startTime: number
  startMemory: number
  complete: (outcome?: unknown) => void
}
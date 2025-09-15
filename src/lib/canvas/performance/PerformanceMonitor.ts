/**
 * PerformanceMonitor
 *
 * Performance monitoring and optimization utilities for the ship rendering system.
 * Tracks FPS, memory usage, and provides adaptive quality settings.
 */

import React from 'react'

export interface PerformanceMetrics {
  fps: number
  averageFPS: number
  frameTime: number
  memoryUsage: number
  activeAnimations: number
  renderedSprites: number
  drawCalls: number
  timestamp: number
}

export interface PerformanceConfig {
  targetFPS: number
  minFPS: number
  memoryThreshold: number
  adaptiveQuality: boolean
  enableProfiling: boolean
  sampleSize: number
}

export interface AdaptiveSettings {
  enableAnimations: boolean
  enableEffects: boolean
  maxAnimations: number
  spriteQuality: 'low' | 'medium' | 'high'
  particleLimit: number
  enableAtlases: boolean
}

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  minFPS: 30,
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  adaptiveQuality: true,
  enableProfiling: false,
  sampleSize: 60
}

/**
 * Performance monitoring and adaptive quality management
 */
export class PerformanceMonitor {
  private config: PerformanceConfig
  private metrics: PerformanceMetrics[] = []
  private isRunning = false
  private startTime = 0
  private frameCount = 0
  private lastFrameTime = 0
  private rafId = 0

  private listeners = new Set<(metrics: PerformanceMetrics) => void>()
  private qualityListeners = new Set<(settings: AdaptiveSettings) => void>()

  private currentSettings: AdaptiveSettings = {
    enableAnimations: true,
    enableEffects: true,
    maxAnimations: 10,
    spriteQuality: 'high',
    particleLimit: 100,
    enableAtlases: true
  }

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...config }
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.startTime = performance.now()
    this.frameCount = 0
    this.lastFrameTime = this.startTime

    this.tick()
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  /**
   * Performance monitoring loop
   */
  private tick(): void {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    this.frameCount++

    // Calculate FPS
    const instantFPS = 1000 / deltaTime
    const elapsedTime = currentTime - this.startTime
    const averageFPS = (this.frameCount * 1000) / elapsedTime

    // Collect metrics
    const metrics: PerformanceMetrics = {
      fps: instantFPS,
      averageFPS,
      frameTime: deltaTime,
      memoryUsage: this.getMemoryUsage(),
      activeAnimations: this.getActiveAnimationCount(),
      renderedSprites: this.getRenderedSpriteCount(),
      drawCalls: this.getDrawCallCount(),
      timestamp: currentTime
    }

    // Store metrics
    this.metrics.push(metrics)
    if (this.metrics.length > this.config.sampleSize) {
      this.metrics.shift()
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metrics))

    // Adaptive quality adjustment
    if (this.config.adaptiveQuality) {
      this.adjustQuality(metrics)
    }

    this.lastFrameTime = currentTime
    this.rafId = requestAnimationFrame(() => this.tick())
  }

  /**
   * Adjust quality settings based on performance
   */
  private adjustQuality(metrics: PerformanceMetrics): void {
    const recentMetrics = this.metrics.slice(-10) // Last 10 frames
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length

    let qualityChanged = false
    const newSettings = { ...this.currentSettings }

    // Performance is too low - reduce quality
    if (avgFPS < this.config.minFPS) {
      if (newSettings.enableEffects) {
        newSettings.enableEffects = false
        qualityChanged = true
      } else if (newSettings.maxAnimations > 5) {
        newSettings.maxAnimations = Math.max(5, newSettings.maxAnimations - 2)
        qualityChanged = true
      } else if (newSettings.particleLimit > 20) {
        newSettings.particleLimit = Math.max(20, newSettings.particleLimit - 20)
        qualityChanged = true
      } else if (newSettings.spriteQuality !== 'low') {
        newSettings.spriteQuality = newSettings.spriteQuality === 'high' ? 'medium' : 'low'
        qualityChanged = true
      } else if (newSettings.enableAnimations) {
        newSettings.enableAnimations = false
        qualityChanged = true
      }
    }

    // Performance is good - increase quality
    else if (avgFPS > this.config.targetFPS * 0.9 && avgFPS < this.config.targetFPS * 1.1) {
      if (!newSettings.enableAnimations) {
        newSettings.enableAnimations = true
        qualityChanged = true
      } else if (newSettings.spriteQuality !== 'high') {
        newSettings.spriteQuality = newSettings.spriteQuality === 'low' ? 'medium' : 'high'
        qualityChanged = true
      } else if (newSettings.particleLimit < 100) {
        newSettings.particleLimit = Math.min(100, newSettings.particleLimit + 20)
        qualityChanged = true
      } else if (newSettings.maxAnimations < 10) {
        newSettings.maxAnimations = Math.min(10, newSettings.maxAnimations + 2)
        qualityChanged = true
      } else if (!newSettings.enableEffects) {
        newSettings.enableEffects = true
        qualityChanged = true
      }
    }

    // Memory pressure - reduce memory-intensive features
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      if (newSettings.enableAtlases) {
        newSettings.enableAtlases = false
        qualityChanged = true
      }
    }

    if (qualityChanged) {
      this.currentSettings = newSettings
      this.qualityListeners.forEach(listener => listener(newSettings))

      if (this.config.enableProfiling) {
        console.log('Performance: Quality adjusted', {
          fps: avgFPS.toFixed(1),
          settings: newSettings
        })
      }
    }
  }

  /**
   * Get memory usage estimate
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * Get active animation count (would be provided by animation system)
   */
  private getActiveAnimationCount(): number {
    // This would be integrated with the actual animation system
    return 0
  }

  /**
   * Get rendered sprite count (would be provided by rendering system)
   */
  private getRenderedSpriteCount(): number {
    // This would be integrated with the actual rendering system
    return 0
  }

  /**
   * Get draw call count estimate
   */
  private getDrawCallCount(): number {
    // Rough estimate based on current settings
    return this.getRenderedSpriteCount() + this.getActiveAnimationCount()
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Get average performance over time period
   */
  getAverageMetrics(timeSpanMs: number = 1000): Partial<PerformanceMetrics> | null {
    if (this.metrics.length === 0) return null

    const now = performance.now()
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeSpanMs)

    if (recentMetrics.length === 0) return null

    return {
      fps: recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length,
      frameTime: recentMetrics.reduce((sum, m) => sum + m.frameTime, 0) / recentMetrics.length,
      memoryUsage: recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length
    }
  }

  /**
   * Get current adaptive settings
   */
  getCurrentSettings(): AdaptiveSettings {
    return { ...this.currentSettings }
  }

  /**
   * Override adaptive settings
   */
  overrideSettings(settings: Partial<AdaptiveSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings }
    this.qualityListeners.forEach(listener => listener(this.currentSettings))
  }

  /**
   * Reset to default settings
   */
  resetSettings(): void {
    this.currentSettings = {
      enableAnimations: true,
      enableEffects: true,
      maxAnimations: 10,
      spriteQuality: 'high',
      particleLimit: 100,
      enableAtlases: true
    }
    this.qualityListeners.forEach(listener => listener(this.currentSettings))
  }

  /**
   * Listen to performance updates
   */
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Listen to quality setting changes
   */
  onQualityChange(callback: (settings: AdaptiveSettings) => void): () => void {
    this.qualityListeners.add(callback)
    return () => this.qualityListeners.delete(callback)
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    const current = this.getCurrentMetrics()
    if (!current) return true

    const recent = this.getAverageMetrics(2000) // Last 2 seconds
    if (!recent || !recent.fps) return true

    return recent.fps >= this.config.minFPS
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const recent = this.getAverageMetrics(2000)
    if (!recent || !recent.fps) return 'A'

    const fps = recent.fps
    const target = this.config.targetFPS

    if (fps >= target * 0.9) return 'A'
    if (fps >= target * 0.7) return 'B'
    if (fps >= target * 0.5) return 'C'
    if (fps >= this.config.minFPS) return 'D'
    return 'F'
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: string
    metrics: Partial<PerformanceMetrics>
    settings: AdaptiveSettings
    recommendations: string[]
  } {
    const recent = this.getAverageMetrics(5000) // Last 5 seconds
    const grade = this.getPerformanceGrade()
    const recommendations: string[] = []

    // Generate recommendations
    if (grade === 'F') {
      recommendations.push('Consider disabling animations and effects')
      recommendations.push('Use lower quality sprites')
      recommendations.push('Reduce number of visible ships')
    } else if (grade === 'D') {
      recommendations.push('Consider reducing particle effects')
      recommendations.push('Limit concurrent animations')
    } else if (grade === 'A') {
      recommendations.push('Performance is excellent - all features can be enabled')
    }

    // Memory recommendations
    if (recent?.memoryUsage && recent.memoryUsage > this.config.memoryThreshold * 0.8) {
      recommendations.push('Memory usage is high - consider clearing sprite cache')
    }

    return {
      summary: `Performance Grade: ${grade} (${recent?.fps?.toFixed(1) || 'N/A'} FPS)`,
      metrics: recent || {},
      settings: this.currentSettings,
      recommendations
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop()
    this.metrics.length = 0
    this.listeners.clear()
    this.qualityListeners.clear()
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = (autoStart = true) => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null)
  const [settings, setSettings] = React.useState<AdaptiveSettings>(
    globalPerformanceMonitor.getCurrentSettings()
  )

  React.useEffect(() => {
    if (autoStart) {
      globalPerformanceMonitor.start()
    }

    const unsubscribeMetrics = globalPerformanceMonitor.onMetricsUpdate(setMetrics)
    const unsubscribeSettings = globalPerformanceMonitor.onQualityChange(setSettings)

    return () => {
      unsubscribeMetrics()
      unsubscribeSettings()
      if (autoStart) {
        globalPerformanceMonitor.stop()
      }
    }
  }, [autoStart])

  return {
    metrics,
    settings,
    monitor: globalPerformanceMonitor
  }
}
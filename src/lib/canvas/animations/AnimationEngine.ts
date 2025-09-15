/**
 * AnimationEngine
 *
 * Central animation management system for ship movements, effects, and transitions.
 * Provides 60fps performance with efficient batching and timing control.
 */

export interface AnimationKeyframe {
  time: number // 0 to 1
  value: number
  ease?: EasingFunction
}

export interface AnimationState {
  id: string
  startTime: number
  duration: number
  isPlaying: boolean
  isPaused: boolean
  isReversed: boolean
  loop: boolean
  loopCount: number
  currentLoop: number
}

export interface AnimationProps {
  [key: string]: {
    startValue: number
    endValue: number
    keyframes?: AnimationKeyframe[]
  }
}

export interface Animation {
  id: string
  target: string | object
  duration: number
  properties: AnimationProps
  ease: EasingFunction
  loop: boolean
  loopCount: number
  delay: number
  onUpdate?: (values: Record<string, number>, progress: number) => void
  onComplete?: () => void
  onLoopComplete?: (loopNumber: number) => void
}

export type EasingFunction = (t: number) => number

/**
 * Standard easing functions
 */
export const Easing = {
  linear: (t: number): number => t,

  // Quad
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Elastic
  easeInElastic: (t: number): number => {
    if (t === 0) return 0
    if (t === 1) return 1
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
  },
  easeOutElastic: (t: number): number => {
    if (t === 0) return 0
    if (t === 1) return 1
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1
  },

  // Bounce
  easeOutBounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },

  // Ship-specific easing for naval movements
  shipBob: (t: number): number => Math.sin(t * Math.PI * 2) * 0.1,
  shipRoll: (t: number): number => Math.sin(t * Math.PI * 4) * 0.05,
  waveMotion: (t: number): number => Math.sin(t * Math.PI * 6) * 0.03
}

/**
 * High-performance animation engine with 60fps targeting
 */
export class AnimationEngine {
  private animations = new Map<string, Animation>()
  private animationStates = new Map<string, AnimationState>()
  private isRunning = false
  private lastTime = 0
  private frameId = 0
  private targetFPS = 60
  private frameTime = 1000 / 60 // 16.67ms
  private deltaAccumulator = 0

  private updateCallbacks = new Set<() => void>()
  private beforeUpdateCallbacks = new Set<() => void>()
  private afterUpdateCallbacks = new Set<() => void>()

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS
    this.frameTime = 1000 / targetFPS
  }

  /**
   * Create and start an animation
   */
  animate(animation: Omit<Animation, 'id'> & { id?: string }): string {
    const id = animation.id || this.generateAnimationId()

    const fullAnimation: Animation = {
      id,
      ease: Easing.easeOutCubic,
      loop: false,
      loopCount: 1,
      delay: 0,
      ...animation
    }

    this.animations.set(id, fullAnimation)

    const state: AnimationState = {
      id,
      startTime: Date.now() + fullAnimation.delay,
      duration: fullAnimation.duration,
      isPlaying: true,
      isPaused: false,
      isReversed: false,
      loop: fullAnimation.loop,
      loopCount: fullAnimation.loopCount,
      currentLoop: 0
    }

    this.animationStates.set(id, state)

    // Start engine if not running
    if (!this.isRunning) {
      this.start()
    }

    return id
  }

  /**
   * Create tween animation for specific properties
   */
  tween(
    target: string | object,
    properties: Record<string, number>,
    duration: number,
    options: {
      ease?: EasingFunction
      delay?: number
      onUpdate?: (values: Record<string, number>) => void
      onComplete?: () => void
    } = {}
  ): string {
    // Get current values (would need to be implemented based on target type)
    const startValues: Record<string, number> = {}

    // For now, assume target is an object with numeric properties
    if (typeof target === 'object') {
      Object.keys(properties).forEach(key => {
        startValues[key] = (target as any)[key] || 0
      })
    }

    const animationProps: AnimationProps = {}
    Object.keys(properties).forEach(key => {
      animationProps[key] = {
        startValue: startValues[key] || 0,
        endValue: properties[key]
      }
    })

    return this.animate({
      target,
      duration,
      properties: animationProps,
      ease: options.ease || Easing.easeOutCubic,
      delay: options.delay || 0,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete
    })
  }

  /**
   * Create sequence of animations
   */
  sequence(animations: Omit<Animation, 'id' | 'delay'>[]): string[] {
    const ids: string[] = []
    let cumulativeDelay = 0

    animations.forEach(anim => {
      const id = this.animate({
        ...anim,
        delay: cumulativeDelay
      })
      ids.push(id)
      cumulativeDelay += anim.duration
    })

    return ids
  }

  /**
   * Create parallel animations
   */
  parallel(animations: Omit<Animation, 'id'>[]): string[] {
    return animations.map(anim => this.animate(anim))
  }

  /**
   * Pause animation
   */
  pause(animationId: string): void {
    const state = this.animationStates.get(animationId)
    if (state && state.isPlaying) {
      state.isPaused = true
    }
  }

  /**
   * Resume animation
   */
  resume(animationId: string): void {
    const state = this.animationStates.get(animationId)
    if (state && state.isPaused) {
      state.isPaused = false
      // Adjust start time to account for pause duration
      const currentTime = Date.now()
      const pauseDuration = currentTime - state.startTime
      state.startTime = currentTime - pauseDuration
    }
  }

  /**
   * Stop and remove animation
   */
  stop(animationId: string): void {
    this.animations.delete(animationId)
    this.animationStates.delete(animationId)

    if (this.animations.size === 0 && this.isRunning) {
      this.pause()
    }
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.animations.clear()
    this.animationStates.clear()
    if (this.isRunning) {
      this.pause()
    }
  }

  /**
   * Start the animation engine
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTime = Date.now()
    this.tick()
  }

  /**
   * Pause the animation engine
   */
  pause(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = 0
    }
  }

  /**
   * Main animation loop with frame rate control
   */
  private tick(): void {
    if (!this.isRunning) return

    const currentTime = Date.now()
    const deltaTime = currentTime - this.lastTime

    // Accumulate delta time
    this.deltaAccumulator += deltaTime

    // Update animations at target frame rate
    while (this.deltaAccumulator >= this.frameTime) {
      this.beforeUpdateCallbacks.forEach(callback => callback())
      this.updateAnimations(currentTime)
      this.updateCallbacks.forEach(callback => callback())
      this.afterUpdateCallbacks.forEach(callback => callback())

      this.deltaAccumulator -= this.frameTime
    }

    this.lastTime = currentTime

    // Continue animation loop
    this.frameId = requestAnimationFrame(() => this.tick())
  }

  /**
   * Update all active animations
   */
  private updateAnimations(currentTime: number): void {
    const completedAnimations: string[] = []

    for (const [id, animation] of this.animations) {
      const state = this.animationStates.get(id)!

      if (!state.isPlaying || state.isPaused || currentTime < state.startTime) {
        continue
      }

      const elapsed = currentTime - state.startTime
      let progress = Math.min(elapsed / state.duration, 1)

      // Apply easing
      const easedProgress = animation.ease(progress)

      // Calculate property values
      const values: Record<string, number> = {}

      for (const [propName, propData] of Object.entries(animation.properties)) {
        if (propData.keyframes) {
          values[propName] = this.interpolateKeyframes(propData.keyframes, easedProgress)
        } else {
          values[propName] = this.lerp(propData.startValue, propData.endValue, easedProgress)
        }
      }

      // Call update callback
      if (animation.onUpdate) {
        animation.onUpdate(values, progress)
      }

      // Check if animation is complete
      if (progress >= 1) {
        if (state.loop && (state.loopCount === -1 || state.currentLoop < state.loopCount - 1)) {
          // Loop animation
          state.currentLoop++
          state.startTime = currentTime

          if (animation.onLoopComplete) {
            animation.onLoopComplete(state.currentLoop)
          }
        } else {
          // Complete animation
          completedAnimations.push(id)

          if (animation.onComplete) {
            animation.onComplete()
          }
        }
      }
    }

    // Remove completed animations
    completedAnimations.forEach(id => this.stop(id))

    // Stop engine if no animations
    if (this.animations.size === 0) {
      this.pause()
    }
  }

  /**
   * Linear interpolation
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  /**
   * Interpolate between keyframes
   */
  private interpolateKeyframes(keyframes: AnimationKeyframe[], progress: number): number {
    if (keyframes.length === 0) return 0
    if (keyframes.length === 1) return keyframes[0].value

    // Sort keyframes by time
    const sorted = [...keyframes].sort((a, b) => a.time - b.time)

    // Find surrounding keyframes
    let prevFrame = sorted[0]
    let nextFrame = sorted[sorted.length - 1]

    for (let i = 0; i < sorted.length - 1; i++) {
      if (progress >= sorted[i].time && progress <= sorted[i + 1].time) {
        prevFrame = sorted[i]
        nextFrame = sorted[i + 1]
        break
      }
    }

    if (prevFrame === nextFrame) {
      return prevFrame.value
    }

    // Calculate local progress between keyframes
    const localProgress = (progress - prevFrame.time) / (nextFrame.time - prevFrame.time)

    // Apply keyframe-specific easing
    const easedProgress = nextFrame.ease ? nextFrame.ease(localProgress) : localProgress

    return this.lerp(prevFrame.value, nextFrame.value, easedProgress)
  }

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Add update callback
   */
  onUpdate(callback: () => void): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  /**
   * Add before-update callback
   */
  onBeforeUpdate(callback: () => void): () => void {
    this.beforeUpdateCallbacks.add(callback)
    return () => this.beforeUpdateCallbacks.delete(callback)
  }

  /**
   * Add after-update callback
   */
  onAfterUpdate(callback: () => void): () => void {
    this.afterUpdateCallbacks.add(callback)
    return () => this.afterUpdateCallbacks.delete(callback)
  }

  /**
   * Get animation statistics
   */
  getStats() {
    return {
      activeAnimations: this.animations.size,
      isRunning: this.isRunning,
      targetFPS: this.targetFPS,
      frameTime: this.frameTime,
      animationIds: Array.from(this.animations.keys())
    }
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps
    this.frameTime = 1000 / fps
  }

  /**
   * Check if animation exists
   */
  hasAnimation(id: string): boolean {
    return this.animations.has(id)
  }

  /**
   * Get animation progress
   */
  getAnimationProgress(id: string): number {
    const animation = this.animations.get(id)
    const state = this.animationStates.get(id)

    if (!animation || !state) return 0

    const elapsed = Date.now() - state.startTime
    return Math.min(elapsed / state.duration, 1)
  }

  /**
   * Clean up engine
   */
  destroy(): void {
    this.stopAll()
    this.pause()
    this.updateCallbacks.clear()
    this.beforeUpdateCallbacks.clear()
    this.afterUpdateCallbacks.clear()
  }
}

/**
 * Global animation engine instance
 */
export const globalAnimationEngine = new AnimationEngine(60)
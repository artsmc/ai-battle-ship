/**
 * AnimationQueue
 *
 * Manages complex animation sequences, batching, and timing coordination.
 * Ensures smooth gameplay flow with proper animation ordering.
 */

import { AnimationEngine, Animation } from './AnimationEngine'

export interface QueuedAnimation extends Omit<Animation, 'id'> {
  id?: string
  priority: number
  category: AnimationCategory
  blocking: boolean // Whether this animation blocks others in the same category
  dependencies?: string[] // IDs of animations that must complete first
}

export type AnimationCategory =
  | 'placement'
  | 'movement'
  | 'combat'
  | 'damage'
  | 'effects'
  | 'ui'
  | 'background'

export interface AnimationBatch {
  id: string
  animations: QueuedAnimation[]
  parallel: boolean
  onBatchComplete?: () => void
}

export interface QueueConfig {
  maxConcurrentAnimations: number
  categoryLimits: Partial<Record<AnimationCategory, number>>
  priorityThreshold: number
  enableInterruption: boolean
}

const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxConcurrentAnimations: 8,
  categoryLimits: {
    combat: 3,
    movement: 2,
    damage: 4,
    effects: 6,
    ui: 2,
    background: -1 // Unlimited
  },
  priorityThreshold: 100,
  enableInterruption: false
}

/**
 * Advanced animation queue with priority and dependency management
 */
export class AnimationQueue {
  private engine: AnimationEngine
  private config: QueueConfig
  private queue: QueuedAnimation[] = []
  private activeBatches = new Map<string, AnimationBatch>()
  private activeAnimations = new Map<string, QueuedAnimation>()
  private categoryCounters = new Map<AnimationCategory, number>()
  private completedAnimations = new Set<string>()

  private batchCompletionCallbacks = new Map<string, () => void>()
  private onQueueEmptyCallback?: () => void
  private onAnimationCompleteCallback?: (animationId: string) => void

  constructor(engine: AnimationEngine, config: Partial<QueueConfig> = {}) {
    this.engine = engine
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config }

    // Initialize category counters
    Object.values(['placement', 'movement', 'combat', 'damage', 'effects', 'ui', 'background'] as AnimationCategory[])
      .forEach(category => this.categoryCounters.set(category, 0))

    // Listen to engine updates
    this.engine.onAfterUpdate(() => this.processQueue())
  }

  /**
   * Add single animation to queue
   */
  enqueue(animation: QueuedAnimation): string {
    const id = animation.id || this.generateAnimationId()
    const queuedAnimation = { ...animation, id }

    this.queue.push(queuedAnimation)
    this.sortQueue()

    return id
  }

  /**
   * Add batch of animations
   */
  enqueueBatch(batch: AnimationBatch): string {
    const batchId = batch.id || this.generateBatchId()

    // Add all animations to queue with batch reference
    batch.animations.forEach(anim => {
      const id = this.enqueue({
        ...anim,
        id: anim.id || `${batchId}_${this.generateAnimationId()}`
      })
    })

    this.activeBatches.set(batchId, { ...batch, id: batchId })

    if (batch.onBatchComplete) {
      this.batchCompletionCallbacks.set(batchId, batch.onBatchComplete)
    }

    return batchId
  }

  /**
   * Add sequence of animations (one after another)
   */
  enqueueSequence(animations: QueuedAnimation[]): string[] {
    const ids: string[] = []

    animations.forEach((anim, index) => {
      const id = this.enqueue({
        ...anim,
        dependencies: index > 0 ? [ids[index - 1]] : anim.dependencies
      })
      ids.push(id)
    })

    return ids
  }

  /**
   * Add parallel animations (all at once)
   */
  enqueueParallel(animations: QueuedAnimation[]): string[] {
    return animations.map(anim => this.enqueue(anim))
  }

  /**
   * Remove animation from queue or stop if active
   */
  remove(animationId: string): boolean {
    // Remove from queue if not started
    const queueIndex = this.queue.findIndex(anim => anim.id === animationId)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
      return true
    }

    // Stop if currently active
    if (this.activeAnimations.has(animationId)) {
      this.engine.stop(animationId)
      this.handleAnimationComplete(animationId)
      return true
    }

    return false
  }

  /**
   * Clear entire queue
   */
  clear(): void {
    // Stop all active animations
    this.activeAnimations.forEach((_, id) => {
      this.engine.stop(id)
    })

    this.queue.length = 0
    this.activeAnimations.clear()
    this.activeBatches.clear()
    this.categoryCounters.forEach((_, category) => {
      this.categoryCounters.set(category, 0)
    })
    this.completedAnimations.clear()
    this.batchCompletionCallbacks.clear()
  }

  /**
   * Pause all animations in category
   */
  pauseCategory(category: AnimationCategory): void {
    this.activeAnimations.forEach((anim, id) => {
      if (anim.category === category) {
        this.engine.pause(id)
      }
    })
  }

  /**
   * Resume all animations in category
   */
  resumeCategory(category: AnimationCategory): void {
    this.activeAnimations.forEach((anim, id) => {
      if (anim.category === category) {
        this.engine.resume(id)
      }
    })
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeAnimations: this.activeAnimations.size,
      activeBatches: this.activeBatches.size,
      categoryCounters: Object.fromEntries(this.categoryCounters),
      completedAnimations: this.completedAnimations.size
    }
  }

  /**
   * Process animation queue
   */
  private processQueue(): void {
    if (this.queue.length === 0 && this.activeAnimations.size === 0) {
      if (this.onQueueEmptyCallback) {
        this.onQueueEmptyCallback()
      }
      return
    }

    // Check for completed animations
    this.checkCompletedAnimations()

    // Start new animations if capacity allows
    this.startQueuedAnimations()

    // Check batch completions
    this.checkBatchCompletions()
  }

  /**
   * Check which animations have completed
   */
  private checkCompletedAnimations(): void {
    const completedIds: string[] = []

    this.activeAnimations.forEach((anim, id) => {
      if (!this.engine.hasAnimation(id)) {
        completedIds.push(id)
      }
    })

    completedIds.forEach(id => this.handleAnimationComplete(id))
  }

  /**
   * Handle animation completion
   */
  private handleAnimationComplete(animationId: string): void {
    const animation = this.activeAnimations.get(animationId)
    if (!animation) return

    // Update category counter
    const currentCount = this.categoryCounters.get(animation.category) || 0
    this.categoryCounters.set(animation.category, Math.max(0, currentCount - 1))

    // Remove from active
    this.activeAnimations.delete(animationId)

    // Mark as completed
    this.completedAnimations.add(animationId)

    // Callback
    if (this.onAnimationCompleteCallback) {
      this.onAnimationCompleteCallback(animationId)
    }
  }

  /**
   * Start queued animations if capacity allows
   */
  private startQueuedAnimations(): void {
    if (this.activeAnimations.size >= this.config.maxConcurrentAnimations) {
      return
    }

    const readyAnimations = this.queue.filter(anim => this.canStartAnimation(anim))

    // Sort by priority
    readyAnimations.sort((a, b) => b.priority - a.priority)

    for (const animation of readyAnimations) {
      if (this.activeAnimations.size >= this.config.maxConcurrentAnimations) {
        break
      }

      const categoryLimit = this.config.categoryLimits[animation.category]
      const currentCategoryCount = this.categoryCounters.get(animation.category) || 0

      if (categoryLimit !== undefined && categoryLimit > 0 && currentCategoryCount >= categoryLimit) {
        continue
      }

      this.startAnimation(animation)
    }
  }

  /**
   * Check if animation can be started
   */
  private canStartAnimation(animation: QueuedAnimation): boolean {
    // Check dependencies
    if (animation.dependencies) {
      for (const depId of animation.dependencies) {
        if (!this.completedAnimations.has(depId)) {
          return false
        }
      }
    }

    // Check blocking animations in same category
    if (animation.blocking) {
      const hasBlockingInCategory = Array.from(this.activeAnimations.values())
        .some(active => active.category === animation.category && active.blocking)

      if (hasBlockingInCategory) {
        return false
      }
    }

    // Check category limits
    const categoryLimit = this.config.categoryLimits[animation.category]
    const currentCategoryCount = this.categoryCounters.get(animation.category) || 0

    if (categoryLimit !== undefined && categoryLimit > 0 && currentCategoryCount >= categoryLimit) {
      return false
    }

    return true
  }

  /**
   * Start individual animation
   */
  private startAnimation(animation: QueuedAnimation): void {
    // Remove from queue
    const queueIndex = this.queue.findIndex(anim => anim.id === animation.id)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
    }

    // Create engine animation
    const engineAnimation: Animation = {
      id: animation.id!,
      target: animation.target,
      duration: animation.duration,
      properties: animation.properties,
      ease: animation.ease,
      loop: animation.loop,
      loopCount: animation.loopCount,
      delay: animation.delay,
      onUpdate: animation.onUpdate,
      onComplete: () => {
        if (animation.onComplete) {
          animation.onComplete()
        }
        this.handleAnimationComplete(animation.id!)
      }
    }

    // Start animation in engine
    this.engine.animate(engineAnimation)

    // Add to active
    this.activeAnimations.set(animation.id!, animation)

    // Update category counter
    const currentCount = this.categoryCounters.get(animation.category) || 0
    this.categoryCounters.set(animation.category, currentCount + 1)
  }

  /**
   * Check batch completions
   */
  private checkBatchCompletions(): void {
    const completedBatches: string[] = []

    this.activeBatches.forEach((batch, batchId) => {
      const batchAnimationIds = batch.animations.map(anim => anim.id).filter(id => id)
      const allCompleted = batchAnimationIds.every(id => this.completedAnimations.has(id))

      if (allCompleted) {
        completedBatches.push(batchId)
      }
    })

    completedBatches.forEach(batchId => {
      const callback = this.batchCompletionCallbacks.get(batchId)
      if (callback) {
        callback()
        this.batchCompletionCallbacks.delete(batchId)
      }
      this.activeBatches.delete(batchId)
    })
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `queue_anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set callback for when queue becomes empty
   */
  onQueueEmpty(callback: () => void): void {
    this.onQueueEmptyCallback = callback
  }

  /**
   * Set callback for animation completion
   */
  onAnimationComplete(callback: (animationId: string) => void): void {
    this.onAnimationCompleteCallback = callback
  }

  /**
   * Get animations in category
   */
  getAnimationsByCategory(category: AnimationCategory): QueuedAnimation[] {
    const queued = this.queue.filter(anim => anim.category === category)
    const active = Array.from(this.activeAnimations.values())
      .filter(anim => anim.category === category)

    return [...queued, ...active]
  }

  /**
   * Check if category has active animations
   */
  isCategoryActive(category: AnimationCategory): boolean {
    return (this.categoryCounters.get(category) || 0) > 0
  }

  /**
   * Interrupt animations with lower priority
   */
  interruptLowerPriority(priority: number): string[] {
    if (!this.config.enableInterruption) {
      return []
    }

    const interruptedIds: string[] = []

    this.activeAnimations.forEach((anim, id) => {
      if (anim.priority < priority) {
        this.engine.stop(id)
        interruptedIds.push(id)
      }
    })

    return interruptedIds
  }
}

/**
 * Global animation queue instance
 */
export let globalAnimationQueue: AnimationQueue

/**
 * Initialize global animation queue
 */
export function initializeAnimationQueue(engine: AnimationEngine): AnimationQueue {
  globalAnimationQueue = new AnimationQueue(engine)
  return globalAnimationQueue
}
/**
 * Animation System Index
 *
 * Centralized exports for the animation engine and ship animations.
 */

export {
  AnimationEngine,
  globalAnimationEngine,
  Easing,
  type Animation,
  type AnimationProps,
  type AnimationKeyframe,
  type AnimationState,
  type EasingFunction
} from './AnimationEngine'

export {
  AnimationQueue,
  globalAnimationQueue,
  initializeAnimationQueue,
  type QueuedAnimation,
  type AnimationCategory,
  type AnimationBatch
} from './AnimationQueue'

export {
  ShipAnimationFactory,
  ShipAnimationPresets,
  type ShipAnimationConfig
} from './ShipAnimations'
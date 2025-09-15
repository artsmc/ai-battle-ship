/**
 * Ship Rendering Components Index
 *
 * Centralized exports for all ship rendering components and systems.
 * Provides a complete ship visual system with sprites, animations, and effects.
 */

// Core Components
export { ShipRenderer, type ShipRenderConfig, type ShipRendererProps } from './ShipRenderer'
export { ShipSprite, type ShipSpriteProps } from './ShipSprite'
export { DamageVisualizer, type DamageState, type DamageVisualizerProps } from './DamageVisualizer'
export {
  ShipAnimations,
  PlacementAnimation,
  CombatAnimation,
  MovementAnimation,
  type AnimationTrigger,
  type ShipAnimationsProps
} from './ShipAnimations'

// Sprite Management System
export {
  ShipSpriteManager,
  type ShipSpriteConfig,
  type ShipVisualConfig,
  type RenderableSprite
} from '../../../lib/canvas/sprites/ShipSpriteManager'

export {
  SpriteLoader,
  SpriteAtlas,
  type SpriteData,
  type SpriteFrame,
  type AtlasData,
  type LoadingProgress
} from '../../../lib/canvas/sprites'

// Animation System
export {
  AnimationEngine,
  AnimationQueue,
  ShipAnimationFactory,
  globalAnimationEngine,
  globalAnimationQueue,
  type Animation,
  type AnimationProps,
  type QueuedAnimation,
  Easing
} from '../../../lib/canvas/animations'

// Ability Visualization
export { AbilityEffectsRenderer } from './AbilityEffectsRenderer'

// Ship Factory for easy component creation
export { ShipComponentFactory } from './ShipComponentFactory'
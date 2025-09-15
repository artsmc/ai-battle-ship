/**
 * Canvas System Index
 *
 * Complete ship rendering system for the Battleship Naval Strategy Game.
 * Provides all components, systems, and utilities for rendering ships with
 * historical accuracy, animations, damage visualization, and ability effects.
 */

// Core Canvas System
export {
  CanvasCoordinateTransform,
  createResponsiveCoordinateTransform,
  getOptimalCellSize,
  isValidGridCoordinate,
  GRID_CONSTANTS,
  DEFAULT_CANVAS_OPTIONS,
} from './CoordinateTransform'

export {
  CanvasEventHandler,
  debounce,
  throttle,
  DEFAULT_EVENT_OPTIONS,
} from './EventHandler'

export {
  ResponsiveCanvas,
  createResponsiveCanvas,
  getDeviceCategory,
  getOptimalBoardSize,
  supportsHighPerformanceRendering,
  getPerformanceRenderingOptions,
  DEFAULT_BREAKPOINTS,
  DEFAULT_RESPONSIVE_OPTIONS,
} from './ResponsiveCanvas'

// Ship Sprite System
export * from './sprites'

// Animation System
export * from './animations'

// Ship Rendering Components (Re-export for convenience)
export {
  ShipRenderer,
  ShipSprite,
  DamageVisualizer,
  ShipAnimations,
  AbilityEffectsRenderer,
  ShipComponentFactory,
  createShipConfig,
  useShipComponentFactory
} from '../../components/canvas/ships'

// Performance Monitoring
export {
  PerformanceMonitor,
  globalPerformanceMonitor,
  usePerformanceMonitor,
  type PerformanceMetrics,
  type AdaptiveSettings
} from './performance/PerformanceMonitor'

// Type exports
export type {
  CanvasViewport,
  GridMetrics,
  CanvasTransformOptions,
  CanvasEventData,
  CanvasEventType,
  CanvasEventHandlers,
  DragState,
  EventHandlerOptions,
  CanvasSize,
  ResponsiveBreakpoint,
  ResponsiveCanvasOptions,
  CanvasMetrics,
} from './index'

// Ship-specific types
export type {
  ShipRenderConfig,
  ShipSpriteConfig,
  ShipVisualConfig,
  RenderableSprite,
  DamageState,
  AbilityEffect,
  CompleteShipConfig,
  AnimationTrigger
} from '../../components/canvas/ships'

/**
 * System Initialization
 *
 * Initialize the complete ship rendering system with optimized defaults.
 */
export const initializeShipRenderingSystem = async (options?: {
  performanceLevel?: 'low' | 'medium' | 'high'
  enablePerformanceMonitoring?: boolean
  preloadSprites?: boolean
}) => {
  const {
    performanceLevel = 'high',
    enablePerformanceMonitoring = true,
    preloadSprites = false
  } = options || {}

  // Initialize performance monitoring if requested
  if (enablePerformanceMonitoring) {
    const { globalPerformanceMonitor } = await import('./performance/PerformanceMonitor')
    globalPerformanceMonitor.start()
  }

  // Initialize animation system
  const { globalAnimationEngine, globalAnimationQueue, initializeAnimationQueue } = await import('./animations')
  initializeAnimationQueue(globalAnimationEngine)

  // Create sprite manager based on performance level
  const { ShipSpriteManager } = await import('./sprites/ShipSpriteManager')
  const spriteManagerConfig = {
    low: {
      enableAtlases: false,
      preloadStrategy: 'none' as const,
      qualityLevel: 'low' as const,
      maxConcurrentLoads: 1
    },
    medium: {
      enableAtlases: true,
      preloadStrategy: 'none' as const,
      qualityLevel: 'medium' as const,
      maxConcurrentLoads: 2
    },
    high: {
      enableAtlases: true,
      preloadStrategy: preloadSprites ? 'era' as const : 'none' as const,
      qualityLevel: 'high' as const,
      maxConcurrentLoads: 3
    }
  }

  const spriteManager = new ShipSpriteManager(spriteManagerConfig[performanceLevel])

  // Create ship component factory
  const { ShipComponentFactory } = await import('../../components/canvas/ships/ShipComponentFactory')
  const componentFactory = new ShipComponentFactory({
    spriteManager,
    performanceLevel,
    enableAnimations: performanceLevel !== 'low',
    enableEffects: performanceLevel === 'high',
    enableDamageVisualization: true,
    enableAbilityEffects: performanceLevel === 'high'
  })

  return {
    spriteManager,
    componentFactory,
    animationEngine: globalAnimationEngine,
    animationQueue: globalAnimationQueue,
    performanceMonitor: enablePerformanceMonitoring ?
      (await import('./performance/PerformanceMonitor')).globalPerformanceMonitor : null
  }
}

/**
 * Quick start factory function
 */
export const createShipRenderingSystem = initializeShipRenderingSystem
/**
 * Canvas Interactions Module
 *
 * Interactive game elements for the Battleship Naval Strategy Game.
 * Provides clickable grid cells, drag-and-drop functionality, hover effects,
 * targeting systems, and ability activation interfaces.
 */

// Core interaction components
export { ClickableGrid } from './ClickableGrid'
export type { ClickableGridProps, CellClickState } from './ClickableGrid'

export { DragDropCanvas } from './DragDropCanvas'
export type { DragDropCanvasProps, DragPreview, CollisionHighlight } from './DragDropCanvas'

export { HoverEffects } from './HoverEffects'
export type { HoverEffectsProps, HoverState, ShipHoverInfo } from './HoverEffects'

export { TargetingSystem } from './TargetingSystem'
export type { TargetingSystemProps, TargetingMode, TargetInfo, AttackPreview } from './TargetingSystem'

export { AbilityActivation } from './AbilityActivation'
export type { AbilityActivationProps, AbilityState, AbilityEffectPreview } from './AbilityActivation'

// Utility hooks
export { useClickValidation, useCellAccessibility } from './ClickableGrid'
export { useDragDropOperations, useShipPlacementValidation } from './DragDropCanvas'
export { useHoverInteractions, useShipInfo } from './HoverEffects'
export { useTargetingState } from './TargetingSystem'
export { useAbilityActivation } from './AbilityActivation'

/**
 * Integration Components
 *
 * These components work together to provide a complete interactive experience:
 *
 * 1. ClickableGrid - Provides basic cell interaction and validation
 * 2. DragDropCanvas - Handles ship placement with visual feedback
 * 3. HoverEffects - Shows information and highlights on hover
 * 4. TargetingSystem - Manages combat targeting and attack preview
 * 5. AbilityActivation - Handles special ability activation and effects
 *
 * All components integrate with:
 * - Phase 2 game logic systems
 * - GameCanvas coordinate transformation
 * - Performance optimization for 60fps
 * - Mobile touch interactions
 * - Accessibility features
 */

// Re-export commonly used types from dependencies
export type { Coordinate, GameShip, BoardState, ShipAbility, AttackResult } from '../../../lib/game/types'
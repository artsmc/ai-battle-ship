/**
 * Placement Module Index
 * Exports all ship placement logic and components
 */

// Core placement logic
export { PlacementValidator } from './PlacementValidator'
export type {
  PlacementValidationConfig,
  FleetValidationResult,
  PlacementAttempt,
  PlacementSuggestion
} from './PlacementValidator'

export { CollisionDetector } from './CollisionDetector'
export type {
  CollisionResult,
  CollisionType,
  CollisionSeverity,
  ProximityZone,
  CollisionMap,
  DragCollisionState,
  CollisionPreview
} from './CollisionDetector'

export { DragDropHandler } from './DragDropHandler'
export type {
  DragState,
  DragEventHandlers,
  TouchState,
  DragConfig
} from './DragDropHandler'

// Component handlers
export { TouchHandler } from './TouchHandler'
export type {
  TouchState as TouchHandlerState,
  TouchConfig,
  TouchEventCallbacks
} from './TouchHandler'

export { MouseHandler } from './MouseHandler'
export type {
  MouseConfig,
  MouseEventCallbacks
} from './MouseHandler'

export { DragStateManager } from './DragStateManager'
export type {
  DragState as StateManagerDragState,
  StateConfig,
  StateUpdateCallbacks
} from './DragStateManager'

export { DragValidator } from './DragValidator'
export type {
  ValidationResult
} from './DragValidator'

export { PreviewManager } from './PreviewManager'
export type {
  PreviewConfig,
  PreviewCallbacks
} from './PreviewManager'

export { CoordinateConverter } from './CoordinateConverter'
export type {
  ConversionConfig
} from './CoordinateConverter'

export { AutoPlacer } from './AutoPlacer'
export type {
  AutoPlacementConfig,
  PlacementStrategy,
  PlacementResult,
  ShipPlacement,
  PlacementScore,
  PlacementConstraint
} from './AutoPlacer'
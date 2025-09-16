/**
 * Placement Domain Module
 * Clean exports for all placement domain logic
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 */

// Type definitions
export type {
  Cell,
  PlacedShip,
  PlacementRules,
  PlacementValidation,
  PlacementQuality,
  PixelCoordinate,
  FleetComposition
} from './types'

export {
  STANDARD_FLEET,
  STANDARD_RULES,
  isValidCell,
  isValidOrientation,
  isValidPlacementRules
} from './types'

// Core domain functions
export {
  cellsForShip,
  inBounds,
  collides,
  hasAdjacency,
  canPlace,
  validatePlacement,
  getValidPlacements,
  isFleetComplete,
  createPlacedShip,
  removeShip,
  findShipAtCell,
  isCellOccupied
} from './domain'

// Scoring functions
export {
  scorePlacement,
  calculateDistributionScore,
  calculateUnpredictabilityScore,
  calculateDefenseScore,
  calculateEfficiencyScore,
  scoreShipPlacement
} from './scoring'

// Geometry utilities
export {
  cellToPixel,
  pixelToCell,
  cellToCenterPixel,
  getShipBounds,
  cellDistance,
  manhattanDistance,
  getCellsInRadius,
  getAdjacentCells,
  rotateShipCells,
  getShipCenter,
  isInBounds,
  clampToBoard,
  getCornerCells,
  getEdgeCells
} from './geometry'

// State machine (TASK 2)
export {
  PlacementStateMachine,
  type UiMode,
  type ShipKind,
  type ShipSpec,
  type PlacementPreview,
  type PlacementState,
  type PlacementActions,
  SHIP_SPECS
} from './stateMachine'

// Advanced interactions (TASK 5)
export {
  InteractionController,
  MouseInteractionManager,
  TouchInteractionManager,
  KeyboardInteractionManager,
  AccessibilityManager,
  type MouseInteractionEvent,
  type TouchInteractionEvent,
  type KeyboardInteractionEvent,
  type TouchGesture,
  type InteractionHandlers,
  KEYBOARD_SHORTCUTS,
  matchesShortcut,
  recognizeGesture,
  calculateSwipeDirection
} from './interactions'
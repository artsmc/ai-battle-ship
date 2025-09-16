/**
 * Placement Hooks Module
 * Clean exports for all placement-related hooks
 *
 * Part of TASK 5: Konva.js Interactions (Enhanced)
 */

// Main placement hook
export {
  useKonvaPlacement,
  type PlacementProgress,
  type KonvaPlacementConfig,
  type PlacementHandlers
} from './useKonvaPlacement'

// Ship selection hook
export {
  useShipSelection,
  useShipPaletteState,
  useShipSelectionKeyboard,
  type ShipSelectionInfo,
  type ShipSelectionHandlers
} from './useShipSelection'

// Advanced interactions (TASK 5)
export {
  useAdvancedInteractions,
  type AdvancedInteractionConfig,
  type AdvancedInteractionHandlers,
  type TouchState
} from './useAdvancedInteractions'

// Accessibility support (TASK 5)
export {
  useAccessibility,
  type AccessibilityConfig,
  type AccessibilityState,
  type AccessibilityHandlers
} from './useAccessibility'
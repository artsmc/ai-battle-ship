/**
 * Placement Components Module
 * Clean exports for all Konva.js placement components
 *
 * Part of TASK 4: Ship Palette & Controls (Enhanced)
 */

// Main placement component
export {
  KonvaShipPlacement,
  type KonvaShipPlacementProps
} from './KonvaShipPlacement'

// Board component
export {
  KonvaPlacementBoard,
  type KonvaPlacementBoardProps
} from './KonvaPlacementBoard'

// Enhanced ship palette (TASK 4)
export {
  EnhancedShipPalette,
  type EnhancedShipPaletteProps
} from './EnhancedShipPalette'

// Enhanced HUD (TASK 4)
export {
  EnhancedPlacementHUD,
  type EnhancedPlacementHUDProps
} from './EnhancedPlacementHUD'

// Basic versions (for backward compatibility)
export {
  ShipPalette,
  type ShipPaletteProps
} from './ShipPalette'

export {
  PlacementHUD,
  type PlacementHUDProps
} from './PlacementHUD'
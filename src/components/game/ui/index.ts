/**
 * Game Board UI Components Index
 *
 * Exports all game board interface elements for the Battleship Naval Strategy Game.
 * These components work together to provide a complete game board interface
 * with responsive design and accessibility compliance.
 */

export { GridCoordinates } from './GridCoordinates'
export type { GridCoordinatesProps } from './GridCoordinates'

export { GameStatus } from './GameStatus'
export type { GameStatusProps } from './GameStatus'

export { PlacementSidebar } from './PlacementSidebar'
export type { PlacementSidebarProps } from './PlacementSidebar'

export { BoardLegend } from './BoardLegend'
export type { BoardLegendProps } from './BoardLegend'

/**
 * UI Component Integration Notes:
 *
 * These components are designed to work together as part of TASK-018
 * to create the complete game board interface:
 *
 * 1. GridCoordinates - A-J, 1-10 labels for board reference
 * 2. GameStatus - Real-time game state and phase information
 * 3. PlacementSidebar - Ship placement controls and progress
 * 4. BoardLegend - Visual legend for board symbols
 *
 * All components:
 * - Support responsive layouts (mobile, tablet, desktop)
 * - Integrate with Phase 2 game state management
 * - Use Phase 1 design system tokens
 * - Include accessibility features
 * - Support animation toggles for 60fps performance
 */
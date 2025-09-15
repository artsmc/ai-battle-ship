/**
 * Game Components Index
 * Exports all game-related React components for the Battleship Naval Strategy Game
 */

// Legacy Phase 1 components
export { ShipPlacement } from './ShipPlacement'
export { PlacementGrid } from './PlacementGrid'
export { ShipSelector } from './ShipSelector'

// TASK-018: Game Board Interface Components
export { GameBoard } from './GameBoard'
export type { GameBoardProps, BoardViewMode } from './GameBoard'

export { PlayerBoard } from './PlayerBoard'
export type { PlayerBoardProps } from './PlayerBoard'

export { OpponentBoard } from './OpponentBoard'
export type { OpponentBoardProps } from './OpponentBoard'

export { BoardSwitcher } from './BoardSwitcher'
export type { BoardSwitcherProps } from './BoardSwitcher'

// Game Board UI Components
export * from './ui'

// TASK-019: Game Control Panel Components
export * from './controls'

/**
 * TASK-019 Implementation Notes:
 *
 * Game Controls System:
 *
 * 1. Control Panel Components:
 *    - GameControls: Main control panel container with tabbed interface
 *    - TurnIndicator: Current player turn display with visual indicators
 *    - TimerDisplay: Turn timer and game timer with countdown warnings
 *    - MoveHistory: Move history panel with replay controls and filtering
 *    - AbilityPanel: Ship ability activation interface with cooldowns
 *    - SettingsPanel: Game settings and options panel with persistence
 *
 * 2. Integration Features:
 *    - Full integration with Phase 2 game state and combat system
 *    - Visual connection with canvas elements from TASK-015, TASK-016, TASK-017
 *    - Real-time updates from game state changes
 *    - Responsive design for mobile and desktop layouts
 *    - Accessibility compliance with keyboard navigation
 *    - Naval-themed consistent styling
 *
 * 3. Functional Capabilities:
 *    - Complete game control interface for all phases
 *    - Real-time timer management with warning states
 *    - Comprehensive move history with replay functionality
 *    - Ship ability management with visual feedback
 *    - Persistent game settings with localStorage
 *    - Mobile-responsive panel layouts
 *    - 60fps performance maintained
 *
 * TASK-018 Implementation Notes:
 *
 * This module now provides a complete game board interface that integrates:
 *
 * 1. Dual Board Views:
 *    - GameBoard: Main container component
 *    - PlayerBoard: Player's fleet view with ship placement
 *    - OpponentBoard: Opponent's board for targeting
 *    - BoardSwitcher: Mobile board switching interface
 *
 * 2. Interface Elements:
 *    - GridCoordinates: A-J, 1-10 coordinate labels
 *    - GameStatus: Real-time game status display
 *    - PlacementSidebar: Ship placement controls
 *    - BoardLegend: Visual symbol legend
 *
 * 3. Integration Features:
 *    - Uses Phase 1 design system tokens
 *    - Integrates with Phase 2 game state management
 *    - Uses Phase 3 canvas and interaction components
 *    - Responsive layout for mobile/desktop
 *    - Accessibility compliance maintained
 *    - 60fps performance optimizations
 */
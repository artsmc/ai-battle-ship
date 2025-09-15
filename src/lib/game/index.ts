/**
 * Game Module Exports
 * Central export point for all game-related modules
 */

// Core Classes
export { GameState } from './GameState'
export { Player } from './Player'
export { Ship } from './Ship'
export { Board } from './Board'

// Placement System
export * from './placement'

// Combat System
export * from './combat'

// Types
export * from './types'

// Utilities
export * from './utils/coordinates'
export * from './utils/validation'
export * from './utils/constants'
export * from './utils/helpers'

// Re-export commonly used types from database
export {
  GameMode,
  GameStatus,
  MoveResult,
  ShipClass,
  ShipEra,
  PowerupType
} from '../database/types/enums'
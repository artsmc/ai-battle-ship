/**
 * Placement Domain Types
 * Pure TypeScript definitions for ship placement domain logic
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 */

import { Coordinate, Orientation } from '../game/types'

// =============================================
// CORE PLACEMENT TYPES
// =============================================

/**
 * Represents a single grid cell for placement calculations
 */
export interface Cell {
  /** X coordinate (0-9 for standard 10x10 board) */
  x: number
  /** Y coordinate (0-9 for standard 10x10 board) */
  y: number
}

/**
 * Represents a ship that has been placed on the board
 */
export interface PlacedShip {
  /** Unique identifier for the ship */
  id: string
  /** Ship length in cells */
  length: number
  /** Starting cell position */
  origin: Cell
  /** Ship orientation */
  orientation: Orientation
  /** All cells occupied by this ship */
  cells: Cell[]
}

/**
 * Configuration for placement validation rules
 */
export interface PlacementRules {
  /** Board dimensions */
  boardSize: number
  /** Whether ships can touch each other */
  allowTouch: boolean
  /** Minimum distance between ships (when allowTouch is false) */
  minDistance: number
}

/**
 * Result of a placement validation check
 */
export interface PlacementValidation {
  /** Whether the placement is valid */
  valid: boolean
  /** Reason for invalidity (if any) */
  reason?: 'out-of-bounds' | 'collision' | 'too-close' | 'invalid-cells'
  /** Human-readable error message */
  message?: string
  /** Specific cells that are problematic */
  problemCells?: Cell[]
}

/**
 * Quality assessment of a placement strategy
 */
export interface PlacementQuality {
  /** Overall score (0-100) */
  score: number
  /** Letter grade based on score */
  grade: 'A' | 'B' | 'C' | 'D'
  /** Individual scoring metrics */
  metrics: {
    /** How well distributed ships are across the board */
    distribution: number
    /** How well ships avoid predictable patterns */
    unpredictability: number
    /** How defensively positioned ships are */
    defense: number
    /** How efficiently board space is used */
    efficiency: number
  }
}

/**
 * Coordinate transformation result for pixel/cell conversion
 */
export interface PixelCoordinate {
  /** X position in pixels */
  x: number
  /** Y position in pixels */
  y: number
}

/**
 * Standard fleet composition for classic battleship
 */
export interface FleetComposition {
  /** Aircraft Carrier - 5 cells */
  carrier: number
  /** Battleship - 4 cells */
  battleship: number
  /** Cruiser - 3 cells */
  cruiser: number
  /** Submarine - 3 cells */
  submarine: number
  /** Destroyer - 2 cells */
  destroyer: number
}

/**
 * Default fleet composition (classic battleship rules)
 */
export const STANDARD_FLEET: FleetComposition = {
  carrier: 1,
  battleship: 1,
  cruiser: 1,
  submarine: 1,
  destroyer: 1
}

/**
 * Default placement rules (classic battleship)
 */
export const STANDARD_RULES: PlacementRules = {
  boardSize: 10,
  allowTouch: false,
  minDistance: 1
}

// =============================================
// UTILITY TYPE GUARDS
// =============================================

/**
 * Type guard to check if a value is a valid Cell
 */
export function isValidCell(value: unknown): value is Cell {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Cell).x === 'number' &&
    typeof (value as Cell).y === 'number' &&
    Number.isInteger((value as Cell).x) &&
    Number.isInteger((value as Cell).y) &&
    (value as Cell).x >= 0 &&
    (value as Cell).y >= 0
  )
}

/**
 * Type guard to check if orientation is valid
 */
export function isValidOrientation(value: unknown): value is Orientation {
  return value === 'horizontal' || value === 'vertical'
}

/**
 * Type guard to check if placement rules are valid
 */
export function isValidPlacementRules(value: unknown): value is PlacementRules {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PlacementRules).boardSize === 'number' &&
    typeof (value as PlacementRules).allowTouch === 'boolean' &&
    typeof (value as PlacementRules).minDistance === 'number' &&
    (value as PlacementRules).boardSize > 0 &&
    (value as PlacementRules).minDistance >= 0
  )
}
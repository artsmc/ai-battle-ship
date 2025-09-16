/**
 * Placement Domain Logic
 * Pure functions for ship placement validation and calculations
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 * All functions are pure (no side effects) and fully testable
 */

import { Orientation } from '../game/types'
import {
  Cell,
  PlacedShip,
  PlacementRules,
  PlacementValidation,
  STANDARD_RULES
} from './types'

// =============================================
// CORE PLACEMENT FUNCTIONS
// =============================================

/**
 * Calculate all cells that a ship would occupy given its origin, orientation, and length
 * @param origin Starting cell position
 * @param orientation Ship orientation (horizontal or vertical)
 * @param length Ship length in cells
 * @returns Array of cells the ship would occupy
 */
export function cellsForShip(
  origin: Cell,
  orientation: Orientation,
  length: number
): Cell[] {
  const cells: Cell[] = []

  for (let i = 0; i < length; i++) {
    if (orientation === 'horizontal') {
      cells.push({ x: origin.x + i, y: origin.y })
    } else {
      cells.push({ x: origin.x, y: origin.y + i })
    }
  }

  return cells
}

/**
 * Check if all cells are within board boundaries
 * @param cells Array of cells to check
 * @param boardSize Size of the square board (default 10)
 * @returns True if all cells are within bounds
 */
export function inBounds(cells: Cell[], boardSize: number = 10): boolean {
  return cells.every(cell =>
    cell.x >= 0 &&
    cell.x < boardSize &&
    cell.y >= 0 &&
    cell.y < boardSize
  )
}

/**
 * Check if two sets of cells collide (occupy same positions)
 * @param cellsA First set of cells
 * @param cellsB Second set of cells
 * @returns True if any cells overlap
 */
export function collides(cellsA: Cell[], cellsB: Cell[]): boolean {
  return cellsA.some(cellA =>
    cellsB.some(cellB => cellA.x === cellB.x && cellA.y === cellB.y)
  )
}

/**
 * Check if any cells are adjacent to placed ships
 * @param cells Cells to check for adjacency
 * @param placedShips Already placed ships
 * @param boardSize Size of the square board
 * @returns True if any cells are adjacent to existing ships
 */
export function hasAdjacency(
  cells: Cell[],
  placedShips: PlacedShip[],
  boardSize: number = 10
): boolean {
  for (const cell of cells) {
    // Check all 8 adjacent positions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue // Skip the cell itself

        const adjacentCell = { x: cell.x + dx, y: cell.y + dy }

        // Skip if adjacent cell is out of bounds
        if (!inBounds([adjacentCell], boardSize)) continue

        // Check if any placed ship occupies this adjacent cell
        for (const ship of placedShips) {
          if (collides([adjacentCell], ship.cells)) {
            return true
          }
        }
      }
    }
  }

  return false
}

/**
 * Validate if a ship can be placed at the given position
 * @param candidateCells Cells where ship would be placed
 * @param placedShips Already placed ships
 * @param boardSize Size of the square board
 * @param allowTouch Whether ships can touch each other
 * @returns Validation result with details
 */
export function canPlace(
  candidateCells: Cell[],
  placedShips: PlacedShip[],
  boardSize: number = 10,
  allowTouch: boolean = false
): PlacementValidation {
  // Check if cells are valid
  if (!candidateCells || candidateCells.length === 0) {
    return {
      valid: false,
      reason: 'invalid-cells',
      message: 'No cells provided for placement'
    }
  }

  // Check bounds
  if (!inBounds(candidateCells, boardSize)) {
    const outOfBounds = candidateCells.filter(cell =>
      cell.x < 0 || cell.x >= boardSize || cell.y < 0 || cell.y >= boardSize
    )
    return {
      valid: false,
      reason: 'out-of-bounds',
      message: `Ship extends outside board boundaries`,
      problemCells: outOfBounds
    }
  }

  // Check for collisions with existing ships
  for (const ship of placedShips) {
    if (collides(candidateCells, ship.cells)) {
      const conflictCells = candidateCells.filter(cell =>
        ship.cells.some(shipCell => cell.x === shipCell.x && cell.y === shipCell.y)
      )
      return {
        valid: false,
        reason: 'collision',
        message: `Ship would overlap with existing ship ${ship.id}`,
        problemCells: conflictCells
      }
    }
  }

  // Check adjacency rules (if touching is not allowed)
  if (!allowTouch && hasAdjacency(candidateCells, placedShips, boardSize)) {
    return {
      valid: false,
      reason: 'too-close',
      message: 'Ships cannot be adjacent to each other'
    }
  }

  return { valid: true }
}

/**
 * Validate placement using a cell origin, orientation, and length
 * @param origin Starting cell
 * @param orientation Ship orientation
 * @param length Ship length
 * @param placedShips Already placed ships
 * @param rules Placement rules to apply
 * @returns Validation result
 */
export function validatePlacement(
  origin: Cell,
  orientation: Orientation,
  length: number,
  placedShips: PlacedShip[],
  rules: PlacementRules = STANDARD_RULES
): PlacementValidation {
  const candidateCells = cellsForShip(origin, orientation, length)
  return canPlace(candidateCells, placedShips, rules.boardSize, rules.allowTouch)
}

/**
 * Get all valid placement positions for a ship of given length
 * @param length Ship length
 * @param placedShips Already placed ships
 * @param rules Placement rules
 * @returns Array of valid origin positions with orientations
 */
export function getValidPlacements(
  length: number,
  placedShips: PlacedShip[],
  rules: PlacementRules = STANDARD_RULES
): Array<{ origin: Cell; orientation: Orientation }> {
  const validPlacements: Array<{ origin: Cell; orientation: Orientation }> = []

  for (let y = 0; y < rules.boardSize; y++) {
    for (let x = 0; x < rules.boardSize; x++) {
      const origin = { x, y }

      // Try both orientations
      for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
        const validation = validatePlacement(origin, orientation, length, placedShips, rules)
        if (validation.valid) {
          validPlacements.push({ origin, orientation })
        }
      }
    }
  }

  return validPlacements
}

/**
 * Check if fleet composition is complete according to standard rules
 * @param placedShips Currently placed ships
 * @param requiredFleet Fleet composition requirements
 * @returns True if all required ships are placed
 */
export function isFleetComplete(
  placedShips: PlacedShip[],
  requiredFleet = STANDARD_FLEET
): boolean {
  const shipsByLength = placedShips.reduce((acc, ship) => {
    acc[ship.length] = (acc[ship.length] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Check each required ship type
  const required = [
    { length: 5, count: requiredFleet.carrier },
    { length: 4, count: requiredFleet.battleship },
    { length: 3, count: requiredFleet.cruiser + requiredFleet.submarine },
    { length: 2, count: requiredFleet.destroyer }
  ]

  return required.every(({ length, count }) =>
    (shipsByLength[length] || 0) >= count
  )
}

/**
 * Create a placed ship object from placement parameters
 * @param id Ship identifier
 * @param origin Starting cell
 * @param orientation Ship orientation
 * @param length Ship length
 * @returns PlacedShip object
 */
export function createPlacedShip(
  id: string,
  origin: Cell,
  orientation: Orientation,
  length: number
): PlacedShip {
  const cells = cellsForShip(origin, orientation, length)

  return {
    id,
    length,
    origin,
    orientation,
    cells
  }
}

/**
 * Remove a ship from the placed ships array
 * @param shipId ID of ship to remove
 * @param placedShips Current placed ships
 * @returns New array with ship removed
 */
export function removeShip(shipId: string, placedShips: PlacedShip[]): PlacedShip[] {
  return placedShips.filter(ship => ship.id !== shipId)
}

/**
 * Find a placed ship by cell position
 * @param cell Cell to check
 * @param placedShips Currently placed ships
 * @returns PlacedShip if found, undefined otherwise
 */
export function findShipAtCell(cell: Cell, placedShips: PlacedShip[]): PlacedShip | undefined {
  return placedShips.find(ship =>
    ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
  )
}

/**
 * Check if a cell is occupied by any ship
 * @param cell Cell to check
 * @param placedShips Currently placed ships
 * @returns True if cell is occupied
 */
export function isCellOccupied(cell: Cell, placedShips: PlacedShip[]): boolean {
  return findShipAtCell(cell, placedShips) !== undefined
}
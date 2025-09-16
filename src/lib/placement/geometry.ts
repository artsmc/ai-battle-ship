/**
 * Placement Geometry Utilities
 * Pure functions for coordinate transformations and spatial calculations
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 * Coordinate transformation between cell grid and pixel coordinates for Konva.js
 */

import { Cell, PixelCoordinate } from './types'
import { Orientation } from '../game/types'

// =============================================
// COORDINATE TRANSFORMATIONS
// =============================================

/**
 * Convert cell coordinates to pixel coordinates for Konva.js rendering
 * @param cell Grid cell position (0-based)
 * @param cellSize Size of each cell in pixels
 * @param offset Optional offset for grid positioning
 * @returns Pixel coordinates for Konva.js
 */
export function cellToPixel(
  cell: Cell,
  cellSize: number,
  offset: PixelCoordinate = { x: 0, y: 0 }
): PixelCoordinate {
  return {
    x: cell.x * cellSize + offset.x,
    y: cell.y * cellSize + offset.y
  }
}

/**
 * Convert pixel coordinates to cell coordinates
 * @param pixel Pixel position from Konva.js events
 * @param cellSize Size of each cell in pixels
 * @param offset Optional offset for grid positioning
 * @returns Grid cell position (0-based, may be out of bounds)
 */
export function pixelToCell(
  pixel: PixelCoordinate,
  cellSize: number,
  offset: PixelCoordinate = { x: 0, y: 0 }
): Cell {
  return {
    x: Math.floor((pixel.x - offset.x) / cellSize),
    y: Math.floor((pixel.y - offset.y) / cellSize)
  }
}

/**
 * Convert cell coordinates to centered pixel coordinates (for ship sprites)
 * @param cell Grid cell position
 * @param cellSize Size of each cell in pixels
 * @param offset Optional offset for grid positioning
 * @returns Pixel coordinates centered within the cell
 */
export function cellToCenterPixel(
  cell: Cell,
  cellSize: number,
  offset: PixelCoordinate = { x: 0, y: 0 }
): PixelCoordinate {
  const corner = cellToPixel(cell, cellSize, offset)
  return {
    x: corner.x + cellSize / 2,
    y: corner.y + cellSize / 2
  }
}

/**
 * Calculate bounding box for a ship in pixel coordinates
 * @param cells Ship cells
 * @param cellSize Size of each cell in pixels
 * @param offset Optional offset for grid positioning
 * @returns Bounding box in pixel coordinates
 */
export function getShipBounds(
  cells: Cell[],
  cellSize: number,
  offset: PixelCoordinate = { x: 0, y: 0 }
): { x: number; y: number; width: number; height: number } {
  if (cells.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const minX = Math.min(...cells.map(cell => cell.x))
  const maxX = Math.max(...cells.map(cell => cell.x))
  const minY = Math.min(...cells.map(cell => cell.y))
  const maxY = Math.max(...cells.map(cell => cell.y))

  const topLeft = cellToPixel({ x: minX, y: minY }, cellSize, offset)

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: (maxX - minX + 1) * cellSize,
    height: (maxY - minY + 1) * cellSize
  }
}

// =============================================
// SPATIAL CALCULATIONS
// =============================================

/**
 * Calculate distance between two cells
 * @param cellA First cell
 * @param cellB Second cell
 * @returns Euclidean distance between cells
 */
export function cellDistance(cellA: Cell, cellB: Cell): number {
  return Math.sqrt(
    Math.pow(cellA.x - cellB.x, 2) + Math.pow(cellA.y - cellB.y, 2)
  )
}

/**
 * Calculate Manhattan distance between two cells
 * @param cellA First cell
 * @param cellB Second cell
 * @returns Manhattan distance (sum of absolute differences)
 */
export function manhattanDistance(cellA: Cell, cellB: Cell): number {
  return Math.abs(cellA.x - cellB.x) + Math.abs(cellA.y - cellB.y)
}

/**
 * Get all cells within a certain distance of a center cell
 * @param center Center cell
 * @param radius Maximum distance (Euclidean)
 * @param boardSize Board dimensions for bounds checking
 * @returns Array of cells within radius
 */
export function getCellsInRadius(
  center: Cell,
  radius: number,
  boardSize: number = 10
): Cell[] {
  const cells: Cell[] = []

  const minX = Math.max(0, center.x - Math.ceil(radius))
  const maxX = Math.min(boardSize - 1, center.x + Math.ceil(radius))
  const minY = Math.max(0, center.y - Math.ceil(radius))
  const maxY = Math.min(boardSize - 1, center.y + Math.ceil(radius))

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const cell = { x, y }
      if (cellDistance(center, cell) <= radius) {
        cells.push(cell)
      }
    }
  }

  return cells
}

/**
 * Get cells adjacent to given cells (8-directional adjacency)
 * @param cells Cells to find adjacents for
 * @param boardSize Board dimensions for bounds checking
 * @returns Array of adjacent cells (excluding input cells)
 */
export function getAdjacentCells(cells: Cell[], boardSize: number = 10): Cell[] {
  const adjacentCells = new Set<string>()
  const inputCellKeys = new Set(cells.map(cell => `${cell.x},${cell.y}`))

  for (const cell of cells) {
    // Check all 8 directions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue // Skip the cell itself

        const adjacentCell = { x: cell.x + dx, y: cell.y + dy }
        const cellKey = `${adjacentCell.x},${adjacentCell.y}`

        // Add if within bounds and not in input cells
        if (
          adjacentCell.x >= 0 && adjacentCell.x < boardSize &&
          adjacentCell.y >= 0 && adjacentCell.y < boardSize &&
          !inputCellKeys.has(cellKey)
        ) {
          adjacentCells.add(cellKey)
        }
      }
    }
  }

  return Array.from(adjacentCells).map(key => {
    const [x, y] = key.split(',').map(Number)
    return { x, y }
  })
}

// =============================================
// SHIP GEOMETRY CALCULATIONS
// =============================================

/**
 * Rotate a ship's cells around its origin point
 * @param cells Current ship cells
 * @param origin Ship's origin cell
 * @param currentOrientation Current orientation
 * @returns New cells after rotation (may be out of bounds)
 */
export function rotateShipCells(
  cells: Cell[],
  origin: Cell,
  currentOrientation: Orientation
): Cell[] {
  if (cells.length <= 1) return cells // Can't rotate single-cell ships

  const newOrientation: Orientation = currentOrientation === 'horizontal' ? 'vertical' : 'horizontal'
  const length = cells.length

  const newCells: Cell[] = []
  for (let i = 0; i < length; i++) {
    if (newOrientation === 'horizontal') {
      newCells.push({ x: origin.x + i, y: origin.y })
    } else {
      newCells.push({ x: origin.x, y: origin.y + i })
    }
  }

  return newCells
}

/**
 * Get the center point of a ship
 * @param cells Ship cells
 * @returns Center cell (may be fractional coordinates)
 */
export function getShipCenter(cells: Cell[]): { x: number; y: number } {
  if (cells.length === 0) return { x: 0, y: 0 }

  const sumX = cells.reduce((sum, cell) => sum + cell.x, 0)
  const sumY = cells.reduce((sum, cell) => sum + cell.y, 0)

  return {
    x: sumX / cells.length,
    y: sumY / cells.length
  }
}

/**
 * Check if a cell is within board boundaries
 * @param cell Cell to check
 * @param boardSize Board dimensions
 * @returns True if cell is within bounds
 */
export function isInBounds(cell: Cell, boardSize: number = 10): boolean {
  return cell.x >= 0 && cell.x < boardSize && cell.y >= 0 && cell.y < boardSize
}

/**
 * Clamp cell coordinates to board boundaries
 * @param cell Cell to clamp
 * @param boardSize Board dimensions
 * @returns Cell with coordinates clamped to valid range
 */
export function clampToBoard(cell: Cell, boardSize: number = 10): Cell {
  return {
    x: Math.max(0, Math.min(boardSize - 1, cell.x)),
    y: Math.max(0, Math.min(boardSize - 1, cell.y))
  }
}

/**
 * Get board corner cells
 * @param boardSize Board dimensions
 * @returns Array of corner cells
 */
export function getCornerCells(boardSize: number = 10): Cell[] {
  return [
    { x: 0, y: 0 },
    { x: boardSize - 1, y: 0 },
    { x: 0, y: boardSize - 1 },
    { x: boardSize - 1, y: boardSize - 1 }
  ]
}

/**
 * Get board edge cells
 * @param boardSize Board dimensions
 * @returns Array of edge cells
 */
export function getEdgeCells(boardSize: number = 10): Cell[] {
  const edges: Cell[] = []

  // Top and bottom edges
  for (let x = 0; x < boardSize; x++) {
    edges.push({ x, y: 0 })
    edges.push({ x, y: boardSize - 1 })
  }

  // Left and right edges (excluding corners already added)
  for (let y = 1; y < boardSize - 1; y++) {
    edges.push({ x: 0, y })
    edges.push({ x: boardSize - 1, y })
  }

  return edges
}
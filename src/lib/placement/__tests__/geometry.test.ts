/**
 * Geometry Utilities Tests
 * Comprehensive test suite for coordinate transformation and spatial functions
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 * 100% coverage for geometry functions
 */

import {
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
} from '../geometry'
import { Cell } from '../types'

describe('Geometry Utilities', () => {
  const CELL_SIZE = 40

  describe('cellToPixel', () => {
    it('should convert cell to pixel coordinates', () => {
      const cell = { x: 2, y: 3 }
      const pixel = cellToPixel(cell, CELL_SIZE)

      expect(pixel).toEqual({ x: 80, y: 120 })
    })

    it('should handle offset correctly', () => {
      const cell = { x: 1, y: 1 }
      const offset = { x: 10, y: 20 }
      const pixel = cellToPixel(cell, CELL_SIZE, offset)

      expect(pixel).toEqual({ x: 50, y: 60 })
    })

    it('should handle origin cell', () => {
      const cell = { x: 0, y: 0 }
      const pixel = cellToPixel(cell, CELL_SIZE)

      expect(pixel).toEqual({ x: 0, y: 0 })
    })
  })

  describe('pixelToCell', () => {
    it('should convert pixel to cell coordinates', () => {
      const pixel = { x: 80, y: 120 }
      const cell = pixelToCell(pixel, CELL_SIZE)

      expect(cell).toEqual({ x: 2, y: 3 })
    })

    it('should handle offset correctly', () => {
      const pixel = { x: 50, y: 60 }
      const offset = { x: 10, y: 20 }
      const cell = pixelToCell(pixel, CELL_SIZE, offset)

      expect(cell).toEqual({ x: 1, y: 1 })
    })

    it('should handle fractional pixels', () => {
      const pixel = { x: 85, y: 125 }
      const cell = pixelToCell(pixel, CELL_SIZE)

      expect(cell).toEqual({ x: 2, y: 3 }) // Floor operation
    })

    it('should handle negative coordinates', () => {
      const pixel = { x: -10, y: -5 }
      const cell = pixelToCell(pixel, CELL_SIZE)

      expect(cell.x).toBeLessThan(0)
      expect(cell.y).toBeLessThan(0)
    })
  })

  describe('cellToCenterPixel', () => {
    it('should convert to centered pixel coordinates', () => {
      const cell = { x: 2, y: 3 }
      const pixel = cellToCenterPixel(cell, CELL_SIZE)

      expect(pixel).toEqual({ x: 100, y: 140 }) // 80 + 20, 120 + 20
    })
  })

  describe('getShipBounds', () => {
    it('should calculate bounds for horizontal ship', () => {
      const cells = [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }]
      const bounds = getShipBounds(cells, CELL_SIZE)

      expect(bounds).toEqual({
        x: 80,  // 2 * 40
        y: 120, // 3 * 40
        width: 120,  // 3 cells * 40
        height: 40   // 1 cell * 40
      })
    })

    it('should calculate bounds for vertical ship', () => {
      const cells = [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }]
      const bounds = getShipBounds(cells, CELL_SIZE)

      expect(bounds).toEqual({
        x: 80,   // 2 * 40
        y: 120,  // 3 * 40
        width: 40,   // 1 cell * 40
        height: 120  // 3 cells * 40
      })
    })

    it('should handle empty cell array', () => {
      const bounds = getShipBounds([], CELL_SIZE)

      expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })

    it('should handle single cell', () => {
      const cells = [{ x: 5, y: 5 }]
      const bounds = getShipBounds(cells, CELL_SIZE)

      expect(bounds).toEqual({
        x: 200,  // 5 * 40
        y: 200,  // 5 * 40
        width: 40,
        height: 40
      })
    })
  })

  describe('cellDistance', () => {
    it('should calculate distance between cells', () => {
      const cellA = { x: 0, y: 0 }
      const cellB = { x: 3, y: 4 }

      expect(cellDistance(cellA, cellB)).toBe(5) // 3-4-5 triangle
    })

    it('should return 0 for same cell', () => {
      const cell = { x: 5, y: 5 }
      expect(cellDistance(cell, cell)).toBe(0)
    })

    it('should handle adjacent cells', () => {
      const cellA = { x: 2, y: 2 }
      const cellB = { x: 3, y: 2 }

      expect(cellDistance(cellA, cellB)).toBe(1)
    })
  })

  describe('manhattanDistance', () => {
    it('should calculate Manhattan distance', () => {
      const cellA = { x: 0, y: 0 }
      const cellB = { x: 3, y: 4 }

      expect(manhattanDistance(cellA, cellB)).toBe(7) // 3 + 4
    })

    it('should handle same cell', () => {
      const cell = { x: 5, y: 5 }
      expect(manhattanDistance(cell, cell)).toBe(0)
    })
  })

  describe('getCellsInRadius', () => {
    it('should get cells within radius', () => {
      const center = { x: 5, y: 5 }
      const cells = getCellsInRadius(center, 1, 10)

      expect(cells).toContainEqual({ x: 5, y: 5 }) // Center
      expect(cells).toContainEqual({ x: 4, y: 5 }) // Adjacent
      expect(cells).toContainEqual({ x: 6, y: 5 }) // Adjacent
      expect(cells).not.toContainEqual({ x: 3, y: 5 }) // Too far
    })

    it('should respect board boundaries', () => {
      const center = { x: 0, y: 0 }
      const cells = getCellsInRadius(center, 2, 10)

      expect(cells.every(cell => cell.x >= 0 && cell.y >= 0)).toBe(true)
    })

    it('should handle corner positions', () => {
      const center = { x: 9, y: 9 }
      const cells = getCellsInRadius(center, 1, 10)

      expect(cells.every(cell => cell.x < 10 && cell.y < 10)).toBe(true)
    })
  })

  describe('getAdjacentCells', () => {
    it('should get adjacent cells for single cell', () => {
      const cells = [{ x: 5, y: 5 }]
      const adjacent = getAdjacentCells(cells, 10)

      expect(adjacent).toHaveLength(8) // 8 directions
      expect(adjacent).toContainEqual({ x: 4, y: 4 }) // Diagonal
      expect(adjacent).toContainEqual({ x: 5, y: 4 }) // Vertical
      expect(adjacent).toContainEqual({ x: 6, y: 6 }) // Diagonal
      expect(adjacent).not.toContainEqual({ x: 5, y: 5 }) // Exclude input cell
    })

    it('should handle edge cells correctly', () => {
      const cells = [{ x: 0, y: 0 }]
      const adjacent = getAdjacentCells(cells, 10)

      expect(adjacent).toHaveLength(3) // Only 3 valid adjacent cells for corner
      expect(adjacent.every(cell => cell.x >= 0 && cell.y >= 0)).toBe(true)
    })

    it('should handle multiple input cells', () => {
      const cells = [{ x: 5, y: 5 }, { x: 6, y: 5 }] // Horizontal ship
      const adjacent = getAdjacentCells(cells, 10)

      expect(adjacent.length).toBeGreaterThan(8) // Multiple cells = more adjacents
      expect(adjacent).not.toContainEqual({ x: 5, y: 5 }) // Exclude input cells
      expect(adjacent).not.toContainEqual({ x: 6, y: 5 }) // Exclude input cells
    })
  })

  describe('rotateShipCells', () => {
    it('should rotate horizontal ship to vertical', () => {
      const cells = [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }]
      const origin = { x: 2, y: 3 }
      const rotated = rotateShipCells(cells, origin, 'horizontal')

      expect(rotated).toEqual([
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 }
      ])
    })

    it('should rotate vertical ship to horizontal', () => {
      const cells = [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }]
      const origin = { x: 2, y: 3 }
      const rotated = rotateShipCells(cells, origin, 'vertical')

      expect(rotated).toEqual([
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 }
      ])
    })

    it('should handle single-cell ships', () => {
      const cells = [{ x: 5, y: 5 }]
      const origin = { x: 5, y: 5 }
      const rotated = rotateShipCells(cells, origin, 'horizontal')

      expect(rotated).toEqual(cells) // No change for single cell
    })
  })

  describe('getShipCenter', () => {
    it('should calculate center for horizontal ship', () => {
      const cells = [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }]
      const center = getShipCenter(cells)

      expect(center).toEqual({ x: 3, y: 3 })
    })

    it('should calculate center for vertical ship', () => {
      const cells = [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }]
      const center = getShipCenter(cells)

      expect(center).toEqual({ x: 2, y: 4 })
    })

    it('should handle empty array', () => {
      const center = getShipCenter([])
      expect(center).toEqual({ x: 0, y: 0 })
    })
  })

  describe('isInBounds', () => {
    it('should return true for valid cells', () => {
      expect(isInBounds({ x: 0, y: 0 }, 10)).toBe(true)
      expect(isInBounds({ x: 9, y: 9 }, 10)).toBe(true)
      expect(isInBounds({ x: 5, y: 5 }, 10)).toBe(true)
    })

    it('should return false for out of bounds cells', () => {
      expect(isInBounds({ x: -1, y: 0 }, 10)).toBe(false)
      expect(isInBounds({ x: 0, y: -1 }, 10)).toBe(false)
      expect(isInBounds({ x: 10, y: 5 }, 10)).toBe(false)
      expect(isInBounds({ x: 5, y: 10 }, 10)).toBe(false)
    })
  })

  describe('clampToBoard', () => {
    it('should leave valid cells unchanged', () => {
      const cell = { x: 5, y: 5 }
      expect(clampToBoard(cell, 10)).toEqual(cell)
    })

    it('should clamp negative coordinates', () => {
      const cell = { x: -2, y: -1 }
      expect(clampToBoard(cell, 10)).toEqual({ x: 0, y: 0 })
    })

    it('should clamp coordinates above maximum', () => {
      const cell = { x: 12, y: 11 }
      expect(clampToBoard(cell, 10)).toEqual({ x: 9, y: 9 })
    })

    it('should handle mixed valid/invalid coordinates', () => {
      const cell = { x: -1, y: 5 }
      expect(clampToBoard(cell, 10)).toEqual({ x: 0, y: 5 })
    })
  })

  describe('getCornerCells', () => {
    it('should return all corner cells for standard board', () => {
      const corners = getCornerCells(10)

      expect(corners).toHaveLength(4)
      expect(corners).toContainEqual({ x: 0, y: 0 })
      expect(corners).toContainEqual({ x: 9, y: 0 })
      expect(corners).toContainEqual({ x: 0, y: 9 })
      expect(corners).toContainEqual({ x: 9, y: 9 })
    })

    it('should work with different board sizes', () => {
      const corners = getCornerCells(5)

      expect(corners).toHaveLength(4)
      expect(corners).toContainEqual({ x: 0, y: 0 })
      expect(corners).toContainEqual({ x: 4, y: 4 })
    })
  })

  describe('getEdgeCells', () => {
    it('should return all edge cells', () => {
      const edges = getEdgeCells(5)

      expect(edges).toHaveLength(16) // 5*4 - 4 corners counted twice
      expect(edges).toContainEqual({ x: 0, y: 0 }) // Corner
      expect(edges).toContainEqual({ x: 2, y: 0 }) // Top edge
      expect(edges).toContainEqual({ x: 0, y: 2 }) // Left edge
      expect(edges).not.toContainEqual({ x: 2, y: 2 }) // Center cell
    })

    it('should handle minimum board size', () => {
      const edges = getEdgeCells(2)

      expect(edges).toHaveLength(4) // Only corners for 2x2 board
    })
  })

  describe('getCellsInRadius', () => {
    it('should include center cell', () => {
      const center = { x: 5, y: 5 }
      const cells = getCellsInRadius(center, 0, 10)

      expect(cells).toContainEqual(center)
      expect(cells).toHaveLength(1)
    })

    it('should include all cells within radius', () => {
      const center = { x: 5, y: 5 }
      const cells = getCellsInRadius(center, 1, 10)

      expect(cells).toContainEqual({ x: 4, y: 5 })
      expect(cells).toContainEqual({ x: 6, y: 5 })
      expect(cells).toContainEqual({ x: 5, y: 4 })
      expect(cells).toContainEqual({ x: 5, y: 6 })
      expect(cells).not.toContainEqual({ x: 3, y: 5 }) // Outside radius
    })
  })

  describe('getAdjacentCells', () => {
    it('should find all adjacent cells', () => {
      const inputCells = [{ x: 5, y: 5 }]
      const adjacent = getAdjacentCells(inputCells, 10)

      expect(adjacent).toHaveLength(8)
      expect(adjacent).toContainEqual({ x: 4, y: 4 })
      expect(adjacent).toContainEqual({ x: 5, y: 4 })
      expect(adjacent).toContainEqual({ x: 6, y: 6 })
      expect(adjacent).not.toContainEqual({ x: 5, y: 5 }) // Exclude input
    })

    it('should respect board boundaries', () => {
      const inputCells = [{ x: 0, y: 0 }]
      const adjacent = getAdjacentCells(inputCells, 10)

      expect(adjacent).toHaveLength(3) // Only 3 valid adjacents for corner
      expect(adjacent.every(cell => cell.x >= 0 && cell.y >= 0)).toBe(true)
    })
  })

  describe('cellDistance', () => {
    it('should calculate Euclidean distance', () => {
      const cellA = { x: 0, y: 0 }
      const cellB = { x: 3, y: 4 }

      expect(cellDistance(cellA, cellB)).toBeCloseTo(5, 2)
    })

    it('should return 0 for identical cells', () => {
      const cell = { x: 3, y: 7 }
      expect(cellDistance(cell, cell)).toBe(0)
    })
  })

  describe('manhattanDistance', () => {
    it('should calculate Manhattan distance', () => {
      const cellA = { x: 1, y: 1 }
      const cellB = { x: 4, y: 5 }

      expect(manhattanDistance(cellA, cellB)).toBe(7) // |4-1| + |5-1|
    })

    it('should return 0 for identical cells', () => {
      const cell = { x: 3, y: 7 }
      expect(manhattanDistance(cell, cell)).toBe(0)
    })
  })

  describe('rotateShipCells', () => {
    it('should rotate ship from horizontal to vertical', () => {
      const cells = [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }]
      const origin = { x: 2, y: 3 }
      const rotated = rotateShipCells(cells, origin, 'horizontal')

      expect(rotated).toEqual([
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 }
      ])
    })

    it('should rotate ship from vertical to horizontal', () => {
      const cells = [{ x: 2, y: 3 }, { x: 2, y: 4 }]
      const origin = { x: 2, y: 3 }
      const rotated = rotateShipCells(cells, origin, 'vertical')

      expect(rotated).toEqual([
        { x: 2, y: 3 },
        { x: 3, y: 3 }
      ])
    })
  })

  describe('getShipCenter', () => {
    it('should calculate center for odd-length ship', () => {
      const cells = [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }]
      const center = getShipCenter(cells)

      expect(center).toEqual({ x: 3, y: 3 })
    })

    it('should calculate center for even-length ship', () => {
      const cells = [{ x: 2, y: 3 }, { x: 3, y: 3 }]
      const center = getShipCenter(cells)

      expect(center).toEqual({ x: 2.5, y: 3 })
    })
  })
})
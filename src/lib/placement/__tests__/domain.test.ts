/**
 * Domain Logic Tests
 * Comprehensive test suite for placement domain functions
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 * 100% coverage for all domain logic functions
 */

import {
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
} from '../domain'
import { Cell, PlacedShip, STANDARD_FLEET, STANDARD_RULES } from '../types'

describe('Placement Domain Logic', () => {
  describe('cellsForShip', () => {
    it('should calculate horizontal ship cells correctly', () => {
      const origin = { x: 2, y: 3 }
      const cells = cellsForShip(origin, 'horizontal', 3)

      expect(cells).toEqual([
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 }
      ])
    })

    it('should calculate vertical ship cells correctly', () => {
      const origin = { x: 2, y: 3 }
      const cells = cellsForShip(origin, 'vertical', 3)

      expect(cells).toEqual([
        { x: 2, y: 3 },
        { x: 2, y: 4 },
        { x: 2, y: 5 }
      ])
    })

    it('should handle single-cell ships', () => {
      const origin = { x: 5, y: 5 }
      const cells = cellsForShip(origin, 'horizontal', 1)

      expect(cells).toEqual([{ x: 5, y: 5 }])
    })

    it('should handle edge cases with zero length', () => {
      const origin = { x: 0, y: 0 }
      const cells = cellsForShip(origin, 'horizontal', 0)

      expect(cells).toEqual([])
    })
  })

  describe('inBounds', () => {
    it('should return true for cells within bounds', () => {
      const cells = [{ x: 0, y: 0 }, { x: 9, y: 9 }, { x: 5, y: 5 }]
      expect(inBounds(cells, 10)).toBe(true)
    })

    it('should return false for cells outside bounds', () => {
      const cells = [{ x: 0, y: 0 }, { x: 10, y: 5 }]
      expect(inBounds(cells, 10)).toBe(false)
    })

    it('should handle negative coordinates', () => {
      const cells = [{ x: -1, y: 5 }]
      expect(inBounds(cells, 10)).toBe(false)
    })

    it('should handle empty cell array', () => {
      expect(inBounds([], 10)).toBe(true)
    })
  })

  describe('collides', () => {
    it('should detect collision when cells overlap', () => {
      const cellsA = [{ x: 1, y: 1 }, { x: 2, y: 1 }]
      const cellsB = [{ x: 2, y: 1 }, { x: 3, y: 1 }]

      expect(collides(cellsA, cellsB)).toBe(true)
    })

    it('should return false when no collision occurs', () => {
      const cellsA = [{ x: 1, y: 1 }, { x: 2, y: 1 }]
      const cellsB = [{ x: 4, y: 4 }, { x: 5, y: 4 }]

      expect(collides(cellsA, cellsB)).toBe(false)
    })

    it('should handle empty arrays', () => {
      const cells = [{ x: 1, y: 1 }]
      expect(collides([], cells)).toBe(false)
      expect(collides(cells, [])).toBe(false)
      expect(collides([], [])).toBe(false)
    })
  })

  describe('hasAdjacency', () => {
    const placedShips: PlacedShip[] = [
      createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 2)
    ]

    it('should detect adjacency when ships touch', () => {
      const cells = [{ x: 0, y: 1 }] // Adjacent to ship1
      expect(hasAdjacency(cells, placedShips, 10)).toBe(true)
    })

    it('should detect diagonal adjacency', () => {
      const cells = [{ x: 2, y: 1 }] // Diagonally adjacent to ship1
      expect(hasAdjacency(cells, placedShips, 10)).toBe(true)
    })

    it('should return false when no adjacency exists', () => {
      const cells = [{ x: 5, y: 5 }] // Far from ship1
      expect(hasAdjacency(cells, placedShips, 10)).toBe(false)
    })

    it('should handle edge cases near board boundaries', () => {
      const edgeShips: PlacedShip[] = [
        createPlacedShip('edge', { x: 9, y: 9 }, 'horizontal', 1)
      ]
      const cells = [{ x: 8, y: 8 }] // Adjacent to corner ship
      expect(hasAdjacency(cells, edgeShips, 10)).toBe(true)
    })
  })

  describe('canPlace', () => {
    const placedShips: PlacedShip[] = [
      createPlacedShip('existing', { x: 2, y: 2 }, 'horizontal', 3)
    ]

    it('should allow valid placement', () => {
      const cells = [{ x: 5, y: 5 }, { x: 6, y: 5 }]
      const result = canPlace(cells, placedShips, 10, false)

      expect(result.valid).toBe(true)
    })

    it('should reject out of bounds placement', () => {
      const cells = [{ x: 9, y: 9 }, { x: 10, y: 9 }]
      const result = canPlace(cells, placedShips, 10, false)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('out-of-bounds')
    })

    it('should reject colliding placement', () => {
      const cells = [{ x: 2, y: 2 }, { x: 3, y: 2 }] // Overlaps with existing ship
      const result = canPlace(cells, placedShips, 10, false)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('collision')
    })

    it('should reject adjacent placement when touching not allowed', () => {
      const cells = [{ x: 2, y: 1 }] // Adjacent to existing ship
      const result = canPlace(cells, placedShips, 10, false)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('too-close')
    })

    it('should allow adjacent placement when touching is allowed', () => {
      const cells = [{ x: 2, y: 1 }] // Adjacent to existing ship
      const result = canPlace(cells, placedShips, 10, true)

      expect(result.valid).toBe(true)
    })

    it('should reject empty cell array', () => {
      const result = canPlace([], placedShips, 10, false)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid-cells')
    })
  })

  describe('validatePlacement', () => {
    const placedShips: PlacedShip[] = [
      createPlacedShip('existing', { x: 0, y: 0 }, 'horizontal', 2)
    ]

    it('should validate correct placement parameters', () => {
      const origin = { x: 5, y: 5 }
      const result = validatePlacement(origin, 'horizontal', 3, placedShips, STANDARD_RULES)

      expect(result.valid).toBe(true)
    })

    it('should reject placement that would go out of bounds', () => {
      const origin = { x: 8, y: 0 }
      const result = validatePlacement(origin, 'horizontal', 4, placedShips, STANDARD_RULES)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('out-of-bounds')
    })
  })

  describe('getValidPlacements', () => {
    it('should find valid placements for empty board', () => {
      const placements = getValidPlacements(2, [], STANDARD_RULES)

      expect(placements.length).toBeGreaterThan(0)
      expect(placements.every(p => p.origin.x >= 0 && p.origin.y >= 0)).toBe(true)
    })

    it('should find fewer placements when board is partially occupied', () => {
      const placedShips = [createPlacedShip('ship1', { x: 5, y: 5 }, 'horizontal', 3)]
      const placements = getValidPlacements(2, placedShips, STANDARD_RULES)

      expect(placements.length).toBeGreaterThan(0)
      expect(placements.length).toBeLessThan(getValidPlacements(2, [], STANDARD_RULES).length)
    })
  })

  describe('isFleetComplete', () => {
    it('should return false for empty fleet', () => {
      expect(isFleetComplete([], STANDARD_FLEET)).toBe(false)
    })

    it('should return true for complete standard fleet', () => {
      const completeFleet = [
        createPlacedShip('carrier', { x: 0, y: 0 }, 'horizontal', 5),
        createPlacedShip('battleship', { x: 0, y: 2 }, 'horizontal', 4),
        createPlacedShip('cruiser', { x: 0, y: 4 }, 'horizontal', 3),
        createPlacedShip('submarine', { x: 0, y: 6 }, 'horizontal', 3),
        createPlacedShip('destroyer', { x: 0, y: 8 }, 'horizontal', 2)
      ]

      expect(isFleetComplete(completeFleet, STANDARD_FLEET)).toBe(true)
    })

    it('should return false for incomplete fleet', () => {
      const incompleteFleet = [
        createPlacedShip('carrier', { x: 0, y: 0 }, 'horizontal', 5),
        createPlacedShip('battleship', { x: 0, y: 2 }, 'horizontal', 4)
        // Missing cruiser, submarine, destroyer
      ]

      expect(isFleetComplete(incompleteFleet, STANDARD_FLEET)).toBe(false)
    })
  })

  describe('createPlacedShip', () => {
    it('should create placed ship with correct properties', () => {
      const ship = createPlacedShip('test', { x: 1, y: 1 }, 'horizontal', 3)

      expect(ship.id).toBe('test')
      expect(ship.length).toBe(3)
      expect(ship.origin).toEqual({ x: 1, y: 1 })
      expect(ship.orientation).toBe('horizontal')
      expect(ship.cells).toEqual([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 }
      ])
    })
  })

  describe('removeShip', () => {
    const ships = [
      createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 2),
      createPlacedShip('ship2', { x: 5, y: 5 }, 'vertical', 3),
      createPlacedShip('ship3', { x: 8, y: 8 }, 'horizontal', 1)
    ]

    it('should remove ship by ID', () => {
      const result = removeShip('ship2', ships)

      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual(['ship1', 'ship3'])
    })

    it('should return original array if ship not found', () => {
      const result = removeShip('nonexistent', ships)

      expect(result).toHaveLength(3)
      expect(result).toEqual(ships)
    })
  })

  describe('findShipAtCell', () => {
    const ships = [
      createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 2),
      createPlacedShip('ship2', { x: 5, y: 5 }, 'vertical', 3)
    ]

    it('should find ship at occupied cell', () => {
      const ship = findShipAtCell({ x: 1, y: 0 }, ships)
      expect(ship?.id).toBe('ship1')
    })

    it('should return undefined for empty cell', () => {
      const ship = findShipAtCell({ x: 9, y: 9 }, ships)
      expect(ship).toBeUndefined()
    })
  })

  describe('isCellOccupied', () => {
    const ships = [
      createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 2)
    ]

    it('should return true for occupied cell', () => {
      expect(isCellOccupied({ x: 0, y: 0 }, ships)).toBe(true)
      expect(isCellOccupied({ x: 1, y: 0 }, ships)).toBe(true)
    })

    it('should return false for empty cell', () => {
      expect(isCellOccupied({ x: 2, y: 0 }, ships)).toBe(false)
      expect(isCellOccupied({ x: 0, y: 1 }, ships)).toBe(false)
    })
  })
})

// Test utilities
describe('Test Utilities', () => {
  describe('createPlacedShip', () => {
    it('should create valid ships for testing', () => {
      const ship = createPlacedShip('test', { x: 0, y: 0 }, 'horizontal', 5)

      expect(ship.id).toBe('test')
      expect(ship.length).toBe(5)
      expect(ship.cells).toHaveLength(5)
      expect(ship.cells[0]).toEqual({ x: 0, y: 0 })
      expect(ship.cells[4]).toEqual({ x: 4, y: 0 })
    })
  })
})
/**
 * Scoring System Tests
 * Comprehensive test suite for placement scoring algorithms
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 * 100% coverage for scoring functions
 */

import {
  scorePlacement,
  calculateDistributionScore,
  calculateUnpredictabilityScore,
  calculateDefenseScore,
  calculateEfficiencyScore,
  scoreShipPlacement
} from '../scoring'
import { createPlacedShip } from '../domain'
import { PlacedShip } from '../types'

describe('Placement Scoring System', () => {
  describe('scorePlacement', () => {
    it('should score empty fleet as low quality', () => {
      const quality = scorePlacement([])

      expect(quality.score).toBeLessThan(50)
      expect(quality.grade).toBe('D')
    })

    it('should score well-distributed fleet highly', () => {
      const wellDistributedFleet = [
        createPlacedShip('carrier', { x: 0, y: 0 }, 'horizontal', 5),
        createPlacedShip('battleship', { x: 6, y: 6 }, 'vertical', 4),
        createPlacedShip('cruiser', { x: 3, y: 9 }, 'horizontal', 3),
        createPlacedShip('submarine', { x: 9, y: 3 }, 'vertical', 3),
        createPlacedShip('destroyer', { x: 0, y: 8 }, 'horizontal', 2)
      ]

      const quality = scorePlacement(wellDistributedFleet)

      expect(quality.score).toBeGreaterThan(60)
      expect(quality.grade).toMatch(/[ABC]/)
      expect(quality.metrics.distribution).toBeGreaterThan(50)
    })

    it('should score clustered fleet poorly', () => {
      const clusteredFleet = [
        createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 2),
        createPlacedShip('ship2', { x: 0, y: 2 }, 'horizontal', 2),
        createPlacedShip('ship3', { x: 0, y: 4 }, 'horizontal', 2)
      ]

      const quality = scorePlacement(clusteredFleet)

      expect(quality.metrics.distribution).toBeLessThan(50)
      expect(quality.metrics.unpredictability).toBeLessThan(50)
    })
  })

  describe('calculateDistributionScore', () => {
    it('should return 0 for empty fleet', () => {
      expect(calculateDistributionScore([])).toBe(0)
    })

    it('should score evenly distributed ships highly', () => {
      const evenFleet = [
        createPlacedShip('ship1', { x: 2, y: 2 }, 'horizontal', 2), // Quadrant 1
        createPlacedShip('ship2', { x: 7, y: 2 }, 'horizontal', 2), // Quadrant 2
        createPlacedShip('ship3', { x: 2, y: 7 }, 'horizontal', 2), // Quadrant 3
        createPlacedShip('ship4', { x: 7, y: 7 }, 'horizontal', 2)  // Quadrant 4
      ]

      const score = calculateDistributionScore(evenFleet, 10)
      expect(score).toBeGreaterThan(80)
    })

    it('should score clustered ships poorly', () => {
      const clusteredFleet = [
        createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 2),
        createPlacedShip('ship2', { x: 0, y: 2 }, 'horizontal', 2),
        createPlacedShip('ship3', { x: 2, y: 0 }, 'horizontal', 2),
        createPlacedShip('ship4', { x: 2, y: 2 }, 'horizontal', 2)
      ]

      const score = calculateDistributionScore(clusteredFleet, 10)
      expect(score).toBeLessThan(50)
    })
  })

  describe('calculateUnpredictabilityScore', () => {
    it('should return neutral score for single ship', () => {
      const singleShip = [createPlacedShip('ship1', { x: 5, y: 5 }, 'horizontal', 3)]
      expect(calculateUnpredictabilityScore(singleShip, 10)).toBe(50)
    })

    it('should penalize linear patterns', () => {
      const linearFleet = [
        createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 3),
        createPlacedShip('ship2', { x: 4, y: 0 }, 'horizontal', 3), // Same row
        createPlacedShip('ship3', { x: 7, y: 0 }, 'horizontal', 2)  // Same row
      ]

      const score = calculateUnpredictabilityScore(linearFleet, 10)
      expect(score).toBeLessThan(80) // Should be penalized for pattern
    })

    it('should score random placements highly', () => {
      const randomFleet = [
        createPlacedShip('ship1', { x: 1, y: 1 }, 'horizontal', 2),
        createPlacedShip('ship2', { x: 6, y: 3 }, 'vertical', 3),
        createPlacedShip('ship3', { x: 3, y: 8 }, 'horizontal', 2),
        createPlacedShip('ship4', { x: 8, y: 6 }, 'vertical', 2)
      ]

      const score = calculateUnpredictabilityScore(randomFleet, 10)
      expect(score).toBeGreaterThan(70)
    })
  })

  describe('calculateDefenseScore', () => {
    it('should return 0 for empty fleet', () => {
      expect(calculateDefenseScore([], 10)).toBe(0)
    })

    it('should score edge-placed large ships highly', () => {
      const defensiveFleet = [
        createPlacedShip('carrier', { x: 0, y: 0 }, 'horizontal', 5), // On edge
        createPlacedShip('battleship', { x: 9, y: 5 }, 'vertical', 4) // On edge
      ]

      const score = calculateDefenseScore(defensiveFleet, 10)
      expect(score).toBeGreaterThan(50)
    })
  })

  describe('calculateEfficiencyScore', () => {
    it('should return 0 for empty fleet', () => {
      expect(calculateEfficiencyScore([], 10)).toBe(0)
    })

    it('should score space-efficient placements highly', () => {
      const efficientFleet = [
        createPlacedShip('ship1', { x: 0, y: 0 }, 'horizontal', 5),
        createPlacedShip('ship2', { x: 0, y: 2 }, 'horizontal', 4),
        createPlacedShip('ship3', { x: 0, y: 4 }, 'horizontal', 3)
      ]

      const score = calculateEfficiencyScore(efficientFleet, 10)
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('scoreShipPlacement', () => {
    it('should score individual ship placement', () => {
      const ship = createPlacedShip('test', { x: 5, y: 5 }, 'horizontal', 3)
      const existingShips: PlacedShip[] = []

      const score = scoreShipPlacement(ship, existingShips, 10)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should give higher scores to well-spaced ships', () => {
      const ship = createPlacedShip('test', { x: 5, y: 5 }, 'horizontal', 3)
      const farShip = createPlacedShip('far', { x: 0, y: 0 }, 'horizontal', 2)

      const score = scoreShipPlacement(ship, [farShip], 10)
      expect(score).toBeGreaterThan(40)
    })

    it('should penalize predictable edge placements', () => {
      const edgeShip = createPlacedShip('edge', { x: 0, y: 0 }, 'horizontal', 5)
      const score = scoreShipPlacement(edgeShip, [], 10)

      // Edge ships get some bonus for defense but penalty for predictability
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThan(100)
    })
  })
})
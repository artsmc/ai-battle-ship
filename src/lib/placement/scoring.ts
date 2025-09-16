/**
 * Placement Scoring System
 * Pure functions for evaluating placement quality and strategic value
 *
 * Part of TASK 1: Pure Domain Logic Extraction
 * Algorithm for placement quality assessment
 */

import {
  Cell,
  PlacedShip,
  PlacementQuality,
  PlacementRules,
  STANDARD_RULES
} from './types'

// =============================================
// SCORING ALGORITHMS
// =============================================

/**
 * Calculate comprehensive placement quality score
 * @param placedShips Currently placed ships
 * @param rules Placement rules (default: standard 10x10 board)
 * @returns Quality assessment with score, grade, and detailed metrics
 */
export function scorePlacement(
  placedShips: PlacedShip[],
  rules: PlacementRules = STANDARD_RULES
): PlacementQuality {
  const metrics = {
    distribution: calculateDistributionScore(placedShips, rules.boardSize),
    unpredictability: calculateUnpredictabilityScore(placedShips, rules.boardSize),
    defense: calculateDefenseScore(placedShips, rules.boardSize),
    efficiency: calculateEfficiencyScore(placedShips, rules.boardSize)
  }

  // Weighted average of all metrics
  const score = Math.round(
    metrics.distribution * 0.3 +
    metrics.unpredictability * 0.25 +
    metrics.defense * 0.25 +
    metrics.efficiency * 0.2
  )

  // Assign letter grade based on score
  const grade = getLetterGrade(score)

  return {
    score,
    grade,
    metrics
  }
}

/**
 * Calculate how well ships are distributed across the board
 * @param placedShips Ships to analyze
 * @param boardSize Board dimensions
 * @returns Distribution score (0-100)
 */
export function calculateDistributionScore(
  placedShips: PlacedShip[],
  boardSize: number = 10
): number {
  if (placedShips.length === 0) return 0

  // Divide board into quadrants and measure ship distribution
  const quadrantSize = boardSize / 2
  const quadrants = [0, 0, 0, 0] // top-left, top-right, bottom-left, bottom-right

  for (const ship of placedShips) {
    // Use ship's center point for quadrant assignment
    const centerX = ship.cells.reduce((sum, cell) => sum + cell.x, 0) / ship.cells.length
    const centerY = ship.cells.reduce((sum, cell) => sum + cell.y, 0) / ship.cells.length

    const quadrantX = centerX < quadrantSize ? 0 : 1
    const quadrantY = centerY < quadrantSize ? 0 : 1
    const quadrantIndex = quadrantY * 2 + quadrantX

    quadrants[quadrantIndex]++
  }

  // Calculate distribution evenness (Gini coefficient-inspired)
  const total = placedShips.length
  const average = total / 4
  const variance = quadrants.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / 4
  const maxVariance = Math.pow(total, 2) / 4

  // Convert to 0-100 score (lower variance = higher score)
  return Math.max(0, Math.round(100 - (variance / maxVariance) * 100))
}

/**
 * Calculate how unpredictable the placement pattern is
 * @param placedShips Ships to analyze
 * @param boardSize Board dimensions
 * @returns Unpredictability score (0-100)
 */
export function calculateUnpredictabilityScore(
  placedShips: PlacedShip[],
  boardSize: number = 10
): number {
  if (placedShips.length < 2) return 50 // Neutral score for too few ships

  let score = 100

  // Penalize obvious patterns
  score -= detectLinearPatterns(placedShips) * 20
  score -= detectEdgeBias(placedShips, boardSize) * 15
  score -= detectSymmetry(placedShips, boardSize) * 10
  score -= detectClustering(placedShips) * 15

  return Math.max(0, Math.round(score))
}

/**
 * Calculate defensive positioning score
 * @param placedShips Ships to analyze
 * @param boardSize Board dimensions
 * @returns Defense score (0-100)
 */
export function calculateDefenseScore(
  placedShips: PlacedShip[],
  boardSize: number = 10
): number {
  if (placedShips.length === 0) return 0

  let score = 0

  for (const ship of placedShips) {
    // Larger ships should be harder to find (prefer edges/corners)
    if (ship.length >= 4) {
      const edgeDistance = getMinDistanceToEdge(ship.cells, boardSize)
      score += Math.max(0, 30 - edgeDistance * 10)
    }

    // Smaller ships can be more central
    if (ship.length <= 2) {
      const centerDistance = getAverageDistanceFromCenter(ship.cells, boardSize)
      score += Math.max(0, 20 - centerDistance * 5)
    }

    // Bonus for ships that are harder to detect
    score += calculateConcealmentBonus(ship, placedShips, boardSize)
  }

  return Math.min(100, Math.round(score / placedShips.length))
}

/**
 * Calculate how efficiently board space is used
 * @param placedShips Ships to analyze
 * @param boardSize Board dimensions
 * @returns Efficiency score (0-100)
 */
export function calculateEfficiencyScore(
  placedShips: PlacedShip[],
  boardSize: number = 10
): number {
  if (placedShips.length === 0) return 0

  const totalCells = boardSize * boardSize
  const usedCells = placedShips.reduce((sum, ship) => sum + ship.length, 0)
  const efficiency = (usedCells / totalCells) * 100

  // Also consider how well ships utilize available space
  const spacingPenalty = calculateSpacingPenalty(placedShips, boardSize)

  return Math.max(0, Math.round(efficiency - spacingPenalty))
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Convert numerical score to letter grade
 */
function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  return 'D'
}

/**
 * Detect linear patterns in ship placement
 */
function detectLinearPatterns(placedShips: PlacedShip[]): number {
  let patterns = 0

  // Check for ships in straight lines
  for (let i = 0; i < placedShips.length; i++) {
    for (let j = i + 1; j < placedShips.length; j++) {
      const ship1 = placedShips[i]
      const ship2 = placedShips[j]

      // Check if ships are in same row or column
      const sameRow = ship1.cells.every(cell1 =>
        ship2.cells.some(cell2 => cell1.y === cell2.y)
      )
      const sameColumn = ship1.cells.every(cell1 =>
        ship2.cells.some(cell2 => cell1.x === cell2.x)
      )

      if (sameRow || sameColumn) patterns++
    }
  }

  return Math.min(1, patterns / placedShips.length)
}

/**
 * Detect bias toward board edges
 */
function detectEdgeBias(placedShips: PlacedShip[], boardSize: number): number {
  let edgeShips = 0

  for (const ship of placedShips) {
    const isOnEdge = ship.cells.some(cell =>
      cell.x === 0 || cell.x === boardSize - 1 ||
      cell.y === 0 || cell.y === boardSize - 1
    )

    if (isOnEdge) edgeShips++
  }

  // Some edge placement is good, but too many is predictable
  const edgeRatio = edgeShips / placedShips.length
  return Math.max(0, edgeRatio - 0.4) * 2 // Penalty starts at 40% edge placement
}

/**
 * Detect symmetrical patterns
 */
function detectSymmetry(placedShips: PlacedShip[], boardSize: number): number {
  const center = (boardSize - 1) / 2
  let symmetryScore = 0

  for (const ship of placedShips) {
    const shipCenter = {
      x: ship.cells.reduce((sum, cell) => sum + cell.x, 0) / ship.cells.length,
      y: ship.cells.reduce((sum, cell) => sum + cell.y, 0) / ship.cells.length
    }

    // Check for ships mirrored across center lines
    const mirroredShip = placedShips.find(otherShip => {
      if (otherShip.id === ship.id) return false

      const otherCenter = {
        x: otherShip.cells.reduce((sum, cell) => sum + cell.x, 0) / otherShip.cells.length,
        y: otherShip.cells.reduce((sum, cell) => sum + cell.y, 0) / otherShip.cells.length
      }

      // Check horizontal symmetry
      const horizontalMirror = Math.abs(shipCenter.x - center) === Math.abs(otherCenter.x - center) &&
                               Math.abs(shipCenter.y - otherCenter.y) < 1

      // Check vertical symmetry
      const verticalMirror = Math.abs(shipCenter.y - center) === Math.abs(otherCenter.y - center) &&
                             Math.abs(shipCenter.x - otherCenter.x) < 1

      return horizontalMirror || verticalMirror
    })

    if (mirroredShip) symmetryScore++
  }

  return Math.min(1, symmetryScore / placedShips.length)
}

/**
 * Detect clustering of ships
 */
function detectClustering(placedShips: PlacedShip[]): number {
  let clusters = 0

  for (const ship of placedShips) {
    const nearbyShips = placedShips.filter(otherShip => {
      if (otherShip.id === ship.id) return false

      return ship.cells.some(cell =>
        otherShip.cells.some(otherCell =>
          Math.abs(cell.x - otherCell.x) <= 2 && Math.abs(cell.y - otherCell.y) <= 2
        )
      )
    })

    if (nearbyShips.length > 1) clusters++
  }

  return Math.min(1, clusters / placedShips.length)
}

/**
 * Get minimum distance from any cell to board edge
 */
function getMinDistanceToEdge(cells: Cell[], boardSize: number): number {
  let minDistance = Infinity

  for (const cell of cells) {
    const distance = Math.min(
      cell.x,
      boardSize - 1 - cell.x,
      cell.y,
      boardSize - 1 - cell.y
    )
    minDistance = Math.min(minDistance, distance)
  }

  return minDistance
}

/**
 * Get average distance from cells to board center
 */
function getAverageDistanceFromCenter(cells: Cell[], boardSize: number): number {
  const center = (boardSize - 1) / 2
  let totalDistance = 0

  for (const cell of cells) {
    const distance = Math.sqrt(
      Math.pow(cell.x - center, 2) + Math.pow(cell.y - center, 2)
    )
    totalDistance += distance
  }

  return totalDistance / cells.length
}

/**
 * Calculate concealment bonus for defensive positioning
 */
function calculateConcealmentBonus(
  ship: PlacedShip,
  allShips: PlacedShip[],
  boardSize: number
): number {
  let bonus = 0

  // Bonus for corner placement (harder to find)
  const corners = [
    { x: 0, y: 0 },
    { x: boardSize - 1, y: 0 },
    { x: 0, y: boardSize - 1 },
    { x: boardSize - 1, y: boardSize - 1 }
  ]

  for (const corner of corners) {
    const nearCorner = ship.cells.some(cell =>
      Math.abs(cell.x - corner.x) <= 1 && Math.abs(cell.y - corner.y) <= 1
    )
    if (nearCorner) bonus += 5
  }

  // Penalty for predictable positions
  const isInCenter = ship.cells.some(cell => {
    const center = (boardSize - 1) / 2
    return Math.abs(cell.x - center) <= 1 && Math.abs(cell.y - center) <= 1
  })
  if (isInCenter) bonus -= 10

  return bonus
}

/**
 * Calculate penalty for inefficient spacing
 */
function calculateSpacingPenalty(placedShips: PlacedShip[], boardSize: number): number {
  let penalty = 0
  const totalCells = boardSize * boardSize

  // Calculate wasted space due to ship spacing rules
  let wastedCells = 0
  for (const ship of placedShips) {
    for (const cell of ship.cells) {
      // Count adjacent cells that can't be used
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue

          const adjacentCell = { x: cell.x + dx, y: cell.y + dy }

          // Check if this adjacent cell is within bounds and not occupied
          if (
            adjacentCell.x >= 0 && adjacentCell.x < boardSize &&
            adjacentCell.y >= 0 && adjacentCell.y < boardSize &&
            !placedShips.some(otherShip =>
              otherShip.cells.some(otherCell =>
                otherCell.x === adjacentCell.x && otherCell.y === adjacentCell.y
              )
            )
          ) {
            wastedCells++
          }
        }
      }
    }
  }

  // Convert wasted space to penalty percentage
  penalty = (wastedCells / totalCells) * 100

  return Math.min(50, penalty) // Cap penalty at 50%
}

/**
 * Score a single ship placement in isolation
 * @param ship Ship to score
 * @param existingShips Other ships already placed
 * @param boardSize Board dimensions
 * @returns Individual ship score (0-100)
 */
export function scoreShipPlacement(
  ship: PlacedShip,
  existingShips: PlacedShip[],
  boardSize: number = 10
): number {
  let score = 50 // Base score

  // Score based on ship size and positioning
  if (ship.length >= 4) {
    // Large ships benefit from edge placement
    const edgeDistance = getMinDistanceToEdge(ship.cells, boardSize)
    score += Math.max(0, 20 - edgeDistance * 5)
  } else {
    // Small ships can be more central
    const centerDistance = getAverageDistanceFromCenter(ship.cells, boardSize)
    score += Math.max(0, 20 - centerDistance * 3)
  }

  // Bonus for good spacing from other ships
  const spacing = getMinDistanceToOtherShips(ship, existingShips)
  score += Math.min(20, spacing * 4)

  // Penalty for predictable positions
  if (isInPredictablePosition(ship, boardSize)) {
    score -= 15
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Check if ship is in a predictable position
 */
function isInPredictablePosition(ship: PlacedShip, boardSize: number): boolean {
  // Check if ship is exactly on board edges (too obvious)
  const onTopEdge = ship.cells.every(cell => cell.y === 0)
  const onBottomEdge = ship.cells.every(cell => cell.y === boardSize - 1)
  const onLeftEdge = ship.cells.every(cell => cell.x === 0)
  const onRightEdge = ship.cells.every(cell => cell.x === boardSize - 1)

  // Check if ship is exactly in center
  const center = (boardSize - 1) / 2
  const inExactCenter = ship.cells.every(cell =>
    Math.abs(cell.x - center) <= 0.5 && Math.abs(cell.y - center) <= 0.5
  )

  return onTopEdge || onBottomEdge || onLeftEdge || onRightEdge || inExactCenter
}

/**
 * Get minimum distance to any other ship
 */
function getMinDistanceToOtherShips(ship: PlacedShip, otherShips: PlacedShip[]): number {
  if (otherShips.length === 0) return 10 // Maximum score for no other ships

  let minDistance = Infinity

  for (const cell of ship.cells) {
    for (const otherShip of otherShips) {
      if (otherShip.id === ship.id) continue

      for (const otherCell of otherShip.cells) {
        const distance = Math.sqrt(
          Math.pow(cell.x - otherCell.x, 2) + Math.pow(cell.y - otherCell.y, 2)
        )
        minDistance = Math.min(minDistance, distance)
      }
    }
  }

  return minDistance === Infinity ? 10 : minDistance
}


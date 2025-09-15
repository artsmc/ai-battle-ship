/**
 * Placement Validator
 *
 * Validates ship placement according to game rules including:
 * - Boundary checking
 * - Overlap detection
 * - Adjacent ship rules
 * - Fleet composition validation
 */

import {
  Coordinate,
  Orientation,
  ValidationResult,
  ValidationError,
  GameShip,
  BoardState,
  Bounds
} from '../types'
import { Board } from '../Board'

export interface PlacementValidationConfig {
  allowAdjacentShips: boolean
  enforceFleetComposition: boolean
  customBounds?: Bounds
  minDistanceBetweenShips?: number
}

export interface FleetValidationResult extends ValidationResult {
  missingShips: string[]
  duplicateShips: string[]
  compositionErrors: ValidationError[]
}

export interface PlacementAttempt {
  shipId: string
  shipSize: number
  startPosition: Coordinate
  orientation: Orientation
  timestamp: Date
}

export class PlacementValidator {
  private readonly board: Board
  private readonly config: PlacementValidationConfig
  private placementHistory: PlacementAttempt[]

  constructor(board: Board, config: Partial<PlacementValidationConfig> = {}) {
    this.board = board
    this.config = {
      allowAdjacentShips: false,
      enforceFleetComposition: true,
      minDistanceBetweenShips: 1,
      ...config
    }
    this.placementHistory = []
  }

  // =============================================
  // SINGLE SHIP VALIDATION
  // =============================================

  validateSinglePlacement(
    shipId: string,
    shipSize: number,
    startPosition: Coordinate,
    orientation: Orientation
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Calculate ship coordinates
    const coordinates = this.calculateShipCoordinates(startPosition, shipSize, orientation)

    // Record placement attempt
    this.recordPlacementAttempt(shipId, shipSize, startPosition, orientation)

    // Validate boundaries
    const boundaryValidation = this.validateBoundaries(coordinates)
    if (!boundaryValidation.isValid) {
      errors.push(...boundaryValidation.errors)
    }

    // Validate overlaps
    const overlapValidation = this.validateOverlaps(coordinates, shipId)
    if (!overlapValidation.isValid) {
      errors.push(...overlapValidation.errors)
    }

    // Validate ship spacing
    if (!this.config.allowAdjacentShips) {
      const spacingValidation = this.validateShipSpacing(coordinates, shipId)
      if (!spacingValidation.isValid) {
        warnings.push(...spacingValidation.warnings)
      }
    }

    // Validate ship size constraints
    const sizeValidation = this.validateShipSize(shipSize)
    if (!sizeValidation.isValid) {
      errors.push(...sizeValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private calculateShipCoordinates(
    start: Coordinate,
    size: number,
    orientation: Orientation
  ): Coordinate[] {
    const coordinates: Coordinate[] = []

    for (let i = 0; i < size; i++) {
      if (orientation === 'horizontal') {
        coordinates.push({ x: start.x + i, y: start.y })
      } else {
        coordinates.push({ x: start.x, y: start.y + i })
      }
    }

    return coordinates
  }

  private validateBoundaries(coordinates: Coordinate[]): ValidationResult {
    const errors: ValidationError[] = []
    const bounds = this.config.customBounds || this.board.getBounds()

    for (const coord of coordinates) {
      if (coord.x < bounds.minX || coord.x > bounds.maxX ||
          coord.y < bounds.minY || coord.y > bounds.maxY) {
        errors.push({
          code: 'OUT_OF_BOUNDS',
          message: `Coordinate (${coord.x}, ${coord.y}) is outside the valid game area`,
          field: 'coordinates',
          value: coord
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private validateOverlaps(coordinates: Coordinate[], excludeShipId?: string): ValidationResult {
    const errors: ValidationError[] = []

    for (const coord of coordinates) {
      const cell = this.board.getCell(coord)
      if (cell?.hasShip && cell.shipId !== excludeShipId) {
        errors.push({
          code: 'SHIP_OVERLAP',
          message: `Position (${coord.x}, ${coord.y}) is already occupied by ship ${cell.shipId}`,
          field: 'coordinates',
          value: coord
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  private validateShipSpacing(coordinates: Coordinate[], excludeShipId?: string): ValidationResult {
    const warnings: string[] = []
    const minDistance = this.config.minDistanceBetweenShips || 1

    for (const coord of coordinates) {
      if (this.hasShipsWithinDistance(coord, minDistance, excludeShipId)) {
        warnings.push(`Ship at (${coord.x}, ${coord.y}) is too close to another ship`)
        break // Only warn once per ship
      }
    }

    return {
      isValid: true,
      errors: [],
      warnings
    }
  }

  private hasShipsWithinDistance(
    center: Coordinate,
    distance: number,
    excludeShipId?: string
  ): boolean {
    for (let dx = -distance; dx <= distance; dx++) {
      for (let dy = -distance; dy <= distance; dy++) {
        if (dx === 0 && dy === 0) continue

        const checkCoord = { x: center.x + dx, y: center.y + dy }
        const cell = this.board.getCell(checkCoord)

        if (cell?.hasShip && cell.shipId !== excludeShipId) {
          return true
        }
      }
    }

    return false
  }

  private validateShipSize(size: number): ValidationResult {
    const errors: ValidationError[] = []

    if (size < 1) {
      errors.push({
        code: 'INVALID_SHIP_SIZE',
        message: 'Ship size must be at least 1',
        field: 'size',
        value: size
      })
    }

    if (size > 5) {
      errors.push({
        code: 'SHIP_TOO_LARGE',
        message: 'Ship size cannot exceed 5',
        field: 'size',
        value: size
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  // =============================================
  // FLEET VALIDATION
  // =============================================

  validateFleetComposition(ships: GameShip[]): FleetValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    const missingShips: string[] = []
    const duplicateShips: string[] = []

    if (!this.config.enforceFleetComposition) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        missingShips: [],
        duplicateShips: [],
        compositionErrors: []
      }
    }

    // Standard fleet composition
    const requiredFleet = {
      carrier: { count: 1, size: 5 },
      battleship: { count: 1, size: 4 },
      cruiser: { count: 2, size: 3 },
      destroyer: { count: 3, size: 2 }
    }

    // Count ships by type and size
    const shipCounts: Record<string, number> = {}
    const shipsBySize: Record<number, number> = {}

    for (const ship of ships) {
      const shipType = this.getShipTypeBySize(ship.size)
      shipCounts[shipType] = (shipCounts[shipType] || 0) + 1
      shipsBySize[ship.size] = (shipsBySize[ship.size] || 0) + 1
    }

    // Validate each ship type
    for (const [type, requirements] of Object.entries(requiredFleet)) {
      const actualCount = shipCounts[type] || 0
      const requiredCount = requirements.count

      if (actualCount < requiredCount) {
        const missing = requiredCount - actualCount
        for (let i = 0; i < missing; i++) {
          missingShips.push(type)
        }
        errors.push({
          code: 'INSUFFICIENT_SHIPS',
          message: `Missing ${missing} ${type}(s). Required: ${requiredCount}, Found: ${actualCount}`,
          field: 'fleet',
          value: { type, required: requiredCount, actual: actualCount }
        })
      } else if (actualCount > requiredCount) {
        const excess = actualCount - requiredCount
        for (let i = 0; i < excess; i++) {
          duplicateShips.push(type)
        }
        warnings.push(`Too many ${type}s. Required: ${requiredCount}, Found: ${actualCount}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingShips,
      duplicateShips,
      compositionErrors: errors
    }
  }

  private getShipTypeBySize(size: number): string {
    switch (size) {
      case 5: return 'carrier'
      case 4: return 'battleship'
      case 3: return 'cruiser'
      case 2: return 'destroyer'
      default: return 'unknown'
    }
  }

  validateCompleteFleet(ships: GameShip[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Check fleet composition
    const fleetValidation = this.validateFleetComposition(ships)
    errors.push(...fleetValidation.errors)
    warnings.push(...fleetValidation.warnings)

    // Check that all ships are positioned
    const unpositionedShips = ships.filter(ship => !ship.position)
    if (unpositionedShips.length > 0) {
      errors.push({
        code: 'UNPOSITIONED_SHIPS',
        message: `${unpositionedShips.length} ship(s) are not positioned on the board`,
        field: 'fleet',
        value: unpositionedShips.map(ship => ship.id)
      })
    }

    // Check for position conflicts
    const positionConflicts = this.checkPositionConflicts(ships)
    errors.push(...positionConflicts)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private checkPositionConflicts(ships: GameShip[]): ValidationError[] {
    const errors: ValidationError[] = []
    const occupiedPositions = new Map<string, string>()

    for (const ship of ships) {
      if (!ship.position) continue

      for (const coord of ship.position.coordinates) {
        const posKey = `${coord.x},${coord.y}`
        const existingShipId = occupiedPositions.get(posKey)

        if (existingShipId && existingShipId !== ship.id) {
          errors.push({
            code: 'POSITION_CONFLICT',
            message: `Ships ${ship.id} and ${existingShipId} both occupy position (${coord.x}, ${coord.y})`,
            field: 'position',
            value: { ship1: ship.id, ship2: existingShipId, coordinate: coord }
          })
        } else {
          occupiedPositions.set(posKey, ship.id)
        }
      }
    }

    return errors
  }

  // =============================================
  // PLACEMENT SUGGESTIONS
  // =============================================

  suggestValidPlacements(
    shipSize: number,
    maxSuggestions: number = 10
  ): PlacementSuggestion[] {
    const suggestions: PlacementSuggestion[] = []
    const bounds = this.board.getBounds()

    for (let y = bounds.minY; y <= bounds.maxY && suggestions.length < maxSuggestions; y++) {
      for (let x = bounds.minX; x <= bounds.maxX && suggestions.length < maxSuggestions; x++) {
        const startPos = { x, y }

        // Try both orientations
        for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
          if (suggestions.length >= maxSuggestions) break

          const validation = this.validateSinglePlacement(
            'temp_ship',
            shipSize,
            startPos,
            orientation
          )

          if (validation.isValid) {
            const coordinates = this.calculateShipCoordinates(startPos, shipSize, orientation)
            suggestions.push({
              startPosition: startPos,
              orientation,
              coordinates,
              score: this.calculatePlacementScore(coordinates),
              warningCount: validation.warnings.length
            })
          }
        }
      }
    }

    // Sort by score (higher is better)
    return suggestions.sort((a, b) => b.score - a.score)
  }

  private calculatePlacementScore(coordinates: Coordinate[]): number {
    let score = 100 // Base score

    // Prefer positions away from edges
    const bounds = this.board.getBounds()
    for (const coord of coordinates) {
      const distanceFromEdge = Math.min(
        coord.x - bounds.minX,
        bounds.maxX - coord.x,
        coord.y - bounds.minY,
        bounds.maxY - coord.y
      )
      score += distanceFromEdge * 2
    }

    // Prefer positions away from other ships
    for (const coord of coordinates) {
      const nearbyShips = this.countNearbyShips(coord, 2)
      score -= nearbyShips * 10
    }

    return score
  }

  private countNearbyShips(center: Coordinate, radius: number): number {
    let count = 0

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue

        const checkCoord = { x: center.x + dx, y: center.y + dy }
        const cell = this.board.getCell(checkCoord)

        if (cell?.hasShip) {
          count++
        }
      }
    }

    return count
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private recordPlacementAttempt(
    shipId: string,
    shipSize: number,
    startPosition: Coordinate,
    orientation: Orientation
  ): void {
    this.placementHistory.push({
      shipId,
      shipSize,
      startPosition,
      orientation,
      timestamp: new Date()
    })

    // Keep only last 50 attempts
    if (this.placementHistory.length > 50) {
      this.placementHistory = this.placementHistory.slice(-50)
    }
  }

  getPlacementHistory(): PlacementAttempt[] {
    return [...this.placementHistory]
  }

  getValidPlacementCount(shipSize: number): number {
    const bounds = this.board.getBounds()
    let count = 0

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const startPos = { x, y }

        for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
          const validation = this.validateSinglePlacement(
            'temp_ship',
            shipSize,
            startPos,
            orientation
          )

          if (validation.isValid) {
            count++
          }
        }
      }
    }

    return count
  }

  canPlaceAnyShip(shipSizes: number[]): boolean {
    for (const size of shipSizes) {
      if (this.getValidPlacementCount(size) > 0) {
        return true
      }
    }
    return false
  }

  resetHistory(): void {
    this.placementHistory = []
  }
}

// =============================================
// TYPES
// =============================================

export interface PlacementSuggestion {
  startPosition: Coordinate
  orientation: Orientation
  coordinates: Coordinate[]
  score: number
  warningCount: number
}
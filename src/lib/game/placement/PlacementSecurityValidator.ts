/**
 * PlacementSecurityValidator
 * Enhanced ship placement validation with anti-cheat mechanisms
 */

import {
  Coordinate,
  ShipPosition,
  BoardState,
  ValidationResult,
  ValidationError,
  GamePlayer
} from '../types'
import { ShipClass } from '../../database/types/enums'
import {
  sanitizeCoordinate,
  sanitizeShipPlacement,
  validateShipPlacementIntegrity,
  validateAttackPattern,
  RateLimiter,
  defaultSecurityConfig
} from '../utils/security'
import {
  areCoordinatesContiguous,
  isCoordinateInBounds,
  doCoordinatesOverlap
} from '../utils/coordinates'

export interface PlacementValidationResult extends ValidationResult {
  sanitizedPosition?: ShipPosition
  suspiciousActivity?: boolean
  cheatingAttempt?: boolean
}

export class PlacementSecurityValidator {
  private rateLimiter: RateLimiter
  private placementHistory: Map<string, PlacementAttempt[]> = new Map()
  private suspiciousPlayers: Set<string> = new Set()

  constructor() {
    this.rateLimiter = new RateLimiter(defaultSecurityConfig.rateLimits.shipPlacement)
  }

  /**
   * Validate ship placement with comprehensive security checks
   */
  validateShipPlacement(
    playerId: string,
    position: ShipPosition,
    shipClass: ShipClass,
    boardState: BoardState
  ): PlacementValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Check rate limiting
    const rateLimitCheck = this.rateLimiter.checkRateLimit(playerId, 'placement')
    if (!rateLimitCheck.isValid) {
      this.recordSuspiciousActivity(playerId, 'rate_limit_exceeded')
      return {
        ...rateLimitCheck,
        suspiciousActivity: true,
        cheatingAttempt: false
      }
    }
    warnings.push(...rateLimitCheck.warnings)

    // Sanitize ship placement coordinates
    const sanitizedPlacement = sanitizeShipPlacement(
      position.coordinates,
      boardState.width,
      boardState.height
    )

    if (!sanitizedPlacement.valid || !sanitizedPlacement.coordinates) {
      errors.push({
        code: 'INVALID_PLACEMENT',
        message: sanitizedPlacement.error || 'Invalid ship placement'
      })
      this.recordPlacementAttempt(playerId, position, false, 'invalid_coordinates')
      return { isValid: false, errors, warnings }
    }

    // Create sanitized position
    const sanitizedPosition: ShipPosition = {
      ...position,
      coordinates: sanitizedPlacement.coordinates
    }

    // Get expected ship size based on class
    const expectedSize = this.getShipSizeByClass(shipClass)

    // Validate placement integrity (anti-cheat)
    const integrityCheck = validateShipPlacementIntegrity(
      sanitizedPosition.coordinates,
      expectedSize,
      boardState.width,
      boardState.height
    )

    if (!integrityCheck.isValid) {
      this.recordSuspiciousActivity(playerId, 'integrity_violation')
      this.recordPlacementAttempt(playerId, position, false, 'integrity_check_failed')

      // Mark as potential cheating attempt
      if (this.isCheatingAttempt(playerId)) {
        return {
          ...integrityCheck,
          sanitizedPosition,
          suspiciousActivity: true,
          cheatingAttempt: true
        }
      }

      return {
        ...integrityCheck,
        sanitizedPosition,
        suspiciousActivity: true,
        cheatingAttempt: false
      }
    }

    // Check for overlaps with existing ships
    const overlapCheck = this.checkForOverlaps(
      sanitizedPosition,
      boardState,
      playerId
    )

    if (!overlapCheck.isValid) {
      this.recordPlacementAttempt(playerId, position, false, 'overlap_detected')
      return {
        ...overlapCheck,
        sanitizedPosition,
        suspiciousActivity: false,
        cheatingAttempt: false
      }
    }

    // Check placement patterns for suspicious behavior
    const patternCheck = this.checkPlacementPattern(playerId, sanitizedPosition)
    if (patternCheck.suspicious) {
      warnings.push(`Suspicious placement pattern detected: ${patternCheck.reason}`)
      this.recordSuspiciousActivity(playerId, 'suspicious_pattern')
    }

    // Check minimum ship spacing (optional game rule)
    const spacingCheck = this.validateShipSpacing(
      sanitizedPosition,
      boardState,
      1 // Minimum 1 cell between ships
    )

    if (!spacingCheck.isValid && spacingCheck.warnings.length > 0) {
      warnings.push(...spacingCheck.warnings)
    }

    // Record successful placement attempt
    this.recordPlacementAttempt(playerId, sanitizedPosition, true, 'valid')

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedPosition,
      suspiciousActivity: patternCheck.suspicious,
      cheatingAttempt: false
    }
  }

  /**
   * Validate all ships placement for a player
   */
  validateFleetPlacement(
    playerId: string,
    fleet: ShipPosition[],
    boardState: BoardState
  ): PlacementValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    let suspiciousActivity = false

    // Check for duplicate ship IDs
    const shipIds = new Set<string>()
    for (const ship of fleet) {
      if (shipIds.has(ship.shipId)) {
        errors.push({
          code: 'DUPLICATE_SHIP_ID',
          message: `Duplicate ship ID detected: ${ship.shipId}`
        })
        suspiciousActivity = true
      }
      shipIds.add(ship.shipId)
    }

    // Check for overlapping coordinates across all ships
    const allCoordinates = new Set<string>()
    for (const ship of fleet) {
      for (const coord of ship.coordinates) {
        const key = `${coord.x},${coord.y}`
        if (allCoordinates.has(key)) {
          errors.push({
            code: 'FLEET_OVERLAP',
            message: `Ships overlap at coordinate (${coord.x}, ${coord.y})`
          })
          suspiciousActivity = true
        }
        allCoordinates.add(key)
      }
    }

    // Check fleet composition
    const compositionCheck = this.validateFleetComposition(fleet)
    if (!compositionCheck.isValid) {
      errors.push(...compositionCheck.errors)
      suspiciousActivity = true
    }

    // Check for suspicious fleet patterns
    const fleetPattern = this.analyzeFleetPattern(fleet)
    if (fleetPattern.suspicious) {
      warnings.push(`Suspicious fleet pattern: ${fleetPattern.reason}`)
      suspiciousActivity = true
      this.recordSuspiciousActivity(playerId, 'suspicious_fleet_pattern')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suspiciousActivity,
      cheatingAttempt: suspiciousActivity && this.isCheatingAttempt(playerId)
    }
  }

  /**
   * Check for overlaps with existing ships
   */
  private checkForOverlaps(
    position: ShipPosition,
    boardState: BoardState,
    playerId: string
  ): ValidationResult {
    const errors: ValidationError[] = []

    for (const existingPosition of Array.from(boardState.ships.values())) {
      if (existingPosition.shipId !== position.shipId &&
          doCoordinatesOverlap(position.coordinates, existingPosition.coordinates)) {
        errors.push({
          code: 'SHIP_OVERLAP',
          message: 'Ship overlaps with existing ship',
          field: 'coordinates',
          value: position.coordinates
        })
        break
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * Validate ship spacing (optional rule)
   */
  private validateShipSpacing(
    position: ShipPosition,
    boardState: BoardState,
    minSpacing: number
  ): ValidationResult {
    const warnings: string[] = []

    if (minSpacing <= 0) {
      return { isValid: true, errors: [], warnings: [] }
    }

    for (const existingPosition of Array.from(boardState.ships.values())) {
      if (existingPosition.shipId === position.shipId) continue

      for (const newCoord of position.coordinates) {
        for (const existingCoord of existingPosition.coordinates) {
          const distance = Math.abs(newCoord.x - existingCoord.x) +
                          Math.abs(newCoord.y - existingCoord.y)

          if (distance < minSpacing) {
            warnings.push(`Ships are too close (minimum spacing: ${minSpacing})`)
            return { isValid: true, errors: [], warnings }
          }
        }
      }
    }

    return { isValid: true, errors: [], warnings }
  }

  /**
   * Check placement pattern for suspicious behavior
   */
  private checkPlacementPattern(
    playerId: string,
    position: ShipPosition
  ): { suspicious: boolean; reason?: string } {
    const history = this.placementHistory.get(playerId) || []

    // Check for rapid placement changes (possible automation)
    const recentChanges = history.filter(a =>
      a.timestamp > Date.now() - 5000 && // Last 5 seconds
      a.shipId === position.shipId
    )

    if (recentChanges.length > 3) {
      return {
        suspicious: true,
        reason: 'Rapid placement changes detected'
      }
    }

    // Check for programmatic patterns (all ships in perfect lines/grids)
    const coordinates = position.coordinates
    if (coordinates.length > 2) {
      const isHorizontal = coordinates.every(c => c.y === coordinates[0].y)
      const isVertical = coordinates.every(c => c.x === coordinates[0].x)

      // Check if coordinates are perfectly spaced
      if (isHorizontal || isVertical) {
        const sorted = [...coordinates].sort((a, b) =>
          isHorizontal ? a.x - b.x : a.y - b.y
        )

        let perfectSpacing = true
        for (let i = 1; i < sorted.length; i++) {
          const diff = isHorizontal
            ? sorted[i].x - sorted[i - 1].x
            : sorted[i].y - sorted[i - 1].y
          if (diff !== 1) {
            perfectSpacing = false
            break
          }
        }

        // This is actually expected behavior, not suspicious
        if (!perfectSpacing) {
          return {
            suspicious: true,
            reason: 'Non-contiguous ship placement'
          }
        }
      }
    }

    return { suspicious: false }
  }

  /**
   * Analyze fleet pattern for suspicious behavior
   */
  private analyzeFleetPattern(fleet: ShipPosition[]): {
    suspicious: boolean
    reason?: string
  } {
    // Check if all ships are clustered in one corner
    const allCoords = fleet.flatMap(s => s.coordinates)
    const avgX = allCoords.reduce((sum, c) => sum + c.x, 0) / allCoords.length
    const avgY = allCoords.reduce((sum, c) => sum + c.y, 0) / allCoords.length

    // If average position is too close to corners, it might be suspicious
    if ((avgX < 2 || avgX > 7) && (avgY < 2 || avgY > 7)) {
      return {
        suspicious: true,
        reason: 'All ships clustered in corner'
      }
    }

    // Check if all ships are in a perfect grid pattern
    const xCoords = new Set(allCoords.map(c => c.x))
    const yCoords = new Set(allCoords.map(c => c.y))

    if (xCoords.size < 3 || yCoords.size < 3) {
      return {
        suspicious: true,
        reason: 'Ships arranged in limited grid pattern'
      }
    }

    return { suspicious: false }
  }

  /**
   * Validate fleet composition
   */
  private validateFleetComposition(fleet: ShipPosition[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // This would need actual ship class information from the fleet
    // For now, just check basic constraints
    if (fleet.length < 3) {
      errors.push({
        code: 'INSUFFICIENT_FLEET',
        message: 'Fleet must have at least 3 ships'
      })
    }

    if (fleet.length > 10) {
      errors.push({
        code: 'EXCESSIVE_FLEET',
        message: 'Fleet exceeds maximum ship count'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Get expected ship size by class
   */
  private getShipSizeByClass(shipClass: ShipClass): number {
    const shipSizes: Record<ShipClass, number> = {
      [ShipClass.CARRIER]: 5,
      [ShipClass.BATTLESHIP]: 4,
      [ShipClass.HEAVY_CRUISER]: 3,
      [ShipClass.LIGHT_CRUISER]: 3,
      [ShipClass.DESTROYER]: 2,
      [ShipClass.SUBMARINE]: 3
    }
    return shipSizes[shipClass] || 3
  }

  /**
   * Record placement attempt for pattern analysis
   */
  private recordPlacementAttempt(
    playerId: string,
    position: ShipPosition,
    success: boolean,
    reason: string
  ): void {
    const history = this.placementHistory.get(playerId) || []
    const attempt: PlacementAttempt = {
      shipId: position.shipId,
      coordinates: position.coordinates,
      timestamp: Date.now(),
      success,
      reason
    }

    history.push(attempt)

    // Keep only recent history (last 100 attempts or last hour)
    const cutoffTime = Date.now() - 3600000 // 1 hour
    const recentHistory = history.filter(a =>
      a.timestamp > cutoffTime
    ).slice(-100)

    this.placementHistory.set(playerId, recentHistory)
  }

  /**
   * Record suspicious activity
   */
  private recordSuspiciousActivity(playerId: string, reason: string): void {
    this.suspiciousPlayers.add(playerId)

    // Log for monitoring (in production, this would go to a security log)
    console.warn(`Suspicious activity detected for player ${playerId}: ${reason}`)
  }

  /**
   * Check if player has too many suspicious activities
   */
  private isCheatingAttempt(playerId: string): boolean {
    const history = this.placementHistory.get(playerId) || []
    const failedAttempts = history.filter(a =>
      !a.success && a.timestamp > Date.now() - 60000 // Last minute
    )

    // If more than 5 failed attempts in last minute, consider it cheating
    return failedAttempts.length > 5 || this.suspiciousPlayers.has(playerId)
  }

  /**
   * Clear history for a player (useful for game reset)
   */
  clearPlayerHistory(playerId: string): void {
    this.placementHistory.delete(playerId)
    this.suspiciousPlayers.delete(playerId)
    this.rateLimiter.resetLimit(playerId)
  }

  /**
   * Clear all histories
   */
  clearAllHistory(): void {
    this.placementHistory.clear()
    this.suspiciousPlayers.clear()
    this.rateLimiter.clearAll()
  }
}

interface PlacementAttempt {
  shipId: string
  coordinates: Coordinate[]
  timestamp: number
  success: boolean
  reason: string
}
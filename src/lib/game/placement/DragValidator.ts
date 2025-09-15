/**
 * Drag Validator
 *
 * Handles validation logic during drag operations:
 * - Ship placement validation
 * - Rotation validation
 * - Collision validation
 * - Final placement checks
 */

import { Coordinate, Orientation, GameShip } from '../types'
import { PlacementValidator } from './PlacementValidator'
import { CollisionDetector } from './CollisionDetector'

export interface ValidationResult {
  isValid: boolean
  canRotate: boolean
  canPlace: boolean
  hasCollisions: boolean
}

export interface ValidationCallbacks {
  onValidationChange: (isValid: boolean) => void
}

export class DragValidator {
  private readonly validator: PlacementValidator
  private readonly collisionDetector: CollisionDetector
  private readonly callbacks: ValidationCallbacks

  constructor(
    validator: PlacementValidator,
    collisionDetector: CollisionDetector,
    callbacks: ValidationCallbacks
  ) {
    this.validator = validator
    this.collisionDetector = collisionDetector
    this.callbacks = callbacks
  }

  // =============================================
  // VALIDATION METHODS
  // =============================================

  validatePlacement(
    ship: GameShip,
    position: Coordinate,
    orientation: Orientation
  ): ValidationResult {
    const validation = this.validator.validateSinglePlacement(
      ship.id,
      ship.size,
      position,
      orientation
    )

    const isValid = validation.isValid
    const canPlace = isValid || validation.errors.every(e =>
      e.code !== 'SHIP_OVERLAP' && e.code !== 'OUT_OF_BOUNDS'
    )

    const hasCollisions = validation.errors.some(e => e.code === 'SHIP_OVERLAP')

    this.callbacks.onValidationChange(isValid)

    return {
      isValid,
      canRotate: canPlace, // Can rotate if placement is possible
      canPlace,
      hasCollisions
    }
  }

  validateRotation(
    ship: GameShip,
    position: Coordinate,
    currentOrientation: Orientation
  ): ValidationResult {
    const newOrientation: Orientation =
      currentOrientation === 'horizontal' ? 'vertical' : 'horizontal'

    return this.validatePlacement(ship, position, newOrientation)
  }

  validateFinalPlacement(
    ship: GameShip,
    finalPosition: Coordinate,
    orientation: Orientation
  ): boolean {
    const validation = this.validator.validateSinglePlacement(
      ship.id,
      ship.size,
      finalPosition,
      orientation
    )

    return validation.isValid || validation.errors.every(e =>
      e.code !== 'SHIP_OVERLAP' && e.code !== 'OUT_OF_BOUNDS'
    )
  }

  // =============================================
  // COLLISION DETECTION INTEGRATION
  // =============================================

  startDragTracking(
    shipId: string,
    shipSize: number,
    position: Coordinate,
    orientation: Orientation
  ): void {
    this.collisionDetector.startDragTracking(shipId, shipSize, position, orientation)
  }

  updateDragPosition(position: Coordinate, orientation: Orientation) {
    return this.collisionDetector.updateDragPosition(position, orientation)
  }

  stopDragTracking(): void {
    this.collisionDetector.stopDragTracking()
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isValidPosition(
    ship: GameShip,
    position: Coordinate,
    orientation: Orientation
  ): boolean {
    const result = this.validatePlacement(ship, position, orientation)
    return result.isValid
  }

  canRotateAt(
    ship: GameShip,
    position: Coordinate,
    currentOrientation: Orientation
  ): boolean {
    const result = this.validateRotation(ship, position, currentOrientation)
    return result.canRotate
  }
}
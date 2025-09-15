/**
 * Drag and Drop Handler
 *
 * Coordinates all drag and drop interactions for ship placement by:
 * - Managing touch and mouse input handlers
 * - Coordinating drag state management
 * - Handling ship rotation and validation
 * - Providing unified public API
 * - Managing keyboard accessibility
 */

import {
  Coordinate,
  Orientation,
  GameShip
} from '../types'
import { CollisionDetector, CollisionResult } from './CollisionDetector'
import { PlacementValidator } from './PlacementValidator'
import { TouchHandler } from './TouchHandler'
import { MouseHandler } from './MouseHandler'
import { DragStateManager, DragState } from './DragStateManager'
import { DragValidator } from './DragValidator'

// Re-export types for backward compatibility
export type { DragState, TouchState } from './TouchHandler'
export type { DragState as DragStateType } from './DragStateManager'

export interface DragEventHandlers {
  onDragStart: (ship: GameShip, position: Coordinate) => void
  onDragMove: (position: Coordinate, gridPosition: Coordinate) => void
  onDragEnd: (ship: GameShip, finalPosition: Coordinate, orientation: Orientation) => boolean
  onRotate: (ship: GameShip, newOrientation: Orientation) => void
  onCollisionChange: (collision: CollisionResult) => void
  onValidationChange: (isValid: boolean) => void
}

export interface DragConfig {
  snapToGrid: boolean
  allowRotation: boolean
  rotationKey: string
  gridSize: number
  dragThreshold: number
  enablePreview: boolean
  enableHapticFeedback: boolean
  touchSensitivity: number
}

export class DragDropHandler {
  private readonly collisionDetector: CollisionDetector
  private readonly validator: PlacementValidator
  private readonly config: DragConfig
  private readonly handlers: DragEventHandlers

  // Component handlers
  private readonly touchHandler: TouchHandler
  private readonly mouseHandler: MouseHandler
  private readonly stateManager: DragStateManager
  private readonly dragValidator: DragValidator

  // Keyboard handling
  private keyboardHandler: EventListener

  constructor(
    collisionDetector: CollisionDetector,
    validator: PlacementValidator,
    handlers: DragEventHandlers,
    config: Partial<DragConfig> = {}
  ) {
    this.collisionDetector = collisionDetector
    this.validator = validator
    this.handlers = handlers
    this.config = {
      snapToGrid: true,
      allowRotation: true,
      rotationKey: 'r',
      gridSize: 40,
      dragThreshold: 5,
      enablePreview: true,
      enableHapticFeedback: true,
      touchSensitivity: 1.0,
      ...config
    }

    // Initialize component handlers
    this.touchHandler = this.createTouchHandler()
    this.mouseHandler = this.createMouseHandler()
    this.stateManager = this.createStateManager()
    this.dragValidator = this.createDragValidator()

    // Bind keyboard events
    this.keyboardHandler = this.handleKeyDown.bind(this)
    document.addEventListener('keydown', this.keyboardHandler)
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private createTouchHandler(): TouchHandler {
    return new TouchHandler({
      onTouchStart: (ship, element, position, offset) => this.startDrag(ship, element, position, offset),
      onTouchMove: (position) => this.stateManager.updatePosition(position),
      onTouchEnd: () => this.finalizeDrag(),
      onRotate: () => this.handleShipRotation(),
      onVibrate: (pattern) => this.vibrate(pattern)
    }, {
      touchSensitivity: this.config.touchSensitivity,
      enableHapticFeedback: this.config.enableHapticFeedback
    })
  }

  private createMouseHandler(): MouseHandler {
    return new MouseHandler({
      onMouseStart: (ship, element, position, offset) => this.startDrag(ship, element, position, offset),
      onMouseMove: (position) => this.stateManager.updatePosition(position),
      onMouseEnd: () => this.finalizeDrag(),
      onContextMenuPrevention: (event) => {
        if (this.stateManager.isDragging()) event.preventDefault()
      }
    }, {
      dragThreshold: this.config.dragThreshold
    })
  }

  private createStateManager(): DragStateManager {
    return new DragStateManager({
      onStateChange: (_state) => { /* handled internally */ },
      onGridPositionChange: (oldPos, newPos, orientation) => {
        this.updateCollisionDetection(newPos, orientation)
        this.handlers.onDragMove(newPos, newPos)
      },
      onPreviewUpdate: (_element, _position, _orientation, _isValid) => { /* handled by state manager */ }
    }, {
      snapToGrid: this.config.snapToGrid,
      gridSize: this.config.gridSize,
      enablePreview: this.config.enablePreview
    })
  }

  private createDragValidator(): DragValidator {
    return new DragValidator(this.validator, this.collisionDetector, {
      onValidationChange: this.handlers.onValidationChange
    })
  }

  setGridElement(element: HTMLElement): void {
    this.stateManager.setGridElement(element)
  }

  // =============================================
  // PUBLIC MOUSE/TOUCH EVENT HANDLERS
  // =============================================

  handleMouseDown(event: MouseEvent, ship: GameShip, element: HTMLElement): void {
    this.mouseHandler.handleMouseDown(event, ship, element)
  }

  handleTouchStart(event: TouchEvent, ship: GameShip, element: HTMLElement): void {
    this.touchHandler.handleTouchStart(event, ship, element)
  }

  // =============================================
  // DRAG LIFECYCLE
  // =============================================

  private startDrag(
    ship: GameShip,
    element: HTMLElement,
    startPosition: Coordinate,
    offset: Coordinate
  ): void {
    // Start drag state management
    this.stateManager.startDrag(ship, element, startPosition, offset)

    const gridPosition = this.stateManager.getCurrentGridPosition()
    const orientation = this.stateManager.getCurrentOrientation()

    // Start collision tracking
    this.dragValidator.startDragTracking(
      ship.id,
      ship.size,
      gridPosition,
      orientation
    )

    // Notify handlers
    this.handlers.onDragStart(ship, gridPosition)
  }

  private updateCollisionDetection(gridPosition: Coordinate, orientation: Orientation): void {
    if (!this.stateManager.isDragging()) return

    // Update collision detection
    const dragCollisionState = this.dragValidator.updateDragPosition(
      gridPosition,
      orientation
    )

    if (dragCollisionState) {
      this.stateManager.updateCollisionResult(dragCollisionState.collisionResult)

      // Notify collision change
      this.handlers.onCollisionChange(dragCollisionState.collisionResult)
      this.handlers.onValidationChange(dragCollisionState.isValidPosition)

      // Provide haptic feedback for collisions
      if (this.config.enableHapticFeedback &&
          dragCollisionState.collisionResult.hasCollision &&
          dragCollisionState.collisionResult.severity === 'critical') {
        this.vibrate([5, 5, 5])
      }
    }
  }

  private finalizeDrag(): void {
    if (!this.stateManager.isDragging()) return

    const ship = this.stateManager.getDraggedShip()
    const finalPosition = this.stateManager.getCurrentGridPosition()
    const orientation = this.stateManager.getCurrentOrientation()

    if (!ship) return

    // Validate final placement
    const canPlace = this.dragValidator.validateFinalPlacement(ship, finalPosition, orientation)
    let placementSucceeded = false

    if (canPlace) {
      // Attempt to place the ship
      placementSucceeded = this.handlers.onDragEnd(ship, finalPosition, orientation)
    }

    // Clean up
    this.stateManager.finalizeDrag(placementSucceeded)

    // Stop collision tracking
    this.dragValidator.stopDragTracking()

    // Provide haptic feedback
    if (this.config.enableHapticFeedback) {
      if (placementSucceeded) {
        this.vibrate([15])
      } else {
        this.vibrate([10, 10, 10])
      }
    }
  }

  // =============================================
  // ROTATION HANDLING
  // =============================================

  private handleShipRotation(): void {
    if (!this.stateManager.isDragging()) return

    const ship = this.stateManager.getDraggedShip()
    const currentOrientation = this.stateManager.getCurrentOrientation()
    const gridPosition = this.stateManager.getCurrentGridPosition()

    if (!ship) return

    // Check if rotation is valid
    const canRotate = this.dragValidator.canRotateAt(ship, gridPosition, currentOrientation)
    const newOrientation: Orientation =
      currentOrientation === 'horizontal' ? 'vertical' : 'horizontal'

    if (canRotate) {
      // Update state manager
      this.stateManager.rotateShip(newOrientation)

      // Update collision detection with new orientation
      this.updateCollisionDetection(gridPosition, newOrientation)

      // Notify handlers
      this.handlers.onRotate(ship, newOrientation)

      // Provide haptic feedback
      if (this.config.enableHapticFeedback) {
        this.vibrate([8])
      }
    }
  }

  // =============================================
  // KEYBOARD EVENTS
  // =============================================

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.stateManager.isDragging()) return

    if (event.key.toLowerCase() === this.config.rotationKey.toLowerCase()) {
      event.preventDefault()
      this.handleShipRotation()
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      this.cancelDrag()
    }
  }

  private cancelDrag(): void {
    if (!this.stateManager.isDragging()) return

    this.stateManager.finalizeDrag(false)
    this.dragValidator.stopDragTracking()
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private vibrate(pattern: number[]): void {
    if (navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }

  getCurrentDragState(): DragState {
    return this.stateManager.getCurrentDragState()
  }

  isDragging(): boolean {
    return this.stateManager.isDragging()
  }

  // =============================================
  // CLEANUP
  // =============================================

  destroy(): void {
    // Clean up current drag
    if (this.stateManager.isDragging()) {
      this.cancelDrag()
    }

    // Remove keyboard event listener
    document.removeEventListener('keydown', this.keyboardHandler)

    // Destroy component handlers
    this.touchHandler.destroy()
    this.mouseHandler.destroy()
    this.stateManager.destroy()
  }
}
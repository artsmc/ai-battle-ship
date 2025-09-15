/**
 * Drag State Manager
 *
 * Manages all state during drag operations including:
 * - Drag state tracking and updates
 * - Animation frame management
 * - Visual feedback and styling
 * - Coordinates preview and drag element updates
 */

import { Coordinate, Orientation, GameShip } from '../types'
import { CollisionResult } from './CollisionDetector'
import { PreviewManager, PreviewConfig } from './PreviewManager'
import { CoordinateConverter, ConversionConfig } from './CoordinateConverter'

export interface DragState {
  isDragging: boolean
  draggedShip: GameShip | null
  startPosition: Coordinate
  currentPosition: Coordinate
  gridPosition: Coordinate
  orientation: Orientation
  offset: Coordinate
  dragElement: HTMLElement | null
  previewElement: HTMLElement | null
  collisionResult: CollisionResult | null
}

export interface StateConfig extends PreviewConfig, ConversionConfig {
  // Additional state-specific config can be added here
}

export interface StateUpdateCallbacks {
  onStateChange: (state: DragState) => void
  onGridPositionChange: (oldPos: Coordinate, newPos: Coordinate, orientation: Orientation) => void
  onPreviewUpdate: (element: HTMLElement, position: Coordinate, orientation: Orientation, isValid: boolean) => void
}

export class DragStateManager {
  private dragState: DragState
  private readonly config: StateConfig
  private readonly callbacks: StateUpdateCallbacks

  // Component managers
  private readonly previewManager: PreviewManager
  private readonly coordinateConverter: CoordinateConverter

  private animationFrame: number | null

  constructor(
    callbacks: StateUpdateCallbacks,
    config: Partial<StateConfig> = {}
  ) {
    this.callbacks = callbacks
    this.config = {
      snapToGrid: true,
      gridSize: 40,
      enablePreview: true,
      gridWidth: 10,
      gridHeight: 10,
      ...config
    }

    this.dragState = this.createInitialDragState()
    this.animationFrame = null

    // Initialize component managers
    this.previewManager = new PreviewManager(
      {
        onPreviewUpdate: callbacks.onPreviewUpdate
      },
      {
        gridSize: this.config.gridSize,
        enablePreview: this.config.enablePreview
      }
    )

    this.coordinateConverter = new CoordinateConverter({
      gridSize: this.config.gridSize,
      snapToGrid: this.config.snapToGrid,
      gridWidth: this.config.gridWidth,
      gridHeight: this.config.gridHeight
    })
  }

  // =============================================
  // INITIALIZATION AND SETUP
  // =============================================

  private createInitialDragState(): DragState {
    return {
      isDragging: false,
      draggedShip: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      gridPosition: { x: 0, y: 0 },
      orientation: 'horizontal',
      offset: { x: 0, y: 0 },
      dragElement: null,
      previewElement: null,
      collisionResult: null
    }
  }

  setGridElement(element: HTMLElement): void {
    this.previewManager.setGridElement(element)
    this.coordinateConverter.setGridElement(element)
  }

  // =============================================
  // DRAG STATE MANAGEMENT
  // =============================================

  startDrag(
    ship: GameShip,
    element: HTMLElement,
    startPosition: Coordinate,
    offset: Coordinate
  ): void {
    const orientation = ship.position?.orientation || 'horizontal'

    this.dragState = {
      isDragging: true,
      draggedShip: ship,
      startPosition,
      currentPosition: startPosition,
      gridPosition: this.coordinateConverter.screenToGrid(startPosition, offset),
      orientation,
      offset,
      dragElement: element,
      previewElement: null,
      collisionResult: null
    }

    // Create preview element
    this.previewManager.createPreview(ship, orientation)
    this.dragState.previewElement = this.previewManager.getPreviewElement()

    // Add drag styles
    element.classList.add('dragging')
    document.body.classList.add('dragging-active')

    this.callbacks.onStateChange(this.dragState)
  }

  updatePosition(screenPosition: Coordinate): void {
    if (!this.dragState.isDragging || !this.dragState.draggedShip) return

    // Cancel previous animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    this.animationFrame = requestAnimationFrame(() => {
      const oldGridPosition = { ...this.dragState.gridPosition }

      this.dragState.currentPosition = screenPosition
      const newGridPosition = this.coordinateConverter.screenToGrid(screenPosition, this.dragState.offset)

      const hasGridPositionChanged =
        newGridPosition.x !== oldGridPosition.x ||
        newGridPosition.y !== oldGridPosition.y

      if (hasGridPositionChanged) {
        this.dragState.gridPosition = newGridPosition

        // Notify grid position change
        this.callbacks.onGridPositionChange(
          oldGridPosition,
          newGridPosition,
          this.dragState.orientation
        )

        // Update preview
        this.updatePreviewElement()
      }

      // Update drag element position
      this.updateDragElementPosition(screenPosition)

      // Notify state change
      this.callbacks.onStateChange(this.dragState)
    })
  }

  updateCollisionResult(result: CollisionResult): void {
    this.dragState.collisionResult = result
    this.updatePreviewElement()
  }

  rotateShip(newOrientation: Orientation): void {
    if (!this.dragState.isDragging || !this.dragState.draggedShip) return

    this.dragState.orientation = newOrientation

    // Update preview with new orientation
    this.updatePreviewElement()

    // Notify orientation change
    this.callbacks.onGridPositionChange(
      this.dragState.gridPosition,
      this.dragState.gridPosition,
      newOrientation
    )

    this.callbacks.onStateChange(this.dragState)
  }

  finalizeDrag(success: boolean): void {
    this.cleanupDrag(success)
    this.dragState = this.createInitialDragState()
    this.callbacks.onStateChange(this.dragState)
  }


  // =============================================
  // PREVIEW ELEMENT MANAGEMENT
  // =============================================

  private updatePreviewElement(): void {
    if (!this.dragState.draggedShip) return

    this.previewManager.updatePreview(
      this.dragState.draggedShip,
      this.dragState.gridPosition,
      this.dragState.orientation,
      this.dragState.collisionResult
    )

    // Update reference to preview element
    this.dragState.previewElement = this.previewManager.getPreviewElement()
  }

  private updateDragElementPosition(screenPosition: Coordinate): void {
    if (!this.dragState.dragElement) return

    this.dragState.dragElement.style.transform =
      this.coordinateConverter.calculateDragElementPosition(screenPosition, this.dragState.offset)
  }

  // =============================================
  // ANIMATION HANDLING
  // =============================================

  animateReturnToStart(): void {
    if (!this.dragState.dragElement) return

    const element = this.dragState.dragElement

    element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    element.style.transform = 'translate(0px, 0px)'

    setTimeout(() => {
      element.style.transition = ''
    }, 300)
  }

  // =============================================
  // STATE QUERIES
  // =============================================

  getCurrentDragState(): DragState {
    return { ...this.dragState }
  }

  isDragging(): boolean {
    return this.dragState.isDragging
  }

  getDraggedShip(): GameShip | null {
    return this.dragState.draggedShip
  }

  getCurrentGridPosition(): Coordinate {
    return { ...this.dragState.gridPosition }
  }

  getCurrentOrientation(): Orientation {
    return this.dragState.orientation
  }

  getCollisionResult(): CollisionResult | null {
    return this.dragState.collisionResult
  }

  // =============================================
  // CLEANUP
  // =============================================

  private cleanupDrag(success: boolean): void {
    if (this.dragState.dragElement) {
      this.dragState.dragElement.classList.remove('dragging')

      if (!success) {
        // Animate back to original position
        this.animateReturnToStart()
      }
    }

    // Remove preview element
    this.previewManager.removePreview()

    document.body.classList.remove('dragging-active')

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  destroy(): void {
    // Cancel any ongoing animations
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    // Clean up current drag
    if (this.dragState.isDragging) {
      this.finalizeDrag(false)
    }

    // Destroy component managers
    this.previewManager.destroy()
    this.coordinateConverter.destroy()
  }
}
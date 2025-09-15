/**
 * Preview Manager
 *
 * Handles preview element creation, updates, and cleanup for drag operations:
 * - Creates and manages preview DOM elements
 * - Updates preview position and styling
 * - Handles collision state visualization
 * - Manages preview lifecycle during drags
 */

import { Coordinate, Orientation, GameShip } from '../types'
import { CollisionResult } from './CollisionDetector'

export interface PreviewConfig {
  gridSize: number
  enablePreview: boolean
}

export interface PreviewCallbacks {
  onPreviewUpdate: (element: HTMLElement, position: Coordinate, orientation: Orientation, isValid: boolean) => void
}

export class PreviewManager {
  private readonly config: PreviewConfig
  private readonly callbacks: PreviewCallbacks

  private gridElement: HTMLElement | null
  private previewElement: HTMLElement | null

  constructor(
    callbacks: PreviewCallbacks,
    config: PreviewConfig
  ) {
    this.callbacks = callbacks
    this.config = config

    this.gridElement = null
    this.previewElement = null
  }

  // =============================================
  // SETUP
  // =============================================

  setGridElement(element: HTMLElement): void {
    this.gridElement = element
  }

  // =============================================
  // PREVIEW ELEMENT MANAGEMENT
  // =============================================

  createPreview(ship: GameShip, orientation: Orientation): void {
    if (!this.config.enablePreview || !this.gridElement) return

    this.removePreview()

    const preview = document.createElement('div')
    preview.className = 'ship-placement-preview'
    preview.dataset.shipId = ship.id
    preview.dataset.shipSize = ship.size.toString()
    preview.dataset.orientation = orientation

    this.gridElement.appendChild(preview)
    this.previewElement = preview
  }

  updatePreview(
    ship: GameShip,
    gridPosition: Coordinate,
    orientation: Orientation,
    collisionResult: CollisionResult | null
  ): void {
    if (!this.previewElement) return

    const preview = this.previewElement

    // Update position
    preview.style.transform = `translate(${gridPosition.x * this.config.gridSize}px, ${gridPosition.y * this.config.gridSize}px)`

    // Update orientation
    preview.dataset.orientation = orientation

    // Update collision state
    preview.classList.toggle('valid', !collisionResult?.hasCollision || collisionResult.severity === 'warning')
    preview.classList.toggle('invalid', collisionResult?.hasCollision && collisionResult.severity !== 'warning')
    preview.classList.toggle('warning', collisionResult?.severity === 'warning')

    // Update size
    const isHorizontal = orientation === 'horizontal'
    preview.style.width = `${(isHorizontal ? ship.size : 1) * this.config.gridSize}px`
    preview.style.height = `${(isHorizontal ? 1 : ship.size) * this.config.gridSize}px`

    // Notify callback
    this.callbacks.onPreviewUpdate(
      preview,
      gridPosition,
      orientation,
      !collisionResult?.hasCollision || collisionResult.severity === 'warning'
    )
  }

  removePreview(): void {
    if (this.previewElement) {
      this.previewElement.remove()
      this.previewElement = null
    }
  }

  hasPreview(): boolean {
    return this.previewElement !== null
  }

  getPreviewElement(): HTMLElement | null {
    return this.previewElement
  }

  // =============================================
  // CLEANUP
  // =============================================

  destroy(): void {
    this.removePreview()
    this.gridElement = null
  }
}
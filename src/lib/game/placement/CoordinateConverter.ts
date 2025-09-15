/**
 * Coordinate Converter
 *
 * Handles coordinate conversion between screen and grid coordinates:
 * - Screen-to-grid position conversion
 * - Grid-to-screen position conversion
 * - Snap-to-grid functionality
 * - Boundary validation
 * - Offset calculations
 */

import { Coordinate } from '../types'

export interface ConversionConfig {
  gridSize: number
  snapToGrid: boolean
  gridWidth: number
  gridHeight: number
}

export class CoordinateConverter {
  private readonly config: ConversionConfig
  private gridElement: HTMLElement | null

  constructor(config: ConversionConfig) {
    this.config = config
    this.gridElement = null
  }

  // =============================================
  // SETUP
  // =============================================

  setGridElement(element: HTMLElement): void {
    this.gridElement = element
  }

  // =============================================
  // COORDINATE CONVERSION
  // =============================================

  screenToGrid(screenPosition: Coordinate, offset: Coordinate): Coordinate {
    if (!this.gridElement) {
      return { x: 0, y: 0 }
    }

    const rect = this.gridElement.getBoundingClientRect()
    const relativeX = screenPosition.x - rect.left - offset.x
    const relativeY = screenPosition.y - rect.top - offset.y

    let gridX = Math.round(relativeX / this.config.gridSize)
    let gridY = Math.round(relativeY / this.config.gridSize)

    // Snap to grid if enabled
    if (this.config.snapToGrid) {
      gridX = Math.max(0, Math.min(this.config.gridWidth - 1, gridX))
      gridY = Math.max(0, Math.min(this.config.gridHeight - 1, gridY))
    }

    return { x: gridX, y: gridY }
  }

  gridToScreen(gridPosition: Coordinate): Coordinate {
    if (!this.gridElement) {
      return { x: 0, y: 0 }
    }

    const rect = this.gridElement.getBoundingClientRect()
    return {
      x: rect.left + (gridPosition.x * this.config.gridSize),
      y: rect.top + (gridPosition.y * this.config.gridSize)
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isValidGridPosition(position: Coordinate): boolean {
    return position.x >= 0 &&
           position.x < this.config.gridWidth &&
           position.y >= 0 &&
           position.y < this.config.gridHeight
  }

  clampToGrid(position: Coordinate): Coordinate {
    return {
      x: Math.max(0, Math.min(this.config.gridWidth - 1, position.x)),
      y: Math.max(0, Math.min(this.config.gridHeight - 1, position.y))
    }
  }

  getGridBounds(): { width: number, height: number } {
    return {
      width: this.config.gridWidth,
      height: this.config.gridHeight
    }
  }

  getGridSize(): number {
    return this.config.gridSize
  }

  // =============================================
  // POSITION CALCULATIONS
  // =============================================

  calculateDragElementPosition(screenPosition: Coordinate, offset: Coordinate): string {
    return `translate(${screenPosition.x - offset.x}px, ${screenPosition.y - offset.y}px)`
  }

  calculateElementOffset(element: HTMLElement, screenPosition: Coordinate): Coordinate {
    const rect = element.getBoundingClientRect()
    return {
      x: screenPosition.x - rect.left,
      y: screenPosition.y - rect.top
    }
  }

  // =============================================
  // CLEANUP
  // =============================================

  destroy(): void {
    this.gridElement = null
  }
}
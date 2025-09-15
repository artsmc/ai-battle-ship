/**
 * Coordinate Transformation Utilities
 *
 * Handles conversion between screen coordinates and game grid coordinates
 * for the Konva.js canvas system. Supports responsive sizing, zoom, and pan.
 */

import { Coordinate } from '../game/types'
import { DEFAULTS } from '../game/utils/constants'

// =============================================
// TYPES
// =============================================

export interface CanvasViewport {
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
}

export interface GridMetrics {
  cellSize: number
  boardWidth: number
  boardHeight: number
  gridStartX: number
  gridStartY: number
  borderWidth: number
  coordinateLabelHeight: number
}

export interface CanvasTransformOptions {
  devicePixelRatio?: number
  minScale?: number
  maxScale?: number
  padding?: number
}

// =============================================
// CONSTANTS
// =============================================

export const DEFAULT_CANVAS_OPTIONS: Required<CanvasTransformOptions> = {
  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  minScale: 0.5,
  maxScale: 3.0,
  padding: 40,
}

export const GRID_CONSTANTS = {
  MIN_CELL_SIZE: 20,
  MAX_CELL_SIZE: 80,
  DEFAULT_CELL_SIZE: 45,
  BORDER_WIDTH: 2,
  COORDINATE_LABEL_HEIGHT: 30,
  GRID_LINE_COLOR: '#334155',
  GRID_LINE_WIDTH: 1,
  COORDINATE_FONT_SIZE: 12,
  COORDINATE_FONT_FAMILY: 'Arial, sans-serif',
} as const

// =============================================
// COORDINATE TRANSFORM CLASS
// =============================================

export class CanvasCoordinateTransform {
  private viewport: CanvasViewport
  private gridMetrics: GridMetrics
  private options: Required<CanvasTransformOptions>
  private boardSize: { width: number; height: number }

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    boardWidth: number = DEFAULTS.BOARD_WIDTH,
    boardHeight: number = DEFAULTS.BOARD_HEIGHT,
    options: CanvasTransformOptions = {}
  ) {
    this.options = { ...DEFAULT_CANVAS_OPTIONS, ...options }
    this.boardSize = { width: boardWidth, height: boardHeight }

    // Initialize viewport
    this.viewport = {
      width: canvasWidth,
      height: canvasHeight,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }

    // Calculate grid metrics
    this.gridMetrics = this.calculateGridMetrics(canvasWidth, canvasHeight)

    // Center the grid
    this.centerGrid()
  }

  // =============================================
  // PUBLIC METHODS - COORDINATE CONVERSION
  // =============================================

  /**
   * Convert screen coordinates to game grid coordinates
   */
  screenToGrid(screenX: number, screenY: number): Coordinate | null {
    const canvasX = (screenX - this.viewport.offsetX) / this.viewport.scale
    const canvasY = (screenY - this.viewport.offsetY) / this.viewport.scale

    const gridX = Math.floor(
      (canvasX - this.gridMetrics.gridStartX) / this.gridMetrics.cellSize
    )
    const gridY = Math.floor(
      (canvasY - this.gridMetrics.gridStartY) / this.gridMetrics.cellSize
    )

    // Validate bounds
    if (
      gridX < 0 ||
      gridX >= this.boardSize.width ||
      gridY < 0 ||
      gridY >= this.boardSize.height
    ) {
      return null
    }

    return { x: gridX, y: gridY }
  }

  /**
   * Convert game grid coordinates to screen coordinates
   */
  gridToScreen(gridX: number, gridY: number): Coordinate {
    const canvasX = this.gridMetrics.gridStartX + (gridX * this.gridMetrics.cellSize)
    const canvasY = this.gridMetrics.gridStartY + (gridY * this.gridMetrics.cellSize)

    return {
      x: (canvasX * this.viewport.scale) + this.viewport.offsetX,
      y: (canvasY * this.viewport.scale) + this.viewport.offsetY,
    }
  }

  /**
   * Convert game grid coordinates to canvas coordinates (without viewport transform)
   */
  gridToCanvas(gridX: number, gridY: number): Coordinate {
    return {
      x: this.gridMetrics.gridStartX + (gridX * this.gridMetrics.cellSize),
      y: this.gridMetrics.gridStartY + (gridY * this.gridMetrics.cellSize),
    }
  }

  /**
   * Get the center point of a grid cell in screen coordinates
   */
  getGridCellCenter(gridX: number, gridY: number): Coordinate {
    const halfCell = this.gridMetrics.cellSize / 2
    const canvasX = this.gridMetrics.gridStartX + (gridX * this.gridMetrics.cellSize) + halfCell
    const canvasY = this.gridMetrics.gridStartY + (gridY * this.gridMetrics.cellSize) + halfCell

    return {
      x: (canvasX * this.viewport.scale) + this.viewport.offsetX,
      y: (canvasY * this.viewport.scale) + this.viewport.offsetY,
    }
  }

  // =============================================
  // PUBLIC METHODS - VIEWPORT MANAGEMENT
  // =============================================

  /**
   * Update canvas size and recalculate metrics
   */
  updateCanvasSize(width: number, height: number): void {
    this.viewport.width = width
    this.viewport.height = height
    this.gridMetrics = this.calculateGridMetrics(width, height)
    this.centerGrid()
  }

  /**
   * Update board size and recalculate metrics
   */
  updateBoardSize(width: number, height: number): void {
    this.boardSize = { width, height }
    this.gridMetrics = this.calculateGridMetrics(this.viewport.width, this.viewport.height)
    this.centerGrid()
  }

  /**
   * Set zoom level (scale)
   */
  setScale(scale: number, centerX?: number, centerY?: number): void {
    const newScale = Math.max(
      this.options.minScale,
      Math.min(this.options.maxScale, scale)
    )

    if (centerX !== undefined && centerY !== undefined) {
      // Zoom towards a specific point
      const scaleFactor = newScale / this.viewport.scale
      this.viewport.offsetX = centerX - (centerX - this.viewport.offsetX) * scaleFactor
      this.viewport.offsetY = centerY - (centerY - this.viewport.offsetY) * scaleFactor
    }

    this.viewport.scale = newScale
  }

  /**
   * Pan the viewport
   */
  pan(deltaX: number, deltaY: number): void {
    this.viewport.offsetX += deltaX
    this.viewport.offsetY += deltaY
    this.constrainPan()
  }

  /**
   * Set viewport offset directly
   */
  setOffset(x: number, y: number): void {
    this.viewport.offsetX = x
    this.viewport.offsetY = y
    this.constrainPan()
  }

  /**
   * Center the grid in the viewport
   */
  centerGrid(): void {
    const gridWidth = this.boardSize.width * this.gridMetrics.cellSize
    const gridHeight = this.boardSize.height * this.gridMetrics.cellSize

    this.viewport.offsetX = (this.viewport.width - gridWidth * this.viewport.scale) / 2
    this.viewport.offsetY = (this.viewport.height - gridHeight * this.viewport.scale) / 2

    this.constrainPan()
  }

  /**
   * Fit the grid to the canvas
   */
  fitToCanvas(): void {
    const gridWidth = this.boardSize.width * this.gridMetrics.cellSize + (this.options.padding * 2)
    const gridHeight = this.boardSize.height * this.gridMetrics.cellSize + (this.options.padding * 2)

    const scaleX = this.viewport.width / gridWidth
    const scaleY = this.viewport.height / gridHeight

    const newScale = Math.min(scaleX, scaleY, this.options.maxScale)
    this.setScale(Math.max(newScale, this.options.minScale))
    this.centerGrid()
  }

  // =============================================
  // PUBLIC METHODS - GETTERS
  // =============================================

  getViewport(): Readonly<CanvasViewport> {
    return { ...this.viewport }
  }

  getGridMetrics(): Readonly<GridMetrics> {
    return { ...this.gridMetrics }
  }

  getBoardSize(): Readonly<{ width: number; height: number }> {
    return { ...this.boardSize }
  }

  getScale(): number {
    return this.viewport.scale
  }

  getOffset(): { x: number; y: number } {
    return { x: this.viewport.offsetX, y: this.viewport.offsetY }
  }

  /**
   * Get visible grid bounds based on current viewport
   */
  getVisibleGridBounds(): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    const topLeft = this.screenToGrid(0, 0)
    const bottomRight = this.screenToGrid(this.viewport.width, this.viewport.height)

    return {
      minX: Math.max(0, topLeft?.x ?? 0),
      maxX: Math.min(this.boardSize.width - 1, bottomRight?.x ?? this.boardSize.width - 1),
      minY: Math.max(0, topLeft?.y ?? 0),
      maxY: Math.min(this.boardSize.height - 1, bottomRight?.y ?? this.boardSize.height - 1),
    }
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  private calculateGridMetrics(canvasWidth: number, canvasHeight: number): GridMetrics {
    // Calculate optimal cell size based on canvas size and board dimensions
    const availableWidth = canvasWidth - (this.options.padding * 2)
    const availableHeight = canvasHeight - (this.options.padding * 2) - GRID_CONSTANTS.COORDINATE_LABEL_HEIGHT

    const maxCellWidth = availableWidth / this.boardSize.width
    const maxCellHeight = availableHeight / this.boardSize.height

    const cellSize = Math.max(
      GRID_CONSTANTS.MIN_CELL_SIZE,
      Math.min(
        GRID_CONSTANTS.MAX_CELL_SIZE,
        Math.min(maxCellWidth, maxCellHeight)
      )
    )

    const boardPixelWidth = this.boardSize.width * cellSize
    const boardPixelHeight = this.boardSize.height * cellSize

    const gridStartX = (canvasWidth - boardPixelWidth) / 2
    const gridStartY = GRID_CONSTANTS.COORDINATE_LABEL_HEIGHT + ((canvasHeight - GRID_CONSTANTS.COORDINATE_LABEL_HEIGHT - boardPixelHeight) / 2)

    return {
      cellSize,
      boardWidth: boardPixelWidth,
      boardHeight: boardPixelHeight,
      gridStartX,
      gridStartY,
      borderWidth: GRID_CONSTANTS.BORDER_WIDTH,
      coordinateLabelHeight: GRID_CONSTANTS.COORDINATE_LABEL_HEIGHT,
    }
  }

  private constrainPan(): void {
    const gridWidth = this.boardSize.width * this.gridMetrics.cellSize * this.viewport.scale
    const gridHeight = this.boardSize.height * this.gridMetrics.cellSize * this.viewport.scale

    // Don't allow panning too far beyond the grid boundaries
    const maxOffsetX = Math.max(0, (this.viewport.width - gridWidth) / 2) + this.options.padding
    const maxOffsetY = Math.max(0, (this.viewport.height - gridHeight) / 2) + this.options.padding
    const minOffsetX = Math.min(0, (this.viewport.width - gridWidth) / 2) - this.options.padding
    const minOffsetY = Math.min(0, (this.viewport.height - gridHeight) / 2) - this.options.padding

    this.viewport.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.viewport.offsetX))
    this.viewport.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.viewport.offsetY))
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Create a coordinate transform instance with responsive sizing
 */
export function createResponsiveCoordinateTransform(
  canvasElement: HTMLCanvasElement,
  boardWidth?: number,
  boardHeight?: number,
  options?: CanvasTransformOptions
): CanvasCoordinateTransform {
  const rect = canvasElement.getBoundingClientRect()
  const devicePixelRatio = options?.devicePixelRatio ?? window.devicePixelRatio

  return new CanvasCoordinateTransform(
    rect.width * devicePixelRatio,
    rect.height * devicePixelRatio,
    boardWidth,
    boardHeight,
    { devicePixelRatio, ...options }
  )
}

/**
 * Get optimal grid cell size for given canvas dimensions
 */
export function getOptimalCellSize(
  canvasWidth: number,
  canvasHeight: number,
  boardWidth: number,
  boardHeight: number,
  padding: number = DEFAULT_CANVAS_OPTIONS.padding
): number {
  const availableWidth = canvasWidth - (padding * 2)
  const availableHeight = canvasHeight - (padding * 2) - GRID_CONSTANTS.COORDINATE_LABEL_HEIGHT

  const maxCellWidth = availableWidth / boardWidth
  const maxCellHeight = availableHeight / boardHeight

  return Math.max(
    GRID_CONSTANTS.MIN_CELL_SIZE,
    Math.min(
      GRID_CONSTANTS.MAX_CELL_SIZE,
      Math.min(maxCellWidth, maxCellHeight)
    )
  )
}

/**
 * Check if coordinates are within the game board bounds
 */
export function isValidGridCoordinate(
  coord: Coordinate | null,
  boardWidth: number,
  boardHeight: number
): coord is Coordinate {
  return coord !== null &&
         coord.x >= 0 &&
         coord.x < boardWidth &&
         coord.y >= 0 &&
         coord.y < boardHeight
}
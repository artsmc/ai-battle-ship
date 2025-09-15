/**
 * Responsive Canvas Sizing
 *
 * Handles dynamic canvas sizing for different screen sizes and devices.
 * Provides optimal sizing, aspect ratio maintenance, and device pixel ratio
 * handling for crisp rendering across all devices.
 */

import { game } from '../../styles/tokens/game'

// =============================================
// TYPES
// =============================================

export interface CanvasSize {
  width: number
  height: number
  displayWidth: number
  displayHeight: number
  devicePixelRatio: number
}

export interface ResponsiveBreakpoint {
  name: string
  minWidth: number
  maxWidth?: number
  cellSize: number
  padding: number
  maxCanvasSize: number
}

export interface ResponsiveCanvasOptions {
  minCanvasSize?: number
  maxCanvasSize?: number
  aspectRatio?: number
  maintainAspectRatio?: boolean
  devicePixelRatio?: number
  customBreakpoints?: ResponsiveBreakpoint[]
}

export interface CanvasMetrics {
  canvasSize: CanvasSize
  breakpoint: ResponsiveBreakpoint
  cellSize: number
  gridSize: number
  padding: number
  boardDimensions: {
    width: number
    height: number
    cellCount: number
  }
}

// =============================================
// CONSTANTS
// =============================================

export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoint[] = [
  {
    name: 'mobile',
    minWidth: 0,
    maxWidth: 640,
    cellSize: parseInt(game.board.cellSize.mobile.replace('px', '')),
    padding: 20,
    maxCanvasSize: 400,
  },
  {
    name: 'tablet',
    minWidth: 641,
    maxWidth: 1024,
    cellSize: parseInt(game.board.cellSize.tablet.replace('px', '')),
    padding: 30,
    maxCanvasSize: 600,
  },
  {
    name: 'desktop',
    minWidth: 1025,
    cellSize: parseInt(game.board.cellSize.desktop.replace('px', '')),
    padding: 40,
    maxCanvasSize: 800,
  },
]

export const DEFAULT_RESPONSIVE_OPTIONS: Required<ResponsiveCanvasOptions> = {
  minCanvasSize: 280,
  maxCanvasSize: 800,
  aspectRatio: 1, // Square by default for game boards
  maintainAspectRatio: true,
  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  customBreakpoints: [],
}

// =============================================
// RESPONSIVE CANVAS CLASS
// =============================================

export class ResponsiveCanvas {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private options: Required<ResponsiveCanvasOptions>
  private breakpoints: ResponsiveBreakpoint[]
  private currentMetrics: CanvasMetrics | null = null
  private resizeObserver: ResizeObserver | null = null
  private onResizeCallbacks: Array<(metrics: CanvasMetrics) => void> = []
  private debounceTimeout: number | null = null

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    options: ResponsiveCanvasOptions = {}
  ) {
    this.container = container
    this.canvas = canvas
    this.options = { ...DEFAULT_RESPONSIVE_OPTIONS, ...options }
    this.breakpoints = options.customBreakpoints?.length
      ? options.customBreakpoints
      : DEFAULT_BREAKPOINTS

    this.setupCanvas()
    this.setupResizeObserver()
    this.updateCanvasSize()
  }

  // =============================================
  // PUBLIC METHODS
  // =============================================

  /**
   * Get current canvas metrics
   */
  getMetrics(): CanvasMetrics | null {
    return this.currentMetrics ? { ...this.currentMetrics } : null
  }

  /**
   * Force canvas size recalculation
   */
  updateSize(): void {
    this.updateCanvasSize()
  }

  /**
   * Add callback for resize events
   */
  onResize(callback: (metrics: CanvasMetrics) => void): void {
    this.onResizeCallbacks.push(callback)
  }

  /**
   * Remove resize callback
   */
  offResize(callback: (metrics: CanvasMetrics) => void): void {
    const index = this.onResizeCallbacks.indexOf(callback)
    if (index > -1) {
      this.onResizeCallbacks.splice(index, 1)
    }
  }

  /**
   * Update responsive options
   */
  updateOptions(options: Partial<ResponsiveCanvasOptions>): void {
    this.options = { ...this.options, ...options }
    if (options.customBreakpoints) {
      this.breakpoints = options.customBreakpoints
    }
    this.updateCanvasSize()
  }

  /**
   * Get optimal canvas size for current container
   */
  getOptimalSize(): CanvasSize {
    const containerRect = this.container.getBoundingClientRect()
    const breakpoint = this.getCurrentBreakpoint(containerRect.width)

    return this.calculateCanvasSize(containerRect, breakpoint)
  }

  /**
   * Check if current size needs updating
   */
  needsUpdate(): boolean {
    if (!this.currentMetrics) return true

    const containerRect = this.container.getBoundingClientRect()
    const currentBreakpoint = this.getCurrentBreakpoint(containerRect.width)

    return currentBreakpoint.name !== this.currentMetrics.breakpoint.name ||
           Math.abs(containerRect.width - this.currentMetrics.canvasSize.displayWidth) > 10 ||
           Math.abs(containerRect.height - this.currentMetrics.canvasSize.displayHeight) > 10
  }

  /**
   * Destroy responsive canvas and clean up
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = null
    }

    this.onResizeCallbacks = []
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  private setupCanvas(): void {
    // Set initial canvas properties
    this.canvas.style.display = 'block'
    this.canvas.style.maxWidth = '100%'
    this.canvas.style.maxHeight = '100%'

    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    // Make canvas focusable for keyboard events
    this.canvas.tabIndex = 0
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.debouncedResize.bind(this))
      this.resizeObserver.observe(this.container)
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', this.debouncedResize.bind(this))
    }
  }

  private debouncedResize(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    this.debounceTimeout = window.setTimeout(() => {
      this.updateCanvasSize()
      this.debounceTimeout = null
    }, 100)
  }

  private updateCanvasSize(): void {
    const containerRect = this.container.getBoundingClientRect()
    const breakpoint = this.getCurrentBreakpoint(containerRect.width)
    const canvasSize = this.calculateCanvasSize(containerRect, breakpoint)

    this.applyCanvasSize(canvasSize)

    const metrics: CanvasMetrics = {
      canvasSize,
      breakpoint,
      cellSize: breakpoint.cellSize,
      gridSize: this.calculateGridSize(canvasSize, breakpoint),
      padding: breakpoint.padding,
      boardDimensions: this.calculateBoardDimensions(canvasSize, breakpoint),
    }

    this.currentMetrics = metrics
    this.notifyResizeCallbacks(metrics)
  }

  private getCurrentBreakpoint(containerWidth: number): ResponsiveBreakpoint {
    for (const breakpoint of this.breakpoints) {
      if (containerWidth >= breakpoint.minWidth &&
          (!breakpoint.maxWidth || containerWidth <= breakpoint.maxWidth)) {
        return breakpoint
      }
    }

    // Fallback to largest breakpoint
    return this.breakpoints[this.breakpoints.length - 1]
  }

  private calculateCanvasSize(
    containerRect: DOMRect,
    breakpoint: ResponsiveBreakpoint
  ): CanvasSize {
    const availableWidth = containerRect.width
    const availableHeight = containerRect.height
    const devicePixelRatio = this.options.devicePixelRatio

    let displayWidth = availableWidth
    let displayHeight = availableHeight

    // Apply size constraints
    if (breakpoint.maxCanvasSize) {
      displayWidth = Math.min(displayWidth, breakpoint.maxCanvasSize)
      displayHeight = Math.min(displayHeight, breakpoint.maxCanvasSize)
    }

    displayWidth = Math.max(displayWidth, this.options.minCanvasSize)
    displayHeight = Math.max(displayHeight, this.options.minCanvasSize)

    displayWidth = Math.min(displayWidth, this.options.maxCanvasSize)
    displayHeight = Math.min(displayHeight, this.options.maxCanvasSize)

    // Maintain aspect ratio if required
    if (this.options.maintainAspectRatio) {
      const targetRatio = this.options.aspectRatio
      const currentRatio = displayWidth / displayHeight

      if (currentRatio > targetRatio) {
        displayWidth = displayHeight * targetRatio
      } else {
        displayHeight = displayWidth / targetRatio
      }
    }

    return {
      width: Math.round(displayWidth * devicePixelRatio),
      height: Math.round(displayHeight * devicePixelRatio),
      displayWidth: Math.round(displayWidth),
      displayHeight: Math.round(displayHeight),
      devicePixelRatio,
    }
  }

  private calculateGridSize(
    canvasSize: CanvasSize,
    breakpoint: ResponsiveBreakpoint
  ): number {
    // Calculate how many grid cells can fit
    const availableWidth = canvasSize.displayWidth - (breakpoint.padding * 2)
    const availableHeight = canvasSize.displayHeight - (breakpoint.padding * 2)

    const maxCellsX = Math.floor(availableWidth / breakpoint.cellSize)
    const maxCellsY = Math.floor(availableHeight / breakpoint.cellSize)

    return Math.min(maxCellsX, maxCellsY)
  }

  private calculateBoardDimensions(
    canvasSize: CanvasSize,
    breakpoint: ResponsiveBreakpoint
  ) {
    const gridSize = this.calculateGridSize(canvasSize, breakpoint)

    return {
      width: gridSize * breakpoint.cellSize,
      height: gridSize * breakpoint.cellSize,
      cellCount: gridSize,
    }
  }

  private applyCanvasSize(canvasSize: CanvasSize): void {
    // Set actual canvas resolution
    this.canvas.width = canvasSize.width
    this.canvas.height = canvasSize.height

    // Set display size
    this.canvas.style.width = `${canvasSize.displayWidth}px`
    this.canvas.style.height = `${canvasSize.displayHeight}px`

    // Scale context for high DPI displays
    const context = this.canvas.getContext('2d')
    if (context && canvasSize.devicePixelRatio !== 1) {
      context.scale(canvasSize.devicePixelRatio, canvasSize.devicePixelRatio)
    }
  }

  private notifyResizeCallbacks(metrics: CanvasMetrics): void {
    this.onResizeCallbacks.forEach(callback => {
      try {
        callback(metrics)
      } catch (error) {
        console.error('Error in resize callback:', error)
      }
    })
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Create a responsive canvas instance
 */
export function createResponsiveCanvas(
  container: HTMLElement,
  canvas?: HTMLCanvasElement,
  options?: ResponsiveCanvasOptions
): ResponsiveCanvas {
  let canvasElement = canvas

  if (!canvasElement) {
    canvasElement = document.createElement('canvas')
    container.appendChild(canvasElement)
  }

  return new ResponsiveCanvas(container, canvasElement, options)
}

/**
 * Get device category based on screen size
 */
export function getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth

  if (width <= 640) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

/**
 * Calculate optimal board size for device
 */
export function getOptimalBoardSize(
  deviceCategory: 'mobile' | 'tablet' | 'desktop' = getDeviceCategory()
): number {
  switch (deviceCategory) {
    case 'mobile':
      return 8 // Smaller board for mobile
    case 'tablet':
      return 10 // Standard size
    case 'desktop':
      return 12 // Larger board for desktop
    default:
      return 10
  }
}

/**
 * Check if device supports high performance rendering
 */
export function supportsHighPerformanceRendering(): boolean {
  if (typeof window === 'undefined') return false

  // Check for hardware acceleration support
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) return false

  // Check device memory (if available)
  if ('deviceMemory' in window.navigator && (window.navigator as { deviceMemory: number }).deviceMemory < 4) {
    return false // Low memory devices
  }

  // Check for touch device (mobile/tablet)
  const isTouchDevice = 'ontouchstart' in window ||
                       navigator.maxTouchPoints > 0

  if (isTouchDevice && window.innerWidth < 1024) {
    return false // Mobile devices
  }

  return true
}

/**
 * Get performance-based rendering options
 */
export function getPerformanceRenderingOptions(): {
  enableShadows: boolean
  enableAnimations: boolean
  maxParticles: number
  renderQuality: 'low' | 'medium' | 'high'
} {
  const highPerformance = supportsHighPerformanceRendering()
  const deviceCategory = getDeviceCategory()

  if (deviceCategory === 'mobile') {
    return {
      enableShadows: false,
      enableAnimations: false,
      maxParticles: 10,
      renderQuality: 'low',
    }
  }

  if (deviceCategory === 'tablet') {
    return {
      enableShadows: false,
      enableAnimations: true,
      maxParticles: 25,
      renderQuality: 'medium',
    }
  }

  return {
    enableShadows: highPerformance,
    enableAnimations: true,
    maxParticles: highPerformance ? 100 : 50,
    renderQuality: highPerformance ? 'high' : 'medium',
  }
}
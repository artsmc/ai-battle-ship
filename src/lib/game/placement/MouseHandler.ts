/**
 * Mouse Event Handler
 *
 * Handles all mouse-related interactions for ship placement including:
 * - Mouse down, move, and up events
 * - Left-click validation
 * - Context menu prevention during drag
 * - Smooth mouse tracking
 * - Desktop-specific optimizations
 */

import { Coordinate, GameShip } from '../types'

export interface MouseConfig {
  dragThreshold: number
  enableContextMenuPrevention: boolean
}

export interface MouseEventCallbacks {
  onMouseStart: (ship: GameShip, element: HTMLElement, position: Coordinate, offset: Coordinate) => void
  onMouseMove: (position: Coordinate) => void
  onMouseEnd: () => void
  onContextMenuPrevention: (event: MouseEvent) => void
}

export class MouseHandler {
  private readonly config: MouseConfig
  private readonly callbacks: MouseEventCallbacks

  // Event listeners for cleanup
  private boundHandlers: Map<string, EventListener>
  private isTracking: boolean

  constructor(
    callbacks: MouseEventCallbacks,
    config: Partial<MouseConfig> = {}
  ) {
    this.callbacks = callbacks
    this.config = {
      dragThreshold: 5,
      enableContextMenuPrevention: true,
      ...config
    }

    this.boundHandlers = new Map()
    this.isTracking = false
    this.bindEventHandlers()
  }

  private bindEventHandlers(): void {
    const handleMouseMove = (event: MouseEvent): void => {
      this.handleMouseMove(event)
    }

    const handleMouseUp = (event: MouseEvent): void => {
      this.handleMouseUp(event)
    }

    const handleContextMenu = (event: MouseEvent): void => {
      if (this.config.enableContextMenuPrevention) {
        this.callbacks.onContextMenuPrevention(event)
      }
    }

    this.boundHandlers.set('mousemove', handleMouseMove)
    this.boundHandlers.set('mouseup', handleMouseUp)
    this.boundHandlers.set('contextmenu', handleContextMenu)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('contextmenu', handleContextMenu)
  }

  // =============================================
  // PUBLIC API
  // =============================================

  handleMouseDown(event: MouseEvent, ship: GameShip, element: HTMLElement): void {
    // Only handle left mouse button
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const rect = element.getBoundingClientRect()
    const mousePosition = {
      x: event.clientX,
      y: event.clientY
    }

    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    this.isTracking = true
    this.callbacks.onMouseStart(ship, element, mousePosition, offset)
  }

  isMouseTracking(): boolean {
    return this.isTracking
  }

  stopTracking(): void {
    this.isTracking = false
  }

  // =============================================
  // PRIVATE MOUSE EVENT HANDLERS
  // =============================================

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isTracking) return

    event.preventDefault()

    const mousePosition = {
      x: event.clientX,
      y: event.clientY
    }

    this.callbacks.onMouseMove(mousePosition)
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isTracking) return

    event.preventDefault()
    this.isTracking = false
    this.callbacks.onMouseEnd()
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getDragThreshold(): number {
    return this.config.dragThreshold
  }

  isLeftClick(event: MouseEvent): boolean {
    return event.button === 0
  }

  isRightClick(event: MouseEvent): boolean {
    return event.button === 2
  }

  isMiddleClick(event: MouseEvent): boolean {
    return event.button === 1
  }

  getMousePosition(event: MouseEvent): Coordinate {
    return {
      x: event.clientX,
      y: event.clientY
    }
  }

  getRelativePosition(event: MouseEvent, element: HTMLElement): Coordinate {
    const rect = element.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  // =============================================
  // CLEANUP
  // =============================================

  destroy(): void {
    // Remove event listeners
    for (const [event, handler] of this.boundHandlers.entries()) {
      document.removeEventListener(event, handler)
    }

    this.boundHandlers.clear()
    this.isTracking = false
  }
}
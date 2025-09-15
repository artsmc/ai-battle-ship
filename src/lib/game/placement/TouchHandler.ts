/**
 * Touch Event Handler
 *
 * Handles all touch-related interactions for ship placement including:
 * - Single touch drag operations
 * - Double-tap rotation
 * - Multi-touch pinch rotation
 * - Touch sensitivity configuration
 * - Mobile-specific optimizations
 */

import { Coordinate, GameShip } from '../types'

export interface TouchState {
  lastTap: number
  tapCount: number
  initialDistance?: number
  isMultiTouch: boolean
}

export interface TouchConfig {
  touchSensitivity: number
  enableHapticFeedback: boolean
  rotationThreshold: number
  doubleTapWindow: number
}

export interface TouchEventCallbacks {
  onTouchStart: (ship: GameShip, element: HTMLElement, position: Coordinate, offset: Coordinate) => void
  onTouchMove: (position: Coordinate) => void
  onTouchEnd: () => void
  onRotate: () => void
  onVibrate: (pattern: number[]) => void
}

export class TouchHandler {
  private touchState: TouchState
  private readonly config: TouchConfig
  private readonly callbacks: TouchEventCallbacks

  // Event listeners for cleanup
  private boundHandlers: Map<string, EventListener>

  constructor(
    callbacks: TouchEventCallbacks,
    config: Partial<TouchConfig> = {}
  ) {
    this.callbacks = callbacks
    this.config = {
      touchSensitivity: 1.0,
      enableHapticFeedback: true,
      rotationThreshold: 50,
      doubleTapWindow: 300,
      ...config
    }

    this.touchState = this.createInitialTouchState()
    this.boundHandlers = new Map()
    this.bindEventHandlers()
  }

  private createInitialTouchState(): TouchState {
    return {
      lastTap: 0,
      tapCount: 0,
      isMultiTouch: false
    }
  }

  private bindEventHandlers(): void {
    const handleTouchMove = (event: TouchEvent): void => {
      this.handleTouchMove(event)
    }

    const handleTouchEnd = (event: TouchEvent): void => {
      this.handleTouchEnd(event)
    }

    this.boundHandlers.set('touchmove', handleTouchMove)
    this.boundHandlers.set('touchend', handleTouchEnd)

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
  }

  // =============================================
  // PUBLIC API
  // =============================================

  handleTouchStart(event: TouchEvent, ship: GameShip, element: HTMLElement): void {
    event.preventDefault()

    const touch = event.touches[0]
    const rect = element.getBoundingClientRect()

    // Handle multi-touch for rotation
    if (event.touches.length > 1) {
      this.touchState.isMultiTouch = true
      this.handlePinchStart(event)
      return
    }

    // Handle double-tap for rotation
    const now = Date.now()
    const timeDiff = now - this.touchState.lastTap

    if (timeDiff < this.config.doubleTapWindow) {
      this.touchState.tapCount++
      if (this.touchState.tapCount === 2) {
        this.handleDoubleTapRotation()
        this.touchState.tapCount = 0
        return
      }
    } else {
      this.touchState.tapCount = 1
    }

    this.touchState.lastTap = now

    const touchPosition = {
      x: touch.clientX,
      y: touch.clientY
    }

    const offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }

    this.callbacks.onTouchStart(ship, element, touchPosition, offset)

    // Provide haptic feedback
    if (this.config.enableHapticFeedback) {
      this.callbacks.onVibrate([10])
    }
  }

  getTouchState(): TouchState {
    return { ...this.touchState }
  }

  resetTouchState(): void {
    this.touchState = this.createInitialTouchState()
  }

  // =============================================
  // PRIVATE TOUCH EVENT HANDLERS
  // =============================================

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 1) {
      this.handlePinchMove(event)
      return
    }

    const touch = event.touches[0]
    const touchPosition = {
      x: touch.clientX,
      y: touch.clientY
    }

    this.callbacks.onTouchMove(touchPosition)
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.touchState.isMultiTouch = false
      this.touchState.initialDistance = undefined
    }

    this.callbacks.onTouchEnd()
  }

  // =============================================
  // ROTATION HANDLING
  // =============================================

  private handleDoubleTapRotation(): void {
    this.callbacks.onRotate()

    // Provide haptic feedback
    if (this.config.enableHapticFeedback) {
      this.callbacks.onVibrate([8])
    }
  }

  // =============================================
  // PINCH/ZOOM ROTATION (ADVANCED TOUCH)
  // =============================================

  private handlePinchStart(event: TouchEvent): void {
    if (event.touches.length >= 2) {
      const distance = this.getDistance(event.touches[0], event.touches[1])
      this.touchState.initialDistance = distance
    }
  }

  private handlePinchMove(event: TouchEvent): void {
    if (!this.touchState.initialDistance || event.touches.length < 2) return

    const currentDistance = this.getDistance(event.touches[0], event.touches[1])

    if (Math.abs(currentDistance - this.touchState.initialDistance) > this.config.rotationThreshold) {
      this.callbacks.onRotate()
      this.touchState.initialDistance = currentDistance

      // Provide haptic feedback
      if (this.config.enableHapticFeedback) {
        this.callbacks.onVibrate([8])
      }
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isMultiTouchActive(): boolean {
    return this.touchState.isMultiTouch
  }

  getLastTapTime(): number {
    return this.touchState.lastTap
  }

  getTapCount(): number {
    return this.touchState.tapCount
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
    this.touchState = this.createInitialTouchState()
  }
}
/**
 * Canvas Event Handler
 *
 * Handles mouse and touch events for the Konva.js canvas system.
 * Provides high-performance event processing with proper delegation
 * and integration with the Phase 2 game logic.
 */

import { Coordinate } from '../game/types'
import { CanvasCoordinateTransform } from './CoordinateTransform'

// =============================================
// TYPES
// =============================================

export interface CanvasEventData {
  gridCoordinate: Coordinate | null
  screenCoordinate: Coordinate
  canvasCoordinate: Coordinate
  originalEvent: Event
  eventType: CanvasEventType
  timestamp: number
}

export type CanvasEventType =
  | 'click'
  | 'doubleclick'
  | 'hover'
  | 'drag_start'
  | 'drag_move'
  | 'drag_end'
  | 'touch_start'
  | 'touch_move'
  | 'touch_end'
  | 'wheel'
  | 'context_menu'

export interface CanvasEventHandlers {
  onClick?: (event: CanvasEventData) => void
  onDoubleClick?: (event: CanvasEventData) => void
  onHover?: (event: CanvasEventData) => void
  onDragStart?: (event: CanvasEventData) => void
  onDragMove?: (event: CanvasEventData) => void
  onDragEnd?: (event: CanvasEventData) => void
  onTouchStart?: (event: CanvasEventData) => void
  onTouchMove?: (event: CanvasEventData) => void
  onTouchEnd?: (event: CanvasEventData) => void
  onWheel?: (event: CanvasEventData) => void
  onContextMenu?: (event: CanvasEventData) => void
}

export interface DragState {
  isDragging: boolean
  startPosition: Coordinate | null
  currentPosition: Coordinate | null
  startGridPosition: Coordinate | null
  currentGridPosition: Coordinate | null
  dragType: 'pan' | 'select' | 'ship' | null
  dragData?: unknown
}

export interface EventHandlerOptions {
  enablePanning?: boolean
  enableZooming?: boolean
  enableDragDrop?: boolean
  enableContextMenu?: boolean
  dragThreshold?: number
  doubleClickDelay?: number
  touchThreshold?: number
  preventDefaultEvents?: boolean
}

// =============================================
// CONSTANTS
// =============================================

export const DEFAULT_EVENT_OPTIONS: Required<EventHandlerOptions> = {
  enablePanning: true,
  enableZooming: true,
  enableDragDrop: true,
  enableContextMenu: false,
  dragThreshold: 5,
  doubleClickDelay: 300,
  touchThreshold: 10,
  preventDefaultEvents: true,
}

// =============================================
// CANVAS EVENT HANDLER CLASS
// =============================================

export class CanvasEventHandler {
  private canvas: HTMLCanvasElement
  private coordinateTransform: CanvasCoordinateTransform
  private handlers: CanvasEventHandlers
  private options: Required<EventHandlerOptions>
  private dragState: DragState
  private lastClickTime: number = 0
  private lastClickPosition: Coordinate | null = null
  private boundEventHandlers: Map<string, EventListener> = new Map()
  private rafId: number | null = null

  constructor(
    canvas: HTMLCanvasElement,
    coordinateTransform: CanvasCoordinateTransform,
    handlers: CanvasEventHandlers = {},
    options: EventHandlerOptions = {}
  ) {
    this.canvas = canvas
    this.coordinateTransform = coordinateTransform
    this.handlers = handlers
    this.options = { ...DEFAULT_EVENT_OPTIONS, ...options }

    this.dragState = {
      isDragging: false,
      startPosition: null,
      currentPosition: null,
      startGridPosition: null,
      currentGridPosition: null,
      dragType: null,
    }

    this.bindEvents()
  }

  // =============================================
  // PUBLIC METHODS
  // =============================================

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<CanvasEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers }
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<EventHandlerOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Enable/disable specific event types
   */
  setEventEnabled(eventType: keyof EventHandlerOptions, enabled: boolean): void {
    this.options[eventType] = enabled
  }

  /**
   * Get current drag state
   */
  getDragState(): Readonly<DragState> {
    return { ...this.dragState }
  }

  /**
   * Reset drag state
   */
  resetDragState(): void {
    this.dragState = {
      isDragging: false,
      startPosition: null,
      currentPosition: null,
      startGridPosition: null,
      currentGridPosition: null,
      dragType: null,
      dragData: undefined,
    }
  }

  /**
   * Destroy event handler and clean up
   */
  destroy(): void {
    this.unbindEvents()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  // =============================================
  // PRIVATE METHODS - EVENT BINDING
  // =============================================

  private bindEvents(): void {
    // Mouse events
    this.addEventListenerWithCleanup('mousedown', this.handleMouseDown.bind(this))
    this.addEventListenerWithCleanup('mousemove', this.handleMouseMove.bind(this))
    this.addEventListenerWithCleanup('mouseup', this.handleMouseUp.bind(this))
    this.addEventListenerWithCleanup('click', this.handleClick.bind(this))
    this.addEventListenerWithCleanup('dblclick', this.handleDoubleClick.bind(this))
    this.addEventListenerWithCleanup('wheel', this.handleWheel.bind(this), { passive: false })

    // Touch events
    this.addEventListenerWithCleanup('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.addEventListenerWithCleanup('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.addEventListenerWithCleanup('touchend', this.handleTouchEnd.bind(this), { passive: false })

    // Context menu
    if (this.options.enableContextMenu) {
      this.addEventListenerWithCleanup('contextmenu', this.handleContextMenu.bind(this))
    } else {
      this.addEventListenerWithCleanup('contextmenu', (e) => e.preventDefault())
    }

    // Focus events
    this.addEventListenerWithCleanup('mouseenter', this.handleMouseEnter.bind(this))
    this.addEventListenerWithCleanup('mouseleave', this.handleMouseLeave.bind(this))
  }

  private unbindEvents(): void {
    this.boundEventHandlers.forEach((handler, eventType) => {
      this.canvas.removeEventListener(eventType, handler)
    })
    this.boundEventHandlers.clear()
  }

  private addEventListenerWithCleanup(
    eventType: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    this.canvas.addEventListener(eventType, handler, options)
    this.boundEventHandlers.set(eventType, handler)
  }

  // =============================================
  // PRIVATE METHODS - MOUSE EVENTS
  // =============================================

  private handleMouseDown(event: MouseEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    const eventData = this.createEventData(event, 'drag_start')

    if (event.button === 0) { // Left mouse button
      this.startDrag(eventData, this.determineDragType(event))
      this.handlers.onDragStart?.(eventData)
    }

    this.canvas.focus()
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.options.preventDefaultEvents && this.dragState.isDragging) {
      event.preventDefault()
    }

    const eventData = this.createEventData(event, this.dragState.isDragging ? 'drag_move' : 'hover')

    if (this.dragState.isDragging) {
      this.updateDrag(eventData)
      this.handlers.onDragMove?.(eventData)
    } else {
      // Throttle hover events using requestAnimationFrame
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.handlers.onHover?.(eventData)
          this.rafId = null
        })
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    if (this.dragState.isDragging) {
      const eventData = this.createEventData(event, 'drag_end')
      this.endDrag(eventData)
      this.handlers.onDragEnd?.(eventData)
    }
  }

  private handleClick(event: MouseEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    // Don't trigger click if we just ended a drag operation
    if (this.dragState.isDragging) {
      return
    }

    const eventData = this.createEventData(event, 'click')
    const currentTime = Date.now()
    const clickPosition = eventData.screenCoordinate

    // Check for double click
    if (
      this.lastClickTime &&
      currentTime - this.lastClickTime < this.options.doubleClickDelay &&
      this.lastClickPosition &&
      this.getDistance(clickPosition, this.lastClickPosition) < this.options.dragThreshold
    ) {
      // This will be handled by the dblclick event, don't process as single click
      return
    }

    this.lastClickTime = currentTime
    this.lastClickPosition = clickPosition

    // Delay single click to allow for potential double click
    setTimeout(() => {
      if (Date.now() - this.lastClickTime >= this.options.doubleClickDelay) {
        this.handlers.onClick?.(eventData)
      }
    }, this.options.doubleClickDelay)
  }

  private handleDoubleClick(event: MouseEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    const eventData = this.createEventData(event, 'doubleclick')
    this.handlers.onDoubleClick?.(eventData)

    // Reset click tracking
    this.lastClickTime = 0
    this.lastClickPosition = null
  }

  private handleWheel(event: WheelEvent): void {
    if (!this.options.enableZooming) {
      return
    }

    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    const eventData = this.createEventData(event, 'wheel')
    this.handlers.onWheel?.(eventData)
  }

  private handleContextMenu(event: MouseEvent): void {
    if (!this.options.enableContextMenu) {
      event.preventDefault()
      return
    }

    const eventData = this.createEventData(event, 'context_menu')
    this.handlers.onContextMenu?.(eventData)
  }

  private handleMouseEnter(_event: MouseEvent): void {
    // Set cursor style based on current mode
    this.updateCursor()
  }

  private handleMouseLeave(_event: MouseEvent): void {
    this.resetDragState()
  }

  // =============================================
  // PRIVATE METHODS - TOUCH EVENTS
  // =============================================

  private handleTouchStart(event: TouchEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = this.touchToMouseEvent(touch, 'mousedown')
      const eventData = this.createEventData(mouseEvent, 'touch_start')

      this.startDrag(eventData, 'select')
      this.handlers.onTouchStart?.(eventData)
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = this.touchToMouseEvent(touch, 'mousemove')
      const eventData = this.createEventData(mouseEvent, 'touch_move')

      if (this.dragState.isDragging) {
        this.updateDrag(eventData)
      }

      this.handlers.onTouchMove?.(eventData)
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.options.preventDefaultEvents) {
      event.preventDefault()
    }

    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0]
      const mouseEvent = this.touchToMouseEvent(touch, 'mouseup')
      const eventData = this.createEventData(mouseEvent, 'touch_end')

      if (this.dragState.isDragging) {
        this.endDrag(eventData)
      }

      this.handlers.onTouchEnd?.(eventData)
    }
  }

  // =============================================
  // PRIVATE METHODS - DRAG HANDLING
  // =============================================

  private startDrag(eventData: CanvasEventData, dragType: DragState['dragType']): void {
    this.dragState = {
      isDragging: false, // Will be set to true if drag threshold is exceeded
      startPosition: eventData.screenCoordinate,
      currentPosition: eventData.screenCoordinate,
      startGridPosition: eventData.gridCoordinate,
      currentGridPosition: eventData.gridCoordinate,
      dragType,
    }
  }

  private updateDrag(eventData: CanvasEventData): void {
    if (!this.dragState.startPosition) return

    const dragDistance = this.getDistance(
      eventData.screenCoordinate,
      this.dragState.startPosition
    )

    // Start dragging if threshold exceeded
    if (!this.dragState.isDragging && dragDistance > this.options.dragThreshold) {
      this.dragState.isDragging = true
      this.updateCursor()
    }

    this.dragState.currentPosition = eventData.screenCoordinate
    this.dragState.currentGridPosition = eventData.gridCoordinate

    // Handle different drag types
    if (this.dragState.isDragging && this.options.enablePanning && this.dragState.dragType === 'pan') {
      this.handlePanDrag(eventData)
    }
  }

  private endDrag(eventData: CanvasEventData): void {
    const wasDragging = this.dragState.isDragging

    this.resetDragState()
    this.updateCursor()

    // If we weren't actually dragging, treat as a click
    if (!wasDragging && this.dragState.startPosition) {
      const clickEventData = { ...eventData, eventType: 'click' as const }
      this.handlers.onClick?.(clickEventData)
    }
  }

  private handlePanDrag(eventData: CanvasEventData): void {
    if (!this.dragState.startPosition) return

    const deltaX = eventData.screenCoordinate.x - this.dragState.startPosition.x
    const deltaY = eventData.screenCoordinate.y - this.dragState.startPosition.y

    this.coordinateTransform.pan(deltaX, deltaY)

    // Update start position for smooth panning
    this.dragState.startPosition = eventData.screenCoordinate
  }

  private determineDragType(event: MouseEvent): DragState['dragType'] {
    // Determine drag type based on modifiers and context
    if (event.altKey || event.button === 1) { // Alt key or middle mouse button
      return 'pan'
    }

    // Default to selection/interaction
    return 'select'
  }

  // =============================================
  // PRIVATE METHODS - UTILITIES
  // =============================================

  private createEventData(event: Event, eventType: CanvasEventType): CanvasEventData {
    const screenCoordinate = this.getEventCoordinates(event)
    const canvasCoordinate = this.screenToCanvas(screenCoordinate)
    const gridCoordinate = this.coordinateTransform.screenToGrid(
      screenCoordinate.x,
      screenCoordinate.y
    )

    return {
      gridCoordinate,
      screenCoordinate,
      canvasCoordinate,
      originalEvent: event,
      eventType,
      timestamp: Date.now(),
    }
  }

  private getEventCoordinates(event: Event): Coordinate {
    let clientX: number, clientY: number

    if (event instanceof MouseEvent) {
      clientX = event.clientX
      clientY = event.clientY
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else if (event instanceof TouchEvent && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX
      clientY = event.changedTouches[0].clientY
    } else {
      return { x: 0, y: 0 }
    }

    const rect = this.canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  private screenToCanvas(screenCoord: Coordinate): Coordinate {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    return {
      x: screenCoord.x * scaleX,
      y: screenCoord.y * scaleY,
    }
  }

  private touchToMouseEvent(touch: Touch, type: string): MouseEvent {
    return new MouseEvent(type, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 1,
    })
  }

  private getDistance(a: Coordinate, b: Coordinate): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
  }

  private updateCursor(): void {
    let cursor = 'default'

    if (this.dragState.isDragging) {
      switch (this.dragState.dragType) {
        case 'pan':
          cursor = 'grabbing'
          break
        case 'select':
          cursor = 'pointer'
          break
        case 'ship':
          cursor = 'move'
          break
        default:
          cursor = 'grabbing'
      }
    } else {
      cursor = 'default'
    }

    this.canvas.style.cursor = cursor
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Create a debounced event handler
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null

  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }) as T
}

/**
 * Create a throttled event handler
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): T {
  let lastTime = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }) as T
}
/**
 * Placement Interactions Module
 * Advanced interaction system for mouse, touch, and keyboard
 *
 * Part of TASK 5: Konva.js Interactions
 * Complete interaction system with accessibility support
 */

import { Cell } from './types'
import { PlacementState, ShipKind } from './stateMachine'

// =============================================
// INTERACTION TYPES
// =============================================

export interface MouseInteractionEvent {
  type: 'click' | 'hover' | 'leave' | 'doubleclick' | 'rightclick'
  cell: Cell
  originalEvent: MouseEvent
}

export interface TouchInteractionEvent {
  type: 'tap' | 'doubletap' | 'longpress' | 'dragstart' | 'dragmove' | 'dragend'
  cell: Cell
  originalEvent: TouchEvent
  gesture?: TouchGesture
}

export interface KeyboardInteractionEvent {
  type: 'keydown' | 'keyup'
  key: string
  originalEvent: KeyboardEvent
  focusedCell?: Cell
}

export interface TouchGesture {
  startCell: Cell
  currentCell: Cell
  deltaX: number
  deltaY: number
  duration: number
  velocity: number
}

export interface InteractionHandlers {
  onMouseEvent: (event: MouseInteractionEvent) => boolean
  onTouchEvent: (event: TouchInteractionEvent) => boolean
  onKeyboardEvent: (event: KeyboardInteractionEvent) => boolean
}

// =============================================
// MOUSE INTERACTION MANAGER
// =============================================

export class MouseInteractionManager {
  private lastClickTime = 0
  private doubleClickThreshold = 300 // ms

  handleMouseClick(
    cell: Cell,
    event: MouseEvent,
    placementState: PlacementState
  ): MouseInteractionEvent {
    const now = Date.now()
    const isDoubleClick = now - this.lastClickTime < this.doubleClickThreshold

    this.lastClickTime = now

    return {
      type: isDoubleClick ? 'doubleclick' : 'click',
      cell,
      originalEvent: event
    }
  }

  handleMouseHover(cell: Cell, event: MouseEvent): MouseInteractionEvent {
    return {
      type: 'hover',
      cell,
      originalEvent: event
    }
  }

  handleMouseLeave(cell: Cell, event: MouseEvent): MouseInteractionEvent {
    return {
      type: 'leave',
      cell,
      originalEvent: event
    }
  }

  handleRightClick(cell: Cell, event: MouseEvent): MouseInteractionEvent {
    event.preventDefault() // Prevent context menu
    return {
      type: 'rightclick',
      cell,
      originalEvent: event
    }
  }
}

// =============================================
// TOUCH INTERACTION MANAGER
// =============================================

export class TouchInteractionManager {
  private lastTapTime = 0
  private doubleTapThreshold = 300 // ms
  private longPressThreshold = 500 // ms
  private dragThreshold = 10 // pixels
  private longPressTimer?: number
  private touchStartTime = 0
  private touchStartPos = { x: 0, y: 0 }
  private isDragging = false

  handleTouchStart(
    cell: Cell,
    event: TouchEvent,
    cellSize: number
  ): TouchInteractionEvent | null {
    const touch = event.touches[0]
    if (!touch) return null

    this.touchStartTime = Date.now()
    this.touchStartPos = { x: touch.clientX, y: touch.clientY }
    this.isDragging = false

    // Start long press timer
    this.longPressTimer = window.setTimeout(() => {
      if (!this.isDragging) {
        // Trigger long press
        const longPressEvent: TouchInteractionEvent = {
          type: 'longpress',
          cell,
          originalEvent: event
        }
        this.handleTouchInteraction(longPressEvent)
      }
    }, this.longPressThreshold)

    return {
      type: 'dragstart',
      cell,
      originalEvent: event,
      gesture: {
        startCell: cell,
        currentCell: cell,
        deltaX: 0,
        deltaY: 0,
        duration: 0,
        velocity: 0
      }
    }
  }

  handleTouchMove(
    cell: Cell,
    event: TouchEvent,
    startCell: Cell,
    cellSize: number
  ): TouchInteractionEvent | null {
    const touch = event.touches[0]
    if (!touch) return null

    const deltaX = touch.clientX - this.touchStartPos.x
    const deltaY = touch.clientY - this.touchStartPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Check if we've moved enough to start dragging
    if (distance > this.dragThreshold && !this.isDragging) {
      this.isDragging = true
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = undefined
      }
    }

    if (this.isDragging) {
      const duration = Date.now() - this.touchStartTime
      const velocity = duration > 0 ? distance / duration : 0

      return {
        type: 'dragmove',
        cell,
        originalEvent: event,
        gesture: {
          startCell,
          currentCell: cell,
          deltaX,
          deltaY,
          duration,
          velocity
        }
      }
    }

    return null
  }

  handleTouchEnd(
    cell: Cell,
    event: TouchEvent,
    startCell: Cell
  ): TouchInteractionEvent | null {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = undefined
    }

    const now = Date.now()
    const duration = now - this.touchStartTime

    if (this.isDragging) {
      this.isDragging = false
      return {
        type: 'dragend',
        cell,
        originalEvent: event,
        gesture: {
          startCell,
          currentCell: cell,
          deltaX: 0,
          deltaY: 0,
          duration,
          velocity: 0
        }
      }
    }

    // Check for double tap
    const isDoubleTap = now - this.lastTapTime < this.doubleTapThreshold
    this.lastTapTime = now

    return {
      type: isDoubleTap ? 'doubletap' : 'tap',
      cell,
      originalEvent: event
    }
  }

  private handleTouchInteraction(event: TouchInteractionEvent): void {
    // This would be connected to the main interaction handler
    console.log('Touch interaction:', event.type, event.cell)
  }
}

// =============================================
// KEYBOARD INTERACTION MANAGER
// =============================================

export class KeyboardInteractionManager {
  private focusedCell: Cell = { x: 0, y: 0 }
  private gridSize: number

  constructor(gridSize: number = 10) {
    this.gridSize = gridSize
  }

  handleKeyDown(
    event: KeyboardEvent,
    placementState: PlacementState
  ): KeyboardInteractionEvent {
    return {
      type: 'keydown',
      key: event.key.toLowerCase(),
      originalEvent: event,
      focusedCell: this.focusedCell
    }
  }

  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): Cell {
    const { x, y } = this.focusedCell

    switch (direction) {
      case 'up':
        this.focusedCell = { x, y: Math.max(0, y - 1) }
        break
      case 'down':
        this.focusedCell = { x, y: Math.min(this.gridSize - 1, y + 1) }
        break
      case 'left':
        this.focusedCell = { x: Math.max(0, x - 1), y }
        break
      case 'right':
        this.focusedCell = { x: Math.min(this.gridSize - 1, x + 1), y }
        break
    }

    return this.focusedCell
  }

  setFocus(cell: Cell): void {
    this.focusedCell = {
      x: Math.max(0, Math.min(this.gridSize - 1, cell.x)),
      y: Math.max(0, Math.min(this.gridSize - 1, cell.y))
    }
  }

  getFocus(): Cell {
    return { ...this.focusedCell }
  }
}

// =============================================
// ACCESSIBILITY MANAGER
// =============================================

export class AccessibilityManager {
  private announcements: string[] = []
  private announcementElement?: HTMLElement

  constructor(liveRegionId?: string) {
    if (liveRegionId) {
      this.announcementElement = document.getElementById(liveRegionId) || undefined
    }
  }

  announceAction(message: string): void {
    this.announcements.push(message)

    if (this.announcementElement) {
      this.announcementElement.textContent = message
    }

    // Keep only last 10 announcements
    if (this.announcements.length > 10) {
      this.announcements = this.announcements.slice(-10)
    }
  }

  announceShipSelection(shipKind: ShipKind): void {
    const shipName = shipKind.charAt(0).toUpperCase() + shipKind.slice(1)
    this.announceAction(`${shipName} selected for placement`)
  }

  announceShipPlacement(shipKind: ShipKind, cell: Cell, orientation: string): void {
    const shipName = shipKind.charAt(0).toUpperCase() + shipKind.slice(1)
    this.announceAction(`${shipName} placed at grid ${cell.x}, ${cell.y} in ${orientation} orientation`)
  }

  announceInvalidPlacement(reason: string): void {
    this.announceAction(`Invalid placement: ${reason}`)
  }

  announceShipRemoval(shipKind: string): void {
    this.announceAction(`${shipKind} removed from grid`)
  }

  announceFleetComplete(score: number, grade: string): void {
    this.announceAction(`Fleet deployment complete. Strategy grade ${grade} with score ${score}`)
  }

  getRecentAnnouncements(): string[] {
    return [...this.announcements]
  }
}

// =============================================
// MAIN INTERACTION CONTROLLER
// =============================================

export interface InteractionControllerConfig {
  gridSize?: number
  cellSize?: number
  enableTouch?: boolean
  enableKeyboard?: boolean
  enableAccessibility?: boolean
  liveRegionId?: string
}

export class InteractionController {
  private mouseManager: MouseInteractionManager
  private touchManager: TouchInteractionManager
  private keyboardManager: KeyboardInteractionManager
  private accessibilityManager: AccessibilityManager
  private config: Required<InteractionControllerConfig>

  constructor(config: InteractionControllerConfig = {}) {
    this.config = {
      gridSize: 10,
      cellSize: 40,
      enableTouch: true,
      enableKeyboard: true,
      enableAccessibility: true,
      liveRegionId: 'placement-announcements',
      ...config
    }

    this.mouseManager = new MouseInteractionManager()
    this.touchManager = new TouchInteractionManager()
    this.keyboardManager = new KeyboardInteractionManager(this.config.gridSize)
    this.accessibilityManager = new AccessibilityManager(this.config.liveRegionId)
  }

  // =============================================
  // PUBLIC API
  // =============================================

  processMouseEvent(
    eventType: 'click' | 'hover' | 'leave' | 'rightclick',
    cell: Cell,
    event: MouseEvent,
    placementState: PlacementState
  ): MouseInteractionEvent {
    switch (eventType) {
      case 'click':
        return this.mouseManager.handleMouseClick(cell, event, placementState)
      case 'hover':
        return this.mouseManager.handleMouseHover(cell, event)
      case 'leave':
        return this.mouseManager.handleMouseLeave(cell, event)
      case 'rightclick':
        return this.mouseManager.handleRightClick(cell, event)
    }
  }

  processTouchEvent(
    eventType: 'start' | 'move' | 'end',
    cell: Cell,
    event: TouchEvent,
    startCell?: Cell
  ): TouchInteractionEvent | null {
    switch (eventType) {
      case 'start':
        return this.touchManager.handleTouchStart(cell, event, this.config.cellSize)
      case 'move':
        return startCell
          ? this.touchManager.handleTouchMove(cell, event, startCell, this.config.cellSize)
          : null
      case 'end':
        return startCell
          ? this.touchManager.handleTouchEnd(cell, event, startCell)
          : null
    }
  }

  processKeyboardEvent(
    event: KeyboardEvent,
    placementState: PlacementState
  ): KeyboardInteractionEvent {
    return this.keyboardManager.handleKeyDown(event, placementState)
  }

  // =============================================
  // FOCUS MANAGEMENT
  // =============================================

  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): Cell {
    const newCell = this.keyboardManager.moveFocus(direction)
    this.accessibilityManager.announceAction(`Focus moved to grid ${newCell.x}, ${newCell.y}`)
    return newCell
  }

  setFocus(cell: Cell): void {
    this.keyboardManager.setFocus(cell)
    this.accessibilityManager.announceAction(`Focus set to grid ${cell.x}, ${cell.y}`)
  }

  getFocusedCell(): Cell {
    return this.keyboardManager.getFocus()
  }

  // =============================================
  // ACCESSIBILITY METHODS
  // =============================================

  announceShipSelection(shipKind: ShipKind): void {
    if (this.config.enableAccessibility) {
      this.accessibilityManager.announceShipSelection(shipKind)
    }
  }

  announceShipPlacement(shipKind: ShipKind, cell: Cell, orientation: string): void {
    if (this.config.enableAccessibility) {
      this.accessibilityManager.announceShipPlacement(shipKind, cell, orientation)
    }
  }

  announceInvalidPlacement(reason: string): void {
    if (this.config.enableAccessibility) {
      this.accessibilityManager.announceInvalidPlacement(reason)
    }
  }

  announceShipRemoval(shipKind: string): void {
    if (this.config.enableAccessibility) {
      this.accessibilityManager.announceShipRemoval(shipKind)
    }
  }

  announceFleetComplete(score: number, grade: string): void {
    if (this.config.enableAccessibility) {
      this.accessibilityManager.announceFleetComplete(score, grade)
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isValidCell(cell: Cell): boolean {
    return cell.x >= 0 && cell.x < this.config.gridSize &&
           cell.y >= 0 && cell.y < this.config.gridSize
  }

  getConfig(): Required<InteractionControllerConfig> {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<InteractionControllerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// =============================================
// GESTURE RECOGNITION UTILITIES
// =============================================

export function recognizeGesture(
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  duration: number
): 'tap' | 'swipe' | 'drag' | 'unknown' {
  const deltaX = endPos.x - startPos.x
  const deltaY = endPos.y - startPos.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const velocity = duration > 0 ? distance / duration : 0

  if (distance < 10 && duration < 200) {
    return 'tap'
  }

  if (distance > 50 && velocity > 0.5) {
    return 'swipe'
  }

  if (distance > 10) {
    return 'drag'
  }

  return 'unknown'
}

export function calculateSwipeDirection(
  startPos: { x: number; y: number },
  endPos: { x: number; y: number }
): 'up' | 'down' | 'left' | 'right' | 'none' {
  const deltaX = endPos.x - startPos.x
  const deltaY = endPos.y - startPos.y

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left'
  } else if (Math.abs(deltaY) > 10) {
    return deltaY > 0 ? 'down' : 'up'
  }

  return 'none'
}

// =============================================
// KEYBOARD SHORTCUTS CONFIGURATION
// =============================================

export const KEYBOARD_SHORTCUTS = {
  ROTATE: ['r', 'R'],
  CANCEL: ['Escape', 'Esc'],
  CONFIRM: ['Enter', ' '],
  REMOVE: ['Delete', 'Backspace'],
  MOVE_UP: ['ArrowUp', 'w', 'W'],
  MOVE_DOWN: ['ArrowDown', 's', 'S'],
  MOVE_LEFT: ['ArrowLeft', 'a', 'A'],
  MOVE_RIGHT: ['ArrowRight', 'd', 'D'],
  SELECT_SHIP_1: ['1'],
  SELECT_SHIP_2: ['2'],
  SELECT_SHIP_3: ['3'],
  SELECT_SHIP_4: ['4'],
  SELECT_SHIP_5: ['5']
} as const

export function matchesShortcut(
  key: string,
  shortcut: readonly string[]
): boolean {
  return shortcut.includes(key)
}

export function getShortcutDescription(shortcut: readonly string[]): string {
  return shortcut.join(' or ')
}
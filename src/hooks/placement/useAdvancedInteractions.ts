/**
 * Advanced Interactions Hook
 * Enhanced interaction handling for mouse, touch, and keyboard
 *
 * Part of TASK 5: Konva.js Interactions
 * Complete interaction system with accessibility support
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  InteractionController,
  MouseInteractionEvent,
  TouchInteractionEvent,
  KeyboardInteractionEvent,
  KEYBOARD_SHORTCUTS,
  matchesShortcut
} from '../../lib/placement/interactions'
import { Cell } from '../../lib/placement'
import { PlacementState, ShipKind } from '../../lib/placement/stateMachine'
import { PlacementHandlers } from './useKonvaPlacement'

// =============================================
// HOOK INTERFACE
// =============================================

export interface AdvancedInteractionConfig {
  gridSize?: number
  cellSize?: number
  enableTouch?: boolean
  enableKeyboard?: boolean
  enableAccessibility?: boolean
  liveRegionId?: string
}

export interface AdvancedInteractionHandlers {
  // Mouse events
  handleMouseClick: (cell: Cell, event: MouseEvent) => void
  handleMouseHover: (cell: Cell, event: MouseEvent) => void
  handleMouseLeave: (cell: Cell, event: MouseEvent) => void
  handleRightClick: (cell: Cell, event: MouseEvent) => void

  // Touch events
  handleTouchStart: (cell: Cell, event: TouchEvent) => void
  handleTouchMove: (cell: Cell, event: TouchEvent) => void
  handleTouchEnd: (cell: Cell, event: TouchEvent) => void

  // Keyboard events
  handleKeyDown: (event: KeyboardEvent) => void
  handleKeyUp: (event: KeyboardEvent) => void

  // Focus management
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => Cell
  setFocus: (cell: Cell) => void
  getFocusedCell: () => Cell

  // Accessibility
  announceAction: (message: string) => void
}

export interface TouchState {
  isActive: boolean
  startCell?: Cell
  currentCell?: Cell
  isDragging: boolean
}

// =============================================
// MAIN HOOK IMPLEMENTATION
// =============================================

export function useAdvancedInteractions(
  placementState: PlacementState | undefined,
  placementHandlers: PlacementHandlers,
  config: AdvancedInteractionConfig = {}
) {
  const controllerRef = useRef<InteractionController>()
  const [touchState, setTouchState] = useState<TouchState>({
    isActive: false,
    isDragging: false
  })
  const [focusedCell, setFocusedCell] = useState<Cell>({ x: 0, y: 0 })

  // Initialize interaction controller
  useEffect(() => {
    controllerRef.current = new InteractionController(config)
  }, [config])

  // =============================================
  // MOUSE EVENT HANDLERS
  // =============================================

  const handleMouseClick = useCallback((cell: Cell, event: MouseEvent) => {
    if (!controllerRef.current || !placementState) return

    const interactionEvent = controllerRef.current.processMouseEvent(
      'click',
      cell,
      event,
      placementState
    )

    // Handle double-click for rotation
    if (interactionEvent.type === 'doubleclick') {
      const ship = placementState.placedShips.find(ship =>
        ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
      )
      if (ship) {
        placementHandlers.rotateShip(ship.id)
        controllerRef.current.announceAction(`Rotating ${ship.id}`)
      }
    } else {
      // Regular click handling
      placementHandlers.handleCellClick(cell)
    }
  }, [placementState, placementHandlers])

  const handleMouseHover = useCallback((cell: Cell, event: MouseEvent) => {
    if (!controllerRef.current) return

    controllerRef.current.processMouseEvent('hover', cell, event, placementState!)
    placementHandlers.handleCellHover(cell)
  }, [placementState, placementHandlers])

  const handleMouseLeave = useCallback((cell: Cell, event: MouseEvent) => {
    if (!controllerRef.current) return

    controllerRef.current.processMouseEvent('leave', cell, event, placementState!)
    placementHandlers.handleCellLeave()
  }, [placementState, placementHandlers])

  const handleRightClick = useCallback((cell: Cell, event: MouseEvent) => {
    if (!controllerRef.current || !placementState) return

    const interactionEvent = controllerRef.current.processMouseEvent(
      'rightclick',
      cell,
      event,
      placementState
    )

    // Handle right-click for ship removal
    const ship = placementState.placedShips.find(ship =>
      ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
    )

    if (ship) {
      placementHandlers.removeShip(ship.id)
      controllerRef.current.announceShipRemoval(ship.id)
    }
  }, [placementState, placementHandlers])

  // =============================================
  // TOUCH EVENT HANDLERS
  // =============================================

  const handleTouchStart = useCallback((cell: Cell, event: TouchEvent) => {
    if (!controllerRef.current || !config.enableTouch) return

    const interactionEvent = controllerRef.current.processTouchEvent('start', cell, event)
    if (interactionEvent) {
      setTouchState({
        isActive: true,
        startCell: cell,
        currentCell: cell,
        isDragging: false
      })
    }
  }, [config.enableTouch])

  const handleTouchMove = useCallback((cell: Cell, event: TouchEvent) => {
    if (!controllerRef.current || !config.enableTouch || !touchState.startCell) return

    const interactionEvent = controllerRef.current.processTouchEvent(
      'move',
      cell,
      event,
      touchState.startCell
    )

    if (interactionEvent?.type === 'dragmove') {
      setTouchState(prev => ({
        ...prev,
        currentCell: cell,
        isDragging: true
      }))

      // Handle drag preview
      placementHandlers.handleCellHover(cell)
    }
  }, [config.enableTouch, touchState.startCell, placementHandlers])

  const handleTouchEnd = useCallback((cell: Cell, event: TouchEvent) => {
    if (!controllerRef.current || !config.enableTouch || !touchState.startCell) return

    const interactionEvent = controllerRef.current.processTouchEvent(
      'end',
      cell,
      event,
      touchState.startCell
    )

    if (interactionEvent) {
      switch (interactionEvent.type) {
        case 'tap':
          placementHandlers.handleCellClick(cell)
          break
        case 'doubletap':
          // Handle double-tap for rotation
          const ship = placementState?.placedShips.find(ship =>
            ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
          )
          if (ship) {
            placementHandlers.rotateShip(ship.id)
          }
          break
        case 'dragend':
          if (touchState.isDragging && touchState.startCell) {
            // Handle ship drag
            const ship = placementState?.placedShips.find(ship =>
              ship.cells.some(shipCell =>
                shipCell.x === touchState.startCell!.x && shipCell.y === touchState.startCell!.y
              )
            )
            if (ship) {
              placementHandlers.handleShipDrag(ship.id, cell)
            }
          }
          break
        case 'longpress':
          // Handle long press for context actions
          const longPressShip = placementState?.placedShips.find(ship =>
            ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
          )
          if (longPressShip) {
            placementHandlers.removeShip(longPressShip.id)
          }
          break
      }
    }

    setTouchState({
      isActive: false,
      isDragging: false
    })
  }, [config.enableTouch, touchState, placementState, placementHandlers])

  // =============================================
  // KEYBOARD EVENT HANDLERS
  // =============================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!controllerRef.current || !config.enableKeyboard) return

    const interactionEvent = controllerRef.current.processKeyboardEvent(event, placementState!)
    const key = event.key

    // Prevent default for handled keys
    let handled = false

    // Navigation keys
    if (matchesShortcut(key, KEYBOARD_SHORTCUTS.MOVE_UP)) {
      event.preventDefault()
      const newCell = controllerRef.current.moveFocus('up')
      setFocusedCell(newCell)
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.MOVE_DOWN)) {
      event.preventDefault()
      const newCell = controllerRef.current.moveFocus('down')
      setFocusedCell(newCell)
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.MOVE_LEFT)) {
      event.preventDefault()
      const newCell = controllerRef.current.moveFocus('left')
      setFocusedCell(newCell)
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.MOVE_RIGHT)) {
      event.preventDefault()
      const newCell = controllerRef.current.moveFocus('right')
      setFocusedCell(newCell)
      handled = true
    }

    // Action keys
    if (matchesShortcut(key, KEYBOARD_SHORTCUTS.ROTATE)) {
      event.preventDefault()
      placementHandlers.rotateShip()
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.CANCEL)) {
      event.preventDefault()
      placementHandlers.cancelAction()
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.CONFIRM)) {
      event.preventDefault()
      placementHandlers.handleCellClick(focusedCell)
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.REMOVE)) {
      event.preventDefault()
      const ship = placementState?.placedShips.find(ship =>
        ship.cells.some(shipCell => shipCell.x === focusedCell.x && shipCell.y === focusedCell.y)
      )
      if (ship) {
        placementHandlers.removeShip(ship.id)
      }
      handled = true
    }

    // Ship selection keys
    const shipKinds: ShipKind[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']
    if (matchesShortcut(key, KEYBOARD_SHORTCUTS.SELECT_SHIP_1)) {
      event.preventDefault()
      placementHandlers.selectShip(shipKinds[0])
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.SELECT_SHIP_2)) {
      event.preventDefault()
      placementHandlers.selectShip(shipKinds[1])
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.SELECT_SHIP_3)) {
      event.preventDefault()
      placementHandlers.selectShip(shipKinds[2])
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.SELECT_SHIP_4)) {
      event.preventDefault()
      placementHandlers.selectShip(shipKinds[3])
      handled = true
    } else if (matchesShortcut(key, KEYBOARD_SHORTCUTS.SELECT_SHIP_5)) {
      event.preventDefault()
      placementHandlers.selectShip(shipKinds[4])
      handled = true
    }

    return handled
  }, [config.enableKeyboard, placementState, placementHandlers, focusedCell])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // Handle key up events if needed
    return false
  }, [])

  // =============================================
  // FOCUS MANAGEMENT
  // =============================================

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right'): Cell => {
    if (!controllerRef.current) return focusedCell

    const newCell = controllerRef.current.moveFocus(direction)
    setFocusedCell(newCell)
    return newCell
  }, [focusedCell])

  const setFocus = useCallback((cell: Cell) => {
    controllerRef.current?.setFocus(cell)
    setFocusedCell(cell)
  }, [])

  const getFocusedCell = useCallback((): Cell => {
    return controllerRef.current?.getFocusedCell() || focusedCell
  }, [focusedCell])

  // =============================================
  // ACCESSIBILITY METHODS
  // =============================================

  const announceAction = useCallback((message: string) => {
    controllerRef.current?.announceAction(message)
  }, [])

  // =============================================
  // EFFECT FOR KEYBOARD LISTENERS
  // =============================================

  useEffect(() => {
    if (!config.enableKeyboard) return

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event)
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [config.enableKeyboard, handleKeyDown])

  // =============================================
  // RETURN INTERFACE
  // =============================================

  const handlers: AdvancedInteractionHandlers = {
    handleMouseClick,
    handleMouseHover,
    handleMouseLeave,
    handleRightClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleKeyUp,
    moveFocus,
    setFocus,
    getFocusedCell,
    announceAction
  }

  return {
    handlers,
    touchState,
    focusedCell,
    interactionController: controllerRef.current
  }
}
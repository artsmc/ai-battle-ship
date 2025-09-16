/**
 * Interactions Module Tests
 * Comprehensive test suite for advanced interaction system
 *
 * Part of TASK 5: Konva.js Interactions
 * Tests for mouse, touch, keyboard interactions and accessibility
 */

import {
  InteractionController,
  MouseInteractionManager,
  TouchInteractionManager,
  KeyboardInteractionManager,
  AccessibilityManager,
  KEYBOARD_SHORTCUTS,
  matchesShortcut,
  recognizeGesture,
  calculateSwipeDirection
} from '../interactions'
import { PlacementStateMachine } from '../stateMachine'
import { STANDARD_RULES } from '../types'

describe('Interaction System', () => {
  let interactionController: InteractionController
  let placementMachine: PlacementStateMachine

  beforeEach(() => {
    interactionController = new InteractionController({
      gridSize: 10,
      cellSize: 40,
      enableTouch: true,
      enableKeyboard: true,
      enableAccessibility: true
    })

    placementMachine = new PlacementStateMachine(STANDARD_RULES)
  })

  describe('MouseInteractionManager', () => {
    let mouseManager: MouseInteractionManager

    beforeEach(() => {
      mouseManager = new MouseInteractionManager()
    })

    it('should handle single click', () => {
      const cell = { x: 5, y: 5 }
      const mockEvent = new MouseEvent('click')
      const result = mouseManager.handleMouseClick(cell, mockEvent, placementMachine.getState())

      expect(result.type).toBe('click')
      expect(result.cell).toEqual(cell)
    })

    it('should detect double click', () => {
      const cell = { x: 5, y: 5 }
      const mockEvent = new MouseEvent('click')

      // First click
      mouseManager.handleMouseClick(cell, mockEvent, placementMachine.getState())

      // Second click within threshold
      const result = mouseManager.handleMouseClick(cell, mockEvent, placementMachine.getState())
      expect(result.type).toBe('doubleclick')
    })

    it('should handle hover events', () => {
      const cell = { x: 3, y: 3 }
      const mockEvent = new MouseEvent('mouseover')
      const result = mouseManager.handleMouseHover(cell, mockEvent)

      expect(result.type).toBe('hover')
      expect(result.cell).toEqual(cell)
    })

    it('should handle right click with prevention', () => {
      const cell = { x: 2, y: 2 }
      const mockEvent = new MouseEvent('contextmenu')
      const preventDefaultSpy = jest.spyOn(mockEvent, 'preventDefault')

      const result = mouseManager.handleRightClick(cell, mockEvent)

      expect(result.type).toBe('rightclick')
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('TouchInteractionManager', () => {
    let touchManager: TouchInteractionManager

    beforeEach(() => {
      touchManager = new TouchInteractionManager()
    })

    it('should handle touch start', () => {
      const cell = { x: 4, y: 4 }
      const mockTouch = { clientX: 100, clientY: 100 } as Touch
      const mockEvent = { touches: [mockTouch] } as TouchEvent

      const result = touchManager.handleTouchStart(cell, mockEvent, 40)

      expect(result?.type).toBe('dragstart')
      expect(result?.cell).toEqual(cell)
      expect(result?.gesture?.startCell).toEqual(cell)
    })

    it('should detect tap vs drag based on movement', () => {
      const startCell = { x: 4, y: 4 }
      const endCell = { x: 4, y: 4 } // Same cell = tap
      const mockTouch = { clientX: 100, clientY: 100 } as Touch
      const mockEvent = { touches: [mockTouch] } as TouchEvent

      // Start touch
      touchManager.handleTouchStart(startCell, mockEvent, 40)

      // End touch at same position
      const result = touchManager.handleTouchEnd(endCell, mockEvent, startCell)

      expect(result?.type).toBe('tap')
    })
  })

  describe('KeyboardInteractionManager', () => {
    let keyboardManager: KeyboardInteractionManager

    beforeEach(() => {
      keyboardManager = new KeyboardInteractionManager(10)
    })

    it('should handle focus movement', () => {
      const initialFocus = keyboardManager.getFocus()
      expect(initialFocus).toEqual({ x: 0, y: 0 })

      const newFocus = keyboardManager.moveFocus('right')
      expect(newFocus).toEqual({ x: 1, y: 0 })

      keyboardManager.moveFocus('down')
      const finalFocus = keyboardManager.getFocus()
      expect(finalFocus).toEqual({ x: 1, y: 1 })
    })

    it('should respect grid boundaries', () => {
      // Try to move beyond boundaries
      for (let i = 0; i < 15; i++) {
        keyboardManager.moveFocus('up')
      }

      const focus = keyboardManager.getFocus()
      expect(focus.y).toBe(0) // Should stay at top boundary

      // Set focus near bottom
      keyboardManager.setFocus({ x: 5, y: 9 })
      keyboardManager.moveFocus('down')

      const bottomFocus = keyboardManager.getFocus()
      expect(bottomFocus.y).toBe(9) // Should stay at bottom boundary
    })

    it('should handle keyboard events', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const result = keyboardManager.handleKeyDown(mockEvent, placementMachine.getState())

      expect(result.type).toBe('keydown')
      expect(result.key).toBe('arrowright')
      expect(result.focusedCell).toEqual({ x: 0, y: 0 })
    })
  })

  describe('AccessibilityManager', () => {
    let accessibilityManager: AccessibilityManager

    beforeEach(() => {
      accessibilityManager = new AccessibilityManager()
    })

    it('should announce actions', () => {
      accessibilityManager.announceAction('Test announcement')
      const announcements = accessibilityManager.getRecentAnnouncements()

      expect(announcements).toContain('Test announcement')
    })

    it('should limit announcement history', () => {
      // Add more than 10 announcements
      for (let i = 0; i < 15; i++) {
        accessibilityManager.announceAction(`Message ${i}`)
      }

      const announcements = accessibilityManager.getRecentAnnouncements()
      expect(announcements).toHaveLength(10)
      expect(announcements[0]).toBe('Message 5') // First 5 should be removed
    })

    it('should announce ship actions', () => {
      accessibilityManager.announceShipSelection('carrier')
      accessibilityManager.announceShipPlacement('destroyer', { x: 3, y: 3 }, 'horizontal')
      accessibilityManager.announceShipRemoval('battleship')

      const announcements = accessibilityManager.getRecentAnnouncements()
      expect(announcements).toContain('Carrier selected for placement')
      expect(announcements.some(a => a.includes('Destroyer placed at grid 3, 3'))).toBe(true)
      expect(announcements.some(a => a.includes('battleship removed'))).toBe(true)
    })
  })

  describe('InteractionController', () => {
    it('should process mouse events', () => {
      const cell = { x: 5, y: 5 }
      const mockEvent = new MouseEvent('click')
      const result = interactionController.processMouseEvent(
        'click',
        cell,
        mockEvent,
        placementMachine.getState()
      )

      expect(result.type).toBe('click')
      expect(result.cell).toEqual(cell)
    })

    it('should validate cells', () => {
      expect(interactionController.isValidCell({ x: 5, y: 5 })).toBe(true)
      expect(interactionController.isValidCell({ x: -1, y: 5 })).toBe(false)
      expect(interactionController.isValidCell({ x: 10, y: 5 })).toBe(false)
    })

    it('should update configuration', () => {
      const initialConfig = interactionController.getConfig()
      expect(initialConfig.gridSize).toBe(10)

      interactionController.updateConfig({ gridSize: 8 })
      const updatedConfig = interactionController.getConfig()
      expect(updatedConfig.gridSize).toBe(8)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should match shortcuts correctly', () => {
      expect(matchesShortcut('r', KEYBOARD_SHORTCUTS.ROTATE)).toBe(true)
      expect(matchesShortcut('R', KEYBOARD_SHORTCUTS.ROTATE)).toBe(true)
      expect(matchesShortcut('x', KEYBOARD_SHORTCUTS.ROTATE)).toBe(false)

      expect(matchesShortcut('Escape', KEYBOARD_SHORTCUTS.CANCEL)).toBe(true)
      expect(matchesShortcut('Esc', KEYBOARD_SHORTCUTS.CANCEL)).toBe(true)

      expect(matchesShortcut('1', KEYBOARD_SHORTCUTS.SELECT_SHIP_1)).toBe(true)
      expect(matchesShortcut('2', KEYBOARD_SHORTCUTS.SELECT_SHIP_2)).toBe(true)
    })
  })

  describe('Gesture Recognition', () => {
    it('should recognize tap gesture', () => {
      const startPos = { x: 100, y: 100 }
      const endPos = { x: 102, y: 101 } // Small movement
      const duration = 150 // Quick

      const gesture = recognizeGesture(startPos, endPos, duration)
      expect(gesture).toBe('tap')
    })

    it('should recognize swipe gesture', () => {
      const startPos = { x: 100, y: 100 }
      const endPos = { x: 200, y: 110 } // Large horizontal movement
      const duration = 200

      const gesture = recognizeGesture(startPos, endPos, duration)
      expect(gesture).toBe('swipe')
    })

    it('should recognize drag gesture', () => {
      const startPos = { x: 100, y: 100 }
      const endPos = { x: 120, y: 105 } // Medium movement
      const duration = 500 // Slow

      const gesture = recognizeGesture(startPos, endPos, duration)
      expect(gesture).toBe('drag')
    })

    it('should calculate swipe direction', () => {
      expect(calculateSwipeDirection({ x: 100, y: 100 }, { x: 150, y: 105 })).toBe('right')
      expect(calculateSwipeDirection({ x: 100, y: 100 }, { x: 95, y: 150 })).toBe('down')
      expect(calculateSwipeDirection({ x: 100, y: 100 }, { x: 105, y: 50 })).toBe('up')
      expect(calculateSwipeDirection({ x: 100, y: 100 }, { x: 50, y: 105 })).toBe('left')
    })
  })
})
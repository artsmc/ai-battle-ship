/**
 * Accessibility Hook
 * WCAG 2.2 AA compliant accessibility features for ship placement
 *
 * Part of TASK 5: Konva.js Interactions
 * Full keyboard navigation and screen reader support
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Cell } from '../../lib/placement'
import { PlacementState, ShipKind, SHIP_SPECS } from '../../lib/placement/stateMachine'
import { PlacementProgress } from './useKonvaPlacement'

// =============================================
// ACCESSIBILITY INTERFACE
// =============================================

export interface AccessibilityConfig {
  enableScreenReader?: boolean
  enableKeyboardNavigation?: boolean
  enableHighContrast?: boolean
  announceDelay?: number
  liveRegionId?: string
}

export interface AccessibilityState {
  focusedCell: Cell
  focusedElement: 'grid' | 'palette' | 'controls' | null
  isHighContrast: boolean
  announcements: string[]
}

export interface AccessibilityHandlers {
  announceShipSelection: (shipKind: ShipKind) => void
  announceShipPlacement: (shipKind: ShipKind, cell: Cell, orientation: string) => void
  announceShipRemoval: (shipKind: ShipKind) => void
  announceInvalidAction: (reason: string) => void
  announceProgress: (progress: PlacementProgress) => void
  announceFleetComplete: (score: number, grade: string) => void
  setGridFocus: (cell: Cell) => void
  setPaletteFocus: (shipKind: ShipKind) => void
  setControlsFocus: (control: string) => void
  getAriaLabel: (element: 'cell' | 'ship' | 'control', data?: any) => string
}

// =============================================
// MAIN ACCESSIBILITY HOOK
// =============================================

export function useAccessibility(
  placementState: PlacementState | undefined,
  progress: PlacementProgress,
  config: AccessibilityConfig = {}
) {
  const {
    enableScreenReader = true,
    enableKeyboardNavigation = true,
    enableHighContrast = false,
    announceDelay = 100,
    liveRegionId = 'placement-announcements'
  } = config

  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    focusedCell: { x: 0, y: 0 },
    focusedElement: null,
    isHighContrast: enableHighContrast,
    announcements: []
  })

  const liveRegionRef = useRef<HTMLElement>()
  const announceTimeoutRef = useRef<number>()

  // =============================================
  // LIVE REGION MANAGEMENT
  // =============================================

  useEffect(() => {
    if (enableScreenReader && liveRegionId) {
      liveRegionRef.current = document.getElementById(liveRegionId) || undefined
    }
  }, [enableScreenReader, liveRegionId])

  const announce = useCallback((message: string) => {
    if (!enableScreenReader) return

    // Clear any pending announcement
    if (announceTimeoutRef.current) {
      clearTimeout(announceTimeoutRef.current)
    }

    // Delay announcement to avoid overwhelming screen readers
    announceTimeoutRef.current = window.setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message
      }

      setAccessibilityState(prev => ({
        ...prev,
        announcements: [...prev.announcements.slice(-9), message] // Keep last 10
      }))
    }, announceDelay)
  }, [enableScreenReader, announceDelay])

  // =============================================
  // ACCESSIBILITY HANDLERS
  // =============================================

  const announceShipSelection = useCallback((shipKind: ShipKind) => {
    const spec = SHIP_SPECS[shipKind]
    const available = placementState?.availableShips.get(shipKind) || 0
    announce(`${spec.name} selected. ${spec.length} cells long. ${available} remaining.`)
  }, [announce, placementState])

  const announceShipPlacement = useCallback((
    shipKind: ShipKind,
    cell: Cell,
    orientation: string
  ) => {
    const spec = SHIP_SPECS[shipKind]
    announce(`${spec.name} placed at grid ${cell.x}, ${cell.y} in ${orientation} orientation`)
  }, [announce])

  const announceShipRemoval = useCallback((shipKind: ShipKind) => {
    const spec = SHIP_SPECS[shipKind]
    announce(`${spec.name} removed from grid`)
  }, [announce])

  const announceInvalidAction = useCallback((reason: string) => {
    announce(`Action not allowed: ${reason}`)
  }, [announce])

  const announceProgress = useCallback((progress: PlacementProgress) => {
    announce(
      `Fleet deployment progress: ${progress.shipsPlaced} of ${progress.totalShips} ships placed. ` +
      `Current strategy grade: ${progress.grade} with score ${progress.score}.`
    )
  }, [announce])

  const announceFleetComplete = useCallback((score: number, grade: string) => {
    announce(
      `Fleet deployment complete! Strategy assessment: Grade ${grade} with ${score} points. ` +
      `Ready for battle.`
    )
  }, [announce])

  // =============================================
  // FOCUS MANAGEMENT
  // =============================================

  const setGridFocus = useCallback((cell: Cell) => {
    setAccessibilityState(prev => ({
      ...prev,
      focusedCell: cell,
      focusedElement: 'grid'
    }))
    announce(`Grid focus: ${cell.x}, ${cell.y}`)
  }, [announce])

  const setPaletteFocus = useCallback((shipKind: ShipKind) => {
    const spec = SHIP_SPECS[shipKind]
    const available = placementState?.availableShips.get(shipKind) || 0
    setAccessibilityState(prev => ({
      ...prev,
      focusedElement: 'palette'
    }))
    announce(`Palette focus: ${spec.name}. ${available} available.`)
  }, [announce, placementState])

  const setControlsFocus = useCallback((control: string) => {
    setAccessibilityState(prev => ({
      ...prev,
      focusedElement: 'controls'
    }))
    announce(`Control focus: ${control}`)
  }, [announce])

  // =============================================
  // ARIA LABEL GENERATION
  // =============================================

  const getAriaLabel = useCallback((
    element: 'cell' | 'ship' | 'control',
    data?: any
  ): string => {
    switch (element) {
      case 'cell': {
        const cell = data as Cell
        const ship = placementState?.placedShips.find(ship =>
          ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
        )

        if (ship) {
          const shipKind = ship.id.split('_')[0]
          return `Grid cell ${cell.x}, ${cell.y}. Occupied by ${shipKind}. Double-click to rotate, right-click to remove.`
        }

        if (placementState?.preview?.cells.some(previewCell =>
          previewCell.x === cell.x && previewCell.y === cell.y
        )) {
          const isValid = placementState.preview.isValid
          return `Grid cell ${cell.x}, ${cell.y}. ${isValid ? 'Valid' : 'Invalid'} placement preview. ${
            isValid ? 'Click to place ship.' : placementState.preview.reason || 'Cannot place here.'
          }`
        }

        return `Grid cell ${cell.x}, ${cell.y}. Empty. ${
          placementState?.selectedShipKind
            ? 'Click to place selected ship.'
            : 'Select a ship from the palette first.'
        }`
      }

      case 'ship': {
        const shipKind = data as ShipKind
        const spec = SHIP_SPECS[shipKind]
        const available = placementState?.availableShips.get(shipKind) || 0
        const isSelected = placementState?.selectedShipKind === shipKind

        return `${spec.name}. ${spec.length} cells long. ${available} available. ${
          isSelected ? 'Currently selected.' : available > 0 ? 'Click to select.' : 'No ships remaining.'
        }`
      }

      case 'control': {
        const controlType = data as string
        switch (controlType) {
          case 'rotate':
            return 'Rotate ship. Keyboard shortcut: R key.'
          case 'autoplace':
            return `Auto-place remaining ships. ${progress.totalShips - progress.shipsPlaced} ships will be placed automatically.`
          case 'clear':
            return 'Clear all ships. This will remove all placed ships from the grid.'
          case 'confirm':
            return `Confirm fleet deployment. Grade ${progress.grade} with ${progress.score} points.`
          default:
            return controlType
        }
      }

      default:
        return ''
    }
  }, [placementState, progress])

  // =============================================
  // HIGH CONTRAST MODE
  // =============================================

  const toggleHighContrast = useCallback(() => {
    setAccessibilityState(prev => ({
      ...prev,
      isHighContrast: !prev.isHighContrast
    }))
  }, [])

  // =============================================
  // CLEANUP
  // =============================================

  useEffect(() => {
    return () => {
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current)
      }
    }
  }, [])

  // =============================================
  // RETURN INTERFACE
  // =============================================

  const handlers: AccessibilityHandlers = {
    announceShipSelection,
    announceShipPlacement,
    announceShipRemoval,
    announceInvalidAction,
    announceProgress,
    announceFleetComplete,
    setGridFocus,
    setPaletteFocus,
    setControlsFocus,
    getAriaLabel
  }

  return {
    accessibilityState,
    handlers,
    toggleHighContrast,
    focusedCell: accessibilityState.focusedCell,
    announcements: accessibilityState.announcements
  }
}
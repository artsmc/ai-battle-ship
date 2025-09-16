/**
 * Konva Placement Hook
 * Main hook for managing ship placement state and interactions
 *
 * Part of TASK 2: Konva.js State Machine
 * Integration with existing GameSession and Player types
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PlacementStateMachine,
  PlacementState,
  PlacementActions,
  UiMode,
  ShipKind
} from '../../lib/placement/stateMachine'
import { Cell, PlacementRules, STANDARD_RULES, STANDARD_FLEET } from '../../lib/placement'
import { Orientation } from '../../lib/game/types'

// =============================================
// HOOK INTERFACE
// =============================================

export interface PlacementProgress {
  shipsPlaced: number
  totalShips: number
  isComplete: boolean
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
}

export interface KonvaPlacementConfig {
  gameSession?: any // GameSession type from existing code
  rules?: PlacementRules
  onPlacementProgress?: (progress: PlacementProgress) => void
  onStateChange?: (state: PlacementState) => void
}

export interface PlacementHandlers {
  selectShip: (kind: ShipKind) => boolean
  handleCellClick: (cell: Cell) => boolean
  handleCellHover: (cell: Cell) => void
  handleCellLeave: () => void
  handleShipClick: (shipId: string) => boolean
  handleShipDrag: (shipId: string, newCell: Cell) => boolean
  rotateShip: (shipId?: string) => boolean
  removeShip: (shipId: string) => boolean
  autoPlace: () => void
  clearAll: () => void
  cancelAction: () => void
  confirmPlacement: () => boolean
}

// =============================================
// MAIN HOOK IMPLEMENTATION
// =============================================

export function useKonvaPlacement(config: KonvaPlacementConfig = {}) {
  const {
    gameSession,
    rules = STANDARD_RULES,
    onPlacementProgress,
    onStateChange
  } = config

  // State machine instance (initialize immediately)
  const stateMachineRef = useRef<PlacementStateMachine>()
  const [placementState, setPlacementState] = useState<PlacementState>(() => {
    // Initialize state machine synchronously for immediate state availability
    const machine = new PlacementStateMachine(rules)
    stateMachineRef.current = machine
    return machine.getState()
  })

  // Subscribe to state changes
  useEffect(() => {
    if (stateMachineRef.current) {
      const unsubscribe = stateMachineRef.current.subscribe((newState) => {
        setPlacementState(newState)
        onStateChange?.(newState)
      })

      return unsubscribe
    }
  }, [onStateChange])

  // Calculate progress information
  const progress = useMemo((): PlacementProgress => {
    if (!placementState) {
      return {
        shipsPlaced: 0,
        totalShips: 5,
        isComplete: false,
        score: 0,
        grade: 'D',
        validation: { isValid: false, errors: [], warnings: [] }
      }
    }

    const shipsPlaced = placementState.placedShips.length
    const totalShips = Array.from(Object.values(STANDARD_FLEET)).reduce((sum, count) => sum + count, 0)
    const isComplete = stateMachineRef.current?.isFleetComplete() || false

    const validation = stateMachineRef.current?.validateCurrentState() || {
      isValid: false,
      errors: []
    }

    return {
      shipsPlaced,
      totalShips,
      isComplete,
      score: placementState.placementScore,
      grade: placementState.placementGrade,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: []
      }
    }
  }, [placementState])

  // Notify progress changes
  useEffect(() => {
    onPlacementProgress?.(progress)
  }, [progress, onPlacementProgress])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handlers: PlacementHandlers = useMemo(() => ({
    selectShip: useCallback((kind: ShipKind) => {
      return stateMachineRef.current?.selectShip(kind) || false
    }, []),

    handleCellClick: useCallback((cell: Cell) => {
      const machine = stateMachineRef.current
      if (!machine) return false

      const state = machine.getState()

      switch (state.mode) {
        case 'preview':
          // Place ship at previewed position
          return machine.placeShip(cell, state.preview?.orientation)

        case 'selecting':
          // Start preview at clicked cell
          machine.previewShip(cell)
          return true

        case 'editing':
          // Move ship being edited
          if (state.editingShipId) {
            return machine.moveShip(state.editingShipId, cell)
          }
          return false

        case 'idle':
          // Check if clicking on existing ship for editing
          const shipAtCell = machine.getShipAtCell(cell)
          if (shipAtCell) {
            return machine.editShip(shipAtCell.id)
          }
          return false

        default:
          return false
      }
    }, []),

    handleCellHover: useCallback((cell: Cell) => {
      const machine = stateMachineRef.current
      if (!machine) return

      const state = machine.getState()

      if (state.mode === 'selecting' || state.mode === 'preview') {
        machine.previewShip(cell, state.preview?.orientation || 'horizontal')
      }
    }, []),

    handleCellLeave: useCallback(() => {
      const machine = stateMachineRef.current
      if (!machine) return

      const state = machine.getState()
      if (state.mode === 'preview') {
        machine.clearPreview()
      }
    }, []),

    handleShipClick: useCallback((shipId: string) => {
      return stateMachineRef.current?.editShip(shipId) || false
    }, []),

    handleShipDrag: useCallback((shipId: string, newCell: Cell) => {
      return stateMachineRef.current?.moveShip(shipId, newCell) || false
    }, []),

    rotateShip: useCallback((shipId?: string) => {
      return stateMachineRef.current?.rotateShip(shipId) || false
    }, []),

    removeShip: useCallback((shipId: string) => {
      return stateMachineRef.current?.removeShip(shipId) || false
    }, []),

    autoPlace: useCallback(() => {
      stateMachineRef.current?.autoPlaceRemaining()
    }, []),

    clearAll: useCallback(() => {
      stateMachineRef.current?.clearAllShips()
    }, []),

    cancelAction: useCallback(() => {
      stateMachineRef.current?.cancelEdit()
    }, []),

    confirmPlacement: useCallback(() => {
      const machine = stateMachineRef.current
      if (!machine) return false

      const validation = machine.validateCurrentState()
      return validation.isValid && machine.isFleetComplete()
    }, [])
  }), [])

  // =============================================
  // KEYBOARD HANDLING
  // =============================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const machine = stateMachineRef.current
      if (!machine) return

      switch (event.key.toLowerCase()) {
        case 'r':
          event.preventDefault()
          handlers.rotateShip()
          break

        case 'escape':
          event.preventDefault()
          handlers.cancelAction()
          break

        case 'delete':
        case 'backspace':
          event.preventDefault()
          const state = machine.getState()
          if (state.editingShipId) {
            handlers.removeShip(state.editingShipId)
          }
          break
      }
    }

    // Only attach keyboard listeners when component is active
    if (placementState?.mode !== 'idle' || placementState?.placedShips.length > 0) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [placementState?.mode, placementState?.placedShips.length, handlers])

  // =============================================
  // RETURN VALUES
  // =============================================

  // Provide default state if not yet initialized
  const currentState = placementState || stateMachineRef.current?.getState()

  return {
    placementState: currentState,
    progress,
    handlers,

    // Convenience state accessors
    mode: currentState?.mode || 'idle',
    selectedShip: currentState?.selectedShipKind,
    preview: currentState?.preview,
    placedShips: currentState?.placedShips || [],
    availableShips: currentState?.availableShips || new Map(),

    // State machine instance (for advanced use)
    stateMachine: stateMachineRef.current
  }
}
/**
 * Ship Selection Hook
 * Manages ship selection logic and availability tracking
 *
 * Part of TASK 2: Konva.js State Machine
 * Ship selection and availability management
 */

import { useCallback, useMemo } from 'react'
import {
  ShipKind,
  ShipSpec,
  SHIP_SPECS,
  PlacementState
} from '../../lib/placement/stateMachine'

// =============================================
// SELECTION INTERFACE
// =============================================

export interface ShipSelectionInfo {
  spec: ShipSpec
  available: number
  isSelected: boolean
  canSelect: boolean
}

export interface ShipSelectionHandlers {
  selectShip: (kind: ShipKind) => boolean
  isShipSelected: (kind: ShipKind) => boolean
  isShipAvailable: (kind: ShipKind) => boolean
  getShipInfo: (kind: ShipKind) => ShipSelectionInfo
  getAllShipInfo: () => ShipSelectionInfo[]
  getSelectedShip: () => ShipSelectionInfo | undefined
  getTotalShipsRemaining: () => number
  getTotalShipsPlaced: () => number
}

// =============================================
// HOOK IMPLEMENTATION
// =============================================

export function useShipSelection(
  placementState: PlacementState | undefined,
  onSelectShip: (kind: ShipKind) => boolean
): ShipSelectionHandlers {

  // =============================================
  // SHIP INFORMATION CALCULATORS
  // =============================================

  const getShipInfo = useCallback((kind: ShipKind): ShipSelectionInfo => {
    const spec = SHIP_SPECS[kind]
    const available = placementState?.availableShips.get(kind) || 0
    const isSelected = placementState?.selectedShipKind === kind
    const canSelect = available > 0 &&
                     (placementState?.mode === 'idle' || placementState?.mode === 'selecting')

    return {
      spec,
      available,
      isSelected,
      canSelect
    }
  }, [placementState])

  const getAllShipInfo = useCallback((): ShipSelectionInfo[] => {
    return Object.keys(SHIP_SPECS).map(kind => getShipInfo(kind as ShipKind))
  }, [getShipInfo])

  const getSelectedShip = useCallback((): ShipSelectionInfo | undefined => {
    if (!placementState?.selectedShipKind) return undefined
    return getShipInfo(placementState.selectedShipKind)
  }, [placementState?.selectedShipKind, getShipInfo])

  // =============================================
  // AVAILABILITY CHECKS
  // =============================================

  const isShipSelected = useCallback((kind: ShipKind): boolean => {
    return placementState?.selectedShipKind === kind
  }, [placementState?.selectedShipKind])

  const isShipAvailable = useCallback((kind: ShipKind): boolean => {
    return (placementState?.availableShips.get(kind) || 0) > 0
  }, [placementState?.availableShips])

  // =============================================
  // SELECTION HANDLERS
  // =============================================

  const selectShip = useCallback((kind: ShipKind): boolean => {
    // Can't select if not available
    if (!isShipAvailable(kind)) return false

    // Can't select during certain modes
    if (placementState?.mode === 'placing' || placementState?.mode === 'editing') {
      return false
    }

    return onSelectShip(kind)
  }, [isShipAvailable, placementState?.mode, onSelectShip])

  // =============================================
  // FLEET STATISTICS
  // =============================================

  const getTotalShipsRemaining = useCallback((): number => {
    if (!placementState?.availableShips) return 0
    return Array.from(placementState.availableShips.values())
      .reduce((sum, count) => sum + count, 0)
  }, [placementState?.availableShips])

  const getTotalShipsPlaced = useCallback((): number => {
    return placementState?.placedShips.length || 0
  }, [placementState?.placedShips.length])

  // =============================================
  // RETURN INTERFACE
  // =============================================

  return {
    selectShip,
    isShipSelected,
    isShipAvailable,
    getShipInfo,
    getAllShipInfo,
    getSelectedShip,
    getTotalShipsRemaining,
    getTotalShipsPlaced
  }
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook for managing ship palette visual state
 */
export function useShipPaletteState(selectionHandlers: ShipSelectionHandlers) {
  const allShipInfo = selectionHandlers.getAllShipInfo()
  const selectedShip = selectionHandlers.getSelectedShip()
  const totalRemaining = selectionHandlers.getTotalShipsRemaining()
  const totalPlaced = selectionHandlers.getTotalShipsPlaced()

  const paletteState = useMemo(() => ({
    ships: allShipInfo,
    selectedShip,
    totalRemaining,
    totalPlaced,
    hasSelection: !!selectedShip,
    hasRemainingShips: totalRemaining > 0,
    isComplete: totalRemaining === 0
  }), [allShipInfo, selectedShip, totalRemaining, totalPlaced])

  return paletteState
}

/**
 * Hook for ship selection keyboard shortcuts
 */
export function useShipSelectionKeyboard(
  selectionHandlers: ShipSelectionHandlers,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Number keys for ship selection (1-5)
    const num = parseInt(event.key)
    if (num >= 1 && num <= 5) {
      const shipKinds: ShipKind[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']
      const kind = shipKinds[num - 1]
      if (kind && selectionHandlers.isShipAvailable(kind)) {
        event.preventDefault()
        selectionHandlers.selectShip(kind)
      }
    }
  }, [enabled, selectionHandlers])

  // Attach/detach keyboard listener
  useMemo(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}
/**
 * useShipPlacementHandlers Hook
 *
 * Custom hook that provides all event handlers for ship placement:
 * - Ship placement, movement, and rotation
 * - Auto-placement and clearing operations
 * - Validation and completion handlers
 */

import { useCallback } from 'react'
import {
  GameShip,
  Coordinate,
  Orientation,
  GamePlayer
} from '@/lib/game/types'
import { PlacementStrategy, PlacementResult } from '@/lib/game/placement/AutoPlacer'
import { PlacementState, PlacementProgress } from './useShipPlacement'
import { createHistoryEntry } from '../utils/placementHelpers'

export interface UseShipPlacementHandlersProps {
  placementState: PlacementState
  setPlacementState: React.Dispatch<React.SetStateAction<PlacementState>>
  progress: PlacementProgress
  player: GamePlayer
}

export interface ShipPlacementHandlers {
  handleShipPlaced: (ship: GameShip, position: Coordinate, orientation: Orientation) => void
  handleShipMoved: (ship: GameShip, position: Coordinate, orientation: Orientation) => void
  handleShipRemoved: (shipId: string) => void
  handleShipRotated: (ship: GameShip) => void
  handleShipSelected: (ship: GameShip | null) => void
  handleAutoPlacement: (strategy: PlacementStrategy) => Promise<void>
  handleClearAll: () => void
  handleComplete: (onComplete: (player: GamePlayer) => void) => void
  handleValidationChange: (isValid: boolean) => void
}

/**
 * Custom hook for ship placement event handlers
 */
export function useShipPlacementHandlers({
  placementState,
  setPlacementState,
  progress,
  player
}: UseShipPlacementHandlersProps): ShipPlacementHandlers {
  // Ship placement handlers
  const handleShipPlaced = useCallback((ship: GameShip, position: Coordinate, orientation: Orientation) => {
    setPlacementState(prev => {
      const result = prev.board.placeShip(ship, position, orientation)

      if (result.isValid) {
        const updatedShips = prev.ships.map(s =>
          s.id === ship.id
            ? { ...s, position: { shipId: s.id, coordinates: [], orientation, startPosition: position } }
            : s
        )

        const historyEntry = createHistoryEntry('place', ship.id, position, orientation)
        prev.collisionDetector.refreshCollisionMap()

        return {
          ...prev,
          ships: updatedShips,
          selectedShip: null,
          placementHistory: [...prev.placementHistory, historyEntry]
        }
      }

      return prev
    })
  }, [setPlacementState])

  const handleShipMoved = useCallback((ship: GameShip, position: Coordinate, orientation: Orientation) => {
    setPlacementState(prev => {
      const result = prev.board.moveShip(ship.id, position, orientation, ship.size)

      if (result.isValid) {
        const updatedShips = prev.ships.map(s =>
          s.id === ship.id
            ? { ...s, position: { shipId: s.id, coordinates: [], orientation, startPosition: position } }
            : s
        )

        const historyEntry = createHistoryEntry('move', ship.id, position, orientation)
        prev.collisionDetector.refreshCollisionMap()

        return {
          ...prev,
          ships: updatedShips,
          placementHistory: [...prev.placementHistory, historyEntry]
        }
      }

      return prev
    })
  }, [setPlacementState])

  const handleShipRemoved = useCallback((shipId: string) => {
    setPlacementState(prev => {
      prev.board.removeShip(shipId)

      const updatedShips = prev.ships.map(s =>
        s.id === shipId
          ? { ...s, position: undefined }
          : s
      )

      const historyEntry = createHistoryEntry('remove', shipId)
      prev.collisionDetector.refreshCollisionMap()

      return {
        ...prev,
        ships: updatedShips,
        selectedShip: prev.selectedShip?.id === shipId ? null : prev.selectedShip,
        placementHistory: [...prev.placementHistory, historyEntry]
      }
    })
  }, [setPlacementState])

  const handleShipRotated = useCallback((ship: GameShip) => {
    if (!ship.position) return

    const newOrientation: Orientation =
      ship.position.orientation === 'horizontal' ? 'vertical' : 'horizontal'

    const result = placementState.validator.validateSinglePlacement(
      ship.id,
      ship.size,
      ship.position.startPosition,
      newOrientation
    )

    if (result.isValid) {
      handleShipMoved(ship, ship.position.startPosition, newOrientation)

      const historyEntry = createHistoryEntry('rotate', ship.id, ship.position.startPosition, newOrientation)

      setPlacementState(prev => ({
        ...prev,
        placementHistory: [...prev.placementHistory, historyEntry]
      }))
    }
  }, [placementState.validator, handleShipMoved, setPlacementState])

  const handleShipSelected = useCallback((ship: GameShip | null) => {
    setPlacementState(prev => ({
      ...prev,
      selectedShip: ship
    }))
  }, [setPlacementState])

  // Auto placement
  const handleAutoPlacement = useCallback(async (_strategy: PlacementStrategy) => {
    setPlacementState(prev => ({ ...prev, isAutoPlacing: true }))

    try {
      const unplacedShips = placementState.ships.filter(ship => !ship.position)
      const result: PlacementResult = await placementState.autoplacer.placeAllShips(unplacedShips)

      if (result.success) {
        // Apply placements
        const updatedShips = [...placementState.ships]

        for (const placement of result.placements) {
          const ship = updatedShips.find(s => s.id === placement.shipId)
          if (ship) {
            ship.position = {
              shipId: ship.id,
              coordinates: [],
              orientation: placement.orientation,
              startPosition: placement.position
            }
            placementState.board.placeShip(ship, placement.position, placement.orientation)
          }
        }

        const historyEntry = createHistoryEntry('auto_place', 'all')

        setPlacementState(prev => ({
          ...prev,
          ships: updatedShips,
          selectedShip: null,
          isAutoPlacing: false,
          placementHistory: [...prev.placementHistory, historyEntry]
        }))

        placementState.collisionDetector.refreshCollisionMap()
      }
    } catch (error) {
      console.error('Auto placement failed:', error)
    } finally {
      setPlacementState(prev => ({ ...prev, isAutoPlacing: false }))
    }
  }, [placementState, setPlacementState])

  const handleClearAll = useCallback(() => {
    setPlacementState(prev => {
      prev.board.reset()

      const clearedShips = prev.ships.map(ship => ({ ...ship, position: undefined }))
      prev.collisionDetector.refreshCollisionMap()

      return {
        ...prev,
        ships: clearedShips,
        selectedShip: null,
        placementHistory: []
      }
    })
  }, [setPlacementState])

  const handleComplete = useCallback((onComplete: (player: GamePlayer) => void) => {
    if (!progress.canProceed) return

    const updatedPlayer: GamePlayer = {
      ...player,
      board: placementState.board.getState(),
      fleet: placementState.ships,
      isReady: true
    }

    onComplete(updatedPlayer)
  }, [progress.canProceed, player, placementState])

  const handleValidationChange = useCallback((_isValid: boolean) => {
    // This could trigger UI feedback
  }, [])

  return {
    handleShipPlaced,
    handleShipMoved,
    handleShipRemoved,
    handleShipRotated,
    handleShipSelected,
    handleAutoPlacement,
    handleClearAll,
    handleComplete,
    handleValidationChange
  }
}
/**
 * useShipPlacement Hook
 *
 * Custom hook that manages all ship placement state and business logic:
 * - Placement state management
 * - Ship placement, movement, and rotation handlers
 * - Auto-placement functionality
 * - Progress calculation and validation
 * - Timer management
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { GamePlayer, GameShip } from '@/lib/game/types'
import { Board } from '@/lib/game/Board'
import { PlacementValidator, FleetValidationResult } from '@/lib/game/placement/PlacementValidator'
import { CollisionDetector } from '@/lib/game/placement/CollisionDetector'
import { AutoPlacer } from '@/lib/game/placement/AutoPlacer'
import {
  generateFleet,
  PlacementHistoryEntry,
  TutorialHint,
  generateTutorialHint,
  canCompleteFleetPlacement
} from '../utils/placementHelpers'
import { useShipPlacementHandlers, ShipPlacementHandlers } from './useShipPlacementHandlers'

// State interfaces
export interface PlacementState {
  board: Board
  ships: GameShip[]
  selectedShip: GameShip | null
  validator: PlacementValidator
  collisionDetector: CollisionDetector
  autoplacer: AutoPlacer
  isComplete: boolean
  isAutoPlacing: boolean
  placementHistory: PlacementHistoryEntry[]
}

export interface PlacementProgress {
  placedShips: number
  totalShips: number
  completionPercentage: number
  isValid: boolean
  canProceed: boolean
  validation: FleetValidationResult
}

// Hook configuration
export interface UseShipPlacementConfig {
  player: GamePlayer
  gameMode?: 'setup' | 'practice' | 'tutorial'
  showTutorialHints?: boolean
  timeLimit?: number
  onPlacementProgress: (progress: PlacementProgress) => void
}

// Hook return type
export interface UseShipPlacementReturn {
  placementState: PlacementState
  progress: PlacementProgress
  currentHint: TutorialHint | null
  timeRemaining: number | null
  handlers: ShipPlacementHandlers & {
    dismissHint: () => void
  }
}

/**
 * Custom hook for ship placement functionality
 */
export function useShipPlacement(config: UseShipPlacementConfig): UseShipPlacementReturn {
  const {
    player,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gameMode = 'setup',
    showTutorialHints = false,
    timeLimit,
    onPlacementProgress
  } = config

  // Initialize placement state
  const [placementState, setPlacementState] = useState<PlacementState>(() => {
    const board = new Board()
    const validator = new PlacementValidator(board)
    const collisionDetector = new CollisionDetector(board)
    const autoplacer = new AutoPlacer(board, validator, collisionDetector)

    // Generate initial fleet
    const ships = generateFleet(player.id)

    return {
      board,
      ships,
      selectedShip: null,
      validator,
      collisionDetector,
      autoplacer,
      isComplete: false,
      isAutoPlacing: false,
      placementHistory: []
    }
  })

  const [currentHint, setCurrentHint] = useState<TutorialHint | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(timeLimit || null)

  // Calculate current progress
  const progress = useMemo((): PlacementProgress => {
    const placedShips = placementState.ships.filter(ship => ship.position).length
    const totalShips = placementState.ships.length
    const validation = placementState.validator.validateCompleteFleet(placementState.ships)
    const canProceed = canCompleteFleetPlacement(placementState.ships, validation.isValid)

    return {
      placedShips,
      totalShips,
      completionPercentage: (placedShips / totalShips) * 100,
      isValid: validation.isValid,
      canProceed,
      validation: placementState.validator.validateFleetComposition(placementState.ships)
    }
  }, [placementState.ships, placementState.validator])

  // Timer effect
  useEffect(() => {
    if (!timeLimit || timeRemaining === null) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) return null
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLimit, timeRemaining])

  // Progress reporting
  useEffect(() => {
    onPlacementProgress(progress)
  }, [progress, onPlacementProgress])

  // Tutorial hints
  useEffect(() => {
    if (!showTutorialHints) return

    const hint = generateTutorialHint(
      progress.placedShips,
      progress.totalShips,
      progress.isValid,
      progress.canProceed
    )

    setCurrentHint(hint)
  }, [showTutorialHints, progress])

  // Get handlers from separate hook
  const shipPlacementHandlers = useShipPlacementHandlers({
    placementState,
    setPlacementState,
    progress,
    player
  })

  const dismissHint = useCallback(() => {
    setCurrentHint(null)
  }, [])

  return {
    placementState,
    progress,
    currentHint,
    timeRemaining,
    handlers: {
      ...shipPlacementHandlers,
      dismissHint
    }
  }
}
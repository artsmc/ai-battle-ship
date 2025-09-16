/**
 * Konva Ship Placement Component
 * Main orchestrator for Konva.js ship placement system
 *
 * Part of TASK 3: Konva.js Board Component
 * Complete ship placement interface with state machine integration
 */

'use client'

import React, { useCallback } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useKonvaPlacement, PlacementProgress } from '../../hooks/placement/useKonvaPlacement'
import { useShipSelection } from '../../hooks/placement/useShipSelection'
import { Cell } from '../../lib/placement'
import { KonvaPlacementBoard } from './KonvaPlacementBoard'
import { EnhancedShipPalette } from './EnhancedShipPalette'
import { EnhancedPlacementHUD } from './EnhancedPlacementHUD'

// =============================================
// COMPONENT INTERFACE
// =============================================

export interface KonvaShipPlacementProps {
  gameSession?: any // GameSession type from existing code
  onPlacementComplete?: (playerId: string) => void
  onPlacementProgress?: (progress: PlacementProgress) => void
  onReturnToStart?: () => void
  className?: string
}

// =============================================
// MAIN COMPONENT
// =============================================

export const KonvaShipPlacement: React.FC<KonvaShipPlacementProps> = React.memo(({
  gameSession,
  onPlacementComplete,
  onPlacementProgress,
  onReturnToStart,
  className = ''
}) => {
  // =============================================
  // HOOKS AND STATE
  // =============================================

  const {
    placementState,
    progress,
    handlers
  } = useKonvaPlacement({
    gameSession,
    onPlacementProgress
  })

  const selectionHandlers = useShipSelection(
    placementState,
    handlers.selectShip
  )

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handlePlacementComplete = useCallback(() => {
    if (progress.isComplete && progress.validation.isValid) {
      // Get player ID from game session or use default
      const playerId = gameSession?.players?.player1?.id || 'player1'
      onPlacementComplete?.(playerId)
    }
  }, [progress.isComplete, progress.validation.isValid, gameSession, onPlacementComplete])

  const handleCellClick = useCallback((cell: Cell) => {
    handlers.handleCellClick(cell)
  }, [handlers])

  const handleCellHover = useCallback((cell: Cell) => {
    handlers.handleCellHover(cell)
  }, [handlers])

  const handleCellLeave = useCallback(() => {
    handlers.handleCellLeave()
  }, [handlers])

  const handleShipClick = useCallback((shipId: string) => {
    handlers.handleShipClick(shipId)
  }, [handlers])

  const handleShipDrag = useCallback((shipId: string, newCell: Cell) => {
    handlers.handleShipDrag(shipId, newCell)
  }, [handlers])

  const handleShipDoubleClick = useCallback((shipId: string) => {
    handlers.rotateShip(shipId)
  }, [handlers])

  // =============================================
  // RENDER
  // =============================================

  // Debug logging
  console.log('KonvaShipPlacement render:', {
    hasPlacementState: !!placementState,
    hasGameSession: !!gameSession,
    placementMode: placementState?.mode,
    placedShipsCount: placementState?.placedShips?.length || 0
  })

  if (!placementState) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-primary rounded-lg border border-neutral-700 p-8">
        <div className="text-center">
          <div className="text-neutral-400 mb-2">Initializing placement interface...</div>
          <div className="text-sm text-neutral-500">Loading state machine and ship data</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`konva-ship-placement ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {onReturnToStart && (
            <button
              onClick={onReturnToStart}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary text-white
                       rounded-md hover:bg-surface-secondary transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">Deploy Your Fleet</h1>
            <p className="text-neutral-400">
              Position your ships strategically using the enhanced canvas interface
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced HUD */}
      <div className="mb-6">
        <EnhancedPlacementHUD
          progress={progress}
          placementState={placementState}
          onComplete={handlePlacementComplete}
          onReturnToStart={onReturnToStart}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Ship Palette */}
        <div className="lg:col-span-1">
          <EnhancedShipPalette
            availableShips={placementState.availableShips}
            selectedShip={placementState.selectedShipKind}
            onShipSelect={selectionHandlers.selectShip}
            onRotate={handlers.rotateShip}
            onAutoPlace={handlers.autoPlace}
            onClearAll={handlers.clearAll}
            onConfirmFleet={progress.isComplete ? handlePlacementComplete : undefined}
            isFleetComplete={progress.isComplete}
            canRotate={placementState.mode === 'preview' || placementState.mode === 'editing'}
            placementScore={progress.score}
            placementGrade={progress.grade}
          />
        </div>

        {/* Konva Canvas Board */}
        <div className="lg:col-span-2">
          <div className="flex justify-center">
            <KonvaPlacementBoard
              placementState={placementState}
              onCellClick={handleCellClick}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
              onShipClick={handleShipClick}
              onShipDrag={handleShipDrag}
              onShipDoubleClick={handleShipDoubleClick}
            />
          </div>

          {/* Instructions */}
          <div className="mt-4 bg-surface-secondary rounded-lg border border-neutral-700 p-4">
            <h3 className="text-white font-medium mb-2">Instructions</h3>
            <div className="text-sm text-neutral-300 space-y-1">
              <div>• Click a ship in the palette to select it</div>
              <div>• Hover over the grid to preview placement</div>
              <div>• Click to place the ship at the previewed position</div>
              <div>• Double-click placed ships to rotate them</div>
              <div>• Drag placed ships to move them</div>
              <div>• Use keyboard shortcuts: R (rotate), Esc (cancel)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {progress.shipsPlaced > 0 && (
          <span>
            {progress.shipsPlaced} of {progress.totalShips} ships placed.
            Current placement grade: {progress.grade} with score {progress.score}.
          </span>
        )}
      </div>
    </div>
  )
})

KonvaShipPlacement.displayName = 'KonvaShipPlacement'
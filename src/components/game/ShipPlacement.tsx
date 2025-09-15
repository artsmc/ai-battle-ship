'use client'

/**
 * ShipPlacement Component
 *
 * Main ship placement interface that orchestrates:
 * - Ship selector and placement grid integration
 * - Fleet management and validation
 * - Auto-placement functionality
 * - Progress tracking and completion detection
 * - Responsive layout for mobile and desktop
 * - Accessibility features and keyboard navigation
 */

import React from 'react'
import { GamePlayer } from '@/lib/game/types'
import { PlacementStrategy } from '@/lib/game/placement/AutoPlacer'
import { PlacementGrid } from './PlacementGrid'
import { ShipSelector } from './ShipSelector'
import { PlacementControls } from './PlacementControls'
import { PlacementProgressComponent } from './PlacementProgress'
import { useShipPlacement, PlacementProgress } from './hooks/useShipPlacement'

interface ShipPlacementProps {
  player: GamePlayer
  onPlacementComplete: (player: GamePlayer) => void
  onPlacementProgress: (progress: PlacementProgress) => void
  gameMode?: 'setup' | 'practice' | 'tutorial'
  allowAutoPlacement?: boolean
  showTutorialHints?: boolean
  timeLimit?: number
  className?: string
}

export const ShipPlacement: React.FC<ShipPlacementProps> = ({
  player,
  onPlacementComplete,
  onPlacementProgress,
  gameMode = 'setup',
  allowAutoPlacement = true,
  showTutorialHints = false,
  timeLimit,
  className = ''
}) => {
  // Use custom hook for all placement logic
  const {
    placementState,
    progress,
    currentHint,
    timeRemaining,
    handlers
  } = useShipPlacement({
    player,
    gameMode,
    showTutorialHints,
    timeLimit,
    onPlacementProgress
  })

  // Handle completion with callback
  const handleComplete = () => {
    handlers.handleComplete(onPlacementComplete)
  }

  // Handle auto placement
  const handleAutoPlacement = async (strategy: PlacementStrategy) => {
    await handlers.handleAutoPlacement(strategy)
  }

  return (
    <div className={`ship-placement ${className}`} data-testid="ship-placement">
      {/* Progress and Header */}
      <PlacementProgressComponent
        player={player}
        progress={progress}
        currentHint={currentHint}
        timeRemaining={timeRemaining}
        showTutorialHints={showTutorialHints}
        onDismissHint={handlers.dismissHint}
      />

      {/* Main Content */}
      <div className="placement-content">
        {/* Ship Selector */}
        <div className="selector-section">
          <ShipSelector
            ships={placementState.ships}
            selectedShip={placementState.selectedShip}
            onShipSelect={handlers.handleShipSelected}
            onShipRotate={handlers.handleShipRotated}
            onAutoPlace={allowAutoPlacement ? handleAutoPlacement : () => {}}
            onClearAll={handlers.handleClearAll}
            onResetShip={(ship) => handlers.handleShipRemoved(ship.id)}
            fleetValidation={progress.validation}
            disabled={placementState.isAutoPlacing}
            showAutoPlacement={allowAutoPlacement}
            showFleetStatus={true}
          />
        </div>

        {/* Placement Grid */}
        <div className="grid-section">
          <PlacementGrid
            board={placementState.board}
            ships={placementState.ships}
            onShipPlaced={handlers.handleShipPlaced}
            onShipMoved={handlers.handleShipMoved}
            onShipRemoved={handlers.handleShipRemoved}
            onValidationChange={handlers.handleValidationChange}
            disabled={placementState.isAutoPlacing}
            showCoordinates={gameMode === 'tutorial'}
            highlightValidPositions={!!placementState.selectedShip && !placementState.selectedShip.position}
          />
        </div>
      </div>

      {/* Footer Controls */}
      <PlacementControls
        progress={progress}
        isAutoPlacing={placementState.isAutoPlacing}
        placementHistory={placementState.placementHistory}
        onClearAll={handlers.handleClearAll}
        onComplete={handleComplete}
      />
    </div>
  )
}

ShipPlacement.displayName = 'ShipPlacement'
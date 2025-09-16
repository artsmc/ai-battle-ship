/**
 * Placement HUD Component
 * Status display and scoring for ship placement
 *
 * Part of TASK 3: Konva.js Board Component (supporting component)
 * Real-time placement feedback and scoring display
 */

'use client'

import React from 'react'
import {
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { PlacementProgress } from '../../hooks/placement/useKonvaPlacement'
import { PlacementState } from '../../lib/placement/stateMachine'

// =============================================
// COMPONENT INTERFACE
// =============================================

export interface PlacementHUDProps {
  progress: PlacementProgress
  placementState: PlacementState
  onComplete?: () => void
  className?: string
}

// =============================================
// SCORE DISPLAY COMPONENT
// =============================================

interface ScoreDisplayProps {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = React.memo(({ score, grade }) => {
  const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A': return 'text-green-400'
      case 'B': return 'text-blue-400'
      case 'C': return 'text-yellow-400'
      case 'D': return 'text-red-400'
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <TrophyIcon className="w-5 h-5 text-yellow-400" />
      <div>
        <div className="text-white font-medium">
          Placement Grade: <span className={getGradeColor(grade)}>{grade}</span>
        </div>
        <div className="text-neutral-400 text-sm">
          Score: {score}/100
        </div>
      </div>
    </div>
  )
})

ScoreDisplay.displayName = 'ScoreDisplay'

// =============================================
// PROGRESS DISPLAY COMPONENT
// =============================================

interface ProgressDisplayProps {
  shipsPlaced: number
  totalShips: number
  isComplete: boolean
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = React.memo(({
  shipsPlaced,
  totalShips,
  isComplete
}) => {
  const percentage = (shipsPlaced / totalShips) * 100

  return (
    <div className="flex items-center space-x-3">
      {isComplete ? (
        <CheckCircleIcon className="w-5 h-5 text-green-400" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-primary-400 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary-400 rounded-full" />
        </div>
      )}
      <div>
        <div className="text-white font-medium">
          Ships Placed: {shipsPlaced}/{totalShips}
        </div>
        <div className="w-32 bg-neutral-700 rounded-full h-2 mt-1">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
})

ProgressDisplay.displayName = 'ProgressDisplay'

// =============================================
// STATUS MESSAGE COMPONENT
// =============================================

interface StatusMessageProps {
  mode: PlacementState['mode']
  selectedShip?: string
  hasErrors: boolean
  errorCount: number
}

const StatusMessage: React.FC<StatusMessageProps> = React.memo(({
  mode,
  selectedShip,
  hasErrors,
  errorCount
}) => {
  const getMessage = () => {
    switch (mode) {
      case 'idle':
        return 'Select a ship from the palette to begin placement'
      case 'selecting':
        return `${selectedShip} selected - hover over grid to preview placement`
      case 'preview':
        return 'Click to place ship at previewed position'
      case 'placing':
        return 'Placing ship...'
      case 'editing':
        return 'Move ship to new position or press R to rotate'
      default:
        return 'Ready for ship placement'
    }
  }

  const getStatusIcon = () => {
    if (hasErrors) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
    }
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      {getStatusIcon()}
      <span className="text-neutral-300 text-sm">
        {getMessage()}
      </span>
      {hasErrors && (
        <span className="text-red-400 text-sm">
          ({errorCount} error{errorCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
})

StatusMessage.displayName = 'StatusMessage'

// =============================================
// MAIN HUD COMPONENT
// =============================================

export const PlacementHUD: React.FC<PlacementHUDProps> = React.memo(({
  progress,
  placementState,
  onComplete,
  className = ''
}) => {
  const hasErrors = !progress.validation.isValid
  const canComplete = progress.isComplete && progress.validation.isValid

  return (
    <div className={`placement-hud ${className}`}>
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Ship Placement</h2>
          {canComplete && onComplete && (
            <button
              onClick={onComplete}
              className="btn btn-primary btn-sm"
            >
              Confirm Fleet
            </button>
          )}
        </div>

        {/* Progress Display */}
        <ProgressDisplay
          shipsPlaced={progress.shipsPlaced}
          totalShips={progress.totalShips}
          isComplete={progress.isComplete}
        />

        {/* Score Display */}
        {progress.shipsPlaced > 0 && (
          <ScoreDisplay
            score={progress.score}
            grade={progress.grade}
          />
        )}

        {/* Status Message */}
        <StatusMessage
          mode={placementState.mode}
          selectedShip={placementState.selectedShipKind}
          hasErrors={hasErrors}
          errorCount={progress.validation.errors.length}
        />

        {/* Keyboard Shortcuts */}
        {(placementState.mode === 'preview' || placementState.mode === 'editing') && (
          <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-700">
            <div>Press <kbd className="px-1 py-0.5 bg-neutral-800 rounded">R</kbd> to rotate</div>
            <div>Press <kbd className="px-1 py-0.5 bg-neutral-800 rounded">Esc</kbd> to cancel</div>
          </div>
        )}

        {/* Validation Errors */}
        {hasErrors && (
          <div className="text-xs text-red-400 space-y-1">
            {progress.validation.errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

PlacementHUD.displayName = 'PlacementHUD'
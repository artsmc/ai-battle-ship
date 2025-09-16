/**
 * Enhanced Placement HUD Component
 * Advanced status display and scoring for ship placement
 *
 * Part of TASK 4: Ship Palette & Controls
 * Enhanced HUD with detailed metrics and visual indicators
 */

'use client'

import React from 'react'
import {
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { PlacementProgress } from '../../hooks/placement/useKonvaPlacement'
import { PlacementState } from '../../lib/placement/stateMachine'

// =============================================
// COMPONENT INTERFACE
// =============================================

export interface EnhancedPlacementHUDProps {
  progress: PlacementProgress
  placementState: PlacementState
  onComplete?: () => void
  onReturnToStart?: () => void
  className?: string
}

// =============================================
// DETAILED SCORE DISPLAY
// =============================================

interface DetailedScoreDisplayProps {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  metrics?: {
    distribution: number
    unpredictability: number
    defense: number
    efficiency: number
  }
}

const DetailedScoreDisplay: React.FC<DetailedScoreDisplayProps> = React.memo(({
  score,
  grade,
  metrics
}) => {
  const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A': return 'text-green-400'
      case 'B': return 'text-blue-400'
      case 'C': return 'text-yellow-400'
      case 'D': return 'text-red-400'
    }
  }

  const getGradeDescription = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A': return 'Excellent Strategy'
      case 'B': return 'Good Positioning'
      case 'C': return 'Average Layout'
      case 'D': return 'Needs Improvement'
    }
  }

  return (
    <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
      <div className="flex items-center space-x-3 mb-3">
        <TrophyIcon className="w-6 h-6 text-yellow-400" />
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold">Placement Quality:</span>
            <span className={`text-lg font-bold ${getGradeColor(grade)}`}>{grade}</span>
          </div>
          <div className="text-sm text-neutral-400">
            {getGradeDescription(grade)} • Score: {score}/100
          </div>
        </div>
      </div>

      {/* Detailed metrics (if available) */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center">
            <div className="text-xs text-neutral-400">Distribution</div>
            <div className="text-sm text-white font-medium">{metrics.distribution}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400">Defense</div>
            <div className="text-sm text-white font-medium">{metrics.defense}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400">Stealth</div>
            <div className="text-sm text-white font-medium">{metrics.unpredictability}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-400">Efficiency</div>
            <div className="text-sm text-white font-medium">{metrics.efficiency}%</div>
          </div>
        </div>
      )}
    </div>
  )
})

DetailedScoreDisplay.displayName = 'DetailedScoreDisplay'

// =============================================
// ADVANCED PROGRESS DISPLAY
// =============================================

interface AdvancedProgressDisplayProps {
  shipsPlaced: number
  totalShips: number
  isComplete: boolean
  currentAction?: string
}

const AdvancedProgressDisplay: React.FC<AdvancedProgressDisplayProps> = React.memo(({
  shipsPlaced,
  totalShips,
  isComplete,
  currentAction
}) => {
  const percentage = (shipsPlaced / totalShips) * 100

  return (
    <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
      <div className="flex items-center space-x-3 mb-3">
        {isComplete ? (
          <CheckCircleIcon className="w-6 h-6 text-green-400" />
        ) : (
          <ClockIcon className="w-6 h-6 text-primary-400" />
        )}
        <div>
          <div className="text-white font-semibold">
            Fleet Deployment: {shipsPlaced}/{totalShips}
          </div>
          {currentAction && (
            <div className="text-sm text-primary-400">{currentAction}</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-neutral-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  )
})

AdvancedProgressDisplay.displayName = 'AdvancedProgressDisplay'

// =============================================
// STATUS MESSAGE COMPONENT
// =============================================

interface EnhancedStatusMessageProps {
  mode: PlacementState['mode']
  selectedShip?: string
  hasErrors: boolean
  errors: string[]
  warnings?: string[]
}

const EnhancedStatusMessage: React.FC<EnhancedStatusMessageProps> = React.memo(({
  mode,
  selectedShip,
  hasErrors,
  errors,
  warnings = []
}) => {
  const getMessage = () => {
    switch (mode) {
      case 'idle':
        return 'Select a ship from the fleet command panel to begin deployment'
      case 'selecting':
        return `${selectedShip} selected - hover over the tactical grid to preview deployment`
      case 'preview':
        return 'Click to deploy ship at the previewed position'
      case 'placing':
        return 'Deploying ship to combat position...'
      case 'editing':
        return 'Repositioning ship - drag to new location or double-click to rotate'
      default:
        return 'Fleet deployment system ready'
    }
  }

  const getStatusIcon = () => {
    if (hasErrors) {
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
    }
    if (mode === 'editing' || mode === 'preview') {
      return <ChartBarIcon className="w-5 h-5 text-yellow-400" />
    }
    return <ShieldCheckIcon className="w-5 h-5 text-primary-400" />
  }

  return (
    <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
      <div className="flex items-start space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="text-white font-medium mb-1">Command Status</div>
          <div className="text-neutral-300 text-sm mb-2">
            {getMessage()}
          </div>

          {/* Error messages */}
          {hasErrors && errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-red-400 text-xs">
                  ⚠ {error}
                </div>
              ))}
            </div>
          )}

          {/* Warning messages */}
          {warnings.length > 0 && (
            <div className="space-y-1 mt-2">
              {warnings.map((warning, index) => (
                <div key={index} className="text-yellow-400 text-xs">
                  ⚡ {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

EnhancedStatusMessage.displayName = 'EnhancedStatusMessage'

// =============================================
// MAIN ENHANCED HUD COMPONENT
// =============================================

export const EnhancedPlacementHUD: React.FC<EnhancedPlacementHUDProps> = React.memo(({
  progress,
  placementState,
  onComplete,
  onReturnToStart,
  className = ''
}) => {
  const hasErrors = !progress.validation.isValid
  const canComplete = progress.isComplete && progress.validation.isValid

  const getCurrentAction = () => {
    switch (placementState.mode) {
      case 'selecting':
        return `Selecting ${placementState.selectedShipKind}...`
      case 'preview':
        return 'Previewing deployment position...'
      case 'placing':
        return 'Deploying ship...'
      case 'editing':
        return 'Repositioning ship...'
      default:
        return undefined
    }
  }

  return (
    <div className={`enhanced-placement-hud ${className}`}>
      <div className="space-y-4">
        {/* Header with action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onReturnToStart && (
              <button
                onClick={onReturnToStart}
                className="btn btn-ghost btn-sm text-neutral-400 hover:text-white"
              >
                ← Back to Menu
              </button>
            )}
            <h1 className="text-2xl font-bold text-white">Tactical Fleet Deployment</h1>
          </div>

          {canComplete && onComplete && (
            <button
              onClick={onComplete}
              className="btn btn-primary btn-lg flex items-center space-x-2 animate-pulse"
            >
              <CheckIcon className="w-5 h-5" />
              <span>Begin Battle</span>
            </button>
          )}
        </div>

        {/* Main status grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Progress display */}
          <AdvancedProgressDisplay
            shipsPlaced={progress.shipsPlaced}
            totalShips={progress.totalShips}
            isComplete={progress.isComplete}
            currentAction={getCurrentAction()}
          />

          {/* Score display (only show when ships are placed) */}
          {progress.shipsPlaced > 0 && (
            <DetailedScoreDisplay
              score={progress.score}
              grade={progress.grade}
            />
          )}
        </div>

        {/* Status message */}
        <EnhancedStatusMessage
          mode={placementState.mode}
          selectedShip={placementState.selectedShipKind}
          hasErrors={hasErrors}
          errors={progress.validation.errors}
          warnings={progress.validation.warnings}
        />
      </div>

      {/* Accessibility announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {progress.shipsPlaced > 0 && (
          <span>
            Fleet deployment: {progress.shipsPlaced} of {progress.totalShips} ships positioned.
            Current tactical assessment: Grade {progress.grade} with {progress.score} points.
            {placementState.mode === 'preview' && placementState.preview && (
              placementState.preview.isValid
                ? ` Valid deployment position at grid ${placementState.preview.origin.x}, ${placementState.preview.origin.y}`
                : ` Invalid deployment: ${placementState.preview.reason}`
            )}
          </span>
        )}
      </div>
    </div>
  )
})

EnhancedPlacementHUD.displayName = 'EnhancedPlacementHUD'
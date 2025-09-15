/**
 * PlacementProgress Component
 *
 * Displays ship placement progress and fleet status:
 * - Header with player information and timer
 * - Progress tracking with visual progress bar
 * - Tutorial hints with dismissible interface
 * - Accessibility compliance with proper ARIA labels
 */

'use client'

import React from 'react'
import { GamePlayer } from '@/lib/game/types'
import { PlacementProgress, TutorialHint } from './hooks/useShipPlacement'
import { formatTime } from './utils/placementHelpers'

interface PlacementProgressProps {
  player: GamePlayer
  progress: PlacementProgress
  currentHint: TutorialHint | null
  timeRemaining: number | null
  showTutorialHints: boolean
  onDismissHint: () => void
  className?: string
}

/**
 * Progress display component for ship placement
 */
export const PlacementProgressComponent: React.FC<PlacementProgressProps> = ({
  player,
  progress,
  currentHint,
  timeRemaining,
  showTutorialHints,
  onDismissHint,
  className = ''
}) => {
  const getProgressBarColor = (): string => {
    if (progress.canProceed) return 'var(--color-success)'
    if (progress.isValid) return 'var(--color-primary)'
    return 'var(--color-error)'
  }

  const getProgressBarAriaLabel = (): string => {
    const percentage = Math.round(progress.completionPercentage)
    const status = progress.canProceed ? 'ready for battle' :
                   progress.isValid ? 'in progress' : 'needs attention'
    return `Fleet deployment ${percentage}% complete, ${status}`
  }

  return (
    <div className={`placement-progress-container ${className}`} data-testid="placement-progress">
      {/* Header */}
      <div className="placement-header">
        <div className="header-info">
          <h2>Fleet Deployment</h2>
          <div className="player-info">
            <span className="player-name" aria-label={`Player: ${player.name}`}>
              {player.name}
            </span>
            {timeRemaining !== null && (
              <span
                className="time-remaining"
                aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
              >
                Time: {formatTime(timeRemaining)}
              </span>
            )}
          </div>
        </div>

        <div className="placement-progress">
          <div className="progress-info">
            <span
              aria-label={`${progress.placedShips} of ${progress.totalShips} ships placed`}
            >
              Ships Placed: {progress.placedShips}/{progress.totalShips}
            </span>
            <span className="progress-percentage">
              ({Math.round(progress.completionPercentage)}%)
            </span>
          </div>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={progress.completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={getProgressBarAriaLabel()}
          >
            <div
              className="progress-fill"
              style={{
                width: `${progress.completionPercentage}%`,
                backgroundColor: getProgressBarColor()
              }}
            />
          </div>
        </div>
      </div>

      {/* Tutorial Hint */}
      {currentHint && showTutorialHints && (
        <div
          className={`tutorial-hint hint-${currentHint.type}`}
          role="status"
          aria-live="polite"
          data-testid="tutorial-hint"
        >
          <div className="hint-header">
            <strong>{currentHint.title}</strong>
            <button
              type="button"
              onClick={onDismissHint}
              className="hint-dismiss"
              aria-label="Dismiss tutorial hint"
            >
              ✕
            </button>
          </div>
          <div className="hint-message">{currentHint.message}</div>
        </div>
      )}
    </div>
  )
}

PlacementProgressComponent.displayName = 'PlacementProgress'
/**
 * PlacementControls Component
 *
 * Handles all control buttons and options for ship placement:
 * - Advanced controls (undo, collapse/expand)
 * - Primary controls (clear all, complete placement)
 * - Loading state management
 * - Accessibility features
 */

'use client'

import React, { useState } from 'react'
import { PlacementProgress, PlacementHistoryEntry } from './hooks/useShipPlacement'

interface PlacementControlsProps {
  progress: PlacementProgress
  isAutoPlacing: boolean
  placementHistory: PlacementHistoryEntry[]
  onClearAll: () => void
  onComplete: () => void
  onUndo?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Controls component for ship placement interface
 */
export const PlacementControls: React.FC<PlacementControlsProps> = ({
  progress,
  isAutoPlacing,
  placementHistory,
  onClearAll,
  onComplete,
  onUndo,
  disabled = false,
  className = ''
}) => {
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)

  const canUndo = placementHistory.length > 0 && onUndo
  const canClearAll = progress.placedShips > 0 && !isAutoPlacing && !disabled
  const canComplete = progress.canProceed && !isAutoPlacing && !disabled

  return (
    <div className={`placement-footer ${className}`} data-testid="placement-controls">
      <div className="footer-controls">
        {showAdvancedControls && (
          <div className="advanced-controls">
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo || disabled}
                className="undo-button"
                aria-label="Undo last placement action"
              >
                ↶ Undo
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAdvancedControls(false)}
              className="collapse-controls"
              aria-label="Hide advanced controls"
            >
              Less Options
            </button>
          </div>
        )}

        {!showAdvancedControls && (
          <button
            type="button"
            onClick={() => setShowAdvancedControls(true)}
            className="expand-controls"
            aria-label="Show advanced controls"
          >
            More Options
          </button>
        )}
      </div>

      <div className="primary-controls">
        <button
          type="button"
          onClick={onClearAll}
          disabled={!canClearAll}
          className="clear-button"
          aria-label="Clear all placed ships"
        >
          🗑️ Clear All
        </button>

        <button
          type="button"
          onClick={onComplete}
          disabled={!canComplete}
          className="complete-button"
          aria-label={canComplete ? "Ready for battle" : "Place all ships to continue"}
        >
          {canComplete ? '⚓ Ready for Battle!' : 'Place All Ships'}
        </button>
      </div>

      {/* Loading Overlay */}
      {isAutoPlacing && (
        <div className="auto-placement-overlay" role="status" aria-live="polite">
          <div className="loading-content">
            <div className="loading-spinner" aria-hidden="true" />
            <div className="loading-message">Placing ships automatically...</div>
          </div>
        </div>
      )}
    </div>
  )
}

PlacementControls.displayName = 'PlacementControls'
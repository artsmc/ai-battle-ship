'use client'

/**
 * Ship Placement Example
 *
 * Demonstrates the complete ship placement system with:
 * - Integration with all components
 * - Error handling and validation
 * - Accessibility features
 * - Mobile responsiveness
 * - Different game modes
 */

import React, { useState, useCallback } from 'react'
import { GamePlayer } from '@/lib/game/types'
import { ShipPlacement } from './ShipPlacement'
import '../../styles/ship-placement.css'

interface ShipPlacementExampleProps {
  initialPlayer?: Partial<GamePlayer>
  gameMode?: 'setup' | 'practice' | 'tutorial'
  onComplete?: (player: GamePlayer) => void
}

interface PlacementProgress {
  placedShips: number
  totalShips: number
  completionPercentage: number
  isValid: boolean
  canProceed: boolean
}

export const ShipPlacementExample: React.FC<ShipPlacementExampleProps> = ({
  initialPlayer,
  gameMode = 'setup',
  onComplete
}) => {
  const [currentPlayer] = useState<GamePlayer>(() => ({
    id: initialPlayer?.id || 'player-1',
    name: initialPlayer?.name || 'Admiral Player',
    isAI: false,
    board: {
      width: 10,
      height: 10,
      cells: [],
      ships: new Map(),
      hits: [],
      misses: []
    },
    fleet: [],
    stats: {
      shotsTotal: 0,
      shotsHit: 0,
      shotsMissed: 0,
      accuracy: 0,
      shipsRemaining: 0,
      shipsSunk: 0,
      damageDealt: 0,
      damageTaken: 0
    },
    powerups: [],
    isReady: false,
    isActive: false,
    connectionStatus: 'connected',
    ...initialPlayer
  }))

  const [placementProgress, setPlacementProgress] = useState<PlacementProgress>({
    placedShips: 0,
    totalShips: 0,
    completionPercentage: 0,
    isValid: false,
    canProceed: false
  })

  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePlacementComplete = useCallback((player: GamePlayer) => {
    try {
      setIsCompleted(true)
      setError(null)

      // Validate final placement
      if (!player.isReady) {
        throw new Error('Player is not ready for battle')
      }

      if (player.fleet.length === 0) {
        throw new Error('No ships placed')
      }

      const unplacedShips = player.fleet.filter(ship => !ship.position)
      if (unplacedShips.length > 0) {
        throw new Error(`${unplacedShips.length} ships are not placed`)
      }

      // Fleet placement completed successfully
      // Player: ${player.name}, Ships: ${player.fleet.length}

      if (onComplete) {
        onComplete(player)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setIsCompleted(false)
    }
  }, [onComplete])

  const handlePlacementProgress = useCallback((progress: PlacementProgress) => {
    setPlacementProgress(progress)
  }, [])

  const handleReset = useCallback(() => {
    setIsCompleted(false)
    setError(null)
    setPlacementProgress({
      placedShips: 0,
      totalShips: 0,
      completionPercentage: 0,
      isValid: false,
      canProceed: false
    })
  }, [])

  if (isCompleted && !error) {
    return (
      <div className="placement-complete">
        <div className="completion-card">
          <div className="completion-header">
            <h2>🎉 Fleet Deployed Successfully!</h2>
            <p>Admiral {currentPlayer.name}, your fleet is ready for battle.</p>
          </div>

          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-label">Ships Deployed:</span>
              <span className="stat-value">{placementProgress.placedShips}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Fleet Status:</span>
              <span className="stat-value">✅ Ready</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completion:</span>
              <span className="stat-value">{Math.round(placementProgress.completionPercentage)}%</span>
            </div>
          </div>

          <div className="completion-actions">
            <button
              type="button"
              onClick={handleReset}
              className="secondary-button"
            >
              🔄 Deploy Again
            </button>
            <button
              type="button"
              onClick={() => {
                // Handle proceeding to battle
              }}
              className="primary-button"
            >
              ⚔️ Start Battle
            </button>
          </div>
        </div>

        <style jsx>{`
          .placement-complete {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
          }

          .completion-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            max-width: 400px;
            width: 100%;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .completion-header h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            font-weight: 700;
          }

          .completion-header p {
            margin: 0 0 1.5rem 0;
            opacity: 0.9;
            font-size: 1rem;
          }

          .completion-stats {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 2rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
          }

          .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .stat-label {
            font-weight: 500;
          }

          .stat-value {
            font-weight: 600;
            color: #22c55e;
          }

          .completion-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
          }

          .primary-button,
          .secondary-button {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            flex: 1;
          }

          .primary-button {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
          }

          .secondary-button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .primary-button:hover {
            background: linear-gradient(135deg, #16a34a, #15803d);
            transform: translateY(-1px);
          }

          .secondary-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }

          @media (max-width: 480px) {
            .completion-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="ship-placement-example">
      {error && (
        <div className="error-banner" role="alert">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-message">
              <strong>Placement Error:</strong> {error}
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="error-dismiss"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <ShipPlacement
        player={currentPlayer}
        onPlacementComplete={handlePlacementComplete}
        onPlacementProgress={handlePlacementProgress}
        gameMode={gameMode}
        allowAutoPlacement={true}
        showTutorialHints={gameMode === 'tutorial'}
        timeLimit={gameMode === 'practice' ? 300 : undefined} // 5 minutes for practice
        className="example-placement"
      />

      <div className="example-info">
        <div className="info-panel">
          <h3>Ship Placement Demo</h3>
          <div className="demo-stats">
            <div className="demo-stat">
              <span>Progress:</span>
              <span>{Math.round(placementProgress.completionPercentage)}%</span>
            </div>
            <div className="demo-stat">
              <span>Ships:</span>
              <span>{placementProgress.placedShips}/{placementProgress.totalShips}</span>
            </div>
            <div className="demo-stat">
              <span>Valid:</span>
              <span>{placementProgress.isValid ? '✅' : '❌'}</span>
            </div>
          </div>

          <div className="demo-features">
            <h4>Features Demonstrated:</h4>
            <ul>
              <li>✅ Drag & Drop Placement</li>
              <li>✅ Touch Support (Mobile)</li>
              <li>✅ Ship Rotation</li>
              <li>✅ Collision Detection</li>
              <li>✅ Auto Placement</li>
              <li>✅ Fleet Validation</li>
              <li>✅ Accessibility (WCAG 2.2)</li>
              <li>✅ Responsive Design</li>
            </ul>
          </div>

          <div className="demo-instructions">
            <h4>How to Use:</h4>
            <ol>
              <li>Select a ship from the fleet panel</li>
              <li>Click on the grid or drag to place</li>
              <li>Double-click ships to rotate</li>
              <li>Right-click to remove ships</li>
              <li>Use auto-placement for quick setup</li>
            </ol>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ship-placement-example {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
          color: white;
          position: relative;
        }

        .error-banner {
          position: fixed;
          top: 1rem;
          left: 1rem;
          right: 1rem;
          z-index: 10000;
          background: rgba(239, 68, 68, 0.95);
          border: 1px solid #dc2626;
          border-radius: 8px;
          padding: 1rem;
          backdrop-filter: blur(8px);
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .error-icon {
          font-size: 1.25rem;
        }

        .error-message {
          flex: 1;
        }

        .error-dismiss {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.125rem;
          padding: 0.25rem;
        }

        .example-placement {
          position: relative;
          z-index: 1;
        }

        .example-info {
          position: fixed;
          top: 1rem;
          right: 1rem;
          width: 300px;
          z-index: 100;
        }

        .info-panel {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          padding: 1rem;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .info-panel h3,
        .info-panel h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .demo-stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }

        .demo-stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .demo-features,
        .demo-instructions {
          margin-bottom: 1rem;
        }

        .demo-features ul,
        .demo-instructions ol {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .demo-features li,
        .demo-instructions li {
          margin-bottom: 0.25rem;
        }

        @media (max-width: 768px) {
          .example-info {
            position: static;
            width: auto;
            margin: 1rem;
          }

          .error-banner {
            position: relative;
            margin: 1rem;
          }
        }

        @media (max-width: 480px) {
          .info-panel {
            padding: 0.75rem;
          }

          .demo-features ul,
          .demo-instructions ol {
            padding-left: 1rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
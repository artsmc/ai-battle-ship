'use client'

/**
 * ShipSelector Component
 *
 * Fleet management and ship selection interface with:
 * - Visual ship inventory display
 * - Ship selection and deselection
 * - Fleet composition validation
 * - Placement progress tracking
 * - Ship rotation controls
 * - Auto-placement features
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  GameShip
} from '@/lib/game/types'
import { FleetValidationResult } from '@/lib/game/placement/PlacementValidator'
import { PlacementStrategy } from '@/lib/game/placement/AutoPlacer'

interface ShipSelectorProps {
  ships: GameShip[]
  selectedShip?: GameShip | null
  onShipSelect: (ship: GameShip | null) => void
  onShipRotate: (ship: GameShip) => void
  onAutoPlace: (strategy: PlacementStrategy) => void
  onClearAll: () => void
  onResetShip: (ship: GameShip) => void
  fleetValidation?: FleetValidationResult
  disabled?: boolean
  showFleetStatus?: boolean
  showAutoPlacement?: boolean
  className?: string
}

interface ShipCardProps {
  ship: GameShip
  isSelected: boolean
  isPlaced: boolean
  canPlace: boolean
  onClick: () => void
  onRotate: () => void
  onReset: () => void
  disabled: boolean
}

interface FleetStatusProps {
  validation: FleetValidationResult
  placedCount: number
  totalCount: number
}

interface AutoPlacementControlsProps {
  onAutoPlace: (strategy: PlacementStrategy) => void
  onClearAll: () => void
  disabled: boolean
}

const SHIP_TYPE_NAMES: Record<number, string> = {
  5: 'Carrier',
  4: 'Battleship',
  3: 'Cruiser',
  2: 'Destroyer'
}

const SHIP_TYPE_ICONS: Record<number, string> = {
  5: '🚢',
  4: '⚓',
  3: '🛥️',
  2: '🚤'
}

const PLACEMENT_STRATEGIES: Array<{ value: PlacementStrategy; label: string; description: string }> = [
  { value: 'random', label: 'Random', description: 'Randomly place ships' },
  { value: 'balanced', label: 'Balanced', description: 'Optimal spacing and coverage' },
  { value: 'strategic', label: 'Strategic', description: 'Defensive positioning' },
  { value: 'clustered', label: 'Clustered', description: 'Group ships together' },
  { value: 'dispersed', label: 'Dispersed', description: 'Spread ships apart' }
]

export const ShipSelector: React.FC<ShipSelectorProps> = ({
  ships,
  selectedShip,
  onShipSelect,
  onShipRotate,
  onAutoPlace,
  onClearAll,
  onResetShip,
  fleetValidation,
  disabled = false,
  showFleetStatus = true,
  showAutoPlacement = true,
  className = ''
}) => {
  // const [hoveredShip, setHoveredShip] = useState<string | null>(null)
  // const [expandedControls, setExpandedControls] = useState(false)

  // Calculate fleet statistics
  const fleetStats = useMemo(() => {
    const placedShips = ships.filter(ship => ship.position)
    const unplacedShips = ships.filter(ship => !ship.position)

    const shipsByType = ships.reduce((acc, ship) => {
      const typeName = SHIP_TYPE_NAMES[ship.size] || 'Unknown'
      if (!acc[typeName]) {
        acc[typeName] = { total: 0, placed: 0 }
      }
      acc[typeName].total++
      if (ship.position) {
        acc[typeName].placed++
      }
      return acc
    }, {} as Record<string, { total: number; placed: number }>)

    return {
      totalShips: ships.length,
      placedShips: placedShips.length,
      unplacedShips: unplacedShips.length,
      completionPercentage: (placedShips.length / ships.length) * 100,
      shipsByType
    }
  }, [ships])

  const handleShipClick = useCallback((ship: GameShip) => {
    if (disabled) return

    if (selectedShip?.id === ship.id) {
      onShipSelect(null) // Deselect if already selected
    } else {
      onShipSelect(ship)
    }
  }, [disabled, selectedShip, onShipSelect])

  const handleShipRotate = useCallback((ship: GameShip, event: React.MouseEvent) => {
    event.stopPropagation()
    if (disabled) return

    onShipRotate(ship)
  }, [disabled, onShipRotate])

  const handleShipReset = useCallback((ship: GameShip, event: React.MouseEvent) => {
    event.stopPropagation()
    if (disabled) return

    onResetShip(ship)
  }, [disabled, onResetShip])

  const canPlaceShip = useCallback((_ship: GameShip): boolean => {
    // This would be calculated based on available positions
    return !disabled
  }, [disabled])

  // Sort ships by type and placement status
  const sortedShips = useMemo(() => {
    return [...ships].sort((a, b) => {
      // First by size (largest first)
      if (a.size !== b.size) return b.size - a.size
      // Then by placement status (unplaced first)
      const aPlaced = !!a.position
      const bPlaced = !!b.position
      if (aPlaced !== bPlaced) return aPlaced ? 1 : -1
      // Finally by name
      return a.name.localeCompare(b.name)
    })
  }, [ships])

  return (
    <div className={`ship-selector ${className}`} data-testid="ship-selector">
      {/* Fleet Status */}
      {showFleetStatus && (
        <FleetStatus
          validation={fleetValidation}
          placedCount={fleetStats.placedShips}
          totalCount={fleetStats.totalShips}
        />
      )}

      {/* Ship Grid */}
      <div className="ship-grid">
        <h3 className="ship-grid-title">
          Your Fleet ({fleetStats.placedShips}/{fleetStats.totalShips})
        </h3>

        <div className="ship-cards">
          {sortedShips.map(ship => (
            <ShipCard
              key={ship.id}
              ship={ship}
              isSelected={selectedShip?.id === ship.id}
              isPlaced={!!ship.position}
              canPlace={canPlaceShip(ship)}
              onClick={() => handleShipClick(ship)}
              onRotate={(e) => handleShipRotate(ship, e)}
              onReset={(e) => handleShipReset(ship, e)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Ship Type Summary */}
        <div className="ship-type-summary">
          {Object.entries(fleetStats.shipsByType).map(([typeName, stats]) => (
            <div
              key={typeName}
              className="ship-type-stat"
              title={`${typeName}: ${stats.placed}/${stats.total} placed`}
            >
              <span className="ship-type-icon">
                {SHIP_TYPE_ICONS[ships.find(s => SHIP_TYPE_NAMES[s.size] === typeName)?.size || 2]}
              </span>
              <span className="ship-type-name">{typeName}</span>
              <span className="ship-type-count">
                {stats.placed}/{stats.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto Placement Controls */}
      {showAutoPlacement && (
        <AutoPlacementControls
          onAutoPlace={onAutoPlace}
          onClearAll={onClearAll}
          disabled={disabled}
        />
      )}

      {/* Selection Info */}
      {selectedShip && (
        <div className="selection-info" role="status" aria-live="polite">
          <div className="selection-header">
            <h4>Selected: {selectedShip.name}</h4>
            <span className="selection-details">
              Size: {selectedShip.size} •
              {selectedShip.position ? (
                <>
                  Position: {selectedShip.position.startPosition.x},{selectedShip.position.startPosition.y} •
                  Orientation: {selectedShip.position.orientation}
                </>
              ) : (
                'Not placed'
              )}
            </span>
          </div>

          {selectedShip.position && (
            <div className="selection-actions">
              <button
                type="button"
                onClick={() => onShipRotate(selectedShip)}
                disabled={disabled}
                className="rotate-button"
                aria-label="Rotate ship"
              >
                🔄 Rotate
              </button>
              <button
                type="button"
                onClick={() => onResetShip(selectedShip)}
                disabled={disabled}
                className="reset-button"
                aria-label="Remove ship from board"
              >
                ❌ Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Ship Card Component
const ShipCard: React.FC<ShipCardProps> = ({
  ship,
  isSelected,
  isPlaced,
  canPlace,
  onClick,
  onRotate,
  onReset,
  disabled
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const shipTypeName = SHIP_TYPE_NAMES[ship.size] || 'Unknown'
  const shipIcon = SHIP_TYPE_ICONS[ship.size] || '🚤'

  const cardClasses = [
    'ship-card',
    isSelected && 'selected',
    isPlaced && 'placed',
    disabled && 'disabled',
    !canPlace && 'cannot-place'
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${ship.name} - ${shipTypeName} (${ship.size} cells)${isPlaced ? ' - Placed' : ''}`}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      data-testid={`ship-card-${ship.id}`}
    >
      <div className="ship-card-header">
        <span className="ship-icon">{shipIcon}</span>
        <div className="ship-info">
          <div className="ship-name">{ship.name}</div>
          <div className="ship-type">{shipTypeName}</div>
        </div>
        <div className="ship-status">
          {isPlaced ? (
            <span className="status-placed" title="Ship is placed on board">✅</span>
          ) : (
            <span className="status-unplaced" title="Ship needs to be placed">⭕</span>
          )}
        </div>
      </div>

      <div className="ship-visual">
        <div
          className="ship-representation"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${ship.size}, 1fr)`,
            gap: '2px',
            margin: '8px 0'
          }}
        >
          {Array.from({ length: ship.size }).map((_, i) => (
            <div
              key={i}
              className="ship-segment"
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: isPlaced ? 'var(--color-ship-placed)' : 'var(--color-ship)',
                border: '1px solid var(--color-border)',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>

        {isPlaced && ship.position && (
          <div className="ship-placement-info">
            <span className="placement-coordinates">
              ({ship.position.startPosition.x},{ship.position.startPosition.y})
            </span>
            <span className="placement-orientation">
              {ship.position.orientation === 'horizontal' ? '↔️' : '↕️'}
            </span>
          </div>
        )}
      </div>

      {isPlaced && (isHovered || isSelected) && !disabled && (
        <div className="ship-card-actions">
          <button
            type="button"
            onClick={onRotate}
            className="action-button rotate"
            aria-label="Rotate ship"
            title="Rotate ship"
          >
            🔄
          </button>
          <button
            type="button"
            onClick={onReset}
            className="action-button reset"
            aria-label="Remove ship"
            title="Remove from board"
          >
            ❌
          </button>
        </div>
      )}
    </div>
  )
}

// Fleet Status Component
const FleetStatus: React.FC<FleetStatusProps> = ({
  validation,
  placedCount,
  totalCount
}) => {
  const isComplete = placedCount === totalCount
  const hasErrors = validation && !validation.isValid

  return (
    <div className="fleet-status">
      <div className="fleet-progress">
        <div className="progress-header">
          <h3>Fleet Status</h3>
          <span className="progress-text">
            {placedCount}/{totalCount} Ships Placed
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(placedCount / totalCount) * 100}%`,
              backgroundColor: hasErrors ? 'var(--color-error)' :
                              isComplete ? 'var(--color-success)' : 'var(--color-primary)'
            }}
          />
        </div>
      </div>

      {validation && (
        <div className="validation-status">
          {validation.isValid ? (
            <div className="validation-success">
              ✅ Fleet is ready for battle!
            </div>
          ) : (
            <div className="validation-errors">
              {validation.errors.map((error, index) => (
                <div key={index} className="validation-error">
                  ⚠️ {error.message}
                </div>
              ))}
              {validation.warnings.map((warning, index) => (
                <div key={index} className="validation-warning">
                  💡 {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Auto Placement Controls Component
const AutoPlacementControls: React.FC<AutoPlacementControlsProps> = ({
  onAutoPlace,
  onClearAll,
  disabled
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<PlacementStrategy>('balanced')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAutoPlace = useCallback(() => {
    onAutoPlace(selectedStrategy)
  }, [selectedStrategy, onAutoPlace])

  return (
    <div className="auto-placement-controls">
      <div className="controls-header">
        <h4>Auto Placement</h4>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-button"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="controls-content">
          <div className="strategy-selector">
            <label htmlFor="strategy-select">Strategy:</label>
            <select
              id="strategy-select"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value as PlacementStrategy)}
              disabled={disabled}
              className="strategy-select"
            >
              {PLACEMENT_STRATEGIES.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
            <div className="strategy-description">
              {PLACEMENT_STRATEGIES.find(s => s.value === selectedStrategy)?.description}
            </div>
          </div>

          <div className="control-buttons">
            <button
              type="button"
              onClick={handleAutoPlace}
              disabled={disabled}
              className="auto-place-button"
            >
              🎯 Auto Place All
            </button>
            <button
              type="button"
              onClick={onClearAll}
              disabled={disabled}
              className="clear-all-button"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
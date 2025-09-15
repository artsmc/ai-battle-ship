'use client'

/**
 * PlacementSidebar Component
 *
 * Ship placement control sidebar with ship selection, orientation controls,
 * placement progress tracking, and placement validation feedback.
 */

import React, { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GamePlayer, GameStateData, GameShip } from '../../../lib/game/types'
import { colors } from '../../../styles/tokens/colors'
import { game } from '../../../styles/tokens/game'

// =============================================
// TYPES
// =============================================

export interface PlacementSidebarProps {
  /** Current player data */
  currentPlayer: GamePlayer
  /** Game state */
  gameState: GameStateData
  /** Ship selection handler */
  onShipSelect: (shipId: string) => void
  /** Sidebar toggle handler */
  onToggle?: () => void
  /** Whether sidebar is open */
  isOpen?: boolean
  /** Auto-placement handler */
  onAutoPlace?: () => void
  /** Reset placement handler */
  onResetPlacement?: () => void
  /** Additional CSS classes */
  className?: string
  /** Enable animations */
  enableAnimations?: boolean
}

interface ShipItem {
  ship: GameShip
  isPlaced: boolean
  isSelected: boolean
  canPlace: boolean
}

interface PlacementProgress {
  totalShips: number
  placedShips: number
  remainingShips: number
  isComplete: boolean
  completionPercentage: number
}

// =============================================
// SHIP TYPE CONFIGURATIONS
// =============================================

const shipTypeConfig: Record<string, { icon: string; color: string; description: string }> = {
  destroyer: {
    icon: '🚢',
    color: game.ship.colors.destroyer,
    description: 'Fast and maneuverable',
  },
  submarine: {
    icon: '🚤',
    color: game.ship.colors.submarine,
    description: 'Stealth capabilities',
  },
  cruiser: {
    icon: '⛵',
    color: game.ship.colors.cruiser,
    description: 'Balanced offense/defense',
  },
  battleship: {
    icon: '🛥️',
    color: game.ship.colors.battleship,
    description: 'Heavy armor and firepower',
  },
  carrier: {
    icon: '🚁',
    color: game.ship.colors.carrier,
    description: 'Air support and command',
  },
}

// =============================================
// MAIN COMPONENT
// =============================================

export const PlacementSidebar: React.FC<PlacementSidebarProps> = ({
  currentPlayer,
  gameState,
  onShipSelect,
  onToggle,
  isOpen = true,
  onAutoPlace,
  onResetPlacement,
  className = '',
  enableAnimations = true,
}) => {
  // =============================================
  // STATE
  // =============================================

  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})

  // =============================================
  // DERIVED STATE
  // =============================================

  const placementProgress: PlacementProgress = useMemo(() => {
    const totalShips = currentPlayer.fleet.length
    const placedShips = currentPlayer.fleet.filter(ship => ship.position).length
    const remainingShips = totalShips - placedShips
    const completionPercentage = totalShips > 0 ? (placedShips / totalShips) * 100 : 0

    return {
      totalShips,
      placedShips,
      remainingShips,
      isComplete: remainingShips === 0,
      completionPercentage,
    }
  }, [currentPlayer.fleet])

  const shipItems: ShipItem[] = useMemo(() => {
    return currentPlayer.fleet.map(ship => ({
      ship,
      isPlaced: Boolean(ship.position),
      isSelected: ship.id === selectedShipId,
      canPlace: true, // TODO: Add validation logic
    }))
  }, [currentPlayer.fleet, selectedShipId])

  const unplacedShips = shipItems.filter(item => !item.isPlaced)
  const placedShips = shipItems.filter(item => item.isPlaced)

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleShipSelect = useCallback((shipId: string) => {
    setSelectedShipId(shipId)
    onShipSelect(shipId)
  }, [onShipSelect])

  const handleDetailsToggle = useCallback((shipId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [shipId]: !prev[shipId],
    }))
  }, [])

  const handleAutoPlace = useCallback(() => {
    onAutoPlace?.()
    setSelectedShipId(null)
  }, [onAutoPlace])

  const handleResetPlacement = useCallback(() => {
    onResetPlacement?.()
    setSelectedShipId(null)
  }, [onResetPlacement])

  // =============================================
  // RENDER HELPERS
  // =============================================

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-white">
          Ship Placement Progress
        </span>
        <span className="text-sm text-muted">
          {placementProgress.placedShips}/{placementProgress.totalShips}
        </span>
      </div>
      <div className="w-full bg-surface-tertiary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${placementProgress.completionPercentage}%` }}
        />
      </div>
      {placementProgress.isComplete && (
        <div className="text-xs text-green-400 mt-1 flex items-center">
          ✅ All ships placed! Ready for battle.
        </div>
      )}
    </div>
  )

  const renderShipItem = (item: ShipItem) => {
    const config = shipTypeConfig[item.ship.class.toLowerCase()] || shipTypeConfig.destroyer
    const isExpanded = showDetails[item.ship.id]

    return (
      <motion.div
        key={item.ship.id}
        layout
        className={`ship-item border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
          item.isSelected
            ? 'border-primary bg-primary bg-opacity-10'
            : item.isPlaced
            ? 'border-green-500 bg-green-500 bg-opacity-10'
            : item.canPlace
            ? 'border-surface-tertiary hover:border-primary hover:bg-surface-secondary'
            : 'border-red-500 bg-red-500 bg-opacity-10 cursor-not-allowed'
        }`}
        onClick={() => handleShipSelect(item.ship.id)}
        whileHover={item.canPlace ? { scale: 1.02 } : undefined}
        whileTap={item.canPlace ? { scale: 0.98 } : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{config.icon}</span>
            <div>
              <div className="font-semibold text-sm text-white">
                {item.ship.name}
              </div>
              <div className="text-xs text-muted">
                {item.ship.class} • {item.ship.size} cells
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {item.isPlaced && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDetailsToggle(item.ship.id)
              }}
              className="text-muted hover:text-white p-1"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-surface-tertiary"
            >
              <div className="text-xs text-muted mb-2">
                {config.description}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted">HP:</span>{' '}
                  <span className="text-white">{item.ship.hitPoints}</span>
                </div>
                <div>
                  <span className="text-muted">Size:</span>{' '}
                  <span className="text-white">{item.ship.size}</span>
                </div>
              </div>
              {item.ship.abilities.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-muted mb-1">Abilities:</div>
                  {item.ship.abilities.map(ability => (
                    <div key={ability.id} className="text-xs text-blue-400">
                      • {ability.name}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  const renderActionButtons = () => (
    <div className="space-y-2 pt-4 border-t border-surface-tertiary">
      <button
        onClick={handleAutoPlace}
        disabled={placementProgress.remainingShips === 0}
        className={`w-full py-2 px-4 rounded font-semibold text-sm transition-colors duration-200 ${
          placementProgress.remainingShips === 0
            ? 'bg-surface-tertiary text-muted cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-dark'
        }`}
      >
        Auto-Place Remaining Ships
      </button>
      <button
        onClick={handleResetPlacement}
        disabled={placementProgress.placedShips === 0}
        className={`w-full py-2 px-4 rounded font-semibold text-sm transition-colors duration-200 ${
          placementProgress.placedShips === 0
            ? 'bg-surface-tertiary text-muted cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        Reset All Placements
      </button>
    </div>
  )

  // =============================================
  // ANIMATION VARIANTS
  // =============================================

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 },
  }

  // =============================================
  // RENDER
  // =============================================

  const content = (
    <div
      className={`placement-sidebar ${className}`}
      style={{
        backgroundColor: colors.surface.primary,
        borderLeft: `1px solid ${colors.border.primary}`,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-surface-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Fleet Placement</h3>
          {onToggle && (
            <button
              onClick={onToggle}
              className="text-muted hover:text-white p-1"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1">
        {renderProgressBar()}

        {/* Unplaced Ships */}
        {unplacedShips.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-white mb-3 text-sm">
              Ships to Place ({unplacedShips.length})
            </h4>
            <div className="space-y-2">
              {unplacedShips.map(renderShipItem)}
            </div>
          </div>
        )}

        {/* Placed Ships */}
        {placedShips.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-white mb-3 text-sm">
              Placed Ships ({placedShips.length})
            </h4>
            <div className="space-y-2">
              {placedShips.map(renderShipItem)}
            </div>
          </div>
        )}

        {renderActionButtons()}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-surface-tertiary bg-surface-secondary">
        <div className="text-xs text-muted space-y-1">
          <div>• Click a ship to select it</div>
          <div>• Drag to place on the board</div>
          <div>• Press R or Space to rotate</div>
          <div>• Click placed ships to move them</div>
        </div>
      </div>
    </div>
  )

  if (enableAnimations) {
    return (
      <motion.div
        variants={sidebarVariants}
        initial={isOpen ? "open" : "closed"}
        animate={isOpen ? "open" : "closed"}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed right-0 top-0 bottom-0 w-80 z-30"
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} w-80`}>
      {content}
    </div>
  )
}

export default PlacementSidebar
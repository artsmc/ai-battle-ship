'use client'

/**
 * BoardLegend Component
 *
 * Visual legend for board symbols, ship types, and game state indicators.
 * Provides contextual information based on current game phase.
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GamePhaseType } from '../../../lib/game/types'
import { colors } from '../../../styles/tokens/colors'
import { game } from '../../../styles/tokens/game'

// =============================================
// TYPES
// =============================================

export interface BoardLegendProps {
  /** Current game phase */
  gamePhase: GamePhaseType
  /** Which symbols to show */
  showSymbols?: 'all' | 'ships' | 'combat' | 'placement'
  /** Display variant */
  variant?: 'compact' | 'detailed' | 'icons-only'
  /** Additional CSS classes */
  className?: string
  /** Enable animations */
  enableAnimations?: boolean
}

interface LegendItem {
  id: string
  symbol: React.ReactNode
  label: string
  description?: string
  color: string
  isActive: boolean
  category: 'ship' | 'combat' | 'board' | 'ui'
}

// =============================================
// LEGEND ITEMS DATA
// =============================================

const getLegendItems = (gamePhase: GamePhaseType): LegendItem[] => [
  // Ship Types
  {
    id: 'destroyer',
    symbol: '🚢',
    label: 'Destroyer',
    description: '2 cells • Fast & maneuverable',
    color: game.ship.colors.destroyer,
    isActive: gamePhase === 'ship_placement' || gamePhase === 'battle',
    category: 'ship',
  },
  {
    id: 'submarine',
    symbol: '🚤',
    label: 'Submarine',
    description: '3 cells • Stealth capabilities',
    color: game.ship.colors.submarine,
    isActive: gamePhase === 'ship_placement' || gamePhase === 'battle',
    category: 'ship',
  },
  {
    id: 'cruiser',
    symbol: '⛵',
    label: 'Cruiser',
    description: '3 cells • Balanced stats',
    color: game.ship.colors.cruiser,
    isActive: gamePhase === 'ship_placement' || gamePhase === 'battle',
    category: 'ship',
  },
  {
    id: 'battleship',
    symbol: '🛥️',
    label: 'Battleship',
    description: '4 cells • Heavy firepower',
    color: game.ship.colors.battleship,
    isActive: gamePhase === 'ship_placement' || gamePhase === 'battle',
    category: 'ship',
  },
  {
    id: 'carrier',
    symbol: '🚁',
    label: 'Carrier',
    description: '5 cells • Air support',
    color: game.ship.colors.carrier,
    isActive: gamePhase === 'ship_placement' || gamePhase === 'battle',
    category: 'ship',
  },

  // Combat Indicators
  {
    id: 'hit',
    symbol: <div className="w-3 h-3 bg-red-500 rounded-full" />,
    label: 'Hit',
    description: 'Successful attack',
    color: colors.status.error,
    isActive: gamePhase === 'battle' || gamePhase === 'finished',
    category: 'combat',
  },
  {
    id: 'miss',
    symbol: <div className="w-2 h-2 bg-gray-400 rounded-full" />,
    label: 'Miss',
    description: 'Attack missed',
    color: colors.text.muted,
    isActive: gamePhase === 'battle' || gamePhase === 'finished',
    category: 'combat',
  },
  {
    id: 'sunk',
    symbol: '💥',
    label: 'Sunk',
    description: 'Ship destroyed',
    color: colors.status.error,
    isActive: gamePhase === 'battle' || gamePhase === 'finished',
    category: 'combat',
  },
  {
    id: 'damage',
    symbol: <div className="w-3 h-1 bg-orange-500 rounded" />,
    label: 'Damage',
    description: 'Ship health indicator',
    color: colors.status.warning,
    isActive: gamePhase === 'battle' || gamePhase === 'finished',
    category: 'combat',
  },

  // Board Elements
  {
    id: 'water',
    symbol: <div className="w-3 h-3 bg-blue-400 rounded opacity-60" />,
    label: 'Water',
    description: 'Empty sea',
    color: colors.maritime.wave.light,
    isActive: true,
    category: 'board',
  },
  {
    id: 'fog',
    symbol: '🌫️',
    label: 'Fog of War',
    description: 'Hidden area',
    color: colors.text.muted,
    isActive: gamePhase === 'battle',
    category: 'board',
  },

  // UI Elements
  {
    id: 'valid-placement',
    symbol: <div className="w-3 h-3 border-2 border-green-500 rounded bg-green-500 bg-opacity-20" />,
    label: 'Valid Placement',
    description: 'Ship can be placed here',
    color: colors.status.success,
    isActive: gamePhase === 'ship_placement',
    category: 'ui',
  },
  {
    id: 'invalid-placement',
    symbol: <div className="w-3 h-3 border-2 border-red-500 rounded bg-red-500 bg-opacity-20" />,
    label: 'Invalid Placement',
    description: 'Ship cannot be placed here',
    color: colors.status.error,
    isActive: gamePhase === 'ship_placement',
    category: 'ui',
  },
  {
    id: 'targeting',
    symbol: '🎯',
    label: 'Target',
    description: 'Available attack target',
    color: colors.accent.DEFAULT,
    isActive: gamePhase === 'battle',
    category: 'ui',
  },
]

// =============================================
// MAIN COMPONENT
// =============================================

export const BoardLegend: React.FC<BoardLegendProps> = ({
  gamePhase,
  showSymbols = 'all',
  variant = 'detailed',
  className = '',
  enableAnimations = true,
}) => {
  // =============================================
  // FILTERED LEGEND ITEMS
  // =============================================

  const filteredItems = useMemo(() => {
    const allItems = getLegendItems(gamePhase)

    let filtered = allItems.filter(item => item.isActive)

    // Apply symbol filter
    switch (showSymbols) {
      case 'ships':
        filtered = filtered.filter(item => item.category === 'ship')
        break
      case 'combat':
        filtered = filtered.filter(item => item.category === 'combat')
        break
      case 'placement':
        filtered = filtered.filter(item =>
          item.category === 'ship' || item.category === 'ui' || item.category === 'board'
        )
        break
      case 'all':
      default:
        // Keep all filtered items
        break
    }

    return filtered
  }, [gamePhase, showSymbols])

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, LegendItem[]> = {}
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  // =============================================
  // RENDER HELPERS
  // =============================================

  const getCategoryTitle = (category: string): string => {
    switch (category) {
      case 'ship': return 'Ship Types'
      case 'combat': return 'Combat Indicators'
      case 'board': return 'Board Elements'
      case 'ui': return 'UI Indicators'
      default: return category
    }
  }

  const renderLegendItem = (item: LegendItem) => (
    <div key={item.id} className="flex items-center space-x-2 py-1">
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {item.symbol}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">
          {item.label}
        </div>
        {variant === 'detailed' && item.description && (
          <div className="text-xs text-muted">
            {item.description}
          </div>
        )}
      </div>
    </div>
  )

  const renderCategory = (category: string, items: LegendItem[]) => (
    <div key={category} className="mb-4 last:mb-0">
      {variant !== 'icons-only' && (
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          {getCategoryTitle(category)}
        </h4>
      )}
      <div className="space-y-1">
        {items.map(renderLegendItem)}
      </div>
    </div>
  )

  // =============================================
  // ANIMATION VARIANTS
  // =============================================

  const legendVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  }

  const itemVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
  }

  // =============================================
  // RENDER
  // =============================================

  if (filteredItems.length === 0) {
    return null
  }

  const content = (
    <div
      className={`board-legend ${className}`}
      style={{
        backgroundColor: colors.surface.secondary,
        border: `1px solid ${colors.border.primary}`,
        borderRadius: '8px',
        padding: variant === 'icons-only' ? '8px' : '12px',
      }}
    >
      {/* Header */}
      {variant !== 'icons-only' && (
        <div className="mb-4 pb-2 border-b border-surface-tertiary">
          <h3 className="font-semibold text-white text-sm">
            Game Legend
          </h3>
          {variant === 'detailed' && (
            <div className="text-xs text-muted mt-1">
              {gamePhase === 'ship_placement' && 'Ship placement symbols'}
              {gamePhase === 'battle' && 'Combat and targeting symbols'}
              {gamePhase === 'finished' && 'Final game state symbols'}
            </div>
          )}
        </div>
      )}

      {/* Legend Items */}
      {variant === 'compact' ? (
        <div className="space-y-1">
          {filteredItems.map(renderLegendItem)}
        </div>
      ) : variant === 'icons-only' ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-center p-2 rounded bg-surface-tertiary"
              title={`${item.label}: ${item.description || ''}`}
            >
              {item.symbol}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(itemsByCategory).map(([category, items]) =>
            renderCategory(category, items)
          )}
        </div>
      )}
    </div>
  )

  if (enableAnimations) {
    return (
      <motion.div
        variants={legendVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, staggerChildren: 0.1 }}
      >
        {enableAnimations ? (
          <motion.div variants={itemVariants}>
            {content}
          </motion.div>
        ) : (
          content
        )}
      </motion.div>
    )
  }

  return content
}

export default BoardLegend
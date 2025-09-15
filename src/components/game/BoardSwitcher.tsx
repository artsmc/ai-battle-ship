'use client'

/**
 * BoardSwitcher Component
 *
 * Mobile-friendly toggle component for switching between player and opponent boards.
 * Provides smooth transitions and context-aware UI for different game phases.
 */

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GamePhaseType } from '../../lib/game/types'
import { colors } from '../../styles/tokens/colors'
import { BoardViewMode } from './GameBoard'

// =============================================
// TYPES
// =============================================

export interface BoardSwitcherProps {
  /** Current board view mode */
  currentView: BoardViewMode
  /** Handler for view changes */
  onViewChange: (view: BoardViewMode) => void
  /** Current game phase */
  gamePhase: GamePhaseType
  /** Whether it's currently the player's turn */
  isPlayerTurn: boolean
  /** Additional CSS classes */
  className?: string
  /** Enable animations */
  enableAnimations?: boolean
}

interface BoardOption {
  id: BoardViewMode
  label: string
  description: string
  icon: React.ReactNode
  isEnabled: boolean
  isPrimary: boolean
}

// =============================================
// ICONS
// =============================================

const PlayerIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L13.09 8.26L19 9.27L15.18 12.81L16.36 18.73L12 16.18L7.64 18.73L8.82 12.81L5 9.27L10.91 8.26L12 2Z"/>
  </svg>
)

const OpponentIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4L13.5 7.5C13.1 8.4 12.2 9 11.2 9H8.8C7.8 9 6.9 8.4 6.5 7.5L5 4L-1 7V9L5 6.5L6.5 10C7 11.1 8.1 11.9 9.2 12L8.5 16H10.5L11.2 12H12.8L13.5 16H15.5L14.8 12C15.9 11.9 17 11.1 17.5 10L19 6.5L21 9Z"/>
  </svg>
)

// Dual icon kept for future use
// const DualIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
//   <svg className={className} fill="currentColor" viewBox="0 0 24 24">
//     <path d="M3 3H11V11H3V3ZM13 3H21V11H13V3ZM3 13H11V21H3V13ZM18 14L16.5 12.5L15 14L16.5 15.5L18 14ZM16.5 19L15 17.5L13.5 19L15 20.5L16.5 19ZM20.5 19L19 17.5L17.5 19L19 20.5L20.5 19Z"/>
//   </svg>
// )

// =============================================
// MAIN COMPONENT
// =============================================

export const BoardSwitcher: React.FC<BoardSwitcherProps> = ({
  currentView,
  onViewChange,
  gamePhase,
  isPlayerTurn,
  className = '',
  enableAnimations = true,
}) => {
  // =============================================
  // BOARD OPTIONS CONFIGURATION
  // =============================================

  const boardOptions: BoardOption[] = React.useMemo(() => {
    const isPlacementPhase = gamePhase === 'ship_placement'
    const isBattlePhase = gamePhase === 'battle'

    return [
      {
        id: 'player' as BoardViewMode,
        label: 'Your Fleet',
        description: isPlacementPhase ? 'Place ships' : 'Your ships',
        icon: <PlayerIcon className="w-5 h-5" />,
        isEnabled: true,
        isPrimary: isPlacementPhase || !isPlayerTurn,
      },
      {
        id: 'opponent' as BoardViewMode,
        label: 'Enemy Waters',
        description: isBattlePhase ? 'Attack target' : 'Enemy board',
        icon: <OpponentIcon className="w-5 h-5" />,
        isEnabled: isBattlePhase || gamePhase === 'finished',
        isPrimary: isBattlePhase && isPlayerTurn,
      },
    ]
  }, [gamePhase, isPlayerTurn])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleViewChange = useCallback((viewMode: BoardViewMode) => {
    const option = boardOptions.find(opt => opt.id === viewMode)
    if (option && option.isEnabled) {
      onViewChange(viewMode)
    }
  }, [boardOptions, onViewChange])

  // =============================================
  // ANIMATION VARIANTS
  // =============================================

  const switcherVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  }

  const buttonVariants = {
    inactive: {
      scale: 1,
      backgroundColor: colors.surface.secondary,
    },
    active: {
      scale: 1.02,
      backgroundColor: colors.primary.DEFAULT,
    },
    hover: {
      scale: 1.05,
    },
    tap: {
      scale: 0.98,
    },
  }

  // =============================================
  // RENDER HELPERS
  // =============================================

  const renderButton = useCallback((option: BoardOption) => {
    const isActive = currentView === option.id
    const isDisabled = !option.isEnabled

    const buttonClass = `
      flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all duration-200
      ${isActive
        ? `bg-primary text-white border-primary`
        : isDisabled
        ? `bg-surface-secondary text-muted border-surface-tertiary cursor-not-allowed opacity-50`
        : `bg-surface-secondary text-primary border-surface-tertiary hover:bg-surface-tertiary`
      }
      ${option.isPrimary && !isActive ? 'ring-2 ring-primary ring-opacity-30' : ''}
    `.trim()

    const button = (
      <button
        type="button"
        onClick={() => handleViewChange(option.id)}
        disabled={isDisabled}
        className={buttonClass}
        aria-pressed={isActive}
        aria-describedby={`${option.id}-description`}
      >
        <div className="flex-shrink-0">
          {option.icon}
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">
            {option.label}
          </div>
          <div
            id={`${option.id}-description`}
            className="text-xs opacity-80"
          >
            {option.description}
          </div>
        </div>
        {option.isPrimary && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          </div>
        )}
      </button>
    )

    if (enableAnimations) {
      return (
        <motion.div
          key={option.id}
          variants={buttonVariants}
          initial="inactive"
          animate={isActive ? "active" : "inactive"}
          whileHover={!isDisabled ? "hover" : undefined}
          whileTap={!isDisabled ? "tap" : undefined}
          layout
        >
          {button}
        </motion.div>
      )
    }

    return (
      <div key={option.id}>
        {button}
      </div>
    )
  }, [currentView, handleViewChange, enableAnimations, buttonVariants])

  // =============================================
  // RENDER
  // =============================================

  const content = (
    <div
      className={`board-switcher ${className}`}
      role="tablist"
      aria-label="Board view switcher"
    >
      <div className="grid grid-cols-2 gap-3 p-3 bg-surface-primary rounded-xl border border-surface-tertiary shadow-lg">
        {boardOptions.map(renderButton)}
      </div>

      {/* Phase indicator */}
      <div className="mt-2 text-center">
        <div className="inline-flex items-center px-3 py-1 bg-surface-secondary rounded-full text-xs">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              gamePhase === 'ship_placement'
                ? 'bg-blue-500'
                : gamePhase === 'battle'
                ? 'bg-red-500'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-muted">
            {gamePhase === 'ship_placement'
              ? 'Ship Placement Phase'
              : gamePhase === 'battle'
              ? isPlayerTurn ? 'Your Turn' : 'Opponent\'s Turn'
              : `${gamePhase.charAt(0).toUpperCase()}${gamePhase.slice(1)} Phase`
            }
          </span>
        </div>
      </div>
    </div>
  )

  if (enableAnimations) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="board-switcher"
          variants={switcherVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  return content
}

export default BoardSwitcher
'use client'

/**
 * GameStatus Component
 *
 * Displays current game status and phase information with real-time updates.
 * Shows turn information, timer, fleet status, and game phase indicators.
 */

import React, { useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GameStateData, GamePlayer } from '../../../lib/game/types'
import { colors } from '../../../styles/tokens/colors'

// =============================================
// TYPES
// =============================================

export interface GameStatusProps {
  /** Game state data */
  gameState: GameStateData
  /** Current player ID */
  currentPlayerId: string
  /** Which board view this status represents */
  viewMode?: 'player' | 'opponent' | 'both'
  /** Display style */
  variant?: 'compact' | 'detailed' | 'minimal'
  /** Show timer */
  showTimer?: boolean
  /** Show fleet status */
  showFleetStatus?: boolean
  /** Show turn indicator */
  showTurnIndicator?: boolean
  /** Additional CSS classes */
  className?: string
  /** Enable animations */
  enableAnimations?: boolean
}

interface StatusData {
  phase: string
  phaseDescription: string
  currentPlayerName: string
  isPlayerTurn: boolean
  turnNumber: number
  timeRemaining: number | null
  playerFleetStatus: FleetStatus
  opponentFleetStatus: FleetStatus
}

interface FleetStatus {
  shipsTotal: number
  shipsRemaining: number
  shipsSunk: number
  accuracy: number
  shotsTotal: number
  shotsHit: number
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getPhaseDisplayInfo = (phase: string) => {
  switch (phase) {
    case 'waiting':
      return { name: 'Waiting', description: 'Waiting for players', color: colors.text.muted }
    case 'setup':
      return { name: 'Setup', description: 'Preparing game', color: colors.primary.DEFAULT }
    case 'ship_placement':
      return { name: 'Placement', description: 'Place your ships', color: colors.status.info }
    case 'battle':
      return { name: 'Battle', description: 'Combat phase', color: colors.status.error }
    case 'finished':
      return { name: 'Finished', description: 'Game over', color: colors.text.secondary }
    default:
      return { name: phase, description: phase, color: colors.text.muted }
  }
}

// =============================================
// MAIN COMPONENT
// =============================================

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  currentPlayerId,
  viewMode = 'both',
  variant = 'detailed',
  showTimer = true,
  showFleetStatus = true,
  showTurnIndicator = true,
  className = '',
  enableAnimations = true,
}) => {
  // =============================================
  // STATE
  // =============================================

  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // =============================================
  // DERIVED STATE
  // =============================================

  const statusData: StatusData = useMemo(() => {
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId)
    const opponentPlayer = gameState.players.find(p => p.id !== currentPlayerId)
    const activePlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)

    const getFleetStatus = (player: GamePlayer | undefined): FleetStatus => {
      if (!player) {
        return {
          shipsTotal: 0,
          shipsRemaining: 0,
          shipsSunk: 0,
          accuracy: 0,
          shotsTotal: 0,
          shotsHit: 0,
        }
      }

      return {
        shipsTotal: player.fleet.length,
        shipsRemaining: player.fleet.filter(ship => !ship.damage.isSunk).length,
        shipsSunk: player.fleet.filter(ship => ship.damage.isSunk).length,
        accuracy: player.stats.accuracy,
        shotsTotal: player.stats.shotsTotal,
        shotsHit: player.stats.shotsHit,
      }
    }

    // Calculate time remaining
    let timeRemaining: number | null = null
    if (gameState.timers.turnStartTime && gameState.configuration.turnTimeLimit) {
      const elapsed = (currentTime - gameState.timers.turnStartTime.getTime()) / 1000
      timeRemaining = Math.max(0, gameState.configuration.turnTimeLimit - elapsed)
    }

    return {
      phase: gameState.phase.current,
      phaseDescription: getPhaseDisplayInfo(gameState.phase.current).description,
      currentPlayerName: activePlayer?.name || 'Unknown',
      isPlayerTurn: gameState.currentPlayerId === currentPlayerId,
      turnNumber: gameState.turnNumber,
      timeRemaining,
      playerFleetStatus: getFleetStatus(currentPlayer),
      opponentFleetStatus: getFleetStatus(opponentPlayer),
    }
  }, [gameState, currentPlayerId, currentTime])

  const phaseInfo = getPhaseDisplayInfo(statusData.phase)

  // =============================================
  // RENDER HELPERS
  // =============================================

  const renderPhaseIndicator = () => (
    <div className="flex items-center space-x-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: phaseInfo.color }}
      />
      <span className="font-semibold text-sm" style={{ color: phaseInfo.color }}>
        {phaseInfo.name}
      </span>
      {variant !== 'minimal' && (
        <span className="text-xs text-muted">
          {statusData.phaseDescription}
        </span>
      )}
    </div>
  )

  const renderTurnIndicator = () => {
    if (!showTurnIndicator || statusData.phase !== 'battle') return null

    return (
      <div className="flex items-center space-x-2">
        <div
          className={`px-2 py-1 rounded text-xs font-semibold ${
            statusData.isPlayerTurn
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          {statusData.isPlayerTurn ? 'Your Turn' : 'Opponent\'s Turn'}
        </div>
        {variant === 'detailed' && (
          <span className="text-xs text-muted">
            Turn {statusData.turnNumber}
          </span>
        )}
      </div>
    )
  }

  const renderTimer = () => {
    if (!showTimer || !statusData.timeRemaining) return null

    const isLowTime = statusData.timeRemaining < 10
    const timeColor = isLowTime ? colors.status.error : colors.text.primary

    return (
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: timeColor }}>
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>
        <span
          className={`font-mono text-sm font-semibold ${isLowTime ? 'animate-pulse' : ''}`}
          style={{ color: timeColor }}
        >
          {formatTime(Math.ceil(statusData.timeRemaining))}
        </span>
      </div>
    )
  }

  const renderFleetStatus = () => {
    if (!showFleetStatus) return null

    const getStatusToShow = () => {
      if (viewMode === 'player') return [{ label: 'Your Fleet', status: statusData.playerFleetStatus }]
      if (viewMode === 'opponent') return [{ label: 'Enemy Fleet', status: statusData.opponentFleetStatus }]
      return [
        { label: 'Your Fleet', status: statusData.playerFleetStatus },
        { label: 'Enemy Fleet', status: statusData.opponentFleetStatus },
      ]
    }

    return (
      <div className="space-y-2">
        {getStatusToShow().map(({ label, status }) => (
          <div key={label} className="text-xs">
            <div className="font-semibold text-muted mb-1">{label}</div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-green-500">⚓</span>
                <span>{status.shipsRemaining}/{status.shipsTotal}</span>
              </div>
              {status.shotsTotal > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-blue-500">🎯</span>
                  <span>{Math.round(status.accuracy)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // =============================================
  // ANIMATION VARIANTS
  // =============================================

  const statusVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  }

  // =============================================
  // RENDER
  // =============================================

  const content = (
    <div
      className={`game-status ${className}`}
      style={{
        background: colors.surface.secondary,
        border: `1px solid ${colors.border.primary}`,
        borderRadius: '8px',
        padding: variant === 'minimal' ? '8px' : '12px',
      }}
    >
      {variant === 'minimal' ? (
        <div className="flex items-center justify-between">
          {renderPhaseIndicator()}
          {renderTimer()}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {renderPhaseIndicator()}
            {renderTimer()}
          </div>
          {renderTurnIndicator()}
          {variant === 'detailed' && renderFleetStatus()}
        </div>
      )}
    </div>
  )

  if (enableAnimations) {
    return (
      <motion.div
        variants={statusVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    )
  }

  return content
}

export default GameStatus
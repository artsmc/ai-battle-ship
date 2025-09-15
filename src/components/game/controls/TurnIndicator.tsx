'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameStateData, GamePlayer } from '@/lib/game/types'

interface TurnIndicatorProps {
  gameState: GameStateData
  currentPlayer?: GamePlayer
  isPlayerTurn: boolean
  onAction?: (action: string, data?: any) => void
}

export function TurnIndicator({
  gameState,
  currentPlayer,
  isPlayerTurn,
  onAction
}: TurnIndicatorProps) {
  const activePlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)
  const opponent = gameState.players.find(p => p.id !== gameState.currentPlayerId)

  const getPlayerStatus = (player: GamePlayer) => {
    if (!player.isActive) return 'inactive'
    if (player.connectionStatus === 'disconnected') return 'disconnected'
    if (player.connectionStatus === 'reconnecting') return 'reconnecting'
    if (player.id === gameState.currentPlayerId) return 'active'
    return 'waiting'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-400 bg-green-900/20 border-green-400',
      waiting: 'text-amber-400 bg-amber-900/20 border-amber-400',
      inactive: 'text-steel-400 bg-steel-900/20 border-steel-400',
      disconnected: 'text-red-400 bg-red-900/20 border-red-400',
      reconnecting: 'text-orange-400 bg-orange-900/20 border-orange-400'
    }
    return colors[status as keyof typeof colors] || colors.inactive
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Active Turn',
      waiting: 'Waiting',
      inactive: 'Inactive',
      disconnected: 'Disconnected',
      reconnecting: 'Reconnecting'
    }
    return labels[status as keyof typeof labels] || 'Unknown'
  }

  const PlayerCard = ({ player, isCurrentTurn }: { player: GamePlayer; isCurrentTurn: boolean }) => {
    const status = getPlayerStatus(player)
    const statusColor = getStatusColor(status)
    const statusLabel = getStatusLabel(status)

    return (
      <motion.div
        className={`
          p-4 rounded-lg border transition-all duration-300
          ${isCurrentTurn
            ? 'bg-ocean-900/30 border-ocean-400 shadow-lg shadow-ocean-500/20'
            : 'bg-navy-800/50 border-steel-600'
          }
        `}
        animate={{
          scale: isCurrentTurn ? 1.02 : 1,
          borderWidth: isCurrentTurn ? 2 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${isCurrentTurn ? 'bg-ocean-400 animate-pulse' : 'bg-steel-500'}
            `} />
            <div>
              <h3 className="font-medium text-white">
                {player.name}
                {player.isAI && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded-full border border-purple-500">
                    AI {player.aiDifficulty}
                  </span>
                )}
              </h3>
              <p className="text-xs text-steel-400">
                Player {gameState.players.findIndex(p => p.id === player.id) + 1}
              </p>
            </div>
          </div>

          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
            {statusLabel}
          </div>
        </div>

        {/* Player Stats Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-steel-400">Ships:</span>
              <span className="text-white">{player.stats.shipsRemaining}/{player.fleet.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-steel-400">Hits:</span>
              <span className="text-green-300">{player.stats.shotsHit}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-steel-400">Accuracy:</span>
              <span className="text-blue-300">{player.stats.accuracy.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-steel-400">Damage:</span>
              <span className="text-orange-300">{player.stats.damageDealt}</span>
            </div>
          </div>
        </div>

        {/* Fleet Health Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-steel-400 mb-1">
            <span>Fleet Health</span>
            <span>{player.stats.shipsRemaining}/{player.fleet.length}</span>
          </div>
          <div className="w-full bg-steel-800 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full transition-all duration-500 ${
                player.stats.shipsRemaining > player.fleet.length * 0.6
                  ? 'bg-green-500'
                  : player.stats.shipsRemaining > player.fleet.length * 0.3
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: `${(player.stats.shipsRemaining / player.fleet.length) * 100}%`
              }}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Turn Counter */}
      <div className="text-center p-4 bg-gradient-to-r from-navy-800 to-ocean-800 rounded-lg border border-ocean-500">
        <div className="text-ocean-300 text-sm font-medium mb-1">Turn</div>
        <div className="text-3xl font-bold text-white">{gameState.turnNumber}</div>
        {gameState.phase.current === 'battle' && (
          <div className="text-steel-400 text-xs mt-1">
            Game in progress
          </div>
        )}
      </div>

      {/* Current Turn Indicator */}
      <AnimatePresence mode="wait">
        {activePlayer && (
          <motion.div
            key={activePlayer.id}
            className="text-center p-3 bg-ocean-900/20 border border-ocean-500 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-ocean-300 text-lg font-medium">
              {isPlayerTurn ? "Your Turn!" : `${activePlayer.name}'s Turn`}
            </div>
            {isPlayerTurn && (
              <motion.div
                className="text-green-400 text-sm mt-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Make your move
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Cards */}
      <div className="space-y-3">
        {gameState.players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentTurn={player.id === gameState.currentPlayerId}
          />
        ))}
      </div>

      {/* Turn Actions */}
      {isPlayerTurn && gameState.phase.current === 'battle' && onAction && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAction('skip_turn')}
            className="
              flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white
              rounded-lg transition-colors duration-200 text-sm font-medium
            "
          >
            Skip Turn
          </button>
          <button
            onClick={() => onAction('surrender')}
            className="
              px-3 py-2 bg-red-600 hover:bg-red-500 text-white
              rounded-lg transition-colors duration-200 text-sm font-medium
            "
          >
            Surrender
          </button>
        </div>
      )}

      {/* Game Phase Info */}
      <div className="text-xs text-steel-400 text-center p-2 bg-steel-900/30 rounded-lg border border-steel-700">
        Phase: {gameState.phase.current.replace('_', ' ').toUpperCase()}
        {gameState.phase.timeLimit && (
          <span className="ml-2">
            • Time Limit: {Math.floor(gameState.phase.timeLimit / 60000)}m
          </span>
        )}
      </div>
    </div>
  )
}
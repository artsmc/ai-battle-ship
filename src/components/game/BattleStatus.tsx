/**
 * Battle Status Component
 * Shows game status, players, and current turn information
 */

'use client'

import { ArrowLeftIcon, BoltIcon, ClockIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { GameSession } from '../../lib/game/GameOrchestrator'
import { GameStateData } from '../../lib/game/types'

interface BattleStatusProps {
  session: GameSession
  gameState: GameStateData
  currentPlayer: any
  gameStats: any
  onReturnToStart: () => void
}

export const BattleStatus: React.FC<BattleStatusProps> = ({
  session,
  gameState,
  currentPlayer,
  gameStats,
  onReturnToStart
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const player1 = session.players.player1
  const player2 = session.players.player2

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onReturnToStart}
          className="flex items-center space-x-2 px-4 py-2 bg-surface-primary text-white
                   rounded-md hover:bg-surface-secondary transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Naval Battle</h1>
          <p className="text-neutral-400">
            {session.mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {session.aiLevel && ` - ${session.aiLevel.charAt(0).toUpperCase()}${session.aiLevel.slice(1)} AI`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {/* Current Turn */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
          <BoltIcon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Turn {gameStats?.turnNumber || 0}</p>
          <p className="text-white font-medium">
            {currentPlayer?.isAI ? 'AI Thinking' : 'Your Turn'}
          </p>
        </div>

        {/* Game Time */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
          <ClockIcon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Game Time</p>
          <p className="text-white font-medium">
            {formatTime(gameStats?.timeElapsed || 0)}
          </p>
        </div>

        {/* Phase */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
          <div className="w-6 h-6 bg-green-400 rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-neutral-400">Phase</p>
          <p className="text-white font-medium capitalize">{gameState?.phase.current || 'battle'}</p>
        </div>
      </div>
    </div>
  )
}

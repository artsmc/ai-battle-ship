'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GameStateData, GamePlayer } from '@/lib/game/types'

interface TimerDisplayProps {
  gameState: GameStateData
  currentPlayer?: GamePlayer
  isPlayerTurn: boolean
  onAction?: (action: string, data?: any) => void
}

interface TimeData {
  totalGameTime: number
  currentTurnTime: number
  player1TotalTime: number
  player2TotalTime: number
  phaseTime: number
  isPaused: boolean
  isTimeWarning: boolean
  isCriticalTime: boolean
}

export function TimerDisplay({
  gameState,
  currentPlayer,
  isPlayerTurn,
  onAction
}: TimerDisplayProps) {
  const [timeData, setTimeData] = useState<TimeData>({
    totalGameTime: 0,
    currentTurnTime: 0,
    player1TotalTime: gameState.timers.player1TotalTime,
    player2TotalTime: gameState.timers.player2TotalTime,
    phaseTime: 0,
    isPaused: gameState.timers.isPaused,
    isTimeWarning: false,
    isCriticalTime: false
  })

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.timers.isPaused) {
        return
      }

      const now = new Date()
      const gameStartTime = gameState.timers.gameStartTime?.getTime() || now.getTime()
      const turnStartTime = gameState.timers.turnStartTime?.getTime() || now.getTime()
      const phaseStartTime = gameState.phase.startedAt.getTime()

      const totalGameTime = now.getTime() - gameStartTime - gameState.timers.totalPauseTime
      const currentTurnTime = now.getTime() - turnStartTime
      const phaseTime = now.getTime() - phaseStartTime

      // Calculate warning states based on time limits
      const turnTimeLimit = gameState.configuration.turnTimeLimit || 60000 // 1 minute default
      const isTimeWarning = currentTurnTime > turnTimeLimit * 0.7 // Warning at 70%
      const isCriticalTime = currentTurnTime > turnTimeLimit * 0.9 // Critical at 90%

      setTimeData({
        totalGameTime,
        currentTurnTime,
        player1TotalTime: gameState.timers.player1TotalTime,
        player2TotalTime: gameState.timers.player2TotalTime,
        phaseTime,
        isPaused: gameState.timers.isPaused,
        isTimeWarning,
        isCriticalTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.timers, gameState.configuration.turnTimeLimit, gameState.phase.startedAt])

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}:${minutes % 60}:${seconds % 60}`.replace(/\b\d\b/g, '0$&')
    }
    return `${minutes}:${seconds % 60}`.replace(/\b\d\b/g, '0$&')
  }

  const formatTimeRemaining = (elapsed: number, limit: number): string => {
    const remaining = Math.max(0, limit - elapsed)
    return formatTime(remaining)
  }

  const getTimeColor = (elapsed: number, limit: number) => {
    const percentage = elapsed / limit
    if (percentage >= 0.9) return 'text-red-400'
    if (percentage >= 0.7) return 'text-amber-400'
    return 'text-green-400'
  }

  const TimerCard = ({
    title,
    time,
    subtitle,
    color = 'text-white',
    isActive = false,
    isPulsing = false
  }: {
    title: string
    time: string
    subtitle?: string
    color?: string
    isActive?: boolean
    isPulsing?: boolean
  }) => (
    <motion.div
      className={`
        p-4 rounded-lg border transition-all duration-300
        ${isActive
          ? 'bg-ocean-900/30 border-ocean-400 shadow-lg shadow-ocean-500/20'
          : 'bg-navy-800/50 border-steel-600'
        }
      `}
      animate={{
        scale: isActive ? 1.02 : 1,
        borderWidth: isActive ? 2 : 1
      }}
    >
      <div className="text-center">
        <div className="text-steel-400 text-xs font-medium mb-1">{title}</div>
        <motion.div
          className={`text-2xl font-mono font-bold ${color}`}
          animate={isPulsing ? { scale: [1, 1.05, 1] } : {}}
          transition={isPulsing ? { duration: 1, repeat: Infinity } : {}}
        >
          {time}
        </motion.div>
        {subtitle && (
          <div className="text-steel-500 text-xs mt-1">{subtitle}</div>
        )}
      </div>
    </motion.div>
  )

  const ProgressBar = ({
    elapsed,
    limit,
    label,
    showRemaining = false
  }: {
    elapsed: number
    limit: number
    label: string
    showRemaining?: boolean
  }) => {
    const percentage = Math.min(100, (elapsed / limit) * 100)
    const color = getTimeColor(elapsed, limit)

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-steel-400">{label}</span>
          <span className={color}>
            {showRemaining ? formatTimeRemaining(elapsed, limit) : formatTime(elapsed)}
          </span>
        </div>
        <div className="w-full bg-steel-800 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full transition-all duration-500 ${
              percentage >= 90
                ? 'bg-red-500'
                : percentage >= 70
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
            animate={percentage >= 90 ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={percentage >= 90 ? { duration: 1, repeat: Infinity } : {}}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pause Indicator */}
      {timeData.isPaused && (
        <motion.div
          className="text-center p-3 bg-amber-900/20 border border-amber-500 rounded-lg"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-amber-400 font-medium">⏸️ Game Paused</div>
        </motion.div>
      )}

      {/* Current Turn Timer */}
      {gameState.phase.current === 'battle' && (
        <div className="space-y-3">
          <TimerCard
            title={isPlayerTurn ? "Your Turn" : "Opponent's Turn"}
            time={formatTime(timeData.currentTurnTime)}
            color={timeData.isCriticalTime ? 'text-red-400' : timeData.isTimeWarning ? 'text-amber-400' : 'text-ocean-300'}
            isActive={true}
            isPulsing={timeData.isCriticalTime}
          />

          {gameState.configuration.turnTimeLimit && (
            <ProgressBar
              elapsed={timeData.currentTurnTime}
              limit={gameState.configuration.turnTimeLimit}
              label="Turn Progress"
              showRemaining={true}
            />
          )}
        </div>
      )}

      {/* Main Timers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TimerCard
          title="Game Time"
          time={formatTime(timeData.totalGameTime)}
          subtitle={gameState.configuration.timeLimit ?
            `Limit: ${formatTime(gameState.configuration.timeLimit)}` :
            "No limit"
          }
        />

        <TimerCard
          title="Phase Time"
          time={formatTime(timeData.phaseTime)}
          subtitle={`${gameState.phase.current.replace('_', ' ')}`}
        />
      </div>

      {/* Player Time Tracking */}
      {gameState.players.length === 2 && (
        <div className="space-y-3">
          <div className="text-steel-400 text-sm font-medium text-center">Player Times</div>

          <div className="grid grid-cols-2 gap-3">
            <TimerCard
              title={gameState.players[0]?.name || 'Player 1'}
              time={formatTime(timeData.player1TotalTime)}
              color={gameState.currentPlayerId === gameState.players[0]?.id ? 'text-ocean-300' : 'text-steel-300'}
              isActive={gameState.currentPlayerId === gameState.players[0]?.id}
            />

            <TimerCard
              title={gameState.players[1]?.name || 'Player 2'}
              time={formatTime(timeData.player2TotalTime)}
              color={gameState.currentPlayerId === gameState.players[1]?.id ? 'text-ocean-300' : 'text-steel-300'}
              isActive={gameState.currentPlayerId === gameState.players[1]?.id}
            />
          </div>
        </div>
      )}

      {/* Game Time Limits */}
      {gameState.configuration.timeLimit && (
        <ProgressBar
          elapsed={timeData.totalGameTime}
          limit={gameState.configuration.timeLimit}
          label="Game Progress"
        />
      )}

      {/* Phase Time Limits */}
      {gameState.phase.timeLimit && (
        <ProgressBar
          elapsed={timeData.phaseTime}
          limit={gameState.phase.timeLimit}
          label="Phase Progress"
          showRemaining={true}
        />
      )}

      {/* Time Warning Actions */}
      {timeData.isCriticalTime && isPlayerTurn && onAction && (
        <motion.div
          className="p-3 bg-red-900/20 border border-red-500 rounded-lg"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="text-red-400 text-sm font-medium text-center mb-2">
            ⚠️ Time Running Out!
          </div>
          <button
            onClick={() => onAction('request_time_extension')}
            className="
              w-full px-3 py-2 bg-red-600 hover:bg-red-500 text-white
              rounded-lg transition-colors duration-200 text-sm font-medium
            "
          >
            Request Time Extension
          </button>
        </motion.div>
      )}

      {/* Pause/Resume Controls (for local games) */}
      {gameState.configuration.mode === 'local_multiplayer' && onAction && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAction(timeData.isPaused ? 'resume_game' : 'pause_game')}
            className="
              flex-1 px-3 py-2 bg-steel-600 hover:bg-steel-500 text-white
              rounded-lg transition-colors duration-200 text-sm font-medium
            "
          >
            {timeData.isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
        </div>
      )}

      {/* Timer Statistics */}
      <div className="text-xs text-steel-400 space-y-1 p-3 bg-steel-900/30 rounded-lg border border-steel-700">
        <div className="flex justify-between">
          <span>Total Turns:</span>
          <span>{gameState.turnNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Avg Turn Time:</span>
          <span>
            {gameState.turnNumber > 0
              ? formatTime((timeData.player1TotalTime + timeData.player2TotalTime) / gameState.turnNumber)
              : '0:00'
            }
          </span>
        </div>
        {timeData.isPaused && (
          <div className="flex justify-between">
            <span>Pause Time:</span>
            <span>{formatTime(gameState.timers.totalPauseTime)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
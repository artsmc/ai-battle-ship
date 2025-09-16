/**
 * Active Game Board Component
 * Main gameplay interface showing game boards and controls
 */

'use client'

import React, { useState } from 'react'
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  FlagIcon,
  ClockIcon,
  BoltIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import { GameSession, GameResult } from '../../lib/game/GameOrchestrator'
import { GameStateData, Coordinate, ValidationResult } from '../../lib/game/types'

interface ActiveGameBoardProps {
  session: GameSession
  gameState: GameStateData | null
  currentPlayer: any
  gameStats: any
  onMakeMove: (coordinate: Coordinate) => Promise<ValidationResult>
  onEndGame: () => Promise<GameResult | null>
  onPauseGame: () => boolean
  onResumeGame: () => boolean
  onPlayerReady: (playerId: string) => ValidationResult
  isGameOver: boolean
}

export const ActiveGameBoard: React.FC<ActiveGameBoardProps> = ({
  session,
  gameState,
  currentPlayer,
  gameStats,
  onMakeMove,
  onEndGame,
  onPauseGame,
  onResumeGame,
  onPlayerReady,
  isGameOver,
}) => {
  const [selectedCell, setSelectedCell] = useState<Coordinate | null>(null)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const handleCellClick = async (coordinate: Coordinate) => {
    if (isGameOver) return

    setSelectedCell(coordinate)
    const result = await onMakeMove(coordinate)

    if (result.isValid) {
      // Move was successful
      console.log('Move successful:', coordinate)
    } else {
      // Move failed, show error
      console.error('Move failed:', result.errors)
    }
  }

  const handleEndGame = async () => {
    const result = await onEndGame()
    if (result) {
      setGameResult(result)
    }
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isPaused = gameState?.status === 'PAUSED'
  const player1 = session.players.player1
  const player2 = session.players.player2

  return (
    <div className="max-w-7xl mx-auto">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
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

        <div className="flex items-center space-x-4">
          {/* Game Controls */}
          {!isGameOver && (
            <>
              <button
                onClick={isPaused ? onResumeGame : onPauseGame}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white
                         rounded-md hover:bg-yellow-700 transition-colors duration-200"
              >
                {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={handleEndGame}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white
                         rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <FlagIcon className="w-4 h-4" />
                <span>Surrender</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Game Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Player Info */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
          <h3 className="text-white font-semibold mb-3">Players</h3>
          <div className="space-y-3">
            <div className={`p-3 rounded ${currentPlayer?.id === player1.id ? 'bg-primary-900/30 border border-primary-500' : 'bg-surface-secondary'}`}>
              <p className="text-white font-medium">{player1.name}</p>
              <p className="text-sm text-neutral-400">
                {player1.isAI ? 'AI Player' : session.currentUser ? 'You' : 'Human Player'}
              </p>
            </div>
            <div className={`p-3 rounded ${currentPlayer?.id === player2.id ? 'bg-primary-900/30 border border-primary-500' : 'bg-surface-secondary'}`}>
              <p className="text-white font-medium">{player2.name}</p>
              <p className="text-sm text-neutral-400">
                {player2.isAI ? 'AI Player' : 'Player 2'}
              </p>
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
          <h3 className="text-white font-semibold mb-3">Game Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Turn:</span>
              <span className="text-white">{gameStats?.turnNumber || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Phase:</span>
              <span className="text-white capitalize">{gameState?.phase.current || 'setup'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Time:</span>
              <span className="text-white">{formatTime(gameStats?.timeElapsed || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Status:</span>
              <span className={`capitalize ${isPaused ? 'text-yellow-400' : 'text-green-400'}`}>
                {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Turn */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-4">
          <h3 className="text-white font-semibold mb-3">Current Turn</h3>
          {currentPlayer ? (
            <div className="space-y-2">
              <p className="text-white">{currentPlayer.name}</p>
              <p className="text-sm text-neutral-400">
                {currentPlayer.isAI ? 'AI is thinking...' : 'Your turn to attack!'}
              </p>
              {!currentPlayer.isAI && (
                <p className="text-xs text-blue-400">
                  Click on the opponent's grid to attack
                </p>
              )}
            </div>
          ) : (
            <p className="text-neutral-400">Waiting for game to start...</p>
          )}
        </div>
      </div>

      {/* Game Boards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Your Board */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Fleet</h3>
          <div className="aspect-square bg-navy-800 rounded-lg border-2 border-steel-600 p-4 relative">
            <div className="grid grid-cols-10 gap-1 h-full">
              {Array.from({ length: 100 }).map((_, i) => {
                const x = i % 10
                const y = Math.floor(i / 10)
                const coordinate = { x, y }

                return (
                  <div
                    key={i}
                    className="bg-ocean-600 rounded-sm border border-ocean-500 hover:bg-ocean-500
                             cursor-pointer transition-colors duration-150 relative
                             flex items-center justify-center text-xs text-white"
                    title={`${String.fromCharCode(65 + y)}${x + 1}`}
                  >
                    {/* Cell content will be populated based on ship placement */}
                    <span className="opacity-50">
                      {String.fromCharCode(65 + y)}{x + 1}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Coordinate Labels */}
            <div className="absolute -top-6 left-4 right-4 flex justify-between text-xs text-neutral-400">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="w-6 text-center">{i + 1}</span>
              ))}
            </div>
            <div className="absolute -left-6 top-4 bottom-4 flex flex-col justify-between text-xs text-neutral-400">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="h-6 flex items-center">{String.fromCharCode(65 + i)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Opponent Board */}
        <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Enemy Waters</h3>
          <div className="aspect-square bg-navy-800 rounded-lg border-2 border-steel-600 p-4 relative">
            <div className="grid grid-cols-10 gap-1 h-full">
              {Array.from({ length: 100 }).map((_, i) => {
                const x = i % 10
                const y = Math.floor(i / 10)
                const coordinate = { x, y }
                const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y

                return (
                  <button
                    key={i}
                    onClick={() => handleCellClick(coordinate)}
                    disabled={isGameOver || isPaused || currentPlayer?.isAI}
                    className={`
                      rounded-sm border transition-all duration-150 relative
                      flex items-center justify-center text-xs
                      ${isSelected
                        ? 'bg-red-600 border-red-400 ring-2 ring-red-400'
                        : 'bg-ocean-600 border-ocean-500 hover:bg-ocean-500 hover:border-ocean-400'
                      }
                      ${!currentPlayer?.isAI && !isGameOver && !isPaused
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-75'
                      }
                    `}
                    title={`Attack ${String.fromCharCode(65 + y)}${x + 1}`}
                  >
                    {/* Attack indicators will be added based on game state */}
                    <span className="opacity-30 text-white">
                      {String.fromCharCode(65 + y)}{x + 1}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Coordinate Labels */}
            <div className="absolute -top-6 left-4 right-4 flex justify-between text-xs text-neutral-400">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="w-6 text-center">{i + 1}</span>
              ))}
            </div>
            <div className="absolute -left-6 top-4 bottom-4 flex flex-col justify-between text-xs text-neutral-400">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="h-6 flex items-center">{String.fromCharCode(65 + i)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Actions */}
      <div className="mt-6 bg-surface-secondary rounded-lg border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Battle Status</h3>

        {gameState?.phase.current === 'setup' && (
          <div className="text-center">
            <p className="text-neutral-300 mb-4">Preparing for battle...</p>
            <button
              onClick={() => onPlayerReady(player1.id)}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700
                       transition-colors duration-200"
            >
              Ready for Battle
            </button>
          </div>
        )}

        {gameState?.phase.current === 'ship_placement' && (
          <div className="text-center">
            <p className="text-neutral-300 mb-4">Position your fleet on the board</p>
            <div className="space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Auto Place Ships
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Confirm Placement
              </button>
            </div>
          </div>
        )}

        {gameState?.phase.current === 'battle' && !isGameOver && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-surface-primary rounded-lg p-4">
              <BoltIcon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Turn {gameStats?.turnNumber || 0}</p>
              <p className="text-white font-medium">
                {currentPlayer?.isAI ? 'AI Thinking' : 'Your Turn'}
              </p>
            </div>
            <div className="bg-surface-primary rounded-lg p-4">
              <ClockIcon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Game Time</p>
              <p className="text-white font-medium">
                {formatTime(gameStats?.timeElapsed || 0)}
              </p>
            </div>
            <div className="bg-surface-primary rounded-lg p-4">
              <TrophyIcon className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Accuracy</p>
              <p className="text-white font-medium">
                {gameStats?.player1Stats?.accuracy || 0}%
              </p>
            </div>
          </div>
        )}

        {isGameOver && gameResult && (
          <div className="text-center bg-primary-900/20 border border-primary-500 rounded-lg p-6">
            <TrophyIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {gameResult.winnerId === player1.id ? 'Victory!' : 'Defeat'}
            </h3>
            <p className="text-neutral-300 mb-4">
              {gameResult.winnerName} wins against {gameResult.loserName}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <div>
                <p className="text-neutral-400">Duration</p>
                <p className="text-white font-medium">{formatTime(gameResult.duration)}</p>
              </div>
              <div>
                <p className="text-neutral-400">Total Moves</p>
                <p className="text-white font-medium">{gameResult.totalMoves}</p>
              </div>
              <div>
                <p className="text-neutral-400">Accuracy</p>
                <p className="text-white font-medium">{gameResult.accuracy.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-neutral-400">Result</p>
                <p className="text-white font-medium capitalize">{gameResult.reason}</p>
              </div>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = '/game'}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Play Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-neutral-600 text-white rounded-md hover:bg-neutral-700"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}

        {isPaused && (
          <div className="text-center bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
            <PauseIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-300">Game Paused</p>
            <p className="text-sm text-neutral-400">Click Resume to continue</p>
          </div>
        )}
      </div>

      {/* Phase 5 Implementation Note */}
      <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
        <h4 className="text-blue-300 font-medium mb-2">🚀 Phase 5: Local Gameplay Implementation</h4>
        <p className="text-blue-200 text-sm mb-2">
          Game orchestrator connected! The sophisticated game engine is now integrated with the UI.
        </p>
        <div className="text-xs text-blue-300 space-y-1">
          <p>✅ Game session management active</p>
          <p>✅ AI integration ready ({session.aiLevel} level)</p>
          <p>✅ User authentication integrated</p>
          <p>🔄 Full game board rendering with Konva.js (Phase 3) coming next...</p>
        </div>
      </div>
    </div>
  )
}
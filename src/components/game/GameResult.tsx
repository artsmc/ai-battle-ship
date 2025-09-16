/**
 * Game Result Component
 * Shows game completion results and statistics
 */

'use client'

import { BoltIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { GameResult as GameResultType } from '../../lib/game/GameOrchestrator'

interface GameResultProps {
  result: GameResultType
  onPlayAgain: () => void
  onMainMenu: () => void
}

export const GameResult: React.FC<GameResultProps> = ({
  result,
  onPlayAgain,
  onMainMenu
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isVictory = result.reason === 'victory'

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-8">
        {/* Victory/Defeat Header */}
        <div className={`mb-6 ${isVictory ? 'text-green-400' : 'text-red-400'}`}>
          <TrophyIcon className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">
            {isVictory ? 'Victory!' : 'Defeat'}
          </h1>
          <p className="text-lg text-neutral-300 mt-2">
            {result.winnerName} defeats {result.loserName}
          </p>
        </div>

        {/* Game Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-secondary rounded-lg p-4">
            <ClockIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">Duration</p>
            <p className="text-xl font-bold text-white">
              {formatTime(result.duration)}
            </p>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4">
            <BoltIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-400">Total Moves</p>
            <p className="text-xl font-bold text-white">
              {result.totalMoves}
            </p>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4">
            <div className="w-8 h-8 bg-green-400 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm">%</span>
            </div>
            <p className="text-sm text-neutral-400">Accuracy</p>
            <p className="text-xl font-bold text-white">
              {result.accuracy.toFixed(1)}%
            </p>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4">
            <div className="w-8 h-8 bg-purple-400 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <p className="text-sm text-neutral-400">Result</p>
            <p className="text-xl font-bold text-white capitalize">
              {result.reason}
            </p>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-surface-secondary rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Battle Summary</h3>
          <div className="text-neutral-300 space-y-2">
            <p>
              The battle lasted {formatTime(result.duration)} with {result.totalMoves} total moves.
            </p>
            <p>
              Your accuracy was {result.accuracy.toFixed(1)}%, 
              {result.accuracy >= 70 ? ' an excellent performance!' : 
               result.accuracy >= 50 ? ' a solid showing.' : 
               ' room for improvement next time.'}
            </p>
            {result.reason === 'surrender' && (
              <p className="text-yellow-400">The battle ended in surrender.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700
                     transition-colors duration-200 font-medium"
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="px-8 py-3 bg-neutral-600 text-white rounded-md hover:bg-neutral-700
                     transition-colors duration-200 font-medium"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}

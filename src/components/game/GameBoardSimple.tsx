/**
 * Simple Game Board Component
 * Basic game board for demonstrating the game interface
 */

'use client'

import React from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface GameSession {
  id: string
  mode: string
  players: Array<{
    id: string
    name: string
    isAI: boolean
  }>
}

interface GameBoardProps {
  gameSession: GameSession
  onEndGame: () => void
  onReturnToMenu: () => void
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameSession,
  onEndGame,
  onReturnToMenu,
}) => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onReturnToMenu}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary text-white
                     rounded-md hover:bg-surface-secondary transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Battle in Progress</h1>
            <p className="text-neutral-400">
              {gameSession.mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>
      </div>

      {/* Players Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {gameSession.players.map((player, index) => (
          <div
            key={player.id}
            className="bg-surface-primary rounded-lg border border-neutral-700 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {index === 0 ? 'Your Fleet' : 'Enemy Fleet'}
            </h3>
            <p className="text-neutral-300 mb-4">
              Admiral {player.name} {player.isAI && '(AI)'}
            </p>

            {/* Game Board Grid Placeholder */}
            <div className="aspect-square bg-navy-800 rounded-lg border-2 border-steel-600 p-4">
              <div className="grid grid-cols-10 gap-1 h-full">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-ocean-600 rounded-sm border border-ocean-500 hover:bg-ocean-500 cursor-pointer transition-colors duration-150"
                    title={`${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game Status */}
      <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6 text-center">
        <h2 className="text-xl font-semibold text-white mb-4">
          🔌 Integration Status
        </h2>
        <p className="text-neutral-300 mb-4">
          Ship placement system is working on test routes. Integration with main game flow in progress.
        </p>
        <div className="space-y-2 text-sm text-neutral-400">
          <p>✅ Complete game engine (15,000+ lines)</p>
          <p>✅ Ship placement system functional</p>
          <p>✅ Visual canvas system working</p>
          <p>🔄 Main game flow integration needed</p>
        </div>

        {/* Working Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <a
            href="/test-controls"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 inline-block"
          >
            Place Ships (Working)
          </a>
          <a
            href="/test-canvas"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 inline-block"
          >
            Visual Board
          </a>
          <button
            onClick={onEndGame}
            className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-700 transition-colors duration-200"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  )
}
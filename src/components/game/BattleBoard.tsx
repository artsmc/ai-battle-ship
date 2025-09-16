/**
 * Battle Board Component
 * Displays player and opponent boards for battle phase
 */

'use client'

import React, { useState } from 'react'
import { GameSession } from '../../lib/game/GameOrchestrator'
import { Coordinate, GameStateData, ValidationResult } from '../../lib/game/types'

interface BattleBoardProps {
  session: GameSession
  gameState: GameStateData
  currentPlayer: any
  onMakeMove: (coordinate: Coordinate) => Promise<ValidationResult>
}

export const BattleBoard: React.FC<BattleBoardProps> = ({
  session,
  gameState,
  currentPlayer,
  onMakeMove
}) => {
  const [selectedCell, setSelectedCell] = useState<Coordinate | null>(null)
  const [isAttacking, setIsAttacking] = useState(false)

  const handleCellClick = async (coordinate: Coordinate) => {
    if (isAttacking || !currentPlayer || currentPlayer.isAI) return

    setSelectedCell(coordinate)
    setIsAttacking(true)

    try {
      const result = await onMakeMove(coordinate)
      if (result.isValid) {
        console.log('Attack successful:', coordinate)
      } else {
        console.error('Attack failed:', result.errors)
      }
    } catch (error) {
      console.error('Attack error:', error)
    } finally {
      setIsAttacking(false)
      setSelectedCell(null)
    }
  }

  const renderGrid = (isOpponent: boolean = false) => {
    return (
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
                onClick={() => isOpponent && handleCellClick(coordinate)}
                disabled={!isOpponent || isAttacking || currentPlayer?.isAI}
                className={`
                  rounded-sm border transition-all duration-150 relative
                  flex items-center justify-center text-xs
                  ${isSelected && isOpponent
                    ? 'bg-red-600 border-red-400 ring-2 ring-red-400'
                    : 'bg-ocean-600 border-ocean-500 hover:bg-ocean-500 hover:border-ocean-400'
                  }
                  ${isOpponent && !currentPlayer?.isAI && !isAttacking
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-75'
                  }
                `}
                title={`${isOpponent ? 'Attack' : ''} ${String.fromCharCode(65 + y)}${x + 1}`}
              >
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
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Your Board */}
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Fleet</h3>
        {renderGrid(false)}
        <p className="text-sm text-neutral-400 mt-4 text-center">
          Your ships and damage taken
        </p>
      </div>

      {/* Opponent Board */}
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Enemy Waters</h3>
        {renderGrid(true)}
        <p className="text-sm text-neutral-400 mt-4 text-center">
          {currentPlayer?.isAI 
            ? 'AI is thinking...' 
            : 'Click to attack enemy positions'
          }
        </p>
      </div>
    </div>
  )
}

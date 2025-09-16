/**
 * Battle Controls Component
 * Game control buttons for pause, resume, surrender
 */

'use client'

import { FlagIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { GameStateData } from '../../lib/game/types'

interface BattleControlsProps {
  gameState: GameStateData
  onPause: () => void
  onResume: () => void
  onSurrender: () => void
}

export const BattleControls: React.FC<BattleControlsProps> = ({
  gameState,
  onPause,
  onResume,
  onSurrender
}) => {
  const isPaused = gameState?.status === 'paused'
  const isActive = gameState?.status === 'playing'

  return (
    <div className="flex justify-center space-x-4">
      {/* Pause/Resume Button */}
      {isActive && (
        <button
          onClick={isPaused ? onResume : onPause}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white
                   rounded-md hover:bg-yellow-700 transition-colors duration-200"
        >
          {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      )}

      {/* Surrender Button */}
      <button
        onClick={onSurrender}
        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white
                 rounded-md hover:bg-red-700 transition-colors duration-200"
      >
        <FlagIcon className="w-4 h-4" />
        <span>Surrender</span>
      </button>
    </div>
  )
}

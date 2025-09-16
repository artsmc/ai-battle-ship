/**
 * Game Start Screen Component
 * Interface for selecting game modes and starting new games
 */

'use client'

import React, { useState } from 'react'
import {
  ComputerDesktopIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PlayIcon,
  TrophyIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { AuthUser } from '../../lib/auth/types'
import { GameMode, AILevel } from './GameInterface'

interface GameStartScreenProps {
  user: AuthUser | null
  isGuest: boolean
  isStartingGame: boolean
  onStartGame: (mode: GameMode, aiLevel?: AILevel) => void
}

export const GameStartScreen: React.FC<GameStartScreenProps> = ({
  user,
  isGuest,
  isStartingGame,
  onStartGame,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('vs_ai')
  const [selectedAILevel, setSelectedAILevel] = useState<AILevel>('beginner')

  const gameModes = [
    {
      id: 'vs_ai' as GameMode,
      title: 'vs AI',
      description: 'Play against computer opponents with varying difficulty levels',
      icon: ComputerDesktopIcon,
      available: true,
      recommended: isGuest,
    },
    {
      id: 'local_multiplayer' as GameMode,
      title: 'Local Multiplayer',
      description: 'Play with a friend on the same device (hot-seat mode)',
      icon: UserGroupIcon,
      available: true,
      recommended: false,
    },
    {
      id: 'online_multiplayer' as GameMode,
      title: 'Online Multiplayer',
      description: 'Challenge players from around the world',
      icon: GlobeAltIcon,
      available: !!user, // Only available to registered users
      recommended: !!user,
    },
  ]

  const aiLevels = [
    {
      id: 'beginner' as AILevel,
      name: 'Beginner',
      description: 'Perfect for new players. Random targeting with basic strategy.',
      difficulty: 1,
      color: 'text-green-400',
    },
    {
      id: 'intermediate' as AILevel,
      name: 'Intermediate',
      description: 'Good for casual players. Hunt and target strategy with patterns.',
      difficulty: 2,
      color: 'text-yellow-400',
    },
    {
      id: 'advanced' as AILevel,
      name: 'Advanced',
      description: 'Challenging for experienced players. Probability-based targeting.',
      difficulty: 3,
      color: 'text-orange-400',
    },
    {
      id: 'expert' as AILevel,
      name: 'Expert',
      description: 'Maximum challenge. Game theory and machine learning algorithms.',
      difficulty: 4,
      color: 'text-red-400',
    },
  ]

  const handleStart = () => {
    onStartGame(selectedMode, selectedMode === 'vs_ai' ? selectedAILevel : undefined)
  }

  const getPlayerDisplayInfo = () => {
    if (user) {
      return {
        name: user.display_name || user.username,
        subtitle: user.is_premium ? 'Premium Player' : 'Registered Player',
        icon: user.avatar_url,
      }
    } else if (isGuest) {
      return {
        name: 'Guest Player',
        subtitle: 'Playing offline',
        icon: null,
      }
    }
    return null
  }

  const playerInfo = getPlayerDisplayInfo()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Battleship Naval Strategy
        </h1>
        <p className="text-xl text-neutral-300 mb-6">
          Choose your battle and command your fleet to victory
        </p>

        {/* Player Info */}
        {playerInfo && (
          <div className="inline-flex items-center space-x-3 bg-surface-primary rounded-lg p-4 border border-neutral-700">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              {playerInfo.icon ? (
                <img
                  src={playerInfo.icon}
                  alt={playerInfo.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">{playerInfo.name}</p>
              <p className="text-sm text-neutral-400">{playerInfo.subtitle}</p>
            </div>
          </div>
        )}
      </div>

      {/* Game Mode Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
          Select Game Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gameModes.map((mode) => {
            const Icon = mode.icon
            const isSelected = selectedMode === mode.id
            const isAvailable = mode.available

            return (
              <button
                key={mode.id}
                onClick={() => isAvailable && setSelectedMode(mode.id)}
                disabled={!isAvailable}
                className={`
                  relative p-6 rounded-lg border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-primary-500 bg-primary-900/20'
                    : isAvailable
                    ? 'border-neutral-600 bg-surface-primary hover:border-primary-400 hover:bg-primary-900/10'
                    : 'border-neutral-700 bg-neutral-800/50 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {mode.recommended && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                      Recommended
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-4">
                  <div className={`p-4 rounded-lg ${isSelected ? 'bg-primary-600' : 'bg-surface-secondary'}`}>
                    <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                  </div>
                  <div className="text-center">
                    <h3 className={`text-lg font-semibold mb-2 ${isAvailable ? 'text-white' : 'text-neutral-500'}`}>
                      {mode.title}
                    </h3>
                    <p className={`text-sm ${isAvailable ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {mode.description}
                    </p>
                  </div>
                </div>

                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <span className="text-sm text-neutral-400">
                      {mode.id === 'online_multiplayer' ? 'Sign in required' : 'Coming soon'}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* AI Difficulty Selection */}
      {selectedMode === 'vs_ai' && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            Select AI Difficulty
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiLevels.map((level) => {
              const isSelected = selectedAILevel === level.id

              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedAILevel(level.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-primary-500 bg-primary-900/20'
                      : 'border-neutral-600 bg-surface-primary hover:border-primary-400'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{level.name}</h4>
                    <div className="flex space-x-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < level.difficulty ? level.color : 'bg-neutral-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300">{level.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Start Game Button */}
      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={isStartingGame}
          className="inline-flex items-center space-x-3 px-8 py-4 bg-primary-600 text-white
                     rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 font-semibold text-lg
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <PlayIcon className="w-6 h-6" />
          <span>{isStartingGame ? 'Starting Game...' : 'Start Battle'}</span>
        </button>

        {/* Quick Stats */}
        {user && (
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-neutral-400">
            <div className="flex items-center space-x-1">
              <ChartBarIcon className="w-4 h-4" />
              <span>Rating: {user.created_at ? '1200' : 'New'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrophyIcon className="w-4 h-4" />
              <span>Games: {user.created_at ? '0' : 'First game'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tips for Guests */}
      {isGuest && (
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <h3 className="text-blue-300 font-medium mb-2">💡 Playing as Guest</h3>
          <p className="text-blue-200 text-sm mb-3">
            You're playing in guest mode. Your progress will be saved locally, but won't sync across devices.
          </p>
          <p className="text-blue-200 text-sm">
            <strong>Create an account</strong> to unlock online multiplayer, save your progress, and compete on leaderboards!
          </p>
        </div>
      )}
    </div>
  )
}
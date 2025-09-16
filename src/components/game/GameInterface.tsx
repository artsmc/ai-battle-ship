/**
 * Game Interface Component
 * Main game interface that handles game start, setup, and gameplay
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { GameStartScreen } from './GameStartScreen'
import { GameBoard } from './GameBoardSimple'
import { LoadingState } from '../ui/LoadingState'

export type GameMode = 'vs_ai' | 'local_multiplayer' | 'online_multiplayer'
export type AILevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

interface GameSession {
  id: string
  mode: GameMode
  aiLevel?: AILevel
  players: Array<{
    id: string
    name: string
    isAI: boolean
  }>
}

export const GameInterface: React.FC = () => {
  const { user, isAuthenticated, isGuest, isLoading } = useAuth()
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [isStartingGame, setIsStartingGame] = useState(false)

  const handleStartGame = async (mode: GameMode, aiLevel?: AILevel) => {
    try {
      setIsStartingGame(true)

      // Create game session
      const session: GameSession = {
        id: `game_${Date.now()}`,
        mode,
        aiLevel,
        players: []
      }

      // Add current player
      if (isAuthenticated && user) {
        session.players.push({
          id: user.id,
          name: user.display_name || user.username,
          isAI: false
        })
      } else if (isGuest) {
        session.players.push({
          id: 'guest_player',
          name: 'Guest Player',
          isAI: false
        })
      }

      // Add AI opponent or second player based on mode
      if (mode === 'vs_ai') {
        session.players.push({
          id: `ai_${aiLevel}`,
          name: `AI (${aiLevel?.charAt(0).toUpperCase()}${aiLevel?.slice(1)})`,
          isAI: true
        })
      } else if (mode === 'local_multiplayer') {
        session.players.push({
          id: 'player_2',
          name: 'Player 2',
          isAI: false
        })
      }

      setGameSession(session)
    } catch (error) {
      console.error('Failed to start game:', error)
    } finally {
      setIsStartingGame(false)
    }
  }

  const handleEndGame = () => {
    setGameSession(null)
  }

  const handleReturnToMenu = () => {
    setGameSession(null)
  }

  if (isLoading) {
    return <LoadingState message="Loading game..." />
  }

  if (!gameSession) {
    return (
      <GameStartScreen
        user={isAuthenticated ? user : null}
        isGuest={isGuest}
        isStartingGame={isStartingGame}
        onStartGame={handleStartGame}
      />
    )
  }

  return (
    <GameBoard
      gameSession={gameSession}
      onEndGame={handleEndGame}
      onReturnToMenu={handleReturnToMenu}
    />
  )
}
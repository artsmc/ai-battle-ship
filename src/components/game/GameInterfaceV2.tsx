/**
 * Game Interface V2 Component
 * Full game interface integrated with the sophisticated game engine
 */

'use client'

import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { useGameSession } from '../../hooks/useGameSession'
import { GameStartScreen } from './GameStartScreen'
import { ActiveGameBoard } from './ActiveGameBoard'
import { LoadingState } from '../ui/LoadingState'
import ErrorState from '../ui/ErrorState'

export type GameMode = 'vs_ai' | 'local_multiplayer' | 'online_multiplayer'
export type AILevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export const GameInterfaceV2: React.FC = () => {
  const { user, isAuthenticated, isGuest, isLoading: authLoading } = useAuth()
  const {
    currentSession,
    gameState,
    isGameActive,
    isGameOver,
    startAIGame,
    startLocalMultiplayerGame,
    makeMove,
    endGame,
    pauseGame,
    resumeGame,
    setPlayerReady,
    getCurrentPlayer,
    getGameStats,
    isLoading: gameLoading,
    error: gameError,
  } = useGameSession()

  const [startingGame, setStartingGame] = useState(false)

  const handleStartGame = async (mode: GameMode, aiLevel?: AILevel) => {
    try {
      setStartingGame(true)

      let success = false
      if (mode === 'vs_ai' && aiLevel) {
        success = await startAIGame(aiLevel)
      } else if (mode === 'local_multiplayer') {
        success = await startLocalMultiplayerGame()
      }

      if (!success) {
        throw new Error('Failed to start game')
      }
    } catch (error) {
      console.error('Game start failed:', error)
    } finally {
      setStartingGame(false)
    }
  }

  const handleMakeMove = async (coordinate: { x: number; y: number }) => {
    const result = await makeMove(coordinate)
    if (!result.isValid && result.errors.length > 0) {
      console.error('Move failed:', result.errors[0].message)
    }
    return result
  }

  const handleEndGame = async () => {
    const result = await endGame()
    if (result) {
      console.log('Game ended:', result)
      // Here you could show a game result modal or navigate to results page
    }
  }

  if (authLoading || gameLoading) {
    return <LoadingState message="Loading game..." />
  }

  if (gameError) {
    return (
      <ErrorState
        title="Game Error"
        message={gameError}
        action={
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        }
      />
    )
  }

  // Show game start screen if no active session
  if (!currentSession || !isGameActive) {
    return (
      <GameStartScreen
        user={isAuthenticated ? user : null}
        isGuest={isGuest}
        isStartingGame={startingGame}
        onStartGame={handleStartGame}
      />
    )
  }

  // Show active game
  return (
    <ActiveGameBoard
      session={currentSession}
      gameState={gameState}
      currentPlayer={getCurrentPlayer()}
      gameStats={getGameStats()}
      onMakeMove={handleMakeMove}
      onEndGame={handleEndGame}
      onPauseGame={pauseGame}
      onResumeGame={resumeGame}
      onPlayerReady={setPlayerReady}
      isGameOver={isGameOver}
    />
  )
}
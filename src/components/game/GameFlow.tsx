/**
 * Game Flow Component
 * Manages the complete game flow using Zustand store
 */

'use client'

import React from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { useGameStore } from '../../stores/gameStore'
import ErrorState from '../ui/ErrorState'
import { LoadingState } from '../ui/LoadingState'
import { BattlePhase } from './BattlePhase'
import { GameStartScreen } from './GameStartScreen'
import { KonvaShipPlacement } from '../placement/KonvaShipPlacement'

export const GameFlow: React.FC = () => {
  const { user, isAuthenticated, isGuest, isLoading: authLoading } = useAuth()
  const {
    phase,
    isLoading,
    error,
    currentSession,
    startGame,
    resetGame,
    setPlayerReady,
    updateGameState,
    setError
  } = useGameStore()

  const handleStartGame = async (mode: 'vs_ai' | 'local_multiplayer' | 'online_multiplayer', aiLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert') => {
    try {
      await startGame(user, isGuest, mode, aiLevel)
    } catch (error) {
      console.error('Failed to start game:', error)
      setError('Failed to start game')
    }
  }

  const handleReturnToStart = () => {
    resetGame()
  }

  const handlePlacementComplete = (playerId: string) => {
    try {
      // Set player as ready in the game store
      const result = setPlayerReady(playerId)

      if (result.isValid) {
        // Trigger game state update to transition to battle phase
        updateGameState()
      } else {
        console.error('Failed to set player ready:', result.errors)
        setError('Failed to complete ship placement')
      }
    } catch (error) {
      console.error('Error completing placement:', error)
      setError('Error completing ship placement')
    }
  }

  const handlePlacementProgress = (progress: any) => {
    // Handle placement progress updates if needed
    console.log('Placement progress:', progress)
  }

  if (authLoading || isLoading) {
    return <LoadingState message="Loading game..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Game Error"
        message={error}
        onRetry={() => setError(null)}
        showHomeButton={true}
        onHome={handleReturnToStart}
      />
    )
  }

  // Show game start screen
  if (phase === 'start') {
    return (
      <GameStartScreen
        user={isAuthenticated ? user : null}
        isGuest={isGuest}
        isStartingGame={isLoading}
        onStartGame={handleStartGame}
      />
    )
  }

  // Show ship placement phase
  if (phase === 'ship_placement') {
    return (
      <KonvaShipPlacement
        gameSession={currentSession}
        onPlacementComplete={handlePlacementComplete}
        onPlacementProgress={handlePlacementProgress}
        onReturnToStart={handleReturnToStart}
      />
    )
  }

  // Show battle phase
  if (phase === 'battle') {
    return (
      <BattlePhase
        onReturnToStart={handleReturnToStart}
      />
    )
  }

  // Show finished phase (handled by BattlePhase)
  if (phase === 'finished') {
    return (
      <BattlePhase
        onReturnToStart={handleReturnToStart}
      />
    )
  }

  return <LoadingState message="Loading game phase..." />
}

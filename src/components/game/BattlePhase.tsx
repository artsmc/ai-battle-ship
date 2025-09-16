/**
 * Battle Phase Component
 * Handles the battle phase of the game using Zustand store
 */

'use client'

import React, { useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import ErrorState from '../ui/ErrorState'
import { LoadingState } from '../ui/LoadingState'
import { BattleBoard } from './BattleBoard'
import { BattleControls } from './BattleControls'
import { BattleStatus } from './BattleStatus'
import { GameResult } from './GameResult'

interface BattlePhaseProps {
  onReturnToStart: () => void
}

export const BattlePhase: React.FC<BattlePhaseProps> = ({ onReturnToStart }) => {
  const {
    currentSession,
    gameState,
    currentPlayer,
    gameStats,
    phase,
    isLoading,
    error,
    gameResult,
    makeMove,
    endGame,
    pauseGame,
    resumeGame,
    updateGameState,
    resetGame
  } = useGameStore()

  // Update game state periodically for AI moves
  useEffect(() => {
    if (phase !== 'battle' || !currentSession) return

    const interval = setInterval(() => {
      updateGameState()
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, currentSession, updateGameState])

  const handleReturnToStart = () => {
    resetGame()
    onReturnToStart()
  }

  if (isLoading) {
    return <LoadingState message="Loading battle..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Battle Error"
        message={error}
        onRetry={() => updateGameState()}
        showHomeButton={true}
        onHome={handleReturnToStart}
      />
    )
  }

  if (phase === 'finished' && gameResult) {
    return (
      <GameResult
        result={gameResult}
        onPlayAgain={handleReturnToStart}
        onMainMenu={handleReturnToStart}
      />
    )
  }

  if (!currentSession || !gameState) {
    return (
      <ErrorState
        title="No Active Game"
        message="No active game session found"
        showHomeButton={true}
        onHome={handleReturnToStart}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Battle Status */}
      <BattleStatus
        session={currentSession}
        gameState={gameState}
        currentPlayer={currentPlayer}
        gameStats={gameStats}
        onReturnToStart={handleReturnToStart}
      />

      {/* Battle Controls */}
      <BattleControls
        gameState={gameState}
        onPause={pauseGame}
        onResume={resumeGame}
        onSurrender={() => endGame('surrender')}
      />

      {/* Battle Board */}
      <BattleBoard
        session={currentSession}
        gameState={gameState}
        currentPlayer={currentPlayer}
        onMakeMove={makeMove}
      />
    </div>
  )
}

/**
 * Game Session Hook
 * React hook for managing game sessions and integrating with the game orchestrator
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { gameOrchestrator, GameMode, AILevel, GameSession, GameResult } from '../lib/game/GameOrchestrator'
import { useAuth } from './auth/useAuth'
import { Coordinate, GameStateData, ValidationResult } from '../lib/game/types'

interface UseGameSessionReturn {
  // Session state
  currentSession: GameSession | null
  gameState: GameStateData | null
  isGameActive: boolean
  isGameOver: boolean

  // Game actions
  startAIGame: (aiLevel: AILevel) => Promise<boolean>
  startLocalMultiplayerGame: () => Promise<boolean>
  makeMove: (coordinate: Coordinate) => Promise<ValidationResult>
  endGame: () => Promise<GameResult | null>
  pauseGame: () => boolean
  resumeGame: () => boolean
  setPlayerReady: (playerId: string) => ValidationResult

  // Game info
  getCurrentPlayer: () => any
  getGameStats: () => any

  // Loading and error states
  isLoading: boolean
  error: string | null
}

export function useGameSession(): UseGameSessionReturn {
  const { user, isAuthenticated, isGuest } = useAuth()
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const [gameState, setGameState] = useState<GameStateData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update game state from orchestrator
  const updateGameState = useCallback(() => {
    const session = gameOrchestrator.getCurrentSession()
    const state = gameOrchestrator.getGameStateForUI()

    setCurrentSession(session)
    setGameState(state)
  }, [])

  // Start AI game
  const startAIGame = useCallback(async (aiLevel: AILevel): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const session = await gameOrchestrator.startAIGame(user, isGuest, aiLevel)
      setCurrentSession(session)
      updateGameState()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start AI game')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, isGuest, updateGameState])

  // Start local multiplayer game
  const startLocalMultiplayerGame = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const session = await gameOrchestrator.startLocalMultiplayerGame(user, isGuest)
      setCurrentSession(session)
      updateGameState()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start multiplayer game')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, isGuest, updateGameState])

  // Make a move
  const makeMove = useCallback(async (coordinate: Coordinate): Promise<ValidationResult> => {
    if (!currentSession || !user && !isGuest) {
      return {
        isValid: false,
        errors: [{ code: 'NO_SESSION', message: 'No active game session' }],
        warnings: []
      }
    }

    const playerId = currentSession.players.player1.id
    const result = await gameOrchestrator.makeMove(playerId, coordinate)

    if (result.isValid) {
      updateGameState()
    }

    return result
  }, [currentSession, user, isGuest, updateGameState])

  // End game
  const endGame = useCallback(async (): Promise<GameResult | null> => {
    try {
      const result = await gameOrchestrator.endGame()
      setCurrentSession(null)
      setGameState(null)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end game')
      return null
    }
  }, [])

  // Pause game
  const pauseGame = useCallback((): boolean => {
    const result = gameOrchestrator.pauseGame()
    if (result) {
      updateGameState()
    }
    return result
  }, [updateGameState])

  // Resume game
  const resumeGame = useCallback((): boolean => {
    const result = gameOrchestrator.resumeGame()
    if (result) {
      updateGameState()
    }
    return result
  }, [updateGameState])

  // Set player ready
  const setPlayerReady = useCallback((playerId: string): ValidationResult => {
    const result = gameOrchestrator.setPlayerReady(playerId)
    if (result.isValid) {
      updateGameState()
    }
    return result
  }, [updateGameState])

  // Get current player
  const getCurrentPlayer = useCallback(() => {
    return gameOrchestrator.getCurrentPlayer()
  }, [])

  // Get game statistics
  const getGameStats = useCallback(() => {
    return gameOrchestrator.getGameStats()
  }, [])

  // Initialize session check
  useEffect(() => {
    updateGameState()
  }, [updateGameState])

  // Set up periodic state updates for real-time gameplay
  useEffect(() => {
    if (!currentSession) return

    const interval = setInterval(() => {
      updateGameState()
    }, 1000) // Update every second during active games

    return () => clearInterval(interval)
  }, [currentSession, updateGameState])

  return {
    // Session state
    currentSession,
    gameState,
    isGameActive: !!currentSession && !gameOrchestrator.isGameOver(),
    isGameOver: gameOrchestrator.isGameOver(),

    // Game actions
    startAIGame,
    startLocalMultiplayerGame,
    makeMove,
    endGame,
    pauseGame,
    resumeGame,
    setPlayerReady,

    // Game info
    getCurrentPlayer,
    getGameStats,

    // Loading and error states
    isLoading,
    error,
  }
}
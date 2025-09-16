/**
 * Game Store - Zustand
 * Manages game session state and orchestrates game flow
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AuthUser } from '../lib/auth/types'
import { gameOrchestrator, GameResult, GameSession } from '../lib/game/GameOrchestrator'
import { Coordinate, GameStateData, ValidationResult } from '../lib/game/types'

export type GameMode = 'vs_ai' | 'local_multiplayer' | 'online_multiplayer'
export type AILevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type GamePhase = 'start' | 'ship_placement' | 'battle' | 'finished'

interface GameStore {
  // State
  currentSession: GameSession | null
  gameState: GameStateData | null
  currentPlayer: any
  gameStats: any
  phase: GamePhase
  isLoading: boolean
  error: string | null
  gameResult: GameResult | null

  // Actions
  startGame: (user: AuthUser | null, isGuest: boolean, mode: GameMode, aiLevel?: AILevel) => Promise<void>
  makeMove: (coordinate: Coordinate) => Promise<ValidationResult>
  endGame: (reason?: 'victory' | 'surrender' | 'disconnect') => Promise<void>
  pauseGame: () => void
  resumeGame: () => void
  setPlayerReady: (playerId: string) => ValidationResult
  updateGameState: () => void
  resetGame: () => void
  setError: (error: string | null) => void
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSession: null,
      gameState: null,
      currentPlayer: null,
      gameStats: null,
      phase: 'start',
      isLoading: false,
      error: null,
      gameResult: null,

      // Start a new game
      startGame: async (user, isGuest, mode, aiLevel) => {
        set({ isLoading: true, error: null })
        
        try {
          let session: GameSession

          if (mode === 'vs_ai') {
            session = await gameOrchestrator.startAIGame(user, isGuest, aiLevel || 'beginner')
          } else if (mode === 'local_multiplayer') {
            session = await gameOrchestrator.startLocalMultiplayerGame(user, isGuest)
          } else {
            throw new Error('Online multiplayer not yet implemented')
          }

          set({
            currentSession: session,
            phase: 'ship_placement',
            isLoading: false
          })

          // Update game state
          get().updateGameState()
        } catch (error) {
          console.error('Failed to start game:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to start game',
            isLoading: false
          })
        }
      },

      // Make a move in the game
      makeMove: async (coordinate) => {
        const { currentSession, currentPlayer } = get()
        
        if (!currentSession || !currentPlayer) {
          return {
            isValid: false,
            errors: [{ code: 'NO_ACTIVE_GAME', message: 'No active game session' }],
            warnings: []
          }
        }

        try {
          const result = await gameOrchestrator.makeMove(currentPlayer.id, coordinate)
          
          // Update game state after move
          setTimeout(() => get().updateGameState(), 100)
          
          return result
        } catch (error) {
          console.error('Failed to make move:', error)
          return {
            isValid: false,
            errors: [{ code: 'MOVE_FAILED', message: 'Failed to make move' }],
            warnings: []
          }
        }
      },

      // End the current game
      endGame: async (reason = 'victory') => {
        try {
          const result = await gameOrchestrator.endGame(reason)
          
          set({
            gameResult: result,
            phase: 'finished'
          })
        } catch (error) {
          console.error('Failed to end game:', error)
          set({ error: 'Failed to end game' })
        }
      },

      // Pause the game
      pauseGame: () => {
        const success = gameOrchestrator.pauseGame()
        if (success) {
          get().updateGameState()
        }
      },

      // Resume the game
      resumeGame: () => {
        const success = gameOrchestrator.resumeGame()
        if (success) {
          get().updateGameState()
        }
      },

      // Set player ready
      setPlayerReady: (playerId) => {
        const result = gameOrchestrator.setPlayerReady(playerId)
        if (result.isValid) {
          get().updateGameState()
        }
        return result
      },

      // Update game state from orchestrator
      updateGameState: () => {
        try {
          const gameState = gameOrchestrator.getGameStateForUI()
          const currentPlayer = gameOrchestrator.getCurrentPlayer()
          const gameStats = gameOrchestrator.getGameStats()
          const isGameOver = gameOrchestrator.isGameOver()

          set({
            gameState,
            currentPlayer,
            gameStats
          })

          // Check if game is over
          if (isGameOver && get().phase !== 'finished') {
            get().endGame()
          }

          // Update phase based on game state
          if (gameState?.phase.current === 'battle' && get().phase !== 'battle') {
            set({ phase: 'battle' })
          }
        } catch (error) {
          console.error('Failed to update game state:', error)
          set({ error: 'Failed to update game state' })
        }
      },

      // Reset game to initial state
      resetGame: () => {
        set({
          currentSession: null,
          gameState: null,
          currentPlayer: null,
          gameStats: null,
          phase: 'start',
          isLoading: false,
          error: null,
          gameResult: null
        })
      },

      // Set error state
      setError: (error) => {
        set({ error, isLoading: false })
      }
    }),
    {
      name: 'game-store'
    }
  )
)

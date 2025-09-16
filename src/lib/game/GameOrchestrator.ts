/**
 * Game Orchestrator
 * Manages game sessions and coordinates between UI, game engine, and user system
 */

import { GameState } from './GameState'
import { Player, PlayerConfig } from './Player'
import { AIPlayer, AIPlayerConfig } from '../ai/AIPlayer'
import { DifficultyManager } from '../ai/DifficultyManager'
import { DifficultyLevel } from '../ai/types'
import { GameConfiguration, GameStateData, GamePlayer, Coordinate, ValidationResult } from './types'
import { AuthUser, GuestSession } from '../auth/types'
import { updateGuestStats } from '../auth/services/guest'

export type GameMode = 'vs_ai' | 'local_multiplayer' | 'online_multiplayer'
export type AILevel = DifficultyLevel

export interface GameSession {
  id: string
  mode: GameMode
  aiLevel?: AILevel
  gameState: GameState
  players: {
    player1: Player | AIPlayer
    player2: Player | AIPlayer
  }
  currentUser: AuthUser | null
  isGuest: boolean
  startedAt: Date
  lastActivity: Date
}

export interface GameResult {
  winnerId: string
  winnerName: string
  loserName: string
  duration: number
  totalMoves: number
  accuracy: number
  reason: 'victory' | 'surrender' | 'disconnect'
}

export class GameOrchestrator {
  private currentSession: GameSession | null = null
  private difficultyManager: DifficultyManager

  constructor() {
    this.difficultyManager = DifficultyManager.getInstance()
  }

  /**
   * Start a new AI game
   */
  async startAIGame(
    user: AuthUser | null,
    isGuest: boolean,
    aiLevel: AILevel = 'beginner'
  ): Promise<GameSession> {
    const gameConfig: GameConfiguration = {
      boardSize: { width: 10, height: 10 },
      gameMode: 'local_ai',
      timeLimit: undefined, // No time limit for local games
      allowReconnection: false,
      maxPlayers: 2,
      enablePowerups: true,
      enableSpecialAbilities: true,
    }

    // Create game state
    const gameState = new GameState(gameConfig)

    // Create human player
    const humanPlayer = new Player({
      id: user?.id || `guest_${Date.now()}`,
      name: user?.display_name || user?.username || 'Guest Player',
      isAI: false,
      boardWidth: 10,
      boardHeight: 10,
      allowPowerups: true,
    })

    // Create AI player
    const aiPlayer = new AIPlayer({
      id: `ai_${aiLevel}_${Date.now()}`,
      name: `AI (${aiLevel.charAt(0).toUpperCase() + aiLevel.slice(1)})`,
      boardWidth: 10,
      boardHeight: 10,
      allowPowerups: true,
      difficulty: aiLevel,
      learningEnabled: true,
    })

    // Add players to game
    const addResult1 = gameState.addPlayer(humanPlayer)
    const addResult2 = gameState.addPlayer(aiPlayer)

    if (!addResult1.isValid || !addResult2.isValid) {
      throw new Error('Failed to add players to game')
    }

    // Create session
    const session: GameSession = {
      id: gameState.getState().id,
      mode: 'vs_ai',
      aiLevel,
      gameState,
      players: {
        player1: humanPlayer,
        player2: aiPlayer,
      },
      currentUser: user,
      isGuest,
      startedAt: new Date(),
      lastActivity: new Date(),
    }

    this.currentSession = session
    return session
  }

  /**
   * Start a local multiplayer game
   */
  async startLocalMultiplayerGame(
    user: AuthUser | null,
    isGuest: boolean
  ): Promise<GameSession> {
    const gameConfig: GameConfiguration = {
      boardSize: { width: 10, height: 10 },
      gameMode: 'local_multiplayer',
      timeLimit: undefined,
      allowReconnection: true,
      maxPlayers: 2,
      enablePowerups: true,
      enableSpecialAbilities: true,
    }

    const gameState = new GameState(gameConfig)

    // Create players
    const player1 = new Player({
      id: user?.id || `guest_p1_${Date.now()}`,
      name: user?.display_name || user?.username || 'Player 1',
      isAI: false,
      boardWidth: 10,
      boardHeight: 10,
      allowPowerups: true,
    })

    const player2 = new Player({
      id: `local_p2_${Date.now()}`,
      name: 'Player 2',
      isAI: false,
      boardWidth: 10,
      boardHeight: 10,
      allowPowerups: true,
    })

    // Add players to game
    gameState.addPlayer(player1)
    gameState.addPlayer(player2)

    const session: GameSession = {
      id: gameState.getState().id,
      mode: 'local_multiplayer',
      gameState,
      players: {
        player1,
        player2,
      },
      currentUser: user,
      isGuest,
      startedAt: new Date(),
      lastActivity: new Date(),
    }

    this.currentSession = session
    return session
  }

  /**
   * Get current game session
   */
  getCurrentSession(): GameSession | null {
    return this.currentSession
  }

  /**
   * Make a move in the current game
   */
  async makeMove(playerId: string, coordinate: Coordinate): Promise<ValidationResult> {
    if (!this.currentSession) {
      return {
        isValid: false,
        errors: [{ code: 'NO_ACTIVE_GAME', message: 'No active game session' }],
        warnings: []
      }
    }

    const { gameState } = this.currentSession

    // Create attack action
    const action = {
      type: 'attack' as const,
      playerId,
      timestamp: new Date(),
      data: {
        targetCoordinate: coordinate,
      }
    }

    const result = gameState.processAction(action)

    if (result.isValid) {
      this.currentSession.lastActivity = new Date()

      // If it's an AI game and the move was successful, trigger AI response
      if (this.currentSession.mode === 'vs_ai') {
        const aiPlayer = this.getAIPlayer()
        if (aiPlayer && gameState.getCurrentPlayer()?.id === aiPlayer.id) {
          setTimeout(() => this.processAITurn(), 1000) // Add thinking delay
        }
      }
    }

    return result
  }

  /**
   * Process AI turn
   */
  private async processAITurn(): Promise<void> {
    if (!this.currentSession || this.currentSession.mode !== 'vs_ai') {
      return
    }

    const aiPlayer = this.getAIPlayer()
    const gameState = this.currentSession.gameState

    if (!aiPlayer || gameState.getCurrentPlayer()?.id !== aiPlayer.id) {
      return
    }

    try {
      // AI makes its move
      const aiMove = await aiPlayer.makeMove()
      if (aiMove) {
        await this.makeMove(aiPlayer.id, aiMove.coordinate)
      }
    } catch (error) {
      console.error('AI move failed:', error)
    }
  }

  /**
   * Get AI player from current session
   */
  private getAIPlayer(): AIPlayer | null {
    if (!this.currentSession || this.currentSession.mode !== 'vs_ai') {
      return null
    }

    const { player1, player2 } = this.currentSession.players
    return (player1 instanceof AIPlayer ? player1 : player2 instanceof AIPlayer ? player2 : null)
  }

  /**
   * End current game
   */
  async endGame(reason: 'victory' | 'surrender' | 'disconnect' = 'victory'): Promise<GameResult | null> {
    if (!this.currentSession) {
      return null
    }

    const gameState = this.currentSession.gameState.getState()
    const { players } = this.currentSession

    // Calculate game result
    const duration = Date.now() - this.currentSession.startedAt.getTime()
    const totalMoves = gameState.turnNumber

    let winnerId = gameState.winnerId
    let winnerName = 'Unknown'
    let loserName = 'Unknown'

    // Determine winner and names
    if (winnerId) {
      const winner = winnerId === players.player1.id ? players.player1 : players.player2
      const loser = winnerId === players.player1.id ? players.player2 : players.player1
      winnerName = winner.name
      loserName = loser.name
    }

    // Calculate accuracy for human player
    let accuracy = 0
    const humanPlayer = players.player1 instanceof AIPlayer ? players.player2 : players.player1
    if (humanPlayer && !humanPlayer.isAI) {
      const shots = humanPlayer.stats.shotsFired
      const hits = humanPlayer.stats.shotsHit
      accuracy = shots > 0 ? (hits / shots) * 100 : 0
    }

    const result: GameResult = {
      winnerId: winnerId || '',
      winnerName,
      loserName,
      duration,
      totalMoves,
      accuracy,
      reason,
    }

    // Update statistics for guest users
    if (this.currentSession.isGuest && !humanPlayer.isAI) {
      updateGuestStats({
        won: winnerId === humanPlayer.id,
        shots: humanPlayer.stats.shotsFired,
        hits: humanPlayer.stats.shotsHit,
      })
    }

    // TODO: Update statistics for registered users
    // This would integrate with the user statistics system from Phase 4

    this.currentSession = null
    return result
  }

  /**
   * Pause current game
   */
  pauseGame(): boolean {
    if (!this.currentSession) {
      return false
    }

    this.currentSession.gameState.pauseGame()
    return true
  }

  /**
   * Resume current game
   */
  resumeGame(): boolean {
    if (!this.currentSession) {
      return false
    }

    this.currentSession.gameState.resumeGame()
    return true
  }

  /**
   * Get game state for UI
   */
  getGameStateForUI(): GameStateData | null {
    if (!this.currentSession) {
      return null
    }

    return this.currentSession.gameState.getState()
  }

  /**
   * Set player ready for setup phase
   */
  setPlayerReady(playerId: string): ValidationResult {
    if (!this.currentSession) {
      return {
        isValid: false,
        errors: [{ code: 'NO_ACTIVE_GAME', message: 'No active game session' }],
        warnings: []
      }
    }

    return this.currentSession.gameState.setPlayerReady(playerId)
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.currentSession?.gameState.isGameOver() || false
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): GamePlayer | null {
    if (!this.currentSession) {
      return null
    }

    return this.currentSession.gameState.getCurrentPlayer() || null
  }

  /**
   * Get game statistics
   */
  getGameStats(): {
    turnNumber: number
    phase: string
    timeElapsed: number
    player1Stats: any
    player2Stats: any
  } | null {
    if (!this.currentSession) {
      return null
    }

    const state = this.currentSession.gameState.getState()
    const timeElapsed = Date.now() - this.currentSession.startedAt.getTime()

    return {
      turnNumber: state.turnNumber,
      phase: state.phase.current,
      timeElapsed,
      player1Stats: this.currentSession.players.player1.stats,
      player2Stats: this.currentSession.players.player2.stats,
    }
  }
}

// Create singleton instance
export const gameOrchestrator = new GameOrchestrator()
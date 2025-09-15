/**
 * WinConditions
 * Checks for game end conditions and determines winners
 */

import { GameState } from '../GameState'
import { GameEndReason, GamePlayer } from '../types'

export interface WinConditionResult {
  isGameOver: boolean
  winnerId?: string
  loserId?: string
  reason: GameEndReason
  isDraw: boolean
  statistics?: GameEndStatistics
}

export interface GameEndStatistics {
  winner?: {
    shipsRemaining: number
    accuracy: number
    totalDamageDealt: number
    shotsTotal: number
  }
  loser?: {
    shipsLost: number
    accuracy: number
    totalDamageTaken: number
    shotsTotal: number
  }
  gameDuration?: number
  totalTurns: number
}

export interface DrawCondition {
  type: 'mutual_destruction' | 'turn_limit' | 'stalemate' | 'agreement'
  description: string
}

export class WinConditions {
  private maxTurns: number = 200 // Default max turns before draw
  private stalemateTurnThreshold: number = 20 // Turns without hits for stalemate

  constructor(maxTurns?: number) {
    if (maxTurns) {
      this.maxTurns = maxTurns
    }
  }

  /**
   * Check if a player has won/lost
   */
  checkWinCondition(player: GamePlayer): WinConditionResult {
    // Check if all ships are sunk
    if (this.areAllShipsSunk(player)) {
      return {
        isGameOver: true,
        loserId: player.id,
        reason: 'all_ships_sunk',
        isDraw: false
      }
    }

    // Check if player has surrendered (handled elsewhere)

    // No win condition met
    return {
      isGameOver: false,
      reason: 'all_ships_sunk', // Default reason
      isDraw: false
    }
  }

  /**
   * Check comprehensive win conditions for the game state
   */
  checkGameEndConditions(gameState: GameState): WinConditionResult {
    const state = gameState.getState()

    if (state.players.length !== 2) {
      return {
        isGameOver: false,
        reason: 'all_ships_sunk',
        isDraw: false
      }
    }

    const [player1, player2] = state.players

    // Check if either player has lost all ships
    if (this.areAllShipsSunk(player1)) {
      return this.createWinResult(player2.id, player1.id, 'all_ships_sunk', gameState)
    }

    if (this.areAllShipsSunk(player2)) {
      return this.createWinResult(player1.id, player2.id, 'all_ships_sunk', gameState)
    }

    // Check for surrender
    if (!player1.isActive) {
      return this.createWinResult(player2.id, player1.id, 'surrender', gameState)
    }

    if (!player2.isActive) {
      return this.createWinResult(player1.id, player2.id, 'surrender', gameState)
    }

    // Check for timeout/disconnection
    if (player1.connectionStatus === 'disconnected' &&
        !state.configuration.allowReconnection) {
      return this.createWinResult(player2.id, player1.id, 'disconnection', gameState)
    }

    if (player2.connectionStatus === 'disconnected' &&
        !state.configuration.allowReconnection) {
      return this.createWinResult(player1.id, player2.id, 'disconnection', gameState)
    }

    // Check for draw conditions
    const drawCheck = this.checkDrawConditions(gameState)
    if (drawCheck.isDraw) {
      return drawCheck
    }

    // No end condition met
    return {
      isGameOver: false,
      reason: 'all_ships_sunk',
      isDraw: false
    }
  }

  /**
   * Check for draw conditions
   */
  checkDrawConditions(gameState: GameState): WinConditionResult {
    const state = gameState.getState()

    // Check turn limit
    if (state.turnNumber >= this.maxTurns) {
      return {
        isGameOver: true,
        reason: 'draw',
        isDraw: true,
        statistics: this.calculateEndStatistics(gameState)
      }
    }

    // Check for stalemate (no hits for many turns)
    if (this.checkStalemate(gameState)) {
      return {
        isGameOver: true,
        reason: 'draw',
        isDraw: true,
        statistics: this.calculateEndStatistics(gameState)
      }
    }

    // Check mutual destruction (both players lose last ship same turn)
    if (this.checkMutualDestruction(gameState)) {
      return {
        isGameOver: true,
        reason: 'draw',
        isDraw: true,
        statistics: this.calculateEndStatistics(gameState)
      }
    }

    return {
      isGameOver: false,
      reason: 'draw',
      isDraw: false
    }
  }

  /**
   * Check if all ships are sunk for a player
   */
  private areAllShipsSunk(player: GamePlayer | any): boolean {
    if (!player.fleet || player.fleet.length === 0) {
      return true
    }

    return player.fleet.every((ship: any) => ship.damage.isSunk)
  }

  /**
   * Check for stalemate condition
   */
  private checkStalemate(gameState: GameState): boolean {
    const state = gameState.getState()
    const recentTurns = state.turns.slice(-this.stalemateTurnThreshold)

    if (recentTurns.length < this.stalemateTurnThreshold) {
      return false
    }

    // Check if there have been any hits in recent turns
    let hasHits = false
    for (const turn of recentTurns) {
      for (const action of turn.actions) {
        if (action.type === 'attack') {
          const attackData = action.data as any
          if (attackData.result?.result !== 'MISS') {
            hasHits = true
            break
          }
        }
      }
      if (hasHits) break
    }

    return !hasHits
  }

  /**
   * Check for mutual destruction
   */
  private checkMutualDestruction(gameState: GameState): boolean {
    const state = gameState.getState()

    if (state.players.length !== 2) {
      return false
    }

    const [player1, player2] = state.players

    // Both players must have all ships sunk
    return this.areAllShipsSunk(player1) && this.areAllShipsSunk(player2)
  }

  /**
   * Create a win result
   */
  private createWinResult(
    winnerId: string,
    loserId: string,
    reason: GameEndReason,
    gameState: GameState
  ): WinConditionResult {
    return {
      isGameOver: true,
      winnerId,
      loserId,
      reason,
      isDraw: false,
      statistics: this.calculateEndStatistics(gameState, winnerId, loserId)
    }
  }

  /**
   * Calculate end game statistics
   */
  private calculateEndStatistics(
    gameState: GameState,
    winnerId?: string,
    loserId?: string
  ): GameEndStatistics {
    const state = gameState.getState()

    let winnerStats = undefined
    let loserStats = undefined

    if (winnerId) {
      const winner = state.players.find(p => p.id === winnerId)
      if (winner) {
        winnerStats = {
          shipsRemaining: winner.stats.shipsRemaining,
          accuracy: winner.stats.accuracy,
          totalDamageDealt: winner.stats.damageDealt,
          shotsTotal: winner.stats.shotsTotal
        }
      }
    }

    if (loserId) {
      const loser = state.players.find(p => p.id === loserId)
      if (loser) {
        loserStats = {
          shipsLost: loser.fleet.length - loser.stats.shipsRemaining,
          accuracy: loser.stats.accuracy,
          totalDamageTaken: loser.stats.damageTaken,
          shotsTotal: loser.stats.shotsTotal
        }
      }
    }

    const gameDuration = state.startedAt && state.finishedAt
      ? state.finishedAt.getTime() - state.startedAt.getTime()
      : undefined

    return {
      winner: winnerStats,
      loser: loserStats,
      gameDuration,
      totalTurns: state.turnNumber
    }
  }

  /**
   * Check if a player can still win
   */
  canPlayerWin(player: GamePlayer, opponent: GamePlayer): boolean {
    // Player can win if they have ships remaining and opponent has ships to sink
    const playerHasShips = player.stats.shipsRemaining > 0
    const opponentHasShips = opponent.stats.shipsRemaining > 0

    return playerHasShips && opponentHasShips
  }

  /**
   * Calculate win probability
   */
  calculateWinProbability(player: GamePlayer, opponent: GamePlayer): number {
    if (!this.canPlayerWin(player, opponent)) {
      return 0
    }

    // Simple probability based on remaining ships and accuracy
    const shipRatio = player.stats.shipsRemaining /
                     (player.stats.shipsRemaining + opponent.stats.shipsRemaining)

    const accuracyFactor = (player.stats.accuracy / 100) * 0.3
    const shipFactor = shipRatio * 0.7

    return Math.min(1, Math.max(0, accuracyFactor + shipFactor))
  }

  /**
   * Get time until draw (turn limit)
   */
  getTurnsUntilDraw(currentTurn: number): number {
    return Math.max(0, this.maxTurns - currentTurn)
  }

  /**
   * Update configuration
   */
  setMaxTurns(maxTurns: number): void {
    this.maxTurns = maxTurns
  }

  setStalemateTurnThreshold(threshold: number): void {
    this.stalemateTurnThreshold = threshold
  }
}
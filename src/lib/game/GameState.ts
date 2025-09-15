/**
 * GameState Class
 * Manages the overall game state, transitions, and turn handling
 */

import { GameStatus } from '../database/types/enums'
import {
  GameStateData,
  GameConfiguration,
  GamePhase,
  GamePhaseType,
  GamePlayer,
  PlayerTurn,
  GameTimers,
  GameEndReason,
  GameEvent,
  GameEventType,
  GameAction,
  AttackAction,
  ValidationResult,
  GameSnapshot
} from './types'
import { EventMemoryManager, MemoryConfig, DEFAULT_MEMORY_CONFIG } from './EventMemoryManager'
import { generateGameId, generateEventId, AuthorizationManager, sanitizePlayerId } from './utils/security'

export class GameState {
  private state: GameStateData
  private eventManager: EventMemoryManager
  private snapshots: GameSnapshot[] = []
  private maxSnapshots: number = DEFAULT_MEMORY_CONFIG.maxSnapshots
  private authManager: AuthorizationManager = new AuthorizationManager()

  constructor(configuration: GameConfiguration, memoryConfig?: Partial<MemoryConfig>) {
    this.state = this.initializeState(configuration)
    this.eventManager = new EventMemoryManager(memoryConfig)
    if (memoryConfig?.maxSnapshots) {
      this.maxSnapshots = memoryConfig.maxSnapshots
    }
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeState(configuration: GameConfiguration): GameStateData {
    const now = new Date()

    return {
      id: this.generateGameId(),
      configuration,
      phase: {
        current: 'waiting',
        startedAt: now
      },
      status: GameStatus.WAITING,
      players: [],
      currentPlayerId: undefined,
      turnNumber: 0,
      turns: [],
      timers: this.initializeTimers(),
      winnerId: undefined,
      endReason: undefined,
      createdAt: now,
      startedAt: undefined,
      finishedAt: undefined
    }
  }

  private initializeTimers(): GameTimers {
    return {
      gameStartTime: undefined,
      turnStartTime: undefined,
      totalGameTime: 0,
      currentTurnTime: 0,
      player1TotalTime: 0,
      player2TotalTime: 0,
      isPaused: false,
      pauseStartTime: undefined,
      totalPauseTime: 0
    }
  }

  private generateGameId(): string {
    return generateGameId()
  }

  // =============================================
  // PLAYER MANAGEMENT
  // =============================================

  addPlayer(player: GamePlayer, sessionToken?: string): ValidationResult {
    // Sanitize player ID
    const sanitizedId = sanitizePlayerId(player.id)
    if (!sanitizedId.valid || !sanitizedId.playerId) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_PLAYER_ID',
          message: sanitizedId.error || 'Invalid player ID format'
        }],
        warnings: []
      }
    }

    // Update player with sanitized ID
    player.id = sanitizedId.playerId

    if (this.state.players.length >= 2) {
      return {
        isValid: false,
        errors: [{
          code: 'MAX_PLAYERS',
          message: 'Game already has maximum number of players'
        }],
        warnings: []
      }
    }

    if (this.state.phase.current !== 'waiting' && this.state.phase.current !== 'setup') {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_PHASE',
          message: 'Cannot add players after game has started'
        }],
        warnings: []
      }
    }

    this.state.players.push(player)

    // Create authorization session for the player
    const token = sessionToken || this.authManager.createSession(player.id, [
      'game.join', 'game.leave', 'ship.place', 'combat.attack', 'combat.powerup', 'game.surrender'
    ])

    this.recordEvent('player_joined', { playerId: player.id })

    if (this.state.players.length === 2) {
      this.transitionToPhase('setup')
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  removePlayer(playerId: string, sessionToken?: string): ValidationResult {
    // Validate authorization
    if (sessionToken) {
      const authResult = this.authManager.authorizeStateChange(sessionToken, 'remove_player', { playerId })
      if (!authResult.isValid) {
        return authResult
      }
    }

    const playerIndex = this.state.players.findIndex(p => p.id === playerId)

    if (playerIndex === -1) {
      return {
        isValid: false,
        errors: [{
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found in game'
        }],
        warnings: []
      }
    }

    if (this.state.phase.current === 'battle') {
      // Handle player leaving during battle
      this.state.players[playerIndex].connectionStatus = 'disconnected'
      this.recordEvent('player_disconnected', { playerId })

      // Check for auto-win conditions
      if (this.state.configuration.allowReconnection) {
        this.pauseGame()
      } else {
        const remainingPlayer = this.state.players.find(p => p.id !== playerId)
        if (remainingPlayer) {
          this.endGame(remainingPlayer.id, 'disconnection')
        }
      }
    } else {
      // Remove player during setup
      this.state.players.splice(playerIndex, 1)
      this.authManager.invalidateSession(playerId)
      this.recordEvent('player_left', { playerId })
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  setPlayerReady(playerId: string, sessionToken?: string): ValidationResult {
    // Sanitize and validate player ID
    const sanitizedId = sanitizePlayerId(playerId)
    if (!sanitizedId.valid || !sanitizedId.playerId) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_PLAYER_ID',
          message: sanitizedId.error || 'Invalid player ID'
        }],
        warnings: []
      }
    }
    playerId = sanitizedId.playerId

    // Validate authorization if token provided
    if (sessionToken) {
      const authResult = this.authManager.authorizeStateChange(sessionToken, 'set_ready', { playerId })
      if (!authResult.isValid) {
        return authResult
      }
    }

    const player = this.getPlayer(playerId)

    if (!player) {
      return {
        isValid: false,
        errors: [{
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found'
        }],
        warnings: []
      }
    }

    player.isReady = true
    this.recordEvent('player_ready', { playerId })

    // Check if all players are ready
    if (this.state.players.every(p => p.isReady)) {
      this.transitionToPhase('ship_placement')
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  // =============================================
  // PHASE MANAGEMENT
  // =============================================

  transitionToPhase(newPhase: GamePhaseType): void {
    const now = new Date()
    const oldPhase = this.state.phase.current

    this.state.phase = {
      current: newPhase,
      startedAt: now,
      timeLimit: this.getPhaseTimeLimit(newPhase)
    }

    // Update game status based on phase
    switch (newPhase) {
      case 'waiting':
        this.state.status = GameStatus.WAITING
        break
      case 'setup':
      case 'ship_placement':
        this.state.status = GameStatus.SETUP
        break
      case 'battle':
        this.state.status = GameStatus.PLAYING
        this.state.startedAt = now
        this.state.timers.gameStartTime = now
        this.startNextTurn()
        break
      case 'finished':
        this.state.status = GameStatus.FINISHED
        this.state.finishedAt = now
        break
    }

    this.recordEvent('phase_changed', {
      oldPhase,
      newPhase,
      timestamp: now
    })
  }

  private getPhaseTimeLimit(phase: GamePhaseType): number | undefined {
    switch (phase) {
      case 'ship_placement':
        return 300000 // 5 minutes
      case 'battle':
        return this.state.configuration.timeLimit
      default:
        return undefined
    }
  }

  // =============================================
  // TURN MANAGEMENT
  // =============================================

  startNextTurn(): void {
    if (this.state.phase.current !== 'battle') {
      return
    }

    const currentPlayerIndex = this.state.currentPlayerId
      ? this.state.players.findIndex(p => p.id === this.state.currentPlayerId)
      : -1

    const nextPlayerIndex = (currentPlayerIndex + 1) % this.state.players.length
    const nextPlayer = this.state.players[nextPlayerIndex]

    if (!nextPlayer || !nextPlayer.isActive) {
      return
    }

    this.state.currentPlayerId = nextPlayer.id
    this.state.turnNumber++
    this.state.timers.turnStartTime = new Date()

    const turn: PlayerTurn = {
      playerId: nextPlayer.id,
      turnNumber: this.state.turnNumber,
      startTime: new Date(),
      actions: []
    }

    this.state.turns.push(turn)
    this.recordEvent('turn_started', {
      playerId: nextPlayer.id,
      turnNumber: this.state.turnNumber
    })
  }

  endCurrentTurn(): void {
    const currentTurn = this.getCurrentTurn()
    if (!currentTurn) {
      return
    }

    currentTurn.endTime = new Date()
    currentTurn.timeUsed = currentTurn.endTime.getTime() - currentTurn.startTime.getTime()

    // Update player time tracking
    const playerIndex = this.state.players.findIndex(p => p.id === currentTurn.playerId)
    if (playerIndex === 0) {
      this.state.timers.player1TotalTime += currentTurn.timeUsed
    } else if (playerIndex === 1) {
      this.state.timers.player2TotalTime += currentTurn.timeUsed
    }

    this.startNextTurn()
  }

  getCurrentTurn(): PlayerTurn | undefined {
    return this.state.turns[this.state.turns.length - 1]
  }

  // =============================================
  // GAME ACTIONS
  // =============================================

  processAction(action: GameAction, sessionToken?: string): ValidationResult {
    // Validate authorization for action
    if (sessionToken) {
      const actionType = action.type === 'attack' ? 'attack' : action.type
      const authResult = this.authManager.authorizeStateChange(
        sessionToken,
        actionType,
        { playerId: action.playerId }
      )
      if (!authResult.isValid) {
        return authResult
      }
    }

    const validation = this.validateAction(action)
    if (!validation.isValid) {
      return validation
    }

    const currentTurn = this.getCurrentTurn()
    if (currentTurn) {
      currentTurn.actions.push(action)
    }

    // Process specific action types
    switch (action.type) {
      case 'attack':
        this.processAttack(action.data as AttackAction, action.playerId)
        break
      case 'surrender':
        const opponent = this.state.players.find(p => p.id !== action.playerId)
        if (opponent) {
          this.endGame(opponent.id, 'surrender')
        }
        break
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  private processAttack(attack: AttackAction, playerId: string): void {
    this.recordEvent('attack_made', {
      playerId,
      coordinate: attack.targetCoordinate,
      result: attack.result
    })

    if (attack.result?.shipSunk) {
      this.recordEvent('ship_sunk', {
        playerId,
        shipId: attack.result.shipHit,
        shipType: attack.result.shipType
      })

      // Check for win condition
      const opponent = this.state.players.find(p => p.id !== playerId)
      if (opponent && opponent.fleet.every(ship => ship.damage.isSunk)) {
        this.endGame(playerId, 'all_ships_sunk')
      }
    }
  }

  private validateAction(action: GameAction): ValidationResult {
    if (this.state.phase.current !== 'battle') {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_PHASE',
          message: 'Actions can only be performed during battle phase'
        }],
        warnings: []
      }
    }

    if (action.playerId !== this.state.currentPlayerId) {
      return {
        isValid: false,
        errors: [{
          code: 'NOT_YOUR_TURN',
          message: 'It is not your turn'
        }],
        warnings: []
      }
    }

    return { isValid: true, errors: [], warnings: [] }
  }

  // =============================================
  // GAME CONTROL
  // =============================================

  pauseGame(): void {
    if (this.state.timers.isPaused) {
      return
    }

    this.state.timers.isPaused = true
    this.state.timers.pauseStartTime = new Date()
    this.state.status = GameStatus.PAUSED
    this.recordEvent('game_paused', {})
  }

  resumeGame(): void {
    if (!this.state.timers.isPaused || !this.state.timers.pauseStartTime) {
      return
    }

    const pauseDuration = Date.now() - this.state.timers.pauseStartTime.getTime()
    this.state.timers.totalPauseTime += pauseDuration
    this.state.timers.isPaused = false
    this.state.timers.pauseStartTime = undefined
    this.state.status = GameStatus.PLAYING
    this.recordEvent('game_resumed', {})
  }

  endGame(winnerId: string, reason: GameEndReason): void {
    this.state.winnerId = winnerId
    this.state.endReason = reason
    this.transitionToPhase('finished')

    this.recordEvent('game_ended', {
      winnerId,
      reason,
      finalScore: this.calculateFinalScore()
    })
  }

  private calculateFinalScore(): Record<string, number> {
    const scores: Record<string, number> = {}

    for (const player of this.state.players) {
      scores[player.id] = player.stats.shipsRemaining * 100 +
                          player.stats.accuracy * 10 -
                          player.stats.damageTaken
    }

    return scores
  }

  // =============================================
  // STATE MANAGEMENT
  // =============================================

  createSnapshot(): void {
    const snapshot: GameSnapshot = {
      state: JSON.parse(JSON.stringify(this.state)),
      timestamp: new Date(),
      version: this.snapshots.length + 1
    }
    this.snapshots.push(snapshot)

    // Auto-cleanup old snapshots to prevent memory leak
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift() // Remove oldest snapshot
    }
  }

  restoreSnapshot(version: number): boolean {
    const snapshot = this.snapshots.find(s => s.version === version)
    if (!snapshot) {
      return false
    }

    this.state = JSON.parse(JSON.stringify(snapshot.state))
    return true
  }

  // =============================================
  // EVENT MANAGEMENT
  // =============================================

  private recordEvent(type: GameEventType, data: Record<string, unknown>): void {
    const event: GameEvent = {
      id: generateEventId(),
      type,
      timestamp: new Date(),
      playerId: this.state.currentPlayerId,
      data
    }
    this.eventManager.recordEvent(event)
  }

  // =============================================
  // GETTERS
  // =============================================

  getState(): Readonly<GameStateData> {
    return Object.freeze(JSON.parse(JSON.stringify(this.state)))
  }

  getPlayer(playerId: string): GamePlayer | undefined {
    return this.state.players.find(p => p.id === playerId)
  }

  getPhase(): GamePhase {
    return this.state.phase
  }

  getStatus(): GameStatus {
    return this.state.status
  }

  getConfiguration(): GameConfiguration {
    return this.state.configuration
  }

  getEvents(): readonly GameEvent[] {
    return this.eventManager.getAllEvents()
  }

  getRecentEvents(limit: number = 100): readonly GameEvent[] {
    return this.eventManager.getRecentEvents(limit)
  }

  getCriticalEvents(): readonly GameEvent[] {
    return this.eventManager.getCriticalEvents()
  }

  getMemoryStats() {
    return {
      ...this.eventManager.getMemoryStats(),
      snapshots: this.snapshots.length
    }
  }

  clearEventHistory(preserveCritical: boolean = true): void {
    this.eventManager.clearHistory(preserveCritical)
  }

  updateMemoryConfig(config: Partial<MemoryConfig>): void {
    this.eventManager.updateConfig(config)
    if (config.maxSnapshots) {
      this.maxSnapshots = config.maxSnapshots
      // Trim snapshots if needed
      while (this.snapshots.length > this.maxSnapshots) {
        this.snapshots.shift()
      }
    }
  }

  isGameOver(): boolean {
    return this.state.phase.current === 'finished'
  }

  getCurrentPlayer(): GamePlayer | undefined {
    return this.state.currentPlayerId
      ? this.getPlayer(this.state.currentPlayerId)
      : undefined
  }

  // Get authorization manager for external use
  getAuthManager(): AuthorizationManager {
    return this.authManager
  }
}
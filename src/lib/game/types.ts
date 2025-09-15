/**
 * Core Game Type Definitions
 * Foundational interfaces and types for the Battleship Naval Strategy Game
 */

import {
  GameMode,
  GameStatus,
  MoveResult,
  ShipClass,
  PowerupType
} from '../database/types/enums'
// import { ShipType as DatabaseShipType } from '../database/types/ship' // For future use

// Re-export commonly used enums for convenience
export { ShipClass, GameMode, GameStatus, MoveResult, PowerupType }

// =============================================
// COORDINATE AND POSITION TYPES
// =============================================

export interface Coordinate {
  x: number
  y: number
}

export interface GridPosition extends Coordinate {
  isValid: boolean
  isOccupied: boolean
  isHit: boolean
  shipId?: string
}

export type Orientation = 'horizontal' | 'vertical'

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// =============================================
// SHIP TYPES
// =============================================

export interface ShipPosition {
  shipId: string
  coordinates: Coordinate[]
  orientation: Orientation
  startPosition: Coordinate
}

export interface ShipDamage {
  hitPositions: Coordinate[]
  totalHits: number
  isSunk: boolean
  sunkAt?: Date
}

export interface GameShip {
  id: string
  typeId: string
  name: string
  class: ShipClass
  size: number
  position?: ShipPosition
  damage: ShipDamage
  hitPoints: number
  maxHitPoints: number
  abilities: ShipAbility[]
  playerId: string
}

export interface ShipAbility {
  id: string
  name: string
  description: string
  cooldown: number
  currentCooldown: number
  uses: number
  remainingUses: number
  isActive: boolean
}

// =============================================
// BOARD TYPES
// =============================================

export interface BoardCell {
  coordinate: Coordinate
  hasShip: boolean
  shipId?: string
  isHit: boolean
  isRevealed: boolean
  hitBy?: string
  hitAt?: Date
}

export interface BoardState {
  width: number
  height: number
  cells: BoardCell[][]
  ships: Map<string, ShipPosition>
  hits: Coordinate[]
  misses: Coordinate[]
}

export interface BoardValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// =============================================
// PLAYER TYPES
// =============================================

export interface PlayerStats {
  shotsTotal: number
  shotsHit: number
  shotsMissed: number
  accuracy: number
  shipsRemaining: number
  shipsSunk: number
  damageDealt: number
  damageTaken: number
}

export interface PlayerTurn {
  playerId: string
  turnNumber: number
  startTime: Date
  endTime?: Date
  actions: GameAction[]
  timeUsed?: number
}

export interface GamePlayer {
  id: string
  userId?: string
  name: string
  isAI: boolean
  aiDifficulty?: AILevel
  board: BoardState
  fleet: GameShip[]
  stats: PlayerStats
  powerups: PlayerPowerup[]
  isReady: boolean
  isActive: boolean
  connectionStatus: ConnectionStatus
}

export type AILevel = 'easy' | 'medium' | 'hard' | 'expert'
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export interface PlayerPowerup {
  type: PowerupType
  uses: number
  remainingUses: number
  cooldown: number
  currentCooldown: number
  lastUsedTurn?: number
}

// =============================================
// GAME ACTION TYPES
// =============================================

export interface GameAction {
  id: string
  type: ActionType
  playerId: string
  timestamp: Date
  data: ActionData
}

export type ActionType =
  | 'place_ship'
  | 'attack'
  | 'use_powerup'
  | 'surrender'
  | 'timeout'

export type ActionData =
  | PlaceShipAction
  | AttackAction
  | PowerupAction
  | SurrenderAction

export interface PlaceShipAction {
  shipId: string
  startPosition: Coordinate
  orientation: Orientation
}

export interface AttackAction {
  targetCoordinate: Coordinate
  attackType: 'normal' | 'special'
  result?: AttackResult
}

export interface PowerupAction {
  powerupType: PowerupType
  targetArea?: Coordinate[]
  affectedShips?: string[]
}

export interface SurrenderAction {
  reason: string
  timestamp: Date
}

export interface AttackResult {
  coordinate: Coordinate
  result: MoveResult
  shipHit?: string
  shipSunk?: boolean
  shipType?: string
  damageDealt: number
  chainReaction?: AttackResult[]
}

// =============================================
// GAME STATE TYPES
// =============================================

export interface GamePhase {
  current: GamePhaseType
  startedAt: Date
  timeLimit?: number
  metadata?: Record<string, unknown>
}

export type GamePhaseType =
  | 'waiting'
  | 'setup'
  | 'ship_placement'
  | 'battle'
  | 'finished'

export interface GameConfiguration {
  mode: GameMode
  boardWidth: number
  boardHeight: number
  shipSetId?: string
  timeLimit?: number
  turnTimeLimit?: number
  allowPowerups: boolean
  fogOfWar: boolean
  allowReconnection: boolean
  maxReconnectionTime?: number
}

export interface GameTimers {
  gameStartTime?: Date
  turnStartTime?: Date
  totalGameTime: number
  currentTurnTime: number
  player1TotalTime: number
  player2TotalTime: number
  isPaused: boolean
  pauseStartTime?: Date
  totalPauseTime: number
}

export interface GameStateData {
  id: string
  configuration: GameConfiguration
  phase: GamePhase
  status: GameStatus
  players: GamePlayer[]
  currentPlayerId?: string
  turnNumber: number
  turns: PlayerTurn[]
  timers: GameTimers
  winnerId?: string
  endReason?: GameEndReason
  createdAt: Date
  startedAt?: Date
  finishedAt?: Date
}

export type GameEndReason =
  | 'all_ships_sunk'
  | 'surrender'
  | 'timeout'
  | 'disconnection'
  | 'draw'

// =============================================
// GAME EVENTS
// =============================================

export interface GameEvent {
  id: string
  type: GameEventType
  timestamp: Date
  playerId?: string
  data: Record<string, unknown>
}

export type GameEventType =
  | 'game_created'
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'phase_changed'
  | 'ship_placed'
  | 'turn_started'
  | 'attack_made'
  | 'ship_sunk'
  | 'powerup_used'
  | 'game_ended'
  | 'game_paused'
  | 'game_resumed'
  | 'player_disconnected'
  | 'player_reconnected'

// =============================================
// VALIDATION TYPES
// =============================================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  value?: unknown
}

// =============================================
// UTILITY TYPES
// =============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type GameUpdatePayload = DeepPartial<GameStateData>

export interface GameSnapshot {
  state: GameStateData
  timestamp: Date
  version: number
}
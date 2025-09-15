/**
 * Game Type Definitions
 * Game and game-related interfaces
 */

import { GameMode, GameStatus, MoveResult, PowerupType } from './enums'
import { User } from './user'
import { ShipType, ShipSet } from './ship'
import { Tournament } from './tournament'
import { Position, GameState } from './helpers'

export interface Game {
  id: string
  room_code?: string | null

  // Players
  player1_id?: string | null
  player2_id?: string | null
  player1?: User | null
  player2?: User | null

  // Configuration
  game_mode: GameMode
  board_width: number
  board_height: number
  ship_set_id?: string | null
  ship_set?: ShipSet | null
  time_limit?: number | null
  max_game_time?: number | null

  // State
  status: GameStatus
  game_state: GameState
  current_turn?: string | null
  winner_id?: string | null
  winner?: User | null
  turn_count: number

  // Rating changes
  player1_rating_change?: number | null
  player2_rating_change?: number | null

  // Timestamps
  created_at: Date
  started_at?: Date | null
  finished_at?: Date | null
  last_action_at: Date

  // Metadata
  is_ranked: boolean
  is_tournament: boolean
  tournament_id?: string | null
  tournament?: Tournament | null
  replay_data?: GameReplay | null
}

export interface GameMove {
  id: string
  game_id: string
  game?: Game
  player_id: string
  player?: User
  move_number: number

  // Move details
  x: number
  y: number
  result: MoveResult
  ship_type_id?: string | null
  ship_type?: ShipType | null
  damage_dealt: number

  // Special moves
  is_special_move: boolean
  powerup_used?: PowerupType | null
  affected_cells?: Position[] | null

  // Timing
  timestamp: Date
  response_time?: number | null
  think_time?: number | null
}

export interface GameReplay {
  id: string
  game_id: string
  game?: Game

  // Data
  version: number
  events: GameEvent[]
  initial_state: GameState
  final_state: GameState

  // Metadata
  duration_seconds?: number | null
  total_moves: number

  // Analysis
  interesting_moments?: InterestingMoment[] | null
  player1_accuracy?: number | null
  player2_accuracy?: number | null

  created_at: Date
}

export interface GameEvent {
  type: string
  timestamp: Date
  player_id?: string
  data: Record<string, any>
}

export interface InterestingMoment {
  timestamp: Date
  type: string
  description: string
  players_involved?: string[]
}

export interface ActiveGame {
  id: string
  room_code?: string | null
  player1_id?: string | null
  player1_username?: string | null
  player1_display_name?: string | null
  player1_rating?: number | null
  player2_id?: string | null
  player2_username?: string | null
  player2_display_name?: string | null
  player2_rating?: number | null
  game_mode: GameMode
  status: GameStatus
  current_turn?: string | null
  current_player_username?: string | null
  turn_count: number
  seconds_since_last_action: number
  created_at: Date
  started_at?: Date | null
  last_action_at: Date
}

export interface GameHistoryEntry {
  id: string
  room_code?: string | null
  player1_id?: string | null
  player1_username?: string | null
  player2_id?: string | null
  player2_username?: string | null
  game_mode: GameMode
  status: GameStatus
  winner_id?: string | null
  winner_username?: string | null
  turn_count: number
  created_at: Date
  started_at?: Date | null
  finished_at?: Date | null
  duration_seconds?: number | null
}
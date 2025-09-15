/**
 * Tournament Type Definitions
 * Tournament and competition-related interfaces
 */

import { TournamentFormat, TournamentStatus, GameMode } from './enums'
import { User } from './user'
import { ShipSet } from './ship'

export interface Tournament {
  id: string
  name: string
  description?: string | null

  // Configuration
  format: TournamentFormat
  max_participants: number
  current_participants: number

  // Rules
  game_mode: GameMode
  ship_set_id?: string | null
  ship_set?: ShipSet | null
  time_limit?: number | null
  board_size: number

  // Schedule
  registration_starts: Date
  registration_ends: Date
  tournament_starts: Date
  tournament_ends?: Date | null

  // Status
  status: TournamentStatus
  current_round: number

  // Prizes
  prize_pool: PrizePool
  entry_fee: number

  created_at: Date
  updated_at: Date
  created_by?: string | null
  creator?: User | null
}

export interface TournamentParticipant {
  id: string
  tournament_id: string
  tournament?: Tournament
  user_id: string
  user?: User

  // Progress
  current_round: number
  wins: number
  losses: number
  draws: number

  // Ranking
  seed?: number | null
  final_position?: number | null
  prize_won?: Prize | null

  // Status
  is_eliminated: boolean
  withdrew_at?: Date | null

  registered_at: Date
}

export interface TournamentStanding {
  tournament_id: string
  tournament_name: string
  user_id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  rating: number
  current_round: number
  wins: number
  losses: number
  draws: number
  points: number
  current_rank: number
  seed?: number | null
  is_eliminated: boolean
}

export interface PrizePool {
  total: number
  distribution: PrizeDistribution[]
}

export interface PrizeDistribution {
  position: number
  amount: number
  additional_rewards?: string[]
}

export interface Prize {
  amount: number
  additional_rewards?: string[]
}
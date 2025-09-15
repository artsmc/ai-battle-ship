/**
 * Statistics Type Definitions
 * Leaderboard and challenge-related interfaces
 */

import { ShipSet } from './ship'
import { User } from './user'
import { BoardConfig, ChallengeObjective } from './helpers'

export interface LeaderboardEntry {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  country_code?: string | null
  rating: number
  peak_rating: number
  level: number
  games_played: number
  games_won: number
  games_drawn: number
  win_rate: number
  accuracy: number
  ships_sunk: number
  perfect_games: number
  is_online: boolean
  last_active: Date
  global_rank: number
  country_rank?: number | null
}

export interface DailyChallenge {
  id: string
  challenge_date: Date

  // Configuration
  name: string
  description?: string | null
  board_config: BoardConfig
  ship_set_id?: string | null
  ship_set?: ShipSet | null

  // Objectives
  primary_objective: ChallengeObjective
  bonus_objectives: ChallengeObjective[]

  // Rewards
  base_reward: number
  bonus_rewards: Record<string, number>

  // Stats
  attempts: number
  completions: number
  perfect_completions: number

  created_at: Date
}

export interface UserChallenge {
  id: string
  user_id: string
  user?: User
  challenge_id: string
  challenge?: DailyChallenge

  // Attempts
  attempts: number
  completed: boolean
  best_score?: number | null
  moves_used?: number | null
  time_taken?: number | null

  // Objectives
  objectives_completed: string[]
  rewards_earned: Record<string, number>

  started_at: Date
  completed_at?: Date | null
}
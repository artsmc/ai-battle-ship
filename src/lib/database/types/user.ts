/**
 * User Type Definitions
 * User and user-related interfaces
 */

import { Achievement } from './social'

export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  country_code?: string | null
  preferred_language?: string

  // Statistics
  rating: number
  peak_rating: number
  games_played: number
  games_won: number
  games_drawn: number
  total_shots_fired: number
  total_hits: number
  ships_sunk: number
  perfect_games: number

  // Progression
  experience_points: number
  level: number
  achievements: Achievement[]
  unlocked_ships: string[]

  // Metadata
  created_at: Date
  updated_at: Date
  last_active: Date
  is_online: boolean
  is_ai: boolean
  is_premium: boolean
  banned_until?: Date | null
}

export interface UserSession {
  id: string
  user_id: string
  user?: User

  session_token: string
  ip_address?: string | null
  user_agent?: string | null

  started_at: Date
  last_activity: Date
  ended_at?: Date | null

  games_played: number
  chat_messages_sent: number
}
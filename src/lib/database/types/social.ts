/**
 * Social Type Definitions
 * Chat, friendship, and achievement-related interfaces
 */

import { MessageType, FriendshipStatus, AchievementCategory, AchievementRarity } from './enums'
import { Game } from './game'
import { User } from './user'

export interface ChatMessage {
  id: string
  game_id?: string | null
  game?: Game | null
  lobby_id?: string | null
  sender_id: string
  sender?: User
  recipient_id?: string | null
  recipient?: User | null

  message: string
  message_type: MessageType

  // Reactions
  reactions: Record<string, string[]> // emoji -> user_ids
  is_system_message: boolean
  is_deleted: boolean
  edited_at?: Date | null

  created_at: Date
}

export interface Friendship {
  id: string
  user1_id: string
  user1?: User
  user2_id: string
  user2?: User

  status: FriendshipStatus
  initiated_by: string
  initiator?: User

  created_at: Date
  accepted_at?: Date | null
}

export interface Achievement {
  id: string
  name: string
  description: string

  // Details
  category: AchievementCategory
  points: number
  icon_url?: string | null

  // Requirements
  requirement_type: string
  requirement_value: number
  requirement_details?: Record<string, any> | null

  // Rarity
  rarity: AchievementRarity

  // Stats
  times_earned: number

  is_active: boolean
  created_at: Date
}

export interface UserAchievement {
  id: string
  user_id: string
  user?: User
  achievement_id: string
  achievement?: Achievement

  earned_at: Date
  progress: number
}
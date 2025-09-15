/**
 * Ship Type Definitions
 * Ship and ship-related interfaces
 */

import { ShipClass, ShipEra } from './enums'
import { Game } from './game'
import { User } from './user'
import { Position } from './helpers'

export interface ShipType {
  id: string
  name: string
  class: ShipClass
  era: ShipEra
  size: number

  // Historical information
  country_of_origin?: string | null
  year_introduced?: number | null
  year_retired?: number | null
  displacement_tons?: number | null
  length_meters?: number | null
  beam_meters?: number | null
  draft_meters?: number | null
  max_speed_knots?: number | null
  crew_size?: number | null

  // Game mechanics
  hit_points: number
  armor_rating: number
  firepower_rating: number
  maneuverability: number
  detection_range: number
  special_abilities: SpecialAbility[]

  // Visual and descriptive
  description?: string | null
  historical_notes?: string | null
  image_url?: string | null
  model_3d_url?: string | null

  // Availability
  is_premium: boolean
  unlock_level: number
  unlock_cost: number
  is_active: boolean

  created_at: Date
  updated_at: Date
}

export interface ShipPlacement {
  id: string
  game_id: string
  game?: Game
  player_id: string
  player?: User
  ship_type_id: string
  ship_type?: ShipType

  // Position
  positions: Position[]
  orientation: 'horizontal' | 'vertical'

  // Damage
  is_sunk: boolean
  hits: number
  critical_hits: number
  damage_sections: DamageSection[]

  // Abilities
  abilities_used: string[]
  last_ability_turn?: number | null

  created_at: Date
}

export interface ShipSet {
  id: string
  name: string
  description?: string | null
  era?: ShipEra | null

  // Ships configuration
  ships: ShipSetConfig[]

  // Requirements
  min_board_size: number
  recommended_board_size: number

  // Availability
  is_default: boolean
  is_premium: boolean
  unlock_level: number

  created_at: Date
  updated_at: Date
}

export interface ShipSetConfig {
  ship_type_id?: string
  ship_type_name?: string
  count: number
}

export interface SpecialAbility {
  name: string
  description: string
  cooldown?: number
  uses?: number
}

export interface DamageSection {
  position: Position
  is_hit: boolean
  is_critical: boolean
}

export interface PrePlacedShip {
  ship_type_id: string
  positions: Position[]
  is_visible: boolean
}

export interface PlayerShipStats {
  id: string
  user_id: string
  user?: User
  ship_type_id: string
  ship_type?: ShipType

  times_used: number
  times_sunk: number
  total_hits_taken: number
  total_damage_dealt: number
  survival_rate?: number | null

  updated_at: Date
}
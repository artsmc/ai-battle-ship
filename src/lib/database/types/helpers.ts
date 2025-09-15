/**
 * Helper Type Definitions
 * Utility types and interfaces used across multiple modules
 */

import { MoveResult } from './enums'
import { PrePlacedShip } from './ship'

export interface Position {
  x: number
  y: number
}

export interface GameState {
  board_size?: number
  board_width?: number
  board_height?: number
  ships_per_player?: ShipConfig[]
  special_weapons?: SpecialWeapon[]
  fog_of_war?: boolean
  turn_time_limit?: number
  ships_remaining?: Record<string, number>
  last_shot?: LastShot
  [key: string]: any
}

export interface ShipConfig {
  type: string
  size: number
  count: number
}

export interface SpecialWeapon {
  type: string
  uses: number
  cooldown?: number
}

export interface LastShot {
  player: string
  x: number
  y: number
  result: MoveResult
}

export interface BoardConfig {
  width: number
  height: number
  pre_placed_ships?: PrePlacedShip[]
  obstacles?: Position[]
}

export interface ChallengeObjective {
  type: string
  description: string
  target_value?: number
  reward?: number
}
/**
 * Electric-SQL Schema Definition
 * Defines the database schema for Electric-SQL synchronization
 */

import { z } from 'zod'
import { GameMode, GameStatus, MessageType, MoveResult, ShipType } from './types'

// Position schema
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Ship configuration schema
const ShipConfigSchema = z.object({
  type: z.nativeEnum(ShipType),
  size: z.number(),
  count: z.number(),
})

// Special weapon schema
const SpecialWeaponSchema = z.object({
  type: z.string(),
  uses: z.number(),
  cooldown: z.number().optional(),
})

// Game state schema
const GameStateSchema = z.object({
  board_size: z.number(),
  ships_per_player: z.array(ShipConfigSchema),
  special_weapons: z.array(SpecialWeaponSchema).optional(),
  fog_of_war: z.boolean().optional(),
  turn_time_limit: z.number().optional(),
}).passthrough()

// User table schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password_hash: z.string(),
  display_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  rating: z.number().default(1200),
  games_played: z.number().default(0),
  games_won: z.number().default(0),
  created_at: z.date(),
  updated_at: z.date(),
  last_active: z.date(),
  is_online: z.boolean().default(false),
})

// Game table schema
export const GameSchema = z.object({
  id: z.string().uuid(),
  room_code: z.string().max(10).nullable().optional(),
  player1_id: z.string().uuid().nullable().optional(),
  player2_id: z.string().uuid().nullable().optional(),
  game_state: GameStateSchema,
  game_mode: z.nativeEnum(GameMode),
  status: z.nativeEnum(GameStatus),
  current_turn: z.string().uuid().nullable().optional(),
  winner_id: z.string().uuid().nullable().optional(),
  turn_count: z.number().default(0),
  time_limit: z.number().nullable().optional(),
  created_at: z.date(),
  started_at: z.date().nullable().optional(),
  finished_at: z.date().nullable().optional(),
  last_action_at: z.date(),
})

// Ship placement table schema
export const ShipPlacementSchema = z.object({
  id: z.string().uuid(),
  game_id: z.string().uuid(),
  player_id: z.string().uuid(),
  ship_type: z.nativeEnum(ShipType),
  positions: z.array(PositionSchema),
  is_sunk: z.boolean().default(false),
  hits: z.number().default(0),
  created_at: z.date(),
})

// Game move table schema
export const GameMoveSchema = z.object({
  id: z.string().uuid(),
  game_id: z.string().uuid(),
  player_id: z.string().uuid(),
  move_number: z.number(),
  x: z.number(),
  y: z.number(),
  result: z.nativeEnum(MoveResult),
  ship_type: z.nativeEnum(ShipType).nullable().optional(),
  timestamp: z.date(),
  response_time: z.number().nullable().optional(),
})

// Chat message table schema
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  game_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  message: z.string().max(500),
  message_type: z.nativeEnum(MessageType),
  created_at: z.date(),
})

// Electric-SQL schema definition
export const schema = {
  tables: {
    users: {
      columns: {
        id: { type: 'text', primaryKey: true },
        username: { type: 'text', unique: true, notNull: true },
        email: { type: 'text', unique: true, notNull: true },
        password_hash: { type: 'text', notNull: true },
        display_name: { type: 'text', nullable: true },
        avatar_url: { type: 'text', nullable: true },
        rating: { type: 'integer', default: 1200 },
        games_played: { type: 'integer', default: 0 },
        games_won: { type: 'integer', default: 0 },
        created_at: { type: 'text', default: 'CURRENT_TIMESTAMP' },
        updated_at: { type: 'text', default: 'CURRENT_TIMESTAMP' },
        last_active: { type: 'text', default: 'CURRENT_TIMESTAMP' },
        is_online: { type: 'integer', default: 0 },
      },
      relations: {
        player1Games: {
          type: 'one-to-many',
          foreignKey: 'player1_id',
          references: 'games',
        },
        player2Games: {
          type: 'one-to-many',
          foreignKey: 'player2_id',
          references: 'games',
        },
        shipPlacements: {
          type: 'one-to-many',
          foreignKey: 'player_id',
          references: 'ship_placements',
        },
        gameMoves: {
          type: 'one-to-many',
          foreignKey: 'player_id',
          references: 'game_moves',
        },
        chatMessages: {
          type: 'one-to-many',
          foreignKey: 'sender_id',
          references: 'chat_messages',
        },
      },
    },
    games: {
      columns: {
        id: { type: 'text', primaryKey: true },
        room_code: { type: 'text', unique: true, nullable: true },
        player1_id: { type: 'text', nullable: true },
        player2_id: { type: 'text', nullable: true },
        game_state: { type: 'text', notNull: true, default: '{}' },
        game_mode: { type: 'text', notNull: true, default: 'classic' },
        status: { type: 'text', notNull: true, default: 'waiting' },
        current_turn: { type: 'text', nullable: true },
        winner_id: { type: 'text', nullable: true },
        turn_count: { type: 'integer', default: 0 },
        time_limit: { type: 'integer', nullable: true },
        created_at: { type: 'text', default: 'CURRENT_TIMESTAMP' },
        started_at: { type: 'text', nullable: true },
        finished_at: { type: 'text', nullable: true },
        last_action_at: { type: 'text', default: 'CURRENT_TIMESTAMP' },
      },
      relations: {
        player1: {
          type: 'many-to-one',
          column: 'player1_id',
          references: 'users',
        },
        player2: {
          type: 'many-to-one',
          column: 'player2_id',
          references: 'users',
        },
        winner: {
          type: 'many-to-one',
          column: 'winner_id',
          references: 'users',
        },
        shipPlacements: {
          type: 'one-to-many',
          foreignKey: 'game_id',
          references: 'ship_placements',
        },
        gameMoves: {
          type: 'one-to-many',
          foreignKey: 'game_id',
          references: 'game_moves',
        },
        chatMessages: {
          type: 'one-to-many',
          foreignKey: 'game_id',
          references: 'chat_messages',
        },
      },
    },
    ship_placements: {
      columns: {
        id: { type: 'text', primaryKey: true },
        game_id: { type: 'text', notNull: true },
        player_id: { type: 'text', notNull: true },
        ship_type: { type: 'text', notNull: true },
        positions: { type: 'text', notNull: true },
        is_sunk: { type: 'integer', default: 0 },
        hits: { type: 'integer', default: 0 },
        created_at: { type: 'text', default: 'CURRENT_TIMESTAMP' },
      },
      relations: {
        game: {
          type: 'many-to-one',
          column: 'game_id',
          references: 'games',
        },
        player: {
          type: 'many-to-one',
          column: 'player_id',
          references: 'users',
        },
      },
      constraints: {
        unique: ['game_id', 'player_id', 'ship_type'],
      },
    },
    game_moves: {
      columns: {
        id: { type: 'text', primaryKey: true },
        game_id: { type: 'text', notNull: true },
        player_id: { type: 'text', notNull: true },
        move_number: { type: 'integer', notNull: true },
        x: { type: 'integer', notNull: true },
        y: { type: 'integer', notNull: true },
        result: { type: 'text', notNull: true },
        ship_type: { type: 'text', nullable: true },
        timestamp: { type: 'text', default: 'CURRENT_TIMESTAMP' },
        response_time: { type: 'integer', nullable: true },
      },
      relations: {
        game: {
          type: 'many-to-one',
          column: 'game_id',
          references: 'games',
        },
        player: {
          type: 'many-to-one',
          column: 'player_id',
          references: 'users',
        },
      },
      constraints: {
        unique: ['game_id', 'move_number'],
      },
    },
    chat_messages: {
      columns: {
        id: { type: 'text', primaryKey: true },
        game_id: { type: 'text', notNull: true },
        sender_id: { type: 'text', notNull: true },
        message: { type: 'text', notNull: true },
        message_type: { type: 'text', default: 'text' },
        created_at: { type: 'text', default: 'CURRENT_TIMESTAMP' },
      },
      relations: {
        game: {
          type: 'many-to-one',
          column: 'game_id',
          references: 'games',
        },
        sender: {
          type: 'many-to-one',
          column: 'sender_id',
          references: 'users',
        },
      },
    },
  },
}

// Type exports for validation
export type UserInput = z.infer<typeof UserSchema>
export type GameInput = z.infer<typeof GameSchema>
export type ShipPlacementInput = z.infer<typeof ShipPlacementSchema>
export type GameMoveInput = z.infer<typeof GameMoveSchema>
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>
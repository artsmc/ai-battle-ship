/**
 * Electric-SQL Type Definitions
 * TypeScript types for database models and Electric-SQL operations
 */

// User model
export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  display_name?: string | null
  avatar_url?: string | null
  rating: number
  games_played: number
  games_won: number
  created_at: Date
  updated_at: Date
  last_active: Date
  is_online: boolean
}

// Game status enum
export enum GameStatus {
  WAITING = 'waiting',
  SETUP = 'setup',
  PLAYING = 'playing',
  FINISHED = 'finished',
  ABANDONED = 'abandoned',
}

// Game mode enum
export enum GameMode {
  CLASSIC = 'classic',
  ADVANCED = 'advanced',
  BLITZ = 'blitz',
}

// Game model
export interface Game {
  id: string
  room_code?: string | null
  player1_id?: string | null
  player2_id?: string | null
  game_state: GameState
  game_mode: GameMode
  status: GameStatus
  current_turn?: string | null
  winner_id?: string | null
  turn_count: number
  time_limit?: number | null
  created_at: Date
  started_at?: Date | null
  finished_at?: Date | null
  last_action_at: Date
}

// Game state structure
export interface GameState {
  board_size: number
  ships_per_player: ShipConfig[]
  special_weapons?: SpecialWeapon[]
  fog_of_war?: boolean
  turn_time_limit?: number
  [key: string]: unknown
}

// Ship configuration
export interface ShipConfig {
  type: ShipType
  size: number
  count: number
}

// Ship types enum
export enum ShipType {
  CARRIER = 'carrier',
  BATTLESHIP = 'battleship',
  CRUISER = 'cruiser',
  SUBMARINE = 'submarine',
  DESTROYER = 'destroyer',
}

// Special weapons (for advanced mode)
export interface SpecialWeapon {
  type: string
  uses: number
  cooldown?: number
}

// Position on the game board
export interface Position {
  x: number
  y: number
}

// Ship placement model
export interface ShipPlacement {
  id: string
  game_id: string
  player_id: string
  ship_type: ShipType
  positions: Position[]
  is_sunk: boolean
  hits: number
  created_at: Date
}

// Move result enum
export enum MoveResult {
  HIT = 'hit',
  MISS = 'miss',
  SUNK = 'sunk',
}

// Game move model
export interface GameMove {
  id: string
  game_id: string
  player_id: string
  move_number: number
  x: number
  y: number
  result: MoveResult
  ship_type?: ShipType | null
  timestamp: Date
  response_time?: number | null
}

// Message type enum
export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  SYSTEM = 'system',
}

// Chat message model
export interface ChatMessage {
  id: string
  game_id: string
  sender_id: string
  message: string
  message_type: MessageType
  created_at: Date
}

// Leaderboard entry
export interface LeaderboardEntry {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  rating: number
  games_played: number
  games_won: number
  win_rate: number
  is_online: boolean
  last_active: Date
}

// Game history entry
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

// Electric-SQL specific types
export interface ElectricShape<T> {
  data: T[]
  synced: boolean
  loading: boolean
  error?: Error | null
}

export interface ElectricSubscription {
  unsubscribe: () => void
}

export interface ElectricClient {
  db: ElectricDatabase
  sync: ElectricSync
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: () => boolean
}

export interface ElectricDatabase {
  users: ElectricTable<User>
  games: ElectricTable<Game>
  ship_placements: ElectricTable<ShipPlacement>
  game_moves: ElectricTable<GameMove>
  chat_messages: ElectricTable<ChatMessage>
}

export interface ElectricTable<T> {
  findMany: (options?: FindManyOptions<T>) => Promise<T[]>
  findUnique: (options: FindUniqueOptions) => Promise<T | null>
  create: (data: Partial<T>) => Promise<T>
  update: (options: UpdateOptions<T>) => Promise<T>
  delete: (options: DeleteOptions) => Promise<void>
  subscribe: (callback: (data: T[]) => void) => ElectricSubscription
}

export interface FindManyOptions<T> {
  where?: Partial<T>
  orderBy?: OrderByOption[]
  limit?: number
  offset?: number
}

export interface FindUniqueOptions {
  where: {
    id: string
  }
}

export interface UpdateOptions<T> {
  where: {
    id: string
  }
  data: Partial<T>
}

export interface DeleteOptions {
  where: {
    id: string
  }
}

export interface OrderByOption {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface ElectricSync {
  status: SyncStatus
  subscribe: (shape: ShapeDefinition) => Promise<ElectricSubscription>
  unsubscribe: (subscription: ElectricSubscription) => void
  syncNow: () => Promise<void>
  clearLocal: () => Promise<void>
}

export interface SyncStatus {
  connected: boolean
  syncing: boolean
  lastSyncedAt?: Date | null
  pendingChanges: number
}

export interface ShapeDefinition {
  table: string
  where?: string | ((params: unknown) => string)
  include?: IncludeDefinition[]
  orderBy?: OrderByOption[]
  limit?: number
}

export interface IncludeDefinition {
  table?: string
  as?: string
  foreignKey: string
  where?: string
}
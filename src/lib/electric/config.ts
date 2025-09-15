/**
 * Electric-SQL Configuration
 * Core configuration for Electric-SQL client initialization
 */

// Electric-SQL configuration types will be imported when needed

// Environment-based configuration
export const electricConfig = {
  // Service configuration
  service: {
    url: process.env.NEXT_PUBLIC_ELECTRIC_SERVICE_URL || 'http://localhost:5133',
    headers: {
      'Content-Type': 'application/json',
    },
  },

  // Database configuration
  database: {
    name: 'battleship_local.db',
    version: 1,
  },

  // Replication configuration
  replication: {
    // Sync interval in milliseconds
    syncInterval: 5000,
    // Maximum batch size for syncing
    batchSize: 100,
    // Enable compression for sync payloads
    compression: true,
    // Conflict resolution strategy
    conflictResolution: 'last-write-wins' as const,
  },

  // Connection configuration
  connection: {
    // Reconnection settings
    reconnect: true,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    reconnectDelayMultiplier: 1.5,
    maxReconnectAttempts: 10,
    // Heartbeat settings
    heartbeatInterval: 30000,
    // Connection timeout
    connectionTimeout: 10000,
  },

  // Debug configuration
  debug: process.env.NODE_ENV === 'development',
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
} as const

// Electric database configuration for migrations
export const electricDatabaseConfig = {
  // PostgreSQL connection for Electric service
  postgresUrl: process.env.ELECTRIC_DATABASE_URL ||
    'postgresql://electric:electric_pass@localhost:5432/battleship_db',

  // Electric service authentication
  auth: {
    mode: process.env.ELECTRIC_AUTH_MODE || 'insecure',
    token: process.env.ELECTRIC_AUTH_TOKEN,
  },

  // Write mode configuration
  writeMode: process.env.ELECTRIC_WRITE_TO_PG_MODE || 'logical_replication',
} as const

// Table names for Electric-SQL sync
export const ELECTRIC_TABLES = {
  users: 'users',
  games: 'games',
  shipPlacements: 'ship_placements',
  gameMoves: 'game_moves',
  chatMessages: 'chat_messages',
} as const

// Shape definitions for Electric-SQL subscriptions
export const ELECTRIC_SHAPES = {
  // User profile and stats
  userProfile: {
    table: ELECTRIC_TABLES.users,
    include: {
      games: {
        as: 'player1Games',
        foreignKey: 'player1_id',
      },
    },
  },

  // Active game with all related data
  activeGame: {
    table: ELECTRIC_TABLES.games,
    include: {
      shipPlacements: {
        foreignKey: 'game_id',
      },
      gameMoves: {
        foreignKey: 'game_id',
      },
      chatMessages: {
        foreignKey: 'game_id',
      },
    },
  },

  // Leaderboard data
  leaderboard: {
    table: ELECTRIC_TABLES.users,
    where: 'games_played >= 5',
    orderBy: [{ column: 'rating', direction: 'DESC' }],
    limit: 100,
  },

  // Game history for a user
  gameHistory: {
    table: ELECTRIC_TABLES.games,
    where: (userId: string) =>
      `player1_id = '${userId}' OR player2_id = '${userId}'`,
    orderBy: [{ column: 'created_at', direction: 'DESC' }],
    limit: 50,
  },
} as const

// Export type for use in other modules
export type ElectricConfigType = typeof electricConfig
export type ElectricTables = typeof ELECTRIC_TABLES
export type ElectricShapes = typeof ELECTRIC_SHAPES
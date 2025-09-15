/**
 * Game Constants
 * Configuration constants for the Battleship Naval Strategy Game
 */

import { ShipClass, GameMode, PowerupType } from '../../database/types/enums'

// =============================================
// BOARD CONSTANTS
// =============================================

export const BOARD_DIMENSIONS = {
  MIN_WIDTH: 5,
  MAX_WIDTH: 20,
  MIN_HEIGHT: 5,
  MAX_HEIGHT: 20,
  DEFAULT_WIDTH: 10,
  DEFAULT_HEIGHT: 10,
  TOURNAMENT_WIDTH: 12,
  TOURNAMENT_HEIGHT: 12
} as const

export const BOARD_PRESETS = {
  SMALL: { width: 8, height: 8 },
  MEDIUM: { width: 10, height: 10 },
  LARGE: { width: 12, height: 12 },
  EXTRA_LARGE: { width: 15, height: 15 }
} as const

// =============================================
// SHIP CONSTANTS
// =============================================

export const STANDARD_FLEET = [
  { class: ShipClass.CARRIER, size: 5, count: 1, name: 'Carrier' },
  { class: ShipClass.BATTLESHIP, size: 4, count: 1, name: 'Battleship' },
  { class: ShipClass.HEAVY_CRUISER, size: 3, count: 1, name: 'Heavy Cruiser' },
  { class: ShipClass.SUBMARINE, size: 3, count: 1, name: 'Submarine' },
  { class: ShipClass.DESTROYER, size: 2, count: 1, name: 'Destroyer' }
] as const

export const SHIP_SIZES: Record<ShipClass, number> = {
  [ShipClass.CARRIER]: 5,
  [ShipClass.BATTLESHIP]: 4,
  [ShipClass.BATTLECRUISER]: 4,
  [ShipClass.HEAVY_CRUISER]: 3,
  [ShipClass.LIGHT_CRUISER]: 3,
  [ShipClass.DESTROYER]: 2,
  [ShipClass.SUBMARINE]: 3,
  [ShipClass.FRIGATE]: 2,
  [ShipClass.CORVETTE]: 1,
  [ShipClass.PATROL_BOAT]: 1
}

export const SHIP_HEALTH_MULTIPLIERS: Record<ShipClass, number> = {
  [ShipClass.CARRIER]: 1.2,
  [ShipClass.BATTLESHIP]: 1.5,
  [ShipClass.BATTLECRUISER]: 1.3,
  [ShipClass.HEAVY_CRUISER]: 1.2,
  [ShipClass.LIGHT_CRUISER]: 1.0,
  [ShipClass.DESTROYER]: 0.8,
  [ShipClass.SUBMARINE]: 0.9,
  [ShipClass.FRIGATE]: 0.7,
  [ShipClass.CORVETTE]: 0.6,
  [ShipClass.PATROL_BOAT]: 0.5
}

export const MAX_SHIPS_PER_CLASS: Record<ShipClass, number> = {
  [ShipClass.CARRIER]: 1,
  [ShipClass.BATTLESHIP]: 1,
  [ShipClass.BATTLECRUISER]: 1,
  [ShipClass.HEAVY_CRUISER]: 2,
  [ShipClass.LIGHT_CRUISER]: 2,
  [ShipClass.DESTROYER]: 3,
  [ShipClass.SUBMARINE]: 2,
  [ShipClass.FRIGATE]: 3,
  [ShipClass.CORVETTE]: 4,
  [ShipClass.PATROL_BOAT]: 5
}

// =============================================
// GAME MODE CONSTANTS
// =============================================

export const GAME_MODE_SETTINGS = {
  [GameMode.CLASSIC]: {
    boardWidth: 10,
    boardHeight: 10,
    turnTimeLimit: 60000,
    allowPowerups: false,
    fogOfWar: true,
    fleetSize: 5
  },
  [GameMode.ADVANCED]: {
    boardWidth: 12,
    boardHeight: 12,
    turnTimeLimit: 90000,
    allowPowerups: true,
    fogOfWar: true,
    fleetSize: 7
  },
  [GameMode.BLITZ]: {
    boardWidth: 8,
    boardHeight: 8,
    turnTimeLimit: 30000,
    allowPowerups: false,
    fogOfWar: true,
    fleetSize: 3
  },
  [GameMode.CAMPAIGN]: {
    boardWidth: 10,
    boardHeight: 10,
    turnTimeLimit: 120000,
    allowPowerups: true,
    fogOfWar: false,
    fleetSize: 6
  },
  [GameMode.HISTORICAL]: {
    boardWidth: 14,
    boardHeight: 14,
    turnTimeLimit: 180000,
    allowPowerups: false,
    fogOfWar: true,
    fleetSize: 8
  },
  [GameMode.TOURNAMENT]: {
    boardWidth: 12,
    boardHeight: 12,
    turnTimeLimit: 120000,
    allowPowerups: true,
    fogOfWar: true,
    fleetSize: 6
  }
} as const

// =============================================
// TIMING CONSTANTS
// =============================================

export const TIME_LIMITS = {
  MIN_TURN_TIME: 10000,        // 10 seconds
  DEFAULT_TURN_TIME: 60000,    // 1 minute
  MAX_TURN_TIME: 300000,       // 5 minutes
  MIN_GAME_TIME: 300000,       // 5 minutes
  DEFAULT_GAME_TIME: 1800000,  // 30 minutes
  MAX_GAME_TIME: 7200000,      // 2 hours
  SHIP_PLACEMENT_TIME: 300000, // 5 minutes
  RECONNECTION_TIME: 120000,   // 2 minutes
  AI_THINK_TIME: 2000         // 2 seconds
} as const

// =============================================
// POWERUP CONSTANTS
// =============================================

export const POWERUP_SETTINGS = {
  [PowerupType.RADAR_SCAN]: {
    uses: 3,
    cooldown: 3,
    radius: 2,
    description: 'Reveals ships in a 5x5 area'
  },
  [PowerupType.BARRAGE]: {
    uses: 1,
    cooldown: 5,
    shots: 5,
    description: 'Fire 5 shots in one turn'
  },
  [PowerupType.SONAR_PING]: {
    uses: 2,
    cooldown: 4,
    range: 3,
    description: 'Detects ships along a line'
  },
  [PowerupType.SMOKE_SCREEN]: {
    uses: 2,
    cooldown: 3,
    duration: 2,
    description: 'Protects an area for 2 turns'
  },
  [PowerupType.REPAIR_KIT]: {
    uses: 1,
    cooldown: 0,
    healAmount: 2,
    description: 'Repairs 2 damage to a ship'
  },
  [PowerupType.TORPEDO_SALVO]: {
    uses: 1,
    cooldown: 6,
    damage: 2,
    description: 'Deals double damage'
  },
  [PowerupType.AIR_STRIKE]: {
    uses: 1,
    cooldown: 8,
    radius: 1,
    description: 'Attacks a 3x3 area'
  }
} as const

// =============================================
// AI DIFFICULTY CONSTANTS
// =============================================

export const AI_DIFFICULTY_SETTINGS = {
  easy: {
    accuracy: 0.3,
    thinkTime: 1000,
    usesPowerups: false,
    smartTargeting: false,
    memoryTurns: 0
  },
  medium: {
    accuracy: 0.5,
    thinkTime: 1500,
    usesPowerups: true,
    smartTargeting: true,
    memoryTurns: 3
  },
  hard: {
    accuracy: 0.7,
    thinkTime: 2000,
    usesPowerups: true,
    smartTargeting: true,
    memoryTurns: 5
  },
  expert: {
    accuracy: 0.9,
    thinkTime: 2500,
    usesPowerups: true,
    smartTargeting: true,
    memoryTurns: 10
  }
} as const

// =============================================
// SCORING CONSTANTS
// =============================================

export const SCORING = {
  HIT_POINTS: 10,
  MISS_PENALTY: -2,
  SINK_BONUS: 50,
  FIRST_BLOOD_BONUS: 25,
  PERFECT_GAME_BONUS: 100,
  ACCURACY_MULTIPLIER: 1.5,
  TIME_BONUS_PER_SECOND: 0.5,
  SHIP_SURVIVAL_BONUS: 20,
  POWERUP_EFFICIENCY_BONUS: 15
} as const

// =============================================
// ACHIEVEMENT THRESHOLDS
// =============================================

export const ACHIEVEMENT_THRESHOLDS = {
  SHARPSHOOTER: { accuracy: 75, games: 10 },
  FLEET_COMMANDER: { wins: 50 },
  PERFECT_GAME: { accuracy: 100, shipsLost: 0 },
  SPEED_DEMON: { turnTime: 15000, wins: 10 },
  SURVIVOR: { shipsRemaining: 4, wins: 20 },
  VETERAN: { gamesPlayed: 100 },
  LEGEND: { wins: 500, winRate: 70 }
} as const

// =============================================
// VISUAL CONSTANTS
// =============================================

export const CELL_STATES = {
  EMPTY: 'empty',
  SHIP: 'ship',
  HIT: 'hit',
  MISS: 'miss',
  SUNK: 'sunk',
  ADJACENT: 'adjacent',
  TARGETED: 'targeted',
  PREVIEW: 'preview'
} as const

export const ANIMATION_DURATIONS = {
  SHIP_PLACEMENT: 300,
  ATTACK_HIT: 500,
  ATTACK_MISS: 300,
  SHIP_SINK: 1000,
  POWERUP_ACTIVATE: 400,
  BOARD_TRANSITION: 600,
  CELL_REVEAL: 200
} as const

// =============================================
// NETWORK CONSTANTS
// =============================================

export const NETWORK_SETTINGS = {
  HEARTBEAT_INTERVAL: 5000,
  SYNC_INTERVAL: 1000,
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000,
  REQUEST_TIMEOUT: 10000,
  MAX_LATENCY: 500
} as const

// =============================================
// VALIDATION CONSTANTS
// =============================================

export const VALIDATION_LIMITS = {
  MIN_PLAYER_NAME: 1,
  MAX_PLAYER_NAME: 50,
  MIN_ROOM_CODE: 4,
  MAX_ROOM_CODE: 8,
  MAX_CHAT_MESSAGE: 200,
  MAX_GAME_HISTORY: 100,
  MAX_REPLAY_SIZE: 10485760 // 10MB
} as const

// =============================================
// DEFAULT VALUES
// =============================================

export const DEFAULTS = {
  BOARD_WIDTH: BOARD_DIMENSIONS.DEFAULT_WIDTH,
  BOARD_HEIGHT: BOARD_DIMENSIONS.DEFAULT_HEIGHT,
  GAME_MODE: GameMode.CLASSIC,
  AI_DIFFICULTY: 'medium',
  TURN_TIME_LIMIT: TIME_LIMITS.DEFAULT_TURN_TIME,
  ALLOW_POWERUPS: false,
  FOG_OF_WAR: true,
  ALLOW_RECONNECTION: true,
  MAX_RECONNECTION_TIME: TIME_LIMITS.RECONNECTION_TIME
} as const
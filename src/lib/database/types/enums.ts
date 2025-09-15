/**
 * Enum Type Definitions
 * All enumeration types used across the database schema
 */

// =============================================
// SHIP ENUMS
// =============================================

export enum ShipEra {
  PRE_DREADNOUGHT = 'pre_dreadnought',
  DREADNOUGHT = 'dreadnought',
  SUPER_DREADNOUGHT = 'super_dreadnought',
  BATTLECRUISER = 'battlecruiser',
  MODERN = 'modern',
  FICTIONAL = 'fictional'
}

export enum ShipClass {
  CARRIER = 'carrier',
  BATTLESHIP = 'battleship',
  BATTLECRUISER = 'battlecruiser',
  HEAVY_CRUISER = 'heavy_cruiser',
  LIGHT_CRUISER = 'light_cruiser',
  DESTROYER = 'destroyer',
  SUBMARINE = 'submarine',
  FRIGATE = 'frigate',
  CORVETTE = 'corvette',
  PATROL_BOAT = 'patrol_boat'
}

// =============================================
// GAME ENUMS
// =============================================

export enum GameMode {
  CLASSIC = 'classic',
  ADVANCED = 'advanced',
  BLITZ = 'blitz',
  CAMPAIGN = 'campaign',
  HISTORICAL = 'historical',
  TOURNAMENT = 'tournament'
}

export enum GameStatus {
  WAITING = 'waiting',
  SETUP = 'setup',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished',
  ABANDONED = 'abandoned'
}

export enum MoveResult {
  MISS = 'miss',
  HIT = 'hit',
  SUNK = 'sunk',
  CRITICAL_HIT = 'critical_hit',
  NEAR_MISS = 'near_miss'
}

export enum PowerupType {
  RADAR_SCAN = 'radar_scan',
  BARRAGE = 'barrage',
  SONAR_PING = 'sonar_ping',
  SMOKE_SCREEN = 'smoke_screen',
  REPAIR_KIT = 'repair_kit',
  TORPEDO_SALVO = 'torpedo_salvo',
  AIR_STRIKE = 'air_strike'
}

// =============================================
// SOCIAL ENUMS
// =============================================

export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  SYSTEM = 'system'
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked'
}

// =============================================
// TOURNAMENT ENUMS
// =============================================

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss'
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  REGISTRATION = 'registration',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// =============================================
// ACHIEVEMENT ENUMS
// =============================================

export enum AchievementCategory {
  COMBAT = 'combat',
  SOCIAL = 'social',
  PROGRESSION = 'progression',
  SPECIAL = 'special'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}
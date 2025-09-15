/**
 * Ability System Type Definitions
 * Core types and interfaces for the ship ability framework
 */

import { Coordinate, GameShip, GamePlayer, BoardState } from '../../game/types'
import { ShipClass, ShipEra, MoveResult } from '../../database/types/enums'

// =============================================
// ABILITY ENUMS
// =============================================

export enum AbilityType {
  ACTIVE = 'active',       // Player-activated abilities
  PASSIVE = 'passive',     // Always active abilities
  TRIGGERED = 'triggered'  // Activate on conditions
}

export enum AbilityCategory {
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  DETECTION = 'detection',
  MOVEMENT = 'movement',
  SUPPORT = 'support'
}

export enum AbilityTrigger {
  ON_ATTACK = 'on_attack',
  ON_HIT = 'on_hit',
  ON_DAMAGE = 'on_damage',
  ON_TURN_START = 'on_turn_start',
  ON_TURN_END = 'on_turn_end',
  ON_SHIP_SUNK = 'on_ship_sunk',
  ON_CRITICAL_HIT = 'on_critical_hit'
}

export enum AbilityTargetType {
  SELF = 'self',
  SINGLE_COORDINATE = 'single_coordinate',
  AREA = 'area',
  LINE = 'line',
  SHIP = 'ship',
  FLEET = 'fleet',
  ENEMY_SHIP = 'enemy_ship',
  ENEMY_FLEET = 'enemy_fleet'
}

// =============================================
// ABILITY EFFECTS
// =============================================

export interface AbilityEffect {
  type: string
  magnitude: number
  duration?: number  // Number of turns
  stackable?: boolean
}

export interface DamageBoostEffect extends AbilityEffect {
  type: 'damage_boost'
  damageMultiplier: number
  attackTypes?: string[]
}

export interface RevealEffect extends AbilityEffect {
  type: 'reveal'
  revealRadius: number
  revealDuration: number
}

export interface StealthEffect extends AbilityEffect {
  type: 'stealth'
  detectionResistance: number
  breakOnAttack: boolean
}

export interface MovementEffect extends AbilityEffect {
  type: 'movement'
  allowExtraMove: boolean
  movementRange: number
}

export interface DetectionEffect extends AbilityEffect {
  type: 'detection'
  detectionRange: number
  detectHidden: boolean
  detectSubmarine: boolean
}

// =============================================
// ABILITY DEFINITIONS
// =============================================

export interface AbilityDefinition {
  id: string
  name: string
  description: string
  type: AbilityType
  category: AbilityCategory
  targetType: AbilityTargetType

  // Activation requirements
  requiredShipClass?: ShipClass[]
  requiredEra?: ShipEra[]
  minShipSize?: number

  // Resource costs
  cooldownTurns: number
  maxUses?: number
  energyCost?: number

  // Effects
  effects: AbilityEffect[]

  // Triggers (for triggered abilities)
  triggers?: AbilityTrigger[]

  // Validation
  canActivate?: (context: AbilityContext) => boolean

  // Visual/UI
  icon?: string
  sound?: string
  animation?: string
}

// =============================================
// ABILITY RUNTIME
// =============================================

export interface AbilityInstance {
  definitionId: string
  shipId: string
  playerId: string

  // State
  isActive: boolean
  currentCooldown: number
  remainingUses?: number

  // Active effects
  activeEffects: ActiveEffect[]

  // Statistics
  timesUsed: number
  lastUsedTurn?: number
  totalDamageDealt?: number
  totalDamageBlocked?: number
}

export interface ActiveEffect {
  id: string
  effect: AbilityEffect
  startTurn: number
  remainingDuration: number
  source: {
    abilityId: string
    shipId: string
    playerId: string
  }
  target?: {
    type: 'coordinate' | 'ship' | 'area' | 'fleet'
    value: Coordinate | string | Coordinate[]
  }
}

// =============================================
// ABILITY EXECUTION
// =============================================

export interface AbilityContext {
  ability: AbilityInstance
  ship: GameShip
  player: GamePlayer
  opponent?: GamePlayer
  boardState: BoardState
  currentTurn: number

  // Additional context for different ability types
  attackContext?: {
    coordinate: Coordinate
    result: MoveResult
    damage: number
  }

  damageContext?: {
    source: string
    amount: number
    isCritical: boolean
  }

  targetData?: {
    coordinates?: Coordinate[]
    ships?: GameShip[]
  }
}

export interface AbilityExecutionResult {
  success: boolean
  effects: AppliedEffect[]
  messages: string[]
  errors?: string[]

  // Side effects
  damageDealt?: number
  shipsRevealed?: string[]
  coordinatesRevealed?: Coordinate[]
  statusEffectsApplied?: ActiveEffect[]
}

export interface AppliedEffect {
  type: string
  target: string | Coordinate | Coordinate[]
  magnitude: number
  description: string
}

// =============================================
// ABILITY VALIDATION
// =============================================

export interface AbilityValidation {
  canActivate: boolean
  reason?: string
  missingRequirements?: string[]

  cooldownRemaining?: number
  usesRemaining?: number
  energyRequired?: number
  energyAvailable?: number
}

// =============================================
// ABILITY SYNC (for multiplayer)
// =============================================

export interface AbilityActivationEvent {
  id: string
  timestamp: Date
  playerId: string
  shipId: string
  abilityId: string
  targetData?: unknown
  result: AbilityExecutionResult
}

export interface AbilitySyncData {
  abilityStates: Map<string, AbilityInstance>
  activeEffects: ActiveEffect[]
  pendingActivations: AbilityActivationEvent[]
}

// =============================================
// ABILITY REGISTRY
// =============================================

export interface AbilityRegistry {
  definitions: Map<string, AbilityDefinition>
  shipAbilities: Map<ShipClass, string[]>  // Ship class to ability IDs
  eraAbilities: Map<ShipEra, string[]>     // Era to ability IDs
}
/**
 * Combat Module Exports
 * Central export point for all combat-related functionality
 */

export { CombatEngine } from './CombatEngine'
export type {
  CombatConfig,
  CombatTurn,
  CombatAction,
  CombatStatistics
} from './CombatEngine'

export { AttackProcessor } from './AttackProcessor'
export type {
  AttackInfo,
  ProcessedAttack
} from './AttackProcessor'

export { HitDetector } from './HitDetector'
export type {
  HitDetectionResult,
  ProximityInfo
} from './HitDetector'

export { DamageCalculator } from './DamageCalculator'
export type {
  DamageCalculation,
  ShipVulnerability
} from './DamageCalculator'

export { WinConditions } from './WinConditions'
export type {
  WinConditionResult,
  GameEndStatistics,
  DrawCondition
} from './WinConditions'

export { CombatValidator } from './CombatValidator'
export type {
  AttackValidation,
  PowerupValidation
} from './CombatValidator'

/**
 * Factory function to create a complete combat system
 */
import { GameState } from '../GameState'
import { CombatEngine, CombatConfig } from './CombatEngine'

export function createCombatSystem(
  gameState: GameState,
  config?: Partial<CombatConfig>
): CombatEngine {
  const defaultConfig: CombatConfig = {
    allowPowerups: true,
    fogOfWar: true,
    turnTimeLimit: 60000, // 60 seconds
    enableSpecialAbilities: true
  }

  const finalConfig = { ...defaultConfig, ...config }
  return new CombatEngine(gameState, finalConfig)
}
/**
 * Ships Module Exports
 * Central export point for all ship-related functionality
 */

// Type definitions and hierarchies
export {
  ShipClassHierarchy,
  HistoricalPeriods,
  ShipTypeValidator,
  type HistoricalPeriod,
  type FleetCompositionRule
} from './ShipTypes'

// Ship templates
export { ShipTypeTemplates } from './ShipTemplates'

// Ship class data
export {
  ShipClassDefinitions,
  EraModifiers,
  type ShipStatistics,
  type ShipClassConfig,
  type PointCost,
  type StatModifiers
} from './ShipClassData'

// Ship statistics and balancing
export {
  ShipStatCalculator,
  type BalanceComparison,
  type StatDistribution
} from './ShipClasses'

// Fleet rules
export {
  DefaultFleetRules,
  EraFleetRules,
  FleetValidator,
  type FleetRules
} from './FleetRules'

// Fleet management
export {
  FleetManager,
  type FleetConfig,
  type FleetShip,
  type ValidationResult,
  type FleetSummary
} from './FleetManager'

// Ship customization
export {
  PresetConfigurations,
  DefaultShipAbilities,
  type ShipCustomization,
  type ShipStatModifiers,
  type AbilityEnhancement,
  type ShipTrait,
  type TraitEffect,
  type CombatModifier,
  type VisualCustomization
} from './ShipCustomization'

// Ship factory
export {
  ShipFactory,
  shipFactory,
  type ShipCreationOptions,
  type ShipValidation
} from './ShipFactory'

// Ability system
export {
  AbilityEngine,
  type AbilityEngineConfig
} from './AbilityEngine'

export * from './abilities'
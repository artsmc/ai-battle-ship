/**
 * Ship Classes Module
 * Ship statistics system with point-based balancing for fair gameplay
 */

import { ShipClass, ShipEra } from '../database/types/enums'
import {
  ShipStatistics,
  ShipClassDefinitions,
  EraModifiers,
  ShipClassConfig,
  PointCost,
  StatModifiers
} from './ShipClassData'

// Re-export types from ShipClassData
export type {
  ShipStatistics,
  ShipClassConfig,
  PointCost,
  StatModifiers
}

// Re-export data from ShipClassData
export { ShipClassDefinitions, EraModifiers }

/**
 * Balance Comparison Result
 */
export interface BalanceComparison {
  ship1Points: number
  ship2Points: number
  difference: number
  percentageDifference: number
  isBalanced: boolean
}

/**
 * Ship Statistics Calculator
 */
export class ShipStatCalculator {
  /**
   * Calculate final ship statistics with era modifiers
   */
  static calculateStats(
    shipClass: ShipClass,
    era: ShipEra,
    customModifiers?: Partial<ShipStatistics>
  ): ShipStatistics {
    const baseConfig = ShipClassDefinitions[shipClass]
    const eraModifier = EraModifiers[era]

    const stats: ShipStatistics = {
      armor: Math.round(baseConfig.baseStats.armor * eraModifier.armor),
      firepower: Math.round(baseConfig.baseStats.firepower * eraModifier.firepower),
      accuracy: Math.round(baseConfig.baseStats.accuracy * eraModifier.accuracy),
      speed: Math.round(baseConfig.baseStats.speed * eraModifier.speed),
      maneuverability: Math.round(baseConfig.baseStats.maneuverability * eraModifier.maneuverability),
      detection: Math.round(baseConfig.baseStats.detection * eraModifier.detection),
      stealth: Math.round(baseConfig.baseStats.stealth * eraModifier.stealth),
      hitPoints: Math.round(baseConfig.baseStats.hitPoints * eraModifier.hitPoints),
      criticalThreshold: baseConfig.baseStats.criticalThreshold,
      specialAbilitySlots: baseConfig.baseStats.specialAbilitySlots
    }

    // Apply custom modifiers if provided
    if (customModifiers) {
      Object.keys(customModifiers).forEach(key => {
        const statKey = key as keyof ShipStatistics
        if (customModifiers[statKey] !== undefined) {
          stats[statKey] = customModifiers[statKey] as any
        }
      })
    }

    // Ensure all stats are within valid ranges (1-10 for most stats)
    const clampedStats = this.clampStats(stats)

    return clampedStats
  }

  /**
   * Calculate point value for a ship
   */
  static calculatePointValue(
    shipClass: ShipClass,
    era: ShipEra,
    stats: ShipStatistics
  ): number {
    const config = ShipClassDefinitions[shipClass]
    const eraModifier = EraModifiers[era]

    let points = config.pointCost.baseValue

    // Add points for stats
    const statSum = stats.armor + stats.firepower + stats.accuracy +
                   stats.speed + stats.maneuverability + stats.detection + stats.stealth
    points += statSum * config.pointCost.perStatPoint

    // Add points for hit points
    points += stats.hitPoints * config.pointCost.perHitPoint

    // Add points for ability slots
    points += stats.specialAbilitySlots * config.pointCost.perAbilitySlot

    // Apply era and class modifiers
    points *= eraModifier.pointMultiplier
    points *= config.pointCost.classModifier

    return Math.round(points)
  }

  /**
   * Clamp statistics to valid ranges
   */
  private static clampStats(stats: ShipStatistics): ShipStatistics {
    return {
      armor: Math.max(1, Math.min(10, stats.armor)),
      firepower: Math.max(1, Math.min(10, stats.firepower)),
      accuracy: Math.max(1, Math.min(10, stats.accuracy)),
      speed: Math.max(1, Math.min(10, stats.speed)),
      maneuverability: Math.max(1, Math.min(10, stats.maneuverability)),
      detection: Math.max(1, Math.min(10, stats.detection)),
      stealth: Math.max(1, Math.min(10, stats.stealth)),
      hitPoints: Math.max(1, Math.min(10, stats.hitPoints)),
      criticalThreshold: Math.max(10, Math.min(50, stats.criticalThreshold)),
      specialAbilitySlots: Math.max(0, Math.min(5, stats.specialAbilitySlots))
    }
  }

  /**
   * Compare two ships for balance
   */
  static compareBalance(
    ship1: { class: ShipClass; era: ShipEra; stats: ShipStatistics },
    ship2: { class: ShipClass; era: ShipEra; stats: ShipStatistics }
  ): BalanceComparison {
    const points1 = this.calculatePointValue(ship1.class, ship1.era, ship1.stats)
    const points2 = this.calculatePointValue(ship2.class, ship2.era, ship2.stats)

    return {
      ship1Points: points1,
      ship2Points: points2,
      difference: points1 - points2,
      percentageDifference: ((points1 - points2) / points2) * 100,
      isBalanced: Math.abs(points1 - points2) <= 10 // Within 10 points is considered balanced
    }
  }

  /**
   * Get recommended stats for a ship class and era
   */
  static getRecommendedStats(shipClass: ShipClass, era: ShipEra): ShipStatistics {
    return this.calculateStats(shipClass, era)
  }

  /**
   * Calculate efficiency rating for a ship
   */
  static calculateEfficiencyRating(
    shipClass: ShipClass,
    era: ShipEra,
    stats: ShipStatistics
  ): number {
    const recommendedStats = this.getRecommendedStats(shipClass, era)
    const actualPoints = this.calculatePointValue(shipClass, era, stats)
    const recommendedPoints = this.calculatePointValue(shipClass, era, recommendedStats)

    // Calculate how efficiently the points are spent
    const efficiency = (recommendedPoints / actualPoints) * 100

    return Math.min(100, Math.round(efficiency))
  }

  /**
   * Get stat distribution analysis
   */
  static getStatDistribution(stats: ShipStatistics): StatDistribution {
    const combatStats = stats.armor + stats.firepower + stats.accuracy
    const mobilityStats = stats.speed + stats.maneuverability
    const detectionStats = stats.detection + stats.stealth
    const totalStats = combatStats + mobilityStats + detectionStats

    return {
      combat: {
        value: combatStats,
        percentage: (combatStats / totalStats) * 100
      },
      mobility: {
        value: mobilityStats,
        percentage: (mobilityStats / totalStats) * 100
      },
      detection: {
        value: detectionStats,
        percentage: (detectionStats / totalStats) * 100
      },
      overall: {
        value: totalStats,
        average: totalStats / 7 // 7 main stats
      }
    }
  }
}

/**
 * Stat Distribution Analysis
 */
export interface StatDistribution {
  combat: {
    value: number
    percentage: number
  }
  mobility: {
    value: number
    percentage: number
  }
  detection: {
    value: number
    percentage: number
  }
  overall: {
    value: number
    average: number
  }
}
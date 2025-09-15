/**
 * AI Behavior Configuration
 * Manages AI personality traits and behavior profiles
 */

import {
  BehaviorProfile,
  BehaviorTraits,
  TargetPriority,
  PlacementStrategy,
  DifficultyLevel
} from './types'

export interface BehaviorModifier {
  factor: string
  value: number
  description: string
}

export interface AdaptiveBehavior {
  trigger: string
  condition: (gameState: any) => boolean
  adjustment: Partial<BehaviorTraits>
  duration?: number // In turns
}

export interface BehaviorPreset {
  name: string
  profile: BehaviorProfile
  description: string
  traits: BehaviorTraits
  modifiers: BehaviorModifier[]
}

export class AIBehaviorConfig {
  private static instance: AIBehaviorConfig
  private behaviorPresets: Map<string, BehaviorPreset>
  private adaptiveBehaviors: AdaptiveBehavior[]
  private currentBehavior: BehaviorTraits | null
  private behaviorHistory: BehaviorChange[]
  private adaptationEnabled: boolean

  private constructor() {
    this.behaviorPresets = this.initializePresets()
    this.adaptiveBehaviors = this.initializeAdaptiveBehaviors()
    this.currentBehavior = null
    this.behaviorHistory = []
    this.adaptationEnabled = true
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIBehaviorConfig {
    if (!AIBehaviorConfig.instance) {
      AIBehaviorConfig.instance = new AIBehaviorConfig()
    }
    return AIBehaviorConfig.instance
  }

  // =============================================
  // PRESET INITIALIZATION
  // =============================================

  private initializePresets(): Map<string, BehaviorPreset> {
    const presets = new Map<string, BehaviorPreset>()

    // Aggressive Preset
    presets.set('aggressive', {
      name: 'Aggressive',
      profile: 'aggressive',
      description: 'Focuses on offensive tactics and quick elimination of enemy ships',
      traits: {
        profile: 'aggressive',
        aggression: 0.9,
        caution: 0.2,
        adaptability: 0.5,
        persistence: 0.8,
        creativity: 0.4,
        preferredTargetPriority: ['damaged_ship', 'largest_ship', 'clustered_area'],
        preferredPlacementStrategy: 'clustered',
        abilityUsageFrequency: 0.8,
        powerupConservation: 0.2
      },
      modifiers: [
        { factor: 'risk_tolerance', value: 1.5, description: 'Takes more risks for potential rewards' },
        { factor: 'attack_speed', value: 0.8, description: 'Makes decisions faster' },
        { factor: 'defense_priority', value: 0.5, description: 'Lower defensive considerations' }
      ]
    })

    // Defensive Preset
    presets.set('defensive', {
      name: 'Defensive',
      profile: 'defensive',
      description: 'Prioritizes ship preservation and careful, calculated moves',
      traits: {
        profile: 'defensive',
        aggression: 0.3,
        caution: 0.9,
        adaptability: 0.6,
        persistence: 0.5,
        creativity: 0.3,
        preferredTargetPriority: ['high_value', 'edge_cells', 'smallest_ship'],
        preferredPlacementStrategy: 'distributed',
        abilityUsageFrequency: 0.4,
        powerupConservation: 0.8
      },
      modifiers: [
        { factor: 'risk_tolerance', value: 0.5, description: 'Avoids risky plays' },
        { factor: 'attack_speed', value: 1.2, description: 'Takes more time to analyze' },
        { factor: 'defense_priority', value: 1.5, description: 'Prioritizes defense' }
      ]
    })

    // Balanced Preset
    presets.set('balanced', {
      name: 'Balanced',
      profile: 'balanced',
      description: 'Adapts strategy based on game state, mixing offense and defense',
      traits: {
        profile: 'balanced',
        aggression: 0.5,
        caution: 0.5,
        adaptability: 0.7,
        persistence: 0.6,
        creativity: 0.5,
        preferredTargetPriority: ['damaged_ship', 'high_value', 'center_cells'],
        preferredPlacementStrategy: 'distributed',
        abilityUsageFrequency: 0.5,
        powerupConservation: 0.5
      },
      modifiers: [
        { factor: 'risk_tolerance', value: 1.0, description: 'Standard risk assessment' },
        { factor: 'attack_speed', value: 1.0, description: 'Normal decision speed' },
        { factor: 'defense_priority', value: 1.0, description: 'Balanced priorities' }
      ]
    })

    // Unpredictable Preset
    presets.set('unpredictable', {
      name: 'Unpredictable',
      profile: 'unpredictable',
      description: 'Varies tactics randomly to confuse opponents',
      traits: {
        profile: 'unpredictable',
        aggression: 0.6,
        caution: 0.4,
        adaptability: 0.9,
        persistence: 0.3,
        creativity: 0.9,
        preferredTargetPriority: ['clustered_area', 'edge_cells', 'center_cells', 'damaged_ship'],
        preferredPlacementStrategy: 'random',
        abilityUsageFrequency: 0.6,
        powerupConservation: 0.4
      },
      modifiers: [
        { factor: 'risk_tolerance', value: 1.3, description: 'Variable risk taking' },
        { factor: 'attack_speed', value: 0.9, description: 'Slightly faster decisions' },
        { factor: 'randomness', value: 1.5, description: 'Increased randomization' }
      ]
    })

    // Hunter Preset (Specialized)
    presets.set('hunter', {
      name: 'Hunter',
      profile: 'aggressive',
      description: 'Specializes in finding and eliminating ships quickly',
      traits: {
        profile: 'aggressive',
        aggression: 0.7,
        caution: 0.3,
        adaptability: 0.8,
        persistence: 0.9,
        creativity: 0.5,
        preferredTargetPriority: ['damaged_ship', 'clustered_area', 'high_value'],
        preferredPlacementStrategy: 'defensive',
        abilityUsageFrequency: 0.7,
        powerupConservation: 0.3
      },
      modifiers: [
        { factor: 'search_efficiency', value: 1.5, description: 'Better at finding ships' },
        { factor: 'follow_up_accuracy', value: 1.3, description: 'Better at sinking found ships' },
        { factor: 'pattern_detection', value: 1.2, description: 'Better pattern recognition' }
      ]
    })

    // Tactician Preset (Specialized)
    presets.set('tactician', {
      name: 'Tactician',
      profile: 'balanced',
      description: 'Uses advanced tactics and ability combinations',
      traits: {
        profile: 'balanced',
        aggression: 0.6,
        caution: 0.6,
        adaptability: 0.8,
        persistence: 0.7,
        creativity: 0.8,
        preferredTargetPriority: ['high_value', 'damaged_ship', 'clustered_area'],
        preferredPlacementStrategy: 'defensive',
        abilityUsageFrequency: 0.9,
        powerupConservation: 0.6
      },
      modifiers: [
        { factor: 'ability_timing', value: 1.4, description: 'Better ability usage timing' },
        { factor: 'combo_detection', value: 1.3, description: 'Identifies ability combos' },
        { factor: 'strategic_planning', value: 1.5, description: 'Long-term planning' }
      ]
    })

    return presets
  }

  // =============================================
  // ADAPTIVE BEHAVIORS
  // =============================================

  private initializeAdaptiveBehaviors(): AdaptiveBehavior[] {
    return [
      // Become more aggressive when winning
      {
        trigger: 'winning',
        condition: (gameState) => {
          const myShips = gameState.playerFleet?.length || 0
          const enemyShips = gameState.opponentFleet?.length || 0
          return myShips > enemyShips * 1.5
        },
        adjustment: {
          aggression: 0.2,
          caution: -0.1,
          abilityUsageFrequency: 0.1
        },
        duration: 5
      },

      // Become more defensive when losing
      {
        trigger: 'losing',
        condition: (gameState) => {
          const myShips = gameState.playerFleet?.length || 0
          const enemyShips = gameState.opponentFleet?.length || 0
          return myShips < enemyShips * 0.7
        },
        adjustment: {
          aggression: -0.2,
          caution: 0.3,
          powerupConservation: 0.2
        },
        duration: 5
      },

      // Increase persistence when close to sinking a ship
      {
        trigger: 'ship_damaged',
        condition: (gameState) => {
          return gameState.damagedEnemyShips?.length > 0
        },
        adjustment: {
          persistence: 0.3,
          aggression: 0.1
        },
        duration: 3
      },

      // Become more creative when current strategy isn't working
      {
        trigger: 'strategy_failing',
        condition: (gameState) => {
          const recentMisses = gameState.recentShots?.filter((s: any) => !s.hit).length || 0
          return recentMisses > 5
        },
        adjustment: {
          creativity: 0.2,
          adaptability: 0.2,
          preferredPlacementStrategy: 'random' as PlacementStrategy
        },
        duration: 4
      },

      // Increase caution after losing important ship
      {
        trigger: 'important_ship_lost',
        condition: (gameState) => {
          return gameState.recentlyLostShip?.class === 'CARRIER' ||
                 gameState.recentlyLostShip?.class === 'BATTLESHIP'
        },
        adjustment: {
          caution: 0.3,
          aggression: -0.2,
          powerupConservation: 0.3
        },
        duration: 6
      }
    ]
  }

  // =============================================
  // BEHAVIOR MANAGEMENT
  // =============================================

  /**
   * Get behavior traits for a profile
   */
  getBehavior(profile: BehaviorProfile | string): BehaviorTraits {
    const preset = this.behaviorPresets.get(profile)
    if (preset) {
      return { ...preset.traits }
    }

    // Return default balanced behavior if not found
    return this.behaviorPresets.get('balanced')!.traits
  }

  /**
   * Create custom behavior
   */
  createCustomBehavior(base: BehaviorProfile, adjustments: Partial<BehaviorTraits>): BehaviorTraits {
    const baseBehavior = this.getBehavior(base)
    return {
      ...baseBehavior,
      ...adjustments
    }
  }

  /**
   * Apply behavior modifiers
   */
  applyModifiers(
    behavior: BehaviorTraits,
    modifiers: BehaviorModifier[]
  ): BehaviorTraits {
    const modified = { ...behavior }

    modifiers.forEach(modifier => {
      switch (modifier.factor) {
        case 'risk_tolerance':
          modified.aggression *= modifier.value
          modified.caution /= modifier.value
          break

        case 'attack_speed':
          modified.persistence *= (2 - modifier.value)
          break

        case 'defense_priority':
          modified.caution *= modifier.value
          modified.powerupConservation *= modifier.value
          break

        case 'randomness':
          modified.creativity *= modifier.value
          modified.adaptability *= modifier.value
          break

        case 'search_efficiency':
          // Adjust target priorities
          if (!modified.preferredTargetPriority.includes('clustered_area')) {
            modified.preferredTargetPriority.unshift('clustered_area')
          }
          break

        case 'ability_timing':
          modified.abilityUsageFrequency *= modifier.value
          break
      }
    })

    // Normalize values to 0-1 range
    modified.aggression = Math.max(0, Math.min(1, modified.aggression))
    modified.caution = Math.max(0, Math.min(1, modified.caution))
    modified.adaptability = Math.max(0, Math.min(1, modified.adaptability))
    modified.persistence = Math.max(0, Math.min(1, modified.persistence))
    modified.creativity = Math.max(0, Math.min(1, modified.creativity))
    modified.abilityUsageFrequency = Math.max(0, Math.min(1, modified.abilityUsageFrequency))
    modified.powerupConservation = Math.max(0, Math.min(1, modified.powerupConservation))

    return modified
  }

  // =============================================
  // ADAPTIVE BEHAVIOR
  // =============================================

  /**
   * Update behavior based on game state
   */
  updateBehavior(
    currentBehavior: BehaviorTraits,
    gameState: any,
    turnNumber: number
  ): BehaviorTraits {
    if (!this.adaptationEnabled) {
      return currentBehavior
    }

    const updatedBehavior = { ...currentBehavior }
    const appliedAdjustments: string[] = []

    // Check each adaptive behavior
    this.adaptiveBehaviors.forEach(adaptive => {
      if (adaptive.condition(gameState)) {
        // Apply adjustments
        Object.entries(adaptive.adjustment).forEach(([key, value]) => {
          if (typeof value === 'number') {
            const currentValue = (updatedBehavior as any)[key]
            if (typeof currentValue === 'number') {
              (updatedBehavior as any)[key] = Math.max(0, Math.min(1, currentValue + value))
            }
          } else {
            (updatedBehavior as any)[key] = value
          }
        })

        appliedAdjustments.push(adaptive.trigger)
      }
    })

    // Record behavior change
    if (appliedAdjustments.length > 0) {
      this.recordBehaviorChange(currentBehavior, updatedBehavior, appliedAdjustments, turnNumber)
    }

    this.currentBehavior = updatedBehavior
    return updatedBehavior
  }

  /**
   * Adapt behavior based on opponent
   */
  adaptToOpponent(
    baseBehavior: BehaviorTraits,
    opponentProfile: OpponentProfile
  ): BehaviorTraits {
    const adapted = { ...baseBehavior }

    // Counter aggressive opponents with defense
    if (opponentProfile.aggression > 0.7) {
      adapted.caution += 0.2
      adapted.defensiveness = (adapted.caution + adapted.persistence) / 2
    }

    // Counter defensive opponents with aggression
    if (opponentProfile.defensiveness > 0.7) {
      adapted.aggression += 0.2
      adapted.creativity += 0.1
    }

    // Counter predictable opponents with creativity
    if (opponentProfile.predictability > 0.7) {
      adapted.creativity += 0.3
      adapted.adaptability += 0.2
    }

    // Normalize values
    Object.keys(adapted).forEach(key => {
      const value = (adapted as any)[key]
      if (typeof value === 'number') {
        (adapted as any)[key] = Math.max(0, Math.min(1, value))
      }
    })

    return adapted
  }

  // =============================================
  // BEHAVIOR SELECTION
  // =============================================

  /**
   * Select behavior based on difficulty and game mode
   */
  selectBehavior(
    difficulty: DifficultyLevel,
    gameMode?: string,
    opponentStrength?: number
  ): BehaviorTraits {
    // Base selection on difficulty
    let selectedProfile: BehaviorProfile = 'balanced'

    switch (difficulty) {
      case 'beginner':
        // Beginners are usually defensive and predictable
        selectedProfile = Math.random() > 0.7 ? 'defensive' : 'balanced'
        break

      case 'intermediate':
        // Intermediate mixes strategies
        const profiles: BehaviorProfile[] = ['balanced', 'defensive', 'aggressive']
        selectedProfile = profiles[Math.floor(Math.random() * profiles.length)]
        break

      case 'advanced':
        // Advanced favors aggressive and tactical play
        selectedProfile = Math.random() > 0.5 ? 'aggressive' : 'balanced'
        break

      case 'expert':
        // Expert is unpredictable and adaptive
        selectedProfile = 'unpredictable'
        break
    }

    // Get base behavior
    const behavior = this.getBehavior(selectedProfile)

    // Adjust for game mode
    if (gameMode === 'tournament') {
      // More conservative in tournaments
      behavior.caution += 0.1
      behavior.powerupConservation += 0.1
    } else if (gameMode === 'blitz') {
      // More aggressive in blitz games
      behavior.aggression += 0.2
      behavior.abilityUsageFrequency += 0.2
    }

    // Adjust for opponent strength
    if (opponentStrength !== undefined) {
      if (opponentStrength > 0.7) {
        // Stronger opponent - be more cautious
        behavior.caution += 0.15
        behavior.adaptability += 0.1
      } else if (opponentStrength < 0.3) {
        // Weaker opponent - can be more aggressive
        behavior.aggression += 0.15
        behavior.creativity += 0.1
      }
    }

    return behavior
  }

  // =============================================
  // HISTORY AND ANALYSIS
  // =============================================

  private recordBehaviorChange(
    from: BehaviorTraits,
    to: BehaviorTraits,
    triggers: string[],
    turnNumber: number
  ): void {
    this.behaviorHistory.push({
      fromBehavior: from,
      toBehavior: to,
      triggers,
      turnNumber,
      timestamp: new Date()
    })

    // Keep only last 100 changes
    if (this.behaviorHistory.length > 100) {
      this.behaviorHistory.shift()
    }
  }

  /**
   * Analyze behavior effectiveness
   */
  analyzeBehaviorEffectiveness(): BehaviorAnalysis {
    if (this.behaviorHistory.length === 0) {
      return {
        mostEffectiveProfile: null,
        leastEffectiveProfile: null,
        adaptationFrequency: 0,
        averageAdaptationInterval: 0,
        commonTriggers: []
      }
    }

    // Count profile occurrences and their outcomes
    const profileStats = new Map<BehaviorProfile, ProfileStats>()

    this.behaviorHistory.forEach(change => {
      const profile = change.toBehavior.profile
      const stats = profileStats.get(profile) || { occurrences: 0, successRate: 0 }
      stats.occurrences++
      profileStats.set(profile, stats)
    })

    // Calculate adaptation frequency
    const totalTurns = this.behaviorHistory[this.behaviorHistory.length - 1].turnNumber
    const adaptationFrequency = this.behaviorHistory.length / totalTurns

    // Calculate average interval between adaptations
    let totalInterval = 0
    for (let i = 1; i < this.behaviorHistory.length; i++) {
      totalInterval += this.behaviorHistory[i].turnNumber - this.behaviorHistory[i - 1].turnNumber
    }
    const averageAdaptationInterval = totalInterval / (this.behaviorHistory.length - 1)

    // Find common triggers
    const triggerCounts = new Map<string, number>()
    this.behaviorHistory.forEach(change => {
      change.triggers.forEach(trigger => {
        triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1)
      })
    })

    const commonTriggers = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trigger]) => trigger)

    return {
      mostEffectiveProfile: this.getMostEffectiveProfile(profileStats),
      leastEffectiveProfile: this.getLeastEffectiveProfile(profileStats),
      adaptationFrequency,
      averageAdaptationInterval,
      commonTriggers
    }
  }

  private getMostEffectiveProfile(stats: Map<BehaviorProfile, ProfileStats>): BehaviorProfile | null {
    let best: BehaviorProfile | null = null
    let bestScore = 0

    stats.forEach((stat, profile) => {
      const score = stat.occurrences * stat.successRate
      if (score > bestScore) {
        bestScore = score
        best = profile
      }
    })

    return best
  }

  private getLeastEffectiveProfile(stats: Map<BehaviorProfile, ProfileStats>): BehaviorProfile | null {
    let worst: BehaviorProfile | null = null
    let worstScore = Infinity

    stats.forEach((stat, profile) => {
      const score = stat.occurrences * stat.successRate
      if (score < worstScore) {
        worstScore = score
        worst = profile
      }
    })

    return worst
  }

  // =============================================
  // CONFIGURATION MANAGEMENT
  // =============================================

  /**
   * Enable or disable adaptive behavior
   */
  setAdaptationEnabled(enabled: boolean): void {
    this.adaptationEnabled = enabled
  }

  /**
   * Add custom preset
   */
  addPreset(preset: BehaviorPreset): void {
    this.behaviorPresets.set(preset.name.toLowerCase(), preset)
  }

  /**
   * Get all available presets
   */
  getPresets(): BehaviorPreset[] {
    return Array.from(this.behaviorPresets.values())
  }

  /**
   * Reset behavior history
   */
  resetHistory(): void {
    this.behaviorHistory = []
    this.currentBehavior = null
  }

  /**
   * Export configuration
   */
  exportConfig(): string {
    return JSON.stringify({
      presets: Array.from(this.behaviorPresets.entries()),
      adaptiveBehaviors: this.adaptiveBehaviors.map(ab => ({
        trigger: ab.trigger,
        adjustment: ab.adjustment,
        duration: ab.duration
      })),
      adaptationEnabled: this.adaptationEnabled
    }, null, 2)
  }

  /**
   * Import configuration
   */
  importConfig(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)

      if (data.presets) {
        this.behaviorPresets.clear()
        data.presets.forEach(([name, preset]: [string, BehaviorPreset]) => {
          this.behaviorPresets.set(name, preset)
        })
      }

      if (data.adaptationEnabled !== undefined) {
        this.adaptationEnabled = data.adaptationEnabled
      }
    } catch (error) {
      console.error('Failed to import behavior config:', error)
      throw new Error('Invalid configuration format')
    }
  }
}

// =============================================
// SUPPORTING TYPES
// =============================================

interface BehaviorChange {
  fromBehavior: BehaviorTraits
  toBehavior: BehaviorTraits
  triggers: string[]
  turnNumber: number
  timestamp: Date
}

interface OpponentProfile {
  aggression: number
  defensiveness: number
  predictability: number
  skillLevel: number
}

interface ProfileStats {
  occurrences: number
  successRate: number
}

interface BehaviorAnalysis {
  mostEffectiveProfile: BehaviorProfile | null
  leastEffectiveProfile: BehaviorProfile | null
  adaptationFrequency: number
  averageAdaptationInterval: number
  commonTriggers: string[]
}
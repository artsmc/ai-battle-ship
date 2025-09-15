/**
 * ShipAnimations
 *
 * Specific animation definitions and presets for ship movements and effects.
 * Includes placement, combat, damage, and environmental animations.
 */

import { Animation, AnimationProps, Easing, EasingFunction } from './AnimationEngine'
import { ShipClass, ShipEra } from '../../database/types/enums'

export interface ShipAnimationConfig {
  shipClass: ShipClass
  era: ShipEra
  size: number
  position: { x: number; y: number; rotation: number }
  scale: number
}

export interface AnimationPreset {
  name: string
  duration: number
  properties: AnimationProps
  ease: EasingFunction
  loop: boolean
}

/**
 * Ship-specific animation presets
 */
export const ShipAnimationPresets: Record<string, AnimationPreset> = {
  // Placement animations
  SHIP_PLACE: {
    name: 'Ship Placement',
    duration: 800,
    properties: {
      scale: { startValue: 0, endValue: 1 },
      alpha: { startValue: 0, endValue: 1 },
      rotation: { startValue: -15, endValue: 0 }
    },
    ease: Easing.easeOutElastic,
    loop: false
  },

  SHIP_REMOVE: {
    name: 'Ship Removal',
    duration: 400,
    properties: {
      scale: { startValue: 1, endValue: 0 },
      alpha: { startValue: 1, endValue: 0 },
      rotation: { startValue: 0, endValue: 15 }
    },
    ease: Easing.easeInCubic,
    loop: false
  },

  // Idle animations
  SHIP_IDLE_BOB: {
    name: 'Ship Idle Bobbing',
    duration: 3000,
    properties: {
      y: {
        startValue: 0,
        endValue: 0,
        keyframes: [
          { time: 0, value: 0 },
          { time: 0.5, value: -2 },
          { time: 1, value: 0 }
        ]
      }
    },
    ease: Easing.shipBob,
    loop: true
  },

  SHIP_IDLE_SWAY: {
    name: 'Ship Idle Swaying',
    duration: 4000,
    properties: {
      rotation: {
        startValue: -1,
        endValue: 1,
        keyframes: [
          { time: 0, value: -1 },
          { time: 0.5, value: 1 },
          { time: 1, value: -1 }
        ]
      }
    },
    ease: Easing.shipRoll,
    loop: true
  },

  // Selection animations
  SHIP_SELECT: {
    name: 'Ship Selection',
    duration: 300,
    properties: {
      scale: { startValue: 1, endValue: 1.1 },
      glowIntensity: { startValue: 0, endValue: 1 }
    },
    ease: Easing.easeOutQuad,
    loop: false
  },

  SHIP_DESELECT: {
    name: 'Ship Deselection',
    duration: 200,
    properties: {
      scale: { startValue: 1.1, endValue: 1 },
      glowIntensity: { startValue: 1, endValue: 0 }
    },
    ease: Easing.easeInQuad,
    loop: false
  },

  SHIP_HIGHLIGHT: {
    name: 'Ship Highlight',
    duration: 1000,
    properties: {
      highlightIntensity: {
        startValue: 0,
        endValue: 0,
        keyframes: [
          { time: 0, value: 0 },
          { time: 0.5, value: 0.7 },
          { time: 1, value: 0 }
        ]
      }
    },
    ease: Easing.easeInOutQuad,
    loop: true
  },

  // Combat animations
  SHIP_FIRE: {
    name: 'Ship Firing',
    duration: 600,
    properties: {
      recoil: { startValue: 0, endValue: -3 },
      muzzleFlash: { startValue: 0, endValue: 1 },
      shake: { startValue: 0, endValue: 2 }
    },
    ease: Easing.easeOutBounce,
    loop: false
  },

  SHIP_HIT: {
    name: 'Ship Hit',
    duration: 400,
    properties: {
      shake: { startValue: 0, endValue: 4 },
      flashRed: { startValue: 0, endValue: 0.8 },
      rotation: { startValue: 0, endValue: 2 }
    },
    ease: Easing.easeOutElastic,
    loop: false
  },

  SHIP_EXPLOSION: {
    name: 'Ship Explosion',
    duration: 1200,
    properties: {
      scale: { startValue: 1, endValue: 1.5 },
      alpha: { startValue: 1, endValue: 0 },
      explosionRadius: { startValue: 0, endValue: 100 },
      shake: { startValue: 0, endValue: 8 }
    },
    ease: Easing.easeOutCubic,
    loop: false
  },

  // Damage states
  SHIP_DAMAGE_LIGHT: {
    name: 'Light Damage',
    duration: 2000,
    properties: {
      smokeIntensity: { startValue: 0, endValue: 0.3 },
      tilt: { startValue: 0, endValue: -1 }
    },
    ease: Easing.easeOutQuad,
    loop: false
  },

  SHIP_DAMAGE_HEAVY: {
    name: 'Heavy Damage',
    duration: 3000,
    properties: {
      smokeIntensity: { startValue: 0.3, endValue: 0.7 },
      fireIntensity: { startValue: 0, endValue: 0.5 },
      tilt: { startValue: -1, endValue: -3 },
      listing: { startValue: 0, endValue: 2 }
    },
    ease: Easing.easeOutCubic,
    loop: false
  },

  SHIP_SINKING: {
    name: 'Ship Sinking',
    duration: 4000,
    properties: {
      y: { startValue: 0, endValue: 50 },
      alpha: { startValue: 1, endValue: 0.3 },
      scale: { startValue: 1, endValue: 0.8 },
      tilt: { startValue: -3, endValue: -15 },
      bubbleIntensity: { startValue: 0, endValue: 1 }
    },
    ease: Easing.easeInCubic,
    loop: false
  },

  // Movement animations
  SHIP_MOVE: {
    name: 'Ship Movement',
    duration: 1000,
    properties: {
      x: { startValue: 0, endValue: 0 }, // Will be set dynamically
      y: { startValue: 0, endValue: 0 }, // Will be set dynamically
      wakeIntensity: { startValue: 0, endValue: 0.8 }
    },
    ease: Easing.easeInOutQuad,
    loop: false
  },

  SHIP_TURN: {
    name: 'Ship Turning',
    duration: 800,
    properties: {
      rotation: { startValue: 0, endValue: 0 }, // Will be set dynamically
      turnWakeIntensity: { startValue: 0, endValue: 0.6 },
      tilt: { startValue: 0, endValue: -2 }
    },
    ease: Easing.easeInOutCubic,
    loop: false
  },

  // Special ability animations
  ABILITY_SONAR_PING: {
    name: 'Sonar Ping',
    duration: 2000,
    properties: {
      sonarRadius: { startValue: 0, endValue: 150 },
      sonarIntensity: { startValue: 1, endValue: 0 },
      pulseCount: { startValue: 0, endValue: 3 }
    },
    ease: Easing.easeOutQuad,
    loop: false
  },

  ABILITY_SPEED_BOOST: {
    name: 'Speed Boost',
    duration: 500,
    properties: {
      speedLines: { startValue: 0, endValue: 1 },
      afterburner: { startValue: 0, endValue: 0.8 },
      scale: { startValue: 1, endValue: 1.05 }
    },
    ease: Easing.easeOutCubic,
    loop: false
  },

  ABILITY_STEALTH: {
    name: 'Stealth Activation',
    duration: 1000,
    properties: {
      alpha: { startValue: 1, endValue: 0.3 },
      shimmer: { startValue: 0, endValue: 0.5 },
      outline: { startValue: 1, endValue: 0.1 }
    },
    ease: Easing.easeOutQuad,
    loop: false
  }
}

/**
 * Ship animation factory for creating contextual animations
 */
export class ShipAnimationFactory {
  /**
   * Create placement animation for ship
   */
  static createPlacementAnimation(config: ShipAnimationConfig): Partial<Animation> {
    const preset = ShipAnimationPresets.SHIP_PLACE

    return {
      target: config,
      duration: this.scaleDurationBySize(preset.duration, config.size),
      properties: preset.properties,
      ease: preset.ease
    }
  }

  /**
   * Create idle animation set for ship
   */
  static createIdleAnimations(config: ShipAnimationConfig): Partial<Animation>[] {
    const animations: Partial<Animation>[] = []

    // Add bobbing based on ship class
    if (this.shouldBob(config.shipClass)) {
      animations.push({
        target: config,
        duration: ShipAnimationPresets.SHIP_IDLE_BOB.duration,
        properties: ShipAnimationPresets.SHIP_IDLE_BOB.properties,
        ease: ShipAnimationPresets.SHIP_IDLE_BOB.ease,
        loop: true
      })
    }

    // Add swaying for larger ships
    if (this.shouldSway(config.shipClass)) {
      animations.push({
        target: config,
        duration: ShipAnimationPresets.SHIP_IDLE_SWAY.duration,
        properties: ShipAnimationPresets.SHIP_IDLE_SWAY.properties,
        ease: ShipAnimationPresets.SHIP_IDLE_SWAY.ease,
        loop: true,
        delay: 500 // Offset from bobbing
      })
    }

    return animations
  }

  /**
   * Create combat animation
   */
  static createCombatAnimation(
    config: ShipAnimationConfig,
    type: 'fire' | 'hit' | 'explosion'
  ): Partial<Animation> {
    const presetMap = {
      fire: ShipAnimationPresets.SHIP_FIRE,
      hit: ShipAnimationPresets.SHIP_HIT,
      explosion: ShipAnimationPresets.SHIP_EXPLOSION
    }

    const preset = presetMap[type]
    const intensity = this.getIntensityByClass(config.shipClass)

    // Scale animation properties by ship class and size
    const scaledProperties = this.scaleProperties(preset.properties, intensity)

    return {
      target: config,
      duration: this.scaleDurationBySize(preset.duration, config.size),
      properties: scaledProperties,
      ease: preset.ease
    }
  }

  /**
   * Create damage state animation
   */
  static createDamageAnimation(
    config: ShipAnimationConfig,
    damageLevel: 'light' | 'heavy' | 'sinking'
  ): Partial<Animation> {
    const presetMap = {
      light: ShipAnimationPresets.SHIP_DAMAGE_LIGHT,
      heavy: ShipAnimationPresets.SHIP_DAMAGE_HEAVY,
      sinking: ShipAnimationPresets.SHIP_SINKING
    }

    const preset = presetMap[damageLevel]

    return {
      target: config,
      duration: preset.duration,
      properties: preset.properties,
      ease: preset.ease,
      loop: damageLevel !== 'sinking'
    }
  }

  /**
   * Create movement animation
   */
  static createMovementAnimation(
    config: ShipAnimationConfig,
    from: { x: number; y: number },
    to: { x: number; y: number },
    duration?: number
  ): Partial<Animation> {
    const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2)
    const speed = this.getSpeedByClass(config.shipClass)
    const animDuration = duration || Math.max(500, distance / speed * 1000)

    return {
      target: config,
      duration: animDuration,
      properties: {
        x: { startValue: from.x, endValue: to.x },
        y: { startValue: from.y, endValue: to.y },
        wakeIntensity: { startValue: 0, endValue: 0.8 }
      },
      ease: Easing.easeInOutQuad
    }
  }

  /**
   * Create rotation animation
   */
  static createRotationAnimation(
    config: ShipAnimationConfig,
    fromRotation: number,
    toRotation: number,
    duration?: number
  ): Partial<Animation> {
    const angleDiff = Math.abs(toRotation - fromRotation)
    const turnRate = this.getTurnRateByClass(config.shipClass)
    const animDuration = duration || Math.max(300, angleDiff / turnRate * 1000)

    return {
      target: config,
      duration: animDuration,
      properties: {
        rotation: { startValue: fromRotation, endValue: toRotation },
        turnWakeIntensity: { startValue: 0, endValue: 0.6 },
        tilt: { startValue: 0, endValue: -2 }
      },
      ease: Easing.easeInOutCubic
    }
  }

  /**
   * Create ability animation
   */
  static createAbilityAnimation(
    config: ShipAnimationConfig,
    abilityType: string
  ): Partial<Animation> {
    const presetKey = `ABILITY_${abilityType.toUpperCase()}`
    const preset = ShipAnimationPresets[presetKey]

    if (!preset) {
      throw new Error(`Unknown ability animation: ${abilityType}`)
    }

    return {
      target: config,
      duration: preset.duration,
      properties: preset.properties,
      ease: preset.ease,
      loop: preset.loop
    }
  }

  /**
   * Scale animation duration by ship size
   */
  private static scaleDurationBySize(baseDuration: number, size: number): number {
    // Larger ships have slightly longer animations
    const sizeMultiplier = 0.8 + (size * 0.1)
    return Math.round(baseDuration * sizeMultiplier)
  }

  /**
   * Scale animation properties by intensity
   */
  private static scaleProperties(properties: AnimationProps, intensity: number): AnimationProps {
    const scaled: AnimationProps = {}

    Object.entries(properties).forEach(([key, prop]) => {
      scaled[key] = {
        ...prop,
        startValue: prop.startValue * intensity,
        endValue: prop.endValue * intensity
      }
    })

    return scaled
  }

  /**
   * Get animation intensity by ship class
   */
  private static getIntensityByClass(shipClass: ShipClass): number {
    const intensities = {
      [ShipClass.CORVETTE]: 0.6,
      [ShipClass.FRIGATE]: 0.7,
      [ShipClass.DESTROYER]: 0.8,
      [ShipClass.LIGHT_CRUISER]: 0.9,
      [ShipClass.HEAVY_CRUISER]: 1.0,
      [ShipClass.BATTLECRUISER]: 1.2,
      [ShipClass.BATTLESHIP]: 1.5,
      [ShipClass.CARRIER]: 1.3,
      [ShipClass.SUBMARINE]: 0.5
    }

    return intensities[shipClass] || 1.0
  }

  /**
   * Get ship speed for movement animations
   */
  private static getSpeedByClass(shipClass: ShipClass): number {
    const speeds = {
      [ShipClass.CORVETTE]: 100,
      [ShipClass.FRIGATE]: 90,
      [ShipClass.DESTROYER]: 80,
      [ShipClass.LIGHT_CRUISER]: 70,
      [ShipClass.HEAVY_CRUISER]: 60,
      [ShipClass.BATTLECRUISER]: 65,
      [ShipClass.BATTLESHIP]: 50,
      [ShipClass.CARRIER]: 55,
      [ShipClass.SUBMARINE]: 40
    }

    return speeds[shipClass] || 60
  }

  /**
   * Get ship turn rate for rotation animations
   */
  private static getTurnRateByClass(shipClass: ShipClass): number {
    const turnRates = {
      [ShipClass.CORVETTE]: 120,
      [ShipClass.FRIGATE]: 100,
      [ShipClass.DESTROYER]: 90,
      [ShipClass.LIGHT_CRUISER]: 70,
      [ShipClass.HEAVY_CRUISER]: 60,
      [ShipClass.BATTLECRUISER]: 50,
      [ShipClass.BATTLESHIP]: 40,
      [ShipClass.CARRIER]: 30,
      [ShipClass.SUBMARINE]: 80
    }

    return turnRates[shipClass] || 60
  }

  /**
   * Check if ship should have bobbing animation
   */
  private static shouldBob(shipClass: ShipClass): boolean {
    // All surface ships bob, submarines don't
    return shipClass !== ShipClass.SUBMARINE
  }

  /**
   * Check if ship should have swaying animation
   */
  private static shouldSway(shipClass: ShipClass): boolean {
    // Larger ships sway more
    const swayingClasses = [
      ShipClass.BATTLESHIP,
      ShipClass.BATTLECRUISER,
      ShipClass.CARRIER,
      ShipClass.HEAVY_CRUISER
    ]

    return swayingClasses.includes(shipClass)
  }
}
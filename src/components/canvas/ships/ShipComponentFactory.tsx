'use client'

/**
 * ShipComponentFactory
 *
 * Factory for creating complete ship rendering components with all systems.
 * Simplifies integration of sprites, animations, damage, and abilities.
 */

import React from 'react'
import { Group } from 'react-konva'
import { ShipRenderer, ShipRenderConfig } from './ShipRenderer'
import { DamageVisualizer, DamageState } from './DamageVisualizer'
import { AbilityEffectsRenderer, AbilityEffect } from './AbilityEffectsRenderer'
import { ShipAnimations, AnimationTrigger, ShipAnimationConfig } from './ShipAnimations'
import { ShipSpriteManager } from '../../../lib/canvas/sprites/ShipSpriteManager'
import { ShipClass, ShipEra } from '../../../lib/database/types/enums'

export interface CompleteShipConfig extends ShipRenderConfig {
  damageState: DamageState
  activeAbilities: AbilityEffect[]
  animationTriggers: AnimationTrigger[]
}

export interface ShipFactoryOptions {
  spriteManager: ShipSpriteManager
  enableAnimations: boolean
  enableEffects: boolean
  enableDamageVisualization: boolean
  enableAbilityEffects: boolean
  showHealthBar: boolean
  showSelection: boolean
  performanceLevel: 'low' | 'medium' | 'high'
}

const DEFAULT_FACTORY_OPTIONS: ShipFactoryOptions = {
  spriteManager: new ShipSpriteManager(),
  enableAnimations: true,
  enableEffects: true,
  enableDamageVisualization: true,
  enableAbilityEffects: true,
  showHealthBar: true,
  showSelection: true,
  performanceLevel: 'medium'
}

/**
 * Factory class for creating complete ship components
 */
export class ShipComponentFactory {
  private options: ShipFactoryOptions

  constructor(options: Partial<ShipFactoryOptions> = {}) {
    this.options = { ...DEFAULT_FACTORY_OPTIONS, ...options }
  }

  /**
   * Create a complete ship component with all systems
   */
  createCompleteShip(
    config: CompleteShipConfig,
    handlers?: {
      onClick?: (shipId: string) => void
      onHover?: (shipId: string, isHovering: boolean) => void
      onAnimationComplete?: (animationId: string) => void
      onAbilityEffectComplete?: (abilityId: string) => void
    }
  ): React.ReactElement {
    const shipBounds = this.calculateShipBounds(config)
    const animationConfig = this.createAnimationConfig(config)

    // Apply performance optimizations
    const effectiveOptions = this.applyPerformanceOptimizations(this.options, config)

    return (
      <Group key={`complete-ship-${config.id}`}>
        {/* Ship animations wrapper */}
        <ShipAnimations
          shipConfig={animationConfig}
          triggers={config.animationTriggers}
          enableAnimations={effectiveOptions.enableAnimations}
          onAnimationComplete={handlers?.onAnimationComplete}
        >
          {/* Main ship renderer */}
          <ShipRenderer
            config={config}
            spriteManager={effectiveOptions.spriteManager}
            enableAnimations={effectiveOptions.enableAnimations}
            enableEffects={effectiveOptions.enableEffects}
            showDamage={effectiveOptions.enableDamageVisualization}
            showSelection={effectiveOptions.showSelection}
            onClick={handlers?.onClick}
            onHover={handlers?.onHover}
            onAnimationComplete={handlers?.onAnimationComplete}
          />

          {/* Damage visualization */}
          {effectiveOptions.enableDamageVisualization && (
            <DamageVisualizer
              damageState={config.damageState}
              shipBounds={shipBounds}
              position={{ x: 0, y: 0 }}
              enableEffects={effectiveOptions.enableEffects}
              enableAnimation={effectiveOptions.enableAnimations}
              showHealthBar={effectiveOptions.showHealthBar}
            />
          )}

          {/* Ability effects */}
          {effectiveOptions.enableAbilityEffects && config.activeAbilities.length > 0 && (
            <AbilityEffectsRenderer
              abilities={config.activeAbilities}
              shipBounds={shipBounds}
              enableEffects={effectiveOptions.enableEffects}
              enableAnimation={effectiveOptions.enableAnimations}
              onEffectComplete={handlers?.onAbilityEffectComplete}
            />
          )}
        </ShipAnimations>
      </Group>
    )
  }

  /**
   * Create a basic ship component (sprite only)
   */
  createBasicShip(
    config: ShipRenderConfig,
    onClick?: (shipId: string) => void
  ): React.ReactElement {
    return (
      <ShipRenderer
        key={`basic-ship-${config.id}`}
        config={config}
        spriteManager={this.options.spriteManager}
        enableAnimations={false}
        enableEffects={false}
        showDamage={false}
        showSelection={false}
        onClick={onClick}
      />
    )
  }

  /**
   * Create ship with animations only
   */
  createAnimatedShip(
    config: CompleteShipConfig,
    handlers?: {
      onClick?: (shipId: string) => void
      onAnimationComplete?: (animationId: string) => void
    }
  ): React.ReactElement {
    const animationConfig = this.createAnimationConfig(config)

    return (
      <ShipAnimations
        key={`animated-ship-${config.id}`}
        shipConfig={animationConfig}
        triggers={config.animationTriggers}
        enableAnimations={this.options.enableAnimations}
        onAnimationComplete={handlers?.onAnimationComplete}
      >
        <ShipRenderer
          config={config}
          spriteManager={this.options.spriteManager}
          enableAnimations={this.options.enableAnimations}
          enableEffects={this.options.enableEffects}
          showDamage={false}
          showSelection={this.options.showSelection}
          onClick={handlers?.onClick}
        />
      </ShipAnimations>
    )
  }

  /**
   * Create ship with damage visualization
   */
  createDamagedShip(
    config: CompleteShipConfig,
    onClick?: (shipId: string) => void
  ): React.ReactElement {
    const shipBounds = this.calculateShipBounds(config)

    return (
      <Group key={`damaged-ship-${config.id}`}>
        <ShipRenderer
          config={config}
          spriteManager={this.options.spriteManager}
          enableAnimations={this.options.enableAnimations}
          enableEffects={this.options.enableEffects}
          showDamage={true}
          showSelection={this.options.showSelection}
          onClick={onClick}
        />

        <DamageVisualizer
          damageState={config.damageState}
          shipBounds={shipBounds}
          position={{ x: 0, y: 0 }}
          enableEffects={this.options.enableEffects}
          enableAnimation={this.options.enableAnimations}
          showHealthBar={this.options.showHealthBar}
        />
      </Group>
    )
  }

  /**
   * Create fleet of ships with optimized rendering
   */
  createFleet(
    ships: CompleteShipConfig[],
    handlers?: {
      onClick?: (shipId: string) => void
      onHover?: (shipId: string, isHovering: boolean) => void
      onAnimationComplete?: (animationId: string) => void
    }
  ): React.ReactElement {
    // Sort ships by distance for proper rendering order
    const sortedShips = [...ships].sort((a, b) => {
      const aDistance = Math.sqrt(a.position.x ** 2 + a.position.y ** 2)
      const bDistance = Math.sqrt(b.position.x ** 2 + b.position.y ** 2)
      return bDistance - aDistance // Render furthest first
    })

    return (
      <Group key="fleet">
        {sortedShips.map(shipConfig => {
          // Use performance-appropriate component based on ship importance
          const isImportantShip = shipConfig.isSelected ||
                                 shipConfig.damageState !== 'undamaged' ||
                                 shipConfig.activeAbilities.length > 0

          if (isImportantShip) {
            return this.createCompleteShip(shipConfig, handlers)
          } else {
            return this.createBasicShip(shipConfig, handlers?.onClick)
          }
        })}
      </Group>
    )
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private calculateShipBounds(config: ShipRenderConfig) {
    // Base size calculation
    const baseSize = config.size * 20 // 20 pixels per size unit

    return {
      width: baseSize,
      height: baseSize * 0.6 // Ships are typically longer than wide
    }
  }

  private createAnimationConfig(config: ShipRenderConfig): ShipAnimationConfig {
    return {
      shipClass: config.shipClass,
      era: config.era,
      size: config.size,
      position: config.position,
      scale: config.scale
    }
  }

  private applyPerformanceOptimizations(
    options: ShipFactoryOptions,
    config: ShipRenderConfig
  ): ShipFactoryOptions {
    const optimized = { ...options }

    // Reduce effects based on performance level
    switch (options.performanceLevel) {
      case 'low':
        optimized.enableAnimations = false
        optimized.enableEffects = false
        optimized.enableAbilityEffects = false
        break

      case 'medium':
        optimized.enableAnimations = config.isSelected || config.isHighlighted
        optimized.enableEffects = config.isSelected
        break

      case 'high':
        // Keep all effects enabled
        break
    }

    // Distance-based optimizations
    const distance = Math.sqrt(config.position.x ** 2 + config.position.y ** 2)
    if (distance > 1000) { // Far away ships
      optimized.enableAnimations = false
      optimized.enableAbilityEffects = false
    }

    return optimized
  }

  // =============================================
  // STATIC FACTORY METHODS
  // =============================================

  /**
   * Create factory with low performance settings
   */
  static createLowPerformance(spriteManager: ShipSpriteManager): ShipComponentFactory {
    return new ShipComponentFactory({
      spriteManager,
      enableAnimations: false,
      enableEffects: false,
      enableDamageVisualization: true,
      enableAbilityEffects: false,
      performanceLevel: 'low'
    })
  }

  /**
   * Create factory with high performance settings
   */
  static createHighPerformance(spriteManager: ShipSpriteManager): ShipComponentFactory {
    return new ShipComponentFactory({
      spriteManager,
      enableAnimations: true,
      enableEffects: true,
      enableDamageVisualization: true,
      enableAbilityEffects: true,
      performanceLevel: 'high'
    })
  }

  /**
   * Create factory optimized for mobile devices
   */
  static createMobileOptimized(spriteManager: ShipSpriteManager): ShipComponentFactory {
    return new ShipComponentFactory({
      spriteManager,
      enableAnimations: true,
      enableEffects: false,
      enableDamageVisualization: true,
      enableAbilityEffects: false,
      showHealthBar: false,
      performanceLevel: 'medium'
    })
  }

  // =============================================
  // CONFIGURATION METHODS
  // =============================================

  /**
   * Update factory options
   */
  updateOptions(newOptions: Partial<ShipFactoryOptions>): void {
    this.options = { ...this.options, ...newOptions }
  }

  /**
   * Get current factory options
   */
  getOptions(): ShipFactoryOptions {
    return { ...this.options }
  }

  /**
   * Reset to default options
   */
  resetOptions(): void {
    this.options = { ...DEFAULT_FACTORY_OPTIONS }
  }
}

// =============================================
// CONVENIENCE HOOKS AND UTILITIES
// =============================================

/**
 * React hook for using ship factory
 */
export const useShipComponentFactory = (options?: Partial<ShipFactoryOptions>) => {
  const factory = React.useMemo(() => new ShipComponentFactory(options), [options])
  return factory
}

/**
 * Create ship configuration from minimal data
 */
export const createShipConfig = (data: {
  id: string
  era: ShipEra
  shipClass: ShipClass
  position: { x: number; y: number; rotation?: number }
  hitPoints?: number
  maxHitPoints?: number
  isSelected?: boolean
  size?: number
}): CompleteShipConfig => {
  const maxHP = data.maxHitPoints || getDefaultHitPoints(data.shipClass)
  const currentHP = data.hitPoints || maxHP

  return {
    ...data,
    rotation: data.position.rotation || 0,
    scale: 1,
    size: data.size || getDefaultSize(data.shipClass),
    hitPoints: currentHP,
    maxHitPoints: maxHP,
    isSelected: data.isSelected || false,
    isHighlighted: false,
    isVisible: true,
    damageState: calculateDamageState(currentHP, maxHP),
    activeAbilities: [],
    animationTriggers: [],
    position: {
      x: data.position.x,
      y: data.position.y,
      rotation: data.position.rotation || 0
    }
  }
}

function getDefaultHitPoints(shipClass: ShipClass): number {
  const hitPoints: Record<ShipClass, number> = {
    [ShipClass.CORVETTE]: 2,
    [ShipClass.FRIGATE]: 3,
    [ShipClass.DESTROYER]: 3,
    [ShipClass.LIGHT_CRUISER]: 4,
    [ShipClass.HEAVY_CRUISER]: 5,
    [ShipClass.BATTLECRUISER]: 6,
    [ShipClass.BATTLESHIP]: 8,
    [ShipClass.CARRIER]: 7,
    [ShipClass.SUBMARINE]: 2
  }
  return hitPoints[shipClass] || 3
}

function getDefaultSize(shipClass: ShipClass): number {
  const sizes: Record<ShipClass, number> = {
    [ShipClass.CORVETTE]: 2,
    [ShipClass.FRIGATE]: 2,
    [ShipClass.DESTROYER]: 3,
    [ShipClass.LIGHT_CRUISER]: 3,
    [ShipClass.HEAVY_CRUISER]: 4,
    [ShipClass.BATTLECRUISER]: 5,
    [ShipClass.BATTLESHIP]: 5,
    [ShipClass.CARRIER]: 5,
    [ShipClass.SUBMARINE]: 2
  }
  return sizes[shipClass] || 3
}

function calculateDamageState(hitPoints: number, maxHitPoints: number): DamageState['level'] {
  const healthPercent = hitPoints / maxHitPoints

  if (hitPoints <= 0) return 'sunk'
  if (healthPercent <= 0.1) return 'sinking'
  if (healthPercent <= 0.3) return 'critical'
  if (healthPercent <= 0.6) return 'heavy'
  if (healthPercent <= 0.9) return 'light'
  return 'undamaged'
}

export default ShipComponentFactory
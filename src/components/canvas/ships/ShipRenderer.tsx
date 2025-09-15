'use client'

/**
 * ShipRenderer Component
 *
 * Main ship rendering component that orchestrates sprite rendering,
 * animations, damage visualization, and special effects.
 */

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { Group, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import { ShipSpriteManager, ShipVisualConfig, RenderableSprite } from '../../../lib/canvas/sprites/ShipSpriteManager'
import { globalAnimationEngine } from '../../../lib/canvas/animations/AnimationEngine'
import { globalAnimationQueue, AnimationCategory } from '../../../lib/canvas/animations/AnimationQueue'
import { ShipAnimationFactory } from '../../../lib/canvas/animations/ShipAnimations'
import { ShipClass, ShipEra } from '../../../lib/database/types/enums'

export interface ShipRenderConfig {
  id: string
  era: ShipEra
  shipClass: ShipClass
  position: { x: number; y: number; rotation: number }
  scale: number
  size: number
  hitPoints: number
  maxHitPoints: number
  isSelected: boolean
  isHighlighted: boolean
  isVisible: boolean
  damageState: 'undamaged' | 'light' | 'heavy' | 'sinking' | 'sunk'
  abilityStates?: Record<string, boolean>
}

export interface ShipRendererProps {
  config: ShipRenderConfig
  spriteManager: ShipSpriteManager
  enableAnimations?: boolean
  enableEffects?: boolean
  showDamage?: boolean
  showSelection?: boolean
  onClick?: (shipId: string) => void
  onHover?: (shipId: string, isHovering: boolean) => void
  onAnimationComplete?: (animationId: string) => void
}

interface ShipRenderState {
  sprite: RenderableSprite | null
  animationState: {
    x: number
    y: number
    rotation: number
    scaleX: number
    scaleY: number
    alpha: number
    tint: string
    glowIntensity: number
  }
  isLoading: boolean
  error: string | null
}

/**
 * High-performance ship renderer with animations and effects
 */
export const ShipRenderer: React.FC<ShipRendererProps> = ({
  config,
  spriteManager,
  enableAnimations = true,
  enableEffects = true,
  showDamage = true,
  showSelection = true,
  onClick,
  onHover,
  onAnimationComplete
}) => {
  // Refs
  const groupRef = useRef<Konva.Group>(null)
  const imageRef = useRef<Konva.Image>(null)

  // State
  const [renderState, setRenderState] = useState<ShipRenderState>({
    sprite: null,
    animationState: {
      x: config.position.x,
      y: config.position.y,
      rotation: config.position.rotation,
      scaleX: config.scale,
      scaleY: config.scale,
      alpha: config.isVisible ? 1 : 0,
      tint: '#ffffff',
      glowIntensity: 0
    },
    isLoading: true,
    error: null
  })

  // Animation tracking
  const activeAnimationsRef = useRef<Set<string>>(new Set())

  // =============================================
  // SPRITE LOADING
  // =============================================

  const visualConfig: ShipVisualConfig = useMemo(() => ({
    era: config.era,
    shipClass: config.shipClass,
    customization: config.abilityStates ? {
      weathering: Math.max(0, 1 - (config.hitPoints / config.maxHitPoints))
    } : undefined
  }), [config.era, config.shipClass, config.hitPoints, config.maxHitPoints, config.abilityStates])

  useEffect(() => {
    let isMounted = true

    const loadSprite = async () => {
      try {
        setRenderState(prev => ({ ...prev, isLoading: true, error: null }))

        const sprite = await spriteManager.getShipSprite(visualConfig)

        if (isMounted) {
          setRenderState(prev => ({
            ...prev,
            sprite,
            isLoading: false
          }))
        }
      } catch (error) {
        console.error(`Failed to load ship sprite for ${config.id}:`, error)
        if (isMounted) {
          setRenderState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false
          }))
        }
      }
    }

    loadSprite()

    return () => {
      isMounted = false
    }
  }, [spriteManager, visualConfig, config.id])

  // =============================================
  // ANIMATION MANAGEMENT
  // =============================================

  const startAnimation = useCallback((
    type: 'placement' | 'selection' | 'movement' | 'combat' | 'damage',
    options: any = {}
  ) => {
    if (!enableAnimations) return

    const animationConfig = {
      shipClass: config.shipClass,
      era: config.era,
      size: config.size,
      position: config.position,
      scale: config.scale
    }

    let animation

    switch (type) {
      case 'placement':
        animation = ShipAnimationFactory.createPlacementAnimation(animationConfig)
        break
      case 'selection':
        animation = config.isSelected
          ? ShipAnimationFactory.createAbilityAnimation(animationConfig, 'SELECT')
          : ShipAnimationFactory.createAbilityAnimation(animationConfig, 'DESELECT')
        break
      case 'movement':
        animation = ShipAnimationFactory.createMovementAnimation(
          animationConfig,
          options.from,
          options.to,
          options.duration
        )
        break
      case 'combat':
        animation = ShipAnimationFactory.createCombatAnimation(
          animationConfig,
          options.combatType
        )
        break
      case 'damage':
        animation = ShipAnimationFactory.createDamageAnimation(
          animationConfig,
          config.damageState as any
        )
        break
    }

    if (animation) {
      const animationId = globalAnimationQueue.enqueue({
        ...animation,
        category: type as AnimationCategory,
        priority: getAnimationPriority(type),
        blocking: type === 'movement' || type === 'combat',
        onUpdate: (values) => {
          setRenderState(prev => ({
            ...prev,
            animationState: {
              ...prev.animationState,
              ...values
            }
          }))
        },
        onComplete: () => {
          activeAnimationsRef.current.delete(animationId)
          if (onAnimationComplete) {
            onAnimationComplete(animationId)
          }
        }
      })

      activeAnimationsRef.current.add(animationId)
      return animationId
    }
  }, [config, enableAnimations, onAnimationComplete])

  // =============================================
  // EFFECT HANDLERS
  // =============================================

  useEffect(() => {
    if (config.isSelected !== undefined) {
      startAnimation('selection')
    }
  }, [config.isSelected, startAnimation])

  useEffect(() => {
    if (showDamage && config.damageState !== 'undamaged') {
      startAnimation('damage')
    }
  }, [config.damageState, showDamage, startAnimation])

  // Position changes
  const prevPositionRef = useRef(config.position)
  useEffect(() => {
    const prevPos = prevPositionRef.current
    const currentPos = config.position

    if (prevPos.x !== currentPos.x || prevPos.y !== currentPos.y) {
      startAnimation('movement', {
        from: prevPos,
        to: currentPos
      })
    }

    prevPositionRef.current = currentPos
  }, [config.position, startAnimation])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(config.id)
    }
  }, [onClick, config.id])

  const handleMouseEnter = useCallback(() => {
    if (onHover) {
      onHover(config.id, true)
    }

    // Start highlight animation
    if (enableAnimations && !config.isSelected) {
      startAnimation('selection')
    }
  }, [onHover, config.id, enableAnimations, config.isSelected, startAnimation])

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(config.id, false)
    }
  }, [onHover, config.id])

  // =============================================
  // RENDER HELPERS
  // =============================================

  const getAnimationPriority = (type: string): number => {
    const priorities = {
      combat: 100,
      damage: 90,
      movement: 80,
      selection: 70,
      placement: 60,
      effects: 50
    }
    return priorities[type as keyof typeof priorities] || 50
  }

  const getDamageAlpha = (): number => {
    if (!showDamage) return 1

    switch (config.damageState) {
      case 'sunk':
        return 0.3
      case 'sinking':
        return 0.6
      case 'heavy':
        return 0.8
      case 'light':
        return 0.9
      default:
        return 1
    }
  }

  const getDamageTint = (): string => {
    if (!showDamage || !enableEffects) return '#ffffff'

    switch (config.damageState) {
      case 'sunk':
        return '#666666'
      case 'sinking':
        return '#888888'
      case 'heavy':
        return '#aa9999'
      case 'light':
        return '#ccbbbb'
      default:
        return '#ffffff'
    }
  }

  // =============================================
  // RENDER
  // =============================================

  if (renderState.isLoading || !renderState.sprite) {
    return (
      <Group
        ref={groupRef}
        x={renderState.animationState.x}
        y={renderState.animationState.y}
        rotation={renderState.animationState.rotation}
        scaleX={renderState.animationState.scaleX}
        scaleY={renderState.animationState.scaleY}
        alpha={renderState.animationState.alpha}
        listening={false}
      >
        {/* Loading placeholder - simple rectangle */}
        <KonvaImage
          width={config.size * 20}
          height={config.size * 12}
          x={-config.size * 10}
          y={-config.size * 6}
          fill="#cccccc"
          listening={false}
        />
      </Group>
    )
  }

  if (renderState.error) {
    console.warn(`ShipRenderer error for ${config.id}:`, renderState.error)
  }

  return (
    <Group
      ref={groupRef}
      x={renderState.animationState.x}
      y={renderState.animationState.y}
      rotation={renderState.animationState.rotation}
      scaleX={renderState.animationState.scaleX}
      scaleY={renderState.animationState.scaleY}
      alpha={renderState.animationState.alpha * getDamageAlpha()}
      listening={!config.isVisible}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main ship sprite */}
      <KonvaImage
        ref={imageRef}
        image={renderState.sprite.image}
        x={-renderState.sprite.frame.anchorX}
        y={-renderState.sprite.frame.anchorY}
        width={renderState.sprite.frame.width}
        height={renderState.sprite.frame.height}
        crop={{
          x: renderState.sprite.frame.x,
          y: renderState.sprite.frame.y,
          width: renderState.sprite.frame.width,
          height: renderState.sprite.frame.height
        }}
        filters={enableEffects ? [Konva.Filters.RGB] : []}
        red={enableEffects ? getTintValue(getDamageTint(), 'r') : 1}
        green={enableEffects ? getTintValue(getDamageTint(), 'g') : 1}
        blue={enableEffects ? getTintValue(getDamageTint(), 'b') : 1}
        shadowEnabled={enableEffects && (config.isSelected || renderState.animationState.glowIntensity > 0)}
        shadowColor={config.isSelected ? '#00ff00' : '#ffffff'}
        shadowBlur={renderState.animationState.glowIntensity * 10}
        shadowOpacity={renderState.animationState.glowIntensity * 0.8}
        perfectDrawEnabled={false}
        listening={false}
      />

      {/* Selection indicator */}
      {showSelection && config.isSelected && (
        <Group>
          {/* Selection circle */}
          <Konva.Circle
            radius={Math.max(renderState.sprite.frame.width, renderState.sprite.frame.height) * 0.6}
            stroke="#00ff00"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
            opacity={0.7}
          />
        </Group>
      )}
    </Group>
  )

  // =============================================
  // HELPER FUNCTIONS
  // =============================================

  /**
   * Get tint value for specific color channel
   */
  const getTintValue = (tint: string, channel: 'r' | 'g' | 'b'): number => {
    const hex = tint.replace('#', '')
    const channelIndex = { r: 0, g: 2, b: 4 }[channel]
    const value = parseInt(hex.substr(channelIndex, 2), 16) / 255
    return value
  }
}

ShipRenderer.displayName = 'ShipRenderer'

export default ShipRenderer
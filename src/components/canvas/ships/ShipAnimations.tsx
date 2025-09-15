'use client'

/**
 * ShipAnimations Component
 *
 * Component wrapper for ship-specific animations and effects.
 * Manages animation lifecycle and coordinates with the animation engine.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Group } from 'react-konva'
import { globalAnimationEngine } from '../../../lib/canvas/animations/AnimationEngine'
import { globalAnimationQueue, AnimationCategory, QueuedAnimation } from '../../../lib/canvas/animations/AnimationQueue'
import { ShipAnimationFactory, ShipAnimationConfig } from '../../../lib/canvas/animations/ShipAnimations'

export interface AnimationTrigger {
  type: 'placement' | 'movement' | 'combat' | 'damage' | 'ability' | 'idle'
  config?: any
  priority?: number
  blocking?: boolean
  onComplete?: () => void
}

export interface ShipAnimationsProps {
  shipConfig: ShipAnimationConfig
  triggers: AnimationTrigger[]
  enableAnimations: boolean
  children: React.ReactNode
  onAnimationStart?: (animationId: string, type: string) => void
  onAnimationComplete?: (animationId: string, type: string) => void
}

interface AnimationState {
  activeAnimations: Map<string, { type: string; startTime: number }>
  lastTriggerHash: string
  animationValues: Record<string, number>
}

/**
 * Ship animation coordinator component
 */
export const ShipAnimations: React.FC<ShipAnimationsProps> = ({
  shipConfig,
  triggers,
  enableAnimations,
  children,
  onAnimationStart,
  onAnimationComplete
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    activeAnimations: new Map(),
    lastTriggerHash: '',
    animationValues: {
      x: shipConfig.position.x,
      y: shipConfig.position.y,
      rotation: shipConfig.position.rotation,
      scaleX: shipConfig.scale,
      scaleY: shipConfig.scale,
      alpha: 1,
      glowIntensity: 0,
      shakeX: 0,
      shakeY: 0
    }
  })

  const groupRef = useRef<any>(null)
  const idleAnimationRef = useRef<string | null>(null)

  // =============================================
  // TRIGGER PROCESSING
  // =============================================

  const triggerHash = React.useMemo(() => {
    return JSON.stringify(triggers.map(t => ({ type: t.type, config: t.config })))
  }, [triggers])

  useEffect(() => {
    if (!enableAnimations || triggerHash === animationState.lastTriggerHash) {
      return
    }

    processTriggers(triggers)
    setAnimationState(prev => ({ ...prev, lastTriggerHash: triggerHash }))
  }, [triggers, triggerHash, enableAnimations, animationState.lastTriggerHash])

  // =============================================
  // ANIMATION PROCESSING
  // =============================================

  const processTriggers = useCallback((newTriggers: AnimationTrigger[]) => {
    newTriggers.forEach(trigger => {
      const animationId = createAnimationFromTrigger(trigger)
      if (animationId) {
        setAnimationState(prev => ({
          ...prev,
          activeAnimations: new Map(prev.activeAnimations).set(animationId, {
            type: trigger.type,
            startTime: Date.now()
          })
        }))

        if (onAnimationStart) {
          onAnimationStart(animationId, trigger.type)
        }
      }
    })
  }, [onAnimationStart])

  const createAnimationFromTrigger = useCallback((trigger: AnimationTrigger): string | null => {
    if (!enableAnimations) return null

    let animation: Partial<any> | null = null

    switch (trigger.type) {
      case 'placement':
        animation = ShipAnimationFactory.createPlacementAnimation(shipConfig)
        break

      case 'movement':
        if (trigger.config && trigger.config.from && trigger.config.to) {
          animation = ShipAnimationFactory.createMovementAnimation(
            shipConfig,
            trigger.config.from,
            trigger.config.to,
            trigger.config.duration
          )
        }
        break

      case 'combat':
        if (trigger.config && trigger.config.combatType) {
          animation = ShipAnimationFactory.createCombatAnimation(
            shipConfig,
            trigger.config.combatType
          )
        }
        break

      case 'damage':
        if (trigger.config && trigger.config.damageLevel) {
          animation = ShipAnimationFactory.createDamageAnimation(
            shipConfig,
            trigger.config.damageLevel
          )
        }
        break

      case 'ability':
        if (trigger.config && trigger.config.abilityType) {
          animation = ShipAnimationFactory.createAbilityAnimation(
            shipConfig,
            trigger.config.abilityType
          )
        }
        break

      case 'idle':
        const idleAnimations = ShipAnimationFactory.createIdleAnimations(shipConfig)
        idleAnimations.forEach(idleAnim => {
          const queuedAnimation: QueuedAnimation = {
            ...idleAnim,
            category: 'background',
            priority: 10,
            blocking: false,
            onUpdate: (values) => {
              setAnimationState(prev => ({
                ...prev,
                animationValues: { ...prev.animationValues, ...values }
              }))
            }
          }
          globalAnimationQueue.enqueue(queuedAnimation)
        })
        return null // Idle animations are handled differently

      default:
        return null
    }

    if (!animation) return null

    const queuedAnimation: QueuedAnimation = {
      ...animation,
      category: getCategoryFromType(trigger.type),
      priority: trigger.priority || getDefaultPriority(trigger.type),
      blocking: trigger.blocking !== undefined ? trigger.blocking : isBlockingByDefault(trigger.type),
      onUpdate: (values) => {
        setAnimationState(prev => ({
          ...prev,
          animationValues: { ...prev.animationValues, ...values }
        }))
      },
      onComplete: () => {
        const animationId = queuedAnimation.id!
        handleAnimationComplete(animationId, trigger.type)
        if (trigger.onComplete) {
          trigger.onComplete()
        }
      }
    }

    return globalAnimationQueue.enqueue(queuedAnimation)
  }, [enableAnimations, shipConfig])

  // =============================================
  // ANIMATION LIFECYCLE
  // =============================================

  const handleAnimationComplete = useCallback((animationId: string, type: string) => {
    setAnimationState(prev => {
      const newActiveAnimations = new Map(prev.activeAnimations)
      newActiveAnimations.delete(animationId)

      return {
        ...prev,
        activeAnimations: newActiveAnimations
      }
    })

    if (onAnimationComplete) {
      onAnimationComplete(animationId, type)
    }
  }, [onAnimationComplete])

  // =============================================
  // IDLE ANIMATIONS
  // =============================================

  useEffect(() => {
    if (!enableAnimations) return

    // Start idle animations if no other animations are active
    if (animationState.activeAnimations.size === 0 && !idleAnimationRef.current) {
      const idleAnimations = ShipAnimationFactory.createIdleAnimations(shipConfig)

      if (idleAnimations.length > 0) {
        const firstIdle = idleAnimations[0]
        const queuedAnimation: QueuedAnimation = {
          ...firstIdle,
          category: 'background',
          priority: 1,
          blocking: false,
          onUpdate: (values) => {
            setAnimationState(prev => ({
              ...prev,
              animationValues: { ...prev.animationValues, ...values }
            }))
          },
          onComplete: () => {
            idleAnimationRef.current = null
            // Restart idle animation loop
            setTimeout(() => {
              if (animationState.activeAnimations.size === 0) {
                // Restart idle animations
              }
            }, 1000)
          }
        }

        idleAnimationRef.current = globalAnimationQueue.enqueue(queuedAnimation)
      }
    }

    return () => {
      if (idleAnimationRef.current) {
        globalAnimationQueue.remove(idleAnimationRef.current)
        idleAnimationRef.current = null
      }
    }
  }, [enableAnimations, animationState.activeAnimations.size, shipConfig])

  // =============================================
  // ANIMATION HELPERS
  // =============================================

  const getCategoryFromType = (type: string): AnimationCategory => {
    const categoryMap: Record<string, AnimationCategory> = {
      placement: 'placement',
      movement: 'movement',
      combat: 'combat',
      damage: 'damage',
      ability: 'effects',
      idle: 'background'
    }
    return categoryMap[type] || 'effects'
  }

  const getDefaultPriority = (type: string): number => {
    const priorityMap: Record<string, number> = {
      combat: 100,
      damage: 90,
      movement: 80,
      placement: 70,
      ability: 60,
      idle: 10
    }
    return priorityMap[type] || 50
  }

  const isBlockingByDefault = (type: string): boolean => {
    const blockingTypes = ['combat', 'movement', 'damage']
    return blockingTypes.includes(type)
  }

  // =============================================
  // RENDER
  // =============================================

  const groupProps = {
    ref: groupRef,
    x: animationState.animationValues.x + (animationState.animationValues.shakeX || 0),
    y: animationState.animationValues.y + (animationState.animationValues.shakeY || 0),
    rotation: animationState.animationValues.rotation || 0,
    scaleX: animationState.animationValues.scaleX || 1,
    scaleY: animationState.animationValues.scaleY || 1,
    opacity: animationState.animationValues.alpha !== undefined ? animationState.animationValues.alpha : 1,
    listening: true
  }

  return (
    <Group {...groupProps}>
      {children}

      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && (
        <Group>
          {/* Animation state indicator */}
          {animationState.activeAnimations.size > 0 && (
            <Group>
              {/* Small indicator showing active animations */}
              <Group opacity={0.7}>
                {Array.from(animationState.activeAnimations.entries()).map(([id, anim], index) => (
                  <Group key={id}>
                    {/* Animation type indicator */}
                  </Group>
                ))}
              </Group>
            </Group>
          )}
        </Group>
      )}
    </Group>
  )

  /**
   * Get color for animation type visualization
   */
  function getAnimationColor(type: string): string {
    const colors: Record<string, string> = {
      placement: '#00ff00',
      movement: '#0099ff',
      combat: '#ff0000',
      damage: '#ff6600',
      ability: '#ff00ff',
      idle: '#666666'
    }
    return colors[type] || '#ffffff'
  }
}

// =============================================
// ANIMATION PRESET COMPONENTS
// =============================================

/**
 * Common animation patterns as reusable components
 */
export const PlacementAnimation: React.FC<{
  shipConfig: ShipAnimationConfig
  enabled: boolean
  onComplete?: () => void
}> = ({ shipConfig, enabled, onComplete }) => {
  const trigger: AnimationTrigger = {
    type: 'placement',
    onComplete
  }

  return (
    <ShipAnimations
      shipConfig={shipConfig}
      triggers={enabled ? [trigger] : []}
      enableAnimations={enabled}
    >
      {null}
    </ShipAnimations>
  )
}

export const CombatAnimation: React.FC<{
  shipConfig: ShipAnimationConfig
  combatType: 'fire' | 'hit' | 'explosion'
  enabled: boolean
  onComplete?: () => void
}> = ({ shipConfig, combatType, enabled, onComplete }) => {
  const trigger: AnimationTrigger = {
    type: 'combat',
    config: { combatType },
    onComplete
  }

  return (
    <ShipAnimations
      shipConfig={shipConfig}
      triggers={enabled ? [trigger] : []}
      enableAnimations={enabled}
    >
      {null}
    </ShipAnimations>
  )
}

export const MovementAnimation: React.FC<{
  shipConfig: ShipAnimationConfig
  from: { x: number; y: number }
  to: { x: number; y: number }
  duration?: number
  enabled: boolean
  onComplete?: () => void
}> = ({ shipConfig, from, to, duration, enabled, onComplete }) => {
  const trigger: AnimationTrigger = {
    type: 'movement',
    config: { from, to, duration },
    onComplete
  }

  return (
    <ShipAnimations
      shipConfig={shipConfig}
      triggers={enabled ? [trigger] : []}
      enableAnimations={enabled}
    >
      {null}
    </ShipAnimations>
  )
}

ShipAnimations.displayName = 'ShipAnimations'

export default ShipAnimations
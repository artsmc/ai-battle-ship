'use client'

/**
 * DamageVisualizer Component
 *
 * Visual representation of ship damage states with dynamic effects.
 * Shows smoke, fire, flooding, listing, and destruction animations.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react'
import { Group, Circle, Rect, Line, Shape } from 'react-konva'
import Konva from 'konva'
import { globalAnimationEngine, Easing } from '../../../lib/canvas/animations/AnimationEngine'

export interface DamageState {
  level: 'undamaged' | 'light' | 'heavy' | 'critical' | 'sinking' | 'sunk'
  hitPoints: number
  maxHitPoints: number
  damageTypes: {
    hull: number    // 0-1
    engine: number  // 0-1
    weapons: number // 0-1
    flooding: number // 0-1
  }
  recentDamage?: {
    amount: number
    timestamp: number
    position: { x: number; y: number }
  }
}

export interface DamageVisualizerProps {
  damageState: DamageState
  shipBounds: { width: number; height: number }
  position: { x: number; y: number }
  enableEffects: boolean
  enableAnimation: boolean
  showHealthBar: boolean
  onAnimationComplete?: () => void
}

interface EffectState {
  smoke: {
    particles: Array<{
      id: string
      x: number
      y: number
      opacity: number
      scale: number
      velocity: { x: number; y: number }
      life: number
    }>
  }
  fire: {
    flames: Array<{
      id: string
      x: number
      y: number
      intensity: number
      flicker: number
    }>
  }
  water: {
    bubbles: Array<{
      id: string
      x: number
      y: number
      size: number
      velocity: number
    }>
  }
  sparks: Array<{
    id: string
    x: number
    y: number
    velocity: { x: number; y: number }
    life: number
  }>
}

/**
 * Advanced damage visualization with particle effects
 */
export const DamageVisualizer: React.FC<DamageVisualizerProps> = ({
  damageState,
  shipBounds,
  position,
  enableEffects,
  enableAnimation,
  showHealthBar,
  onAnimationComplete
}) => {
  const [effects, setEffects] = useState<EffectState>({
    smoke: { particles: [] },
    fire: { flames: [] },
    water: { bubbles: [] },
    sparks: []
  })

  const animationIdRef = useRef<string | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())

  // =============================================
  // DAMAGE LEVEL CALCULATIONS
  // =============================================

  const damageMetrics = useMemo(() => {
    const healthPercent = damageState.hitPoints / damageState.maxHitPoints
    const damagePercent = 1 - healthPercent

    return {
      healthPercent,
      damagePercent,
      smokeIntensity: Math.min(1, damagePercent * 1.5),
      fireIntensity: Math.max(0, damagePercent - 0.3),
      floodingIntensity: damageState.damageTypes.flooding,
      listAngle: damageState.damageTypes.flooding * 15, // Max 15 degrees
      isDestroyed: damageState.level === 'sunk'
    }
  }, [damageState])

  // =============================================
  // PARTICLE SYSTEM
  // =============================================

  useEffect(() => {
    if (!enableEffects || !enableAnimation) return

    const updateEffects = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateRef.current
      lastUpdateRef.current = now

      setEffects(prev => {
        const newEffects = { ...prev }

        // Update smoke particles
        newEffects.smoke.particles = updateSmokeParticles(
          prev.smoke.particles,
          deltaTime,
          damageMetrics.smokeIntensity
        )

        // Update fire flames
        newEffects.fire.flames = updateFireFlames(
          prev.fire.flames,
          deltaTime,
          damageMetrics.fireIntensity
        )

        // Update water bubbles (for sinking ships)
        if (damageState.level === 'sinking' || damageState.level === 'sunk') {
          newEffects.water.bubbles = updateWaterBubbles(
            prev.water.bubbles,
            deltaTime,
            damageMetrics.floodingIntensity
          )
        }

        // Update sparks (for recent damage)
        if (damageState.recentDamage && now - damageState.recentDamage.timestamp < 2000) {
          newEffects.sparks = updateSparks(prev.sparks, deltaTime, damageState.recentDamage)
        } else {
          newEffects.sparks = []
        }

        return newEffects
      })
    }

    // Start particle animation loop
    if (damageMetrics.damagePercent > 0) {
      animationIdRef.current = globalAnimationEngine.animate({
        target: 'damage-effects',
        duration: 60000, // Long duration for continuous effects
        properties: {
          time: { startValue: 0, endValue: 1 }
        },
        ease: Easing.linear,
        loop: true,
        onUpdate: updateEffects
      })
    }

    return () => {
      if (animationIdRef.current) {
        globalAnimationEngine.stop(animationIdRef.current)
        animationIdRef.current = null
      }
    }
  }, [enableEffects, enableAnimation, damageMetrics, damageState])

  // =============================================
  // PARTICLE UPDATE FUNCTIONS
  // =============================================

  const updateSmokeParticles = (
    particles: EffectState['smoke']['particles'],
    deltaTime: number,
    intensity: number
  ): EffectState['smoke']['particles'] => {
    let newParticles = [...particles]

    // Remove dead particles
    newParticles = newParticles.filter(particle => particle.life > 0)

    // Add new particles based on intensity
    const particleCount = Math.floor(intensity * 3)
    for (let i = 0; i < particleCount && newParticles.length < 20; i++) {
      newParticles.push({
        id: `smoke-${Date.now()}-${i}`,
        x: (Math.random() - 0.5) * shipBounds.width * 0.8,
        y: -shipBounds.height * 0.3,
        opacity: 0.6 + Math.random() * 0.4,
        scale: 0.2 + Math.random() * 0.3,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: -1 - Math.random() * 2
        },
        life: 3000 + Math.random() * 2000
      })
    }

    // Update existing particles
    newParticles.forEach(particle => {
      particle.x += particle.velocity.x * deltaTime * 0.01
      particle.y += particle.velocity.y * deltaTime * 0.01
      particle.life -= deltaTime
      particle.opacity = (particle.life / 5000) * 0.6
      particle.scale += deltaTime * 0.0001
    })

    return newParticles
  }

  const updateFireFlames = (
    flames: EffectState['fire']['flames'],
    deltaTime: number,
    intensity: number
  ): EffectState['fire']['flames'] => {
    if (intensity <= 0) return []

    let newFlames = [...flames]

    // Remove excess flames
    while (newFlames.length > Math.floor(intensity * 5)) {
      newFlames.pop()
    }

    // Add new flames if needed
    while (newFlames.length < Math.floor(intensity * 5)) {
      newFlames.push({
        id: `fire-${Date.now()}-${newFlames.length}`,
        x: (Math.random() - 0.5) * shipBounds.width * 0.6,
        y: -shipBounds.height * 0.2 + Math.random() * shipBounds.height * 0.4,
        intensity: 0.7 + Math.random() * 0.3,
        flicker: Math.random() * Math.PI * 2
      })
    }

    // Update flame flicker
    newFlames.forEach(flame => {
      flame.flicker += deltaTime * 0.01
      flame.intensity = 0.5 + Math.sin(flame.flicker) * 0.3
    })

    return newFlames
  }

  const updateWaterBubbles = (
    bubbles: EffectState['water']['bubbles'],
    deltaTime: number,
    intensity: number
  ): EffectState['water']['bubbles'] => {
    let newBubbles = [...bubbles]

    // Remove bubbles that reached surface
    newBubbles = newBubbles.filter(bubble => bubble.y > -shipBounds.height)

    // Add new bubbles
    const bubbleCount = Math.floor(intensity * 2)
    for (let i = 0; i < bubbleCount && newBubbles.length < 15; i++) {
      newBubbles.push({
        id: `bubble-${Date.now()}-${i}`,
        x: (Math.random() - 0.5) * shipBounds.width,
        y: shipBounds.height * 0.5,
        size: 1 + Math.random() * 3,
        velocity: -0.5 - Math.random() * 1.5
      })
    }

    // Update bubble positions
    newBubbles.forEach(bubble => {
      bubble.y += bubble.velocity * deltaTime * 0.01
      bubble.x += (Math.random() - 0.5) * deltaTime * 0.005
    })

    return newBubbles
  }

  const updateSparks = (
    sparks: EffectState['sparks'],
    deltaTime: number,
    recentDamage: NonNullable<DamageState['recentDamage']>
  ): EffectState['sparks'] => {
    let newSparks = [...sparks]

    // Remove dead sparks
    newSparks = newSparks.filter(spark => spark.life > 0)

    // Add new sparks if just damaged
    if (Date.now() - recentDamage.timestamp < 500) {
      for (let i = 0; i < 5 && newSparks.length < 10; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 3

        newSparks.push({
          id: `spark-${Date.now()}-${i}`,
          x: recentDamage.position.x,
          y: recentDamage.position.y,
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          },
          life: 1000 + Math.random() * 500
        })
      }
    }

    // Update spark positions
    newSparks.forEach(spark => {
      spark.x += spark.velocity.x * deltaTime * 0.01
      spark.y += spark.velocity.y * deltaTime * 0.01
      spark.velocity.y += deltaTime * 0.005 // Gravity
      spark.life -= deltaTime
    })

    return newSparks
  }

  // =============================================
  // HEALTH BAR COMPONENT
  // =============================================

  const renderHealthBar = () => {
    if (!showHealthBar) return null

    const barWidth = shipBounds.width * 0.8
    const barHeight = 4
    const barY = -shipBounds.height * 0.6

    return (
      <Group>
        {/* Background */}
        <Rect
          x={-barWidth / 2}
          y={barY}
          width={barWidth}
          height={barHeight}
          fill="#333333"
          stroke="#666666"
          strokeWidth={0.5}
        />

        {/* Health bar */}
        <Rect
          x={-barWidth / 2}
          y={barY}
          width={barWidth * damageMetrics.healthPercent}
          height={barHeight}
          fill={getHealthBarColor(damageMetrics.healthPercent)}
        />

        {/* Damage indicator */}
        {damageState.recentDamage && (
          <Rect
            x={-barWidth / 2 + (barWidth * damageMetrics.healthPercent)}
            y={barY}
            width={2}
            height={barHeight}
            fill="#ff0000"
            opacity={0.8}
          />
        )}
      </Group>
    )
  }

  // =============================================
  // DAMAGE EFFECTS RENDERING
  // =============================================

  const renderDamageEffects = () => {
    if (!enableEffects) return null

    return (
      <Group rotation={damageMetrics.listAngle}>
        {/* Smoke particles */}
        {effects.smoke.particles.map(particle => (
          <Circle
            key={particle.id}
            x={particle.x}
            y={particle.y}
            radius={3 * particle.scale}
            fill="#666666"
            opacity={particle.opacity}
            listening={false}
          />
        ))}

        {/* Fire flames */}
        {effects.fire.flames.map(flame => (
          <Group key={flame.id}>
            <Circle
              x={flame.x}
              y={flame.y}
              radius={2 + flame.intensity * 3}
              fill="#ff6600"
              opacity={flame.intensity}
              listening={false}
            />
            <Circle
              x={flame.x}
              y={flame.y}
              radius={1 + flame.intensity * 1.5}
              fill="#ffaa00"
              opacity={flame.intensity * 0.8}
              listening={false}
            />
          </Group>
        ))}

        {/* Water bubbles */}
        {effects.water.bubbles.map(bubble => (
          <Circle
            key={bubble.id}
            x={bubble.x}
            y={bubble.y}
            radius={bubble.size}
            fill="#87ceeb"
            opacity={0.6}
            listening={false}
          />
        ))}

        {/* Sparks */}
        {effects.sparks.map(spark => (
          <Circle
            key={spark.id}
            x={spark.x}
            y={spark.y}
            radius={1}
            fill="#ffff00"
            opacity={spark.life / 1500}
            listening={false}
          />
        ))}

        {/* Hull breach indicators */}
        {damageState.damageTypes.hull > 0.3 && (
          <Group>
            {Array.from({ length: Math.floor(damageState.damageTypes.hull * 5) }).map((_, i) => (
              <Line
                key={`breach-${i}`}
                points={[
                  -shipBounds.width * 0.3 + (i * shipBounds.width * 0.15),
                  shipBounds.height * 0.2,
                  -shipBounds.width * 0.3 + (i * shipBounds.width * 0.15) + 10,
                  shipBounds.height * 0.3
                ]}
                stroke="#333333"
                strokeWidth={2}
                listening={false}
              />
            ))}
          </Group>
        )}

        {/* Flooding water level */}
        {damageMetrics.floodingIntensity > 0 && (
          <Rect
            x={-shipBounds.width / 2}
            y={shipBounds.height * 0.3}
            width={shipBounds.width}
            height={shipBounds.height * 0.2 * damageMetrics.floodingIntensity}
            fill="#1e90ff"
            opacity={0.6}
            listening={false}
          />
        )}
      </Group>
    )
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <Group x={position.x} y={position.y}>
      {/* Health bar */}
      {renderHealthBar()}

      {/* Damage effects */}
      {renderDamageEffects()}

      {/* Sinking effect overlay */}
      {damageState.level === 'sinking' && (
        <Rect
          x={-shipBounds.width / 2}
          y={-shipBounds.height / 2}
          width={shipBounds.width}
          height={shipBounds.height}
          fill="#000033"
          opacity={0.3}
          listening={false}
        />
      )}

      {/* Destroyed overlay */}
      {damageState.level === 'sunk' && (
        <Group>
          <Rect
            x={-shipBounds.width / 2}
            y={-shipBounds.height / 2}
            width={shipBounds.width}
            height={shipBounds.height}
            fill="#000000"
            opacity={0.7}
            listening={false}
          />
          {/* Debris */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Circle
              key={`debris-${i}`}
              x={(Math.random() - 0.5) * shipBounds.width}
              y={(Math.random() - 0.5) * shipBounds.height}
              radius={2 + Math.random() * 3}
              fill="#444444"
              opacity={0.8}
              listening={false}
            />
          ))}
        </Group>
      )}
    </Group>
  )
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getHealthBarColor(healthPercent: number): string {
  if (healthPercent > 0.7) return '#00ff00'
  if (healthPercent > 0.4) return '#ffff00'
  if (healthPercent > 0.2) return '#ff8800'
  return '#ff0000'
}

DamageVisualizer.displayName = 'DamageVisualizer'

export default DamageVisualizer
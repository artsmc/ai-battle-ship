'use client'

/**
 * AbilityEffectsRenderer Component
 *
 * Visual representation of ship abilities from TASK-012.
 * Renders special effects for sonar ping, speed advantage, stealth, etc.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Group, Circle, Arc, Ring, Line } from 'react-konva'
import Konva from 'konva'
import { globalAnimationEngine, Easing } from '../../../lib/canvas/animations/AnimationEngine'

export interface AbilityEffect {
  id: string
  type: 'sonar_ping' | 'speed_advantage' | 'silent_running' | 'air_scout' | 'armor_piercing' | 'all_big_guns'
  isActive: boolean
  intensity: number // 0-1
  duration?: number
  position?: { x: number; y: number }
  radius?: number
  direction?: number
}

export interface AbilityEffectsRendererProps {
  abilities: AbilityEffect[]
  shipBounds: { width: number; height: number }
  enableEffects: boolean
  enableAnimation: boolean
  onEffectComplete?: (abilityId: string) => void
}

interface EffectRenderState {
  sonarRings: Array<{
    id: string
    radius: number
    opacity: number
    strokeWidth: number
  }>
  speedTrail: Array<{
    x: number
    y: number
    opacity: number
    age: number
  }>
  stealthShimmer: {
    opacity: number
    distortion: number
  }
  scoutRadius: {
    radius: number
    opacity: number
    rotation: number
  }
  armorPiercingGlow: {
    intensity: number
    color: string
  }
  gunFlashes: Array<{
    x: number
    y: number
    intensity: number
    age: number
  }>
}

/**
 * Advanced ability effects renderer with dynamic visual feedback
 */
export const AbilityEffectsRenderer: React.FC<AbilityEffectsRendererProps> = ({
  abilities,
  shipBounds,
  enableEffects,
  enableAnimation,
  onEffectComplete
}) => {
  const [renderState, setRenderState] = useState<EffectRenderState>({
    sonarRings: [],
    speedTrail: [],
    stealthShimmer: { opacity: 0, distortion: 0 },
    scoutRadius: { radius: 0, opacity: 0, rotation: 0 },
    armorPiercingGlow: { intensity: 0, color: '#ffffff' },
    gunFlashes: []
  })

  const animationIdsRef = useRef<Set<string>>(new Set())

  // =============================================
  // ABILITY EFFECT PROCESSING
  // =============================================

  const activeAbilities = useMemo(() => {
    return abilities.filter(ability => ability.isActive)
  }, [abilities])

  useEffect(() => {
    if (!enableEffects || !enableAnimation) return

    activeAbilities.forEach(ability => {
      startAbilityEffect(ability)
    })

    return () => {
      // Cleanup animations
      animationIdsRef.current.forEach(id => {
        globalAnimationEngine.stop(id)
      })
      animationIdsRef.current.clear()
    }
  }, [activeAbilities, enableEffects, enableAnimation])

  // =============================================
  // INDIVIDUAL ABILITY EFFECTS
  // =============================================

  const startAbilityEffect = (ability: AbilityEffect) => {
    if (animationIdsRef.current.has(ability.id)) return

    switch (ability.type) {
      case 'sonar_ping':
        startSonarPingEffect(ability)
        break
      case 'speed_advantage':
        startSpeedAdvantageEffect(ability)
        break
      case 'silent_running':
        startSilentRunningEffect(ability)
        break
      case 'air_scout':
        startAirScoutEffect(ability)
        break
      case 'armor_piercing':
        startArmorPiercingEffect(ability)
        break
      case 'all_big_guns':
        startAllBigGunsEffect(ability)
        break
    }
  }

  const startSonarPingEffect = (ability: AbilityEffect) => {
    const maxRadius = ability.radius || 200
    const animationId = globalAnimationEngine.animate({
      target: `sonar-${ability.id}`,
      duration: 3000,
      properties: {
        radius: { startValue: 0, endValue: maxRadius },
        opacity: { startValue: 1, endValue: 0 }
      },
      ease: Easing.easeOutQuad,
      onUpdate: (values) => {
        setRenderState(prev => ({
          ...prev,
          sonarRings: [
            ...prev.sonarRings.filter(ring => ring.id !== ability.id),
            {
              id: ability.id,
              radius: values.radius,
              opacity: values.opacity * ability.intensity,
              strokeWidth: 3 - (values.radius / maxRadius) * 2
            }
          ]
        }))
      },
      onComplete: () => {
        animationIdsRef.current.delete(animationId)
        setRenderState(prev => ({
          ...prev,
          sonarRings: prev.sonarRings.filter(ring => ring.id !== ability.id)
        }))
        if (onEffectComplete) {
          onEffectComplete(ability.id)
        }
      }
    })

    animationIdsRef.current.add(animationId)
  }

  const startSpeedAdvantageEffect = (ability: AbilityEffect) => {
    const animationId = globalAnimationEngine.animate({
      target: `speed-${ability.id}`,
      duration: ability.duration || 5000,
      properties: {
        trailIntensity: { startValue: 0, endValue: 1 }
      },
      ease: Easing.easeOutCubic,
      loop: true,
      onUpdate: (values) => {
        // Add new trail particles
        const newParticles = []
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            x: -shipBounds.width * 0.6 - (i * 10),
            y: (Math.random() - 0.5) * shipBounds.height * 0.3,
            opacity: values.trailIntensity * ability.intensity,
            age: 0
          })
        }

        setRenderState(prev => ({
          ...prev,
          speedTrail: [
            ...prev.speedTrail
              .map(particle => ({ ...particle, age: particle.age + 1, opacity: particle.opacity * 0.95 }))
              .filter(particle => particle.opacity > 0.1)
              .slice(-15), // Keep only recent particles
            ...newParticles
          ]
        }))
      },
      onComplete: () => {
        animationIdsRef.current.delete(animationId)
        if (onEffectComplete) {
          onEffectComplete(ability.id)
        }
      }
    })

    animationIdsRef.current.add(animationId)
  }

  const startSilentRunningEffect = (ability: AbilityEffect) => {
    const animationId = globalAnimationEngine.animate({
      target: `stealth-${ability.id}`,
      duration: ability.duration || 8000,
      properties: {
        shimmerOpacity: {
          startValue: 0,
          endValue: 0.6,
          keyframes: [
            { time: 0, value: 0 },
            { time: 0.5, value: 0.6 },
            { time: 1, value: 0 }
          ]
        },
        distortion: { startValue: 0, endValue: 1 }
      },
      ease: Easing.easeInOutQuad,
      loop: true,
      onUpdate: (values) => {
        setRenderState(prev => ({
          ...prev,
          stealthShimmer: {
            opacity: values.shimmerOpacity * ability.intensity,
            distortion: values.distortion
          }
        }))
      },
      onComplete: () => {
        animationIdsRef.current.delete(animationId)
        if (onEffectComplete) {
          onEffectComplete(ability.id)
        }
      }
    })

    animationIdsRef.current.add(animationId)
  }

  const startAirScoutEffect = (ability: AbilityEffect) => {
    const maxRadius = ability.radius || 300
    const animationId = globalAnimationEngine.animate({
      target: `scout-${ability.id}`,
      duration: ability.duration || 6000,
      properties: {
        radius: { startValue: 0, endValue: maxRadius },
        rotation: { startValue: 0, endValue: 360 },
        opacity: { startValue: 1, endValue: 0.3 }
      },
      ease: Easing.easeOutCubic,
      onUpdate: (values) => {
        setRenderState(prev => ({
          ...prev,
          scoutRadius: {
            radius: values.radius,
            opacity: values.opacity * ability.intensity,
            rotation: values.rotation
          }
        }))
      },
      onComplete: () => {
        animationIdsRef.current.delete(animationId)
        if (onEffectComplete) {
          onEffectComplete(ability.id)
        }
      }
    })

    animationIdsRef.current.add(animationId)
  }

  const startArmorPiercingEffect = (ability: AbilityEffect) => {
    const animationId = globalAnimationEngine.animate({
      target: `armor-${ability.id}`,
      duration: ability.duration || 4000,
      properties: {
        intensity: { startValue: 0, endValue: 1 },
        hue: { startValue: 0, endValue: 60 } // Red to yellow
      },
      ease: Easing.easeInOutCubic,
      loop: true,
      onUpdate: (values) => {
        const color = `hsl(${values.hue}, 100%, 60%)`
        setRenderState(prev => ({
          ...prev,
          armorPiercingGlow: {
            intensity: values.intensity * ability.intensity,
            color
          }
        }))
      },
      onComplete: () => {
        animationIdsRef.current.delete(animationId)
        if (onEffectComplete) {
          onEffectComplete(ability.id)
        }
      }
    })

    animationIdsRef.current.add(animationId)
  }

  const startAllBigGunsEffect = (ability: AbilityEffect) => {
    const gunPositions = [
      { x: -shipBounds.width * 0.3, y: -shipBounds.height * 0.2 },
      { x: 0, y: -shipBounds.height * 0.1 },
      { x: shipBounds.width * 0.3, y: -shipBounds.height * 0.2 }
    ]

    gunPositions.forEach((pos, index) => {
      const animationId = globalAnimationEngine.animate({
        target: `guns-${ability.id}-${index}`,
        duration: 800,
        properties: {
          intensity: { startValue: 0, endValue: 1 }
        },
        ease: Easing.easeOutElastic,
        delay: index * 200,
        onUpdate: (values) => {
          setRenderState(prev => ({
            ...prev,
            gunFlashes: [
              ...prev.gunFlashes.filter(flash =>
                !(flash.x === pos.x && flash.y === pos.y)
              ),
              {
                x: pos.x,
                y: pos.y,
                intensity: values.intensity * ability.intensity,
                age: 0
              }
            ]
          }))
        },
        onComplete: () => {
          animationIdsRef.current.delete(animationId)
          if (index === gunPositions.length - 1 && onEffectComplete) {
            onEffectComplete(ability.id)
          }
        }
      })

      animationIdsRef.current.add(animationId)
    })
  }

  // =============================================
  // RENDER EFFECTS
  // =============================================

  const renderSonarEffect = () => {
    return renderState.sonarRings.map(ring => (
      <Group key={`sonar-${ring.id}`}>
        <Circle
          radius={ring.radius}
          stroke="#00ffff"
          strokeWidth={ring.strokeWidth}
          opacity={ring.opacity}
          listening={false}
        />
        <Circle
          radius={ring.radius * 0.8}
          stroke="#ffffff"
          strokeWidth={ring.strokeWidth * 0.5}
          opacity={ring.opacity * 0.5}
          listening={false}
        />
      </Group>
    ))
  }

  const renderSpeedEffect = () => {
    return renderState.speedTrail.map((particle, index) => (
      <Circle
        key={`speed-${index}`}
        x={particle.x}
        y={particle.y}
        radius={2 + particle.age * 0.5}
        fill="#ffff00"
        opacity={particle.opacity}
        listening={false}
      />
    ))
  }

  const renderStealthEffect = () => {
    if (renderState.stealthShimmer.opacity <= 0) return null

    return (
      <Group>
        {/* Shimmer overlay */}
        <Circle
          radius={Math.max(shipBounds.width, shipBounds.height) * 0.7}
          stroke="#ffffff"
          strokeWidth={1}
          opacity={renderState.stealthShimmer.opacity}
          dash={[5, 5]}
          dashOffset={renderState.stealthShimmer.distortion * 10}
          listening={false}
        />
        {/* Distortion field */}
        <Ring
          innerRadius={shipBounds.width * 0.4}
          outerRadius={shipBounds.width * 0.6}
          fill="#ffffff"
          opacity={renderState.stealthShimmer.opacity * 0.1}
          listening={false}
        />
      </Group>
    )
  }

  const renderScoutEffect = () => {
    if (renderState.scoutRadius.opacity <= 0) return null

    return (
      <Group rotation={renderState.scoutRadius.rotation}>
        <Circle
          radius={renderState.scoutRadius.radius}
          stroke="#00ff00"
          strokeWidth={2}
          opacity={renderState.scoutRadius.opacity}
          dash={[10, 10]}
          listening={false}
        />
        {/* Scanning beam */}
        <Arc
          innerRadius={0}
          outerRadius={renderState.scoutRadius.radius}
          angle={30}
          rotation={-15}
          fill="#00ff00"
          opacity={renderState.scoutRadius.opacity * 0.2}
          listening={false}
        />
      </Group>
    )
  }

  const renderArmorPiercingEffect = () => {
    if (renderState.armorPiercingGlow.intensity <= 0) return null

    return (
      <Group>
        {/* Weapon glow */}
        <Circle
          radius={shipBounds.width * 0.3}
          fill={renderState.armorPiercingGlow.color}
          opacity={renderState.armorPiercingGlow.intensity * 0.3}
          listening={false}
          filters={[Konva.Filters.Blur]}
          blurRadius={5}
        />
        {/* Projectile aura */}
        <Line
          points={[
            -shipBounds.width * 0.5, 0,
            shipBounds.width * 0.5, 0
          ]}
          stroke={renderState.armorPiercingGlow.color}
          strokeWidth={3}
          opacity={renderState.armorPiercingGlow.intensity}
          listening={false}
        />
      </Group>
    )
  }

  const renderGunFlashes = () => {
    return renderState.gunFlashes.map((flash, index) => (
      <Group key={`gun-flash-${index}`}>
        <Circle
          x={flash.x}
          y={flash.y}
          radius={8 * flash.intensity}
          fill="#ffff00"
          opacity={flash.intensity}
          listening={false}
        />
        <Circle
          x={flash.x}
          y={flash.y}
          radius={4 * flash.intensity}
          fill="#ffffff"
          opacity={flash.intensity * 0.8}
          listening={false}
        />
      </Group>
    ))
  }

  // =============================================
  // MAIN RENDER
  // =============================================

  if (!enableEffects) return null

  return (
    <Group>
      {/* Sonar ping effects */}
      {renderSonarEffect()}

      {/* Speed advantage trails */}
      {renderSpeedEffect()}

      {/* Silent running stealth */}
      {renderStealthEffect()}

      {/* Air scout radar */}
      {renderScoutEffect()}

      {/* Armor piercing glow */}
      {renderArmorPiercingEffect()}

      {/* All big guns muzzle flashes */}
      {renderGunFlashes()}
    </Group>
  )
}

AbilityEffectsRenderer.displayName = 'AbilityEffectsRenderer'

export default AbilityEffectsRenderer
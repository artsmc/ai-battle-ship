'use client'

/**
 * ShipSprite Component
 *
 * Individual ship sprite rendering with historical ship designs.
 * Handles sprite atlases, frame animations, and performance optimization.
 */

import React, { useMemo, useCallback } from 'react'
import { Image as KonvaImage, Group } from 'react-konva'
import Konva from 'konva'
import { RenderableSprite } from '../../../lib/canvas/sprites/ShipSpriteManager'
import { ShipClass, ShipEra } from '../../../lib/database/types/enums'

export interface ShipSpriteProps {
  sprite: RenderableSprite
  x?: number
  y?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  alpha?: number
  tint?: string
  frame?: string
  enableFilters?: boolean
  enableShadow?: boolean
  shadowColor?: string
  shadowBlur?: number
  shadowOpacity?: number
  listening?: boolean
  onClick?: () => void
  onHover?: (isHovering: boolean) => void
}

interface HistoricalDesignConfig {
  era: ShipEra
  shipClass: ShipClass
  designFeatures: {
    smokestacks: number
    gunTurrets: number
    superstructure: 'minimal' | 'moderate' | 'complex'
    hull: 'narrow' | 'standard' | 'wide'
    camouflage?: string
  }
}

/**
 * Optimized ship sprite component with historical accuracy
 */
export const ShipSprite: React.FC<ShipSpriteProps> = ({
  sprite,
  x = 0,
  y = 0,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  alpha = 1,
  tint = '#ffffff',
  frame = 'idle',
  enableFilters = true,
  enableShadow = false,
  shadowColor = '#000000',
  shadowBlur = 5,
  shadowOpacity = 0.5,
  listening = false,
  onClick,
  onHover
}) => {
  // =============================================
  // HISTORICAL DESIGN CONFIGURATION
  // =============================================

  const designConfig = useMemo((): HistoricalDesignConfig => ({
    era: sprite.metadata.era,
    shipClass: sprite.metadata.shipClass,
    designFeatures: getHistoricalDesignFeatures(sprite.metadata.era, sprite.metadata.shipClass)
  }), [sprite.metadata.era, sprite.metadata.shipClass])

  // =============================================
  // SPRITE FRAME CALCULATION
  // =============================================

  const frameData = useMemo(() => {
    // Use atlas frame if available, otherwise use full sprite
    return sprite.frame
  }, [sprite.frame])

  const imageConfig = useMemo(() => ({
    x: x - frameData.anchorX,
    y: y - frameData.anchorY,
    width: frameData.width,
    height: frameData.height,
    rotation,
    scaleX,
    scaleY,
    opacity: alpha,
    listening,
    perfectDrawEnabled: false,
    imageSmoothingEnabled: false
  }), [frameData, x, y, rotation, scaleX, scaleY, alpha, listening])

  // =============================================
  // CROPPING AND ATLAS HANDLING
  // =============================================

  const cropConfig = useMemo(() => {
    // Only apply crop if using atlas (frame has position data)
    if ('x' in frameData && 'y' in frameData) {
      return {
        x: frameData.x,
        y: frameData.y,
        width: frameData.width,
        height: frameData.height
      }
    }
    return undefined
  }, [frameData])

  // =============================================
  // VISUAL EFFECTS
  // =============================================

  const tintValues = useMemo(() => {
    if (!enableFilters || tint === '#ffffff') {
      return { red: 1, green: 1, blue: 1 }
    }

    const hex = tint.replace('#', '')
    return {
      red: parseInt(hex.substr(0, 2), 16) / 255,
      green: parseInt(hex.substr(2, 2), 16) / 255,
      blue: parseInt(hex.substr(4, 2), 16) / 255
    }
  }, [enableFilters, tint])

  const filterConfig = useMemo(() => {
    const filters: any[] = []

    if (enableFilters && tint !== '#ffffff') {
      filters.push(Konva.Filters.RGB)
    }

    return filters
  }, [enableFilters, tint])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
  }, [onClick])

  const handleMouseEnter = useCallback(() => {
    if (onHover) {
      onHover(true)
    }
  }, [onHover])

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(false)
    }
  }, [onHover])

  // =============================================
  // HISTORICAL DESIGN FEATURES
  // =============================================

  const renderHistoricalDetails = useCallback(() => {
    if (!enableFilters) return null

    const details = []
    const features = designConfig.designFeatures

    // Add smokestacks for steam-powered ships
    if (features.smokestacks > 0 && designConfig.era !== ShipEra.MODERN) {
      for (let i = 0; i < features.smokestacks; i++) {
        const smokestackX = (frameData.width * 0.3) + (i * frameData.width * 0.2)
        const smokestackY = frameData.height * 0.2

        details.push(
          <Group key={`smokestack-${i}`}>
            {/* Smokestack */}
            <Konva.Rect
              x={smokestackX - frameData.anchorX}
              y={smokestackY - frameData.anchorY - 10}
              width={3}
              height={10}
              fill="#444444"
              listening={false}
            />
            {/* Smoke (if steam era) */}
            {(designConfig.era === ShipEra.PRE_DREADNOUGHT || designConfig.era === ShipEra.DREADNOUGHT) && (
              <Konva.Circle
                x={smokestackX - frameData.anchorX}
                y={smokestackY - frameData.anchorY - 15}
                radius={2}
                fill="#666666"
                opacity={0.6}
                listening={false}
              />
            )}
          </Group>
        )
      }
    }

    // Add gun turrets
    for (let i = 0; i < features.gunTurrets; i++) {
      const turretX = (frameData.width * 0.2) + (i * frameData.width * 0.6 / Math.max(1, features.gunTurrets - 1))
      const turretY = frameData.height * 0.5

      details.push(
        <Konva.Circle
          key={`turret-${i}`}
          x={turretX - frameData.anchorX}
          y={turretY - frameData.anchorY}
          radius={2}
          fill="#333333"
          stroke="#555555"
          strokeWidth={0.5}
          listening={false}
        />
      )
    }

    return details
  }, [designConfig, frameData, enableFilters])

  // =============================================
  // RENDER
  // =============================================

  return (
    <Group>
      {/* Main sprite image */}
      <KonvaImage
        {...imageConfig}
        image={sprite.image}
        crop={cropConfig}
        filters={filterConfig}
        red={tintValues.red}
        green={tintValues.green}
        blue={tintValues.blue}
        shadowEnabled={enableShadow}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Historical design details */}
      {renderHistoricalDetails()}
    </Group>
  )
}

// =============================================
// HISTORICAL DESIGN HELPERS
// =============================================

/**
 * Get historical design features based on era and ship class
 */
function getHistoricalDesignFeatures(era: ShipEra, shipClass: ShipClass): HistoricalDesignConfig['designFeatures'] {
  const baseFeatures = {
    smokestacks: 0,
    gunTurrets: 0,
    superstructure: 'minimal' as const,
    hull: 'standard' as const
  }

  // Era-specific modifications
  switch (era) {
    case ShipEra.PRE_DREADNOUGHT:
      baseFeatures.smokestacks = shipClass === ShipClass.BATTLESHIP ? 3 : 2
      baseFeatures.superstructure = 'minimal'
      break

    case ShipEra.DREADNOUGHT:
      baseFeatures.smokestacks = 2
      baseFeatures.superstructure = 'moderate'
      break

    case ShipEra.SUPER_DREADNOUGHT:
      baseFeatures.smokestacks = shipClass === ShipClass.SUBMARINE ? 0 : 2
      baseFeatures.superstructure = 'moderate'
      break

    case ShipEra.MODERN:
      baseFeatures.smokestacks = 0 // Nuclear/gas turbines
      baseFeatures.superstructure = 'complex'
      break

    default:
      break
  }

  // Ship class-specific modifications
  switch (shipClass) {
    case ShipClass.BATTLESHIP:
      baseFeatures.gunTurrets = era === ShipEra.PRE_DREADNOUGHT ? 6 : 4
      baseFeatures.hull = 'wide'
      break

    case ShipClass.BATTLECRUISER:
      baseFeatures.gunTurrets = 3
      baseFeatures.hull = 'standard'
      break

    case ShipClass.HEAVY_CRUISER:
      baseFeatures.gunTurrets = era === ShipEra.MODERN ? 2 : 3
      baseFeatures.hull = 'standard'
      break

    case ShipClass.LIGHT_CRUISER:
      baseFeatures.gunTurrets = 2
      baseFeatures.hull = 'narrow'
      break

    case ShipClass.DESTROYER:
      baseFeatures.gunTurrets = era === ShipEra.MODERN ? 1 : 2
      baseFeatures.hull = 'narrow'
      break

    case ShipClass.CARRIER:
      baseFeatures.gunTurrets = 0
      baseFeatures.hull = 'wide'
      baseFeatures.superstructure = 'complex'
      break

    case ShipClass.SUBMARINE:
      baseFeatures.gunTurrets = era === ShipEra.SUPER_DREADNOUGHT ? 1 : 0
      baseFeatures.hull = 'narrow'
      baseFeatures.superstructure = 'minimal'
      break

    case ShipClass.FRIGATE:
    case ShipClass.CORVETTE:
      baseFeatures.gunTurrets = 1
      baseFeatures.hull = 'narrow'
      break

    default:
      break
  }

  return baseFeatures
}

/**
 * Get era-appropriate camouflage pattern
 */
function getCamouflagePattern(era: ShipEra): string | undefined {
  switch (era) {
    case ShipEra.PRE_DREADNOUGHT:
      return undefined // No camouflage
    case ShipEra.DREADNOUGHT:
      return 'dazzle' // Dazzle camouflage
    case ShipEra.SUPER_DREADNOUGHT:
      return 'dazzle'
    case ShipEra.MODERN:
      return 'modern' // Modern camouflage patterns
    default:
      return undefined
  }
}

ShipSprite.displayName = 'ShipSprite'

export default ShipSprite
'use client'

/**
 * AbilityActivation Component
 *
 * Visual interface for activating ship abilities.
 * Provides ability range preview, effect visualization,
 * cooldown display, and integration with Phase 2 special abilities system.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { Group, Rect, Circle, Text } from 'react-konva'
import Konva from 'konva'
import { useGameCanvas } from '../GameCanvas'
import { colors } from '../../../styles/tokens/colors'
import {
  Coordinate,
  GameShip,
  ShipAbility,
  BoardState,
  GamePlayer,
} from '../../../lib/game/types'

// =============================================
// TYPES
// =============================================

export interface AbilityActivationProps {
  /** Current player's ships */
  playerShips?: GameShip[]
  /** Target board state (opponent's board) */
  targetBoardState?: BoardState
  /** Current player */
  currentPlayer?: GamePlayer
  /** Grid dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Selected ship for ability activation */
  selectedShip?: GameShip | null
  selectedAbility?: ShipAbility | null
  /** Ability targeting */
  abilityTargets?: Coordinate[]
  /** Visual options */
  showAbilityRange?: boolean
  showEffectPreview?: boolean
  showCooldownTimers?: boolean
  showAbilityButtons?: boolean
  enableAnimations?: boolean
  /** Event handlers */
  onShipSelect?: (ship: GameShip) => void
  onAbilitySelect?: (ship: GameShip, ability: ShipAbility) => void
  onAbilityActivate?: (ship: GameShip, ability: ShipAbility, targets: Coordinate[]) => Promise<boolean>
  onAbilityCancel?: () => void
  onTargetSelect?: (coordinate: Coordinate) => void
}

export interface AbilityState {
  ship: GameShip
  ability: ShipAbility
  isActive: boolean
  isTargeting: boolean
  targets: Coordinate[]
  range: Coordinate[]
  isValid: boolean
}

export interface AbilityEffectPreview {
  type: 'damage' | 'reveal' | 'heal' | 'buff' | 'debuff'
  coordinates: Coordinate[]
  intensity: number
  description: string
}

// =============================================
// CONSTANTS
// =============================================

const ABILITY_STYLES = {
  shipHighlight: {
    available: {
      fill: colors.game.selected,
      stroke: colors.maritime.navy.default,
      strokeWidth: 3,
      opacity: 0.8,
    },
    selected: {
      fill: colors.game.targeting,
      stroke: colors.maritime.navy.dark,
      strokeWidth: 4,
      opacity: 0.9,
    },
    disabled: {
      fill: colors.steel[400],
      stroke: colors.steel[500],
      strokeWidth: 2,
      opacity: 0.4,
    },
  },
  abilityRange: {
    fill: colors.game.targeting,
    stroke: colors.game.targeting,
    strokeWidth: 1,
    opacity: 0.2,
  },
  effectPreview: {
    damage: { fill: colors.semantic.error, opacity: 0.6 },
    reveal: { fill: colors.game.targeting, opacity: 0.4 },
    heal: { fill: colors.semantic.success, opacity: 0.5 },
    buff: { fill: colors.semantic.info, opacity: 0.5 },
    debuff: { fill: colors.semantic.warning, opacity: 0.5 },
  },
  abilityButton: {
    available: {
      fill: colors.maritime.navy.default,
      stroke: colors.maritime.navy.light,
      strokeWidth: 2,
      textColor: colors.steel[50],
    },
    cooling: {
      fill: colors.steel[600],
      stroke: colors.steel[500],
      strokeWidth: 1,
      textColor: colors.steel[200],
    },
    disabled: {
      fill: colors.steel[400],
      stroke: colors.steel[300],
      strokeWidth: 1,
      textColor: colors.steel[300],
    },
  },
  cooldownIndicator: {
    background: colors.steel[700],
    progress: colors.semantic.info,
    text: colors.steel[100],
  },
} as const

const ANIMATION_CONFIG = {
  abilityPulse: { duration: 1.5, easing: Konva.Easings.EaseInOut },
  rangeExpand: { duration: 0.4, easing: Konva.Easings.BackEaseOut },
  effectPreview: { duration: 0.6, easing: Konva.Easings.EaseOut },
  buttonHover: { duration: 0.2, easing: Konva.Easings.EaseOut },
} as const

const ABILITY_CONFIGS = {
  'All Big Guns': {
    type: 'buff',
    range: 0,
    pattern: [[0, 0]],
    description: 'Increases damage for next attack',
  },
  'Speed Advantage': {
    type: 'buff',
    range: 0,
    pattern: [[0, 0]],
    description: 'Allows repositioning after attack',
  },
  'Silent Running': {
    type: 'buff',
    range: 0,
    pattern: [[0, 0]],
    description: 'Ship becomes harder to hit',
  },
  'Air Scout': {
    type: 'reveal',
    range: 2,
    pattern: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
    description: 'Reveals enemy ships in area',
  },
  'Sonar Ping': {
    type: 'reveal',
    range: 3,
    pattern: [[0, 0]],
    description: 'Detects ships in radius',
  },
  'Barrage': {
    type: 'damage',
    range: 1,
    pattern: [[0, 0]],
    description: 'Multiple shots at selected targets',
  },
} as const

// =============================================
// MAIN COMPONENT
// =============================================

export const AbilityActivation: React.FC<AbilityActivationProps> = ({
  playerShips = [],
  boardWidth = 10,
  boardHeight = 10,
  selectedShip,
  abilityTargets = [],
  showAbilityRange = true,
  showEffectPreview = true,
  showCooldownTimers = true,
  showAbilityButtons = true,
  enableAnimations = true,
  onShipSelect,
  onAbilitySelect,
  onAbilityActivate,
  onAbilityCancel,
  onTargetSelect,
}) => {
  // =============================================
  // HOOKS AND STATE
  // =============================================

  const { coordinateTransform, metrics } = useGameCanvas()
  const [abilityState, setAbilityState] = useState<AbilityState | null>(null)
  const [effectPreview, setEffectPreview] = useState<AbilityEffectPreview | null>(null)

  // =============================================
  // GRID METRICS
  // =============================================

  const gridMetrics = coordinateTransform?.getGridMetrics()
  const { cellSize = 45, gridStartX = 0, gridStartY = 0 } = gridMetrics || {}

  // =============================================
  // ABILITY UTILITIES
  // =============================================

  const getAbilityStatus = useCallback((ability: ShipAbility): 'available' | 'cooling' | 'disabled' => {
    if (ability.remainingUses <= 0) return 'disabled'
    if (ability.currentCooldown > 0) return 'cooling'
    return 'available'
  }, [])

  const getAbilityRangeCells = useCallback((ship: GameShip, ability: ShipAbility): Coordinate[] => {
    if (!ship.coordinates[0]) return []

    const abilityConfig = ABILITY_CONFIGS[ability.name as keyof typeof ABILITY_CONFIGS]
    if (!abilityConfig) return []

    const center = ship.coordinates[0]
    const range = abilityConfig.range
    const cells: Coordinate[] = []

    if (range === 0) {
      // Self-targeting ability
      return ship.coordinates
    }

    // Generate cells within ability range
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const x = center.x + dx
        const y = center.y + dy

        if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) continue

        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= range) {
          cells.push({ x, y })
        }
      }
    }

    return cells
  }, [boardWidth, boardHeight])

  const getEffectPreview = useCallback((
    ship: GameShip,
    ability: ShipAbility,
    targets: Coordinate[]
  ): AbilityEffectPreview | null => {
    const abilityConfig = ABILITY_CONFIGS[ability.name as keyof typeof ABILITY_CONFIGS]
    if (!abilityConfig) return null

    return {
      type: abilityConfig.type as AbilityEffectPreview['type'],
      coordinates: targets,
      intensity: 1,
      description: abilityConfig.description,
    }
  }, [])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleShipClick = useCallback((ship: GameShip) => {
    if (ship.damage?.isSunk) return

    const availableAbilities = ship.abilities.filter(ability => getAbilityStatus(ability) === 'available')
    if (availableAbilities.length === 0) return

    onShipSelect?.(ship)

    // Auto-select first available ability if only one
    if (availableAbilities.length === 1) {
      const ability = availableAbilities[0]
      const range = getAbilityRangeCells(ship, ability)
      const preview = getEffectPreview(ship, ability, ship.coordinates)

      setAbilityState({
        ship,
        ability,
        isActive: true,
        isTargeting: range.length > ship.coordinates.length, // Needs targeting if affects more than just the ship
        targets: ship.coordinates,
        range,
        isValid: true,
      })

      if (preview) {
        setEffectPreview(preview)
      }

      onAbilitySelect?.(ship, ability)
    }
  }, [getAbilityStatus, onShipSelect, onAbilitySelect, getAbilityRangeCells, getEffectPreview])

  const handleAbilityClick = useCallback((ship: GameShip, ability: ShipAbility) => {
    const status = getAbilityStatus(ability)
    if (status !== 'available') return

    const range = getAbilityRangeCells(ship, ability)
    const preview = getEffectPreview(ship, ability, range)

    setAbilityState({
      ship,
      ability,
      isActive: true,
      isTargeting: range.length > ship.coordinates.length,
      targets: abilityTargets.length > 0 ? abilityTargets : ship.coordinates,
      range,
      isValid: true,
    })

    if (preview) {
      setEffectPreview(preview)
    }

    onAbilitySelect?.(ship, ability)
  }, [getAbilityStatus, getAbilityRangeCells, getEffectPreview, abilityTargets, onAbilitySelect])

  const handleAbilityActivate = useCallback(async () => {
    if (!abilityState || !abilityState.isValid) return

    try {
      const success = await onAbilityActivate?.(
        abilityState.ship,
        abilityState.ability,
        abilityState.targets
      )

      if (success) {
        // Clear state after successful activation
        setAbilityState(null)
        setEffectPreview(null)
      }
    } catch (error) {
      console.error('Failed to activate ability:', error)
    }
  }, [abilityState, onAbilityActivate])

  const handleTargetSelect = useCallback((coordinate: Coordinate) => {
    if (!abilityState || !abilityState.isTargeting) return

    // Update targets based on ability type
    const abilityConfig = ABILITY_CONFIGS[abilityState.ability.name as keyof typeof ABILITY_CONFIGS]
    if (!abilityConfig) return

    let newTargets: Coordinate[]

    if (abilityConfig.range === 0) {
      // Self-targeting ability - targets the ship itself
      newTargets = abilityState.ship.coordinates
    } else if (abilityConfig.pattern.length > 1) {
      // Area effect ability - apply pattern around selected coordinate
      newTargets = abilityConfig.pattern
        .map(([dx, dy]) => ({ x: coordinate.x + dx, y: coordinate.y + dy }))
        .filter(coord => coord.x >= 0 && coord.x < boardWidth && coord.y >= 0 && coord.y < boardHeight)
    } else {
      // Single target ability
      newTargets = [coordinate]
    }

    const updatedState = {
      ...abilityState,
      targets: newTargets,
      isValid: newTargets.length > 0,
    }

    setAbilityState(updatedState)

    const preview = getEffectPreview(abilityState.ship, abilityState.ability, newTargets)
    if (preview) {
      setEffectPreview(preview)
    }

    onTargetSelect?.(coordinate)
  }, [abilityState, boardWidth, boardHeight, getEffectPreview, onTargetSelect])

  // =============================================
  // RENDER COMPONENTS
  // =============================================

  const shipHighlights = useMemo(() => {
    return playerShips.map((ship) => {
      if (ship.damage?.isSunk) return null

      const hasAvailableAbilities = ship.abilities.some(ability => getAbilityStatus(ability) === 'available')
      if (!hasAvailableAbilities) return null

      let style = ABILITY_STYLES.shipHighlight.available
      if (selectedShip && selectedShip.id === ship.id) {
        style = ABILITY_STYLES.shipHighlight.selected
      }

      return ship.coordinates.map((coord) => {
        const cellX = gridStartX + (coord.x * cellSize)
        const cellY = gridStartY + (coord.y * cellSize)

        return (
          <Rect
            key={`ship-highlight-${ship.id}-${coord.x}-${coord.y}`}
            x={cellX}
            y={cellY}
            width={cellSize}
            height={cellSize}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            opacity={style.opacity}
            cornerRadius={6}
            onClick={() => handleShipClick(ship)}
            onTap={() => handleShipClick(ship)}
            ref={(node) => {
              if (node && enableAnimations && selectedShip?.id === ship.id) {
                node.to({
                  scaleX: 1.05,
                  scaleY: 1.05,
                  duration: ANIMATION_CONFIG.abilityPulse.duration,
                  yoyo: true,
                  repeat: -1,
                  easing: ANIMATION_CONFIG.abilityPulse.easing,
                })
              }
            }}
          />
        )
      })
    }).flat().filter(Boolean)
  }, [playerShips, selectedShip, getAbilityStatus, gridStartX, gridStartY, cellSize, enableAnimations, handleShipClick])

  const abilityRangeIndicator = useMemo(() => {
    if (!showAbilityRange || !abilityState) return null

    return abilityState.range.map((coord) => (
      <Circle
        key={`range-${coord.x}-${coord.y}`}
        x={gridStartX + (coord.x * cellSize) + (cellSize / 2)}
        y={gridStartY + (coord.y * cellSize) + (cellSize / 2)}
        radius={cellSize * 0.15}
        fill={ABILITY_STYLES.abilityRange.fill}
        stroke={ABILITY_STYLES.abilityRange.stroke}
        strokeWidth={ABILITY_STYLES.abilityRange.strokeWidth}
        opacity={ABILITY_STYLES.abilityRange.opacity}
        onClick={() => handleTargetSelect(coord)}
        onTap={() => handleTargetSelect(coord)}
        ref={(node) => {
          if (node && enableAnimations) {
            node.to({
              radius: cellSize * 0.25,
              opacity: ABILITY_STYLES.abilityRange.opacity * 0.5,
              duration: ANIMATION_CONFIG.rangeExpand.duration,
              yoyo: true,
              repeat: -1,
              easing: ANIMATION_CONFIG.rangeExpand.easing,
            })
          }
        }}
      />
    ))
  }, [showAbilityRange, abilityState, gridStartX, gridStartY, cellSize, enableAnimations, handleTargetSelect])

  const effectPreviewElements = useMemo(() => {
    if (!showEffectPreview || !effectPreview) return null

    const style = ABILITY_STYLES.effectPreview[effectPreview.type]

    return effectPreview.coordinates.map((coord, coordIndex) => (
      <Group key={`effect-${coord.x}-${coord.y}`}>
        <Rect
          x={gridStartX + (coord.x * cellSize)}
          y={gridStartY + (coord.y * cellSize)}
          width={cellSize}
          height={cellSize}
          fill={style.fill}
          opacity={style.opacity}
          cornerRadius={4}
          ref={(node) => {
            if (node && enableAnimations) {
              node.to({
                scaleX: 1.1,
                scaleY: 1.1,
                duration: ANIMATION_CONFIG.effectPreview.duration,
                yoyo: true,
                repeat: -1,
                easing: ANIMATION_CONFIG.effectPreview.easing,
                delay: coordIndex * 0.1,
              })
            }
          }}
        />

        {/* Effect type indicator */}
        <Circle
          x={gridStartX + (coord.x * cellSize) + (cellSize / 2)}
          y={gridStartY + (coord.y * cellSize) + (cellSize / 2)}
          radius={6}
          fill={style.fill}
          opacity={style.opacity + 0.3}
        />
      </Group>
    ))
  }, [showEffectPreview, effectPreview, gridStartX, gridStartY, cellSize, enableAnimations])

  const abilityButtons = useMemo(() => {
    if (!showAbilityButtons || !selectedShip) return null

    const buttonWidth = 160
    const buttonHeight = 40
    const buttonSpacing = 45
    const startX = gridStartX + (boardWidth * cellSize) + 20
    const startY = gridStartY + 20

    return selectedShip.abilities.map((ability, abilityIndex) => {
      const status = getAbilityStatus(ability)
      const style = ABILITY_STYLES.abilityButton[status]
      const buttonY = startY + (abilityIndex * buttonSpacing)

      return (
        <Group key={`ability-button-${ability.id}`}>
          {/* Button background */}
          <Rect
            x={startX}
            y={buttonY}
            width={buttonWidth}
            height={buttonHeight}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            cornerRadius={8}
            onClick={() => handleAbilityClick(selectedShip, ability)}
            onTap={() => handleAbilityClick(selectedShip, ability)}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />

          {/* Ability name */}
          <Text
            x={startX + 10}
            y={buttonY + 8}
            text={ability.name}
            fontSize={14}
            fontStyle="bold"
            fill={style.textColor}
            width={buttonWidth - 20}
          />

          {/* Uses/Cooldown info */}
          <Text
            x={startX + 10}
            y={buttonY + 24}
            text={status === 'cooling'
              ? `Cooldown: ${ability.currentCooldown}`
              : `Uses: ${ability.remainingUses}`}
            fontSize={10}
            fill={style.textColor}
            opacity={0.8}
            width={buttonWidth - 20}
          />

          {/* Cooldown progress bar */}
          {showCooldownTimers && ability.currentCooldown > 0 && (
            <Group>
              <Rect
                x={startX + 10}
                y={buttonY + buttonHeight - 6}
                width={buttonWidth - 20}
                height={3}
                fill={ABILITY_STYLES.cooldownIndicator.background}
                cornerRadius={2}
              />
              <Rect
                x={startX + 10}
                y={buttonY + buttonHeight - 6}
                width={(buttonWidth - 20) * (ability.currentCooldown / ability.cooldown)}
                height={3}
                fill={ABILITY_STYLES.cooldownIndicator.progress}
                cornerRadius={2}
              />
            </Group>
          )}
        </Group>
      )
    })
  }, [
    showAbilityButtons,
    showCooldownTimers,
    selectedShip,
    getAbilityStatus,
    gridStartX,
    gridStartY,
    boardWidth,
    cellSize,
    handleAbilityClick,
  ])

  const confirmationPanel = useMemo(() => {
    if (!abilityState || !abilityState.isValid) return null

    const panelX = gridStartX + (boardWidth * cellSize) + 20
    const panelY = gridStartY + 300

    return (
      <Group name="ability-confirmation">
        {/* Panel background */}
        <Rect
          x={panelX}
          y={panelY}
          width={200}
          height={140}
          fill={colors.steel[800]}
          stroke={colors.steel[600]}
          strokeWidth={2}
          cornerRadius={8}
          opacity={0.95}
        />

        {/* Title */}
        <Text
          x={panelX + 10}
          y={panelY + 10}
          text="Activate Ability"
          fontSize={14}
          fontStyle="bold"
          fill={colors.steel[50]}
          width={180}
        />

        {/* Ability info */}
        <Text
          x={panelX + 10}
          y={panelY + 35}
          text={abilityState.ability.name}
          fontSize={12}
          fontStyle="bold"
          fill={colors.maritime.navy.light}
          width={180}
        />

        <Text
          x={panelX + 10}
          y={panelY + 55}
          text={effectPreview?.description || 'Activate special ability'}
          fontSize={10}
          fill={colors.steel[200]}
          width={180}
          wrap="word"
        />

        <Text
          x={panelX + 10}
          y={panelY + 85}
          text={`Targets: ${abilityState.targets.length}`}
          fontSize={10}
          fill={colors.steel[100]}
          width={180}
        />

        {/* Activate button */}
        <Rect
          x={panelX + 10}
          y={panelY + 105}
          width={80}
          height={25}
          fill={colors.semantic.success}
          cornerRadius={4}
          onClick={handleAbilityActivate}
          onTap={handleAbilityActivate}
        />

        <Text
          x={panelX + 50}
          y={panelY + 112}
          text="ACTIVATE"
          fontSize={10}
          fontStyle="bold"
          fill={colors.steel[50]}
          align="center"
        />

        {/* Cancel button */}
        <Rect
          x={panelX + 105}
          y={panelY + 105}
          width={80}
          height={25}
          fill={colors.steel[600]}
          cornerRadius={4}
          onClick={onAbilityCancel}
          onTap={onAbilityCancel}
        />

        <Text
          x={panelX + 145}
          y={panelY + 112}
          text="Cancel"
          fontSize={10}
          fill={colors.steel[100]}
          align="center"
        />
      </Group>
    )
  }, [abilityState, effectPreview, gridStartX, gridStartY, boardWidth, cellSize, handleAbilityActivate, onAbilityCancel])

  // =============================================
  // EARLY RETURN FOR UNREADY CANVAS
  // =============================================

  if (!coordinateTransform || !metrics) {
    return null
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <Group
      name="ability-activation"
      listening={true}
    >
      {/* Ship highlights (lowest layer) */}
      <Group name="ship-highlights">
        {shipHighlights}
      </Group>

      {/* Ability range indicators */}
      <Group name="ability-range">
        {abilityRangeIndicator}
      </Group>

      {/* Effect preview */}
      <Group name="effect-preview">
        {effectPreviewElements}
      </Group>

      {/* Ability buttons panel */}
      <Group name="ability-buttons">
        {abilityButtons}
      </Group>

      {/* Confirmation panel */}
      {confirmationPanel}
    </Group>
  )
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook for managing ability activation state
 */
export const useAbilityActivation = () => {
  const [selectedShip, setSelectedShip] = useState<GameShip | null>(null)
  const [selectedAbility, setSelectedAbility] = useState<ShipAbility | null>(null)
  const [abilityTargets, setAbilityTargets] = useState<Coordinate[]>([])

  const selectShip = useCallback((ship: GameShip) => {
    setSelectedShip(ship)
    setSelectedAbility(null)
    setAbilityTargets([])
  }, [])

  const selectAbility = useCallback((ship: GameShip, ability: ShipAbility) => {
    setSelectedShip(ship)
    setSelectedAbility(ability)
    setAbilityTargets([])
  }, [])

  const addTarget = useCallback((coordinate: Coordinate) => {
    setAbilityTargets(prev => [...prev, coordinate])
  }, [])

  const clearTargets = useCallback(() => {
    setAbilityTargets([])
  }, [])

  const reset = useCallback(() => {
    setSelectedShip(null)
    setSelectedAbility(null)
    setAbilityTargets([])
  }, [])

  return {
    selectedShip,
    selectedAbility,
    abilityTargets,
    selectShip,
    selectAbility,
    addTarget,
    clearTargets,
    reset,
  }
}

export default AbilityActivation
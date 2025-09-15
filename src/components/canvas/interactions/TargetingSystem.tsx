'use client'

/**
 * TargetingSystem Component
 *
 * Visual targeting interface for combat operations.
 * Provides attack preview, confirmation UI, and integration
 * with Phase 2 combat validation system.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { Group, Rect, Circle, Line, Arc, Text } from 'react-konva'
import Konva from 'konva'
import { useGameCanvas } from '../GameCanvas'
import { colors } from '../../../styles/tokens/colors'
import {
  Coordinate,
  BoardState,
  AttackResult,
  AttackType,
} from '../../../lib/game/types'

// =============================================
// TYPES
// =============================================

export interface TargetingSystemProps {
  /** Board state for target validation */
  boardState?: BoardState
  /** Current player for attack validation */
  currentPlayer?: GamePlayer
  /** Target board state (opponent's board) */
  targetBoardState?: BoardState
  /** Grid dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Current targeting state */
  targetingMode?: TargetingMode
  selectedTarget?: Coordinate | null
  attackType?: AttackType
  /** Multi-target attacks (like barrage) */
  multiTargets?: Coordinate[]
  maxTargets?: number
  /** Visual options */
  showTargetingCrosshair?: boolean
  showAttackPreview?: boolean
  showValidTargets?: boolean
  showDamagePreview?: boolean
  enableAnimations?: boolean
  /** Event handlers */
  onTargetSelect?: (coordinate: Coordinate) => void
  onTargetConfirm?: (targets: Coordinate[], attackType: AttackType) => Promise<AttackResult[]>
  onTargetCancel?: () => void
  onAttackTypeChange?: (attackType: AttackType) => void
  /** Validation */
  isValidTarget?: (coordinate: Coordinate, attackType: AttackType) => boolean
}

export type TargetingMode = 'single' | 'multi' | 'area' | 'ability' | 'disabled'

export interface TargetInfo {
  coordinate: Coordinate
  isValid: boolean
  hasShip: boolean
  shipId?: string
  isHit: boolean
  damagePreview?: number
  hitProbability?: number
}

export interface AttackPreview {
  targets: Coordinate[]
  attackType: AttackType
  estimatedDamage: number
  hitProbability: number
  affectedShips: string[]
  isValid: boolean
}

// =============================================
// CONSTANTS
// =============================================

const TARGETING_STYLES = {
  crosshair: {
    stroke: colors.game.targeting,
    strokeWidth: 2,
    opacity: 0.8,
    radius: 15,
  },
  validTarget: {
    fill: colors.game.targeting,
    stroke: colors.game.targeting,
    strokeWidth: 2,
    opacity: 0.6,
  },
  invalidTarget: {
    fill: colors.semantic.error,
    stroke: colors.semantic.error,
    strokeWidth: 2,
    opacity: 0.4,
  },
  selectedTarget: {
    fill: colors.game.selected,
    stroke: colors.maritime.navy.dark,
    strokeWidth: 3,
    opacity: 0.8,
  },
  attackPreview: {
    fill: colors.semantic.warning,
    stroke: colors.semantic.warning,
    strokeWidth: 1,
    opacity: 0.3,
  },
  damageIndicator: {
    light: colors.semantic.warning,
    moderate: colors.game.hit,
    heavy: colors.semantic.error,
  },
  probabilityBar: {
    background: colors.steel[600],
    high: colors.semantic.success,
    medium: colors.semantic.warning,
    low: colors.semantic.error,
  },
} as const

const ANIMATION_CONFIG = {
  crosshairPulse: { duration: 1.2, easing: Konva.Easings.EaseInOut },
  targetSelect: { duration: 0.2, easing: Konva.Easings.BackEaseOut },
  attackPreview: { duration: 0.3, easing: Konva.Easings.EaseOut },
  confirmation: { duration: 0.5, easing: Konva.Easings.BounceEaseOut },
} as const

const ATTACK_PATTERNS = {
  single: { range: 0, pattern: [[0, 0]] },
  barrage: { range: 0, pattern: [[0, 0]] }, // Multiple single shots
  torpedo: { range: 1, pattern: [[-1, 0], [0, 0], [1, 0]] }, // Line pattern
  depth_charge: { range: 1, pattern: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] }, // 3x3 area
} as const

// =============================================
// MAIN COMPONENT
// =============================================

export const TargetingSystem: React.FC<TargetingSystemProps> = ({
  targetBoardState,
  boardWidth = 10,
  boardHeight = 10,
  targetingMode = 'single',
  selectedTarget,
  attackType = 'normal',
  multiTargets = [],
  maxTargets = 1,
  showTargetingCrosshair = true,
  showAttackPreview = true,
  showValidTargets = true,
  showDamagePreview = true,
  enableAnimations = true,
  onTargetSelect,
  onTargetConfirm,
  onTargetCancel,
  isValidTarget,
}) => {
  // =============================================
  // HOOKS AND STATE
  // =============================================

  const { coordinateTransform, metrics } = useGameCanvas()
  const [cursorPosition, setCursorPosition] = useState<Coordinate | null>(null)
  const [attackPreview, setAttackPreview] = useState<AttackPreview | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // =============================================
  // GRID METRICS
  // =============================================

  const gridMetrics = coordinateTransform?.getGridMetrics()
  const { cellSize = 45, gridStartX = 0, gridStartY = 0 } = gridMetrics || {}

  // =============================================
  // TARGET VALIDATION
  // =============================================

  const getTargetInfo = useCallback((coordinate: Coordinate): TargetInfo => {
    const cell = targetBoardState?.cells[coordinate.y]?.[coordinate.x]

    const targetInfo: TargetInfo = {
      coordinate,
      isValid: false,
      hasShip: Boolean(cell?.hasShip),
      shipId: cell?.shipId,
      isHit: Boolean(cell?.isHit),
    }

    // Check if target is valid
    if (isValidTarget) {
      targetInfo.isValid = isValidTarget(coordinate, attackType)
    } else {
      // Default validation: can't attack already hit cells
      targetInfo.isValid = !targetInfo.isHit
    }

    // Calculate hit probability based on ship presence
    if (targetInfo.hasShip && !targetInfo.isHit) {
      targetInfo.hitProbability = 85 // Base hit rate for ships
      targetInfo.damagePreview = 1 // Standard damage
    } else {
      targetInfo.hitProbability = 0
      targetInfo.damagePreview = 0
    }

    return targetInfo
  }, [targetBoardState, attackType, isValidTarget])

  const getAreaTargets = useCallback((center: Coordinate, pattern: number[][]): Coordinate[] => {
    const targets: Coordinate[] = []

    pattern.forEach(([dx, dy]) => {
      const x = center.x + dx
      const y = center.y + dy

      if (x >= 0 && x < boardWidth && y >= 0 && y < boardHeight) {
        targets.push({ x, y })
      }
    })

    return targets
  }, [boardWidth, boardHeight])

  // =============================================
  // ATTACK PREVIEW CALCULATION
  // =============================================

  const calculateAttackPreview = useCallback((targets: Coordinate[]): AttackPreview => {
    const targetInfos = targets.map(getTargetInfo)
    const validTargets = targetInfos.filter(info => info.isValid)

    const estimatedDamage = validTargets.reduce((sum, info) => sum + (info.damagePreview || 0), 0)
    const averageProbability = validTargets.length > 0
      ? validTargets.reduce((sum, info) => sum + (info.hitProbability || 0), 0) / validTargets.length
      : 0

    const affectedShips = [...new Set(validTargets.map(info => info.shipId).filter(Boolean))] as string[]

    return {
      targets,
      attackType,
      estimatedDamage,
      hitProbability: averageProbability,
      affectedShips,
      isValid: validTargets.length > 0,
    }
  }, [getTargetInfo, attackType])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleTargetHover = useCallback((coordinate: Coordinate | null) => {
    setCursorPosition(coordinate)

    if (!coordinate) {
      setAttackPreview(null)
      return
    }

    // Calculate preview for area attacks
    if (attackType in ATTACK_PATTERNS && attackType !== 'normal') {
      const pattern = ATTACK_PATTERNS[attackType as keyof typeof ATTACK_PATTERNS]
      const areaTargets = getAreaTargets(coordinate, pattern.pattern)
      const preview = calculateAttackPreview(areaTargets)
      setAttackPreview(preview)
    } else {
      // Single target preview
      const preview = calculateAttackPreview([coordinate])
      setAttackPreview(preview)
    }
  }, [attackType, getAreaTargets, calculateAttackPreview])

  const handleTargetClick = useCallback((coordinate: Coordinate) => {
    if (targetingMode === 'disabled') return

    const targetInfo = getTargetInfo(coordinate)
    if (!targetInfo.isValid) return

    if (targetingMode === 'single') {
      onTargetSelect?.(coordinate)
    } else if (targetingMode === 'multi') {
      // Toggle target in multi-select mode
      const currentTargets = [...multiTargets]
      const existingIndex = currentTargets.findIndex(t => t.x === coordinate.x && t.y === coordinate.y)

      if (existingIndex >= 0) {
        currentTargets.splice(existingIndex, 1)
      } else if (currentTargets.length < maxTargets) {
        currentTargets.push(coordinate)
      }

      onTargetSelect?.(coordinate)
    }
  }, [targetingMode, getTargetInfo, multiTargets, maxTargets, onTargetSelect])

  const handleAttackConfirm = useCallback(async () => {
    if (!attackPreview || !attackPreview.isValid || isConfirming) return

    setIsConfirming(true)

    try {
      if (onTargetConfirm) {
        await onTargetConfirm(attackPreview.targets, attackPreview.attackType)
      }
    } finally {
      setIsConfirming(false)
      setAttackPreview(null)
    }
  }, [attackPreview, isConfirming, onTargetConfirm])

  // =============================================
  // RENDER COMPONENTS
  // =============================================

  const targetingCrosshair = useMemo(() => {
    if (!showTargetingCrosshair || !cursorPosition) return null

    const x = gridStartX + (cursorPosition.x * cellSize) + (cellSize / 2)
    const y = gridStartY + (cursorPosition.y * cellSize) + (cellSize / 2)
    const radius = TARGETING_STYLES.crosshair.radius

    return (
      <Group name="crosshair">
        {/* Crosshair lines */}
        <Line
          points={[x - radius, y, x + radius, y]}
          stroke={TARGETING_STYLES.crosshair.stroke}
          strokeWidth={TARGETING_STYLES.crosshair.strokeWidth}
          opacity={TARGETING_STYLES.crosshair.opacity}
        />
        <Line
          points={[x, y - radius, x, y + radius]}
          stroke={TARGETING_STYLES.crosshair.stroke}
          strokeWidth={TARGETING_STYLES.crosshair.strokeWidth}
          opacity={TARGETING_STYLES.crosshair.opacity}
        />

        {/* Crosshair circle */}
        <Circle
          x={x}
          y={y}
          radius={radius}
          stroke={TARGETING_STYLES.crosshair.stroke}
          strokeWidth={TARGETING_STYLES.crosshair.strokeWidth}
          opacity={TARGETING_STYLES.crosshair.opacity}
          ref={(node) => {
            if (node && enableAnimations) {
              node.to({
                radius: radius * 1.2,
                opacity: TARGETING_STYLES.crosshair.opacity * 0.5,
                duration: ANIMATION_CONFIG.crosshairPulse.duration,
                yoyo: true,
                repeat: -1,
                easing: ANIMATION_CONFIG.crosshairPulse.easing,
              })
            }
          }}
        />
      </Group>
    )
  }, [showTargetingCrosshair, cursorPosition, gridStartX, gridStartY, cellSize, enableAnimations])

  const validTargetIndicators = useMemo(() => {
    if (!showValidTargets) return []

    const indicators: JSX.Element[] = []

    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const coordinate: Coordinate = { x, y }
        const targetInfo = getTargetInfo(coordinate)

        if (!targetInfo.isValid) continue

        const cellX = gridStartX + (x * cellSize)
        const cellY = gridStartY + (y * cellSize)
        const style = targetInfo.isValid ? TARGETING_STYLES.validTarget : TARGETING_STYLES.invalidTarget

        indicators.push(
          <Rect
            key={`target-${x}-${y}`}
            x={cellX}
            y={cellY}
            width={cellSize}
            height={cellSize}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            opacity={style.opacity}
            cornerRadius={4}
            perfectDrawEnabled={false}
          />
        )
      }
    }

    return indicators
  }, [showValidTargets, boardWidth, boardHeight, getTargetInfo, gridStartX, gridStartY, cellSize])

  const attackPreviewElements = useMemo(() => {
    if (!showAttackPreview || !attackPreview) return []

    return attackPreview.targets.map((target, index) => {
      const cellX = gridStartX + (target.x * cellSize)
      const cellY = gridStartY + (target.y * cellSize)
      const targetInfo = getTargetInfo(target)

      // Choose style based on damage prediction
      let damageStyle = TARGETING_STYLES.damageIndicator.light
      if (targetInfo.hasShip) {
        damageStyle = TARGETING_STYLES.damageIndicator.heavy
      }

      return (
        <Group key={`attack-preview-${target.x}-${target.y}`}>
          {/* Preview highlight */}
          <Rect
            x={cellX}
            y={cellY}
            width={cellSize}
            height={cellSize}
            fill={TARGETING_STYLES.attackPreview.fill}
            stroke={TARGETING_STYLES.attackPreview.stroke}
            strokeWidth={TARGETING_STYLES.attackPreview.strokeWidth}
            opacity={TARGETING_STYLES.attackPreview.opacity}
            cornerRadius={4}
            ref={(node) => {
              if (node && enableAnimations) {
                node.to({
                  scaleX: 1.1,
                  scaleY: 1.1,
                  duration: ANIMATION_CONFIG.attackPreview.duration,
                  yoyo: true,
                  repeat: -1,
                  easing: ANIMATION_CONFIG.attackPreview.easing,
                  delay: index * 0.1,
                })
              }
            }}
          />

          {/* Damage indicator */}
          {showDamagePreview && targetInfo.damagePreview! > 0 && (
            <Circle
              x={cellX + (cellSize / 2)}
              y={cellY + (cellSize / 2)}
              radius={6}
              fill={damageStyle}
              opacity={0.8}
            />
          )}

          {/* Hit probability indicator */}
          {targetInfo.hitProbability! > 0 && (
            <Arc
              x={cellX + cellSize - 8}
              y={cellY + 8}
              innerRadius={4}
              outerRadius={6}
              angle={(targetInfo.hitProbability! / 100) * 360}
              rotation={-90}
              fill={targetInfo.hitProbability! > 70
                ? TARGETING_STYLES.probabilityBar.high
                : targetInfo.hitProbability! > 40
                  ? TARGETING_STYLES.probabilityBar.medium
                  : TARGETING_STYLES.probabilityBar.low
              }
              opacity={0.9}
            />
          )}
        </Group>
      )
    })
  }, [
    showAttackPreview,
    showDamagePreview,
    attackPreview,
    getTargetInfo,
    gridStartX,
    gridStartY,
    cellSize,
    enableAnimations,
  ])

  const selectedTargetMarkers = useMemo(() => {
    const targets = targetingMode === 'multi' ? multiTargets : (selectedTarget ? [selectedTarget] : [])

    return targets.map((target) => {
      const cellX = gridStartX + (target.x * cellSize)
      const cellY = gridStartY + (target.y * cellSize)

      return (
        <Rect
          key={`selected-${target.x}-${target.y}`}
          x={cellX}
          y={cellY}
          width={cellSize}
          height={cellSize}
          fill={TARGETING_STYLES.selectedTarget.fill}
          stroke={TARGETING_STYLES.selectedTarget.stroke}
          strokeWidth={TARGETING_STYLES.selectedTarget.strokeWidth}
          opacity={TARGETING_STYLES.selectedTarget.opacity}
          cornerRadius={6}
          perfectDrawEnabled={false}
          ref={(node) => {
            if (node && enableAnimations) {
              node.to({
                strokeWidth: TARGETING_STYLES.selectedTarget.strokeWidth + 2,
                duration: ANIMATION_CONFIG.targetSelect.duration,
                yoyo: true,
                repeat: 3,
                easing: ANIMATION_CONFIG.targetSelect.easing,
              })
            }
          }}
        />
      )
    })
  }, [targetingMode, multiTargets, selectedTarget, gridStartX, gridStartY, cellSize, enableAnimations])

  const confirmationPrompt = useMemo(() => {
    if (!attackPreview || !attackPreview.isValid || targetingMode === 'disabled') return null

    const promptX = gridStartX + (boardWidth * cellSize) + 20
    const promptY = gridStartY + 50

    return (
      <Group name="confirmation-prompt">
        {/* Background panel */}
        <Rect
          x={promptX}
          y={promptY}
          width={200}
          height={120}
          fill={colors.steel[800]}
          stroke={colors.steel[600]}
          strokeWidth={2}
          cornerRadius={8}
          opacity={0.95}
        />

        {/* Title */}
        <Text
          x={promptX + 10}
          y={promptY + 10}
          text="Confirm Attack"
          fontSize={14}
          fontStyle="bold"
          fill={colors.steel[50]}
          width={180}
        />

        {/* Attack info */}
        <Text
          x={promptX + 10}
          y={promptY + 35}
          text={`Type: ${attackType}`}
          fontSize={12}
          fill={colors.steel[100]}
          width={180}
        />

        <Text
          x={promptX + 10}
          y={promptY + 50}
          text={`Targets: ${attackPreview.targets.length}`}
          fontSize={12}
          fill={colors.steel[100]}
          width={180}
        />

        <Text
          x={promptX + 10}
          y={promptY + 65}
          text={`Hit chance: ${Math.round(attackPreview.hitProbability)}%`}
          fontSize={12}
          fill={colors.steel[100]}
          width={180}
        />

        {/* Confirm button */}
        <Rect
          x={promptX + 10}
          y={promptY + 85}
          width={80}
          height={25}
          fill={colors.semantic.success}
          cornerRadius={4}
          onClick={handleAttackConfirm}
          onTap={handleAttackConfirm}
        />

        <Text
          x={promptX + 50}
          y={promptY + 92}
          text="FIRE!"
          fontSize={12}
          fontStyle="bold"
          fill={colors.steel[50]}
          align="center"
          onClick={handleAttackConfirm}
          onTap={handleAttackConfirm}
        />

        {/* Cancel button */}
        <Rect
          x={promptX + 105}
          y={promptY + 85}
          width={80}
          height={25}
          fill={colors.steel[600]}
          cornerRadius={4}
          onClick={onTargetCancel}
          onTap={onTargetCancel}
        />

        <Text
          x={promptX + 145}
          y={promptY + 92}
          text="Cancel"
          fontSize={12}
          fill={colors.steel[100]}
          align="center"
          onClick={onTargetCancel}
          onTap={onTargetCancel}
        />
      </Group>
    )
  }, [attackPreview, targetingMode, gridStartX, gridStartY, boardWidth, cellSize, attackType, handleAttackConfirm, onTargetCancel])

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
      name="targeting-system"
      listening={targetingMode !== 'disabled'}
      onMouseMove={(_e) => {
        if (coordinateTransform) {
          const pointerPosition = _e.target.getStage()?.getPointerPosition()
          if (pointerPosition) {
            const gridCoord = coordinateTransform.screenToGrid(pointerPosition.x, pointerPosition.y)
            handleTargetHover(gridCoord)
          }
        }
      }}
      onMouseLeave={() => handleTargetHover(null)}
      onClick={(_e) => {
        if (coordinateTransform && cursorPosition) {
          handleTargetClick(cursorPosition)
        }
      }}
    >
      {/* Valid target indicators (lowest layer) */}
      <Group name="valid-targets">
        {validTargetIndicators}
      </Group>

      {/* Attack preview */}
      <Group name="attack-preview">
        {attackPreviewElements}
      </Group>

      {/* Selected targets */}
      <Group name="selected-targets">
        {selectedTargetMarkers}
      </Group>

      {/* Targeting crosshair (top layer) */}
      {targetingCrosshair}

      {/* Confirmation UI (highest layer) */}
      {confirmationPrompt}
    </Group>
  )
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook for managing targeting state
 */
export const useTargetingState = () => {
  const [targetingMode, setTargetingMode] = useState<TargetingMode>('disabled')
  const [selectedTarget, setSelectedTarget] = useState<Coordinate | null>(null)
  const [multiTargets, setMultiTargets] = useState<Coordinate[]>([])
  const [attackType, setAttackType] = useState<AttackType>('normal')

  const selectTarget = useCallback((coordinate: Coordinate) => {
    if (targetingMode === 'single') {
      setSelectedTarget(coordinate)
    } else if (targetingMode === 'multi') {
      setMultiTargets(prev => {
        const exists = prev.some(t => t.x === coordinate.x && t.y === coordinate.y)
        if (exists) {
          return prev.filter(t => !(t.x === coordinate.x && t.y === coordinate.y))
        }
        return [...prev, coordinate]
      })
    }
  }, [targetingMode])

  const clearTargets = useCallback(() => {
    setSelectedTarget(null)
    setMultiTargets([])
  }, [])

  return {
    targetingMode,
    setTargetingMode,
    selectedTarget,
    multiTargets,
    attackType,
    setAttackType,
    selectTarget,
    clearTargets,
  }
}

export default TargetingSystem
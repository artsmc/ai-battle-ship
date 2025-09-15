'use client'

/**
 * HoverEffects Component
 *
 * Provides hover highlighting and information display for ships and grid cells.
 * Handles visual feedback for ship abilities, status indicators, and smooth
 * transition animations for enhanced user experience.
 */

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { Group, Rect, Circle, Text } from 'react-konva'
import Konva from 'konva'
import { useGameCanvas } from '../GameCanvas'
import { colors } from '../../../styles/tokens/colors'
import {
  Coordinate,
  GameShip,
  BoardState,
  CellState,
  ShipAbility,
} from '../../../lib/game/types'

// =============================================
// TYPES
// =============================================

export interface HoverEffectsProps {
  /** Board state for ship and cell information */
  boardState?: BoardState
  /** Grid dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Ships to show hover effects for */
  ships?: GameShip[]
  /** Current hovered coordinate */
  hoveredCell?: Coordinate | null
  /** Hovered ship (if any) */
  hoveredShip?: GameShip | null
  /** Configuration */
  showShipInfo?: boolean
  showAbilityRange?: boolean
  showHealthBar?: boolean
  showCellInfo?: boolean
  enableAnimations?: boolean
  hoverDelay?: number
  /** Event handlers */
  onCellHover?: (coordinate: Coordinate | null, cell?: CellState) => void
  onShipHover?: (ship: GameShip | null) => void
  onAbilityHover?: (ship: GameShip, ability: ShipAbility) => void
}

export interface HoverState {
  cell?: Coordinate
  ship?: GameShip
  ability?: ShipAbility
  isActive: boolean
  timestamp: number
}

export interface ShipHoverInfo {
  ship: GameShip
  position: Coordinate
  healthPercentage: number
  availableAbilities: ShipAbility[]
  isOperational: boolean
}

// =============================================
// CONSTANTS
// =============================================

const HOVER_STYLES = {
  cellHighlight: {
    fill: colors.game.hover,
    stroke: colors.steel[400],
    strokeWidth: 2,
    opacity: 0.6,
    cornerRadius: 4,
  },
  shipHighlight: {
    fill: colors.game.selected,
    stroke: colors.maritime.navy.default,
    strokeWidth: 3,
    opacity: 0.7,
    cornerRadius: 6,
  },
  abilityRange: {
    fill: colors.game.targeting,
    stroke: colors.game.targeting,
    strokeWidth: 1,
    opacity: 0.3,
  },
  infoPanel: {
    background: colors.steel[800],
    border: colors.steel[600],
    text: colors.steel[50],
    shadow: colors.steel[900],
  },
  healthBar: {
    background: colors.steel[600],
    healthy: colors.semantic.success,
    damaged: colors.semantic.warning,
    critical: colors.semantic.error,
  },
  abilityIndicator: {
    available: colors.game.targeting,
    cooling: colors.steel[400],
    disabled: colors.steel[300],
  },
} as const

const ANIMATION_CONFIG = {
  fadeIn: { duration: 0.2, easing: Konva.Easings.EaseOut },
  fadeOut: { duration: 0.15, easing: Konva.Easings.EaseIn },
  pulse: { duration: 0.8, easing: Konva.Easings.EaseInOut },
  highlight: { duration: 0.3, easing: Konva.Easings.BackEaseOut },
} as const

const INFO_PANEL_CONFIG = {
  padding: 8,
  borderRadius: 6,
  maxWidth: 200,
  fontSize: 12,
  lineHeight: 1.4,
} as const

// =============================================
// MAIN COMPONENT
// =============================================

export const HoverEffects: React.FC<HoverEffectsProps> = ({
  boardState,
  boardWidth = 10,
  boardHeight = 10,
  showAbilityRange = true,
  showHealthBar = true,
  showCellInfo = true,
  enableAnimations = true,
}) => {
  // =============================================
  // HOOKS AND STATE
  // =============================================

  const { coordinateTransform, metrics } = useGameCanvas()
  const [hoverState] = useState<HoverState>({
    isActive: false,
    timestamp: 0,
  })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // =============================================
  // GRID METRICS
  // =============================================

  const gridMetrics = coordinateTransform?.getGridMetrics()
  const { cellSize = 45, gridStartX = 0, gridStartY = 0 } = gridMetrics || {}

  // =============================================
  // HOVER HANDLERS
  // =============================================

  // Hover handlers are available for future use but currently not directly used
  // const handleCellEnter = useCallback((coordinate: Coordinate) => {
  //   if (hoverTimeoutRef.current) {
  //     clearTimeout(hoverTimeoutRef.current)
  //   }

  //   // Get cell information
  //   const cell = boardState?.cells[coordinate.y]?.[coordinate.x]
  //   const ship = cell?.shipId ? ships.find(s => s.id === cell.shipId) : undefined

  //   // Set immediate hover state
  //   setHoverState({
  //     cell: coordinate,
  //     ship,
  //     isActive: true,
  //     timestamp: Date.now(),
  //   })

  //   // Delayed info panel activation
  //   hoverTimeoutRef.current = setTimeout(() => {
  //     setHoverState(prev => ({
  //       ...prev,
  //       isActive: true,
  //     }))
  //   }, hoverDelay)

  //   // Notify parent
  //   onCellHover?.(coordinate, cell)
  //   if (ship) {
  //     onShipHover?.(ship)
  //   }
  // }, [boardState, ships, hoverDelay, onCellHover, onShipHover])

  // const handleCellLeave = useCallback(() => {
  //   if (hoverTimeoutRef.current) {
  //     clearTimeout(hoverTimeoutRef.current)
  //   }

  //   setHoverState({
  //     isActive: false,
  //     timestamp: Date.now(),
  //   })

  //   // Notify parent
  //   onCellHover?.(null)
  //   onShipHover?.(null)
  // }, [onCellHover, onShipHover])

  // =============================================
  // SHIP INFORMATION UTILITIES
  // =============================================

  const getShipHoverInfo = useCallback((ship: GameShip): ShipHoverInfo | null => {
    if (!boardState) return null

    // Find ship position
    const position = ship.coordinates[0] // First cell position
    if (!position) return null

    // Calculate health percentage
    const totalHits = ship.coordinates.filter(coord => {
      const cell = boardState.cells[coord.y]?.[coord.x]
      return cell?.isHit
    }).length

    const healthPercentage = Math.max(0, ((ship.size - totalHits) / ship.size) * 100)
    const isOperational = !ship.damage?.isSunk && healthPercentage > 0

    return {
      ship,
      position,
      healthPercentage,
      availableAbilities: ship.abilities.filter(ability =>
        ability.currentCooldown <= 0 && ability.remainingUses > 0
      ),
      isOperational,
    }
  }, [boardState])

  const getAbilityRangeCells = useCallback((ship: GameShip, ability: ShipAbility): Coordinate[] => {
    if (!ship.coordinates[0]) return []

    const center = ship.coordinates[0]
    const range = ability.range || 1
    const cells: Coordinate[] = []

    // Generate cells within ability range
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const x = center.x + dx
        const y = center.y + dy

        // Skip center cell and out-of-bounds cells
        if ((dx === 0 && dy === 0) || x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
          continue
        }

        // Check if within circular range
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= range) {
          cells.push({ x, y })
        }
      }
    }

    return cells
  }, [boardWidth, boardHeight])

  // =============================================
  // RENDER COMPONENTS
  // =============================================

  const cellHighlight = useMemo(() => {
    if (!hoverState.cell || !hoverState.isActive) return null

    const { x, y } = hoverState.cell
    const cellX = gridStartX + (x * cellSize)
    const cellY = gridStartY + (y * cellSize)

    return (
      <Rect
        x={cellX}
        y={cellY}
        width={cellSize}
        height={cellSize}
        fill={HOVER_STYLES.cellHighlight.fill}
        stroke={HOVER_STYLES.cellHighlight.stroke}
        strokeWidth={HOVER_STYLES.cellHighlight.strokeWidth}
        opacity={HOVER_STYLES.cellHighlight.opacity}
        cornerRadius={HOVER_STYLES.cellHighlight.cornerRadius}
        perfectDrawEnabled={false}
        ref={(node) => {
          if (node && enableAnimations) {
            node.opacity(0)
            node.to({
              opacity: HOVER_STYLES.cellHighlight.opacity,
              ...ANIMATION_CONFIG.fadeIn,
            })
          }
        }}
      />
    )
  }, [hoverState, gridStartX, gridStartY, cellSize, enableAnimations])

  const shipHighlight = useMemo(() => {
    if (!hoverState.ship || !hoverState.isActive) return null

    const ship = hoverState.ship
    const highlights = ship.coordinates.map((coord, index) => {
      const cellX = gridStartX + (coord.x * cellSize)
      const cellY = gridStartY + (coord.y * cellSize)

      return (
        <Rect
          key={`ship-highlight-${coord.x}-${coord.y}`}
          x={cellX}
          y={cellY}
          width={cellSize}
          height={cellSize}
          fill={HOVER_STYLES.shipHighlight.fill}
          stroke={HOVER_STYLES.shipHighlight.stroke}
          strokeWidth={HOVER_STYLES.shipHighlight.strokeWidth}
          opacity={HOVER_STYLES.shipHighlight.opacity}
          cornerRadius={HOVER_STYLES.shipHighlight.cornerRadius}
          perfectDrawEnabled={false}
          ref={(node) => {
            if (node && enableAnimations) {
              node.opacity(0)
              node.to({
                opacity: HOVER_STYLES.shipHighlight.opacity,
                scaleX: 1.05,
                scaleY: 1.05,
                ...ANIMATION_CONFIG.highlight,
                delay: index * 0.05, // Staggered animation
              })
            }
          }}
        />
      )
    })

    return <Group>{highlights}</Group>
  }, [hoverState, gridStartX, gridStartY, cellSize, enableAnimations])

  const abilityRangeIndicator = useMemo(() => {
    if (!showAbilityRange || !hoverState.ship || !hoverState.isActive) return null

    const ship = hoverState.ship
    const activeAbility = ship.abilities.find(ability =>
      ability.currentCooldown <= 0 && ability.remainingUses > 0
    )

    if (!activeAbility) return null

    const rangeCells = getAbilityRangeCells(ship, activeAbility)
    const rangeElements = rangeCells.map((cell) => (
      <Circle
        key={`ability-range-${cell.x}-${cell.y}`}
        x={gridStartX + (cell.x * cellSize) + (cellSize / 2)}
        y={gridStartY + (cell.y * cellSize) + (cellSize / 2)}
        radius={cellSize * 0.2}
        fill={HOVER_STYLES.abilityRange.fill}
        stroke={HOVER_STYLES.abilityRange.stroke}
        strokeWidth={HOVER_STYLES.abilityRange.strokeWidth}
        opacity={HOVER_STYLES.abilityRange.opacity}
        perfectDrawEnabled={false}
        ref={(node) => {
          if (node && enableAnimations) {
            node.opacity(0)
            node.to({
              opacity: HOVER_STYLES.abilityRange.opacity,
              scaleX: 1.5,
              scaleY: 1.5,
              duration: ANIMATION_CONFIG.pulse.duration,
              yoyo: true,
              repeat: -1,
              easing: ANIMATION_CONFIG.pulse.easing,
            })
          }
        }}
      />
    ))

    return <Group name="ability-range">{rangeElements}</Group>
  }, [showAbilityRange, hoverState, getAbilityRangeCells, gridStartX, gridStartY, cellSize, enableAnimations])

  const healthBar = useMemo(() => {
    if (!showHealthBar || !hoverState.ship || !hoverState.isActive) return null

    const shipInfo = getShipHoverInfo(hoverState.ship)
    if (!shipInfo) return null

    const barWidth = cellSize * shipInfo.ship.size
    const barHeight = 6
    const barX = gridStartX + (shipInfo.position.x * cellSize)
    const barY = gridStartY + (shipInfo.position.y * cellSize) - barHeight - 4

    // Determine health bar color
    let healthColor = HOVER_STYLES.healthBar.healthy
    if (shipInfo.healthPercentage < 70) healthColor = HOVER_STYLES.healthBar.damaged
    if (shipInfo.healthPercentage < 30) healthColor = HOVER_STYLES.healthBar.critical

    return (
      <Group name="health-bar">
        {/* Background */}
        <Rect
          x={barX}
          y={barY}
          width={barWidth}
          height={barHeight}
          fill={HOVER_STYLES.healthBar.background}
          cornerRadius={3}
        />

        {/* Health fill */}
        <Rect
          x={barX}
          y={barY}
          width={barWidth * (shipInfo.healthPercentage / 100)}
          height={barHeight}
          fill={healthColor}
          cornerRadius={3}
          ref={(node) => {
            if (node && enableAnimations) {
              node.scaleX(0)
              node.to({
                scaleX: 1,
                duration: 0.5,
                easing: Konva.Easings.EaseOut,
              })
            }
          }}
        />
      </Group>
    )
  }, [showHealthBar, hoverState, getShipHoverInfo, gridStartX, gridStartY, cellSize, enableAnimations])

  const infoPanel = useMemo(() => {
    if (!showCellInfo || !hoverState.isActive) return null
    if (!hoverState.cell && !hoverState.ship) return null

    const ship = hoverState.ship
    const cell = hoverState.cell

    if (!ship && !cell) return null

    // Position info panel near cursor but within bounds
    let panelX = gridStartX + ((cell?.x || 0) * cellSize) + cellSize + 10
    const panelY = gridStartY + ((cell?.y || 0) * cellSize)

    // Keep panel within canvas bounds
    const canvasWidth = metrics?.canvasSize.width || 800
    const panelWidth = INFO_PANEL_CONFIG.maxWidth

    if (panelX + panelWidth > canvasWidth - 20) {
      panelX = gridStartX + ((cell?.x || 0) * cellSize) - panelWidth - 10
    }

    // Generate info text
    let infoText = ''
    if (cell) {
      const columnLetter = String.fromCharCode(65 + cell.x)
      const rowNumber = cell.y + 1
      infoText += `Cell: ${columnLetter}${rowNumber}\n`
    }

    if (ship) {
      const shipInfo = getShipHoverInfo(ship)
      if (shipInfo) {
        infoText += `Ship: ${ship.template?.name || ship.type}\n`
        infoText += `Health: ${Math.round(shipInfo.healthPercentage)}%\n`
        infoText += `Status: ${shipInfo.isOperational ? 'Operational' : 'Destroyed'}\n`

        if (shipInfo.availableAbilities.length > 0) {
          infoText += `Abilities: ${shipInfo.availableAbilities.length}\n`
        }
      }
    }

    if (!infoText.trim()) return null

    const textLines = infoText.trim().split('\n')
    const lineHeight = INFO_PANEL_CONFIG.fontSize * INFO_PANEL_CONFIG.lineHeight
    const textHeight = textLines.length * lineHeight
    const panelHeight = textHeight + (INFO_PANEL_CONFIG.padding * 2)

    return (
      <Group name="info-panel">
        {/* Panel background with shadow */}
        <Rect
          x={panelX + 2}
          y={panelY + 2}
          width={panelWidth}
          height={panelHeight}
          fill={HOVER_STYLES.infoPanel.shadow}
          opacity={0.3}
          cornerRadius={INFO_PANEL_CONFIG.borderRadius}
        />

        <Rect
          x={panelX}
          y={panelY}
          width={panelWidth}
          height={panelHeight}
          fill={HOVER_STYLES.infoPanel.background}
          stroke={HOVER_STYLES.infoPanel.border}
          strokeWidth={1}
          cornerRadius={INFO_PANEL_CONFIG.borderRadius}
          opacity={0.95}
        />

        {/* Text content */}
        {textLines.map((line, index) => (
          <Text
            key={`info-line-${index}`}
            x={panelX + INFO_PANEL_CONFIG.padding}
            y={panelY + INFO_PANEL_CONFIG.padding + (index * lineHeight)}
            text={line}
            fontSize={INFO_PANEL_CONFIG.fontSize}
            fontFamily="Arial, sans-serif"
            fill={HOVER_STYLES.infoPanel.text}
            width={panelWidth - (INFO_PANEL_CONFIG.padding * 2)}
          />
        ))}
      </Group>
    )
  }, [
    showCellInfo,
    hoverState,
    gridStartX,
    gridStartY,
    cellSize,
    metrics,
    getShipHoverInfo,
  ])

  // =============================================
  // CLEANUP
  // =============================================

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

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
      name="hover-effects"
      listening={false} // This component only renders, doesn't handle events
    >
      {/* Cell highlight (lowest layer) */}
      {cellHighlight}

      {/* Ship highlight */}
      {shipHighlight}

      {/* Ability range indicator */}
      {abilityRangeIndicator}

      {/* Health bar */}
      {healthBar}

      {/* Info panel (highest layer) */}
      {infoPanel}
    </Group>
  )
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook for managing hover interactions
 */
export const useHoverInteractions = () => {
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null)
  const [hoveredShip, setHoveredShip] = useState<GameShip | null>(null)

  const handleCellHover = useCallback((coordinate: Coordinate | null) => {
    setHoveredCell(coordinate)
  }, [])

  const handleShipHover = useCallback((ship: GameShip | null) => {
    setHoveredShip(ship)
  }, [])

  return {
    hoveredCell,
    hoveredShip,
    handleCellHover,
    handleShipHover,
  }
}

/**
 * Hook for ship information display
 */
export const useShipInfo = (ships: GameShip[], boardState?: BoardState) => {
  return useCallback((shipId: string) => {
    const ship = ships.find(s => s.id === shipId)
    if (!ship || !boardState) return null

    // Calculate damage taken
    const hitCells = ship.coordinates.filter(coord => {
      const cell = boardState.cells[coord.y]?.[coord.x]
      return cell?.isHit
    })

    return {
      ship,
      damagePercentage: (hitCells.length / ship.size) * 100,
      remainingHealth: ship.size - hitCells.length,
      isOperational: !ship.damage?.isSunk,
      availableAbilities: ship.abilities.filter(ability =>
        ability.currentCooldown <= 0 && ability.remainingUses > 0
      ),
    }
  }, [ships, boardState])
}

export default HoverEffects
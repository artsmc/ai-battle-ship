'use client'

/**
 * CanvasGrid Component
 *
 * Renders the 10x10 game board grid using Konva.js shapes.
 * Handles grid lines, cell highlighting, coordinate markers,
 * and visual styling consistent with the naval theme.
 */

import React, { useMemo, useCallback } from 'react'
import { Group, Rect, Line, Text } from 'react-konva'
import { colors } from '../../styles/tokens/colors'
import { GRID_CONSTANTS } from '../../lib/canvas/CoordinateTransform'
import { useGameCanvas } from './GameCanvas'
import { Coordinate, BoardState } from '../../lib/game/types'
import { CELL_STATES } from '../../lib/game/utils/constants'

// =============================================
// TYPES
// =============================================

export interface CanvasGridProps {
  /** Board state to render */
  boardState?: BoardState
  /** Grid dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Visual options */
  showGrid?: boolean
  showCoordinates?: boolean
  showCellStates?: boolean
  /** Highlight specific cells */
  highlightedCells?: Coordinate[]
  hoveredCell?: Coordinate | null
  selectedCells?: Coordinate[]
  /** Styling overrides */
  gridColor?: string
  backgroundColor?: string
  highlightColor?: string
  hoverColor?: string
  selectedColor?: string
}

export interface CellStyle {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  cornerRadius?: number
}

// =============================================
// CONSTANTS
// =============================================

const DEFAULT_GRID_STYLES = {
  gridColor: colors.steel[400],
  backgroundColor: colors.maritime.wave.light,
  cellBorderColor: colors.steel[300],
  coordinateTextColor: colors.steel[600],
  highlightColor: colors.game.targeting,
  hoverColor: colors.game.hover,
  selectedColor: colors.game.selected,
  hitColor: colors.game.hit,
  missColor: colors.game.miss,
  shipColor: colors.game.ship,
  sunkColor: colors.game.sunk,
  waterColor: colors.game.water,
} as const

const CELL_STATE_STYLES: Record<string, Partial<CellStyle>> = {
  [CELL_STATES.EMPTY]: {
    fill: DEFAULT_GRID_STYLES.waterColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 1,
    opacity: 0.8,
  },
  [CELL_STATES.SHIP]: {
    fill: DEFAULT_GRID_STYLES.shipColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 2,
    opacity: 1,
  },
  [CELL_STATES.HIT]: {
    fill: DEFAULT_GRID_STYLES.hitColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 2,
    opacity: 1,
  },
  [CELL_STATES.MISS]: {
    fill: DEFAULT_GRID_STYLES.missColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 1,
    opacity: 0.9,
  },
  [CELL_STATES.SUNK]: {
    fill: DEFAULT_GRID_STYLES.sunkColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 3,
    opacity: 1,
  },
  [CELL_STATES.TARGETED]: {
    fill: DEFAULT_GRID_STYLES.highlightColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 2,
    opacity: 0.7,
  },
  [CELL_STATES.PREVIEW]: {
    fill: DEFAULT_GRID_STYLES.selectedColor,
    stroke: DEFAULT_GRID_STYLES.cellBorderColor,
    strokeWidth: 2,
    opacity: 0.5,
  },
}

// =============================================
// MAIN COMPONENT
// =============================================

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  boardState,
  boardWidth = 10,
  boardHeight = 10,
  showGrid = true,
  showCoordinates = true,
  showCellStates = true,
  highlightedCells = [],
  hoveredCell = null,
  selectedCells = [],
  gridColor = DEFAULT_GRID_STYLES.gridColor,
  backgroundColor = DEFAULT_GRID_STYLES.backgroundColor,
  highlightColor = DEFAULT_GRID_STYLES.highlightColor,
  hoverColor = DEFAULT_GRID_STYLES.hoverColor,
  selectedColor = DEFAULT_GRID_STYLES.selectedColor,
}) => {
  // =============================================
  // CONTEXT AND METRICS
  // =============================================

  const { coordinateTransform, metrics } = useGameCanvas()

  // =============================================
  // CELL STATE UTILITIES
  // =============================================

  const getCellState = useCallback((x: number, y: number): string => {
    if (!boardState) return CELL_STATES.EMPTY

    const cell = boardState.cells[y]?.[x]
    if (!cell) return CELL_STATES.EMPTY

    if (cell.isHit) {
      if (cell.hasShip) {
        // Check if ship is sunk
        const ship = boardState.ships.get(cell.shipId!)
        if (ship) {
          const allHit = ship.coordinates.every(coord => {
            const shipCell = boardState.cells[coord.y]?.[coord.x]
            return shipCell?.isHit
          })
          return allHit ? CELL_STATES.SUNK : CELL_STATES.HIT
        }
        return CELL_STATES.HIT
      } else {
        return CELL_STATES.MISS
      }
    }

    if (cell.hasShip && cell.isRevealed) {
      return CELL_STATES.SHIP
    }

    return CELL_STATES.EMPTY
  }, [boardState])

  const getCellStyle = useCallback((x: number, y: number): CellStyle => {
    let baseStyle = CELL_STATE_STYLES[CELL_STATES.EMPTY]

    if (showCellStates) {
      const cellState = getCellState(x, y)
      baseStyle = CELL_STATE_STYLES[cellState] || baseStyle
    }

    // Apply overlays for interactive states
    const style: CellStyle = { ...baseStyle } as CellStyle

    // Check if cell is highlighted
    if (highlightedCells.some(coord => coord.x === x && coord.y === y)) {
      style.fill = highlightColor
      style.opacity = Math.max(style.opacity, 0.8)
    }

    // Check if cell is selected
    if (selectedCells.some(coord => coord.x === x && coord.y === y)) {
      style.fill = selectedColor
      style.strokeWidth = Math.max(style.strokeWidth, 3)
      style.opacity = 1
    }

    // Check if cell is hovered (highest priority)
    if (hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
      style.fill = hoverColor
      style.strokeWidth = Math.max(style.strokeWidth, 2)
      style.opacity = 1
    }

    return style
  }, [
    showCellStates,
    getCellState,
    highlightedCells,
    selectedCells,
    hoveredCell,
    highlightColor,
    selectedColor,
    hoverColor,
  ])

  // =============================================
  // GRID RENDERING COMPONENTS (MEMOIZED)
  // =============================================

  const gridMetrics = coordinateTransform?.getGridMetrics()
  const { cellSize = 45, gridStartX = 0, gridStartY = 0 } = gridMetrics || {}

  const backgroundRect = useMemo(() => {
    if (!coordinateTransform || !metrics) return null

    return (
      <Rect
        x={gridStartX - 2}
        y={gridStartY - 2}
        width={boardWidth * cellSize + 4}
        height={boardHeight * cellSize + 4}
        fill={backgroundColor}
        stroke={gridColor}
        strokeWidth={2}
        cornerRadius={4}
      />
    )
  }, [coordinateTransform, metrics, gridStartX, gridStartY, boardWidth, boardHeight, cellSize, backgroundColor, gridColor])

  const gridCells = useMemo(() => {
    if (!coordinateTransform || !metrics) return []

    const cells: JSX.Element[] = []

    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const style = getCellStyle(x, y)
        const cellKey = `cell-${x}-${y}`

        cells.push(
          <Rect
            key={cellKey}
            x={gridStartX + (x * cellSize)}
            y={gridStartY + (y * cellSize)}
            width={cellSize}
            height={cellSize}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            opacity={style.opacity}
            cornerRadius={style.cornerRadius || 0}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
          />
        )
      }
    }

    return cells
  }, [
    coordinateTransform,
    metrics,
    boardWidth,
    boardHeight,
    cellSize,
    gridStartX,
    gridStartY,
    getCellStyle,
  ])

  const gridLines = useMemo(() => {
    if (!showGrid || !coordinateTransform || !metrics) return []

    const lines: JSX.Element[] = []

    // Vertical lines
    for (let x = 0; x <= boardWidth; x++) {
      const lineX = gridStartX + (x * cellSize)
      lines.push(
        <Line
          key={`v-line-${x}`}
          points={[lineX, gridStartY, lineX, gridStartY + (boardHeight * cellSize)]}
          stroke={gridColor}
          strokeWidth={x === 0 || x === boardWidth ? 2 : 1}
          opacity={0.6}
          perfectDrawEnabled={false}
        />
      )
    }

    // Horizontal lines
    for (let y = 0; y <= boardHeight; y++) {
      const lineY = gridStartY + (y * cellSize)
      lines.push(
        <Line
          key={`h-line-${y}`}
          points={[gridStartX, lineY, gridStartX + (boardWidth * cellSize), lineY]}
          stroke={gridColor}
          strokeWidth={y === 0 || y === boardHeight ? 2 : 1}
          opacity={0.6}
          perfectDrawEnabled={false}
        />
      )
    }

    return lines
  }, [showGrid, coordinateTransform, metrics, boardWidth, boardHeight, cellSize, gridStartX, gridStartY, gridColor])

  const coordinateLabels = useMemo(() => {
    if (!showCoordinates || !coordinateTransform || !metrics) return []

    const labels: JSX.Element[] = []
    const fontSize = Math.min(cellSize * 0.3, 14)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    // Column labels (letters)
    for (let x = 0; x < boardWidth; x++) {
      const labelX = gridStartX + (x * cellSize) + (cellSize / 2)
      const labelY = gridStartY - 15

      labels.push(
        <Text
          key={`col-label-${x}`}
          x={labelX}
          y={labelY}
          text={letters[x] || `${x}`}
          fontSize={fontSize}
          fontFamily={GRID_CONSTANTS.COORDINATE_FONT_FAMILY}
          fill={DEFAULT_GRID_STYLES.coordinateTextColor}
          align="center"
          verticalAlign="middle"
          width={cellSize}
          perfectDrawEnabled={false}
        />
      )
    }

    // Row labels (numbers)
    for (let y = 0; y < boardHeight; y++) {
      const labelX = gridStartX - 20
      const labelY = gridStartY + (y * cellSize) + (cellSize / 2) - (fontSize / 2)

      labels.push(
        <Text
          key={`row-label-${y}`}
          x={labelX}
          y={labelY}
          text={`${y + 1}`}
          fontSize={fontSize}
          fontFamily={GRID_CONSTANTS.COORDINATE_FONT_FAMILY}
          fill={DEFAULT_GRID_STYLES.coordinateTextColor}
          align="center"
          verticalAlign="middle"
          width={15}
          perfectDrawEnabled={false}
        />
      )
    }

    return labels
  }, [
    showCoordinates,
    coordinateTransform,
    metrics,
    boardWidth,
    boardHeight,
    cellSize,
    gridStartX,
    gridStartY,
  ])

  // =============================================
  // EARLY RETURN FOR UNREADY CANVAS
  // =============================================

  if (!coordinateTransform || !metrics) {
    return null // Canvas not ready
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <Group>
      {/* Background */}
      {backgroundRect}

      {/* Grid cells */}
      <Group>
        {gridCells}
      </Group>

      {/* Grid lines */}
      <Group>
        {gridLines}
      </Group>

      {/* Coordinate labels */}
      <Group>
        {coordinateLabels}
      </Group>
    </Group>
  )
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook to get cell styling functions
 */
export const useGridStyles = () => {
  const { performanceOptions } = useGameCanvas()

  return useMemo(() => ({
    getCellStateColor: (cellState: string): string => {
      return CELL_STATE_STYLES[cellState]?.fill || DEFAULT_GRID_STYLES.waterColor
    },

    getHighPerformanceStyle: (baseStyle: CellStyle): CellStyle => {
      if (performanceOptions.renderQuality === 'low') {
        return {
          ...baseStyle,
          cornerRadius: 0,
          strokeWidth: Math.min(baseStyle.strokeWidth, 1),
        }
      }
      return baseStyle
    },

    getAnimationConfig: () => ({
      enabled: performanceOptions.enableAnimations,
      duration: performanceOptions.renderQuality === 'high' ? 0.3 : 0.1,
    }),
  }), [performanceOptions])
}

/**
 * Hook to detect cell interactions
 */
export const useCellInteraction = (
  onCellEnter?: (coord: Coordinate) => void,
  onCellLeave?: (coord: Coordinate) => void
) => {
  const { coordinateTransform } = useGameCanvas()

  return useCallback((x: number, y: number, eventType: 'enter' | 'leave') => {
    if (!coordinateTransform) return

    const coord: Coordinate = { x, y }

    if (eventType === 'enter') {
      onCellEnter?.(coord)
    } else {
      onCellLeave?.(coord)
    }
  }, [coordinateTransform, onCellEnter, onCellLeave])
}

export default CanvasGrid
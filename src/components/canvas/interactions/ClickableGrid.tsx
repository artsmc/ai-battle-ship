'use client'

/**
 * ClickableGrid Component
 *
 * Interactive grid cells for attack targeting and ship placement.
 * Integrates with Phase 2 combat system and provides mobile-friendly touch targets.
 * Handles click events, validation, and visual feedback for game interactions.
 */

import React, { useCallback, useMemo, useRef } from 'react'
import { Group, Rect } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { useGameCanvas } from '../GameCanvas'
import { colors } from '../../../styles/tokens/colors'
import { Coordinate, BoardState, GamePhase } from '../../../lib/game/types'

// =============================================
// TYPES
// =============================================

export interface ClickableGridProps {
  /** Board state from game engine */
  boardState?: BoardState
  /** Current game phase */
  gamePhase?: GamePhase
  /** Grid dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Click handlers */
  onCellClick?: (coordinate: Coordinate, event: KonvaEventObject<MouseEvent>) => void
  onCellDoubleClick?: (coordinate: Coordinate) => void
  onCellRightClick?: (coordinate: Coordinate) => void
  /** Validation function for clicks */
  isClickValid?: (coordinate: Coordinate) => boolean
  /** Visual state overrides */
  disabledCells?: Coordinate[]
  highlightedCells?: Coordinate[]
  /** Interactive options */
  enableDoubleClick?: boolean
  enableRightClick?: boolean
  touchTargetSize?: number
  /** Accessibility */
  ariaLabel?: string
}

export interface CellClickState {
  isValid: boolean
  isDisabled: boolean
  isHighlighted: boolean
  cellType: 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
}

// =============================================
// CONSTANTS
// =============================================

const CLICK_STYLES = {
  validTarget: {
    fill: colors.game.targeting,
    opacity: 0.6,
    stroke: colors.steel[400],
    strokeWidth: 2,
  },
  invalidTarget: {
    fill: colors.semantic.error,
    opacity: 0.4,
    stroke: colors.semantic.error,
    strokeWidth: 1,
  },
  disabled: {
    fill: colors.steel[200],
    opacity: 0.3,
    stroke: colors.steel[300],
    strokeWidth: 1,
  },
  highlighted: {
    fill: colors.game.selected,
    opacity: 0.7,
    stroke: colors.game.selected,
    strokeWidth: 3,
  },
  hover: {
    fill: colors.game.hover,
    opacity: 0.8,
    stroke: colors.steel[500],
    strokeWidth: 2,
  },
} as const

const MIN_TOUCH_TARGET_SIZE = 44 // WCAG minimum touch target
const DEFAULT_DOUBLE_CLICK_DELAY = 300

// =============================================
// MAIN COMPONENT
// =============================================

export const ClickableGrid: React.FC<ClickableGridProps> = ({
  boardState,
  gamePhase = 'setup',
  boardWidth = 10,
  boardHeight = 10,
  onCellClick,
  onCellDoubleClick,
  onCellRightClick,
  isClickValid,
  disabledCells = [],
  highlightedCells = [],
  enableDoubleClick = true,
  enableRightClick = true,
  touchTargetSize = MIN_TOUCH_TARGET_SIZE,
}) => {
  // =============================================
  // HOOKS AND REFS
  // =============================================

  const { coordinateTransform, metrics } = useGameCanvas()
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastClickRef = useRef<{ coordinate: Coordinate; time: number } | null>(null)

  // =============================================
  // GRID METRICS
  // =============================================

  const gridMetrics = coordinateTransform?.getGridMetrics()
  const { cellSize = 45, gridStartX = 0, gridStartY = 0 } = gridMetrics || {}

  // Calculate effective touch target size
  const effectiveTouchSize = Math.max(cellSize, touchTargetSize)
  const touchTargetOffset = (effectiveTouchSize - cellSize) / 2

  // =============================================
  // CELL STATE UTILITIES
  // =============================================

  const getCellClickState = useCallback((x: number, y: number): CellClickState => {
    const coordinate: Coordinate = { x, y }

    // Check if cell is disabled
    const isDisabled = disabledCells.some(coord => coord.x === x && coord.y === y)

    // Check if cell is highlighted
    const isHighlighted = highlightedCells.some(coord => coord.x === x && coord.y === y)

    // Check if click is valid
    const isValid = !isDisabled && (isClickValid ? isClickValid(coordinate) : true)

    // Determine cell type from board state
    let cellType: CellClickState['cellType'] = 'empty'
    if (boardState) {
      const cell = boardState.cells[y]?.[x]
      if (cell) {
        if (cell.isHit) {
          if (cell.hasShip) {
            // Check if ship is sunk
            const ship = boardState.ships.get(cell.shipId!)
            if (ship) {
              const allHit = ship.coordinates.every(coord => {
                const shipCell = boardState.cells[coord.y]?.[coord.x]
                return shipCell?.isHit
              })
              cellType = allHit ? 'sunk' : 'hit'
            } else {
              cellType = 'hit'
            }
          } else {
            cellType = 'miss'
          }
        } else if (cell.hasShip && cell.isRevealed) {
          cellType = 'ship'
        }
      }
    }

    return {
      isValid,
      isDisabled,
      isHighlighted,
      cellType,
    }
  }, [boardState, disabledCells, highlightedCells, isClickValid])

  // =============================================
  // CLICK HANDLERS
  // =============================================

  const handleCellClick = useCallback((x: number, y: number, event: KonvaEventObject<MouseEvent>) => {
    if (!onCellClick) return

    const coordinate: Coordinate = { x, y }
    const clickState = getCellClickState(x, y)

    // Don't process clicks on disabled cells
    if (clickState.isDisabled) return

    const now = Date.now()
    const lastClick = lastClickRef.current

    // Handle double-click detection if enabled
    if (enableDoubleClick && onCellDoubleClick) {
      if (lastClick &&
          lastClick.coordinate.x === x &&
          lastClick.coordinate.y === y &&
          now - lastClick.time < DEFAULT_DOUBLE_CLICK_DELAY) {

        // This is a double-click
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current)
          clickTimeoutRef.current = null
        }

        onCellDoubleClick(coordinate)
        lastClickRef.current = null
        return
      }

      // Set up single-click delay
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }

      clickTimeoutRef.current = setTimeout(() => {
        onCellClick(coordinate, event)
        clickTimeoutRef.current = null
      }, DEFAULT_DOUBLE_CLICK_DELAY)

      lastClickRef.current = { coordinate, time: now }
    } else {
      // Process single click immediately
      onCellClick(coordinate, event)
    }
  }, [onCellClick, onCellDoubleClick, enableDoubleClick, getCellClickState])

  const handleCellRightClick = useCallback((x: number, y: number) => {
    if (!onCellRightClick || !enableRightClick) return

    const coordinate: Coordinate = { x, y }
    const clickState = getCellClickState(x, y)

    // Don't process clicks on disabled cells
    if (clickState.isDisabled) return

    onCellRightClick(coordinate)
  }, [onCellRightClick, enableRightClick, getCellClickState])

  // =============================================
  // VISUAL STYLING
  // =============================================

  const getCellInteractionStyle = useCallback((x: number, y: number, isHovered: boolean = false) => {
    const clickState = getCellClickState(x, y)

    if (clickState.isDisabled) {
      return CLICK_STYLES.disabled
    }

    if (clickState.isHighlighted) {
      return CLICK_STYLES.highlighted
    }

    if (isHovered) {
      return CLICK_STYLES.hover
    }

    if (gamePhase === 'combat' || gamePhase === 'targeting') {
      return clickState.isValid ? CLICK_STYLES.validTarget : CLICK_STYLES.invalidTarget
    }

    // Default transparent for setup phase
    return {
      fill: 'transparent',
      opacity: 0,
      stroke: 'transparent',
      strokeWidth: 0,
    }
  }, [getCellClickState, gamePhase])

  // =============================================
  // RENDER CELLS
  // =============================================

  const interactionCells = useMemo(() => {
    if (!coordinateTransform || !metrics) return []

    const cells: JSX.Element[] = []

    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const clickState = getCellClickState(x, y)
        const cellKey = `clickable-${x}-${y}`

        // Position and sizing
        const cellX = gridStartX + (x * cellSize) - touchTargetOffset
        const cellY = gridStartY + (y * cellSize) - touchTargetOffset

        cells.push(
          <Rect
            key={cellKey}
            x={cellX}
            y={cellY}
            width={effectiveTouchSize}
            height={effectiveTouchSize}
            fill="transparent"
            stroke="transparent"
            strokeWidth={0}
            // Event handlers
            onClick={(e) => handleCellClick(x, y, e)}
            onTap={(e) => handleCellClick(x, y, e)} // Touch devices
            onContextMenu={() => handleCellRightClick(x, y)}
            // Hover effects
            onMouseEnter={(e) => {
              if (!clickState.isDisabled) {
                const target = e.target as Konva.Rect
                const style = getCellInteractionStyle(x, y, true)
                target.fill(style.fill)
                target.opacity(style.opacity)
                target.stroke(style.stroke)
                target.strokeWidth(style.strokeWidth)
              }
            }}
            onMouseLeave={(e) => {
              const target = e.target as Konva.Rect
              const style = getCellInteractionStyle(x, y, false)
              target.fill(style.fill)
              target.opacity(style.opacity)
              target.stroke(style.stroke)
              target.strokeWidth(style.strokeWidth)
            }}
            // Performance optimizations
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
            listening={true}
            // Accessibility
            name={`cell-${x}-${y}`}
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
    effectiveTouchSize,
    touchTargetOffset,
    getCellClickState,
    getCellInteractionStyle,
    handleCellClick,
    handleCellRightClick,
  ])

  // =============================================
  // CLEANUP
  // =============================================

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
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
      name="clickable-grid"
      listening={true}
    >
      {/* Invisible interaction layer */}
      {interactionCells}
    </Group>
  )
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook for managing click validation based on game phase
 */
export const useClickValidation = (gamePhase: GamePhase, boardState?: BoardState) => {
  return useCallback((coordinate: Coordinate): boolean => {
    if (!boardState) return true

    switch (gamePhase) {
      case 'setup':
        // Allow clicks on empty cells for ship placement
        const setupCell = boardState.cells[coordinate.y]?.[coordinate.x]
        return !setupCell?.hasShip

      case 'combat':
      case 'targeting':
        // Only allow clicks on cells that haven't been attacked
        const combatCell = boardState.cells[coordinate.y]?.[coordinate.x]
        return !combatCell?.isHit

      case 'completed':
        // No clicks allowed in completed game
        return false

      default:
        return true
    }
  }, [gamePhase, boardState])
}

/**
 * Hook for getting cell accessibility information
 */
export const useCellAccessibility = () => {
  return useCallback((coordinate: Coordinate, clickState: CellClickState) => {
    const { x, y } = coordinate
    const columnLetter = String.fromCharCode(65 + x) // A, B, C, etc.
    const rowNumber = y + 1

    let description = `Cell ${columnLetter}${rowNumber}`

    if (clickState.isDisabled) {
      description += ' - disabled'
    } else if (clickState.cellType !== 'empty') {
      description += ` - ${clickState.cellType}`
    }

    if (clickState.isHighlighted) {
      description += ' - highlighted'
    }

    return {
      label: `${columnLetter}${rowNumber}`,
      description,
      role: 'button',
      tabIndex: clickState.isDisabled ? -1 : 0,
    }
  }, [])
}

export default ClickableGrid
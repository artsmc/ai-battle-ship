'use client'

/**
 * DragDropCanvas Component
 *
 * Visual integration with existing Phase 2 drag-drop logic.
 * Provides canvas-based ship placement with live preview,
 * smooth animations, and mobile touch gesture support.
 */

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Group, Rect, Circle } from 'react-konva'
import Konva from 'konva'
import { useGameCanvas } from '../GameCanvas'
import { DragDropHandler, DragEventHandlers, DragConfig } from '../../../lib/game/placement/DragDropHandler'
import { CollisionDetector } from '../../../lib/game/placement/CollisionDetector'
import { PlacementValidator } from '../../../lib/game/placement/PlacementValidator'
import { colors } from '../../../styles/tokens/colors'
import {
  Coordinate,
  Orientation,
  GameShip,
  BoardState,
  PlacementResult,
} from '../../../lib/game/types'

// =============================================
// TYPES
// =============================================

export interface DragDropCanvasProps {
  /** Board state for collision detection */
  boardState?: BoardState
  /** Available ships for placement */
  availableShips?: GameShip[]
  /** Already placed ships */
  placedShips?: GameShip[]
  /** Grid dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Drag and drop handlers */
  onShipPlaced?: (ship: GameShip, position: Coordinate, orientation: Orientation) => PlacementResult
  onShipRemoved?: (shipId: string) => void
  onPlacementPreview?: (ship: GameShip, position: Coordinate, orientation: Orientation, isValid: boolean) => void
  /** Configuration */
  dragConfig?: Partial<DragConfig>
  /** Visual options */
  showPreview?: boolean
  showSnapGuides?: boolean
  showCollisionHighlight?: boolean
  enableAnimations?: boolean
  /** Accessibility */
  ariaLabel?: string
}

export interface DragPreview {
  ship: GameShip
  position: Coordinate
  orientation: Orientation
  isValid: boolean
  isVisible: boolean
}

export interface CollisionHighlight {
  coordinates: Coordinate[]
  severity: 'warning' | 'critical'
  isVisible: boolean
}

// =============================================
// CONSTANTS
// =============================================

const DRAG_VISUAL_STYLES = {
  preview: {
    valid: {
      fill: colors.game.ship,
      opacity: 0.7,
      stroke: colors.game.selected,
      strokeWidth: 2,
    },
    invalid: {
      fill: colors.semantic.error,
      opacity: 0.5,
      stroke: colors.semantic.error,
      strokeWidth: 2,
    },
  },
  collision: {
    warning: {
      fill: colors.semantic.warning,
      opacity: 0.4,
      stroke: colors.semantic.warning,
      strokeWidth: 1,
    },
    critical: {
      fill: colors.semantic.error,
      opacity: 0.6,
      stroke: colors.semantic.error,
      strokeWidth: 2,
    },
  },
  snapGuide: {
    fill: colors.steel[300],
    stroke: colors.steel[400],
    strokeWidth: 1,
    opacity: 0.8,
  },
  dragShadow: {
    fill: colors.steel[600],
    opacity: 0.3,
    offsetX: 2,
    offsetY: 2,
    blur: 4,
  },
} as const

const ANIMATION_CONFIG = {
  snapDuration: 0.15,
  previewFade: 0.2,
  collisionPulse: 0.3,
  easing: Konva.Easings.EaseOut,
} as const

// =============================================
// MAIN COMPONENT
// =============================================

export const DragDropCanvas: React.FC<DragDropCanvasProps> = ({
  boardState,
  placedShips = [],
  boardWidth = 10,
  boardHeight = 10,
  onShipPlaced,
  onPlacementPreview,
  dragConfig = {},
  showPreview = true,
  showSnapGuides = true,
  showCollisionHighlight = true,
  enableAnimations = true,
}) => {
  // =============================================
  // HOOKS AND STATE
  // =============================================

  const { coordinateTransform, metrics } = useGameCanvas()
  const dragHandlerRef = useRef<DragDropHandler | null>(null)
  const groupRef = useRef<Konva.Group>(null)

  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [collisionHighlight, setCollisionHighlight] = useState<CollisionHighlight | null>(null)
  const [snapGuides, setSnapGuides] = useState<Coordinate[]>([])

  // =============================================
  // GRID METRICS
  // =============================================

  const gridMetrics = coordinateTransform?.getGridMetrics()
  const { cellSize = 45, gridStartX = 0, gridStartY = 0 } = gridMetrics || {}

  // =============================================
  // DRAG HANDLER SETUP
  // =============================================

  const setupDragHandler = useCallback(() => {
    if (!coordinateTransform || !boardState) return null

    // Create collision detector and validator
    const collisionDetector = new CollisionDetector(boardState, placedShips)
    const validator = new PlacementValidator(boardWidth, boardHeight, collisionDetector)

    // Create event handlers
    const dragEventHandlers: DragEventHandlers = {
      onDragStart: (ship: GameShip, position: Coordinate) => {
        // Show initial preview
        if (showPreview) {
          setDragPreview({
            ship,
            position,
            orientation: 'horizontal',
            isValid: true,
            isVisible: true,
          })
        }

        // Generate snap guides
        if (showSnapGuides) {
          const guides = generateSnapGuides(ship, position)
          setSnapGuides(guides)
        }
      },

      onDragMove: (position: Coordinate, gridPosition: Coordinate) => {
        if (dragPreview) {
          const isValid = validator.canPlaceShip(dragPreview.ship, gridPosition, dragPreview.orientation)

          setDragPreview(prev => prev ? {
            ...prev,
            position: gridPosition,
            isValid,
          } : null)

          // Update preview callback
          if (onPlacementPreview) {
            onPlacementPreview(dragPreview.ship, gridPosition, dragPreview.orientation, isValid)
          }
        }
      },

      onDragEnd: (ship: GameShip, finalPosition: Coordinate, orientation: Orientation): boolean => {
        let success = false

        if (onShipPlaced) {
          const result = onShipPlaced(ship, finalPosition, orientation)
          success = result.success
        }

        // Clear visual states
        setDragPreview(null)
        setCollisionHighlight(null)
        setSnapGuides([])

        return success
      },

      onRotate: (ship: GameShip, newOrientation: Orientation) => {
        if (dragPreview) {
          const isValid = validator.canPlaceShip(ship, dragPreview.position, newOrientation)

          setDragPreview(prev => prev ? {
            ...prev,
            orientation: newOrientation,
            isValid,
          } : null)
        }
      },

      onCollisionChange: (collision) => {
        if (showCollisionHighlight && collision.hasCollision) {
          setCollisionHighlight({
            coordinates: collision.conflictingCells,
            severity: collision.severity as 'warning' | 'critical',
            isVisible: true,
          })
        } else {
          setCollisionHighlight(null)
        }
      },

      onValidationChange: (isValid: boolean) => {
        if (dragPreview) {
          setDragPreview(prev => prev ? { ...prev, isValid } : null)
        }
      },
    }

    // Create and configure drag handler
    const handler = new DragDropHandler(
      collisionDetector,
      validator,
      dragEventHandlers,
      {
        snapToGrid: true,
        allowRotation: true,
        gridSize: cellSize,
        enablePreview: showPreview,
        enableHapticFeedback: true,
        ...dragConfig,
      }
    )

    // Set grid element if available
    if (groupRef.current) {
      handler.setGridElement(groupRef.current.getStage()?.container() || document.body)
    }

    return handler
  }, [
    coordinateTransform,
    boardState,
    placedShips,
    boardWidth,
    boardHeight,
    cellSize,
    onShipPlaced,
    onPlacementPreview,
    showPreview,
    showSnapGuides,
    showCollisionHighlight,
    dragConfig,
    generateSnapGuides,
  ])

  // Initialize drag handler
  useEffect(() => {
    if (coordinateTransform && boardState) {
      dragHandlerRef.current = setupDragHandler()

      return () => {
        if (dragHandlerRef.current) {
          dragHandlerRef.current.destroy()
          dragHandlerRef.current = null
        }
      }
    }
  }, [setupDragHandler, coordinateTransform, boardState])

  // =============================================
  // VISUAL HELPERS
  // =============================================

  const generateSnapGuides = useCallback((ship: GameShip, position: Coordinate): Coordinate[] => {
    // Generate grid lines for snapping guidance
    const guides: Coordinate[] = []

    // Add grid intersection points near the drag position
    const radius = Math.max(ship.size, 3)

    for (let y = Math.max(0, position.y - radius); y <= Math.min(boardHeight - 1, position.y + radius); y++) {
      for (let x = Math.max(0, position.x - radius); x <= Math.min(boardWidth - 1, position.x + radius); x++) {
        guides.push({ x, y })
      }
    }

    return guides
  }, [boardWidth, boardHeight])

  const getShipPreviewCells = useCallback((ship: GameShip, position: Coordinate, orientation: Orientation): Coordinate[] => {
    const cells: Coordinate[] = []

    for (let i = 0; i < ship.size; i++) {
      if (orientation === 'horizontal') {
        cells.push({ x: position.x + i, y: position.y })
      } else {
        cells.push({ x: position.x, y: position.y + i })
      }
    }

    return cells
  }, [])

  // =============================================
  // PUBLIC METHODS (commented out as unused)
  // =============================================

  // const startShipDrag = useCallback((ship: GameShip, startPosition: Coordinate, _element?: HTMLElement) => {
  //   if (!dragHandlerRef.current) return

  //   // Convert to mouse event for consistency
  //   const mockEvent = new MouseEvent('mousedown', {
  //     clientX: startPosition.x,
  //     clientY: startPosition.y,
  //     bubbles: true,
  //   })

  //   const targetElement = _element || groupRef.current?.getStage()?.container() || document.body
  //   dragHandlerRef.current.handleMouseDown(mockEvent, ship, targetElement)
  // }, [])

  // =============================================
  // RENDER COMPONENTS
  // =============================================

  const snapGuideElements = useMemo(() => {
    if (!showSnapGuides || !enableAnimations || snapGuides.length === 0) return []

    return snapGuides.map((guide) => (
      <Circle
        key={`snap-guide-${guide.x}-${guide.y}`}
        x={gridStartX + (guide.x * cellSize) + (cellSize / 2)}
        y={gridStartY + (guide.y * cellSize) + (cellSize / 2)}
        radius={2}
        fill={DRAG_VISUAL_STYLES.snapGuide.fill}
        stroke={DRAG_VISUAL_STYLES.snapGuide.stroke}
        strokeWidth={DRAG_VISUAL_STYLES.snapGuide.strokeWidth}
        opacity={DRAG_VISUAL_STYLES.snapGuide.opacity}
        perfectDrawEnabled={false}
        // Add gentle pulsing animation
        ref={(node) => {
          if (node && enableAnimations) {
            node.to({
              scaleX: 1.5,
              scaleY: 1.5,
              opacity: 0.4,
              duration: ANIMATION_CONFIG.collisionPulse,
              yoyo: true,
              repeat: -1,
              easing: ANIMATION_CONFIG.easing,
            })
          }
        }}
      />
    ))
  }, [showSnapGuides, enableAnimations, snapGuides, gridStartX, gridStartY, cellSize])

  const previewElements = useMemo(() => {
    if (!dragPreview || !dragPreview.isVisible || !showPreview) return []

    const previewCells = getShipPreviewCells(dragPreview.ship, dragPreview.position, dragPreview.orientation)
    const style = dragPreview.isValid
      ? DRAG_VISUAL_STYLES.preview.valid
      : DRAG_VISUAL_STYLES.preview.invalid

    return previewCells.map((cell, cellIndex) => {
      const cellX = gridStartX + (cell.x * cellSize)
      const cellY = gridStartY + (cell.y * cellSize)

      return (
        <Group key={`preview-cell-${cell.x}-${cell.y}`}>
          {/* Shadow */}
          <Rect
            x={cellX + DRAG_VISUAL_STYLES.dragShadow.offsetX}
            y={cellY + DRAG_VISUAL_STYLES.dragShadow.offsetY}
            width={cellSize}
            height={cellSize}
            fill={DRAG_VISUAL_STYLES.dragShadow.fill}
            opacity={DRAG_VISUAL_STYLES.dragShadow.opacity}
            cornerRadius={4}
            perfectDrawEnabled={false}
            filters={enableAnimations ? [Konva.Filters.Blur] : undefined}
            blurRadius={enableAnimations ? DRAG_VISUAL_STYLES.dragShadow.blur : 0}
          />

          {/* Preview cell */}
          <Rect
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
            ref={(node) => {
              // Add fade-in animation
              if (node && enableAnimations) {
                node.opacity(0)
                node.to({
                  opacity: style.opacity,
                  duration: ANIMATION_CONFIG.previewFade,
                  easing: ANIMATION_CONFIG.easing,
                })
              }
            }}
          />

          {/* Ship direction indicator for first cell */}
          {cellIndex === 0 && (
            <Circle
              x={cellX + (cellSize / 2)}
              y={cellY + (cellSize / 2)}
              radius={4}
              fill={colors.maritime.navy.dark}
              opacity={0.8}
            />
          )}
        </Group>
      )
    })
  }, [
    dragPreview,
    showPreview,
    getShipPreviewCells,
    gridStartX,
    gridStartY,
    cellSize,
    enableAnimations,
  ])

  const collisionElements = useMemo(() => {
    if (!collisionHighlight || !collisionHighlight.isVisible || !showCollisionHighlight) return []

    const style = DRAG_VISUAL_STYLES.collision[collisionHighlight.severity]

    return collisionHighlight.coordinates.map((coord) => (
      <Rect
        key={`collision-${coord.x}-${coord.y}`}
        x={gridStartX + (coord.x * cellSize)}
        y={gridStartY + (coord.y * cellSize)}
        width={cellSize}
        height={cellSize}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        opacity={style.opacity}
        cornerRadius={2}
        perfectDrawEnabled={false}
        ref={(node) => {
          // Add pulsing animation for critical collisions
          if (node && enableAnimations && collisionHighlight.severity === 'critical') {
            node.to({
              opacity: style.opacity * 0.3,
              duration: ANIMATION_CONFIG.collisionPulse,
              yoyo: true,
              repeat: -1,
              easing: ANIMATION_CONFIG.easing,
            })
          }
        }}
      />
    ))
  }, [
    collisionHighlight,
    showCollisionHighlight,
    gridStartX,
    gridStartY,
    cellSize,
    enableAnimations,
  ])

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
      ref={groupRef}
      name="drag-drop-canvas"
      listening={true}
    >
      {/* Snap guides (lowest layer) */}
      <Group name="snap-guides">
        {snapGuideElements}
      </Group>

      {/* Collision highlights */}
      <Group name="collision-highlights">
        {collisionElements}
      </Group>

      {/* Ship previews (top layer) */}
      <Group name="ship-previews">
        {previewElements}
      </Group>
    </Group>
  )
}

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook to manage drag and drop operations
 */
export const useDragDropOperations = () => {
  const startDrag = useCallback((_ship: GameShip, _position: Coordinate, _element?: HTMLElement) => {
    // Implementation depends on having access to DragDropCanvas instance
    // TODO: Implement drag operation
  }, [])

  const cancelDrag = useCallback(() => {
    // Cancel current drag operation
    // TODO: Implement cancel operation
  }, [])

  return {
    startDrag,
    cancelDrag,
  }
}

/**
 * Hook for ship placement validation
 */
export const useShipPlacementValidation = (
  boardWidth: number,
  boardHeight: number,
  boardState?: BoardState,
  _placedShips: GameShip[] = []
) => {
  return useCallback((ship: GameShip, position: Coordinate, orientation: Orientation): boolean => {
    if (!boardState) return false

    // Check bounds
    const endX = orientation === 'horizontal' ? position.x + ship.size - 1 : position.x
    const endY = orientation === 'vertical' ? position.y + ship.size - 1 : position.y

    if (endX >= boardWidth || endY >= boardHeight) {
      return false
    }

    // Check for collisions with existing ships
    const shipCells = []
    for (let i = 0; i < ship.size; i++) {
      const cellX = orientation === 'horizontal' ? position.x + i : position.x
      const cellY = orientation === 'vertical' ? position.y + i : position.y
      shipCells.push({ x: cellX, y: cellY })
    }

    return shipCells.every(cell => {
      const boardCell = boardState.cells[cell.y]?.[cell.x]
      return !boardCell?.hasShip
    })
  }, [boardWidth, boardHeight, boardState])
}

export default DragDropCanvas
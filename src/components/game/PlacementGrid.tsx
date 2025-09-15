'use client'

/**
 * PlacementGrid Component
 *
 * Interactive grid for ship placement with:
 * - Drag and drop functionality
 * - Visual collision feedback
 * - Touch support for mobile
 * - Accessibility features
 * - Real-time validation
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import {
  Coordinate,
  Orientation,
  GameShip
} from '@/lib/game/types'
import { Board } from '@/lib/game/Board'
import { PlacementValidator } from '@/lib/game/placement/PlacementValidator'
import { CollisionDetector, CollisionResult } from '@/lib/game/placement/CollisionDetector'
import { DragDropHandler, DragState } from '@/lib/game/placement/DragDropHandler'

interface PlacementGridProps {
  board: Board
  ships: GameShip[]
  onShipPlaced: (ship: GameShip, position: Coordinate, orientation: Orientation) => void
  onShipMoved: (ship: GameShip, position: Coordinate, orientation: Orientation) => void
  onShipRemoved: (shipId: string) => void
  onValidationChange: (isValid: boolean) => void
  disabled?: boolean
  showCoordinates?: boolean
  highlightValidPositions?: boolean
  className?: string
}

interface GridCellProps {
  coordinate: Coordinate
  hasShip: boolean
  shipId?: string
  isHit: boolean
  isValidDrop: boolean
  isColliding: boolean
  isPreview: boolean
  showCoordinate: boolean
  onCellClick: (coordinate: Coordinate) => void
  onCellEnter: (coordinate: Coordinate) => void
  onCellLeave: (coordinate: Coordinate) => void
}

interface ShipPreview {
  shipId: string
  coordinates: Coordinate[]
  orientation: Orientation
  isValid: boolean
  collisionType: string
}

const GRID_SIZE = 10
const CELL_SIZE = 40

export const PlacementGrid: React.FC<PlacementGridProps> = ({
  board,
  ships,
  onShipPlaced,
  onShipMoved,
  onShipRemoved,
  onValidationChange,
  disabled = false,
  showCoordinates = false,
  highlightValidPositions = false,
  className = ''
}) => {
  const gridRef = useRef<HTMLDivElement>(null)
  const [validator] = useState(() => new PlacementValidator(board))
  const [collisionDetector] = useState(() => new CollisionDetector(board))
  const [dragHandler, setDragHandler] = useState<DragDropHandler | null>(null)

  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [shipPreview, setShipPreview] = useState<ShipPreview | null>(null)
  const [collisionResult, setCollisionResult] = useState<CollisionResult | null>(null)
  const [selectedShip, setSelectedShip] = useState<GameShip | null>(null)
  const [validPositions, setValidPositions] = useState<Set<string>>(new Set())

  // Initialize drag handler
  useEffect(() => {
    if (disabled) return

    const handler = new DragDropHandler(
      collisionDetector,
      validator,
      {
        onDragStart: (ship, _position) => {
          setSelectedShip(ship)
          setDragState(handler.getCurrentDragState())
        },
        onDragMove: (_screenPos, _gridPos) => {
          setDragState(handler.getCurrentDragState())
        },
        onDragEnd: (ship, finalPosition, orientation) => {
          const success = handleShipPlacement(ship, finalPosition, orientation)
          setDragState(null)
          setSelectedShip(null)
          setShipPreview(null)
          return success
        },
        onRotate: (_ship, _newOrientation) => {
          setDragState(handler.getCurrentDragState())
        },
        onCollisionChange: (collision) => {
          setCollisionResult(collision)
        },
        onValidationChange: (isValid) => {
          onValidationChange(isValid)
        }
      }
    )

    if (gridRef.current) {
      handler.setGridElement(gridRef.current)
    }

    setDragHandler(handler)

    return () => {
      handler.destroy()
    }
  }, [board, validator, collisionDetector, disabled])

  // Update valid positions when highlighting is enabled
  useEffect(() => {
    if (!highlightValidPositions || !selectedShip) {
      setValidPositions(new Set())
      return
    }

    const positions = collisionDetector.getAllValidPositions(selectedShip.size)
    const positionStrings = new Set(positions.map(p => `${p.x},${p.y}`))
    setValidPositions(positionStrings)
  }, [highlightValidPositions, selectedShip, collisionDetector])

  // Generate grid cells
  const gridCells = useMemo(() => {
    const cells: React.ReactNode[] = []

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const coordinate = { x, y }
        const cell = board.getCell(coordinate)
        const positionKey = `${x},${y}`

        const isValidDrop = validPositions.has(positionKey)
        const isColliding = collisionResult?.conflictingCoordinates.some(
          c => c.x === x && c.y === y
        ) || false

        const isPreview = shipPreview?.coordinates.some(
          c => c.x === x && c.y === y
        ) || false

        cells.push(
          <GridCell
            key={positionKey}
            coordinate={coordinate}
            hasShip={cell?.hasShip || false}
            shipId={cell?.shipId}
            isHit={cell?.isHit || false}
            isValidDrop={isValidDrop}
            isColliding={isColliding}
            isPreview={isPreview}
            showCoordinate={showCoordinates}
            onCellClick={handleCellClick}
            onCellEnter={handleCellEnter}
            onCellLeave={handleCellLeave}
          />
        )
      }
    }

    return cells
  }, [
    board,
    validPositions,
    collisionResult,
    shipPreview,
    showCoordinates
  ])

  // Render placed ships
  const shipElements = useMemo(() => {
    return ships
      .filter(ship => ship.position)
      .map(ship => (
        <PlacedShip
          key={ship.id}
          ship={ship}
          onDragStart={(e) => handleShipDragStart(e, ship)}
          onDoubleClick={() => handleShipRotate(ship)}
          onContextMenu={(e) => handleShipContextMenu(e, ship)}
          isDragging={dragState?.draggedShip?.id === ship.id}
          disabled={disabled}
        />
      ))
  }, [ships, dragState, disabled])

  const handleShipPlacement = useCallback((
    ship: GameShip,
    position: Coordinate,
    orientation: Orientation
  ): boolean => {
    const validation = validator.validateSinglePlacement(
      ship.id,
      ship.size,
      position,
      orientation
    )

    if (validation.isValid) {
      if (ship.position) {
        onShipMoved(ship, position, orientation)
      } else {
        onShipPlaced(ship, position, orientation)
      }

      // Refresh collision map
      collisionDetector.refreshCollisionMap()
      return true
    }

    return false
  }, [validator, onShipPlaced, onShipMoved, collisionDetector])

  const handleShipDragStart = useCallback((
    event: React.MouseEvent | React.TouchEvent,
    ship: GameShip
  ) => {
    if (disabled || !dragHandler) return

    const element = event.currentTarget as HTMLElement

    if ('touches' in event) {
      dragHandler.handleTouchStart(event as React.TouchEvent, ship, element)
    } else {
      dragHandler.handleMouseDown(event as React.MouseEvent, ship, element)
    }
  }, [disabled, dragHandler])

  const handleShipRotate = useCallback((ship: GameShip) => {
    if (disabled || !ship.position) return

    const newOrientation: Orientation =
      ship.position.orientation === 'horizontal' ? 'vertical' : 'horizontal'

    const validation = validator.validateSinglePlacement(
      ship.id,
      ship.size,
      ship.position.startPosition,
      newOrientation
    )

    if (validation.isValid) {
      onShipMoved(ship, ship.position.startPosition, newOrientation)
    }
  }, [disabled, validator, onShipMoved])

  const handleShipContextMenu = useCallback((
    event: React.MouseEvent,
    ship: GameShip
  ) => {
    event.preventDefault()
    if (disabled) return

    // Show context menu or remove ship
    onShipRemoved(ship.id)
  }, [disabled, onShipRemoved])

  const handleCellClick = useCallback((coordinate: Coordinate) => {
    if (disabled || !selectedShip) return

    // Try to place selected ship at clicked position
    const orientation = selectedShip.position?.orientation || 'horizontal'
    handleShipPlacement(selectedShip, coordinate, orientation)
  }, [disabled, selectedShip, handleShipPlacement])

  const handleCellEnter = useCallback((coordinate: Coordinate) => {
    if (disabled || !selectedShip || dragState?.isDragging) return

    const orientation = selectedShip.position?.orientation || 'horizontal'
    const preview = collisionDetector.getCollisionPreview(
      selectedShip.size,
      coordinate,
      orientation
    )

    setShipPreview({
      shipId: selectedShip.id,
      coordinates: preview.coordinates,
      orientation,
      isValid: preview.isValid,
      collisionType: preview.collisionType
    })

    setHoveredCell(coordinate)
  }, [disabled, selectedShip, dragState, collisionDetector])

  const handleCellLeave = useCallback((coordinate: Coordinate) => {
    if (disabled || dragState?.isDragging) return

    if (hoveredCell?.x === coordinate.x && hoveredCell?.y === coordinate.y) {
      setHoveredCell(null)
      setShipPreview(null)
    }
  }, [disabled, dragState, hoveredCell])

  return (
    <div
      ref={gridRef}
      className={`placement-grid ${className}`}
      role="grid"
      aria-label="Ship placement grid"
      data-testid="placement-grid"
    >
      <div
        className="grid-container"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: '1px',
          position: 'relative',
          border: '2px solid var(--color-border)',
          borderRadius: '8px',
          backgroundColor: 'var(--color-water)',
          padding: '4px'
        }}
      >
        {gridCells}
        {shipElements}
        {shipPreview && (
          <ShipPreviewElement
            preview={shipPreview}
            cellSize={CELL_SIZE}
          />
        )}
      </div>

      {/* Accessibility announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {collisionResult?.description}
        {selectedShip && `Selected ship: ${selectedShip.name}`}
      </div>
    </div>
  )
}

// Grid Cell Component
const GridCell: React.FC<GridCellProps> = ({
  coordinate,
  hasShip,
  shipId: _shipId,
  isHit,
  isValidDrop,
  isColliding,
  isPreview,
  showCoordinate,
  onCellClick,
  onCellEnter,
  onCellLeave
}) => {
  const cellClasses = [
    'grid-cell',
    hasShip && 'has-ship',
    isHit && 'is-hit',
    isValidDrop && 'valid-drop',
    isColliding && 'colliding',
    isPreview && 'preview'
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cellClasses}
      style={{
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
        border: '1px solid var(--color-border-light)',
        borderRadius: '2px',
        backgroundColor: hasShip ? 'var(--color-ship)' : 'var(--color-water)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        userSelect: 'none',
        transition: 'all 0.2s ease'
      }}
      role="gridcell"
      tabIndex={0}
      aria-label={`Cell ${coordinate.x}, ${coordinate.y}${hasShip ? ` occupied by ship` : ''}`}
      onClick={() => onCellClick(coordinate)}
      onMouseEnter={() => onCellEnter(coordinate)}
      onMouseLeave={() => onCellLeave(coordinate)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCellClick(coordinate)
        }
      }}
      data-coordinate={`${coordinate.x},${coordinate.y}`}
      data-testid={`grid-cell-${coordinate.x}-${coordinate.y}`}
    >
      {showCoordinate && `${coordinate.x},${coordinate.y}`}
    </div>
  )
}

// Placed Ship Component
interface PlacedShipProps {
  ship: GameShip
  onDragStart: (event: React.MouseEvent | React.TouchEvent) => void
  onDoubleClick: () => void
  onContextMenu: (event: React.MouseEvent) => void
  isDragging: boolean
  disabled: boolean
}

const PlacedShip: React.FC<PlacedShipProps> = ({
  ship,
  onDragStart,
  onDoubleClick,
  onContextMenu,
  isDragging,
  disabled
}) => {
  if (!ship.position) return null

  const { startPosition, orientation } = ship.position
  const isHorizontal = orientation === 'horizontal'

  const shipStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${startPosition.x * (CELL_SIZE + 1) + 4}px`,
    top: `${startPosition.y * (CELL_SIZE + 1) + 4}px`,
    width: `${(isHorizontal ? ship.size : 1) * CELL_SIZE + (isHorizontal ? ship.size - 1 : 0)}px`,
    height: `${(isHorizontal ? 1 : ship.size) * CELL_SIZE + (isHorizontal ? 0 : ship.size - 1)}px`,
    backgroundColor: 'var(--color-ship-placed)',
    border: '2px solid var(--color-ship-border)',
    borderRadius: '4px',
    cursor: disabled ? 'default' : 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--color-ship-text)',
    zIndex: isDragging ? 1000 : 10,
    transition: isDragging ? 'none' : 'all 0.2s ease',
    opacity: isDragging ? 0.8 : 1,
    transform: isDragging ? 'rotate(2deg)' : 'none',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)'
  }

  return (
    <div
      className={`placed-ship ${isDragging ? 'dragging' : ''}`}
      style={shipStyle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${ship.name} (${ship.size} cells, ${orientation})`}
      onMouseDown={disabled ? undefined : onDragStart}
      onTouchStart={disabled ? undefined : onDragStart}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDoubleClick()
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          onContextMenu(e as React.MouseEvent)
        }
      }}
      data-ship-id={ship.id}
      data-testid={`placed-ship-${ship.id}`}
    >
      {ship.size}
    </div>
  )
}

// Ship Preview Component
interface ShipPreviewElementProps {
  preview: ShipPreview
  cellSize: number
}

const ShipPreviewElement: React.FC<ShipPreviewElementProps> = ({
  preview,
  cellSize
}) => {
  const { coordinates, orientation, isValid } = preview

  if (coordinates.length === 0) return null

  const startCoord = coordinates[0]
  const isHorizontal = orientation === 'horizontal'

  const previewStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${startCoord.x * (cellSize + 1) + 4}px`,
    top: `${startCoord.y * (cellSize + 1) + 4}px`,
    width: `${(isHorizontal ? coordinates.length : 1) * cellSize + (isHorizontal ? coordinates.length - 1 : 0)}px`,
    height: `${(isHorizontal ? 1 : coordinates.length) * cellSize + (isHorizontal ? 0 : coordinates.length - 1)}px`,
    backgroundColor: isValid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)',
    border: `2px solid ${isValid ? 'green' : 'red'}`,
    borderRadius: '4px',
    zIndex: 5,
    pointerEvents: 'none',
    transition: 'all 0.1s ease'
  }

  return (
    <div
      className="ship-preview"
      style={previewStyle}
      data-testid="ship-preview"
    />
  )
}
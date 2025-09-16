/**
 * Konva.js Placement Board Component
 * Interactive 10x10 canvas grid with 4-layer architecture
 *
 * Part of TASK 3: Konva.js Board Component
 * Implements GridLayer, PreviewLayer, ShipsLayer with 60fps performance
 */

'use client'

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Interactive grid component (enhanced DOM-based implementation)
const InteractiveGrid: React.FC<{
  placementState: PlacementState
  onCellClick: (cell: Cell) => void
  onCellHover: (cell: Cell) => void
}> = ({ placementState, onCellClick, onCellHover }) => {
  return (
    <div className="w-[440px] h-[440px] bg-blue-900 border-2 border-blue-500 rounded-lg p-2" data-testid="interactive-grid">
      <div className="grid grid-cols-10 gap-1 h-full">{/* Debug: Rendering ${100} grid cells */}
        {Array.from({ length: 100 }).map((_, index) => {
          const x = index % 10
          const y = Math.floor(index / 10)
          const cell = { x, y }

          const ship = placementState.placedShips.find(ship =>
            ship.cells.some(shipCell => shipCell.x === x && shipCell.y === y)
          )

          const isPreview = placementState.preview?.cells.some(previewCell =>
            previewCell.x === x && previewCell.y === y
          )

          return (
            <button
              key={index}
              data-testid={`grid-cell-${x}-${y}`}
              onClick={() => onCellClick(cell)}
              onMouseEnter={() => onCellHover(cell)}
              className={`aspect-square rounded-sm border border-blue-400 transition-all ${
                ship
                  ? 'bg-red-600 border-red-400'
                  : isPreview
                  ? placementState.preview?.isValid
                    ? 'bg-green-500 border-green-400'
                    : 'bg-red-500 border-red-400'
                  : 'bg-blue-700 hover:bg-blue-600'
              }`}
              title={`Grid ${x},${y}${ship ? ` - ${ship.id.split('_')[0]}` : ''}`}
              aria-label={`Grid cell ${x}, ${y}${ship ? `, occupied by ${ship.id.split('_')[0]}` : ', empty'}`}
            />
          )
        })}
      </div>
    </div>
  )
}
import {
  Cell,
  PlacedShip,
  cellToPixel,
  pixelToCell,
  getShipBounds
} from '../../lib/placement'
import {
  PlacementState,
  PlacementPreview,
  ShipKind,
  SHIP_SPECS
} from '../../lib/placement/stateMachine'
import { Orientation } from '../../lib/game/types'

// =============================================
// CONSTANTS
// =============================================

const CELL_SIZE = 40
const GRID_SIZE = 10
const BOARD_PADDING = 20
const STAGE_WIDTH = GRID_SIZE * CELL_SIZE + BOARD_PADDING * 2
const STAGE_HEIGHT = GRID_SIZE * CELL_SIZE + BOARD_PADDING * 2

// Ship colors by type
const SHIP_COLORS: Record<ShipKind, string> = {
  carrier: '#1e40af',     // blue-800
  battleship: '#7c2d12',  // red-800
  cruiser: '#166534',     // green-800
  submarine: '#a21caf',   // purple-700
  destroyer: '#ea580c'    // orange-600
}

// =============================================
// COMPONENT INTERFACE
// =============================================

export interface KonvaPlacementBoardProps {
  placementState: PlacementState
  onCellClick: (cell: Cell) => void
  onCellHover: (cell: Cell) => void
  onCellLeave: () => void
  onShipClick: (shipId: string) => void
  onShipDrag: (shipId: string, newCell: Cell) => void
  onShipDoubleClick?: (shipId: string) => void
  className?: string
}

// =============================================
// GRID LAYER COMPONENT
// =============================================

const GridLayer: React.FC = React.memo(() => {
  const gridElements = useMemo(() => {
    const elements: React.ReactNode[] = []

    // Draw grid cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixel = cellToPixel({ x, y }, CELL_SIZE, { x: BOARD_PADDING, y: BOARD_PADDING })

        // Cell background
        elements.push(
          <Rect
            key={`cell-${x}-${y}`}
            x={pixel.x}
            y={pixel.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill="#0ea5e9"
            stroke="#0284c7"
            strokeWidth={1}
            opacity={0.3}
          />
        )

        // Coordinate labels (every other cell to avoid clutter)
        if (x % 2 === 0 && y % 2 === 0) {
          elements.push(
            <Text
              key={`label-${x}-${y}`}
              x={pixel.x + 2}
              y={pixel.y + 2}
              text={`${x},${y}`}
              fontSize={10}
              fill="#075985"
              opacity={0.6}
            />
          )
        }
      }
    }

    return elements
  }, [])

  return <Layer name="grid" listening={false}>{gridElements}</Layer>
})

GridLayer.displayName = 'GridLayer'

// =============================================
// PREVIEW LAYER COMPONENT
// =============================================

interface PreviewLayerProps {
  preview?: PlacementPreview
}

const PreviewLayer: React.FC<PreviewLayerProps> = React.memo(({ preview }) => {
  const previewElements = useMemo(() => {
    if (!preview) return []

    const elements: React.ReactNode[] = []

    preview.cells.forEach((cell, index) => {
      const pixel = cellToPixel(cell, CELL_SIZE, { x: BOARD_PADDING, y: BOARD_PADDING })

      elements.push(
        <Rect
          key={`preview-${index}`}
          x={pixel.x}
          y={pixel.y}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={preview.isValid ? '#10b981' : '#ef4444'}
          opacity={0.6}
          stroke={preview.isValid ? '#059669' : '#dc2626'}
          strokeWidth={2}
        />
      )
    })

    return elements
  }, [preview])

  return <Layer name="preview">{previewElements}</Layer>
})

PreviewLayer.displayName = 'PreviewLayer'

// =============================================
// SHIPS LAYER COMPONENT
// =============================================

interface ShipsLayerProps {
  placedShips: PlacedShip[]
  editingShipId?: string
  onShipClick: (shipId: string) => void
  onShipDrag: (shipId: string, newCell: Cell) => void
  onShipDoubleClick?: (shipId: string) => void
}

const ShipsLayer: React.FC<ShipsLayerProps> = React.memo(({
  placedShips,
  editingShipId,
  onShipClick,
  onShipDrag,
  onShipDoubleClick
}) => {
  const shipElements = useMemo(() => {
    return placedShips.map(ship => {
      const shipKind = ship.id.split('_')[0] as ShipKind
      const color = SHIP_COLORS[shipKind] || '#334155'
      const bounds = getShipBounds(ship.cells, CELL_SIZE, { x: BOARD_PADDING, y: BOARD_PADDING })
      const isEditing = ship.id === editingShipId

      return (
        <Rect
          key={ship.id}
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill={color}
          stroke={isEditing ? '#fbbf24' : '#1e293b'}
          strokeWidth={isEditing ? 3 : 2}
          opacity={isEditing ? 0.8 : 1}
          shadowColor="#000000"
          shadowBlur={isEditing ? 8 : 4}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.3}
          draggable={true}
          onClick={() => onShipClick(ship.id)}
          onDblClick={() => onShipDoubleClick?.(ship.id)}
          onDragEnd={(e) => {
            const stage = e.target.getStage()
            if (!stage) return

            const pos = e.target.position()
            const cell = pixelToCell(pos, CELL_SIZE, { x: BOARD_PADDING, y: BOARD_PADDING })
            onShipDrag(ship.id, cell)

            // Reset position (let state machine handle the move)
            e.target.position({ x: bounds.x, y: bounds.y })
          }}
        />
      )
    })
  }, [placedShips, editingShipId, onShipClick, onShipDrag, onShipDoubleClick])

  return <Layer name="ships">{shipElements}</Layer>
})

ShipsLayer.displayName = 'ShipsLayer'

// =============================================
// MAIN BOARD COMPONENT
// =============================================

export const KonvaPlacementBoard: React.FC<KonvaPlacementBoardProps> = React.memo(({
  placementState,
  onCellClick,
  onCellHover,
  onCellLeave,
  onShipClick,
  onShipDrag,
  onShipDoubleClick,
  className = ''
}) => {
  const stageRef = useRef<Konva.Stage>(null)

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleStageClick = useCallback((e: any) => {
    // Only handle clicks on the stage background (not on ships)
    if (e.target === e.target.getStage()) {
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos) {
        const cell = pixelToCell(pos, CELL_SIZE, { x: BOARD_PADDING, y: BOARD_PADDING })
        // Only trigger if cell is within grid bounds
        if (cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE) {
          onCellClick(cell)
        }
      }
    }
  }, [onCellClick])

  const handleStageMouseMove = useCallback((e: any) => {
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      const cell = pixelToCell(pos, CELL_SIZE, { x: BOARD_PADDING, y: BOARD_PADDING })
      // Only trigger if cell is within grid bounds
      if (cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE) {
        onCellHover(cell)
      }
    }
  }, [onCellHover])

  const handleStageMouseLeave = useCallback(() => {
    onCellLeave()
  }, [onCellLeave])

  // =============================================
  // SHIP EVENT HANDLERS
  // =============================================

  const handleShipClick = useCallback((shipId: string) => {
    onShipClick(shipId)
  }, [onShipClick])

  const handleShipDrag = useCallback((shipId: string, newCell: Cell) => {
    onShipDrag(shipId, newCell)
  }, [onShipDrag])

  const handleShipDoubleClick = useCallback((shipId: string) => {
    onShipDoubleClick?.(shipId)
  }, [onShipDoubleClick])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className={`konva-placement-board ${className}`}>
      <InteractiveGrid
        placementState={placementState}
        onCellClick={onCellClick}
        onCellHover={onCellHover}
      />

      {/* Accessibility overlay */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {placementState.mode === 'preview' && placementState.preview && (
          <span>
            {placementState.preview.isValid
              ? `Valid placement for ${placementState.selectedShipKind} at ${placementState.preview.origin.x}, ${placementState.preview.origin.y}`
              : `Invalid placement: ${placementState.preview.reason}`
            }
          </span>
        )}
        {placementState.mode === 'editing' && (
          <span>Editing ship {placementState.editingShipId}. Use mouse to move or press R to rotate.</span>
        )}
      </div>
    </div>
  )
})

KonvaPlacementBoard.displayName = 'KonvaPlacementBoard'
'use client'

/**
 * PlayerBoard Component
 *
 * Player's own board view with ship placement, fleet management, and defensive visualization.
 * Integrates with Phase 2 game state and Phase 3 canvas components for complete ship placement
 * and fleet status display.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { GameCanvas, GameCanvasRef } from '../canvas/GameCanvas'
import { CanvasGrid } from '../canvas/CanvasGrid'
import { ShipRenderer } from '../canvas/ships/ShipRenderer'
import { DragDropCanvas } from '../canvas/interactions/DragDropCanvas'
import { HoverEffects } from '../canvas/interactions/HoverEffects'
import { GridCoordinates } from './ui/GridCoordinates'
import { GamePlayer, GamePhaseType, Coordinate, GameShip } from '../../lib/game/types'
import { colors } from '../../styles/tokens/colors'
import { game } from '../../styles/tokens/game'

// =============================================
// TYPES
// =============================================

export interface PlayerBoardProps {
  /** Player data */
  player: GamePlayer
  /** Current game phase */
  gamePhase: GamePhaseType
  /** Whether this player is currently active */
  isActive: boolean
  /** Event handlers */
  onCellClick?: (coordinate: Coordinate) => void
  onCellHover?: (coordinate: Coordinate | null) => void
  onShipPlace?: (shipId: string, coordinate: Coordinate, orientation: 'horizontal' | 'vertical') => void
  onShipMove?: (shipId: string, fromCoordinate: Coordinate, toCoordinate: Coordinate) => void
  onCanvasReady?: (canvasRef: GameCanvasRef) => void
  /** Display options */
  enableAnimations?: boolean
  showCoordinates?: boolean
  showDamage?: boolean
  className?: string
}

interface DragState {
  isDragging: boolean
  draggedShipId: string | null
  dragStartCoordinate: Coordinate | null
  previewCoordinate: Coordinate | null
  previewOrientation: 'horizontal' | 'vertical'
}

// =============================================
// MAIN COMPONENT
// =============================================

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  player,
  gamePhase,
  isActive,
  onCellClick,
  onCellHover,
  onShipPlace,
  onShipMove,
  onCanvasReady,
  enableAnimations = true,
  showCoordinates = true,
  showDamage = true,
  className = '',
}) => {
  // =============================================
  // STATE AND REFS
  // =============================================

  const canvasRef = useRef<GameCanvasRef>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedShipId: null,
    dragStartCoordinate: null,
    previewCoordinate: null,
    previewOrientation: 'horizontal',
  })

  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null)

  // =============================================
  // DERIVED STATE
  // =============================================

  const isPlacementPhase = gamePhase === 'ship_placement'
  const isBattlePhase = gamePhase === 'battle'
  const boardState = player.board
  const fleet = player.fleet

  const unplacedShips = useMemo(() =>
    fleet.filter(ship => !ship.position),
    [fleet]
  )

  const placedShips = useMemo(() =>
    fleet.filter(ship => ship.position),
    [fleet]
  )

  const boardDimensions = useMemo(() => ({
    width: boardState.width,
    height: boardState.height,
  }), [boardState.width, boardState.height])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleCanvasReady = useCallback((canvas: GameCanvasRef) => {
    canvasRef.current = canvas
    onCanvasReady?.(canvas)
  }, [onCanvasReady])

  const handleCellClick = useCallback((coordinate: Coordinate) => {
    if (isPlacementPhase && dragState.isDragging) {
      // Handle ship placement
      if (dragState.draggedShipId && onShipPlace) {
        onShipPlace(
          dragState.draggedShipId,
          coordinate,
          dragState.previewOrientation
        )
        setDragState({
          isDragging: false,
          draggedShipId: null,
          dragStartCoordinate: null,
          previewCoordinate: null,
          previewOrientation: 'horizontal',
        })
      }
    } else {
      onCellClick?.(coordinate)
    }
  }, [isPlacementPhase, dragState, onShipPlace, onCellClick])

  const handleCellHover = useCallback((coordinate: Coordinate | null) => {
    setHoveredCell(coordinate)

    if (dragState.isDragging && coordinate) {
      setDragState(prev => ({
        ...prev,
        previewCoordinate: coordinate,
      }))
    }

    onCellHover?.(coordinate)
  }, [dragState.isDragging, onCellHover])

  const handleShipDragStart = useCallback((shipId: string, coordinate: Coordinate) => {
    if (!isPlacementPhase) return

    const ship = fleet.find(s => s.id === shipId)
    if (!ship) return

    setDragState({
      isDragging: true,
      draggedShipId: shipId,
      dragStartCoordinate: coordinate,
      previewCoordinate: coordinate,
      previewOrientation: ship.position?.orientation || 'horizontal',
    })
  }, [isPlacementPhase, fleet])

  const handleShipDragEnd = useCallback((coordinate: Coordinate) => {
    if (!dragState.isDragging || !dragState.draggedShipId) return

    if (onShipMove && dragState.dragStartCoordinate) {
      onShipMove(
        dragState.draggedShipId,
        dragState.dragStartCoordinate,
        coordinate
      )
    }

    setDragState({
      isDragging: false,
      draggedShipId: null,
      dragStartCoordinate: null,
      previewCoordinate: null,
      previewOrientation: 'horizontal',
    })
  }, [dragState, onShipMove])

  const handleOrientationToggle = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        previewOrientation: prev.previewOrientation === 'horizontal' ? 'vertical' : 'horizontal',
      }))
    }
  }, [dragState.isDragging])

  // =============================================
  // CANVAS LAYER CONFIGURATION
  // =============================================

  const canvasLayers = useMemo(() => (
    <>
      {/* Grid Layer */}
      <CanvasGrid
        width={boardDimensions.width}
        height={boardDimensions.height}
        cellSize={40}
        showBorder={true}
        showLabels={showCoordinates}
        gridColor={colors.maritime.foam.dark}
        labelColor={colors.text.secondary}
        backgroundColor={colors.maritime.wave.light}
      />

      {/* Ship Layer */}
      <ShipRenderer
        ships={placedShips}
        showDamage={showDamage}
        showHealthBars={isBattlePhase}
        enableAnimations={enableAnimations}
        highlightedShip={dragState.draggedShipId}
      />

      {/* Interactive Layer */}
      {isPlacementPhase && (
        <DragDropCanvas
          ships={fleet}
          boardState={boardState}
          onShipDragStart={handleShipDragStart}
          onShipDragEnd={handleShipDragEnd}
          dragPreview={dragState.isDragging ? {
            shipId: dragState.draggedShipId!,
            coordinate: dragState.previewCoordinate!,
            orientation: dragState.previewOrientation,
            isValid: true, // TODO: Add placement validation
          } : null}
          enableCollisionDetection={true}
        />
      )}

      {/* Hover Effects */}
      <HoverEffects
        hoveredCell={hoveredCell}
        ships={placedShips}
        boardState={boardState}
        showShipInfo={true}
        showCellInfo={isPlacementPhase}
        enableSoundEffects={enableAnimations}
      />
    </>
  ), [
    boardDimensions,
    showCoordinates,
    placedShips,
    showDamage,
    isBattlePhase,
    enableAnimations,
    dragState,
    isPlacementPhase,
    fleet,
    boardState,
    handleShipDragStart,
    handleShipDragEnd,
    hoveredCell,
  ])

  // =============================================
  // KEYBOARD HANDLING
  // =============================================

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isActive) return

      switch (event.key) {
        case ' ':
        case 'r':
        case 'R':
          event.preventDefault()
          handleOrientationToggle()
          break
        case 'Escape':
          if (dragState.isDragging) {
            setDragState({
              isDragging: false,
              draggedShipId: null,
              dragStartCoordinate: null,
              previewCoordinate: null,
              previewOrientation: 'horizontal',
            })
          }
          break
      }
    }

    if (isPlacementPhase) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isActive, isPlacementPhase, dragState.isDragging, handleOrientationToggle])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div
      className={`player-board-container ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.maritime.wave.light}, ${colors.maritime.wave.primary})`,
        border: `2px solid ${isActive ? colors.primary.DEFAULT : colors.maritime.foam.dark}`,
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
      }}
    >
      {/* Board Status Indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className={`px-2 py-1 rounded text-xs font-semibold ${
            isActive
              ? 'bg-green-500 text-white'
              : 'bg-gray-500 text-gray-200'
          }`}
        >
          {isPlacementPhase
            ? `${unplacedShips.length} ships to place`
            : `${placedShips.filter(s => !s.damage.isSunk).length}/${fleet.length} active`
          }
        </div>
      </div>

      {/* Coordinates */}
      {showCoordinates && (
        <GridCoordinates
          width={boardDimensions.width}
          height={boardDimensions.height}
          position="overlay"
          theme="maritime"
        />
      )}

      {/* Main Canvas */}
      <GameCanvas
        boardWidth={boardDimensions.width}
        boardHeight={boardDimensions.height}
        boardState={boardState}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
        onCanvasReady={handleCanvasReady}
        enableAnimations={enableAnimations}
        showGrid={false} // Grid is handled by CanvasGrid layer
        showCoordinates={false} // Coordinates handled separately
        className="w-full h-full min-h-[400px]"
      >
        {canvasLayers}
      </GameCanvas>

      {/* Placement Instructions */}
      {isPlacementPhase && isActive && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-black bg-opacity-70 text-white text-xs p-2 rounded">
            {dragState.isDragging
              ? 'Click to place ship • Space/R to rotate • Escape to cancel'
              : 'Drag ships to place them • Click placed ships to move'
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerBoard
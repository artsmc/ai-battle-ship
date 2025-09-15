'use client'

/**
 * OpponentBoard Component
 *
 * Opponent's board view for targeting, combat, and strategic analysis.
 * Integrates with Phase 2 combat engine and Phase 3 targeting system
 * for complete battle interface with fog of war and targeting feedback.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { GameCanvas, GameCanvasRef } from '../canvas/GameCanvas'
import { CanvasGrid } from '../canvas/CanvasGrid'
import { ShipRenderer } from '../canvas/ships/ShipRenderer'
import { TargetingSystem } from '../canvas/interactions/TargetingSystem'
import { HoverEffects } from '../canvas/interactions/HoverEffects'
import { GridCoordinates } from './ui/GridCoordinates'
import { GamePlayer, GamePhaseType, Coordinate, GameShip, AttackResult } from '../../lib/game/types'
import { colors } from '../../styles/tokens/colors'
import { game } from '../../styles/tokens/game'

// =============================================
// TYPES
// =============================================

export interface OpponentBoardProps {
  /** Opponent player data */
  player: GamePlayer
  /** Current game phase */
  gamePhase: GamePhaseType
  /** Whether targeting is currently active */
  isActive: boolean
  /** Event handlers */
  onCellClick?: (coordinate: Coordinate) => void
  onCellHover?: (coordinate: Coordinate | null) => void
  onAttack?: (coordinate: Coordinate) => void
  onAbilityActivate?: (abilityId: string, targetCoordinate?: Coordinate) => void
  onCanvasReady?: (canvasRef: GameCanvasRef) => void
  /** Display options */
  enableAnimations?: boolean
  showCoordinates?: boolean
  fogOfWar?: boolean
  showProbability?: boolean
  className?: string
}

interface TargetingState {
  mode: 'normal' | 'ability' | 'disabled'
  selectedAbilityId: string | null
  targetPreview: Coordinate | null
  attackPreview: AttackResult | null
  hoveredTarget: Coordinate | null
  targetingArea: Coordinate[] | null
}

// =============================================
// MAIN COMPONENT
// =============================================

export const OpponentBoard: React.FC<OpponentBoardProps> = ({
  player,
  gamePhase,
  isActive,
  onCellClick,
  onCellHover,
  onAttack,
  onAbilityActivate,
  onCanvasReady,
  enableAnimations = true,
  showCoordinates = true,
  fogOfWar = true,
  showProbability = false,
  className = '',
}) => {
  // =============================================
  // STATE AND REFS
  // =============================================

  const canvasRef = useRef<GameCanvasRef>(null)
  const [targetingState, setTargetingState] = useState<TargetingState>({
    mode: 'normal',
    selectedAbilityId: null,
    targetPreview: null,
    attackPreview: null,
    hoveredTarget: null,
    targetingArea: null,
  })

  // =============================================
  // DERIVED STATE
  // =============================================

  const isBattlePhase = gamePhase === 'battle'
  const boardState = player.board
  const fleet = player.fleet

  const boardDimensions = useMemo(() => ({
    width: boardState.width,
    height: boardState.height,
  }), [boardState.width, boardState.height])

  // Filter visible ships based on fog of war
  const visibleShips = useMemo(() => {
    if (!fogOfWar) return fleet

    // Only show ships that have been hit or sunk
    return fleet.filter(ship => {
      return ship.damage.totalHits > 0 || ship.damage.isSunk
    })
  }, [fleet, fogOfWar])

  // Get all hit and miss coordinates for display
  const attackHistory = useMemo(() => ({
    hits: boardState.hits,
    misses: boardState.misses,
  }), [boardState.hits, boardState.misses])

  // Calculate targeting probability for AI assistance (if enabled)
  const targetingProbability = useMemo(() => {
    if (!showProbability) return null

    const probabilityMap: Record<string, number> = {}

    for (let x = 0; x < boardDimensions.width; x++) {
      for (let y = 0; y < boardDimensions.height; y++) {
        const coord = `${x},${y}`
        const cell = boardState.cells[y]?.[x]

        if (cell?.isHit || cell?.isRevealed) {
          probabilityMap[coord] = 0
        } else {
          // Simple probability based on adjacent hits
          probabilityMap[coord] = calculateHitProbability(x, y, attackHistory.hits)
        }
      }
    }

    return probabilityMap
  }, [showProbability, boardDimensions, boardState.cells, attackHistory.hits])

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  const calculateHitProbability = (x: number, y: number, hits: Coordinate[]): number => {
    let probability = 0.1 // Base probability

    // Increase probability near previous hits
    for (const hit of hits) {
      const distance = Math.abs(hit.x - x) + Math.abs(hit.y - y)
      if (distance === 1) {
        probability += 0.4 // Adjacent to hit
      } else if (distance === 2) {
        probability += 0.2 // Two cells away
      }
    }

    return Math.min(probability, 1.0)
  }

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleCanvasReady = useCallback((canvas: GameCanvasRef) => {
    canvasRef.current = canvas
    onCanvasReady?.(canvas)
  }, [onCanvasReady])

  const handleCellClick = useCallback((coordinate: Coordinate) => {
    if (!isActive || !isBattlePhase) {
      onCellClick?.(coordinate)
      return
    }

    // Check if cell is already targeted
    const cell = boardState.cells[coordinate.y]?.[coordinate.x]
    if (cell?.isHit) {
      onCellClick?.(coordinate)
      return
    }

    if (targetingState.mode === 'ability' && targetingState.selectedAbilityId) {
      // Execute ability
      onAbilityActivate?.(targetingState.selectedAbilityId, coordinate)
      setTargetingState(prev => ({
        ...prev,
        mode: 'normal',
        selectedAbilityId: null,
        targetingArea: null,
      }))
    } else {
      // Normal attack
      onAttack?.(coordinate)
    }

    onCellClick?.(coordinate)
  }, [
    isActive,
    isBattlePhase,
    boardState.cells,
    targetingState.mode,
    targetingState.selectedAbilityId,
    onAbilityActivate,
    onAttack,
    onCellClick
  ])

  const handleCellHover = useCallback((coordinate: Coordinate | null) => {
    setTargetingState(prev => ({
      ...prev,
      hoveredTarget: coordinate,
      targetPreview: coordinate,
    }))

    onCellHover?.(coordinate)
  }, [onCellHover])

  const handleAbilitySelect = useCallback((abilityId: string) => {
    setTargetingState(prev => ({
      ...prev,
      mode: 'ability',
      selectedAbilityId: abilityId,
      targetingArea: getAbilityTargetingArea(abilityId), // TODO: Implement
    }))
  }, [])

  const handleTargetingCancel = useCallback(() => {
    setTargetingState(prev => ({
      ...prev,
      mode: 'normal',
      selectedAbilityId: null,
      targetingArea: null,
      targetPreview: null,
    }))
  }, [])

  // Placeholder for ability targeting area calculation
  const getAbilityTargetingArea = (abilityId: string): Coordinate[] | null => {
    // TODO: Implement based on ability types from Phase 2
    return null
  }

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
        backgroundColor={colors.maritime.wave.dark}
        opacity={fogOfWar ? 0.8 : 1.0}
      />

      {/* Probability Overlay (if enabled) */}
      {targetingProbability && (
        <div className="targeting-probability-layer">
          {/* TODO: Render probability heat map */}
        </div>
      )}

      {/* Ship Layer (visible ships only) */}
      <ShipRenderer
        ships={visibleShips}
        showDamage={true}
        showHealthBars={false} // Don't reveal health to opponent
        enableAnimations={enableAnimations}
        fogOfWar={fogOfWar}
        damageOnly={true} // Only show damage, not full ship
      />

      {/* Attack History Layer */}
      {attackHistory.hits.map((hit, index) => (
        <div
          key={`hit-${index}`}
          className="attack-marker hit"
          style={{
            position: 'absolute',
            left: `${hit.x * 40 + 20}px`,
            top: `${hit.y * 40 + 20}px`,
            width: '8px',
            height: '8px',
            backgroundColor: colors.status.error,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        />
      ))}

      {attackHistory.misses.map((miss, index) => (
        <div
          key={`miss-${index}`}
          className="attack-marker miss"
          style={{
            position: 'absolute',
            left: `${miss.x * 40 + 20}px`,
            top: `${miss.y * 40 + 20}px`,
            width: '6px',
            height: '6px',
            backgroundColor: colors.text.muted,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        />
      ))}

      {/* Targeting System */}
      {isBattlePhase && isActive && (
        <TargetingSystem
          boardState={boardState}
          targetingMode={targetingState.mode}
          hoveredTarget={targetingState.hoveredTarget}
          targetingArea={targetingState.targetingArea}
          attackPreview={targetingState.attackPreview}
          onTargetSelect={handleCellClick}
          enableCrosshair={true}
          enablePreview={true}
          enableSoundEffects={enableAnimations}
        />
      )}

      {/* Hover Effects */}
      <HoverEffects
        hoveredCell={targetingState.hoveredTarget}
        ships={visibleShips}
        boardState={boardState}
        showShipInfo={false} // Don't reveal ship info to opponent
        showCellInfo={true}
        enableSoundEffects={enableAnimations}
        fogOfWar={fogOfWar}
      />
    </>
  ), [
    boardDimensions,
    showCoordinates,
    targetingProbability,
    visibleShips,
    enableAnimations,
    fogOfWar,
    attackHistory,
    isBattlePhase,
    isActive,
    boardState,
    targetingState,
    handleCellClick,
  ])

  // =============================================
  // KEYBOARD HANDLING
  // =============================================

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isActive || !isBattlePhase) return

      switch (event.key) {
        case 'Escape':
          if (targetingState.mode === 'ability') {
            handleTargetingCancel()
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          // Quick ability selection (TODO: implement based on available abilities)
          event.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isActive, isBattlePhase, targetingState.mode, handleTargetingCancel])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div
      className={`opponent-board-container ${className}`}
      style={{
        background: fogOfWar
          ? `linear-gradient(135deg, ${colors.maritime.wave.dark}, #1a1a2e)`
          : `linear-gradient(135deg, ${colors.maritime.wave.light}, ${colors.maritime.wave.primary})`,
        border: `2px solid ${isActive ? colors.accent.DEFAULT : colors.maritime.foam.dark}`,
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
      }}
    >
      {/* Targeting Status */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className={`px-2 py-1 rounded text-xs font-semibold ${
            isActive
              ? targetingState.mode === 'ability'
                ? 'bg-purple-500 text-white'
                : 'bg-red-500 text-white'
              : 'bg-gray-500 text-gray-200'
          }`}
        >
          {targetingState.mode === 'ability'
            ? 'Ability Ready'
            : isActive
            ? 'Ready to Fire'
            : 'Waiting...'
          }
        </div>
      </div>

      {/* Fog of War Indicator */}
      {fogOfWar && (
        <div className="absolute top-2 left-2 z-10">
          <div className="px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
            🌫️ Fog of War
          </div>
        </div>
      )}

      {/* Coordinates */}
      {showCoordinates && (
        <GridCoordinates
          width={boardDimensions.width}
          height={boardDimensions.height}
          position="overlay"
          theme="combat"
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

      {/* Targeting Instructions */}
      {isBattlePhase && isActive && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-black bg-opacity-70 text-white text-xs p-2 rounded">
            {targetingState.mode === 'ability'
              ? `${targetingState.selectedAbilityId} selected • Click to target • Escape to cancel`
              : 'Click to attack • Press 1-5 for abilities'
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default OpponentBoard
'use client'

/**
 * GameBoard Component
 *
 * Main game board container component that orchestrates the dual board views
 * for the Battleship Naval Strategy Game. Handles responsive layout switching
 * between desktop side-by-side and mobile stacked/switchable layouts.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { GameCanvasRef } from '../canvas/GameCanvas'
import { PlayerBoard } from './PlayerBoard'
import { OpponentBoard } from './OpponentBoard'
import { BoardSwitcher } from './BoardSwitcher'
import { GameStatus } from './ui/GameStatus'
import { PlacementSidebar } from './ui/PlacementSidebar'
import { BoardLegend } from './ui/BoardLegend'
import { GameStateData, GamePlayer, Coordinate, GamePhaseType } from '../../lib/game/types'
import { colors } from '../../styles/tokens/colors'
import { layout } from '../../styles/tokens/layout'

// =============================================
// TYPES
// =============================================

export interface GameBoardProps {
  /** Game state from Phase 2 engine */
  gameState: GameStateData
  /** Current player ID */
  currentPlayerId: string
  /** Player data for both players */
  players: [GamePlayer, GamePlayer]
  /** Board interaction handlers */
  onCellClick?: (coordinate: Coordinate, boardType: 'player' | 'opponent') => void
  onCellHover?: (coordinate: Coordinate | null, boardType: 'player' | 'opponent') => void
  onShipPlace?: (shipId: string, coordinate: Coordinate, orientation: 'horizontal' | 'vertical') => void
  onShipMove?: (shipId: string, fromCoordinate: Coordinate, toCoordinate: Coordinate) => void
  onAttack?: (coordinate: Coordinate) => void
  onAbilityActivate?: (abilityId: string, targetCoordinate?: Coordinate) => void
  /** UI customization */
  className?: string
  showLegend?: boolean
  showStatus?: boolean
  enableAnimations?: boolean
}

export type BoardViewMode = 'dual' | 'player' | 'opponent'
export type LayoutMode = 'desktop' | 'tablet' | 'mobile'

interface GameBoardState {
  currentBoardView: BoardViewMode
  layoutMode: LayoutMode
  showSidebar: boolean
  playerBoardRef: GameCanvasRef | null
  opponentBoardRef: GameCanvasRef | null
}

// =============================================
// MAIN COMPONENT
// =============================================

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  players,
  onCellClick,
  onCellHover,
  onShipPlace,
  onShipMove,
  onAttack,
  onAbilityActivate,
  className = '',
  showLegend = true,
  showStatus = true,
  enableAnimations = true,
}) => {
  // =============================================
  // STATE AND REFS
  // =============================================

  const [state, setState] = useState<GameBoardState>({
    currentBoardView: 'dual',
    layoutMode: 'desktop',
    showSidebar: true,
    playerBoardRef: null,
    opponentBoardRef: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // =============================================
  // DERIVED STATE
  // =============================================

  const [playerOne, playerTwo] = players
  const currentPlayer = players.find(p => p.id === currentPlayerId) || playerOne
  const opponentPlayer = players.find(p => p.id !== currentPlayerId) || playerTwo

  const gamePhase: GamePhaseType = gameState.phase.current
  const isPlacementPhase = gamePhase === 'ship_placement'
  const isBattlePhase = gamePhase === 'battle'
  const isCurrentPlayerTurn = gameState.currentPlayerId === currentPlayerId

  // =============================================
  // RESPONSIVE LAYOUT DETECTION
  // =============================================

  const updateLayoutMode = useCallback(() => {
    if (!containerRef.current) return

    const width = containerRef.current.offsetWidth
    let newLayoutMode: LayoutMode = 'desktop'

    if (width < parseInt(layout.breakpoints.md)) {
      newLayoutMode = 'mobile'
    } else if (width < parseInt(layout.breakpoints.lg)) {
      newLayoutMode = 'tablet'
    }

    setState(prev => ({ ...prev, layoutMode: newLayoutMode }))
  }, [])

  React.useEffect(() => {
    updateLayoutMode()
    window.addEventListener('resize', updateLayoutMode)
    return () => window.removeEventListener('resize', updateLayoutMode)
  }, [updateLayoutMode])

  // Auto-adjust board view based on layout
  React.useEffect(() => {
    if (state.layoutMode === 'mobile' && state.currentBoardView === 'dual') {
      setState(prev => ({
        ...prev,
        currentBoardView: isPlacementPhase ? 'player' : 'opponent'
      }))
    } else if (state.layoutMode !== 'mobile' && state.currentBoardView !== 'dual') {
      setState(prev => ({ ...prev, currentBoardView: 'dual' }))
    }
  }, [state.layoutMode, isPlacementPhase])

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleBoardSwitch = useCallback((viewMode: BoardViewMode) => {
    setState(prev => ({ ...prev, currentBoardView: viewMode }))
  }, [])

  const handlePlayerCellClick = useCallback((coordinate: Coordinate) => {
    onCellClick?.(coordinate, 'player')
  }, [onCellClick])

  const handleOpponentCellClick = useCallback((coordinate: Coordinate) => {
    onCellClick?.(coordinate, 'opponent')
  }, [onCellClick])

  const handlePlayerCellHover = useCallback((coordinate: Coordinate | null) => {
    onCellHover?.(coordinate, 'player')
  }, [onCellHover])

  const handleOpponentCellHover = useCallback((coordinate: Coordinate | null) => {
    onCellHover?.(coordinate, 'opponent')
  }, [onCellHover])

  const handleSidebarToggle = useCallback(() => {
    setState(prev => ({ ...prev, showSidebar: !prev.showSidebar }))
  }, [])

  const handlePlayerBoardReady = useCallback((canvasRef: GameCanvasRef) => {
    setState(prev => ({ ...prev, playerBoardRef: canvasRef }))
  }, [])

  const handleOpponentBoardReady = useCallback((canvasRef: GameCanvasRef) => {
    setState(prev => ({ ...prev, opponentBoardRef: canvasRef }))
  }, [])

  // =============================================
  // LAYOUT CONFIGURATION
  // =============================================

  const layoutConfig = useMemo(() => {
    const isMobile = state.layoutMode === 'mobile'
    const isTablet = state.layoutMode === 'tablet'
    const showBothBoards = state.currentBoardView === 'dual' && !isMobile

    return {
      containerClass: `game-board-container ${className}`,
      mainGridClass: isMobile
        ? 'flex flex-col h-full'
        : isTablet
        ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 h-full'
        : 'grid grid-cols-2 gap-6 h-full',
      sidebarClass: `${
        state.showSidebar ? 'block' : 'hidden'
      } ${
        isMobile ? 'w-full' : 'w-80'
      }`,
      boardClass: isMobile ? 'flex-1' : 'h-full',
      showBothBoards,
      isMobile,
      isTablet,
    }
  }, [state.layoutMode, state.currentBoardView, state.showSidebar, className])

  // =============================================
  // RENDER HELPERS
  // =============================================

  const renderPlayerBoard = useCallback(() => (
    <PlayerBoard
      key="player-board"
      player={currentPlayer}
      gamePhase={gamePhase}
      isActive={isCurrentPlayerTurn}
      onCellClick={handlePlayerCellClick}
      onCellHover={handlePlayerCellHover}
      onShipPlace={onShipPlace}
      onShipMove={onShipMove}
      onCanvasReady={handlePlayerBoardReady}
      enableAnimations={enableAnimations}
      className={layoutConfig.boardClass}
    />
  ), [
    currentPlayer,
    gamePhase,
    isCurrentPlayerTurn,
    handlePlayerCellClick,
    handlePlayerCellHover,
    onShipPlace,
    onShipMove,
    handlePlayerBoardReady,
    enableAnimations,
    layoutConfig.boardClass
  ])

  const renderOpponentBoard = useCallback(() => (
    <OpponentBoard
      key="opponent-board"
      player={opponentPlayer}
      gamePhase={gamePhase}
      isActive={!isCurrentPlayerTurn && isBattlePhase}
      onCellClick={handleOpponentCellClick}
      onCellHover={handleOpponentCellHover}
      onAttack={onAttack}
      onAbilityActivate={onAbilityActivate}
      onCanvasReady={handleOpponentBoardReady}
      enableAnimations={enableAnimations}
      className={layoutConfig.boardClass}
    />
  ), [
    opponentPlayer,
    gamePhase,
    isCurrentPlayerTurn,
    isBattlePhase,
    handleOpponentCellClick,
    handleOpponentCellHover,
    onAttack,
    onAbilityActivate,
    handleOpponentBoardReady,
    enableAnimations,
    layoutConfig.boardClass
  ])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div
      ref={containerRef}
      className={layoutConfig.containerClass}
      style={{
        minHeight: '600px',
        backgroundColor: colors.surface.primary,
      }}
    >
      {/* Mobile Board Switcher */}
      {layoutConfig.isMobile && (
        <BoardSwitcher
          currentView={state.currentBoardView}
          onViewChange={handleBoardSwitch}
          gamePhase={gamePhase}
          isPlayerTurn={isCurrentPlayerTurn}
          className="mb-4"
        />
      )}

      {/* Main Game Area */}
      <div className="flex h-full">
        {/* Game Boards */}
        <div className={layoutConfig.mainGridClass}>
          {/* Player Board */}
          {(layoutConfig.showBothBoards || state.currentBoardView === 'player') && (
            <div className="game-board-section">
              <div className="board-header mb-2">
                <h3 className="text-lg font-bold text-white">
                  Your Fleet
                </h3>
                {showStatus && (
                  <GameStatus
                    gameState={gameState}
                    currentPlayerId={currentPlayerId}
                    viewMode="player"
                    className="text-sm"
                  />
                )}
              </div>
              {renderPlayerBoard()}
            </div>
          )}

          {/* Opponent Board */}
          {(layoutConfig.showBothBoards || state.currentBoardView === 'opponent') && (
            <div className="game-board-section">
              <div className="board-header mb-2">
                <h3 className="text-lg font-bold text-white">
                  Enemy Waters
                </h3>
                {showStatus && (
                  <GameStatus
                    gameState={gameState}
                    currentPlayerId={currentPlayerId}
                    viewMode="opponent"
                    className="text-sm"
                  />
                )}
              </div>
              {renderOpponentBoard()}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={layoutConfig.sidebarClass}>
          {isPlacementPhase && (
            <PlacementSidebar
              currentPlayer={currentPlayer}
              gameState={gameState}
              onShipSelect={(shipId) => {
                // Handle ship selection for placement
                // eslint-disable-next-line no-console
                console.log('Ship selected:', shipId)
              }}
              onToggle={handleSidebarToggle}
              isOpen={state.showSidebar}
            />
          )}

          {showLegend && (
            <BoardLegend
              gamePhase={gamePhase}
              className="mt-4"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default GameBoard
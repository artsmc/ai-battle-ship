'use client'

/**
 * GameBoardExample Component
 *
 * Example usage and integration test component for the complete game board interface.
 * Demonstrates how to use all TASK-018 components together with Phase 2 game state.
 */

import React, { useState, useCallback, useRef } from 'react'
import { GameBoard } from './GameBoard'
import { GameCanvasRef } from '../canvas/GameCanvas'
import { GameStateData, GamePlayer, Coordinate, GamePhaseType } from '../../lib/game/types'
import { colors } from '../../styles/tokens/colors'

// =============================================
// MOCK DATA FOR TESTING
// =============================================

const createMockGameState = (): GameStateData => ({
  id: 'test-game-123',
  configuration: {
    mode: 'PVP' as any,
    boardWidth: 10,
    boardHeight: 10,
    allowPowerups: true,
    fogOfWar: true,
    allowReconnection: true,
  },
  phase: {
    current: 'ship_placement' as GamePhaseType,
    startedAt: new Date(),
  },
  status: 'SETUP' as any,
  players: [],
  currentPlayerId: 'player-1',
  turnNumber: 1,
  turns: [],
  timers: {
    gameStartTime: new Date(),
    turnStartTime: new Date(),
    totalGameTime: 0,
    currentTurnTime: 30,
    player1TotalTime: 0,
    player2TotalTime: 0,
    isPaused: false,
    totalPauseTime: 0,
  },
  createdAt: new Date(),
})

const createMockPlayer = (id: string, name: string): GamePlayer => ({
  id,
  name,
  isAI: false,
  board: {
    width: 10,
    height: 10,
    cells: Array(10).fill(null).map(() =>
      Array(10).fill(null).map(() => ({
        coordinate: { x: 0, y: 0 },
        hasShip: false,
        isHit: false,
        isRevealed: false,
      }))
    ),
    ships: new Map(),
    hits: [],
    misses: [],
  },
  fleet: [
    {
      id: 'destroyer-1',
      typeId: 'destroyer',
      name: 'USS Swift',
      class: 'DESTROYER' as any,
      size: 2,
      damage: { hitPositions: [], totalHits: 0, isSunk: false },
      hitPoints: 2,
      maxHitPoints: 2,
      abilities: [],
      playerId: id,
    },
    {
      id: 'submarine-1',
      typeId: 'submarine',
      name: 'USS Silent',
      class: 'SUBMARINE' as any,
      size: 3,
      damage: { hitPositions: [], totalHits: 0, isSunk: false },
      hitPoints: 3,
      maxHitPoints: 3,
      abilities: [
        {
          id: 'stealth',
          name: 'Silent Running',
          description: 'Become invisible for 2 turns',
          cooldown: 5,
          currentCooldown: 0,
          uses: 1,
          remainingUses: 1,
          isActive: false,
        }
      ],
      playerId: id,
    },
    {
      id: 'cruiser-1',
      typeId: 'cruiser',
      name: 'USS Storm',
      class: 'CRUISER' as any,
      size: 3,
      damage: { hitPositions: [], totalHits: 0, isSunk: false },
      hitPoints: 3,
      maxHitPoints: 3,
      abilities: [],
      playerId: id,
    },
    {
      id: 'battleship-1',
      typeId: 'battleship',
      name: 'USS Thunder',
      class: 'BATTLESHIP' as any,
      size: 4,
      damage: { hitPositions: [], totalHits: 0, isSunk: false },
      hitPoints: 4,
      maxHitPoints: 4,
      abilities: [],
      playerId: id,
    },
    {
      id: 'carrier-1',
      typeId: 'carrier',
      name: 'USS Eagle',
      class: 'CARRIER' as any,
      size: 5,
      damage: { hitPositions: [], totalHits: 0, isSunk: false },
      hitPoints: 5,
      maxHitPoints: 5,
      abilities: [],
      playerId: id,
    },
  ],
  stats: {
    shotsTotal: 0,
    shotsHit: 0,
    shotsMissed: 0,
    accuracy: 0,
    shipsRemaining: 5,
    shipsSunk: 0,
    damageDealt: 0,
    damageTaken: 0,
  },
  powerups: [],
  isReady: false,
  isActive: true,
  connectionStatus: 'connected' as any,
})

// =============================================
// MAIN EXAMPLE COMPONENT
// =============================================

export const GameBoardExample: React.FC = () => {
  // =============================================
  // STATE
  // =============================================

  const [gameState, setGameState] = useState<GameStateData>(createMockGameState)
  const [players, setPlayers] = useState<[GamePlayer, GamePlayer]>([
    createMockPlayer('player-1', 'Player 1'),
    createMockPlayer('player-2', 'Computer AI'),
  ])
  const [currentPlayerId] = useState('player-1')

  const playerBoardRef = useRef<GameCanvasRef>(null)
  const opponentBoardRef = useRef<GameCanvasRef>(null)

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleCellClick = useCallback((coordinate: Coordinate, boardType: 'player' | 'opponent') => {
    console.log(`Cell clicked: ${coordinate.x},${coordinate.y} on ${boardType} board`)
  }, [])

  const handleCellHover = useCallback((coordinate: Coordinate | null, boardType: 'player' | 'opponent') => {
    if (coordinate) {
      console.log(`Cell hovered: ${coordinate.x},${coordinate.y} on ${boardType} board`)
    }
  }, [])

  const handleShipPlace = useCallback((
    shipId: string,
    coordinate: Coordinate,
    orientation: 'horizontal' | 'vertical'
  ) => {
    console.log(`Ship ${shipId} placed at ${coordinate.x},${coordinate.y} ${orientation}`)

    // Update the ship position in the player's fleet
    setPlayers(prev => {
      const newPlayers = [...prev] as [GamePlayer, GamePlayer]
      const playerIndex = newPlayers.findIndex(p => p.id === currentPlayerId)

      if (playerIndex >= 0) {
        const player = { ...newPlayers[playerIndex] }
        player.fleet = player.fleet.map(ship => {
          if (ship.id === shipId) {
            const positions = []
            for (let i = 0; i < ship.size; i++) {
              positions.push({
                x: orientation === 'horizontal' ? coordinate.x + i : coordinate.x,
                y: orientation === 'vertical' ? coordinate.y + i : coordinate.y,
              })
            }
            return {
              ...ship,
              position: {
                shipId: ship.id,
                coordinates: positions,
                orientation,
                startPosition: coordinate,
              }
            }
          }
          return ship
        })
        newPlayers[playerIndex] = player
      }

      return newPlayers
    })
  }, [currentPlayerId])

  const handleShipMove = useCallback((
    shipId: string,
    fromCoordinate: Coordinate,
    toCoordinate: Coordinate
  ) => {
    console.log(`Ship ${shipId} moved from ${fromCoordinate.x},${fromCoordinate.y} to ${toCoordinate.x},${toCoordinate.y}`)
  }, [])

  const handleAttack = useCallback((coordinate: Coordinate) => {
    console.log(`Attack launched at ${coordinate.x},${coordinate.y}`)
  }, [])

  const handleAbilityActivate = useCallback((abilityId: string, targetCoordinate?: Coordinate) => {
    console.log(`Ability ${abilityId} activated${targetCoordinate ? ` at ${targetCoordinate.x},${targetCoordinate.y}` : ''}`)
  }, [])

  // =============================================
  // PHASE SWITCHING FOR TESTING
  // =============================================

  const switchToPhase = useCallback((phase: GamePhaseType) => {
    setGameState(prev => ({
      ...prev,
      phase: {
        ...prev.phase,
        current: phase,
      }
    }))
  }, [])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div
      className="game-board-example"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: colors.surface.primary,
        color: colors.text.primary,
        overflow: 'hidden',
      }}
    >
      {/* Test Controls */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 100,
          display: 'flex',
          gap: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '12px',
          borderRadius: '8px',
        }}
      >
        <button
          onClick={() => switchToPhase('ship_placement')}
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.phase.current === 'ship_placement' ? colors.primary.DEFAULT : colors.surface.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Placement
        </button>
        <button
          onClick={() => switchToPhase('battle')}
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.phase.current === 'battle' ? colors.primary.DEFAULT : colors.surface.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Battle
        </button>
        <button
          onClick={() => switchToPhase('finished')}
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.phase.current === 'finished' ? colors.primary.DEFAULT : colors.surface.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Finished
        </button>
      </div>

      {/* Main Game Board */}
      <GameBoard
        gameState={gameState}
        currentPlayerId={currentPlayerId}
        players={players}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
        onShipPlace={handleShipPlace}
        onShipMove={handleShipMove}
        onAttack={handleAttack}
        onAbilityActivate={handleAbilityActivate}
        showLegend={true}
        showStatus={true}
        enableAnimations={true}
        className="w-full h-full"
      />

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
        }}
      >
        <div className="font-semibold mb-2">TASK-018 Game Board Interface Demo</div>
        <div className="space-y-1">
          <div>• Use buttons above to switch game phases</div>
          <div>• Resize window to test responsive layout</div>
          <div>• Check console for interaction logs</div>
          <div>• All Phase 1-3 components integrated</div>
        </div>
      </div>
    </div>
  )
}

export default GameBoardExample
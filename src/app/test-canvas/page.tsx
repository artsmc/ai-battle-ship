'use client'

/**
 * Canvas System Test Page
 *
 * Simple test page to verify the Konva.js canvas system integration.
 * Tests basic rendering, responsiveness, and event handling.
 */

import React, { useState, useRef } from 'react'
import { GameCanvas, CanvasGrid, GameCanvasRef } from '../../components/canvas'
import { Coordinate, BoardState, BoardCell } from '../../lib/game/types'
import { DEFAULTS } from '../../lib/game/utils/constants'

// Create a simple mock board state for testing
const createMockBoardState = (width: number, height: number): BoardState => {
  const cells: BoardCell[][] = []

  for (let y = 0; y < height; y++) {
    const row: BoardCell[] = []
    for (let x = 0; x < width; x++) {
      row.push({
        coordinate: { x, y },
        hasShip: false,
        isHit: false,
        isRevealed: true,
      })
    }
    cells.push(row)
  }

  // Add some test ships and hits
  if (cells[2]) {
    cells[2][1] = { coordinate: { x: 1, y: 2 }, hasShip: true, isHit: false, isRevealed: true, shipId: 'ship-1' }
    cells[2][2] = { coordinate: { x: 2, y: 2 }, hasShip: true, isHit: true, isRevealed: true, shipId: 'ship-1' }
    cells[2][3] = { coordinate: { x: 3, y: 2 }, hasShip: true, isHit: false, isRevealed: true, shipId: 'ship-1' }
  }

  if (cells[5]) {
    cells[5][7] = { coordinate: { x: 7, y: 5 }, hasShip: false, isHit: true, isRevealed: true }
    cells[6][7] = { coordinate: { x: 7, y: 6 }, hasShip: false, isHit: true, isRevealed: true }
  }

  return {
    width,
    height,
    cells,
    ships: new Map([
      ['ship-1', {
        shipId: 'ship-1',
        coordinates: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
        orientation: 'horizontal',
        startPosition: { x: 1, y: 2 },
      }]
    ]),
    hits: [{ x: 2, y: 2 }, { x: 7, y: 5 }, { x: 7, y: 6 }],
    misses: [{ x: 7, y: 5 }, { x: 7, y: 6 }],
  }
}

export default function TestCanvasPage() {
  const [boardWidth] = useState(DEFAULTS.BOARD_WIDTH)
  const [boardHeight] = useState(DEFAULTS.BOARD_HEIGHT)
  const [boardState] = useState(() => createMockBoardState(boardWidth, boardHeight))
  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null)
  const [selectedCells, setSelectedCells] = useState<Coordinate[]>([])
  const [clickedCell, setClickedCell] = useState<Coordinate | null>(null)

  const canvasRef = useRef<GameCanvasRef>(null)

  const handleCellClick = (coordinate: Coordinate) => {
    setClickedCell(coordinate)

    // Toggle selection
    setSelectedCells(prev => {
      const isSelected = prev.some(c => c.x === coordinate.x && c.y === coordinate.y)
      if (isSelected) {
        return prev.filter(c => !(c.x === coordinate.x && c.y === coordinate.y))
      } else {
        return [...prev, coordinate]
      }
    })
  }

  const handleCellHover = (coordinate: Coordinate | null) => {
    setHoveredCell(coordinate)
  }

  const handleCellDoubleClick = (_coordinate: Coordinate) => {
    // Center on the clicked cell
    if (canvasRef.current) {
      canvasRef.current.centerBoard()
    }
  }

  const handleCanvasReady = (canvas: GameCanvasRef) => {
    // Initial fit to canvas
    canvas.fitToCanvas()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Canvas System Test
        </h1>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Canvas Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => canvasRef.current?.centerBoard()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Center Board
            </button>
            <button
              onClick={() => canvasRef.current?.fitToCanvas()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Fit to Canvas
            </button>
            <button
              onClick={() => canvasRef.current?.setScale(1.5)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Zoom In
            </button>
            <button
              onClick={() => canvasRef.current?.setScale(0.75)}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Zoom Out
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Hovered Cell:</strong>{' '}
              {hoveredCell ? `${hoveredCell.x}, ${hoveredCell.y}` : 'None'}
            </div>
            <div>
              <strong>Last Clicked:</strong>{' '}
              {clickedCell ? `${clickedCell.x}, ${clickedCell.y}` : 'None'}
            </div>
            <div>
              <strong>Selected Cells:</strong>{' '}
              {selectedCells.length}
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Game Canvas</h2>
          <div className="w-full h-96 border-2 border-gray-200 rounded-lg overflow-hidden">
            <GameCanvas
              ref={canvasRef}
              boardState={boardState}
              boardWidth={boardWidth}
              boardHeight={boardHeight}
              onCellClick={handleCellClick}
              onCellHover={handleCellHover}
              onCellDoubleClick={handleCellDoubleClick}
              onCanvasReady={handleCanvasReady}
              enableAnimations={true}
              enableEffects={true}
              showGrid={true}
              showCoordinates={true}
            >
              <CanvasGrid
                boardState={boardState}
                boardWidth={boardWidth}
                boardHeight={boardHeight}
                showGrid={true}
                showCoordinates={true}
                showCellStates={true}
                hoveredCell={hoveredCell}
                selectedCells={selectedCells}
              />
            </GameCanvas>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click on grid cells to select/deselect them</li>
              <li>Hover over cells to see highlighting</li>
              <li>Double-click to center the board</li>
              <li>Use mouse wheel to zoom in/out</li>
              <li>Use the control buttons above to test canvas functions</li>
              <li>The grid shows mock ship data with hits and misses</li>
            </ul>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-800 text-gray-200 p-4 rounded-lg text-xs">
            <h3 className="font-semibold mb-2">Debug Info</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({
                boardDimensions: { width: boardWidth, height: boardHeight },
                hoveredCell,
                selectedCells,
                clickedCell,
                shipCount: boardState.ships.size,
                hitCount: boardState.hits.length,
                missCount: boardState.misses.length,
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
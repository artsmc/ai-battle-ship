/**
 * Keyboard Navigation Grid Component
 * Accessible grid overlay for keyboard navigation
 *
 * Part of TASK 5: Konva.js Interactions
 * Full keyboard navigation support for accessibility
 */

'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Cell } from '../../lib/placement'
import { PlacementState } from '../../lib/placement/stateMachine'

// =============================================
// COMPONENT INTERFACE
// =============================================

export interface KeyboardNavigationGridProps {
  placementState: PlacementState
  onCellActivate: (cell: Cell) => void
  onFocusChange: (cell: Cell) => void
  gridSize?: number
  cellSize?: number
  className?: string
}

// =============================================
// KEYBOARD NAVIGATION GRID
// =============================================

export const KeyboardNavigationGrid: React.FC<KeyboardNavigationGridProps> = React.memo(({
  placementState,
  onCellActivate,
  onFocusChange,
  gridSize = 10,
  cellSize = 40,
  className = ''
}) => {
  const [focusedCell, setFocusedCell] = useState<Cell>({ x: 0, y: 0 })
  const [isGridFocused, setIsGridFocused] = useState(false)

  // =============================================
  // KEYBOARD EVENT HANDLING
  // =============================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isGridFocused) return

    let handled = false
    const { x, y } = focusedCell

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault()
        if (y > 0) {
          const newCell = { x, y: y - 1 }
          setFocusedCell(newCell)
          onFocusChange(newCell)
        }
        handled = true
        break

      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault()
        if (y < gridSize - 1) {
          const newCell = { x, y: y + 1 }
          setFocusedCell(newCell)
          onFocusChange(newCell)
        }
        handled = true
        break

      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault()
        if (x > 0) {
          const newCell = { x: x - 1, y }
          setFocusedCell(newCell)
          onFocusChange(newCell)
        }
        handled = true
        break

      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault()
        if (x < gridSize - 1) {
          const newCell = { x: x + 1, y }
          setFocusedCell(newCell)
          onFocusChange(newCell)
        }
        handled = true
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        onCellActivate(focusedCell)
        handled = true
        break

      case 'Home':
        event.preventDefault()
        setFocusedCell({ x: 0, y: 0 })
        onFocusChange({ x: 0, y: 0 })
        handled = true
        break

      case 'End':
        event.preventDefault()
        const endCell = { x: gridSize - 1, y: gridSize - 1 }
        setFocusedCell(endCell)
        onFocusChange(endCell)
        handled = true
        break
    }

    return handled
  }, [isGridFocused, focusedCell, gridSize, onCellActivate, onFocusChange])

  // =============================================
  // FOCUS MANAGEMENT
  // =============================================

  const handleGridFocus = useCallback(() => {
    setIsGridFocused(true)
  }, [])

  const handleGridBlur = useCallback(() => {
    setIsGridFocused(false)
  }, [])

  // =============================================
  // KEYBOARD LISTENER
  // =============================================

  useEffect(() => {
    if (isGridFocused) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isGridFocused, handleKeyDown])

  // =============================================
  // RENDER ACCESSIBLE GRID
  // =============================================

  const getAriaLabel = useCallback((cell: Cell): string => {
    const ship = placementState.placedShips.find(ship =>
      ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
    )

    if (ship) {
      const shipKind = ship.id.split('_')[0]
      return `Grid ${cell.x}, ${cell.y}. Occupied by ${shipKind}. Press Enter to edit.`
    }

    const isPreview = placementState.preview?.cells.some(previewCell =>
      previewCell.x === cell.x && previewCell.y === cell.y
    )

    if (isPreview) {
      const isValid = placementState.preview?.isValid
      return `Grid ${cell.x}, ${cell.y}. ${isValid ? 'Valid' : 'Invalid'} placement preview. ${
        isValid ? 'Press Enter to place ship.' : placementState.preview?.reason || 'Cannot place here.'
      }`
    }

    return `Grid ${cell.x}, ${cell.y}. Empty. ${
      placementState.selectedShipKind
        ? 'Press Enter to place selected ship.'
        : 'Select a ship first.'
    }`
  }, [placementState])

  const getCellClassName = useCallback((cell: Cell): string => {
    const isFocused = focusedCell.x === cell.x && focusedCell.y === cell.y && isGridFocused
    const ship = placementState.placedShips.find(ship =>
      ship.cells.some(shipCell => shipCell.x === cell.x && shipCell.y === cell.y)
    )
    const isPreview = placementState.preview?.cells.some(previewCell =>
      previewCell.x === cell.x && previewCell.y === cell.y
    )

    let className = 'absolute transition-all duration-200 border-2 border-transparent'

    if (isFocused) {
      className += ' border-yellow-400 bg-yellow-400/20 z-10'
    } else if (ship) {
      className += ' border-white/30'
    } else if (isPreview) {
      className += placementState.preview?.isValid
        ? ' border-green-400/50'
        : ' border-red-400/50'
    }

    return className
  }, [focusedCell, isGridFocused, placementState])

  return (
    <div
      className={`keyboard-navigation-grid ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: gridSize * cellSize,
        height: gridSize * cellSize,
        pointerEvents: 'none' // Allow mouse events to pass through
      }}
    >
      {/* Grid accessibility overlay */}
      <div
        role="grid"
        aria-label="Ship placement grid. Use arrow keys to navigate, Enter to place ships."
        tabIndex={0}
        onFocus={handleGridFocus}
        onBlur={handleGridBlur}
        className="w-full h-full outline-none"
        style={{ position: 'relative' }}
      >
        {Array.from({ length: gridSize }).map((_, y) =>
          Array.from({ length: gridSize }).map((_, x) => {
            const cell = { x, y }
            const isFocused = focusedCell.x === x && focusedCell.y === y && isGridFocused

            return (
              <div
                key={`nav-${x}-${y}`}
                role="gridcell"
                aria-label={getAriaLabel(cell)}
                tabIndex={isFocused ? 0 : -1}
                className={getCellClassName(cell)}
                style={{
                  left: x * cellSize,
                  top: y * cellSize,
                  width: cellSize,
                  height: cellSize
                }}
                onClick={() => {
                  setFocusedCell(cell)
                  onFocusChange(cell)
                  onCellActivate(cell)
                }}
              />
            )
          })
        )}

        {/* Focus indicator */}
        {isGridFocused && (
          <div
            className="absolute border-4 border-yellow-400 bg-yellow-400/10 pointer-events-none animate-pulse"
            style={{
              left: focusedCell.x * cellSize - 2,
              top: focusedCell.y * cellSize - 2,
              width: cellSize + 4,
              height: cellSize + 4,
              borderRadius: '4px'
            }}
          />
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        Use arrow keys or WASD to navigate. Enter or Space to activate.
        Press R to rotate, Escape to cancel, Delete to remove ships.
        Numbers 1-5 to select ship types.
      </div>
    </div>
  )
})

KeyboardNavigationGrid.displayName = 'KeyboardNavigationGrid'
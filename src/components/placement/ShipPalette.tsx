/**
 * Ship Palette Component
 * Enhanced ship selection interface with visual representations
 *
 * Part of TASK 4: Ship Palette & Controls
 * Advanced ship selection with visual ship representations and controls
 */

'use client'

import React, { useCallback, useState } from 'react'
import {
  ArrowPathIcon,
  TrashIcon,
  SparklesIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  ShipKind,
  ShipSpec,
  SHIP_SPECS
} from '../../lib/placement/stateMachine'

// =============================================
// COMPONENT INTERFACE
// =============================================

export interface ShipPaletteProps {
  availableShips: Map<ShipKind, number>
  selectedShip?: ShipKind
  onShipSelect: (kind: ShipKind) => void
  onRotate?: () => void
  onAutoPlace?: () => void
  onClearAll?: () => void
  onConfirmFleet?: () => void
  isFleetComplete?: boolean
  canRotate?: boolean
  placementScore?: number
  placementGrade?: 'A' | 'B' | 'C' | 'D'
  className?: string
}

// =============================================
// VISUAL SHIP REPRESENTATION
// =============================================

interface ShipVisualizationProps {
  spec: ShipSpec
  isSelected: boolean
}

const ShipVisualization: React.FC<ShipVisualizationProps> = React.memo(({
  spec,
  isSelected
}) => {
  const getShipColor = (kind: ShipKind) => {
    const colors = {
      carrier: '#1e40af',     // blue-800
      battleship: '#7c2d12',  // red-800
      cruiser: '#166534',     // green-800
      submarine: '#a21caf',   // purple-700
      destroyer: '#ea580c'    // orange-600
    }
    return colors[kind]
  }

  const shipColor = getShipColor(spec.kind)

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Visual ship representation */}
      <div className="flex space-x-1">
        {Array.from({ length: spec.length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-sm border transition-all duration-200 ${
              isSelected
                ? 'border-white border-2'
                : 'border-neutral-600'
            }`}
            style={{
              backgroundColor: shipColor,
              boxShadow: isSelected ? `0 0 8px ${shipColor}` : 'none'
            }}
          />
        ))}
      </div>

      {/* Ship type icon/indicator */}
      <div className="text-xs text-center">
        <div className="text-white font-medium">{spec.name}</div>
        <div className="text-neutral-400">{spec.length} cells</div>
      </div>
    </div>
  )
})

ShipVisualization.displayName = 'ShipVisualization'

// =============================================
// ENHANCED SHIP CARD COMPONENT
// =============================================

interface ShipCardProps {
  spec: ShipSpec
  available: number
  isSelected: boolean
  onClick: () => void
  shortcutKey?: string
}

const ShipCard: React.FC<ShipCardProps> = React.memo(({
  spec,
  available,
  isSelected,
  onClick,
  shortcutKey
}) => {
  const canSelect = available > 0

  return (
    <button
      onClick={onClick}
      disabled={!canSelect}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 text-left w-full
        ${isSelected
          ? 'border-primary-500 bg-primary-900/20 shadow-lg'
          : canSelect
          ? 'border-neutral-600 bg-surface-primary hover:border-primary-400 hover:shadow-md'
          : 'border-neutral-700 bg-neutral-800/50 opacity-50 cursor-not-allowed'
        }
      `}
      aria-label={`${spec.name} - ${spec.length} cells - ${available} remaining${shortcutKey ? ` - Press ${shortcutKey}` : ''}`}
    >
      {/* Keyboard shortcut indicator */}
      {shortcutKey && canSelect && (
        <div className="absolute top-2 right-2">
          <kbd className="px-1.5 py-0.5 text-xs bg-neutral-800 text-neutral-300 rounded border border-neutral-600">
            {shortcutKey}
          </kbd>
        </div>
      )}

      {/* Availability indicator */}
      <div className="absolute top-2 left-2">
        <div className={`w-3 h-3 rounded-full ${
          available > 0 ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </div>

      {/* Ship visualization */}
      <div className="mt-4 mb-3">
        <ShipVisualization spec={spec} isSelected={isSelected} />
      </div>

      {/* Ship information */}
      <div className="text-center">
        <div className={`text-sm font-medium ${
          canSelect ? 'text-white' : 'text-neutral-500'
        }`}>
          Remaining: {available}
        </div>
        {available === 0 && (
          <div className="text-xs text-red-400 mt-1">
            ✓ Placed
          </div>
        )}
      </div>
    </button>
  )
})

ShipCard.displayName = 'ShipCard'

// =============================================
// MAIN PALETTE COMPONENT
// =============================================

export const ShipPalette: React.FC<ShipPaletteProps> = React.memo(({
  availableShips,
  selectedShip,
  onShipSelect,
  onAutoPlace,
  onClearAll,
  className = ''
}) => {
  const handleShipSelect = useCallback((kind: ShipKind) => {
    onShipSelect(kind)
  }, [onShipSelect])

  const totalRemaining = Array.from(availableShips.values()).reduce((sum, count) => sum + count, 0)
  const hasSelection = !!selectedShip

  return (
    <div className={`ship-palette ${className}`}>
      <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Fleet Selection</h2>

        {/* Ship Cards */}
        <div className="space-y-3 mb-6">
          {Object.values(SHIP_SPECS).map(spec => (
            <ShipCard
              key={spec.kind}
              spec={spec}
              available={availableShips.get(spec.kind) || 0}
              isSelected={selectedShip === spec.kind}
              onClick={() => handleShipSelect(spec.kind)}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="space-y-2">
          <button
            onClick={onAutoPlace}
            disabled={totalRemaining === 0}
            className="w-full btn btn-secondary btn-sm"
          >
            Auto-Place Remaining ({totalRemaining})
          </button>

          <button
            onClick={onClearAll}
            disabled={availableShips.size === 0}
            className="w-full btn btn-ghost btn-sm text-red-400 hover:bg-red-900/20"
          >
            Clear All Ships
          </button>
        </div>

        {/* Status Display */}
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <div className="text-sm text-neutral-400">
            Ships Remaining: <span className="text-white font-medium">{totalRemaining}</span>
          </div>
          {hasSelection && (
            <div className="text-sm text-primary-400 mt-1">
              Selected: {SHIP_SPECS[selectedShip!].name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ShipPalette.displayName = 'ShipPalette'
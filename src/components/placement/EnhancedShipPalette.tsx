/**
 * Enhanced Ship Palette Component
 * Advanced ship selection interface with visual representations and controls
 *
 * Part of TASK 4: Ship Palette & Controls
 * Complete implementation with visual ship representations, keyboard shortcuts, and confirmations
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

export interface EnhancedShipPaletteProps {
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
  orientation?: 'horizontal' | 'vertical'
}

const ShipVisualization: React.FC<ShipVisualizationProps> = React.memo(({
  spec,
  isSelected,
  orientation = 'horizontal'
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
  const isHorizontal = orientation === 'horizontal'

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Visual ship representation */}
      <div className={`flex ${isHorizontal ? 'flex-row space-x-1' : 'flex-col space-y-1'}`}>
        {Array.from({ length: spec.length }).map((_, i) => (
          <div
            key={i}
            className={`${isHorizontal ? 'w-5 h-4' : 'w-4 h-5'} rounded-sm border transition-all duration-200 ${
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

      {/* Ship type label */}
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

interface EnhancedShipCardProps {
  spec: ShipSpec
  available: number
  isSelected: boolean
  onClick: () => void
  shortcutKey?: string
}

const EnhancedShipCard: React.FC<EnhancedShipCardProps> = React.memo(({
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
        relative p-4 rounded-lg border-2 transition-all duration-200 text-left w-full min-h-[120px]
        ${isSelected
          ? 'border-primary-500 bg-primary-900/20 shadow-lg scale-[1.02]'
          : canSelect
          ? 'border-neutral-600 bg-surface-primary hover:border-primary-400 hover:shadow-md hover:scale-[1.01]'
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
      <div className="mt-6 mb-4">
        <ShipVisualization spec={spec} isSelected={isSelected} />
      </div>

      {/* Ship information */}
      <div className="text-center">
        <div className={`text-sm font-medium ${
          canSelect ? 'text-white' : 'text-neutral-500'
        }`}>
          Available: {available}
        </div>
        {available === 0 && (
          <div className="text-xs text-green-400 mt-1 flex items-center justify-center space-x-1">
            <CheckIcon className="w-3 h-3" />
            <span>Deployed</span>
          </div>
        )}
      </div>
    </button>
  )
})

EnhancedShipCard.displayName = 'EnhancedShipCard'

// =============================================
// CONFIRMATION DIALOG COMPONENT
// =============================================

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = React.memo(({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-neutral-300 mb-6">{message}</p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 btn btn-secondary btn-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 btn btn-sm ${
              isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
})

ConfirmationDialog.displayName = 'ConfirmationDialog'

// =============================================
// MAIN ENHANCED PALETTE COMPONENT
// =============================================

export const EnhancedShipPalette: React.FC<EnhancedShipPaletteProps> = React.memo(({
  availableShips,
  selectedShip,
  onShipSelect,
  onRotate,
  onAutoPlace,
  onClearAll,
  onConfirmFleet,
  isFleetComplete = false,
  canRotate = false,
  placementScore = 0,
  placementGrade = 'D',
  className = ''
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleShipSelect = useCallback((kind: ShipKind) => {
    onShipSelect(kind)
  }, [onShipSelect])

  const handleClearAll = useCallback(() => {
    setShowClearConfirm(true)
  }, [])

  const confirmClearAll = useCallback(() => {
    onClearAll?.()
    setShowClearConfirm(false)
  }, [onClearAll])

  const totalRemaining = Array.from(availableShips.values()).reduce((sum, count) => sum + count, 0)
  const totalPlaced = 5 - totalRemaining
  const hasShipsPlaced = totalPlaced > 0

  // Keyboard shortcuts mapping
  const shortcutKeys = ['1', '2', '3', '4', '5']

  return (
    <div className={`enhanced-ship-palette ${className}`}>
      <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6 space-y-6">
        {/* Header with fleet status */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Fleet Command</h2>
          {hasShipsPlaced && (
            <div className="text-right">
              <div className={`text-lg font-bold ${
                placementGrade === 'A' ? 'text-green-400' :
                placementGrade === 'B' ? 'text-blue-400' :
                placementGrade === 'C' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                Grade: {placementGrade}
              </div>
              <div className="text-sm text-neutral-400">
                Strategy Score: {placementScore}/100
              </div>
            </div>
          )}
        </div>

        {/* Fleet Status Bar */}
        <div className="bg-surface-primary rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-400">Fleet Deployment</span>
            <span className="text-sm text-white font-medium">{totalPlaced}/5 Ships</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(totalPlaced / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Ship Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.values(SHIP_SPECS).map((spec, index) => (
            <EnhancedShipCard
              key={spec.kind}
              spec={spec}
              available={availableShips.get(spec.kind) || 0}
              isSelected={selectedShip === spec.kind}
              onClick={() => handleShipSelect(spec.kind)}
              shortcutKey={shortcutKeys[index]}
            />
          ))}
        </div>

        {/* Control Panel */}
        <div className="space-y-3">
          {/* Rotate Button (only show when applicable) */}
          {canRotate && selectedShip && (
            <button
              onClick={onRotate}
              className="w-full btn btn-secondary btn-sm flex items-center justify-center space-x-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Rotate Ship (R)</span>
            </button>
          )}

          {/* Auto-Place Button */}
          <button
            onClick={onAutoPlace}
            disabled={totalRemaining === 0}
            className="w-full btn btn-secondary btn-sm flex items-center justify-center space-x-2"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Auto-Deploy Remaining ({totalRemaining})</span>
          </button>

          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            disabled={!hasShipsPlaced}
            className="w-full btn btn-ghost btn-sm text-red-400 hover:bg-red-900/20 flex items-center justify-center space-x-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Clear All Ships</span>
          </button>

          {/* Confirm Fleet Button */}
          {isFleetComplete && onConfirmFleet && (
            <button
              onClick={onConfirmFleet}
              className="w-full btn btn-primary btn-lg flex items-center justify-center space-x-2 animate-pulse"
            >
              <CheckIcon className="w-5 h-5" />
              <span>Confirm Fleet Deployment</span>
            </button>
          )}
        </div>

        {/* Fleet Status Summary */}
        <div className="pt-4 border-t border-neutral-700">
          {isFleetComplete ? (
            <div className="p-3 bg-green-900/20 border border-green-500 rounded-lg flex items-center space-x-2">
              <CheckIcon className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-green-300 font-medium">Fleet Ready for Battle!</div>
                <div className="text-green-400 text-sm">All ships deployed with {placementGrade} grade strategy</div>
              </div>
            </div>
          ) : totalPlaced > 0 ? (
            <div className="p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-yellow-300 font-medium">Deployment in Progress</div>
                <div className="text-yellow-400 text-sm">
                  {totalRemaining} ship{totalRemaining !== 1 ? 's' : ''} remaining to deploy
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-900/20 border border-blue-500 rounded-lg text-center">
              <div className="text-blue-300 font-medium">Begin Fleet Deployment</div>
              <div className="text-blue-400 text-sm">Select a ship type to start positioning your fleet</div>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts help */}
        <div className="pt-4 border-t border-neutral-700">
          <div className="text-xs text-neutral-500">
            <div className="font-medium mb-2">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>1-5: Select ships</div>
              <div>R: Rotate</div>
              <div>Esc: Cancel</div>
              <div>Del: Remove</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearConfirm}
        title="Clear All Ships"
        message="Remove all deployed ships from the board? This action cannot be undone and you will need to redeploy your entire fleet."
        confirmText="Clear Fleet"
        cancelText="Keep Ships"
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
        isDestructive={true}
      />
    </div>
  )
})

EnhancedShipPalette.displayName = 'EnhancedShipPalette'
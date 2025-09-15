'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameStateData, GamePlayer, PlayerTurn, GameAction, AttackAction } from '@/lib/game/types'

interface MoveHistoryProps {
  gameState: GameStateData
  currentPlayer?: GamePlayer
  isPlayerTurn: boolean
  onAction?: (action: string, data?: any) => void
}

interface MoveEntry {
  id: string
  turnNumber: number
  playerName: string
  playerId: string
  action: GameAction
  timestamp: Date
  result?: any
  isImportant: boolean
}

interface FilterOptions {
  player: 'all' | string
  actionType: 'all' | 'attack' | 'place_ship' | 'use_powerup' | 'surrender'
  showOnlyImportant: boolean
}

export function MoveHistory({
  gameState,
  currentPlayer,
  isPlayerTurn,
  onAction
}: MoveHistoryProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    player: 'all',
    actionType: 'all',
    showOnlyImportant: false
  })

  // Convert turns and actions to move entries
  const moveEntries = useMemo(() => {
    const entries: MoveEntry[] = []

    gameState.turns.forEach((turn, turnIndex) => {
      const player = gameState.players.find(p => p.id === turn.playerId)
      if (!player) return

      turn.actions.forEach((action, actionIndex) => {
        const isImportant = action.type === 'surrender' ||
          (action.type === 'attack' && (action.data as AttackAction).result?.shipSunk) ||
          action.type === 'use_powerup'

        entries.push({
          id: `${turn.turnNumber}-${actionIndex}`,
          turnNumber: turn.turnNumber,
          playerName: player.name,
          playerId: player.id,
          action,
          timestamp: action.timestamp,
          result: (action.data as AttackAction).result,
          isImportant
        })
      })
    })

    return entries.reverse() // Show most recent first
  }, [gameState.turns, gameState.players])

  // Apply filters
  const filteredEntries = useMemo(() => {
    return moveEntries.filter(entry => {
      if (filters.player !== 'all' && entry.playerId !== filters.player) return false
      if (filters.actionType !== 'all' && entry.action.type !== filters.actionType) return false
      if (filters.showOnlyImportant && !entry.isImportant) return false
      return true
    })
  }, [moveEntries, filters])

  const formatCoordinate = (x: number, y: number): string => {
    return `${String.fromCharCode(65 + x)}${y + 1}`
  }

  const getActionIcon = (actionType: string): string => {
    const icons = {
      attack: '💥',
      place_ship: '🚢',
      use_powerup: '⚡',
      surrender: '🏳️',
      timeout: '⏰'
    }
    return icons[actionType as keyof typeof icons] || '❓'
  }

  const getResultColor = (result?: any): string => {
    if (!result) return 'text-steel-400'
    switch (result.result) {
      case 'hit':
        return result.shipSunk ? 'text-red-400' : 'text-orange-400'
      case 'miss':
        return 'text-blue-400'
      default:
        return 'text-steel-400'
    }
  }

  const getResultText = (action: GameAction): string => {
    switch (action.type) {
      case 'attack':
        const attackData = action.data as AttackAction
        const coord = formatCoordinate(attackData.targetCoordinate.x, attackData.targetCoordinate.y)
        if (!attackData.result) return `Attack ${coord}`

        const result = attackData.result.result
        if (result === 'hit') {
          return attackData.result.shipSunk
            ? `${coord} - SUNK ${attackData.result.shipType}!`
            : `${coord} - HIT`
        }
        return `${coord} - MISS`

      case 'place_ship':
        return 'Placed ship'

      case 'use_powerup':
        return 'Used powerup'

      case 'surrender':
        return 'Surrendered'

      default:
        return action.type.replace('_', ' ')
    }
  }

  const MoveEntry = ({ entry }: { entry: MoveEntry }) => (
    <motion.div
      className={`
        p-3 rounded-lg border transition-all duration-200
        ${entry.isImportant
          ? 'bg-orange-900/20 border-orange-500/50'
          : 'bg-navy-800/50 border-steel-600'
        }
        hover:bg-navy-700/50 cursor-pointer
      `}
      onClick={() => setSelectedTurn(entry.turnNumber)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getActionIcon(entry.action.type)}</span>
          <div>
            <div className="text-sm font-medium text-white">
              Turn {entry.turnNumber} - {entry.playerName}
            </div>
            <div className="text-xs text-steel-400">
              {entry.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {entry.isImportant && (
          <div className="px-2 py-1 bg-orange-900/30 text-orange-300 text-xs rounded-full border border-orange-500">
            Important
          </div>
        )}
      </div>

      <div className={`text-sm ${getResultColor(entry.result)}`}>
        {getResultText(entry.action)}
      </div>

      {entry.result && entry.action.type === 'attack' && (
        <div className="mt-2 text-xs text-steel-500">
          Damage: {entry.result.damageDealt || 0}
        </div>
      )}
    </motion.div>
  )

  const TurnDetail = ({ turnNumber }: { turnNumber: number }) => {
    const turn = gameState.turns.find(t => t.turnNumber === turnNumber)
    const player = turn ? gameState.players.find(p => p.id === turn.playerId) : null

    if (!turn || !player) return null

    return (
      <motion.div
        className="p-4 bg-ocean-900/20 border border-ocean-500 rounded-lg"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-ocean-300">
            Turn {turn.turnNumber} Details
          </h3>
          <button
            onClick={() => setSelectedTurn(null)}
            className="text-steel-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-steel-400">Player:</span>
            <span className="text-white ml-2">{player.name}</span>
          </div>
          <div>
            <span className="text-steel-400">Start Time:</span>
            <span className="text-white ml-2">{turn.startTime.toLocaleTimeString()}</span>
          </div>
          <div>
            <span className="text-steel-400">Actions:</span>
            <span className="text-white ml-2">{turn.actions.length}</span>
          </div>
          <div>
            <span className="text-steel-400">Duration:</span>
            <span className="text-white ml-2">
              {turn.timeUsed ? `${(turn.timeUsed / 1000).toFixed(1)}s` : 'Ongoing'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-steel-300 font-medium">Actions:</h4>
          {turn.actions.map((action, index) => (
            <div key={index} className="p-2 bg-navy-800/50 rounded border border-steel-600">
              <div className="flex items-center space-x-2 text-sm">
                <span>{getActionIcon(action.type)}</span>
                <span className="text-white">{getResultText(action)}</span>
              </div>
            </div>
          ))}
        </div>

        {onAction && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => onAction('replay_turn', { turnNumber })}
              className="
                px-3 py-1 bg-ocean-600 hover:bg-ocean-500 text-white
                rounded text-sm transition-colors duration-200
              "
            >
              Replay Turn
            </button>
            <button
              onClick={() => onAction('analyze_turn', { turnNumber })}
              className="
                px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white
                rounded text-sm transition-colors duration-200
              "
            >
              Analyze
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Statistics */}
      <div className="flex items-center justify-between">
        <div className="text-ocean-300 font-medium">
          Move History ({filteredEntries.length})
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-steel-400 hover:text-white text-sm transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-navy-800/50 rounded">
          <div className="text-steel-400">Total Moves</div>
          <div className="text-white font-medium">{moveEntries.length}</div>
        </div>
        <div className="text-center p-2 bg-navy-800/50 rounded">
          <div className="text-steel-400">Attacks</div>
          <div className="text-white font-medium">
            {moveEntries.filter(e => e.action.type === 'attack').length}
          </div>
        </div>
        <div className="text-center p-2 bg-navy-800/50 rounded">
          <div className="text-steel-400">Hits</div>
          <div className="text-white font-medium">
            {moveEntries.filter(e =>
              e.action.type === 'attack' &&
              (e.action.data as AttackAction).result?.result === 'hit'
            ).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <select
            value={filters.player}
            onChange={(e) => setFilters({...filters, player: e.target.value})}
            className="bg-navy-800 border border-steel-600 rounded px-3 py-2 text-white"
          >
            <option value="all">All Players</option>
            {gameState.players.map(player => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>

          <select
            value={filters.actionType}
            onChange={(e) => setFilters({...filters, actionType: e.target.value as any})}
            className="bg-navy-800 border border-steel-600 rounded px-3 py-2 text-white"
          >
            <option value="all">All Actions</option>
            <option value="attack">Attacks</option>
            <option value="place_ship">Ship Placement</option>
            <option value="use_powerup">Powerups</option>
            <option value="surrender">Surrender</option>
          </select>

          <label className="flex items-center space-x-2 text-steel-300">
            <input
              type="checkbox"
              checked={filters.showOnlyImportant}
              onChange={(e) => setFilters({...filters, showOnlyImportant: e.target.checked})}
              className="rounded"
            />
            <span>Important Only</span>
          </label>
        </div>
      )}

      {/* Move List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredEntries.length === 0 ? (
            <div className="text-center text-steel-400 py-8">
              No moves match the current filters
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <MoveEntry key={entry.id} entry={entry} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Selected Turn Detail */}
      <AnimatePresence>
        {selectedTurn && <TurnDetail turnNumber={selectedTurn} />}
      </AnimatePresence>

      {/* Export Options */}
      {onAction && moveEntries.length > 0 && (
        <div className="flex space-x-2 pt-2 border-t border-steel-600">
          <button
            onClick={() => onAction('export_history', { format: 'json' })}
            className="
              flex-1 px-3 py-2 bg-steel-600 hover:bg-steel-500 text-white
              rounded-lg transition-colors duration-200 text-sm
            "
          >
            Export JSON
          </button>
          <button
            onClick={() => onAction('export_history', { format: 'pgn' })}
            className="
              flex-1 px-3 py-2 bg-steel-600 hover:bg-steel-500 text-white
              rounded-lg transition-colors duration-200 text-sm
            "
          >
            Export PGN
          </button>
        </div>
      )}
    </div>
  )
}
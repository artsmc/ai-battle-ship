'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TurnIndicator } from './TurnIndicator'
import { TimerDisplay } from './TimerDisplay'
import { MoveHistory } from './MoveHistory'
import { AbilityPanel } from './AbilityPanel'
import { SettingsPanel } from './SettingsPanel'
import { GameStateData, GamePlayer } from '@/lib/game/types'

interface GameControlsProps {
  gameState: GameStateData
  currentPlayer?: GamePlayer
  isPlayerTurn: boolean
  onAction?: (action: string, data?: any) => void
  className?: string
}

interface ControlTab {
  id: string
  label: string
  icon: string
  component: React.ComponentType<any>
  disabled?: boolean
}

export function GameControls({
  gameState,
  currentPlayer,
  isPlayerTurn,
  onAction,
  className = ''
}: GameControlsProps) {
  const [activeTab, setActiveTab] = React.useState<string>('turn')
  const [isPanelExpanded, setIsPanelExpanded] = React.useState<boolean>(true)
  const [focusedTabIndex, setFocusedTabIndex] = React.useState<number>(0)
  const tabsRef = React.useRef<HTMLDivElement>(null)

  const tabs: ControlTab[] = [
    {
      id: 'turn',
      label: 'Turn Info',
      icon: '⏰',
      component: TurnIndicator,
      disabled: gameState.phase.current !== 'battle'
    },
    {
      id: 'timers',
      label: 'Timers',
      icon: '⏱️',
      component: TimerDisplay,
      disabled: gameState.phase.current !== 'battle'
    },
    {
      id: 'history',
      label: 'History',
      icon: '📜',
      component: MoveHistory,
      disabled: gameState.turns.length === 0
    },
    {
      id: 'abilities',
      label: 'Abilities',
      icon: '⚡',
      component: AbilityPanel,
      disabled: !currentPlayer || gameState.phase.current !== 'battle'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      component: SettingsPanel
    }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab?.disabled) {
      setActiveTab(tabId)
    }
  }

  const handleTogglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded)
  }

  // Keyboard navigation for tabs
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isPanelExpanded) return

    const availableTabs = tabs.filter(tab => !tab.disabled)
    const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab)

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableTabs.length - 1
        setActiveTab(availableTabs[prevIndex].id)
        setFocusedTabIndex(prevIndex)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = currentIndex < availableTabs.length - 1 ? currentIndex + 1 : 0
        setActiveTab(availableTabs[nextIndex].id)
        setFocusedTabIndex(nextIndex)
        break
      case 'Home':
        event.preventDefault()
        setActiveTab(availableTabs[0].id)
        setFocusedTabIndex(0)
        break
      case 'End':
        event.preventDefault()
        const lastIndex = availableTabs.length - 1
        setActiveTab(availableTabs[lastIndex].id)
        setFocusedTabIndex(lastIndex)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        // Tab is already active, no need to change
        break
      case 'Escape':
        event.preventDefault()
        setIsPanelExpanded(false)
        break
    }
  }

  const getPhaseIndicator = () => {
    const phase = gameState.phase.current
    const phaseColors = {
      waiting: 'text-amber-400 bg-amber-900/20',
      setup: 'text-blue-400 bg-blue-900/20',
      ship_placement: 'text-cyan-400 bg-cyan-900/20',
      battle: 'text-red-400 bg-red-900/20',
      finished: 'text-gray-400 bg-gray-900/20'
    }

    const phaseLabels = {
      waiting: 'Waiting',
      setup: 'Setup',
      ship_placement: 'Ship Placement',
      battle: 'Battle',
      finished: 'Finished'
    }

    return (
      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${phaseColors[phase]} border-current`}>
        {phaseLabels[phase]}
      </div>
    )
  }

  return (
    <motion.div
      className={`
        flex flex-col bg-gradient-to-b from-navy-800 to-navy-900
        border border-steel-600 rounded-lg shadow-2xl
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      aria-label="Game Controls Panel"
      onKeyDown={handleKeyDown}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-steel-600">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-ocean-300 font-medium">
            <span className="text-lg">🎮</span>
            <span>Game Controls</span>
          </div>
          {getPhaseIndicator()}
        </div>

        <button
          onClick={handleTogglePanel}
          className="
            p-2 rounded-lg bg-steel-700 hover:bg-steel-600
            transition-colors duration-200 text-steel-200 hover:text-white
          "
          aria-label={isPanelExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <motion.span
            className="block text-sm"
            animate={{ rotate: isPanelExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </button>
      </div>

      {/* Panel Content */}
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{
          height: isPanelExpanded ? 'auto' : 0,
          opacity: isPanelExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Tab Navigation */}
        <div
          className="flex border-b border-steel-600"
          role="tablist"
          aria-label="Game Control Tabs"
          ref={tabsRef}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              aria-disabled={tab.disabled}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-all duration-200
                border-b-2 border-transparent focus:outline-none focus:ring-2 focus:ring-ocean-400
                ${tab.disabled
                  ? 'text-steel-500 cursor-not-allowed opacity-50'
                  : activeTab === tab.id
                    ? 'text-ocean-300 border-ocean-400 bg-navy-700/50'
                    : 'text-steel-300 hover:text-ocean-300 hover:bg-navy-700/25'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-base" aria-hidden="true">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sr-only sm:hidden">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div
          className="p-4 min-h-[200px]"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {ActiveComponent && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveComponent
                gameState={gameState}
                currentPlayer={currentPlayer}
                isPlayerTurn={isPlayerTurn}
                onAction={onAction}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Status Bar (always visible) */}
      {!isPanelExpanded && (
        <div className="p-3 border-t border-steel-600 bg-navy-800/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-steel-300">
                Turn: <span className="text-ocean-300 font-medium">{gameState.turnNumber}</span>
              </span>
              {currentPlayer && (
                <span className="text-steel-300">
                  Player: <span className="text-ocean-300 font-medium">{currentPlayer.name}</span>
                </span>
              )}
            </div>

            {isPlayerTurn && gameState.phase.current === 'battle' && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-green-400 text-xs font-medium">Your Turn</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
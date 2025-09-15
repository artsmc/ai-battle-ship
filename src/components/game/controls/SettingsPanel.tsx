'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GameStateData, GamePlayer } from '@/lib/game/types'

interface SettingsPanelProps {
  gameState: GameStateData
  currentPlayer?: GamePlayer
  isPlayerTurn: boolean
  onAction?: (action: string, data?: any) => void
}

interface GameSettings {
  // Audio Settings
  masterVolume: number
  soundEffects: boolean
  backgroundMusic: boolean
  voiceAlerts: boolean

  // Visual Settings
  animations: boolean
  particleEffects: boolean
  screenShake: boolean
  showGridCoordinates: boolean
  showHitIndicators: boolean
  highlightValidMoves: boolean

  // Gameplay Settings
  autoEndTurn: boolean
  confirmActions: boolean
  showMoveHints: boolean
  fastAnimations: boolean
  autoSave: boolean

  // Accessibility Settings
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean

  // Developer/Debug Settings
  showDebugInfo: boolean
  performanceMode: boolean
  enableConsoleLogging: boolean
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 70,
  soundEffects: true,
  backgroundMusic: true,
  voiceAlerts: false,
  animations: true,
  particleEffects: true,
  screenShake: true,
  showGridCoordinates: true,
  showHitIndicators: true,
  highlightValidMoves: true,
  autoEndTurn: false,
  confirmActions: true,
  showMoveHints: true,
  fastAnimations: false,
  autoSave: true,
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  screenReader: false,
  keyboardNavigation: true,
  showDebugInfo: false,
  performanceMode: false,
  enableConsoleLogging: false
}

export function SettingsPanel({
  gameState,
  currentPlayer,
  isPlayerTurn,
  onAction
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [activeCategory, setActiveCategory] = useState<string>('audio')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('battleship-game-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('battleship-game-settings', JSON.stringify(settings))
      setHasUnsavedChanges(false)
      onAction?.('settings_saved', settings)
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  // Update setting and mark as changed
  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    setHasUnsavedChanges(true)
  }

  const categories = [
    { id: 'audio', label: 'Audio', icon: '🔊' },
    { id: 'visual', label: 'Visual', icon: '👁️' },
    { id: 'gameplay', label: 'Gameplay', icon: '🎮' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' }
  ]

  const SliderControl = ({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    unit = ''
  }: {
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-steel-300 text-sm font-medium">{label}</label>
        <span className="text-ocean-300 text-sm">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-full h-2 bg-steel-700 rounded-lg appearance-none cursor-pointer
          slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4
          slider-thumb:rounded-full slider-thumb:bg-ocean-400
          slider-thumb:cursor-pointer slider-thumb:shadow-lg
        "
      />
    </div>
  )

  const ToggleControl = ({
    label,
    description,
    checked,
    onChange,
    disabled = false
  }: {
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
  }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border border-steel-600 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <div className="text-steel-200 font-medium">{label}</div>
        {description && (
          <div className="text-steel-400 text-xs mt-1">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="
          w-11 h-6 bg-steel-600 peer-focus:outline-none rounded-full peer
          peer-checked:after:translate-x-full peer-checked:after:border-white
          after:content-[''] after:absolute after:top-[2px] after:left-[2px]
          after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
          peer-checked:bg-ocean-500
        "></div>
      </label>
    </div>
  )

  const SelectControl = ({
    label,
    value,
    onChange,
    options
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
  }) => (
    <div className="space-y-2">
      <label className="text-steel-300 text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full bg-navy-800 border border-steel-600 rounded-lg px-3 py-2
          text-white focus:outline-none focus:border-ocean-400
        "
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'audio':
        return (
          <div className="space-y-4">
            <SliderControl
              label="Master Volume"
              value={settings.masterVolume}
              onChange={(value) => updateSetting('masterVolume', value)}
              unit="%"
            />

            <ToggleControl
              label="Sound Effects"
              description="Battle sounds, ship movements, and UI feedback"
              checked={settings.soundEffects}
              onChange={(value) => updateSetting('soundEffects', value)}
            />

            <ToggleControl
              label="Background Music"
              description="Ambient naval music during gameplay"
              checked={settings.backgroundMusic}
              onChange={(value) => updateSetting('backgroundMusic', value)}
            />

            <ToggleControl
              label="Voice Alerts"
              description="Spoken notifications for important events"
              checked={settings.voiceAlerts}
              onChange={(value) => updateSetting('voiceAlerts', value)}
            />
          </div>
        )

      case 'visual':
        return (
          <div className="space-y-4">
            <ToggleControl
              label="Animations"
              description="Ship movements, attacks, and UI transitions"
              checked={settings.animations}
              onChange={(value) => updateSetting('animations', value)}
            />

            <ToggleControl
              label="Particle Effects"
              description="Explosion effects, water splashes, and smoke"
              checked={settings.particleEffects}
              onChange={(value) => updateSetting('particleEffects', value)}
            />

            <ToggleControl
              label="Screen Shake"
              description="Camera shake on explosions and impacts"
              checked={settings.screenShake}
              onChange={(value) => updateSetting('screenShake', value)}
            />

            <ToggleControl
              label="Grid Coordinates"
              description="Show A-J and 1-10 labels on game board"
              checked={settings.showGridCoordinates}
              onChange={(value) => updateSetting('showGridCoordinates', value)}
            />

            <ToggleControl
              label="Hit Indicators"
              description="Visual markers for hits, misses, and sunk ships"
              checked={settings.showHitIndicators}
              onChange={(value) => updateSetting('showHitIndicators', value)}
            />

            <ToggleControl
              label="Highlight Valid Moves"
              description="Show possible target areas during your turn"
              checked={settings.highlightValidMoves}
              onChange={(value) => updateSetting('highlightValidMoves', value)}
            />
          </div>
        )

      case 'gameplay':
        return (
          <div className="space-y-4">
            <ToggleControl
              label="Auto End Turn"
              description="Automatically end turn after making an attack"
              checked={settings.autoEndTurn}
              onChange={(value) => updateSetting('autoEndTurn', value)}
            />

            <ToggleControl
              label="Confirm Actions"
              description="Require confirmation for attacks and abilities"
              checked={settings.confirmActions}
              onChange={(value) => updateSetting('confirmActions', value)}
            />

            <ToggleControl
              label="Show Move Hints"
              description="Suggest optimal moves and strategies"
              checked={settings.showMoveHints}
              onChange={(value) => updateSetting('showMoveHints', value)}
            />

            <ToggleControl
              label="Fast Animations"
              description="Speed up animations for quicker gameplay"
              checked={settings.fastAnimations}
              onChange={(value) => updateSetting('fastAnimations', value)}
            />

            <ToggleControl
              label="Auto Save"
              description="Automatically save game progress"
              checked={settings.autoSave}
              onChange={(value) => updateSetting('autoSave', value)}
            />
          </div>
        )

      case 'accessibility':
        return (
          <div className="space-y-4">
            <ToggleControl
              label="High Contrast"
              description="Increase color contrast for better visibility"
              checked={settings.highContrast}
              onChange={(value) => updateSetting('highContrast', value)}
            />

            <ToggleControl
              label="Large Text"
              description="Increase font size throughout the interface"
              checked={settings.largeText}
              onChange={(value) => updateSetting('largeText', value)}
            />

            <ToggleControl
              label="Reduce Motion"
              description="Minimize animations and effects"
              checked={settings.reduceMotion}
              onChange={(value) => updateSetting('reduceMotion', value)}
            />

            <ToggleControl
              label="Screen Reader Support"
              description="Enable enhanced compatibility with screen readers"
              checked={settings.screenReader}
              onChange={(value) => updateSetting('screenReader', value)}
            />

            <ToggleControl
              label="Keyboard Navigation"
              description="Full keyboard control of the game interface"
              checked={settings.keyboardNavigation}
              onChange={(value) => updateSetting('keyboardNavigation', value)}
            />
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-4">
            <ToggleControl
              label="Show Debug Information"
              description="Display technical information and performance metrics"
              checked={settings.showDebugInfo}
              onChange={(value) => updateSetting('showDebugInfo', value)}
            />

            <ToggleControl
              label="Performance Mode"
              description="Reduce visual quality for better performance"
              checked={settings.performanceMode}
              onChange={(value) => updateSetting('performanceMode', value)}
            />

            <ToggleControl
              label="Console Logging"
              description="Enable detailed logging for troubleshooting"
              checked={settings.enableConsoleLogging}
              onChange={(value) => updateSetting('enableConsoleLogging', value)}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex space-x-1 bg-navy-800 rounded-lg p-1">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`
              flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${activeCategory === category.id
                ? 'bg-ocean-600 text-white shadow-lg'
                : 'text-steel-300 hover:text-white hover:bg-navy-700'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-base">{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="min-h-[400px]">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderCategoryContent()}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t border-steel-600">
        <button
          onClick={saveSettings}
          disabled={!hasUnsavedChanges}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${hasUnsavedChanges
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-steel-700 text-steel-400 cursor-not-allowed'
            }
          `}
        >
          {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
        </button>

        <button
          onClick={resetSettings}
          className="
            px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white
            rounded-lg font-medium transition-colors duration-200
          "
        >
          Reset
        </button>

        {onAction && (
          <button
            onClick={() => onAction('export_settings', settings)}
            className="
              px-4 py-2 bg-steel-600 hover:bg-steel-500 text-white
              rounded-lg font-medium transition-colors duration-200
            "
          >
            Export
          </button>
        )}
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <motion.div
          className="text-center text-amber-400 text-sm"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚠️ You have unsaved changes
        </motion.div>
      )}
    </div>
  )
}
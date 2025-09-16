'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameStateData, GamePlayer, GameShip, ShipAbility, PlayerPowerup } from '@/lib/game/types'

interface AbilityPanelProps {
  gameState: GameStateData
  currentPlayer?: GamePlayer
  isPlayerTurn: boolean
  onAction?: (action: string, data?: any) => void
}

interface AbilityGroup {
  type: 'ship' | 'powerup'
  ship?: GameShip
  abilities: (ShipAbility | PlayerPowerup)[]
}

export function AbilityPanel({
  gameState,
  currentPlayer,
  isPlayerTurn,
  onAction
}: AbilityPanelProps) {
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<boolean>(false)

  // Group abilities by source (ship or powerup)
  const abilityGroups = useMemo(() => {
    if (!currentPlayer) return []

    const groups: AbilityGroup[] = []

    // Ship abilities
    currentPlayer.fleet
      .filter(ship => !ship.damage.isSunk && ship.abilities.length > 0)
      .forEach(ship => {
        groups.push({
          type: 'ship',
          ship,
          abilities: ship.abilities
        })
      })

    // Player powerups
    if (currentPlayer.powerups.length > 0) {
      groups.push({
        type: 'powerup',
        abilities: currentPlayer.powerups
      })
    }

    return groups
  }, [currentPlayer])

  const getAbilityIcon = (ability: ShipAbility | PlayerPowerup): string => {
    if ('type' in ability) {
      // PlayerPowerup
      const icons = {
        SONAR_SCAN: '📡',
        AIR_STRIKE: '✈️',
        TORPEDO_SALVO: '🚀',
        REPAIR_CREW: '🔧',
        SMOKE_SCREEN: '💨',
        RADAR_JAMMING: '📶'
      }
      return icons[ability.type] || '⚡'
    } else {
      // ShipAbility
      const commonIcons = {
        'All Big Guns': '🔫',
        'Speed Advantage': '💨',
        'Scout': '👁️',
        'Sonar Detection': '📡',
        'Armor Piercing': '🎯',
        'Rapid Fire': '🔥'
      }
      return commonIcons[ability.name as keyof typeof commonIcons] || '⚡'
    }
  }

  const isAbilityAvailable = (ability: ShipAbility | PlayerPowerup): boolean => {
    if (!isPlayerTurn) return false

    if ('type' in ability) {
      // PlayerPowerup
      return ability.remainingUses > 0 && ability.currentCooldown <= 0
    } else {
      // ShipAbility
      return ability.remainingUses > 0 && ability.currentCooldown <= 0 && !ability.isActive
    }
  }

  const getAbilityStatus = (ability: ShipAbility | PlayerPowerup): string => {
    if ('type' in ability) {
      if (ability.currentCooldown > 0) return `Cooldown: ${ability.currentCooldown}`
      if (ability.remainingUses === 0) return 'No uses left'
      return 'Ready'
    } else {
      if (ability.isActive) return 'Active'
      if (ability.currentCooldown > 0) return `Cooldown: ${ability.currentCooldown}`
      if (ability.remainingUses === 0) return 'No uses left'
      return 'Ready'
    }
  }

  const getAbilityDescription = (ability: ShipAbility | PlayerPowerup): string => {
    if ('type' in ability) {
      const descriptions = {
        SONAR_SCAN: 'Reveal a 3x3 area of the enemy board',
        AIR_STRIKE: 'Attack a 2x2 area with reduced accuracy',
        TORPEDO_SALVO: 'Fire 3 torpedoes in a line',
        REPAIR_CREW: 'Restore 1 HP to a damaged ship',
        SMOKE_SCREEN: 'Hide your ships for 2 turns',
        RADAR_JAMMING: 'Disrupt enemy targeting for 1 turn'
      }
      return descriptions[ability.type] || 'Special powerup ability'
    } else {
      return ability.description
    }
  }

  const handleAbilityActivation = (ability: ShipAbility | PlayerPowerup, ship?: GameShip) => {
    if (!isAbilityAvailable(ability) || !onAction) return

    const abilityId = 'type' in ability ? ability.type : ability.id
    const requiresTargeting = ['SONAR_SCAN', 'AIR_STRIKE', 'TORPEDO_SALVO', 'Scout'].includes(
      'type' in ability ? ability.type : ability.name
    )

    if (requiresTargeting) {
      setTargetMode(true)
      setSelectedAbility(abilityId)
      onAction('start_ability_targeting', {
        abilityId,
        shipId: ship?.id,
        abilityType: 'type' in ability ? ability.type : ability.name
      })
    } else {
      onAction('activate_ability', {
        abilityId,
        shipId: ship?.id,
        abilityType: 'type' in ability ? ability.type : ability.name
      })
    }
  }

  const AbilityCard = ({
    ability,
    ship
  }: {
    ability: ShipAbility | PlayerPowerup
    ship?: GameShip
  }) => {
    const isAvailable = isAbilityAvailable(ability)
    const status = getAbilityStatus(ability)
    const description = getAbilityDescription(ability)

    return (
      <motion.div
        className={`
          p-3 rounded-lg border transition-all duration-300 cursor-pointer
          ${isAvailable
            ? 'bg-ocean-900/30 border-ocean-400 hover:bg-ocean-800/30'
            : 'bg-steel-900/30 border-steel-600 opacity-60'
          }
        `}
        whileHover={isAvailable ? { scale: 1.02 } : {}}
        whileTap={isAvailable ? { scale: 0.98 } : {}}
        onClick={() => handleAbilityActivation(ability, ship)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{getAbilityIcon(ability)}</span>
            <div>
              <div className="font-medium text-white text-sm">
                {'type' in ability && ability.type ? ability.type.replace('_', ' ') : ability.name || 'Unknown Ability'}
              </div>
              {ship && (
                <div className="text-xs text-steel-400">
                  {ship.name} ({ship.class})
                </div>
              )}
            </div>
          </div>

          <div className={`
            px-2 py-1 rounded-full text-xs font-medium border
            ${isAvailable
              ? 'text-green-400 bg-green-900/20 border-green-400'
              : 'text-steel-400 bg-steel-900/20 border-steel-400'
            }
          `}>
            {status}
          </div>
        </div>

        <p className="text-xs text-steel-300 mb-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-xs text-steel-400">
          <div className="flex items-center space-x-3">
            <span>
              Uses: {'type' in ability ? ability.remainingUses : ability.remainingUses}/{'type' in ability ? ability.uses : ability.uses}
            </span>
            <span>
              Cooldown: {'type' in ability ? ability.cooldown : ability.cooldown}s
            </span>
          </div>

          {isAvailable && (
            <div className="text-ocean-400 font-medium">
              Click to activate
            </div>
          )}
        </div>

        {/* Cooldown Progress Bar */}
        {('type' in ability ? ability.currentCooldown : ability.currentCooldown) > 0 && (
          <div className="mt-2">
            <div className="w-full bg-steel-800 rounded-full h-1">
              <motion.div
                className="h-1 rounded-full bg-amber-500"
                style={{
                  width: `${(1 - (('type' in ability ? ability.currentCooldown : ability.currentCooldown) / ('type' in ability ? ability.cooldown : ability.cooldown))) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const AbilityGroup = ({ group }: { group: AbilityGroup }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-steel-400 text-sm font-medium">
        <span>{group.type === 'ship' ? '🚢' : '⚡'}</span>
        <span>
          {group.type === 'ship'
            ? `${group.ship?.name} Abilities`
            : 'Powerups'
          }
        </span>
      </div>

      <div className="space-y-2">
        {group.abilities.map((ability, index) => (
          <AbilityCard
            key={`${group.type}-${index}`}
            ability={ability}
            ship={group.ship}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-ocean-300 font-medium">
          Ship Abilities & Powerups
        </div>
        {targetMode && (
          <button
            onClick={() => {
              setTargetMode(false)
              setSelectedAbility(null)
              onAction?.('cancel_ability_targeting')
            }}
            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
          >
            Cancel Targeting
          </button>
        )}
      </div>

      {/* Targeting Mode Indicator */}
      <AnimatePresence>
        {targetMode && (
          <motion.div
            className="p-3 bg-ocean-900/20 border border-ocean-500 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="text-ocean-300 font-medium mb-1">🎯 Targeting Mode Active</div>
            <div className="text-steel-300 text-sm">
              Click on the enemy board to target the selected ability
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abilities List */}
      {abilityGroups.length === 0 ? (
        <div className="text-center text-steel-400 py-8">
          <div className="text-4xl mb-2">⚡</div>
          <div>No abilities available</div>
          <div className="text-xs mt-1">
            Abilities become available during the battle phase
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {abilityGroups.map((group, index) => (
            <AbilityGroup key={`group-${index}`} group={group} />
          ))}
        </div>
      )}

      {/* Ability Statistics */}
      {currentPlayer && abilityGroups.length > 0 && (
        <div className="text-xs text-steel-400 space-y-1 p-3 bg-steel-900/30 rounded-lg border border-steel-700">
          <div className="text-steel-300 font-medium mb-2">Ability Statistics</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span>Total Abilities:</span>
              <span>{abilityGroups.reduce((total, group) => total + group.abilities.length, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ready:</span>
              <span>
                {abilityGroups.reduce((total, group) =>
                  total + group.abilities.filter(isAbilityAvailable).length, 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>On Cooldown:</span>
              <span>
                {abilityGroups.reduce((total, group) =>
                  total + group.abilities.filter(ability =>
                    ('type' in ability ? ability.currentCooldown : ability.currentCooldown) > 0
                  ).length, 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Exhausted:</span>
              <span>
                {abilityGroups.reduce((total, group) =>
                  total + group.abilities.filter(ability =>
                    ('type' in ability ? ability.remainingUses : ability.remainingUses) === 0
                  ).length, 0
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      {isPlayerTurn && onAction && abilityGroups.length > 0 && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAction('auto_select_ability')}
            className="
              flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white
              rounded-lg transition-colors duration-200 text-sm
            "
          >
            Auto Select
          </button>
          <button
            onClick={() => onAction('ability_help')}
            className="
              px-3 py-2 bg-steel-600 hover:bg-steel-500 text-white
              rounded-lg transition-colors duration-200 text-sm
            "
          >
            Help
          </button>
        </div>
      )}
    </div>
  )
}
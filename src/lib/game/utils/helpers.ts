/**
 * Helper Functions
 * General utility functions for game operations
 */

import { GameMode, ShipClass, MoveResult, PowerupType } from '../../database/types/enums'
import {
  Coordinate,
  GameConfiguration,
  GamePlayer,
  AttackResult,
  GameShip,
  ShipAbility,
  PlayerPowerup
} from '../types'
import { GAME_MODE_SETTINGS, STANDARD_FLEET, SCORING } from './constants'

// =============================================
// RANDOM UTILITIES
// =============================================

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateRandomId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateRoomCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// =============================================
// GAME CONFIGURATION HELPERS
// =============================================

export function getDefaultConfiguration(mode: GameMode = GameMode.CLASSIC): GameConfiguration {
  const settings = GAME_MODE_SETTINGS[mode]

  return {
    mode,
    boardWidth: settings.boardWidth,
    boardHeight: settings.boardHeight,
    turnTimeLimit: settings.turnTimeLimit,
    allowPowerups: settings.allowPowerups,
    fogOfWar: settings.fogOfWar,
    allowReconnection: true,
    maxReconnectionTime: 120000
  }
}

export function createStandardFleet(playerId: string): GameShip[] {
  return STANDARD_FLEET.map((shipConfig) => ({
    id: generateRandomId('ship'),
    typeId: `type_${shipConfig.class}`,
    name: shipConfig.name,
    class: shipConfig.class,
    size: shipConfig.size,
    position: undefined,
    damage: {
      hitPositions: [],
      totalHits: 0,
      isSunk: false
    },
    hitPoints: shipConfig.size,
    maxHitPoints: shipConfig.size,
    abilities: createDefaultAbilities(shipConfig.class),
    playerId
  }))
}

function createDefaultAbilities(shipClass: ShipClass): ShipAbility[] {
  const abilities: ShipAbility[] = []

  switch (shipClass) {
    case ShipClass.CARRIER:
      abilities.push({
        id: 'air_recon',
        name: 'Air Reconnaissance',
        description: 'Reveal a 3x3 area',
        cooldown: 4,
        currentCooldown: 0,
        uses: 2,
        remainingUses: 2,
        isActive: true
      })
      break
    case ShipClass.BATTLESHIP:
      abilities.push({
        id: 'heavy_armor',
        name: 'Heavy Armor',
        description: 'Reduce damage by 1 for next hit',
        cooldown: 3,
        currentCooldown: 0,
        uses: 2,
        remainingUses: 2,
        isActive: true
      })
      break
    case ShipClass.SUBMARINE:
      abilities.push({
        id: 'stealth_mode',
        name: 'Stealth Mode',
        description: 'Cannot be hit for 1 turn',
        cooldown: 5,
        currentCooldown: 0,
        uses: 1,
        remainingUses: 1,
        isActive: true
      })
      break
  }

  return abilities
}

// =============================================
// ATTACK HELPERS
// =============================================

export function processAttackResult(
  coordinate: Coordinate,
  targetBoard: { getCell: (coord: Coordinate) => { isHit: boolean; hasShip?: boolean; shipId?: string } | null },
  targetFleet: GameShip[]
): AttackResult {
  const cell = targetBoard.getCell(coordinate)

  if (!cell || cell.isHit) {
    return {
      coordinate,
      result: MoveResult.MISS,
      damageDealt: 0
    }
  }

  if (!cell.hasShip || !cell.shipId) {
    return {
      coordinate,
      result: MoveResult.MISS,
      damageDealt: 0
    }
  }

  const ship = targetFleet.find(s => s.id === cell.shipId)
  if (!ship) {
    return {
      coordinate,
      result: MoveResult.MISS,
      damageDealt: 0
    }
  }

  // Apply damage to ship
  const damageDealt = 1
  ship.hitPoints = Math.max(0, ship.hitPoints - damageDealt)
  ship.damage.hitPositions.push(coordinate)
  ship.damage.totalHits++

  // Check if ship is sunk
  if (ship.hitPoints === 0 && !ship.damage.isSunk) {
    ship.damage.isSunk = true
    ship.damage.sunkAt = new Date()

    return {
      coordinate,
      result: MoveResult.SUNK,
      shipHit: ship.id,
      shipSunk: true,
      shipType: ship.name,
      damageDealt
    }
  }

  // Check for critical hit (10% chance)
  const isCritical = Math.random() < 0.1

  return {
    coordinate,
    result: isCritical ? MoveResult.CRITICAL_HIT : MoveResult.HIT,
    shipHit: ship.id,
    shipSunk: false,
    damageDealt: isCritical ? damageDealt * 2 : damageDealt
  }
}

export function calculateDamage(
  baseAmount: number,
  attackType: 'normal' | 'special',
  targetArmor: number = 1
): number {
  const multiplier = attackType === 'special' ? 1.5 : 1
  const damage = baseAmount * multiplier
  return Math.max(1, Math.floor(damage - (targetArmor - 1)))
}

// =============================================
// SCORING HELPERS
// =============================================

export function calculateScore(player: GamePlayer, gameTime: number): number {
  let score = 0

  // Base scoring
  score += player.stats.shotsHit * SCORING.HIT_POINTS
  score += player.stats.shotsMissed * SCORING.MISS_PENALTY
  score += player.stats.shipsSunk * SCORING.SINK_BONUS

  // Accuracy bonus
  if (player.stats.accuracy > 50) {
    score *= SCORING.ACCURACY_MULTIPLIER
  }

  // Ship survival bonus
  score += player.stats.shipsRemaining * SCORING.SHIP_SURVIVAL_BONUS

  // Time bonus (faster games get more points)
  const timeBonus = Math.max(0, (1800000 - gameTime) / 1000 * SCORING.TIME_BONUS_PER_SECOND)
  score += timeBonus

  // Perfect game bonus
  if (player.stats.accuracy === 100 && player.stats.shipsRemaining === player.fleet.length) {
    score += SCORING.PERFECT_GAME_BONUS
  }

  return Math.floor(score)
}

export function calculateAccuracy(hits: number, total: number): number {
  if (total === 0) return 0
  return Math.round((hits / total) * 100)
}

// =============================================
// POWERUP HELPERS
// =============================================

export function createDefaultPowerups(): PlayerPowerup[] {
  return [
    {
      type: PowerupType.RADAR_SCAN,
      uses: 3,
      remainingUses: 3,
      cooldown: 3,
      currentCooldown: 0
    },
    {
      type: PowerupType.BARRAGE,
      uses: 1,
      remainingUses: 1,
      cooldown: 5,
      currentCooldown: 0
    },
    {
      type: PowerupType.SONAR_PING,
      uses: 2,
      remainingUses: 2,
      cooldown: 4,
      currentCooldown: 0
    }
  ]
}

export function updatePowerupCooldowns(powerups: PlayerPowerup[]): void {
  powerups.forEach(powerup => {
    if (powerup.currentCooldown > 0) {
      powerup.currentCooldown--
    }
  })
}

// =============================================
// TIME HELPERS
// =============================================

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export function getElapsedTime(startTime: Date | undefined): number {
  if (!startTime) return 0
  return Date.now() - startTime.getTime()
}

export function isTimeExpired(startTime: Date, limit: number): boolean {
  return getElapsedTime(startTime) >= limit
}

// =============================================
// VALIDATION HELPERS
// =============================================

export function isValidCoordinate(coord: Coordinate, width: number, height: number): boolean {
  return coord.x >= 0 && coord.x < width && coord.y >= 0 && coord.y < height
}

export function isValidShipPlacement(
  coordinates: Coordinate[],
  boardWidth: number,
  boardHeight: number
): boolean {
  // Check all coordinates are in bounds
  for (const coord of coordinates) {
    if (!isValidCoordinate(coord, boardWidth, boardHeight)) {
      return false
    }
  }

  // Check coordinates form a line
  if (coordinates.length < 2) return true

  const isHorizontal = coordinates.every(c => c.y === coordinates[0].y)
  const isVertical = coordinates.every(c => c.x === coordinates[0].x)

  if (!isHorizontal && !isVertical) {
    return false
  }

  // Check coordinates are contiguous
  const sorted = [...coordinates].sort((a, b) => {
    if (isHorizontal) return a.x - b.x
    return a.y - b.y
  })

  for (let i = 1; i < sorted.length; i++) {
    const gap = isHorizontal
      ? sorted[i].x - sorted[i - 1].x
      : sorted[i].y - sorted[i - 1].y

    if (gap !== 1) return false
  }

  return true
}

// =============================================
// STATISTICS HELPERS
// =============================================

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0
  return Math.round((wins / total) * 100)
}

export function calculateAverageGameTime(games: Array<{ duration: number }>): number {
  if (games.length === 0) return 0
  const total = games.reduce((sum, game) => sum + game.duration, 0)
  return Math.round(total / games.length)
}

export function getPlayerRank(rating: number): string {
  if (rating < 1000) return 'Seaman Recruit'
  if (rating < 1200) return 'Seaman'
  if (rating < 1400) return 'Petty Officer'
  if (rating < 1600) return 'Chief Petty Officer'
  if (rating < 1800) return 'Ensign'
  if (rating < 2000) return 'Lieutenant'
  if (rating < 2200) return 'Commander'
  if (rating < 2400) return 'Captain'
  if (rating < 2600) return 'Rear Admiral'
  if (rating < 2800) return 'Vice Admiral'
  return 'Fleet Admiral'
}

// =============================================
// COMPARISON HELPERS
// =============================================

export function compareCoordinates(a: Coordinate, b: Coordinate): number {
  if (a.y !== b.y) return a.y - b.y
  return a.x - b.x
}

export function sortCoordinates(coordinates: Coordinate[]): Coordinate[] {
  return [...coordinates].sort(compareCoordinates)
}

export function findShipByCoordinate(
  coordinate: Coordinate,
  ships: GameShip[]
): GameShip | undefined {
  return ships.find(ship =>
    ship.position?.coordinates.some(
      coord => coord.x === coordinate.x && coord.y === coordinate.y
    )
  )
}

// =============================================
// CONVERSION HELPERS
// =============================================

export function shipClassToSize(shipClass: ShipClass): number {
  const sizes: Record<ShipClass, number> = {
    [ShipClass.CARRIER]: 5,
    [ShipClass.BATTLESHIP]: 4,
    [ShipClass.BATTLECRUISER]: 4,
    [ShipClass.HEAVY_CRUISER]: 3,
    [ShipClass.LIGHT_CRUISER]: 3,
    [ShipClass.DESTROYER]: 2,
    [ShipClass.SUBMARINE]: 3,
    [ShipClass.FRIGATE]: 2,
    [ShipClass.CORVETTE]: 1,
    [ShipClass.PATROL_BOAT]: 1
  }
  return sizes[shipClass] || 1
}

export function moveResultToString(result: MoveResult): string {
  const strings: Record<MoveResult, string> = {
    [MoveResult.MISS]: 'Miss',
    [MoveResult.HIT]: 'Hit',
    [MoveResult.SUNK]: 'Sunk',
    [MoveResult.CRITICAL_HIT]: 'Critical Hit',
    [MoveResult.NEAR_MISS]: 'Near Miss'
  }
  return strings[result] || 'Unknown'
}

// =============================================
// EXPORT HELPERS
// =============================================

export function exportGameState(state: unknown): string {
  return JSON.stringify(state, null, 2)
}

export function importGameState(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to parse game state:', error)
    return null
  }
}
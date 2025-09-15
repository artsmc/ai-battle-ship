/**
 * Validation Functions
 * Game rule validation and checking utilities
 */

import { GameStatus, ShipClass } from '../../database/types/enums'
import {
  GameConfiguration,
  GamePlayer,
  Coordinate,
  ShipPosition,
  ValidationResult,
  ValidationError,
  BoardState,
  GamePhaseType
} from '../types'
import { areCoordinatesContiguous, isCoordinateInBounds, doCoordinatesOverlap } from './coordinates'
import { sanitizeCoordinate, sanitizePlayerId } from './security'

// =============================================
// GAME CONFIGURATION VALIDATION
// =============================================

export function validateGameConfiguration(config: GameConfiguration): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Board size validation
  if (config.boardWidth < 5 || config.boardWidth > 20) {
    errors.push({
      code: 'INVALID_BOARD_WIDTH',
      message: 'Board width must be between 5 and 20',
      field: 'boardWidth',
      value: config.boardWidth
    })
  }

  if (config.boardHeight < 5 || config.boardHeight > 20) {
    errors.push({
      code: 'INVALID_BOARD_HEIGHT',
      message: 'Board height must be between 5 and 20',
      field: 'boardHeight',
      value: config.boardHeight
    })
  }

  // Time limit validation
  if (config.timeLimit && config.timeLimit < 60000) {
    warnings.push('Game time limit is very short (less than 1 minute)')
  }

  if (config.turnTimeLimit && config.turnTimeLimit < 10000) {
    errors.push({
      code: 'INVALID_TURN_TIME',
      message: 'Turn time limit must be at least 10 seconds',
      field: 'turnTimeLimit',
      value: config.turnTimeLimit
    })
  }

  // Reconnection validation
  if (config.allowReconnection && !config.maxReconnectionTime) {
    warnings.push('Reconnection enabled but no max reconnection time set')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================
// PLAYER VALIDATION
// =============================================

export function validatePlayerSetup(player: GamePlayer): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Name validation
  if (!player.name || player.name.trim().length === 0) {
    errors.push({
      code: 'INVALID_PLAYER_NAME',
      message: 'Player name is required',
      field: 'name',
      value: player.name
    })
  }

  if (player.name.length > 50) {
    errors.push({
      code: 'NAME_TOO_LONG',
      message: 'Player name must be 50 characters or less',
      field: 'name',
      value: player.name
    })
  }

  // AI validation
  if (player.isAI && !player.aiDifficulty) {
    errors.push({
      code: 'MISSING_AI_DIFFICULTY',
      message: 'AI players must have a difficulty level',
      field: 'aiDifficulty',
      value: undefined
    })
  }

  // Fleet validation
  if (player.fleet.length === 0) {
    warnings.push('Player has no ships in fleet')
  }

  const fleetValidation = validateFleetComposition(player.fleet)
  errors.push(...fleetValidation.errors)
  warnings.push(...fleetValidation.warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateFleetComposition(fleet: Array<{ class: ShipClass }>): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  const shipCounts = new Map<ShipClass, number>()

  for (const ship of fleet) {
    const count = shipCounts.get(ship.class) || 0
    shipCounts.set(ship.class, count + 1)
  }

  // Check standard fleet composition
  const standardFleet = getStandardFleetComposition()

  for (const [shipClass, maxCount] of Array.from(standardFleet.entries())) {
    const count = shipCounts.get(shipClass) || 0
    if (count > maxCount) {
      errors.push({
        code: 'EXCESSIVE_SHIPS',
        message: `Too many ${shipClass} ships (max: ${maxCount})`,
        field: 'fleet',
        value: count
      })
    }
  }

  // Check for minimum fleet
  const totalShips = Array.from(shipCounts.values()).reduce((sum, count) => sum + count, 0)
  if (totalShips < 3) {
    errors.push({
      code: 'INSUFFICIENT_FLEET',
      message: 'Fleet must have at least 3 ships',
      field: 'fleet',
      value: totalShips
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

function getStandardFleetComposition(): Map<ShipClass, number> {
  return new Map([
    [ShipClass.CARRIER, 1],
    [ShipClass.BATTLESHIP, 1],
    [ShipClass.HEAVY_CRUISER, 2],
    [ShipClass.LIGHT_CRUISER, 2],
    [ShipClass.DESTROYER, 3],
    [ShipClass.SUBMARINE, 2]
  ])
}

// =============================================
// SHIP PLACEMENT VALIDATION
// =============================================

export function validateShipPlacement(
  position: ShipPosition,
  boardState: BoardState,
  shipSize: number
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Check coordinate count matches ship size
  if (position.coordinates.length !== shipSize) {
    errors.push({
      code: 'SIZE_MISMATCH',
      message: `Ship size (${shipSize}) doesn't match coordinates (${position.coordinates.length})`,
      field: 'coordinates',
      value: position.coordinates.length
    })
  }

  // Check coordinates are contiguous
  if (!areCoordinatesContiguous(position.coordinates)) {
    errors.push({
      code: 'NON_CONTIGUOUS',
      message: 'Ship coordinates must form a continuous line',
      field: 'coordinates',
      value: position.coordinates
    })
  }

  // Check bounds
  const bounds = {
    minX: 0,
    maxX: boardState.width - 1,
    minY: 0,
    maxY: boardState.height - 1
  }

  for (const coord of position.coordinates) {
    if (!isCoordinateInBounds(coord, bounds)) {
      errors.push({
        code: 'OUT_OF_BOUNDS',
        message: `Coordinate (${coord.x}, ${coord.y}) is out of bounds`,
        field: 'coordinates',
        value: coord
      })
    }
  }

  // Check for overlaps with existing ships
  for (const existingPosition of Array.from(boardState.ships.values())) {
    if (existingPosition.shipId !== position.shipId &&
        doCoordinatesOverlap(position.coordinates, existingPosition.coordinates)) {
      errors.push({
        code: 'SHIP_OVERLAP',
        message: 'Ship overlaps with existing ship',
        field: 'coordinates',
        value: position.coordinates
      })
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateAllShipsPlaced(
  boardState: BoardState,
  requiredShipCount: number
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  const placedShips = boardState.ships.size

  if (placedShips < requiredShipCount) {
    errors.push({
      code: 'INCOMPLETE_PLACEMENT',
      message: `Not all ships placed (${placedShips}/${requiredShipCount})`,
      field: 'ships',
      value: placedShips
    })
  }

  if (placedShips > requiredShipCount) {
    warnings.push(`More ships placed than required (${placedShips}/${requiredShipCount})`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================
// ATTACK VALIDATION
// =============================================

export function validateAttackCoordinate(
  coordinate: Coordinate,
  boardState: BoardState
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Sanitize coordinate input first
  const sanitized = sanitizeCoordinate(coordinate, boardState.width, boardState.height)
  if (!sanitized.valid || !sanitized.coordinate) {
    errors.push({
      code: 'INVALID_COORDINATE',
      message: sanitized.error || 'Invalid coordinate format',
      field: 'coordinate',
      value: coordinate
    })
    return { isValid: false, errors, warnings }
  }

  const validCoordinate = sanitized.coordinate

  // Check bounds
  const bounds = {
    minX: 0,
    maxX: boardState.width - 1,
    minY: 0,
    maxY: boardState.height - 1
  }

  if (!isCoordinateInBounds(validCoordinate, bounds)) {
    errors.push({
      code: 'OUT_OF_BOUNDS',
      message: `Attack coordinate (${validCoordinate.x}, ${validCoordinate.y}) is out of bounds`,
      field: 'coordinate',
      value: validCoordinate
    })
  }

  // Check if already hit
  const cell = boardState.cells[validCoordinate.y]?.[validCoordinate.x]
  if (cell?.isHit) {
    warnings.push(`Cell (${validCoordinate.x}, ${validCoordinate.y}) has already been attacked`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateMultipleAttacks(
  coordinates: Coordinate[],
  boardState: BoardState,
  maxAttacks: number
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Check attack count
  if (coordinates.length > maxAttacks) {
    errors.push({
      code: 'TOO_MANY_ATTACKS',
      message: `Too many attacks (${coordinates.length}/${maxAttacks})`,
      field: 'coordinates',
      value: coordinates.length
    })
  }

  // Check for duplicates
  const uniqueCoords = new Set(coordinates.map(c => `${c.x},${c.y}`))
  if (uniqueCoords.size !== coordinates.length) {
    errors.push({
      code: 'DUPLICATE_ATTACKS',
      message: 'Duplicate attack coordinates',
      field: 'coordinates',
      value: coordinates
    })
  }

  // Validate each coordinate
  for (const coord of coordinates) {
    const validation = validateAttackCoordinate(coord, boardState)
    errors.push(...validation.errors)
    warnings.push(...validation.warnings)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================
// GAME STATE VALIDATION
// =============================================

export function validateGamePhaseTransition(
  currentPhase: GamePhaseType,
  newPhase: GamePhaseType
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  const validTransitions: Record<GamePhaseType, GamePhaseType[]> = {
    'waiting': ['setup'],
    'setup': ['ship_placement', 'waiting'],
    'ship_placement': ['battle', 'setup'],
    'battle': ['finished'],
    'finished': []
  }

  const allowed = validTransitions[currentPhase] || []

  if (!allowed.includes(newPhase)) {
    errors.push({
      code: 'INVALID_PHASE_TRANSITION',
      message: `Cannot transition from ${currentPhase} to ${newPhase}`,
      field: 'phase',
      value: newPhase
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateGameStart(players: GamePlayer[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Check player count
  if (players.length < 2) {
    errors.push({
      code: 'INSUFFICIENT_PLAYERS',
      message: 'Need at least 2 players to start',
      field: 'players',
      value: players.length
    })
  }

  if (players.length > 2) {
    warnings.push('Game has more than 2 players')
  }

  // Check all players are ready
  for (const player of players) {
    if (!player.isReady) {
      errors.push({
        code: 'PLAYER_NOT_READY',
        message: `Player ${player.name} is not ready`,
        field: 'player',
        value: player.id
      })
    }

    // Check all ships are placed
    const unplacedShips = player.fleet.filter(ship => !ship.position)
    if (unplacedShips.length > 0) {
      errors.push({
        code: 'SHIPS_NOT_PLACED',
        message: `Player ${player.name} has ${unplacedShips.length} unplaced ships`,
        field: 'fleet',
        value: unplacedShips.length
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================
// TURN VALIDATION
// =============================================

export function validateTurnAction(
  playerId: string,
  currentPlayerId: string | undefined,
  gameStatus: GameStatus
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Sanitize player ID
  const sanitized = sanitizePlayerId(playerId)
  if (!sanitized.valid || !sanitized.playerId) {
    errors.push({
      code: 'INVALID_PLAYER_ID',
      message: sanitized.error || 'Invalid player ID',
      field: 'playerId',
      value: playerId
    })
    return { isValid: false, errors, warnings }
  }
  playerId = sanitized.playerId

  if (gameStatus !== GameStatus.PLAYING) {
    errors.push({
      code: 'GAME_NOT_ACTIVE',
      message: 'Game is not in playing state',
      field: 'status',
      value: gameStatus
    })
  }

  if (!currentPlayerId) {
    errors.push({
      code: 'NO_ACTIVE_TURN',
      message: 'No active turn',
      field: 'currentPlayerId',
      value: undefined
    })
  } else if (playerId !== currentPlayerId) {
    errors.push({
      code: 'NOT_YOUR_TURN',
      message: 'It is not your turn',
      field: 'playerId',
      value: playerId
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================
// UTILITY VALIDATION
// =============================================

export function validateCoordinate(
  coordinate: Coordinate,
  maxX: number,
  maxY: number
): ValidationResult {
  const errors: ValidationError[] = []

  // Sanitize and validate coordinate
  const sanitized = sanitizeCoordinate(coordinate, maxX, maxY)
  if (!sanitized.valid || !sanitized.coordinate) {
    errors.push({
      code: 'INVALID_COORDINATE',
      message: sanitized.error || 'Invalid coordinate',
      field: 'coordinate',
      value: coordinate
    })
    return { isValid: false, errors, warnings: [] }
  }

  const validCoord = sanitized.coordinate

  // Additional integer checks
  if (!Number.isInteger(validCoord.x) || !Number.isInteger(validCoord.y)) {
    errors.push({
      code: 'NON_INTEGER_COORDINATE',
      message: 'Coordinates must be integers',
      field: 'coordinate',
      value: validCoord
    })
  }

  if (validCoord.x < 0 || validCoord.x >= maxX) {
    errors.push({
      code: 'INVALID_X',
      message: `X coordinate must be between 0 and ${maxX - 1}`,
      field: 'x',
      value: validCoord.x
    })
  }

  if (validCoord.y < 0 || validCoord.y >= maxY) {
    errors.push({
      code: 'INVALID_Y',
      message: `Y coordinate must be between 0 and ${maxY - 1}`,
      field: 'y',
      value: validCoord.y
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  }
}
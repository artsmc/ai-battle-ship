/**
 * Board Class
 * Manages the game board grid, ship placement, and hit/miss tracking
 */

import {
  BoardState,
  BoardCell,
  BoardValidation,
  Coordinate,
  ShipPosition,
  Orientation,
  ValidationResult,
  Bounds
} from './types'
import { Ship } from './Ship'

export class Board {
  private readonly width: number
  private readonly height: number
  private cells: BoardCell[][]
  private ships: Map<string, ShipPosition>
  private hits: Set<string>
  private misses: Set<string>

  constructor(width: number = 10, height: number = 10) {
    this.width = width
    this.height = height
    this.cells = this.initializeCells()
    this.ships = new Map()
    this.hits = new Set()
    this.misses = new Set()
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeCells(): BoardCell[][] {
    return Array(this.height).fill(null).map((_, y) =>
      Array(this.width).fill(null).map((_, x) => ({
        coordinate: { x, y },
        hasShip: false,
        isHit: false,
        isRevealed: false
      }))
    )
  }

  reset(): void {
    this.cells = this.initializeCells()
    this.ships.clear()
    this.hits.clear()
    this.misses.clear()
  }

  // =============================================
  // SHIP PLACEMENT
  // =============================================

  placeShip(ship: Ship, startCoordinate: Coordinate, orientation: Orientation): ValidationResult {
    // Calculate ship coordinates
    const coordinates = this.calculateShipCoordinates(
      startCoordinate,
      ship.size,
      orientation
    )

    // Validate placement
    const validation = this.validateShipPlacement(ship.id, coordinates)
    if (!validation.isValid) {
      return validation
    }

    // Create ship position
    const position: ShipPosition = {
      shipId: ship.id,
      coordinates,
      orientation,
      startPosition: startCoordinate
    }

    // Place ship on board
    this.ships.set(ship.id, position)
    coordinates.forEach(coord => {
      const cell = this.cells[coord.y][coord.x]
      cell.hasShip = true
      cell.shipId = ship.id
    })

    // Update ship's position
    ship.setPosition(startCoordinate, orientation)

    return { isValid: true, errors: [], warnings: [] }
  }

  removeShip(shipId: string): boolean {
    const position = this.ships.get(shipId)
    if (!position) {
      return false
    }

    // Clear cells
    position.coordinates.forEach(coord => {
      const cell = this.cells[coord.y][coord.x]
      cell.hasShip = false
      cell.shipId = undefined
    })

    this.ships.delete(shipId)
    return true
  }

  moveShip(shipId: string, newStart: Coordinate, newOrientation: Orientation, shipSize: number): ValidationResult {
    // Remove ship temporarily
    const oldPosition = this.ships.get(shipId)
    if (oldPosition) {
      this.removeShip(shipId)
    }

    // Calculate new coordinates
    const newCoordinates = this.calculateShipCoordinates(newStart, shipSize, newOrientation)

    // Validate new placement
    const validation = this.validateShipPlacement(shipId, newCoordinates)

    if (!validation.isValid) {
      // Restore old position if validation fails
      if (oldPosition) {
        this.ships.set(shipId, oldPosition)
        oldPosition.coordinates.forEach(coord => {
          const cell = this.cells[coord.y][coord.x]
          cell.hasShip = true
          cell.shipId = shipId
        })
      }
      return validation
    }

    // Place ship in new position
    const position: ShipPosition = {
      shipId,
      coordinates: newCoordinates,
      orientation: newOrientation,
      startPosition: newStart
    }

    this.ships.set(shipId, position)
    newCoordinates.forEach(coord => {
      const cell = this.cells[coord.y][coord.x]
      cell.hasShip = true
      cell.shipId = shipId
    })

    return { isValid: true, errors: [], warnings: [] }
  }

  private calculateShipCoordinates(
    start: Coordinate,
    size: number,
    orientation: Orientation
  ): Coordinate[] {
    const coordinates: Coordinate[] = []

    for (let i = 0; i < size; i++) {
      if (orientation === 'horizontal') {
        coordinates.push({ x: start.x + i, y: start.y })
      } else {
        coordinates.push({ x: start.x, y: start.y + i })
      }
    }

    return coordinates
  }

  private validateShipPlacement(shipId: string, coordinates: Coordinate[]): ValidationResult {
    const errors = []
    const warnings = []

    // Check bounds
    for (const coord of coordinates) {
      if (!this.isInBounds(coord)) {
        errors.push({
          code: 'OUT_OF_BOUNDS',
          message: `Coordinate (${coord.x}, ${coord.y}) is out of bounds`,
          field: 'coordinates',
          value: coord
        })
      }
    }

    // Check overlaps
    for (const coord of coordinates) {
      if (this.isInBounds(coord)) {
        const cell = this.cells[coord.y][coord.x]
        if (cell.hasShip && cell.shipId !== shipId) {
          errors.push({
            code: 'OVERLAP',
            message: `Position (${coord.x}, ${coord.y}) is already occupied by another ship`,
            field: 'coordinates',
            value: coord
          })
        }
      }
    }

    // Check adjacency (warning only)
    if (this.hasAdjacentShips(coordinates, shipId)) {
      warnings.push('Ships are placed adjacent to each other')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private hasAdjacentShips(coordinates: Coordinate[], excludeShipId?: string): boolean {
    const adjacentOffsets = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 1 }, { x: 1, y: 1 }
    ]

    for (const coord of coordinates) {
      for (const offset of adjacentOffsets) {
        const adjacent = {
          x: coord.x + offset.x,
          y: coord.y + offset.y
        }

        if (this.isInBounds(adjacent)) {
          const cell = this.cells[adjacent.y][adjacent.x]
          if (cell.hasShip && cell.shipId !== excludeShipId) {
            return true
          }
        }
      }
    }

    return false
  }

  // =============================================
  // ATTACK HANDLING
  // =============================================

  receiveAttack(coordinate: Coordinate): AttackInfo {
    if (!this.isInBounds(coordinate)) {
      return {
        valid: false,
        hit: false,
        shipId: undefined,
        alreadyHit: false
      }
    }

    const cell = this.cells[coordinate.y][coordinate.x]
    const coordinateKey = `${coordinate.x},${coordinate.y}`

    if (cell.isHit) {
      return {
        valid: true,
        hit: false,
        shipId: undefined,
        alreadyHit: true
      }
    }

    cell.isHit = true
    cell.hitAt = new Date()

    if (cell.hasShip && cell.shipId) {
      this.hits.add(coordinateKey)
      cell.hitBy = 'opponent' // This would be set by the game logic
      return {
        valid: true,
        hit: true,
        shipId: cell.shipId,
        alreadyHit: false
      }
    } else {
      this.misses.add(coordinateKey)
      return {
        valid: true,
        hit: false,
        shipId: undefined,
        alreadyHit: false
      }
    }
  }

  markCellAsHit(coordinate: Coordinate, hit: boolean): void {
    if (!this.isInBounds(coordinate)) {
      return
    }

    const cell = this.cells[coordinate.y][coordinate.x]
    const coordinateKey = `${coordinate.x},${coordinate.y}`

    cell.isHit = true
    cell.isRevealed = true
    cell.hitAt = new Date()

    if (hit) {
      this.hits.add(coordinateKey)
    } else {
      this.misses.add(coordinateKey)
    }
  }

  // =============================================
  // BOARD QUERIES
  // =============================================

  getCell(coordinate: Coordinate): BoardCell | null {
    if (!this.isInBounds(coordinate)) {
      return null
    }
    return this.cells[coordinate.y][coordinate.x]
  }

  getCellsInArea(center: Coordinate, radius: number): BoardCell[] {
    const cells: BoardCell[] = []

    for (let y = center.y - radius; y <= center.y + radius; y++) {
      for (let x = center.x - radius; x <= center.x + radius; x++) {
        if (this.isInBounds({ x, y })) {
          cells.push(this.cells[y][x])
        }
      }
    }

    return cells
  }

  getShipPosition(shipId: string): ShipPosition | undefined {
    return this.ships.get(shipId)
  }

  getAllShipPositions(): ShipPosition[] {
    return Array.from(this.ships.values())
  }

  isAllShipsPlaced(requiredShipCount: number): boolean {
    return this.ships.size === requiredShipCount
  }

  isInBounds(coordinate: Coordinate): boolean {
    return coordinate.x >= 0 && coordinate.x < this.width &&
           coordinate.y >= 0 && coordinate.y < this.height
  }

  // =============================================
  // VALIDATION
  // =============================================

  validateBoard(): BoardValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if board is properly initialized
    if (this.cells.length !== this.height) {
      errors.push('Board height mismatch')
    }

    for (let y = 0; y < this.height; y++) {
      if (this.cells[y].length !== this.width) {
        errors.push(`Row ${y} width mismatch`)
      }
    }

    // Check ship placement consistency
    for (const [shipId, position] of Array.from(this.ships.entries())) {
      for (const coord of position.coordinates) {
        if (!this.isInBounds(coord)) {
          errors.push(`Ship ${shipId} has out-of-bounds coordinate`)
        } else {
          const cell = this.cells[coord.y][coord.x]
          if (!cell.hasShip || cell.shipId !== shipId) {
            errors.push(`Ship ${shipId} position inconsistency at (${coord.x}, ${coord.y})`)
          }
        }
      }
    }

    // Check for orphaned ship cells
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x]
        if (cell.hasShip && cell.shipId) {
          if (!this.ships.has(cell.shipId)) {
            warnings.push(`Orphaned ship reference at (${x}, ${y})`)
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // =============================================
  // STATISTICS
  // =============================================

  getStatistics(): BoardStatistics {
    let totalCells = 0
    let hitCells = 0
    let shipCells = 0
    let revealedCells = 0

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x]
        totalCells++
        if (cell.isHit) hitCells++
        if (cell.hasShip) shipCells++
        if (cell.isRevealed) revealedCells++
      }
    }

    return {
      totalCells,
      hitCells,
      shipCells,
      revealedCells,
      hits: this.hits.size,
      misses: this.misses.size,
      accuracy: this.hits.size + this.misses.size > 0
        ? (this.hits.size / (this.hits.size + this.misses.size)) * 100
        : 0
    }
  }

  // =============================================
  // EXPORT AND SERIALIZATION
  // =============================================

  getState(): BoardState {
    return {
      width: this.width,
      height: this.height,
      cells: this.cells.map(row => row.map(cell => ({ ...cell }))),
      ships: new Map(this.ships),
      hits: Array.from(this.hits).map(key => {
        const [x, y] = key.split(',').map(Number)
        return { x, y }
      }),
      misses: Array.from(this.misses).map(key => {
        const [x, y] = key.split(',').map(Number)
        return { x, y }
      })
    }
  }

  getBounds(): Bounds {
    return {
      minX: 0,
      maxX: this.width - 1,
      minY: 0,
      maxY: this.height - 1
    }
  }

  getDimensions(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height
    }
  }
}

// =============================================
// TYPES
// =============================================

export interface AttackInfo {
  valid: boolean
  hit: boolean
  shipId?: string
  alreadyHit: boolean
}

export interface BoardStatistics {
  totalCells: number
  hitCells: number
  shipCells: number
  revealedCells: number
  hits: number
  misses: number
  accuracy: number
}
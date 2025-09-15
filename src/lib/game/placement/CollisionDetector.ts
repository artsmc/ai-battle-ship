/**
 * Collision Detector
 *
 * Advanced collision detection algorithms for ship placement including:
 * - Real-time collision detection during drag operations
 * - Predictive collision analysis
 * - Multi-level collision checking (overlap, adjacency, proximity)
 * - Performance-optimized spatial queries
 */

import {
  Coordinate,
  Orientation,
  GameShip,
  ShipPosition,
  BoardState,
  Bounds
} from '../types'
import { Board } from '../Board'

export interface CollisionResult {
  hasCollision: boolean
  collisionType: CollisionType
  conflictingShips: string[]
  conflictingCoordinates: Coordinate[]
  severity: CollisionSeverity
  description: string
}

export type CollisionType =
  | 'none'
  | 'overlap'
  | 'adjacent'
  | 'proximity'
  | 'boundary'

export type CollisionSeverity =
  | 'none'
  | 'warning'
  | 'error'
  | 'critical'

export interface ProximityZone {
  coordinates: Coordinate[]
  type: 'buffer' | 'danger' | 'restricted'
  radius: number
}

export interface CollisionMap {
  occupiedCells: Set<string>
  shipBoundaries: Map<string, Coordinate[]>
  restrictedZones: ProximityZone[]
  adjacencyMap: Map<string, Set<string>>
}

export interface DragCollisionState {
  draggedShipId: string
  currentPosition: Coordinate
  currentOrientation: Orientation
  previewCoordinates: Coordinate[]
  collisionResult: CollisionResult
  isValidPosition: boolean
}

export class CollisionDetector {
  private readonly board: Board
  private collisionMap: CollisionMap
  private dragState?: DragCollisionState
  private spatialIndex: SpatialIndex

  constructor(board: Board) {
    this.board = board
    this.collisionMap = this.buildCollisionMap()
    this.spatialIndex = new SpatialIndex(board.getBounds())
    this.refreshCollisionMap()
  }

  // =============================================
  // CORE COLLISION DETECTION
  // =============================================

  detectCollision(
    shipId: string,
    shipSize: number,
    startPosition: Coordinate,
    orientation: Orientation,
    excludeShipId?: string
  ): CollisionResult {
    const coordinates = this.calculateShipCoordinates(startPosition, shipSize, orientation)

    // Check boundary collisions first (most critical)
    const boundaryCollision = this.checkBoundaryCollision(coordinates)
    if (boundaryCollision.hasCollision) {
      return boundaryCollision
    }

    // Check direct overlaps (critical)
    const overlapCollision = this.checkOverlapCollision(coordinates, excludeShipId)
    if (overlapCollision.hasCollision) {
      return overlapCollision
    }

    // Check adjacency violations (error level)
    const adjacencyCollision = this.checkAdjacencyCollision(coordinates, excludeShipId)
    if (adjacencyCollision.hasCollision) {
      return adjacencyCollision
    }

    // Check proximity warnings
    const proximityCollision = this.checkProximityCollision(coordinates, excludeShipId)
    if (proximityCollision.hasCollision) {
      return proximityCollision
    }

    return {
      hasCollision: false,
      collisionType: 'none',
      conflictingShips: [],
      conflictingCoordinates: [],
      severity: 'none',
      description: 'No collisions detected'
    }
  }

  private checkBoundaryCollision(coordinates: Coordinate[]): CollisionResult {
    const bounds = this.board.getBounds()
    const invalidCoordinates: Coordinate[] = []

    for (const coord of coordinates) {
      if (coord.x < bounds.minX || coord.x > bounds.maxX ||
          coord.y < bounds.minY || coord.y > bounds.maxY) {
        invalidCoordinates.push(coord)
      }
    }

    if (invalidCoordinates.length > 0) {
      return {
        hasCollision: true,
        collisionType: 'boundary',
        conflictingShips: [],
        conflictingCoordinates: invalidCoordinates,
        severity: 'critical',
        description: `Ship extends outside game board at ${invalidCoordinates.length} position(s)`
      }
    }

    return {
      hasCollision: false,
      collisionType: 'none',
      conflictingShips: [],
      conflictingCoordinates: [],
      severity: 'none',
      description: ''
    }
  }

  private checkOverlapCollision(coordinates: Coordinate[], excludeShipId?: string): CollisionResult {
    const conflictingShips = new Set<string>()
    const conflictingCoordinates: Coordinate[] = []

    for (const coord of coordinates) {
      const cell = this.board.getCell(coord)
      if (cell?.hasShip && cell.shipId && cell.shipId !== excludeShipId) {
        conflictingShips.add(cell.shipId)
        conflictingCoordinates.push(coord)
      }
    }

    if (conflictingShips.size > 0) {
      return {
        hasCollision: true,
        collisionType: 'overlap',
        conflictingShips: Array.from(conflictingShips),
        conflictingCoordinates,
        severity: 'critical',
        description: `Ship overlaps with ${conflictingShips.size} other ship(s)`
      }
    }

    return {
      hasCollision: false,
      collisionType: 'none',
      conflictingShips: [],
      conflictingCoordinates: [],
      severity: 'none',
      description: ''
    }
  }

  private checkAdjacencyCollision(coordinates: Coordinate[], excludeShipId?: string): CollisionResult {
    const conflictingShips = new Set<string>()
    const conflictingCoordinates: Coordinate[] = []

    // Check 8-directional adjacency (including diagonals)
    const adjacentOffsets = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                  { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
    ]

    for (const coord of coordinates) {
      for (const offset of adjacentOffsets) {
        const adjacent = { x: coord.x + offset.x, y: coord.y + offset.y }
        const cell = this.board.getCell(adjacent)

        if (cell?.hasShip && cell.shipId && cell.shipId !== excludeShipId) {
          conflictingShips.add(cell.shipId)

          // Only add the coordinate if it's not already in the list
          if (!conflictingCoordinates.some(c => c.x === adjacent.x && c.y === adjacent.y)) {
            conflictingCoordinates.push(adjacent)
          }
        }
      }
    }

    if (conflictingShips.size > 0) {
      return {
        hasCollision: true,
        collisionType: 'adjacent',
        conflictingShips: Array.from(conflictingShips),
        conflictingCoordinates,
        severity: 'error',
        description: `Ship is adjacent to ${conflictingShips.size} other ship(s)`
      }
    }

    return {
      hasCollision: false,
      collisionType: 'none',
      conflictingShips: [],
      conflictingCoordinates: [],
      severity: 'none',
      description: ''
    }
  }

  private checkProximityCollision(coordinates: Coordinate[], excludeShipId?: string): CollisionResult {
    const proximityRadius = 2
    const conflictingShips = new Set<string>()
    const conflictingCoordinates: Coordinate[] = []

    for (const coord of coordinates) {
      const nearbyShips = this.findShipsInRadius(coord, proximityRadius, excludeShipId)

      for (const shipId of nearbyShips) {
        conflictingShips.add(shipId)
      }
    }

    if (conflictingShips.size > 0) {
      return {
        hasCollision: true,
        collisionType: 'proximity',
        conflictingShips: Array.from(conflictingShips),
        conflictingCoordinates,
        severity: 'warning',
        description: `Ship is in proximity to ${conflictingShips.size} other ship(s)`
      }
    }

    return {
      hasCollision: false,
      collisionType: 'none',
      conflictingShips: [],
      conflictingCoordinates: [],
      severity: 'none',
      description: ''
    }
  }

  // =============================================
  // DRAG AND DROP COLLISION TRACKING
  // =============================================

  startDragTracking(
    shipId: string,
    shipSize: number,
    initialPosition: Coordinate,
    initialOrientation: Orientation
  ): void {
    const previewCoordinates = this.calculateShipCoordinates(
      initialPosition,
      shipSize,
      initialOrientation
    )

    this.dragState = {
      draggedShipId: shipId,
      currentPosition: initialPosition,
      currentOrientation: initialOrientation,
      previewCoordinates,
      collisionResult: this.detectCollision(
        shipId,
        shipSize,
        initialPosition,
        initialOrientation,
        shipId // Exclude self from collision detection
      ),
      isValidPosition: false
    }

    this.updateDragValidation()
  }

  updateDragPosition(
    newPosition: Coordinate,
    newOrientation?: Orientation
  ): DragCollisionState | null {
    if (!this.dragState) return null

    const orientation = newOrientation || this.dragState.currentOrientation
    const shipSize = this.dragState.previewCoordinates.length

    this.dragState.currentPosition = newPosition
    this.dragState.currentOrientation = orientation
    this.dragState.previewCoordinates = this.calculateShipCoordinates(
      newPosition,
      shipSize,
      orientation
    )

    this.dragState.collisionResult = this.detectCollision(
      this.dragState.draggedShipId,
      shipSize,
      newPosition,
      orientation,
      this.dragState.draggedShipId
    )

    this.updateDragValidation()

    return { ...this.dragState }
  }

  private updateDragValidation(): void {
    if (!this.dragState) return

    this.dragState.isValidPosition =
      !this.dragState.collisionResult.hasCollision ||
      this.dragState.collisionResult.severity === 'warning'
  }

  stopDragTracking(): DragCollisionState | null {
    const finalState = this.dragState ? { ...this.dragState } : null
    this.dragState = undefined
    return finalState
  }

  getDragState(): DragCollisionState | null {
    return this.dragState ? { ...this.dragState } : null
  }

  // =============================================
  // SPATIAL OPTIMIZATION
  // =============================================

  private findShipsInRadius(
    center: Coordinate,
    radius: number,
    excludeShipId?: string
  ): string[] {
    const foundShips = new Set<string>()

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue

        const checkCoord = { x: center.x + dx, y: center.y + dy }
        const cell = this.board.getCell(checkCoord)

        if (cell?.hasShip && cell.shipId && cell.shipId !== excludeShipId) {
          foundShips.add(cell.shipId)
        }
      }
    }

    return Array.from(foundShips)
  }

  private buildCollisionMap(): CollisionMap {
    const occupiedCells = new Set<string>()
    const shipBoundaries = new Map<string, Coordinate[]>()
    const restrictedZones: ProximityZone[] = []
    const adjacencyMap = new Map<string, Set<string>>()

    // Build from current board state
    const shipPositions = this.board.getAllShipPositions()

    for (const position of shipPositions) {
      const shipId = position.shipId
      const coordinates = position.coordinates

      // Mark occupied cells
      for (const coord of coordinates) {
        occupiedCells.add(`${coord.x},${coord.y}`)
      }

      // Store ship boundaries
      shipBoundaries.set(shipId, [...coordinates])

      // Build adjacency map
      const adjacentShips = new Set<string>()
      for (const coord of coordinates) {
        const nearby = this.findShipsInRadius(coord, 1, shipId)
        nearby.forEach(id => adjacentShips.add(id))
      }
      adjacencyMap.set(shipId, adjacentShips)
    }

    return {
      occupiedCells,
      shipBoundaries,
      restrictedZones,
      adjacencyMap
    }
  }

  refreshCollisionMap(): void {
    this.collisionMap = this.buildCollisionMap()
    this.spatialIndex.rebuild(this.board.getAllShipPositions())
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

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

  getCollisionPreview(
    shipSize: number,
    position: Coordinate,
    orientation: Orientation
  ): CollisionPreview {
    const coordinates = this.calculateShipCoordinates(position, shipSize, orientation)
    const collision = this.detectCollision('preview', shipSize, position, orientation)

    return {
      coordinates,
      isValid: !collision.hasCollision || collision.severity === 'warning',
      collisionType: collision.collisionType,
      severity: collision.severity,
      affectedShips: collision.conflictingShips,
      warningMessage: collision.description
    }
  }

  canPlaceShipAt(
    shipSize: number,
    position: Coordinate,
    orientation: Orientation,
    allowWarnings: boolean = true
  ): boolean {
    const collision = this.detectCollision('temp', shipSize, position, orientation)

    if (!collision.hasCollision) return true

    return allowWarnings && collision.severity === 'warning'
  }

  getAllValidPositions(shipSize: number): Coordinate[] {
    const validPositions: Coordinate[] = []
    const bounds = this.board.getBounds()

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const position = { x, y }

        for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
          if (this.canPlaceShipAt(shipSize, position, orientation, false)) {
            validPositions.push({ ...position })
            break // Only need one orientation per position
          }
        }
      }
    }

    return validPositions
  }
}

// =============================================
// SPATIAL INDEX FOR PERFORMANCE
// =============================================

class SpatialIndex {
  private readonly bounds: Bounds
  private readonly cellSize: number
  private grid: Map<string, Set<string>>

  constructor(bounds: Bounds, cellSize: number = 2) {
    this.bounds = bounds
    this.cellSize = cellSize
    this.grid = new Map()
  }

  rebuild(shipPositions: ShipPosition[]): void {
    this.grid.clear()

    for (const position of shipPositions) {
      for (const coord of position.coordinates) {
        const cellKey = this.getCellKey(coord)

        if (!this.grid.has(cellKey)) {
          this.grid.set(cellKey, new Set())
        }

        this.grid.get(cellKey)!.add(position.shipId)
      }
    }
  }

  private getCellKey(coord: Coordinate): string {
    const cellX = Math.floor(coord.x / this.cellSize)
    const cellY = Math.floor(coord.y / this.cellSize)
    return `${cellX},${cellY}`
  }

  getShipsNear(coord: Coordinate): string[] {
    const cellKey = this.getCellKey(coord)
    const ships = this.grid.get(cellKey)
    return ships ? Array.from(ships) : []
  }
}

// =============================================
// TYPES
// =============================================

export interface CollisionPreview {
  coordinates: Coordinate[]
  isValid: boolean
  collisionType: CollisionType
  severity: CollisionSeverity
  affectedShips: string[]
  warningMessage: string
}
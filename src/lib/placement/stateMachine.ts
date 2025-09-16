/**
 * Placement State Machine
 * Manages state transitions for ship placement interactions
 *
 * Part of TASK 2: Konva.js State Machine
 * State transitions: idle→selecting→preview→placing→editing
 */

import { Orientation } from '../game/types'
import {
  Cell,
  PlacedShip,
  PlacementRules,
  STANDARD_RULES,
  STANDARD_FLEET
} from './types'
import {
  cellsForShip,
  validatePlacement,
  createPlacedShip,
  removeShip,
  findShipAtCell
} from './domain'
import { scorePlacement } from './scoring'

// =============================================
// STATE MACHINE TYPES
// =============================================

export type UiMode = 'idle' | 'selecting' | 'preview' | 'placing' | 'editing'

export type ShipKind = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'

export interface ShipSpec {
  kind: ShipKind
  length: number
  name: string
  maxCount: number
}

export interface PlacementPreview {
  origin: Cell
  orientation: Orientation
  cells: Cell[]
  isValid: boolean
  reason?: string
}

export interface PlacementState {
  mode: UiMode
  selectedShipKind?: ShipKind
  preview?: PlacementPreview
  editingShipId?: string
  placedShips: PlacedShip[]
  availableShips: Map<ShipKind, number>
  rules: PlacementRules
  placementScore: number
  placementGrade: 'A' | 'B' | 'C' | 'D'
}

export interface PlacementActions {
  selectShip: (kind: ShipKind) => void
  deselectShip: () => void
  previewShip: (cell: Cell, orientation?: Orientation) => void
  clearPreview: () => void
  placeShip: (cell: Cell, orientation?: Orientation) => boolean
  editShip: (shipId: string) => void
  moveShip: (shipId: string, newCell: Cell, orientation?: Orientation) => boolean
  rotateShip: (shipId?: string) => boolean
  removeShip: (shipId: string) => void
  autoPlaceRemaining: () => void
  clearAllShips: () => void
  cancelEdit: () => void
}

// =============================================
// SHIP SPECIFICATIONS
// =============================================

export const SHIP_SPECS: Record<ShipKind, ShipSpec> = {
  carrier: { kind: 'carrier', length: 5, name: 'Aircraft Carrier', maxCount: 1 },
  battleship: { kind: 'battleship', length: 4, name: 'Battleship', maxCount: 1 },
  cruiser: { kind: 'cruiser', length: 3, name: 'Cruiser', maxCount: 1 },
  submarine: { kind: 'submarine', length: 3, name: 'Submarine', maxCount: 1 },
  destroyer: { kind: 'destroyer', length: 2, name: 'Destroyer', maxCount: 1 }
}

// =============================================
// STATE MACHINE IMPLEMENTATION
// =============================================

export class PlacementStateMachine {
  private state: PlacementState
  private listeners: Array<(state: PlacementState) => void> = []

  constructor(rules: PlacementRules = STANDARD_RULES) {
    this.state = this.createInitialState(rules)
  }

  private createInitialState(rules: PlacementRules): PlacementState {
    const availableShips = new Map<ShipKind, number>()
    Object.values(SHIP_SPECS).forEach(spec => {
      availableShips.set(spec.kind, spec.maxCount)
    })

    return {
      mode: 'idle',
      placedShips: [],
      availableShips,
      rules,
      placementScore: 0,
      placementGrade: 'D'
    }
  }

  // =============================================
  // STATE ACCESS
  // =============================================

  getState(): PlacementState {
    return { ...this.state }
  }

  subscribe(listener: (state: PlacementState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private updateState(updates: Partial<PlacementState>): void {
    this.state = { ...this.state, ...updates }
    this.recalculateScore()
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  private recalculateScore(): void {
    if (this.state.placedShips.length > 0) {
      const quality = scorePlacement(this.state.placedShips, this.state.rules)
      this.state.placementScore = quality.score
      this.state.placementGrade = quality.grade
    } else {
      this.state.placementScore = 0
      this.state.placementGrade = 'D'
    }
  }

  // =============================================
  // STATE TRANSITIONS
  // =============================================

  selectShip(kind: ShipKind): boolean {
    // Can only select if ship is available
    const available = this.state.availableShips.get(kind) || 0
    if (available <= 0) return false

    // Clear any existing preview or editing
    this.updateState({
      mode: 'selecting',
      selectedShipKind: kind,
      preview: undefined,
      editingShipId: undefined
    })

    return true
  }

  deselectShip(): void {
    this.updateState({
      mode: 'idle',
      selectedShipKind: undefined,
      preview: undefined
    })
  }

  previewShip(cell: Cell, orientation: Orientation = 'horizontal'): void {
    if (this.state.mode !== 'selecting' && this.state.mode !== 'preview') return
    if (!this.state.selectedShipKind) return

    const spec = SHIP_SPECS[this.state.selectedShipKind]
    const cells = cellsForShip(cell, orientation, spec.length)
    const validation = validatePlacement(cell, orientation, spec.length, this.state.placedShips, this.state.rules)

    const preview: PlacementPreview = {
      origin: cell,
      orientation,
      cells,
      isValid: validation.valid,
      reason: validation.message
    }

    this.updateState({
      mode: 'preview',
      preview
    })
  }

  clearPreview(): void {
    if (this.state.mode === 'preview') {
      this.updateState({
        mode: this.state.selectedShipKind ? 'selecting' : 'idle',
        preview: undefined
      })
    }
  }

  placeShip(cell: Cell, orientation: Orientation = 'horizontal'): boolean {
    if (this.state.mode !== 'preview' && this.state.mode !== 'selecting') return false
    if (!this.state.selectedShipKind) return false

    const spec = SHIP_SPECS[this.state.selectedShipKind]
    const validation = validatePlacement(cell, orientation, spec.length, this.state.placedShips, this.state.rules)

    if (!validation.valid) return false

    // Create new ship
    const shipId = `${this.state.selectedShipKind}_${Date.now()}`
    const newShip = createPlacedShip(shipId, cell, orientation, spec.length)

    // Update available count
    const newAvailable = new Map(this.state.availableShips)
    const currentCount = newAvailable.get(this.state.selectedShipKind) || 0
    newAvailable.set(this.state.selectedShipKind, currentCount - 1)

    this.updateState({
      mode: 'idle',
      selectedShipKind: undefined,
      preview: undefined,
      placedShips: [...this.state.placedShips, newShip],
      availableShips: newAvailable
    })

    return true
  }

  editShip(shipId: string): boolean {
    const ship = this.state.placedShips.find(s => s.id === shipId)
    if (!ship) return false

    // Remove ship from placed ships temporarily
    const remainingShips = this.state.placedShips.filter(s => s.id !== shipId)

    // Return ship to available count
    const newAvailable = new Map(this.state.availableShips)
    const spec = SHIP_SPECS[ship.id.split('_')[0] as ShipKind]
    if (spec) {
      const currentCount = newAvailable.get(spec.kind) || 0
      newAvailable.set(spec.kind, currentCount + 1)
    }

    this.updateState({
      mode: 'editing',
      editingShipId: shipId,
      selectedShipKind: ship.id.split('_')[0] as ShipKind,
      placedShips: remainingShips,
      availableShips: newAvailable,
      preview: undefined
    })

    return true
  }

  moveShip(shipId: string, newCell: Cell, orientation?: Orientation): boolean {
    if (this.state.mode !== 'editing' || this.state.editingShipId !== shipId) return false

    const shipKind = shipId.split('_')[0] as ShipKind
    const spec = SHIP_SPECS[shipKind]
    const finalOrientation = orientation || 'horizontal'

    const validation = validatePlacement(newCell, finalOrientation, spec.length, this.state.placedShips, this.state.rules)
    if (!validation.valid) return false

    // Create updated ship
    const updatedShip = createPlacedShip(shipId, newCell, finalOrientation, spec.length)

    // Update available count (subtract since we're placing it back)
    const newAvailable = new Map(this.state.availableShips)
    const currentCount = newAvailable.get(shipKind) || 0
    newAvailable.set(shipKind, Math.max(0, currentCount - 1))

    this.updateState({
      mode: 'idle',
      editingShipId: undefined,
      selectedShipKind: undefined,
      placedShips: [...this.state.placedShips, updatedShip],
      availableShips: newAvailable,
      preview: undefined
    })

    return true
  }

  rotateShip(shipId?: string): boolean {
    // Rotate during preview
    if (this.state.mode === 'preview' && this.state.preview) {
      const newOrientation: Orientation = this.state.preview.orientation === 'horizontal' ? 'vertical' : 'horizontal'
      this.previewShip(this.state.preview.origin, newOrientation)
      return true
    }

    // Rotate during editing
    if (this.state.mode === 'editing' && shipId && this.state.editingShipId === shipId) {
      const ship = this.state.placedShips.find(s => s.id === shipId)
      if (!ship) return false

      const newOrientation: Orientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal'
      const validation = validatePlacement(ship.origin, newOrientation, ship.length, this.state.placedShips, this.state.rules)

      if (validation.valid) {
        return this.moveShip(shipId, ship.origin, newOrientation)
      }
    }

    // Rotate placed ship directly
    if (this.state.mode === 'idle' && shipId) {
      const ship = this.state.placedShips.find(s => s.id === shipId)
      if (!ship) return false

      const newOrientation: Orientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal'
      const otherShips = this.state.placedShips.filter(s => s.id !== shipId)
      const validation = validatePlacement(ship.origin, newOrientation, ship.length, otherShips, this.state.rules)

      if (validation.valid) {
        const updatedShip = createPlacedShip(ship.id, ship.origin, newOrientation, ship.length)
        const updatedShips = this.state.placedShips.map(s => s.id === shipId ? updatedShip : s)

        this.updateState({
          placedShips: updatedShips
        })
        return true
      }
    }

    return false
  }

  removeShip(shipId: string): boolean {
    const ship = this.state.placedShips.find(s => s.id === shipId)
    if (!ship) return false

    // Return ship to available count
    const shipKind = shipId.split('_')[0] as ShipKind
    const newAvailable = new Map(this.state.availableShips)
    const currentCount = newAvailable.get(shipKind) || 0
    newAvailable.set(shipKind, currentCount + 1)

    this.updateState({
      mode: 'idle',
      placedShips: removeShip(shipId, this.state.placedShips),
      availableShips: newAvailable,
      selectedShipKind: undefined,
      preview: undefined,
      editingShipId: undefined
    })

    return true
  }

  cancelEdit(): void {
    if (this.state.mode === 'editing' && this.state.editingShipId) {
      // Return the ship being edited to the board
      const shipKind = this.state.editingShipId.split('_')[0] as ShipKind
      const spec = SHIP_SPECS[shipKind]

      // Find original ship data (would need to be stored)
      // For now, just cancel and return to idle
      const newAvailable = new Map(this.state.availableShips)
      const currentCount = newAvailable.get(shipKind) || 0
      newAvailable.set(shipKind, Math.max(0, currentCount - 1))

      this.updateState({
        mode: 'idle',
        editingShipId: undefined,
        selectedShipKind: undefined,
        preview: undefined,
        availableShips: newAvailable
      })
    } else if (this.state.mode === 'preview' || this.state.mode === 'selecting') {
      this.deselectShip()
    }
  }

  autoPlaceRemaining(): void {
    // Simple auto-placement algorithm
    const newPlacedShips = [...this.state.placedShips]
    const newAvailable = new Map(this.state.availableShips)

    for (const [kind, count] of this.state.availableShips.entries()) {
      if (count <= 0) continue

      const spec = SHIP_SPECS[kind]

      for (let i = 0; i < count; i++) {
        // Try to find a valid placement
        let placed = false

        for (let y = 0; y < this.state.rules.boardSize && !placed; y++) {
          for (let x = 0; x < this.state.rules.boardSize && !placed; x++) {
            for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
              const cell = { x, y }
              const validation = validatePlacement(cell, orientation, spec.length, newPlacedShips, this.state.rules)

              if (validation.valid) {
                const shipId = `${kind}_auto_${Date.now()}_${i}`
                const newShip = createPlacedShip(shipId, cell, orientation, spec.length)
                newPlacedShips.push(newShip)
                newAvailable.set(kind, (newAvailable.get(kind) || 0) - 1)
                placed = true
                break
              }
            }
          }
        }
      }
    }

    this.updateState({
      mode: 'idle',
      placedShips: newPlacedShips,
      availableShips: newAvailable,
      selectedShipKind: undefined,
      preview: undefined,
      editingShipId: undefined
    })
  }

  clearAllShips(): void {
    const availableShips = new Map<ShipKind, number>()
    Object.values(SHIP_SPECS).forEach(spec => {
      availableShips.set(spec.kind, spec.maxCount)
    })

    this.updateState({
      mode: 'idle',
      placedShips: [],
      availableShips,
      selectedShipKind: undefined,
      preview: undefined,
      editingShipId: undefined
    })
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  canPlaceShip(kind: ShipKind): boolean {
    return (this.state.availableShips.get(kind) || 0) > 0
  }

  isFleetComplete(): boolean {
    return Array.from(this.state.availableShips.values()).every(count => count === 0)
  }

  getTotalShipsPlaced(): number {
    return this.state.placedShips.length
  }

  getTotalShipsRemaining(): number {
    return Array.from(this.state.availableShips.values()).reduce((sum, count) => sum + count, 0)
  }

  getShipAtCell(cell: Cell): PlacedShip | undefined {
    return findShipAtCell(cell, this.state.placedShips)
  }

  validateCurrentState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for ship overlaps
    for (let i = 0; i < this.state.placedShips.length; i++) {
      for (let j = i + 1; j < this.state.placedShips.length; j++) {
        const ship1 = this.state.placedShips[i]
        const ship2 = this.state.placedShips[j]

        if (ship1.cells.some(c1 => ship2.cells.some(c2 => c1.x === c2.x && c1.y === c2.y))) {
          errors.push(`Ships ${ship1.id} and ${ship2.id} overlap`)
        }
      }
    }

    // Check bounds
    for (const ship of this.state.placedShips) {
      for (const cell of ship.cells) {
        if (cell.x < 0 || cell.x >= this.state.rules.boardSize ||
            cell.y < 0 || cell.y >= this.state.rules.boardSize) {
          errors.push(`Ship ${ship.id} extends outside board boundaries`)
        }
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  getActions(): PlacementActions {
    return {
      selectShip: (kind) => this.selectShip(kind),
      deselectShip: () => this.deselectShip(),
      previewShip: (cell, orientation) => this.previewShip(cell, orientation),
      clearPreview: () => this.clearPreview(),
      placeShip: (cell, orientation) => this.placeShip(cell, orientation),
      editShip: (shipId) => this.editShip(shipId),
      moveShip: (shipId, cell, orientation) => this.moveShip(shipId, cell, orientation),
      rotateShip: (shipId) => this.rotateShip(shipId),
      removeShip: (shipId) => this.removeShip(shipId),
      autoPlaceRemaining: () => this.autoPlaceRemaining(),
      clearAllShips: () => this.clearAllShips(),
      cancelEdit: () => this.cancelEdit()
    }
  }

  reset(): void {
    this.state = this.createInitialState(this.state.rules)
    this.notifyListeners()
  }
}
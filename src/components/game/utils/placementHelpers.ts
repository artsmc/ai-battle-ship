/**
 * Ship Placement Utility Functions
 *
 * Helper functions for ship placement operations including:
 * - Fleet generation
 * - Time formatting
 * - History entry creation
 * - Tutorial hint generation
 */

import { GameShip, Coordinate, Orientation } from '@/lib/game/types'
import { Ship } from '@/lib/game/Ship'

// Fleet composition configuration
export const DEFAULT_FLEET_COMPOSITION = [
  { size: 5, count: 1, name: 'Carrier' },
  { size: 4, count: 1, name: 'Battleship' },
  { size: 3, count: 2, name: 'Cruiser' },
  { size: 2, count: 3, name: 'Destroyer' }
] as const

// Type definitions for placement utilities
export interface PlacementHistoryEntry {
  action: 'place' | 'move' | 'rotate' | 'remove' | 'auto_place'
  shipId: string
  position?: Coordinate
  orientation?: Orientation
  timestamp: Date
}

export interface TutorialHint {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  persistent?: boolean
}

/**
 * Generates initial fleet based on default composition
 * @param playerId - The player ID for the fleet
 * @returns Array of GameShip objects
 */
export function generateFleet(playerId: string): GameShip[] {
  const ships: GameShip[] = []
  for (const shipType of DEFAULT_FLEET_COMPOSITION) {
    for (let i = 0; i < shipType.count; i++) {
      const ship = new Ship({
        typeId: `${shipType.name.toLowerCase()}-${i + 1}`,
        name: `${shipType.name} ${shipType.count > 1 ? i + 1 : ''}`.trim(),
        class: shipType.name.toLowerCase() as 'carrier' | 'battleship' | 'cruiser' | 'destroyer',
        size: shipType.size,
        hitPoints: shipType.size,
        playerId,
        abilities: []
      })

      ships.push(ship.toJSON())
    }
  }

  return ships
}

/**
 * Formats time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Creates a placement history entry
 * @param action - The action performed
 * @param shipId - ID of the ship involved
 * @param position - Optional position coordinate
 * @param orientation - Optional ship orientation
 * @returns PlacementHistoryEntry object
 */
export function createHistoryEntry(
  action: PlacementHistoryEntry['action'],
  shipId: string,
  position?: Coordinate,
  orientation?: Orientation
): PlacementHistoryEntry {
  return {
    action,
    shipId,
    position,
    orientation,
    timestamp: new Date()
  }
}

/**
 * Generates tutorial hints based on placement progress
 * @param placedShips - Number of ships placed
 * @param totalShips - Total number of ships in fleet
 * @param isValid - Whether current fleet composition is valid
 * @param canProceed - Whether player can proceed to battle
 * @returns TutorialHint or null
 */
export function generateTutorialHint(
  placedShips: number,
  totalShips: number,
  isValid: boolean,
  canProceed: boolean
): TutorialHint | null {
  if (placedShips === 0) {
    return {
      id: 'first_ship',
      title: 'Place Your First Ship',
      message: 'Select a ship from the fleet panel and click on the grid to place it, or drag it directly onto the board.',
      type: 'info'
    }
  }

  if (placedShips === 1) {
    return {
      id: 'rotate_ship',
      title: 'Rotate Ships',
      message: 'Double-click a ship or use the rotate button to change its orientation between horizontal and vertical.',
      type: 'info'
    }
  }

  if (placedShips === totalShips && !isValid) {
    return {
      id: 'invalid_fleet',
      title: 'Fleet Validation',
      message: 'Your fleet composition is invalid. Check that all ships are placed and no ships are overlapping.',
      type: 'warning'
    }
  }

  if (canProceed) {
    return {
      id: 'ready_to_battle',
      title: 'Ready for Battle!',
      message: 'All ships are placed correctly. You can now proceed to battle.',
      type: 'success'
    }
  }

  return null
}

/**
 * Validates if a player can complete placement
 * @param ships - Array of ships in the fleet
 * @param isValid - Whether fleet composition is valid
 * @returns boolean indicating if placement can be completed
 */
export function canCompleteFleetPlacement(ships: GameShip[], isValid: boolean): boolean {
  const placedShips = ships.filter(ship => ship.position).length
  const totalShips = ships.length
  return placedShips === totalShips && isValid
}
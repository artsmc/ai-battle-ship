/**
 * Types and Interfaces for AutoPlacer Strategy System
 */

import { Coordinate, Orientation, GameShip } from '../../types'

export interface AutoPlacementConfig {
  strategy: PlacementStrategy
  maxAttempts: number
  allowAdjacency: boolean
  preferEdges: boolean
  clusteringFactor: number
  randomnessFactor: number
  timeoutMs: number
}

export type PlacementStrategy =
  | 'random'
  | 'strategic'
  | 'balanced'
  | 'clustered'
  | 'dispersed'
  | 'pattern'

export interface PlacementResult {
  success: boolean
  placements: ShipPlacement[]
  attempts: number
  duration: number
  strategy: PlacementStrategy
  failureReason?: string
}

export interface ShipPlacement {
  shipId: string
  shipSize: number
  position: Coordinate
  orientation: Orientation
  score: number
}

export interface PlacementScore {
  total: number
  coverage: number
  spacing: number
  edge: number
  center: number
  clustering: number
  strategic: number
}

export interface PlacementConstraint {
  shipId: string
  requiredPosition?: Coordinate
  requiredOrientation?: Orientation
  forbiddenAreas?: Coordinate[]
  minDistanceFromEdge?: number
  maxDistanceFromEdge?: number
}

export interface PlacementPattern {
  position: Coordinate
  orientation: Orientation
}
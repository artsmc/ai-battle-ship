/**
 * Coordinate Utilities
 * Helper functions for coordinate and position operations
 */

import { Coordinate, Orientation, Bounds } from '../types'

// =============================================
// COORDINATE OPERATIONS
// =============================================

export function areCoordinatesEqual(a: Coordinate, b: Coordinate): boolean {
  return a.x === b.x && a.y === b.y
}

export function isCoordinateInBounds(coord: Coordinate, bounds: Bounds): boolean {
  return coord.x >= bounds.minX && coord.x <= bounds.maxX &&
         coord.y >= bounds.minY && coord.y <= bounds.maxY
}

export function getDistance(a: Coordinate, b: Coordinate): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

export function getManhattanDistance(a: Coordinate, b: Coordinate): number {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
}

// =============================================
// COORDINATE GENERATION
// =============================================

export function generateLineCoordinates(
  start: Coordinate,
  length: number,
  orientation: Orientation
): Coordinate[] {
  const coordinates: Coordinate[] = []

  for (let i = 0; i < length; i++) {
    if (orientation === 'horizontal') {
      coordinates.push({ x: start.x + i, y: start.y })
    } else {
      coordinates.push({ x: start.x, y: start.y + i })
    }
  }

  return coordinates
}

export function getAdjacentCoordinates(
  coord: Coordinate,
  includeDiagonals: boolean = false
): Coordinate[] {
  const adjacent: Coordinate[] = [
    { x: coord.x - 1, y: coord.y },     // left
    { x: coord.x + 1, y: coord.y },     // right
    { x: coord.x, y: coord.y - 1 },     // up
    { x: coord.x, y: coord.y + 1 }      // down
  ]

  if (includeDiagonals) {
    adjacent.push(
      { x: coord.x - 1, y: coord.y - 1 }, // top-left
      { x: coord.x + 1, y: coord.y - 1 }, // top-right
      { x: coord.x - 1, y: coord.y + 1 }, // bottom-left
      { x: coord.x + 1, y: coord.y + 1 }  // bottom-right
    )
  }

  return adjacent
}

export function getCoordinatesInRadius(
  center: Coordinate,
  radius: number,
  bounds?: Bounds
): Coordinate[] {
  const coordinates: Coordinate[] = []

  for (let y = center.y - radius; y <= center.y + radius; y++) {
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      const coord = { x, y }

      if (bounds && !isCoordinateInBounds(coord, bounds)) {
        continue
      }

      const distance = getDistance(center, coord)
      if (distance <= radius) {
        coordinates.push(coord)
      }
    }
  }

  return coordinates
}

export function getCoordinatesInSquare(
  center: Coordinate,
  size: number,
  bounds?: Bounds
): Coordinate[] {
  const coordinates: Coordinate[] = []
  const halfSize = Math.floor(size / 2)

  for (let y = center.y - halfSize; y <= center.y + halfSize; y++) {
    for (let x = center.x - halfSize; x <= center.x + halfSize; x++) {
      const coord = { x, y }

      if (bounds && !isCoordinateInBounds(coord, bounds)) {
        continue
      }

      coordinates.push(coord)
    }
  }

  return coordinates
}

// =============================================
// COORDINATE VALIDATION
// =============================================

export function areCoordinatesContiguous(coordinates: Coordinate[]): boolean {
  if (coordinates.length <= 1) {
    return true
  }

  // Check if all coordinates form a line (horizontal or vertical)
  const isHorizontal = coordinates.every(c => c.y === coordinates[0].y)
  const isVertical = coordinates.every(c => c.x === coordinates[0].x)

  if (!isHorizontal && !isVertical) {
    return false
  }

  // Sort coordinates
  const sorted = [...coordinates].sort((a, b) => {
    if (isHorizontal) {
      return a.x - b.x
    } else {
      return a.y - b.y
    }
  })

  // Check for gaps
  for (let i = 1; i < sorted.length; i++) {
    if (isHorizontal) {
      if (sorted[i].x - sorted[i - 1].x !== 1) {
        return false
      }
    } else {
      if (sorted[i].y - sorted[i - 1].y !== 1) {
        return false
      }
    }
  }

  return true
}

export function doCoordinatesOverlap(
  coords1: Coordinate[],
  coords2: Coordinate[]
): boolean {
  for (const c1 of coords1) {
    for (const c2 of coords2) {
      if (areCoordinatesEqual(c1, c2)) {
        return true
      }
    }
  }
  return false
}

// =============================================
// COORDINATE TRANSFORMATION
// =============================================

export function rotateCoordinate(
  coord: Coordinate,
  pivot: Coordinate,
  degrees: number
): Coordinate {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const dx = coord.x - pivot.x
  const dy = coord.y - pivot.y

  return {
    x: Math.round(pivot.x + dx * cos - dy * sin),
    y: Math.round(pivot.y + dx * sin + dy * cos)
  }
}

export function mirrorCoordinate(
  coord: Coordinate,
  axis: 'horizontal' | 'vertical',
  axisPosition: number
): Coordinate {
  if (axis === 'horizontal') {
    return {
      x: coord.x,
      y: 2 * axisPosition - coord.y
    }
  } else {
    return {
      x: 2 * axisPosition - coord.x,
      y: coord.y
    }
  }
}

export function translateCoordinate(
  coord: Coordinate,
  offset: Coordinate
): Coordinate {
  return {
    x: coord.x + offset.x,
    y: coord.y + offset.y
  }
}

// =============================================
// COORDINATE CONVERSION
// =============================================

export function coordinateToString(coord: Coordinate): string {
  return `${coord.x},${coord.y}`
}

export function stringToCoordinate(str: string): Coordinate | null {
  const parts = str.split(',')
  if (parts.length !== 2) {
    return null
  }

  const x = parseInt(parts[0], 10)
  const y = parseInt(parts[1], 10)

  if (isNaN(x) || isNaN(y)) {
    return null
  }

  return { x, y }
}

export function coordinateToAlgebraic(coord: Coordinate): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (coord.x < 0 || coord.x >= letters.length) {
    return `${coord.x},${coord.y}`
  }
  return `${letters[coord.x]}${coord.y + 1}`
}

export function algebraicToCoordinate(notation: string): Coordinate | null {
  const match = notation.match(/^([A-Z])(\d+)$/)
  if (!match) {
    return null
  }

  const x = match[1].charCodeAt(0) - 'A'.charCodeAt(0)
  const y = parseInt(match[2], 10) - 1

  return { x, y }
}

// =============================================
// PATH FINDING
// =============================================

export function getLineBetweenCoordinates(
  start: Coordinate,
  end: Coordinate
): Coordinate[] {
  const coordinates: Coordinate[] = []

  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const sx = start.x < end.x ? 1 : -1
  const sy = start.y < end.y ? 1 : -1

  let err = dx - dy
  const current = { ...start }

  while (true) {
    coordinates.push({ ...current })

    if (current.x === end.x && current.y === end.y) {
      break
    }

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      current.x += sx
    }

    if (e2 < dx) {
      err += dx
      current.y += sy
    }
  }

  return coordinates
}

// =============================================
// PATTERN DETECTION
// =============================================

export function findClusters(
  coordinates: Coordinate[],
  maxDistance: number = 1
): Coordinate[][] {
  if (coordinates.length === 0) {
    return []
  }

  const clusters: Coordinate[][] = []
  const visited = new Set<string>()

  for (const coord of coordinates) {
    const key = coordinateToString(coord)
    if (visited.has(key)) {
      continue
    }

    const cluster: Coordinate[] = []
    const queue = [coord]

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentKey = coordinateToString(current)

      if (visited.has(currentKey)) {
        continue
      }

      visited.add(currentKey)
      cluster.push(current)

      // Find nearby coordinates
      for (const other of coordinates) {
        const otherKey = coordinateToString(other)
        if (!visited.has(otherKey) && getManhattanDistance(current, other) <= maxDistance) {
          queue.push(other)
        }
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster)
    }
  }

  return clusters
}

export function getOrientation(coordinates: Coordinate[]): Orientation | null {
  if (coordinates.length < 2) {
    return null
  }

  const isHorizontal = coordinates.every(c => c.y === coordinates[0].y)
  const isVertical = coordinates.every(c => c.x === coordinates[0].x)

  if (isHorizontal) {
    return 'horizontal'
  } else if (isVertical) {
    return 'vertical'
  }

  return null
}
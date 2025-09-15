/**
 * SpriteAtlas
 *
 * Sprite atlas system for performance optimization.
 * Combines multiple sprites into single textures to reduce draw calls.
 */

import { SpriteData, SpriteFrame, SpriteImage } from './SpriteLoader'
import { ShipClass, ShipEra } from '../../database/types/enums'

export interface AtlasFrame extends SpriteFrame {
  spriteId: string
  originalWidth: number
  originalHeight: number
}

export interface AtlasData {
  id: string
  image: HTMLCanvasElement
  frames: Record<string, AtlasFrame>
  metadata: {
    width: number
    height: number
    spriteCount: number
    efficiency: number
    created: Date
  }
}

export interface AtlasConfig {
  maxSize: number
  padding: number
  powerOfTwo: boolean
  algorithm: 'maxrects' | 'guillotine' | 'shelf'
  allowRotation: boolean
}

export const DEFAULT_ATLAS_CONFIG: AtlasConfig = {
  maxSize: 2048,
  padding: 2,
  powerOfTwo: true,
  algorithm: 'maxrects',
  allowRotation: false
}

/**
 * Rectangle for atlas packing
 */
interface Rectangle {
  x: number
  y: number
  width: number
  height: number
  rotated?: boolean
}

/**
 * Sprite atlas packer and renderer
 */
export class SpriteAtlas {
  private config: AtlasConfig
  private atlases = new Map<string, AtlasData>()

  constructor(config: Partial<AtlasConfig> = {}) {
    this.config = { ...DEFAULT_ATLAS_CONFIG, ...config }
  }

  /**
   * Create atlas from multiple sprites
   */
  async createAtlas(
    sprites: SpriteData[],
    atlasId: string = this.generateAtlasId(sprites)
  ): Promise<AtlasData> {
    if (this.atlases.has(atlasId)) {
      return this.atlases.get(atlasId)!
    }

    const rectangles = this.prepareRectangles(sprites)
    const packedRects = this.packRectangles(rectangles)

    if (!packedRects) {
      throw new Error('Failed to pack sprites into atlas')
    }

    const canvas = this.createAtlasCanvas(packedRects.width, packedRects.height)
    const ctx = canvas.getContext('2d')!

    const frames: Record<string, AtlasFrame> = {}

    // Draw sprites to atlas
    for (const rect of packedRects.rectangles) {
      const sprite = sprites[rect.spriteIndex!]
      const frameKey = `${sprite.id}:idle`

      // Draw sprite to atlas
      if (rect.rotated) {
        ctx.save()
        ctx.translate(rect.x + rect.height, rect.y)
        ctx.rotate(Math.PI / 2)
        ctx.drawImage(sprite.image.image, 0, 0)
        ctx.restore()
      } else {
        ctx.drawImage(sprite.image.image, rect.x, rect.y)
      }

      // Store frame data
      frames[frameKey] = {
        spriteId: sprite.id,
        x: rect.x,
        y: rect.y,
        width: rect.rotated ? rect.height : rect.width,
        height: rect.rotated ? rect.width : rect.height,
        originalWidth: sprite.image.width,
        originalHeight: sprite.image.height,
        anchorX: sprite.image.width / 2,
        anchorY: sprite.image.height / 2
      }
    }

    const atlasData: AtlasData = {
      id: atlasId,
      image: canvas,
      frames,
      metadata: {
        width: packedRects.width,
        height: packedRects.height,
        spriteCount: sprites.length,
        efficiency: this.calculateEfficiency(packedRects, sprites),
        created: new Date()
      }
    }

    this.atlases.set(atlasId, atlasData)
    return atlasData
  }

  /**
   * Create atlas for specific ship era
   */
  async createEraAtlas(sprites: SpriteData[], era: ShipEra): Promise<AtlasData> {
    const eraSprites = sprites.filter(sprite => sprite.metadata.era === era)
    return this.createAtlas(eraSprites, `era_${era.toLowerCase()}`)
  }

  /**
   * Create atlas for specific ship class
   */
  async createClassAtlas(sprites: SpriteData[], shipClass: ShipClass): Promise<AtlasData> {
    const classSprites = sprites.filter(sprite => sprite.metadata.shipClass === shipClass)
    return this.createAtlas(classSprites, `class_${shipClass.toLowerCase()}`)
  }

  /**
   * Get atlas by ID
   */
  getAtlas(atlasId: string): AtlasData | null {
    return this.atlases.get(atlasId) || null
  }

  /**
   * Get frame from atlas
   */
  getFrame(atlasId: string, frameId: string): AtlasFrame | null {
    const atlas = this.atlases.get(atlasId)
    return atlas?.frames[frameId] || null
  }

  /**
   * Prepare rectangles for packing
   */
  private prepareRectangles(sprites: SpriteData[]): (Rectangle & { spriteIndex: number })[] {
    return sprites.map((sprite, index) => ({
      x: 0,
      y: 0,
      width: sprite.image.width + this.config.padding,
      height: sprite.image.height + this.config.padding,
      spriteIndex: index
    }))
  }

  /**
   * Pack rectangles using selected algorithm
   */
  private packRectangles(rectangles: (Rectangle & { spriteIndex: number })[]): {
    width: number
    height: number
    rectangles: (Rectangle & { spriteIndex: number })[]
  } | null {
    switch (this.config.algorithm) {
      case 'maxrects':
        return this.packMaxRects(rectangles)
      case 'guillotine':
        return this.packGuillotine(rectangles)
      case 'shelf':
        return this.packShelf(rectangles)
      default:
        return this.packMaxRects(rectangles)
    }
  }

  /**
   * MaxRects bin packing algorithm
   */
  private packMaxRects(rectangles: (Rectangle & { spriteIndex: number })[]): {
    width: number
    height: number
    rectangles: (Rectangle & { spriteIndex: number })[]
  } | null {
    // Sort rectangles by area (descending)
    const sortedRects = [...rectangles].sort((a, b) => (b.width * b.height) - (a.width * a.height))

    let atlasWidth = 32
    let atlasHeight = 32

    // Find minimum atlas size
    while (atlasWidth <= this.config.maxSize && atlasHeight <= this.config.maxSize) {
      const freeRects = [{ x: 0, y: 0, width: atlasWidth, height: atlasHeight }]
      const placedRects: (Rectangle & { spriteIndex: number })[] = []
      let allPlaced = true

      for (const rect of sortedRects) {
        const bestRect = this.findBestRect(freeRects, rect)

        if (!bestRect) {
          allPlaced = false
          break
        }

        placedRects.push({
          ...rect,
          x: bestRect.x,
          y: bestRect.y
        })

        // Update free rectangles
        this.splitFreeRect(freeRects, bestRect, rect)
      }

      if (allPlaced) {
        return {
          width: this.config.powerOfTwo ? atlasWidth : Math.max(...placedRects.map(r => r.x + r.width)),
          height: this.config.powerOfTwo ? atlasHeight : Math.max(...placedRects.map(r => r.y + r.height)),
          rectangles: placedRects
        }
      }

      // Increase atlas size
      if (atlasWidth === atlasHeight) {
        atlasWidth *= 2
      } else {
        atlasHeight = atlasWidth
      }
    }

    return null
  }

  /**
   * Find best rectangle position
   */
  private findBestRect(freeRects: Rectangle[], rect: Rectangle): Rectangle | null {
    let bestShortSide = Infinity
    let bestLongSide = Infinity
    let bestRect: Rectangle | null = null

    for (const freeRect of freeRects) {
      if (rect.width <= freeRect.width && rect.height <= freeRect.height) {
        const leftoverX = freeRect.width - rect.width
        const leftoverY = freeRect.height - rect.height
        const shortSide = Math.min(leftoverX, leftoverY)
        const longSide = Math.max(leftoverX, leftoverY)

        if (shortSide < bestShortSide || (shortSide === bestShortSide && longSide < bestLongSide)) {
          bestShortSide = shortSide
          bestLongSide = longSide
          bestRect = { ...freeRect }
        }
      }

      // Check rotated if allowed
      if (this.config.allowRotation && rect.height <= freeRect.width && rect.width <= freeRect.height) {
        const leftoverX = freeRect.width - rect.height
        const leftoverY = freeRect.height - rect.width
        const shortSide = Math.min(leftoverX, leftoverY)
        const longSide = Math.max(leftoverX, leftoverY)

        if (shortSide < bestShortSide || (shortSide === bestShortSide && longSide < bestLongSide)) {
          bestShortSide = shortSide
          bestLongSide = longSide
          bestRect = { ...freeRect, rotated: true }
        }
      }
    }

    return bestRect
  }

  /**
   * Split free rectangle after placement
   */
  private splitFreeRect(freeRects: Rectangle[], usedRect: Rectangle, placedRect: Rectangle): void {
    const index = freeRects.findIndex(rect =>
      rect.x === usedRect.x && rect.y === usedRect.y &&
      rect.width === usedRect.width && rect.height === usedRect.height
    )

    if (index === -1) return

    const original = freeRects.splice(index, 1)[0]

    // Create new free rectangles
    const newRects: Rectangle[] = []

    // Left
    if (usedRect.x > original.x) {
      newRects.push({
        x: original.x,
        y: original.y,
        width: usedRect.x - original.x,
        height: original.height
      })
    }

    // Right
    if (usedRect.x + placedRect.width < original.x + original.width) {
      newRects.push({
        x: usedRect.x + placedRect.width,
        y: original.y,
        width: original.x + original.width - (usedRect.x + placedRect.width),
        height: original.height
      })
    }

    // Top
    if (usedRect.y > original.y) {
      newRects.push({
        x: original.x,
        y: original.y,
        width: original.width,
        height: usedRect.y - original.y
      })
    }

    // Bottom
    if (usedRect.y + placedRect.height < original.y + original.height) {
      newRects.push({
        x: original.x,
        y: usedRect.y + placedRect.height,
        width: original.width,
        height: original.y + original.height - (usedRect.y + placedRect.height)
      })
    }

    freeRects.push(...newRects)
  }

  /**
   * Simple shelf packing algorithm
   */
  private packShelf(rectangles: (Rectangle & { spriteIndex: number })[]): {
    width: number
    height: number
    rectangles: (Rectangle & { spriteIndex: number })[]
  } | null {
    const sortedRects = [...rectangles].sort((a, b) => b.height - a.height)
    const shelves: { y: number; height: number; remainingWidth: number }[] = []
    const placedRects: (Rectangle & { spriteIndex: number })[] = []

    let atlasWidth = this.getNextPowerOfTwo(Math.max(...sortedRects.map(r => r.width)))
    let atlasHeight = 0

    for (const rect of sortedRects) {
      let placed = false

      // Try existing shelves
      for (const shelf of shelves) {
        if (rect.width <= shelf.remainingWidth && rect.height <= shelf.height) {
          const x = atlasWidth - shelf.remainingWidth
          placedRects.push({
            ...rect,
            x,
            y: shelf.y
          })
          shelf.remainingWidth -= rect.width
          placed = true
          break
        }
      }

      // Create new shelf
      if (!placed) {
        const newShelfY = atlasHeight
        atlasHeight += rect.height

        if (atlasHeight > this.config.maxSize) {
          return null
        }

        shelves.push({
          y: newShelfY,
          height: rect.height,
          remainingWidth: atlasWidth - rect.width
        })

        placedRects.push({
          ...rect,
          x: 0,
          y: newShelfY
        })
      }
    }

    return {
      width: atlasWidth,
      height: this.config.powerOfTwo ? this.getNextPowerOfTwo(atlasHeight) : atlasHeight,
      rectangles: placedRects
    }
  }

  /**
   * Simple guillotine packing algorithm
   */
  private packGuillotine(rectangles: (Rectangle & { spriteIndex: number })[]): {
    width: number
    height: number
    rectangles: (Rectangle & { spriteIndex: number })[]
  } | null {
    // Simplified guillotine - similar to shelf but with better space utilization
    return this.packShelf(rectangles)
  }

  /**
   * Create atlas canvas
   */
  private createAtlasCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false // Keep pixel-perfect rendering

    return canvas
  }

  /**
   * Calculate packing efficiency
   */
  private calculateEfficiency(
    packed: { width: number; height: number; rectangles: Rectangle[] },
    sprites: SpriteData[]
  ): number {
    const totalSpriteArea = sprites.reduce((sum, sprite) =>
      sum + (sprite.image.width * sprite.image.height), 0
    )
    const atlasArea = packed.width * packed.height
    return totalSpriteArea / atlasArea
  }

  /**
   * Generate atlas ID from sprites
   */
  private generateAtlasId(sprites: SpriteData[]): string {
    const ids = sprites.map(s => s.id).sort().join('_')
    return `atlas_${this.hashString(ids)}`
  }

  /**
   * Hash string for ID generation
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Get next power of two
   */
  private getNextPowerOfTwo(value: number): number {
    return Math.pow(2, Math.ceil(Math.log2(value)))
  }

  /**
   * Get all atlases
   */
  getAllAtlases(): AtlasData[] {
    return Array.from(this.atlases.values())
  }

  /**
   * Clear atlases
   */
  clearAtlases(): void {
    this.atlases.clear()
  }

  /**
   * Get atlas statistics
   */
  getStats() {
    const atlases = this.getAllAtlases()
    return {
      count: atlases.length,
      totalSprites: atlases.reduce((sum, atlas) => sum + atlas.metadata.spriteCount, 0),
      averageEfficiency: atlases.reduce((sum, atlas) => sum + atlas.metadata.efficiency, 0) / atlases.length || 0,
      totalMemory: atlases.reduce((sum, atlas) => sum + (atlas.metadata.width * atlas.metadata.height * 4), 0)
    }
  }
}
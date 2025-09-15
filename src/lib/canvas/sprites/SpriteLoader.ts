/**
 * SpriteLoader
 *
 * High-performance sprite loading and caching system for ship assets.
 * Supports sprite atlases, progressive loading, and memory management.
 */

import { ShipClass, ShipEra } from '../../database/types/enums'

export interface SpriteImage {
  image: HTMLImageElement
  width: number
  height: number
  loaded: boolean
}

export interface SpriteFrame {
  x: number
  y: number
  width: number
  height: number
  anchorX?: number
  anchorY?: number
}

export interface SpriteData {
  id: string
  image: SpriteImage
  frames: Record<string, SpriteFrame>
  metadata: {
    era: ShipEra
    shipClass: ShipClass
    version: string
    author?: string
    license?: string
  }
}

export interface LoadingProgress {
  loaded: number
  total: number
  currentSprite?: string
  errors: string[]
}

export interface SpriteConfig {
  baseUrl: string
  format: 'png' | 'webp' | 'svg'
  quality: 'low' | 'medium' | 'high'
  enablePreloading: boolean
  enableCaching: boolean
  maxCacheSize: number
}

/**
 * Default sprite configuration optimized for performance
 */
export const DEFAULT_SPRITE_CONFIG: SpriteConfig = {
  baseUrl: '/assets/ships',
  format: 'webp',
  quality: 'medium',
  enablePreloading: true,
  enableCaching: true,
  maxCacheSize: 100 * 1024 * 1024, // 100MB
}

/**
 * Sprite loading and caching system
 */
export class SpriteLoader {
  private cache = new Map<string, SpriteData>()
  private loadingPromises = new Map<string, Promise<SpriteData>>()
  private loadingProgress: LoadingProgress = { loaded: 0, total: 0, errors: [] }
  private config: SpriteConfig
  private cacheSize = 0
  private loadingListeners = new Set<(progress: LoadingProgress) => void>()

  constructor(config: Partial<SpriteConfig> = {}) {
    this.config = { ...DEFAULT_SPRITE_CONFIG, ...config }
  }

  /**
   * Load a sprite by ship type
   */
  async loadSprite(era: ShipEra, shipClass: ShipClass): Promise<SpriteData> {
    const spriteId = this.getSpriteId(era, shipClass)

    // Return cached sprite if available
    if (this.cache.has(spriteId)) {
      return this.cache.get(spriteId)!
    }

    // Return existing loading promise
    if (this.loadingPromises.has(spriteId)) {
      return this.loadingPromises.get(spriteId)!
    }

    // Start loading sprite
    const loadingPromise = this.loadSpriteData(era, shipClass, spriteId)
    this.loadingPromises.set(spriteId, loadingPromise)

    this.updateProgress('currentSprite', spriteId)

    try {
      const spriteData = await loadingPromise
      this.cache.set(spriteId, spriteData)
      this.cacheSize += this.estimateSpriteSize(spriteData)
      this.updateProgress('loaded', this.loadingProgress.loaded + 1)

      // Clean cache if needed
      this.cleanupCache()

      return spriteData
    } catch (error) {
      this.loadingProgress.errors.push(`Failed to load ${spriteId}: ${error}`)
      this.updateProgress('errors', this.loadingProgress.errors)
      throw error
    } finally {
      this.loadingPromises.delete(spriteId)
    }
  }

  /**
   * Preload sprites for multiple ship types
   */
  async preloadSprites(ships: Array<{ era: ShipEra; shipClass: ShipClass }>): Promise<void> {
    this.loadingProgress.total = ships.length
    this.loadingProgress.loaded = 0
    this.loadingProgress.errors = []

    const loadingPromises = ships.map(({ era, shipClass }) =>
      this.loadSprite(era, shipClass).catch(error => {
        console.warn(`Failed to preload sprite for ${era}:${shipClass}`, error)
      })
    )

    await Promise.all(loadingPromises)
  }

  /**
   * Load sprite data from server
   */
  private async loadSpriteData(era: ShipEra, shipClass: ShipClass, spriteId: string): Promise<SpriteData> {
    const spritePath = this.getSpritePath(era, shipClass)
    const metadataPath = this.getMetadataPath(era, shipClass)

    // Load image and metadata in parallel
    const [image, metadata] = await Promise.all([
      this.loadImage(spritePath),
      this.loadMetadata(metadataPath)
    ])

    return {
      id: spriteId,
      image,
      frames: metadata.frames || this.generateDefaultFrames(image),
      metadata: {
        era,
        shipClass,
        version: metadata.version || '1.0.0',
        author: metadata.author,
        license: metadata.license
      }
    }
  }

  /**
   * Load image with error handling and fallbacks
   */
  private async loadImage(imagePath: string): Promise<SpriteImage> {
    const formats = this.config.format === 'webp' ? ['webp', 'png'] : [this.config.format]

    for (const format of formats) {
      try {
        const path = imagePath.replace(/\.(png|webp|svg)$/, `.${format}`)
        const image = await this.createImage(path)

        return {
          image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          loaded: true
        }
      } catch (error) {
        if (format === formats[formats.length - 1]) {
          throw new Error(`Failed to load image: ${imagePath}`)
        }
      }
    }

    throw new Error(`No suitable image format found for: ${imagePath}`)
  }

  /**
   * Create image element with loading promise
   */
  private createImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))

      img.src = src
    })
  }

  /**
   * Load sprite metadata (frames, animations, etc.)
   */
  private async loadMetadata(metadataPath: string): Promise<any> {
    try {
      const response = await fetch(metadataPath)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      // Return empty metadata if file doesn't exist
      return {}
    }
  }

  /**
   * Generate default frames for sprites without metadata
   */
  private generateDefaultFrames(image: SpriteImage): Record<string, SpriteFrame> {
    return {
      idle: {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
        anchorX: image.width / 2,
        anchorY: image.height / 2
      }
    }
  }

  /**
   * Get sprite file path
   */
  private getSpritePath(era: ShipEra, shipClass: ShipClass): string {
    const eraFolder = era.toLowerCase().replace(/_/g, '-')
    const classFile = shipClass.toLowerCase().replace(/_/g, '-')
    return `${this.config.baseUrl}/${eraFolder}/${classFile}.${this.config.format}`
  }

  /**
   * Get metadata file path
   */
  private getMetadataPath(era: ShipEra, shipClass: ShipClass): string {
    const eraFolder = era.toLowerCase().replace(/_/g, '-')
    const classFile = shipClass.toLowerCase().replace(/_/g, '-')
    return `${this.config.baseUrl}/${eraFolder}/${classFile}.json`
  }

  /**
   * Get unique sprite identifier
   */
  private getSpriteId(era: ShipEra, shipClass: ShipClass): string {
    return `${era}:${shipClass}:${this.config.quality}`
  }

  /**
   * Estimate sprite memory usage
   */
  private estimateSpriteSize(sprite: SpriteData): number {
    // Rough estimate: width * height * 4 bytes per pixel
    return sprite.image.width * sprite.image.height * 4
  }

  /**
   * Clean up cache when it exceeds max size
   */
  private cleanupCache(): void {
    if (this.cacheSize <= this.config.maxCacheSize) return

    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => {
      // Sort by usage (could be enhanced with LRU algorithm)
      return a[0].localeCompare(b[0])
    })

    // Remove oldest entries until we're under the limit
    let removedSize = 0
    while (this.cacheSize - removedSize > this.config.maxCacheSize * 0.8 && entries.length > 0) {
      const [key, sprite] = entries.shift()!
      removedSize += this.estimateSpriteSize(sprite)
      this.cache.delete(key)
    }

    this.cacheSize -= removedSize
  }

  /**
   * Update loading progress and notify listeners
   */
  private updateProgress(field: keyof LoadingProgress, value: any): void {
    (this.loadingProgress as any)[field] = value
    this.loadingListeners.forEach(listener => listener(this.loadingProgress))
  }

  /**
   * Listen to loading progress updates
   */
  onProgress(callback: (progress: LoadingProgress) => void): () => void {
    this.loadingListeners.add(callback)
    return () => this.loadingListeners.delete(callback)
  }

  /**
   * Get loading progress
   */
  getProgress(): LoadingProgress {
    return { ...this.loadingProgress }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheSize = 0
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      entries: this.cache.size,
      sizeBytes: this.cacheSize,
      sizeFormatted: this.formatBytes(this.cacheSize),
      maxSize: this.config.maxCacheSize,
      utilization: this.cacheSize / this.config.maxCacheSize
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.cache.clear()
    this.loadingPromises.clear()
    this.loadingListeners.clear()
    this.cacheSize = 0
  }
}
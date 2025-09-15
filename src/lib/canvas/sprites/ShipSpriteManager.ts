/**
 * ShipSpriteManager
 *
 * Central manager for ship sprites, atlases, and rendering optimization.
 * Coordinates loading, caching, and efficient rendering of ship assets.
 */

import { SpriteLoader, SpriteData, LoadingProgress } from './SpriteLoader'
import { SpriteAtlas, AtlasData, AtlasFrame } from './SpriteAtlas'
import { ShipClass, ShipEra } from '../../database/types/enums'
import { ShipTypeTemplates } from '../../ships/ShipTemplates'

export interface ShipSpriteConfig {
  enableAtlases: boolean
  preloadStrategy: 'none' | 'era' | 'all'
  qualityLevel: 'low' | 'medium' | 'high'
  enableFallbacks: boolean
  maxConcurrentLoads: number
}

export interface ShipVisualConfig {
  era: ShipEra
  shipClass: ShipClass
  customization?: {
    hull?: string
    camo?: string
    flags?: string[]
    weathering?: number
  }
}

export interface RenderableSprite {
  image: HTMLImageElement | HTMLCanvasElement
  frame: AtlasFrame | { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number }
  metadata: {
    era: ShipEra
    shipClass: ShipClass
    size: number
    hitPoints: number
  }
}

const DEFAULT_SHIP_SPRITE_CONFIG: ShipSpriteConfig = {
  enableAtlases: true,
  preloadStrategy: 'era',
  qualityLevel: 'medium',
  enableFallbacks: true,
  maxConcurrentLoads: 3
}

/**
 * Ship sprite management and optimization system
 */
export class ShipSpriteManager {
  private spriteLoader: SpriteLoader
  private spriteAtlas: SpriteAtlas
  private config: ShipSpriteConfig
  private loadingQueue = new Set<string>()
  private loadingListeners = new Set<(progress: LoadingProgress) => void>()
  private spriteCache = new Map<string, RenderableSprite>()

  constructor(config: Partial<ShipSpriteConfig> = {}) {
    this.config = { ...DEFAULT_SHIP_SPRITE_CONFIG, ...config }

    this.spriteLoader = new SpriteLoader({
      quality: this.config.qualityLevel,
      enablePreloading: this.config.preloadStrategy !== 'none',
      enableCaching: true
    })

    this.spriteAtlas = new SpriteAtlas({
      maxSize: this.getOptimalAtlasSize(),
      allowRotation: false,
      algorithm: 'maxrects'
    })

    this.setupProgressForwarding()
  }

  /**
   * Get renderable sprite for a ship
   */
  async getShipSprite(config: ShipVisualConfig): Promise<RenderableSprite> {
    const cacheKey = this.getSpriteKey(config)

    // Return cached sprite if available
    if (this.spriteCache.has(cacheKey)) {
      return this.spriteCache.get(cacheKey)!
    }

    // Load sprite data
    const spriteData = await this.loadShipSpriteData(config)

    // Create renderable sprite
    const renderableSprite = this.createRenderableSprite(spriteData, config)

    // Cache the sprite
    this.spriteCache.set(cacheKey, renderableSprite)

    return renderableSprite
  }

  /**
   * Preload sprites for an era
   */
  async preloadEraSprites(era: ShipEra): Promise<void> {
    const ships = this.getShipsForEra(era)
    const loadingPromises = ships.map(ship =>
      this.getShipSprite({ era, shipClass: ship }).catch(error => {
        console.warn(`Failed to preload ${era}:${ship}`, error)
      })
    )

    await Promise.all(loadingPromises)

    // Create atlas for era if enabled
    if (this.config.enableAtlases) {
      await this.createEraAtlas(era)
    }
  }

  /**
   * Preload all available sprites
   */
  async preloadAllSprites(): Promise<void> {
    const eras = Object.values(ShipEra)
    for (const era of eras) {
      await this.preloadEraSprites(era)
    }
  }

  /**
   * Create atlas for specific era
   */
  async createEraAtlas(era: ShipEra): Promise<AtlasData | null> {
    try {
      const ships = this.getShipsForEra(era)
      const sprites: SpriteData[] = []

      for (const shipClass of ships) {
        try {
          const spriteData = await this.spriteLoader.loadSprite(era, shipClass)
          sprites.push(spriteData)
        } catch (error) {
          console.warn(`Failed to load sprite for atlas: ${era}:${shipClass}`, error)
        }
      }

      if (sprites.length === 0) {
        return null
      }

      return await this.spriteAtlas.createEraAtlas(sprites, era)
    } catch (error) {
      console.error(`Failed to create atlas for era ${era}:`, error)
      return null
    }
  }

  /**
   * Get optimized sprite from atlas
   */
  async getAtlasSprite(config: ShipVisualConfig): Promise<RenderableSprite | null> {
    if (!this.config.enableAtlases) {
      return null
    }

    const atlasId = `era_${config.era.toLowerCase()}`
    const atlas = this.spriteAtlas.getAtlas(atlasId)

    if (!atlas) {
      // Try to create atlas
      await this.createEraAtlas(config.era)
      return this.spriteAtlas.getAtlas(atlasId) ? this.getAtlasSprite(config) : null
    }

    const frameId = `${config.era}:${config.shipClass}:${this.config.qualityLevel}:idle`
    const frame = this.spriteAtlas.getFrame(atlasId, frameId)

    if (!frame) {
      return null
    }

    const template = this.getShipTemplate(config.era, config.shipClass)

    return {
      image: atlas.image,
      frame,
      metadata: {
        era: config.era,
        shipClass: config.shipClass,
        size: template?.size || 3,
        hitPoints: template?.baseStats.hitPoints || 3
      }
    }
  }

  /**
   * Load ship sprite data
   */
  private async loadShipSpriteData(config: ShipVisualConfig): Promise<SpriteData> {
    const loadingKey = `${config.era}:${config.shipClass}`

    // Check if already loading
    if (this.loadingQueue.has(loadingKey)) {
      // Wait for existing load to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          if (!this.loadingQueue.has(loadingKey)) {
            clearInterval(checkInterval)
            try {
              const spriteData = await this.spriteLoader.loadSprite(config.era, config.shipClass)
              resolve(spriteData)
            } catch (error) {
              reject(error)
            }
          }
        }, 100)
      })
    }

    // Add to loading queue
    this.loadingQueue.add(loadingKey)

    try {
      const spriteData = await this.spriteLoader.loadSprite(config.era, config.shipClass)
      return spriteData
    } catch (error) {
      if (this.config.enableFallbacks) {
        return this.createFallbackSprite(config)
      }
      throw error
    } finally {
      this.loadingQueue.delete(loadingKey)
    }
  }

  /**
   * Create renderable sprite from sprite data
   */
  private createRenderableSprite(spriteData: SpriteData, config: ShipVisualConfig): RenderableSprite {
    const template = this.getShipTemplate(config.era, config.shipClass)

    // Try to get optimized atlas sprite first
    const atlasSprite = this.getAtlasSprite(config)
    if (atlasSprite) {
      return atlasSprite as any // This is a promise, but we'll handle it in the calling code
    }

    // Use individual sprite
    const idleFrame = spriteData.frames.idle || Object.values(spriteData.frames)[0]

    return {
      image: spriteData.image.image,
      frame: {
        x: idleFrame.x,
        y: idleFrame.y,
        width: idleFrame.width,
        height: idleFrame.height,
        anchorX: idleFrame.anchorX || spriteData.image.width / 2,
        anchorY: idleFrame.anchorY || spriteData.image.height / 2
      },
      metadata: {
        era: config.era,
        shipClass: config.shipClass,
        size: template?.size || 3,
        hitPoints: template?.baseStats.hitPoints || 3
      }
    }
  }

  /**
   * Create fallback sprite when loading fails
   */
  private createFallbackSprite(config: ShipVisualConfig): SpriteData {
    const canvas = document.createElement('canvas')
    const template = this.getShipTemplate(config.era, config.shipClass)
    const size = (template?.size || 3) * 20 // Scale by 20px per size unit

    canvas.width = size
    canvas.height = size * 0.6 // Ship aspect ratio

    const ctx = canvas.getContext('2d')!

    // Draw simple ship shape
    ctx.fillStyle = this.getShipColor(config.shipClass)
    ctx.fillRect(0, canvas.height * 0.2, canvas.width, canvas.height * 0.6)

    // Draw bow
    ctx.beginPath()
    ctx.moveTo(canvas.width, canvas.height * 0.2)
    ctx.lineTo(canvas.width, canvas.height * 0.8)
    ctx.lineTo(canvas.width * 1.2, canvas.height * 0.5)
    ctx.fill()

    const image = new Image()
    image.src = canvas.toDataURL()

    return {
      id: `fallback_${config.era}_${config.shipClass}`,
      image: {
        image,
        width: canvas.width,
        height: canvas.height,
        loaded: true
      },
      frames: {
        idle: {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          anchorX: canvas.width / 2,
          anchorY: canvas.height / 2
        }
      },
      metadata: {
        era: config.era,
        shipClass: config.shipClass,
        version: '1.0.0-fallback'
      }
    }
  }

  /**
   * Get ships available for an era
   */
  private getShipsForEra(era: ShipEra): ShipClass[] {
    // This would normally come from the ship types system
    switch (era) {
      case ShipEra.PRE_DREADNOUGHT:
        return [ShipClass.BATTLESHIP, ShipClass.HEAVY_CRUISER, ShipClass.LIGHT_CRUISER, ShipClass.DESTROYER]
      case ShipEra.DREADNOUGHT:
        return [ShipClass.BATTLESHIP, ShipClass.BATTLECRUISER, ShipClass.HEAVY_CRUISER, ShipClass.DESTROYER]
      case ShipEra.SUPER_DREADNOUGHT:
        return [ShipClass.BATTLESHIP, ShipClass.BATTLECRUISER, ShipClass.HEAVY_CRUISER, ShipClass.DESTROYER, ShipClass.SUBMARINE]
      case ShipEra.MODERN:
        return [ShipClass.CARRIER, ShipClass.BATTLESHIP, ShipClass.DESTROYER, ShipClass.SUBMARINE, ShipClass.FRIGATE]
      default:
        return Object.values(ShipClass)
    }
  }

  /**
   * Get ship template data
   */
  private getShipTemplate(era: ShipEra, shipClass: ShipClass): any {
    const templateKey = Object.keys(ShipTypeTemplates).find(key => {
      const template = ShipTypeTemplates[key as keyof typeof ShipTypeTemplates]
      return template.era === era && template.class === shipClass
    })

    return templateKey ? ShipTypeTemplates[templateKey as keyof typeof ShipTypeTemplates] : null
  }

  /**
   * Get ship color for fallback rendering
   */
  private getShipColor(shipClass: ShipClass): string {
    const colors = {
      [ShipClass.CARRIER]: '#4A5568',
      [ShipClass.BATTLESHIP]: '#2D3748',
      [ShipClass.BATTLECRUISER]: '#1A202C',
      [ShipClass.HEAVY_CRUISER]: '#718096',
      [ShipClass.LIGHT_CRUISER]: '#A0AEC0',
      [ShipClass.DESTROYER]: '#CBD5E0',
      [ShipClass.FRIGATE]: '#E2E8F0',
      [ShipClass.CORVETTE]: '#F7FAFC',
      [ShipClass.SUBMARINE]: '#2B6CB0'
    }
    return colors[shipClass] || '#4A5568'
  }

  /**
   * Get cache key for sprite
   */
  private getSpriteKey(config: ShipVisualConfig): string {
    return `${config.era}:${config.shipClass}:${this.config.qualityLevel}`
  }

  /**
   * Get optimal atlas size based on device capabilities
   */
  private getOptimalAtlasSize(): number {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const maxSize = ctx.getParameter ? (ctx.getParameter(ctx.MAX_TEXTURE_SIZE) || 2048) : 2048

    // Use conservative size for compatibility
    return Math.min(maxSize, 2048)
  }

  /**
   * Setup progress forwarding from sprite loader
   */
  private setupProgressForwarding(): void {
    this.spriteLoader.onProgress((progress) => {
      this.loadingListeners.forEach(listener => listener(progress))
    })
  }

  /**
   * Listen to loading progress
   */
  onProgress(callback: (progress: LoadingProgress) => void): () => void {
    this.loadingListeners.add(callback)
    return () => this.loadingListeners.delete(callback)
  }

  /**
   * Get loading progress
   */
  getProgress(): LoadingProgress {
    return this.spriteLoader.getProgress()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      spriteLoader: this.spriteLoader.getCacheStats(),
      atlas: this.spriteAtlas.getStats(),
      renderableCache: {
        entries: this.spriteCache.size,
        keys: Array.from(this.spriteCache.keys())
      },
      loadingQueue: Array.from(this.loadingQueue)
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.spriteLoader.clearCache()
    this.spriteAtlas.clearAtlases()
    this.spriteCache.clear()
    this.loadingQueue.clear()
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    this.clearCache()
    this.spriteLoader.destroy()
    this.loadingListeners.clear()
  }
}
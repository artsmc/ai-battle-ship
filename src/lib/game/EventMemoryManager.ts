/**
 * EventMemoryManager
 * Manages event history with circular buffer implementation to prevent memory leaks
 */

import { GameEvent, GameEventType } from './types'

export interface MemoryConfig {
  maxEvents: number
  preserveCriticalEvents: boolean
  enableMemoryMonitoring: boolean
  maxCriticalEvents: number
  maxSnapshots: number
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxEvents: 1000,
  preserveCriticalEvents: true,
  enableMemoryMonitoring: true,
  maxCriticalEvents: 100,
  maxSnapshots: 10
}

// Critical event types that should be preserved
const CRITICAL_EVENT_TYPES: Set<GameEventType> = new Set<GameEventType>([
  'game_created',
  'phase_changed',
  'game_ended',
  'ship_sunk',
  'player_joined',
  'player_left'
])

export interface MemoryStats {
  totalEvents: number
  criticalEvents: number
  bufferUtilization: number
  estimatedMemoryMB: number
}

export class EventMemoryManager {
  private eventBuffer: (GameEvent | undefined)[]
  private criticalEvents: GameEvent[] = []
  private bufferIndex: number = 0
  private totalEventsProcessed: number = 0
  private config: MemoryConfig

  constructor(config?: Partial<MemoryConfig>) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config }
    // Pre-allocate buffer to avoid dynamic resizing
    this.eventBuffer = new Array(this.config.maxEvents)
  }

  /**
   * Records an event using circular buffer pattern
   */
  recordEvent(event: GameEvent): void {
    // Store critical events separately if configured
    if (this.config.preserveCriticalEvents && CRITICAL_EVENT_TYPES.has(event.type)) {
      this.criticalEvents.push(event)
      this.maintainCriticalEvents()
    }

    // Use circular buffer for all events
    this.eventBuffer[this.bufferIndex] = event
    this.bufferIndex = (this.bufferIndex + 1) % this.config.maxEvents
    this.totalEventsProcessed++

    // Periodic cleanup check (every 100 events)
    if (this.config.enableMemoryMonitoring && this.totalEventsProcessed % 100 === 0) {
      this.performAutoCleanup()
    }
  }

  /**
   * Maintains critical events within memory limits
   */
  private maintainCriticalEvents(): void {
    if (this.criticalEvents.length > this.config.maxCriticalEvents) {
      // Keep first few and last many to preserve game start and recent history
      const keepFirst = Math.floor(this.config.maxCriticalEvents * 0.1)
      const keepLast = Math.floor(this.config.maxCriticalEvents * 0.9)

      this.criticalEvents = [
        ...this.criticalEvents.slice(0, keepFirst),
        ...this.criticalEvents.slice(-keepLast)
      ]
    }
  }

  /**
   * Performs automatic cleanup of old data
   */
  private performAutoCleanup(): void {
    // Additional cleanup logic can be added here if needed
    // Currently handled by circular buffer and critical event maintenance
  }

  /**
   * Gets all events (critical + buffer) sorted by timestamp
   */
  getAllEvents(): readonly GameEvent[] {
    const regularEvents = this.getBufferEvents()

    if (this.config.preserveCriticalEvents && this.criticalEvents.length > 0) {
      // Merge and deduplicate events
      const eventMap = new Map<string, GameEvent>()

      // Add critical events first
      this.criticalEvents.forEach(e => eventMap.set(e.id, e))

      // Add buffer events (may override if duplicate)
      regularEvents.forEach(e => eventMap.set(e.id, e))

      // Sort by timestamp
      const allEvents = Array.from(eventMap.values())
      allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      return Object.freeze(allEvents)
    }

    return Object.freeze(regularEvents)
  }

  /**
   * Gets events from the circular buffer
   */
  private getBufferEvents(): GameEvent[] {
    // Filter out undefined entries and maintain order
    const events: GameEvent[] = []

    // If buffer is not full yet
    if (this.totalEventsProcessed < this.config.maxEvents) {
      for (let i = 0; i < this.bufferIndex; i++) {
        const event = this.eventBuffer[i]
        if (event) events.push(event)
      }
    } else {
      // Buffer is full, read in circular order
      for (let i = 0; i < this.config.maxEvents; i++) {
        const index = (this.bufferIndex + i) % this.config.maxEvents
        const event = this.eventBuffer[index]
        if (event) events.push(event)
      }
    }

    return events
  }

  /**
   * Gets only the most recent events
   */
  getRecentEvents(limit: number = 100): readonly GameEvent[] {
    const events = this.getAllEvents()
    return Object.freeze(events.slice(-limit))
  }

  /**
   * Gets only critical events
   */
  getCriticalEvents(): readonly GameEvent[] {
    return Object.freeze([...this.criticalEvents])
  }

  /**
   * Clears event history
   */
  clearHistory(preserveCritical: boolean = true): void {
    this.eventBuffer = new Array(this.config.maxEvents)
    this.bufferIndex = 0
    this.totalEventsProcessed = 0

    if (!preserveCritical) {
      this.criticalEvents = []
    }
  }

  /**
   * Gets memory usage statistics
   */
  getMemoryStats(): MemoryStats {
    const bufferEvents = this.getBufferEvents()
    const bufferUtilization = bufferEvents.length / this.config.maxEvents

    // Estimate memory usage (rough calculation)
    const avgEventSize = 200 // bytes per event (estimated)
    const totalEvents = bufferEvents.length + this.criticalEvents.length
    const estimatedBytes = totalEvents * avgEventSize

    return {
      totalEvents: this.totalEventsProcessed,
      criticalEvents: this.criticalEvents.length,
      bufferUtilization,
      estimatedMemoryMB: estimatedBytes / (1024 * 1024)
    }
  }

  /**
   * Updates configuration dynamically
   */
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    const oldMaxEvents = this.config.maxEvents
    this.config = { ...this.config, ...newConfig }

    // Resize buffer if needed
    if (newConfig.maxEvents && newConfig.maxEvents !== oldMaxEvents) {
      this.resizeBuffer(newConfig.maxEvents)
    }
  }

  /**
   * Resizes the event buffer
   */
  private resizeBuffer(newSize: number): void {
    const oldEvents = this.getBufferEvents()
    this.eventBuffer = new Array(newSize)

    // Copy as many old events as will fit
    const copyCount = Math.min(oldEvents.length, newSize)
    const startIndex = Math.max(0, oldEvents.length - copyCount)

    for (let i = 0; i < copyCount; i++) {
      this.eventBuffer[i] = oldEvents[startIndex + i]
    }

    this.bufferIndex = copyCount % newSize
  }

  /**
   * Gets current configuration
   */
  getConfig(): Readonly<MemoryConfig> {
    return Object.freeze({ ...this.config })
  }
}
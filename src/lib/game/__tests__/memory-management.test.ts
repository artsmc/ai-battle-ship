/**
 * Memory Management Test Suite
 * Tests the circular buffer implementation and memory leak prevention
 */

import { GameState } from '../GameState'
import { EventMemoryManager } from '../EventMemoryManager'
import { GameConfiguration } from '../types'

describe('Memory Management', () => {
  const mockConfig: GameConfiguration = {
    gameMode: 'classic',
    boardSize: { width: 10, height: 10 },
    timeLimit: 30000,
    allowReconnection: false,
    enablePowerups: false,
    fogOfWar: true,
    difficulty: 'medium'
  }

  describe('EventMemoryManager', () => {
    it('should respect max events limit with circular buffer', () => {
      const manager = new EventMemoryManager({ maxEvents: 10 })

      // Add 20 events (double the limit)
      for (let i = 0; i < 20; i++) {
        manager.recordEvent({
          id: `event_${i}`,
          type: 'attack_made',
          timestamp: new Date(),
          data: { index: i }
        })
      }

      // Should only have 10 most recent events
      const events = manager.getAllEvents()
      expect(events.length).toBeLessThanOrEqual(10)

      // Most recent event should be event_19
      const lastEvent = events[events.length - 1]
      expect(lastEvent.id).toBe('event_19')
    })

    it('should preserve critical events separately', () => {
      const manager = new EventMemoryManager({
        maxEvents: 5,
        preserveCriticalEvents: true
      })

      // Add critical events
      manager.recordEvent({
        id: 'critical_1',
        type: 'game_created',
        timestamp: new Date(),
        data: {}
      })

      manager.recordEvent({
        id: 'critical_2',
        type: 'game_ended',
        timestamp: new Date(),
        data: {}
      })

      // Add many non-critical events
      for (let i = 0; i < 10; i++) {
        manager.recordEvent({
          id: `regular_${i}`,
          type: 'attack_made',
          timestamp: new Date(),
          data: { index: i }
        })
      }

      const criticalEvents = manager.getCriticalEvents()
      expect(criticalEvents.length).toBe(2)
      expect(criticalEvents[0].id).toBe('critical_1')
      expect(criticalEvents[1].id).toBe('critical_2')
    })

    it('should provide accurate memory statistics', () => {
      const manager = new EventMemoryManager({ maxEvents: 100 })

      // Add 50 events
      for (let i = 0; i < 50; i++) {
        manager.recordEvent({
          id: `event_${i}`,
          type: 'attack_made',
          timestamp: new Date(),
          data: { index: i }
        })
      }

      const stats = manager.getMemoryStats()
      expect(stats.totalEvents).toBe(50)
      expect(stats.bufferUtilization).toBe(0.5) // 50/100
      expect(stats.estimatedMemoryMB).toBeGreaterThan(0)
    })

    it('should handle configuration updates', () => {
      const manager = new EventMemoryManager({ maxEvents: 20 })

      // Add 15 events
      for (let i = 0; i < 15; i++) {
        manager.recordEvent({
          id: `event_${i}`,
          type: 'attack_made',
          timestamp: new Date(),
          data: { index: i }
        })
      }

      // Reduce max events to 10
      manager.updateConfig({ maxEvents: 10 })

      const events = manager.getAllEvents()
      expect(events.length).toBeLessThanOrEqual(10)

      // Should keep the most recent events
      const firstEvent = events[0]
      expect(parseInt(firstEvent.id.split('_')[1])).toBeGreaterThanOrEqual(5)
    })
  })

  describe('GameState Memory Management', () => {
    it('should limit snapshot history', () => {
      const gameState = new GameState(mockConfig, { maxSnapshots: 3 })

      // Create 5 snapshots
      for (let i = 0; i < 5; i++) {
        gameState.createSnapshot()
      }

      // Should only keep 3 most recent
      const stats = gameState.getMemoryStats()
      expect(stats.snapshots).toBe(3)
    })

    it('should provide memory management methods', () => {
      const gameState = new GameState(mockConfig)

      // Test that memory management methods exist and work
      expect(gameState.getMemoryStats).toBeDefined()
      expect(gameState.clearEventHistory).toBeDefined()
      expect(gameState.updateMemoryConfig).toBeDefined()
      expect(gameState.getRecentEvents).toBeDefined()
      expect(gameState.getCriticalEvents).toBeDefined()

      const stats = gameState.getMemoryStats()
      expect(stats).toHaveProperty('totalEvents')
      expect(stats).toHaveProperty('criticalEvents')
      expect(stats).toHaveProperty('bufferUtilization')
      expect(stats).toHaveProperty('estimatedMemoryMB')
      expect(stats).toHaveProperty('snapshots')
    })

    it('should handle long-running games without memory leaks', () => {
      const gameState = new GameState(mockConfig, {
        maxEvents: 100,
        enableMemoryMonitoring: true
      })

      // Simulate a long game with many events
      for (let turn = 0; turn < 500; turn++) {
        // Each turn generates multiple events (simulating a real game)
        gameState['recordEvent']('turn_started', { turn })
        gameState['recordEvent']('attack_made', { turn, hit: Math.random() > 0.5 })

        if (turn % 10 === 0) {
          gameState['recordEvent']('ship_sunk', { turn, shipId: `ship_${turn}` })
        }
      }

      const stats = gameState.getMemoryStats()

      // Even after 1500+ events, memory should be controlled
      expect(stats.totalEvents).toBeGreaterThan(1000)

      // But actual stored events should be limited
      const allEvents = gameState.getEvents()
      expect(allEvents.length).toBeLessThanOrEqual(200) // max buffer + critical events

      // Memory usage should be reasonable (under 1MB for events)
      expect(stats.estimatedMemoryMB).toBeLessThan(1)
    })
  })
})
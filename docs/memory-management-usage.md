# Memory Management Usage Guide

## Overview

The GameState class now includes built-in memory management to prevent memory leaks in long-running games. The implementation uses a circular buffer pattern for event history and automatic cleanup for snapshots.

## Key Features

- **Circular Buffer**: Events are stored in a pre-allocated circular buffer (default: 1000 events)
- **Critical Event Preservation**: Important events (game start, phase changes, victory) are preserved separately
- **Automatic Cleanup**: Memory is automatically managed with periodic cleanup
- **Configurable Limits**: All memory limits can be configured
- **Memory Monitoring**: Built-in statistics to track memory usage

## Basic Usage

### Creating a GameState with Custom Memory Configuration

```typescript
import { GameState } from '@/lib/game/GameState'

// Default configuration (1000 events max)
const gameState = new GameState(gameConfig)

// Custom memory configuration
const gameState = new GameState(gameConfig, {
  maxEvents: 500,              // Smaller buffer for mobile devices
  preserveCriticalEvents: true, // Keep important events
  enableMemoryMonitoring: true, // Enable auto-cleanup
  maxCriticalEvents: 50,        // Limit critical events
  maxSnapshots: 5               // Limit game snapshots
})
```

### Monitoring Memory Usage

```typescript
// Get memory statistics
const stats = gameState.getMemoryStats()
console.log(`Total events processed: ${stats.totalEvents}`)
console.log(`Critical events stored: ${stats.criticalEvents}`)
console.log(`Buffer utilization: ${stats.bufferUtilization * 100}%`)
console.log(`Estimated memory: ${stats.estimatedMemoryMB.toFixed(2)} MB`)
console.log(`Snapshots: ${stats.snapshots}`)
```

### Accessing Events

```typescript
// Get all events (merged and sorted)
const allEvents = gameState.getEvents()

// Get only recent events (last 100)
const recentEvents = gameState.getRecentEvents(100)

// Get only critical events
const criticalEvents = gameState.getCriticalEvents()
```

### Manual Memory Management

```typescript
// Clear event history (preserves critical events by default)
gameState.clearEventHistory()

// Clear all events including critical ones
gameState.clearEventHistory(false)

// Update memory configuration during runtime
gameState.updateMemoryConfig({
  maxEvents: 200  // Reduce buffer size for low-memory situation
})
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxEvents` | 1000 | Maximum events in circular buffer |
| `preserveCriticalEvents` | true | Store critical events separately |
| `enableMemoryMonitoring` | true | Enable automatic cleanup |
| `maxCriticalEvents` | 100 | Maximum critical events to preserve |
| `maxSnapshots` | 10 | Maximum game snapshots to keep |

## Critical Events

The following event types are considered critical and preserved separately:

- `game_created` - Game initialization
- `phase_changed` - Game phase transitions
- `game_ended` - Game completion
- `ship_sunk` - Ship destruction events
- `player_joined` - Player connections
- `player_left` - Player disconnections

## Performance Considerations

### Mobile Devices

For mobile devices with limited memory:

```typescript
const mobileConfig = {
  maxEvents: 200,
  maxCriticalEvents: 30,
  maxSnapshots: 3
}
```

### Long Games

For games that may run for extended periods:

```typescript
const longGameConfig = {
  maxEvents: 2000,
  enableMemoryMonitoring: true,
  maxCriticalEvents: 200
}
```

### Spectator Mode

For spectator clients that only need recent history:

```typescript
const spectatorConfig = {
  maxEvents: 100,
  preserveCriticalEvents: false,
  maxSnapshots: 1
}
```

## Memory Leak Prevention

The implementation prevents memory leaks through:

1. **Fixed-size buffers**: Pre-allocated arrays prevent unbounded growth
2. **Circular overwriting**: Old events are automatically overwritten
3. **Snapshot limiting**: Old snapshots are automatically removed
4. **Periodic cleanup**: Automatic maintenance every 100 events

## Backward Compatibility

The memory management implementation maintains full backward compatibility:

- `getEvents()` still returns all available events
- Event recording works the same way internally
- No breaking changes to the existing API
- Default configuration matches previous behavior for small games

## Testing

Run the memory management tests:

```bash
npm test -- memory-management.test.ts
```

## Migration Guide

### Existing Code

No changes required. The memory management is automatic with sensible defaults.

### Recommended Updates

For production applications, consider:

```typescript
// Add memory monitoring to your game loop
setInterval(() => {
  const stats = gameState.getMemoryStats()
  if (stats.estimatedMemoryMB > 10) {
    console.warn('High memory usage detected')
    gameState.clearEventHistory()
  }
}, 60000) // Check every minute
```

## Troubleshooting

### High Memory Usage

If memory usage is still high:

1. Reduce `maxEvents` configuration
2. Disable `preserveCriticalEvents` if not needed
3. Reduce `maxSnapshots`
4. Call `clearEventHistory()` periodically

### Missing Events

If recent events are missing:

1. Increase `maxEvents` configuration
2. Check if events are being overwritten too quickly
3. Use `getCriticalEvents()` for important events
4. Consider implementing custom event storage for specific needs
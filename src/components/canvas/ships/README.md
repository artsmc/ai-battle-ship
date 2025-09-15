# Ship Rendering System

Complete ship visual system for the Battleship Naval Strategy Game with historical accuracy, performance optimization, and rich visual effects.

## Overview

This system provides comprehensive ship rendering capabilities built on Konva.js with support for:

- **Historical Ship Designs**: Accurate representations from Pre-Dreadnought to Modern eras
- **Advanced Sprite Management**: Optimized loading with atlases and caching
- **Smooth Animations**: 60fps targeting with adaptive quality
- **Damage Visualization**: Dynamic visual feedback for ship condition
- **Ability Effects**: Visual representation of special ship abilities
- **Performance Optimization**: Adaptive quality and resource management

## Architecture

```
Ship Rendering System
├── Core Components
│   ├── ShipRenderer (Main orchestrator)
│   ├── ShipSprite (Individual sprite rendering)
│   ├── DamageVisualizer (Damage states and effects)
│   └── ShipAnimations (Animation coordinator)
├── Sprite System
│   ├── SpriteLoader (Asset loading and caching)
│   ├── SpriteAtlas (Performance optimization)
│   └── ShipSpriteManager (Central coordination)
├── Animation System
│   ├── AnimationEngine (Core animation processing)
│   ├── ShipAnimations (Ship-specific animations)
│   └── AnimationQueue (Sequence and priority management)
└── Utilities
    ├── AbilityEffectsRenderer (Special ability visualization)
    ├── ShipComponentFactory (Easy component creation)
    └── PerformanceMonitor (Adaptive quality management)
```

## Quick Start

### Basic Ship Rendering

```typescript
import { ShipRenderer, ShipSpriteManager } from '@/components/canvas/ships'

const spriteManager = new ShipSpriteManager()

const shipConfig = {
  id: 'ship-1',
  era: ShipEra.DREADNOUGHT,
  shipClass: ShipClass.BATTLESHIP,
  position: { x: 100, y: 100, rotation: 0 },
  scale: 1,
  size: 5,
  hitPoints: 8,
  maxHitPoints: 8,
  isSelected: false,
  isHighlighted: false,
  isVisible: true,
  damageState: 'undamaged' as const
}

<ShipRenderer
  config={shipConfig}
  spriteManager={spriteManager}
  enableAnimations={true}
  enableEffects={true}
  onClick={(shipId) => console.log('Ship clicked:', shipId)}
/>
```

### Complete Ship with All Features

```typescript
import { ShipComponentFactory, createShipConfig } from '@/components/canvas/ships'

const factory = new ShipComponentFactory({
  enableAnimations: true,
  enableEffects: true,
  performanceLevel: 'high'
})

const shipData = createShipConfig({
  id: 'battleship-1',
  era: ShipEra.SUPER_DREADNOUGHT,
  shipClass: ShipClass.BATTLESHIP,
  position: { x: 200, y: 150, rotation: 45 },
  hitPoints: 6,
  maxHitPoints: 8,
  isSelected: true
})

const completeShip = factory.createCompleteShip(shipData, {
  onClick: (id) => console.log('Ship selected:', id),
  onAnimationComplete: (id) => console.log('Animation done:', id)
})
```

### Fleet Rendering

```typescript
const ships = [
  createShipConfig({ id: 'ship-1', era: ShipEra.MODERN, shipClass: ShipClass.DESTROYER, position: { x: 100, y: 100 } }),
  createShipConfig({ id: 'ship-2', era: ShipEra.MODERN, shipClass: ShipClass.CRUISER, position: { x: 200, y: 120 } }),
  createShipConfig({ id: 'ship-3', era: ShipEra.MODERN, shipClass: ShipClass.BATTLESHIP, position: { x: 300, y: 140 } })
]

const fleet = factory.createFleet(ships, {
  onClick: handleShipClick,
  onHover: handleShipHover
})

return (
  <Stage>
    <Layer>
      {fleet}
    </Layer>
  </Stage>
)
```

## Historical Ship Eras

The system supports authentic ship designs across naval history:

### Pre-Dreadnought Era (1870-1905)
- Mixed battery armaments
- Ironclad armor
- Steam propulsion
- Multiple smokestacks

### Dreadnought Era (1906-1919)
- All-big-gun battleships
- Turbine propulsion
- Standardized main batteries
- Fire control systems

### Super-Dreadnought Era (1920-1945)
- Larger caliber guns
- All-or-nothing armor
- Radar systems
- Aircraft integration

### Modern Era (1946-2025)
- Missile systems
- Nuclear propulsion
- AEGIS systems
- Stealth technology

## Animation System

### Built-in Animations

- **Placement**: Ship deployment with scale and rotation effects
- **Movement**: Realistic naval movement with wake effects
- **Combat**: Firing, recoil, and impact animations
- **Damage**: Progressive damage visualization
- **Idle**: Subtle bobbing and swaying for realism

### Custom Animations

```typescript
import { globalAnimationEngine, Easing } from '@/lib/canvas/animations'

// Custom animation
const animationId = globalAnimationEngine.animate({
  target: shipConfig,
  duration: 2000,
  properties: {
    x: { startValue: 0, endValue: 200 },
    rotation: { startValue: 0, endValue: 90 }
  },
  ease: Easing.easeOutCubic,
  onComplete: () => console.log('Movement complete')
})
```

## Damage Visualization

Ships show progressive damage through multiple visual systems:

- **Health Bars**: Color-coded health indicators
- **Visual Effects**: Smoke, fire, and flooding
- **Hull Damage**: Visible breaches and structural damage
- **Listing**: Ships lean when flooding occurs
- **Destruction**: Sinking animations with debris

```typescript
const damageState: DamageState = {
  level: 'heavy',
  hitPoints: 2,
  maxHitPoints: 8,
  damageTypes: {
    hull: 0.6,
    engine: 0.4,
    weapons: 0.3,
    flooding: 0.2
  },
  recentDamage: {
    amount: 2,
    timestamp: Date.now(),
    position: { x: 10, y: 5 }
  }
}
```

## Ability Effects

Visual representation of ship abilities from TASK-012:

### Sonar Ping
- Expanding circular waves
- Cyan color with opacity fade
- Duration: 3 seconds

### Speed Advantage
- Speed trail particles
- Yellow energy streaks
- Continuous during effect

### Silent Running
- Shimmer distortion effect
- Reduced opacity
- Subtle outline glow

### Air Scout
- Rotating radar sweep
- Green scanning beam
- Expanding detection radius

### Armor Piercing
- Weapon glow effects
- Color-shifting aura
- Projectile trail enhancement

### All Big Guns
- Sequential muzzle flashes
- Increased recoil effects
- Multi-gun coordination

## Performance Optimization

### Adaptive Quality System

The system automatically adjusts quality based on performance:

```typescript
import { globalPerformanceMonitor } from '@/lib/canvas/performance'

// Monitor performance
globalPerformanceMonitor.start()

// Listen to quality changes
globalPerformanceMonitor.onQualityChange((settings) => {
  console.log('Quality adjusted:', settings)
  // Update rendering settings
})
```

### Performance Levels

- **Low**: Basic sprites, no animations
- **Medium**: Essential animations, reduced effects
- **High**: All features enabled

### Sprite Atlases

Combine multiple sprites into single textures:

```typescript
const atlas = await spriteAtlas.createEraAtlas(sprites, ShipEra.MODERN)
// Reduces draw calls significantly
```

## Configuration

### Sprite Manager Configuration

```typescript
const spriteManager = new ShipSpriteManager({
  enableAtlases: true,
  preloadStrategy: 'era', // 'none' | 'era' | 'all'
  qualityLevel: 'high',
  enableFallbacks: true,
  maxConcurrentLoads: 3
})
```

### Animation Engine Configuration

```typescript
const animationEngine = new AnimationEngine(60) // 60 FPS target

// Set custom easing
const customEasing = (t: number) => t * t * (3 - 2 * t) // Smoothstep

const animation = animationEngine.animate({
  // ... config
  ease: customEasing
})
```

## Testing

Run the test suite:

```bash
npm test src/lib/canvas/__tests__/ShipRenderingSystem.test.ts
```

The tests cover:
- Sprite loading and caching
- Animation engine functionality
- Performance under load
- Memory management
- Integration scenarios

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Optimized performance settings

## Asset Requirements

Ship sprites should follow this structure:

```
/assets/ships/
├── pre-dreadnought/
│   ├── battleship.webp (+ .png fallback)
│   ├── battleship.json (frame data)
│   └── ...
├── dreadnought/
├── super-dreadnought/
├── modern/
└── fictional/
```

### Sprite Specifications

- **Format**: WebP preferred, PNG fallback
- **Size**: Power of 2 recommended (64x32, 128x64, etc.)
- **Anchor Point**: Centered on ship's center of mass
- **Alpha**: Transparent background

## API Reference

### Core Components

#### ShipRenderer
Main ship rendering component with full feature support.

#### ShipSprite
Optimized individual sprite rendering.

#### DamageVisualizer
Damage state visualization with particle effects.

#### AbilityEffectsRenderer
Special ability visual effects.

### Factories

#### ShipComponentFactory
Simplifies ship component creation with preset configurations.

### Animation System

#### AnimationEngine
Core animation processing with 60fps targeting.

#### AnimationQueue
Priority-based animation sequencing.

#### ShipAnimationFactory
Ship-specific animation creation utilities.

### Performance

#### PerformanceMonitor
Adaptive quality management with real-time monitoring.

## Contributing

When adding new features:

1. Follow the existing architecture patterns
2. Add tests for new functionality
3. Update this documentation
4. Consider performance implications
5. Maintain backwards compatibility

## License

Part of the Battleship Naval Strategy Game project.
# System Patterns

## System Architecture

### Layered Architecture Pattern
The application follows a clean layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (React Components, UI, User Interface) │
├─────────────────────────────────────────┤
│            Application Layer            │
│   (Game Logic, Business Rules, AI)     │
├─────────────────────────────────────────┤
│             Service Layer               │
│  (State Management, API, Multiplayer)  │
├─────────────────────────────────────────┤
│              Data Layer                 │
│   (Database, Persistence, Sync)        │
└─────────────────────────────────────────┘
```

### Component Architecture
- **Atomic Design**: UI components organized as atoms → molecules → organisms → templates → pages
- **Container/Presentational**: Smart containers manage state, dumb components handle presentation
- **Composition over Inheritance**: Favor component composition and hooks over class inheritance
- **Single Responsibility**: Each component has one clear purpose and responsibility

## Key Technical Decisions

### State Management Strategy
**Decision**: Zustand for client state, React Query for server state
**Rationale**: 
- Zustand provides minimal boilerplate with TypeScript support
- React Query handles caching, synchronization, and error states automatically
- Clear separation between client and server state concerns
- Performance benefits through selective subscriptions

### Rendering Architecture
**Decision**: Konva.js for game board rendering within React ecosystem
**Rationale**:
- Canvas-based rendering provides 60fps performance requirements
- React-Konva maintains declarative React patterns for canvas
- Scene graph architecture enables complex animations and interactions
- Mobile-optimized touch handling and responsive design

### Database Strategy
**Decision**: SQLite (local) → Electric-SQL (sync) → PostgreSQL (production)
**Rationale**:
- Offline-first architecture ensures gameplay without network dependency
- Electric-SQL provides automatic conflict resolution for multiplayer
- Migration path from SQLite to PostgreSQL supports scaling
- Local-first approach improves performance and user experience

### Real-time Synchronization
**Decision**: Electric-SQL with CRDT (Conflict-free Replicated Data Types)
**Rationale**:
- Automatic conflict resolution for simultaneous player actions
- Eventual consistency model suitable for turn-based gameplay
- Offline capability with automatic sync when reconnected
- Reduces server complexity and improves scalability

## Design Patterns in Use

### Frontend Patterns

#### Observer Pattern (State Management)
```typescript
// Zustand store with observers
const useGameStore = create<GameState>((set, get) => ({
  gameState: 'setup',
  currentPlayer: 1,
  updateGameState: (newState) => set({ gameState: newState }),
  // Observers automatically notified of state changes
}));
```

#### Strategy Pattern (AI Difficulty)
```typescript
interface AIStrategy {
  selectTarget(board: GameBoard, history: Move[]): Coordinate;
}

class BeginnerAI implements AIStrategy {
  selectTarget(): Coordinate { /* random targeting */ }
}

class ExpertAI implements AIStrategy {
  selectTarget(): Coordinate { /* probability-based targeting */ }
}
```

#### Factory Pattern (Ship Creation)
```typescript
class ShipFactory {
  static createShip(type: ShipType, era: HistoricalEra): Ship {
    switch (type) {
      case 'dreadnought': return new Dreadnought(era);
      case 'battlecruiser': return new Battlecruiser(era);
      // ... other ship types
    }
  }
}
```

#### Command Pattern (Game Actions)
```typescript
interface GameCommand {
  execute(): void;
  undo(): void;
}

class AttackCommand implements GameCommand {
  execute() { /* perform attack */ }
  undo() { /* revert attack */ }
}
```

### Backend Patterns

#### Repository Pattern (Data Access)
```typescript
interface GameRepository {
  save(game: Game): Promise<void>;
  findById(id: string): Promise<Game>;
  findByPlayer(playerId: string): Promise<Game[]>;
}

class SQLiteGameRepository implements GameRepository {
  // SQLite-specific implementation
}
```

#### Event Sourcing (Game History)
```typescript
interface GameEvent {
  type: string;
  timestamp: Date;
  playerId: string;
  data: any;
}

// Store events, not just current state
const gameEvents: GameEvent[] = [
  { type: 'SHIP_PLACED', timestamp: new Date(), playerId: '1', data: {...} },
  { type: 'ATTACK_MADE', timestamp: new Date(), playerId: '2', data: {...} }
];
```

## Component Relationships

### Game Engine Core Dependencies
```
GameEngine
├── GameState (central state management with memory optimization)
├── Player (player management with statistics tracking)
├── Ship (ship entities with abilities and damage states)
├── Board (game board with coordinate system and validation)
├── CombatEngine (advanced attack processing with powerups)
├── ShipManager (fleet composition with point balancing)
├── AbilityEngine (special ship abilities with cooldowns)
├── AIPlayer (4-level difficulty system with adaptive learning)
├── ValidationEngine (comprehensive rule enforcement)
└── EventEmitter (state change notifications for real-time sync)
```

### UI Component Hierarchy
```
GamePage
├── GameBoard
│   ├── PlayerGrid
│   │   ├── ShipComponent
│   │   └── AttackMarker
│   └── OpponentGrid
│       ├── AttackMarker
│       └── HitIndicator
├── FleetPanel
│   ├── ShipSelector
│   └── ShipInfo
└── GameControls
    ├── TurnIndicator
    └── ActionButtons
```

### State Flow Architecture
```
User Action → Component → Store Action → State Update → 
Component Re-render → UI Update → Game Engine → 
Database Persistence → Network Sync (if multiplayer)
```

## Critical Implementation Paths

### Game Initialization Flow
1. **Route Access**: Next.js router handles game URL
2. **Authentication**: Verify user session or enable guest mode
3. **Game Setup**: Initialize game state in Zustand store
4. **Database Connection**: Establish SQLite connection with Electric-SQL
5. **UI Rendering**: Mount React components with initial state
6. **Canvas Setup**: Initialize Konva.js stage and layers

### Multiplayer Synchronization Path
1. **Local Action**: Player makes move in UI
2. **Optimistic Update**: Immediate local state update
3. **Command Creation**: Generate game command object
4. **Database Write**: Store command in local SQLite
5. **Electric-SQL Sync**: Automatic sync to remote database
6. **Conflict Resolution**: CRDT handles simultaneous actions
7. **State Propagation**: Other clients receive updates
8. **UI Reconciliation**: Update opponent's view

### AI Decision Making Path
1. **Turn Trigger**: Game engine signals AI turn
2. **Board Analysis**: AI analyzes current game state with probability maps
3. **Strategy Selection**: Choose from 4 difficulty levels (Beginner to Expert)
4. **Algorithm Execution**: Apply progressive algorithms:
   - Beginner: Random targeting with center bias
   - Intermediate: Hunt/target with checkerboard patterns
   - Advanced: Probability density maps with Bayesian inference
   - Expert: Game tree lookahead with Monte Carlo Tree Search
5. **Target Calculation**: Multi-strategy ensemble for optimal coordinate selection
6. **Ability Consideration**: Evaluate ship abilities and powerup usage
7. **Move Validation**: Ensure move follows game rules and authorization
8. **Action Execution**: Execute attack through combat engine
9. **Learning Update**: Update behavioral patterns and opponent modeling
10. **State Update**: Update game state with memory management
11. **Response Delay**: Simulate realistic thinking time (200ms-2s based on difficulty)

### Ship Ability Activation Path
1. **Trigger Condition**: Player action or automatic activation condition
2. **Ability Validation**: Verify ship type and ability availability
3. **Cooldown Check**: Ensure ability is not on cooldown
4. **Resource Validation**: Check if ship is operational (not sunk)
5. **Target Validation**: Verify valid targets for ability effect
6. **Effect Calculation**: Apply ability-specific mechanics:
   - Dreadnought: All Big Guns (enhanced firepower)
   - Battlecruiser: Speed Advantage (extra actions)
   - Aircraft Carrier: Scouting (reveal enemy positions)
   - Submarine: Stealth Mode (immunity to detection)
   - Destroyer: Depth Charges (anti-submarine warfare)
   - Modern Ship: Sonar Detection (counter-stealth)
7. **Combat Integration**: Process ability through combat engine
8. **State Modification**: Update game state with ability effects
9. **Animation Trigger**: Queue visual effects for rendering
10. **Notification System**: Inform all players of ability activation
11. **Cooldown Management**: Start ability-specific cooldown timer
12. **Statistics Tracking**: Record ability usage for analytics

### Performance Optimization Patterns
- **Memory Management**: Circular buffer for game history (prevents unbounded growth)
- **AI Caching**: Memoization for expensive probability calculations
- **Component Memoization**: React.memo for expensive component renders
- **State Optimization**: Efficient game state updates with minimal re-renders
- **Algorithm Efficiency**: Optimized collision detection and pathfinding
- **Incremental Updates**: Probability maps updated incrementally vs full recalculation
- **Canvas Optimization**: Efficient Konva.js layer management for 60fps
- **Lazy Loading**: Load ship assets and AI strategies on demand
- **Debouncing**: Limit rapid user input processing
- **State Normalization**: Flat state structure for efficient updates
- **Parallel Processing**: Multiple AI strategies evaluated concurrently
- **Resource Cleanup**: Automatic cleanup of unused game objects

### Error Handling Patterns
- **Input Validation**: Comprehensive sanitization for all user inputs
- **Authorization Checks**: Player action authorization at every game operation
- **Graceful Degradation**: Fallback modes for AI failures and network issues
- **Circuit Breaker**: Prevent cascading failures in multiplayer synchronization
- **Retry Logic**: Automatic retry for transient network and database errors
- **Memory Leak Prevention**: Bounded collections and automatic cleanup
- **Security Hardening**: Rate limiting and anti-cheat pattern detection
- **User Feedback**: Clear error messages with recovery suggestions
- **Comprehensive Logging**: Error tracking with context for debugging
- **State Recovery**: Automatic game state recovery from corruption
- **Performance Monitoring**: Real-time detection of performance degradation

These patterns ensure maintainable, scalable, and performant code that supports the game's educational and entertainment goals.

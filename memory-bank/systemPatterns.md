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
├── ShipManager (manages fleet composition)
├── CombatResolver (handles attack logic)
├── AISystem (computer opponent)
├── ValidationEngine (rule enforcement)
└── EventEmitter (state change notifications)
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
2. **Board Analysis**: AI analyzes current game state
3. **Strategy Selection**: Choose appropriate difficulty strategy
4. **Target Calculation**: Apply algorithm to select coordinates
5. **Move Validation**: Ensure move follows game rules
6. **Action Execution**: Execute attack through game engine
7. **State Update**: Update game state and UI
8. **Response Delay**: Simulate human-like thinking time

### Ship Ability Activation Path
1. **Trigger Condition**: Specific game event occurs
2. **Ability Check**: Verify ship has required ability
3. **Cooldown Validation**: Ensure ability is available
4. **Effect Calculation**: Determine ability impact
5. **Animation Trigger**: Start visual effect sequence
6. **State Modification**: Apply ability effects to game state
7. **Notification**: Inform players of ability activation
8. **Cooldown Start**: Begin ability cooldown period

### Performance Optimization Patterns
- **Memoization**: React.memo for expensive component renders
- **Virtualization**: Render only visible game elements
- **Lazy Loading**: Load ship assets and sounds on demand
- **Debouncing**: Limit rapid user input processing
- **Canvas Optimization**: Efficient Konva.js layer management
- **State Normalization**: Flat state structure for efficient updates

### Error Handling Patterns
- **Graceful Degradation**: Fallback modes for feature failures
- **Circuit Breaker**: Prevent cascading failures in multiplayer
- **Retry Logic**: Automatic retry for transient network errors
- **User Feedback**: Clear error messages with recovery suggestions
- **Logging**: Comprehensive error tracking for debugging

These patterns ensure maintainable, scalable, and performant code that supports the game's educational and entertainment goals.

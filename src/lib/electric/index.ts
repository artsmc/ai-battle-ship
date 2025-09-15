/**
 * Electric-SQL Module Exports
 * Main entry point for Electric-SQL functionality
 */

// Configuration
export { ELECTRIC_SHAPES, ELECTRIC_TABLES, electricConfig } from './config'
export type { ElectricConfigType, ElectricShapes, ElectricTables } from './config'

// Types
export * from './types'

// Schema
export {
  ChatMessageSchema, GameMoveSchema, GameSchema, schema, ShipPlacementSchema, UserSchema
} from './schema'
export type {
  ChatMessageInput, GameInput, GameMoveInput, ShipPlacementInput, UserInput
} from './schema'

// Database
export {
  clearLocalData as clearDatabaseData, closeDatabase, getDatabase, initializeDatabase, resetDatabase
} from './database'

// Connection management
export {
  clearLocalData, connect,
  disconnect, getConnectionStatus, getSyncStatus, isConnected, subscribeToConnectionEvents, syncNow
} from './connection'

// Subscriptions
export {
  getActiveSubscriptionCount,
  isSubscribedTo, subscribeToActiveGame, subscribeToChatMessages, subscribeToGameHistory, subscribeToGameMoves, subscribeToLeaderboard, subscribeToShipPlacements, subscribeToUserProfile, unsubscribeAll
} from './subscriptions'

// Error handling
export {
  AuthenticationError, ConnectionError,
  ConnectionTimeoutError, DatabaseError, DataConflictError, ElectricError, globalErrorHandler, initializeErrorRecovery, ReconnectionFailedError, SchemaValidationError, ShapeSubscriptionError, SyncError, TransactionError, withErrorHandling
} from './errors'
export type { ErrorRecoveryStrategy } from './errors'

// React components and hooks
export {
  ElectricProvider,
  useElectric, useElectricClient, useElectricConnection,
  useElectricSync
} from './ElectricProvider'


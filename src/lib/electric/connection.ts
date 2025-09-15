/**
 * Electric-SQL Connection Management
 * Handles connection lifecycle, reconnection, and health monitoring
 */

import { ElectricClient, SyncStatus } from './types'
import { electricConfig } from './config'
import { initializeDatabase, getDatabase, closeDatabase } from './database'

// Connection state
interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  lastConnectedAt?: Date
  lastDisconnectedAt?: Date
  lastError?: Error
  reconnectAttempts: number
  isReconnecting: boolean
}

// Global connection state
let connectionState: ConnectionState = {
  status: 'disconnected',
  reconnectAttempts: 0,
  isReconnecting: false,
}

// Connection event listeners
type ConnectionEventType = 'connected' | 'disconnected' | 'error' | 'reconnecting'
type ConnectionListener = (event: ConnectionEvent) => void

interface ConnectionEvent {
  type: ConnectionEventType
  timestamp: Date
  data?: unknown
  error?: Error
}

const connectionListeners: Map<string, ConnectionListener> = new Map()

/**
 * Connect to Electric-SQL service
 */
export async function connect(): Promise<ElectricClient> {
  if (connectionState.status === 'connecting') {
    // Connection already in progress
    return waitForConnection()
  }

  if (connectionState.status === 'connected') {
    const db = getDatabase()
    if (db) {
      return db
    }
  }

  connectionState.status = 'connecting'
  notifyListeners({ type: 'reconnecting', timestamp: new Date() })

  try {
    const electric = await initializeDatabase()

    // Update connection state
    connectionState = {
      status: 'connected',
      lastConnectedAt: new Date(),
      reconnectAttempts: 0,
      isReconnecting: false,
    }

    notifyListeners({ type: 'connected', timestamp: new Date() })

    // Set up automatic reconnection
    setupReconnection(electric)

    return electric
  } catch (error) {
    connectionState.status = 'error'
    connectionState.lastError = error as Error

    notifyListeners({
      type: 'error',
      timestamp: new Date(),
      error: error as Error,
    })

    // Attempt reconnection
    if (electricConfig.connection.reconnect) {
      scheduleReconnection()
    }

    throw error
  }
}

/**
 * Disconnect from Electric-SQL service
 */
export async function disconnect(): Promise<void> {
  try {
    await closeDatabase()

    connectionState = {
      status: 'disconnected',
      lastDisconnectedAt: new Date(),
      reconnectAttempts: 0,
      isReconnecting: false,
    }

    notifyListeners({ type: 'disconnected', timestamp: new Date() })
  } catch (error) {
    console.error('Error during disconnect:', error)
    throw error
  }
}

/**
 * Check if connected to Electric-SQL service
 */
export function isConnected(): boolean {
  return connectionState.status === 'connected'
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionState {
  return { ...connectionState }
}

/**
 * Wait for connection to be established
 */
async function waitForConnection(): Promise<ElectricClient> {
  const maxWaitTime = electricConfig.connection.connectionTimeout
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    if (connectionState.status === 'connected') {
      const db = getDatabase()
      if (db) {
        return db
      }
    }

    if (connectionState.status === 'error') {
      throw connectionState.lastError || new Error('Connection failed')
    }

    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error('Connection timeout')
}

/**
 * Set up automatic reconnection
 */
function setupReconnection(client: ElectricClient): void {
  // Monitor connection health
  const heartbeatInterval = setInterval(async () => {
    try {
      if (!client.isConnected()) {
        clearInterval(heartbeatInterval)
        handleDisconnection()
      }
    } catch (error) {
      clearInterval(heartbeatInterval)
      handleDisconnection()
    }
  }, electricConfig.connection.heartbeatInterval)
}

/**
 * Handle disconnection
 */
function handleDisconnection(): void {
  if (connectionState.status === 'disconnected' || connectionState.isReconnecting) {
    return
  }

  connectionState.status = 'disconnected'
  connectionState.lastDisconnectedAt = new Date()

  notifyListeners({ type: 'disconnected', timestamp: new Date() })

  if (electricConfig.connection.reconnect) {
    scheduleReconnection()
  }
}

/**
 * Schedule reconnection attempt
 */
function scheduleReconnection(): void {
  if (connectionState.isReconnecting) {
    return
  }

  connectionState.isReconnecting = true
  connectionState.reconnectAttempts++

  const delay = calculateReconnectDelay()

  if (connectionState.reconnectAttempts > electricConfig.connection.maxReconnectAttempts) {
    console.error('Max reconnection attempts reached')
    connectionState.isReconnecting = false
    return
  }

  if (electricConfig.debug) {
    console.log(`Reconnecting in ${delay}ms (attempt ${connectionState.reconnectAttempts})`)
  }

  setTimeout(async () => {
    try {
      await connect()
      connectionState.isReconnecting = false
    } catch (error) {
      console.error('Reconnection failed:', error)
      scheduleReconnection()
    }
  }, delay)
}

/**
 * Calculate reconnection delay with exponential backoff
 */
function calculateReconnectDelay(): number {
  const { reconnectDelay, maxReconnectDelay, reconnectDelayMultiplier } =
    electricConfig.connection

  const delay =
    reconnectDelay *
    Math.pow(reconnectDelayMultiplier, connectionState.reconnectAttempts - 1)

  return Math.min(delay, maxReconnectDelay)
}

/**
 * Subscribe to connection events
 */
export function subscribeToConnectionEvents(
  listener: ConnectionListener
): () => void {
  const id = Math.random().toString(36).substring(7)
  connectionListeners.set(id, listener)

  // Return unsubscribe function
  return () => {
    connectionListeners.delete(id)
  }
}

/**
 * Notify all connection event listeners
 */
function notifyListeners(event: ConnectionEvent): void {
  connectionListeners.forEach((listener) => {
    try {
      listener(event)
    } catch (error) {
      console.error('Error in connection event listener:', error)
    }
  })
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const client = await connect()

  return {
    connected: client.isConnected(),
    syncing: false, // Will be updated based on actual sync state
    lastSyncedAt: connectionState.lastConnectedAt || null,
    pendingChanges: 0, // Will be updated based on actual pending changes
  }
}

/**
 * Force sync now
 */
export async function syncNow(): Promise<void> {
  const client = await connect()

  try {
    await client.sync.syncNow()
    if (electricConfig.debug) {
      console.log('Manual sync completed')
    }
  } catch (error) {
    console.error('Manual sync failed:', error)
    throw error
  }
}

/**
 * Clear all local data
 */
export async function clearLocalData(): Promise<void> {
  const client = await connect()

  try {
    await client.sync.clearLocal()
    if (electricConfig.debug) {
      console.log('Local data cleared')
    }
  } catch (error) {
    console.error('Failed to clear local data:', error)
    throw error
  }
}
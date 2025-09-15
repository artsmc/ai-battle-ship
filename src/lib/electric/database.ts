/**
 * Electric-SQL Database Initialization
 * SQLite database setup for local development and offline-first functionality
 */

// Import statements for Electric-SQL will be added when wa-sqlite integration is ready
// import { electrify } from 'electric-sql/wa-sqlite'
// import { electricConfig } from './config'
import { ElectricClient } from './types'

// Database instance singleton
let dbInstance: ElectricClient | null = null
let isInitializing = false
let initializationPromise: Promise<ElectricClient> | null = null

/**
 * Initialize the SQLite database with Electric-SQL
 */
export async function initializeDatabase(): Promise<ElectricClient> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance
  }

  // Wait for ongoing initialization
  if (isInitializing && initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  isInitializing = true
  initializationPromise = createDatabase()

  try {
    dbInstance = await initializationPromise
    return dbInstance
  } finally {
    isInitializing = false
    initializationPromise = null
  }
}

/**
 * Create and configure the Electric database
 */
async function createDatabase(): Promise<ElectricClient> {
  try {
    // For now, we'll create a mock client until we can properly integrate wa-sqlite
    // This is a simplified version that will be replaced with actual implementation

    const mockClient: ElectricClient = {
      db: {
        users: createMockTable('users'),
        games: createMockTable('games'),
        ship_placements: createMockTable('ship_placements'),
        game_moves: createMockTable('game_moves'),
        chat_messages: createMockTable('chat_messages'),
      },
      sync: {
        status: {
          connected: false,
          syncing: false,
          lastSyncedAt: null,
          pendingChanges: 0,
        },
        subscribe: async () => ({ unsubscribe: () => {} }),
        unsubscribe: () => {},
        syncNow: async () => {},
        clearLocal: async () => {},
      },
      connect: async () => {},
      disconnect: async () => {},
      isConnected: () => false,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Electric-SQL mock client initialized (development mode)')
    }
    return mockClient
  } catch (error) {
    console.error('Failed to initialize Electric-SQL database:', error)
    throw error
  }
}

/**
 * Create a mock table for development
 */
function createMockTable<T>(_tableName: string): any {
  const data: Map<string, T> = new Map()
  const subscribers: Set<(data: T[]) => void> = new Set()

  return {
    findMany: async (_options?: any) => {
      return Array.from(data.values())
    },
    findUnique: async (options: any) => {
      return data.get(options.where.id) || null
    },
    create: async (item: Partial<T>) => {
      const id = Math.random().toString(36).substring(7)
      const newItem = { ...item, id } as T
      data.set(id, newItem)
      subscribers.forEach(cb => cb(Array.from(data.values())))
      return newItem
    },
    update: async (options: { where: { id: string }; data: Partial<T> }) => {
      const existing = data.get(options.where.id)
      if (existing) {
        const updated = { ...existing, ...options.data }
        data.set(options.where.id, updated)
        subscribers.forEach(cb => cb(Array.from(data.values())))
        return updated
      }
      throw new Error('Item not found')
    },
    delete: async (options: any) => {
      data.delete(options.where.id)
      subscribers.forEach(cb => cb(Array.from(data.values())))
    },
    subscribe: (callback: (data: T[]) => void) => {
      subscribers.add(callback)
      return {
        unsubscribe: () => {
          subscribers.delete(callback)
        },
      }
    },
  }
}


/**
 * Get the current database instance
 */
export function getDatabase(): ElectricClient | null {
  return dbInstance
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.disconnect()
      dbInstance = null
      if (process.env.NODE_ENV === 'development') {
        console.log('Electric-SQL database closed')
      }
    } catch (error) {
      console.error('Error closing Electric-SQL database:', error)
      throw error
    }
  }
}

/**
 * Clear all local data
 */
export async function clearLocalData(): Promise<void> {
  const client = await initializeDatabase()

  try {
    // Clear local sync data
    await client.sync.clearLocal()
    if (process.env.NODE_ENV === 'development') {
      console.log('Local data cleared successfully')
    }
  } catch (error) {
    console.error('Error clearing local data:', error)
    throw error
  }
}

/**
 * Reset the database (clear and reinitialize)
 */
export async function resetDatabase(): Promise<void> {
  await closeDatabase()
  await clearLocalData()
  await initializeDatabase()
}
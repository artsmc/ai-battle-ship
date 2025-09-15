/**
 * Electric-SQL Provider Component
 * React context provider for Electric-SQL client
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { ElectricClient, SyncStatus } from './types'
import { connect, disconnect, isConnected, subscribeToConnectionEvents, getSyncStatus } from './connection'
import { initializeErrorRecovery, globalErrorHandler, ElectricError } from './errors'
import { clearLocalData, syncNow } from './connection'

// Electric context type
interface ElectricContextType {
  client: ElectricClient | null
  isConnected: boolean
  isLoading: boolean
  syncStatus: SyncStatus | null
  error: Error | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  syncNow: () => Promise<void>
  clearLocalData: () => Promise<void>
}

// Create context
const ElectricContext = createContext<ElectricContextType | undefined>(undefined)

// Provider props
interface ElectricProviderProps {
  children: ReactNode
  autoConnect?: boolean
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: ElectricError) => void
  onSyncStatusChange?: (status: SyncStatus) => void
}

/**
 * Electric-SQL Provider Component
 */
export function ElectricProvider({
  children,
  autoConnect = true,
  onConnectionChange,
  onError,
  onSyncStatusChange,
}: ElectricProviderProps) {
  const [client, setClient] = useState<ElectricClient | null>(null)
  const [isConnectedState, setIsConnectedState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Connect to Electric-SQL
  const handleConnect = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const electricClient = await connect()
      setClient(electricClient)
      setIsConnectedState(true)

      // Get initial sync status
      const status = await getSyncStatus()
      setSyncStatus(status)

      if (onConnectionChange) {
        onConnectionChange(true)
      }
    } catch (err) {
      const error = err as Error
      console.error('Failed to connect to Electric-SQL:', error)
      setError(error)
      setIsConnectedState(false)

      if (onConnectionChange) {
        onConnectionChange(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [onConnectionChange])

  // Disconnect from Electric-SQL
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      setClient(null)
      setIsConnectedState(false)
      setSyncStatus(null)

      if (onConnectionChange) {
        onConnectionChange(false)
      }
    } catch (err) {
      const error = err as Error
      console.error('Failed to disconnect from Electric-SQL:', error)
      setError(error)
    }
  }, [onConnectionChange])

  // Force sync
  const handleSyncNow = useCallback(async () => {
    try {
      await syncNow()

      // Update sync status
      const status = await getSyncStatus()
      setSyncStatus(status)

      if (onSyncStatusChange) {
        onSyncStatusChange(status)
      }
    } catch (err) {
      const error = err as Error
      console.error('Failed to sync:', error)
      setError(error)
    }
  }, [onSyncStatusChange])

  // Clear local data
  const handleClearLocalData = useCallback(async () => {
    try {
      await clearLocalData()
      // Local data cleared

      // Resync after clearing
      await handleSyncNow()
    } catch (err) {
      const error = err as Error
      console.error('Failed to clear local data:', error)
      setError(error)
    }
  }, [handleSyncNow])

  // Initialize error recovery on mount
  useEffect(() => {
    initializeErrorRecovery(
      handleConnect,
      handleClearLocalData,
      handleSyncNow
    )

    // Subscribe to error events
    const unsubscribeError = globalErrorHandler.addErrorListener((error) => {
      setError(error)
      if (onError) {
        onError(error)
      }
    })

    return () => {
      unsubscribeError()
    }
  }, [handleConnect, handleClearLocalData, handleSyncNow, onError])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      handleConnect()
    }

    return () => {
      // Clean up on unmount
      if (isConnected()) {
        handleDisconnect()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]) // Only run on mount

  // Subscribe to connection events
  useEffect(() => {
    const unsubscribe = subscribeToConnectionEvents((event) => {
      switch (event.type) {
        case 'connected':
          setIsConnectedState(true)
          setError(null)
          if (onConnectionChange) {
            onConnectionChange(true)
          }
          break

        case 'disconnected':
          setIsConnectedState(false)
          if (onConnectionChange) {
            onConnectionChange(false)
          }
          break

        case 'error':
          setError(event.error || new Error('Unknown connection error'))
          break

        case 'reconnecting':
          // Reconnecting to Electric-SQL...
          break
      }
    })

    return unsubscribe
  }, [onConnectionChange])

  // Update sync status periodically
  useEffect(() => {
    if (!isConnectedState) return

    const updateSyncStatus = async () => {
      try {
        const status = await getSyncStatus()
        setSyncStatus(status)

        if (onSyncStatusChange) {
          onSyncStatusChange(status)
        }
      } catch (err) {
        console.error('Failed to get sync status:', err)
      }
    }

    // Update immediately
    updateSyncStatus()

    // Update every 5 seconds
    const interval = setInterval(updateSyncStatus, 5000)

    return () => clearInterval(interval)
  }, [isConnectedState, onSyncStatusChange])

  const contextValue: ElectricContextType = {
    client,
    isConnected: isConnectedState,
    isLoading,
    syncStatus,
    error,
    connect: handleConnect,
    disconnect: handleDisconnect,
    syncNow: handleSyncNow,
    clearLocalData: handleClearLocalData,
  }

  return (
    <ElectricContext.Provider value={contextValue}>
      {children}
    </ElectricContext.Provider>
  )
}

/**
 * Hook to use Electric-SQL context
 */
export function useElectric() {
  const context = useContext(ElectricContext)

  if (context === undefined) {
    throw new Error('useElectric must be used within an ElectricProvider')
  }

  return context
}

/**
 * Hook to check connection status
 */
export function useElectricConnection() {
  const { isConnected, isLoading, error } = useElectric()

  return {
    isConnected,
    isLoading,
    error,
  }
}

/**
 * Hook to get sync status
 */
export function useElectricSync() {
  const { syncStatus, syncNow, clearLocalData } = useElectric()

  return {
    syncStatus,
    syncNow,
    clearLocalData,
  }
}

/**
 * Hook to get Electric client
 */
export function useElectricClient() {
  const { client } = useElectric()

  if (!client) {
    throw new Error('Electric client not initialized. Make sure the provider is connected.')
  }

  return client
}
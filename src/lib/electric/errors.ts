/**
 * Electric-SQL Error Handling
 * Custom error classes and error recovery strategies
 */

// Base Electric error class
export class ElectricError extends Error {
  public readonly code: string
  public readonly timestamp: Date
  public readonly context?: unknown

  constructor(message: string, code: string, context?: unknown) {
    super(message)
    this.name = 'ElectricError'
    this.code = code
    this.timestamp = new Date()
    this.context = context
    Object.setPrototypeOf(this, ElectricError.prototype)
  }
}

// Connection-related errors
export class ConnectionError extends ElectricError {
  constructor(message: string, context?: unknown) {
    super(message, 'CONNECTION_ERROR', context)
    this.name = 'ConnectionError'
    Object.setPrototypeOf(this, ConnectionError.prototype)
  }
}

export class ConnectionTimeoutError extends ConnectionError {
  constructor(timeoutMs: number) {
    super(`Connection timeout after ${timeoutMs}ms`, { timeoutMs })
    this.name = 'ConnectionTimeoutError'
    Object.setPrototypeOf(this, ConnectionTimeoutError.prototype)
  }
}

export class ReconnectionFailedError extends ConnectionError {
  constructor(attempts: number) {
    super(`Failed to reconnect after ${attempts} attempts`, { attempts })
    this.name = 'ReconnectionFailedError'
    Object.setPrototypeOf(this, ReconnectionFailedError.prototype)
  }
}

// Sync-related errors
export class SyncError extends ElectricError {
  constructor(message: string, context?: unknown) {
    super(message, 'SYNC_ERROR', context)
    this.name = 'SyncError'
    Object.setPrototypeOf(this, SyncError.prototype)
  }
}

export class ShapeSubscriptionError extends SyncError {
  constructor(shape: string, reason: string) {
    super(`Failed to subscribe to shape ${shape}: ${reason}`, { shape, reason })
    this.name = 'ShapeSubscriptionError'
    Object.setPrototypeOf(this, ShapeSubscriptionError.prototype)
  }
}

export class DataConflictError extends SyncError {
  constructor(table: string, conflictDetails: unknown) {
    super(`Data conflict in table ${table}`, { table, conflictDetails })
    this.name = 'DataConflictError'
    Object.setPrototypeOf(this, DataConflictError.prototype)
  }
}

// Database-related errors
export class DatabaseError extends ElectricError {
  constructor(message: string, context?: unknown) {
    super(message, 'DATABASE_ERROR', context)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

export class SchemaValidationError extends DatabaseError {
  constructor(table: string, errors: unknown) {
    super(`Schema validation failed for table ${table}`, { table, errors })
    this.name = 'SchemaValidationError'
    Object.setPrototypeOf(this, SchemaValidationError.prototype)
  }
}

export class TransactionError extends DatabaseError {
  constructor(operation: string, reason: string) {
    super(`Transaction failed during ${operation}: ${reason}`, { operation, reason })
    this.name = 'TransactionError'
    Object.setPrototypeOf(this, TransactionError.prototype)
  }
}

// Auth-related errors
export class AuthenticationError extends ElectricError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  canRecover(error: Error): boolean
  recover(error: Error): Promise<void>
}

// Connection error recovery
export class ConnectionErrorRecovery implements ErrorRecoveryStrategy {
  private maxRetries: number
  private retryDelay: number
  private onReconnect?: () => Promise<void>

  constructor(maxRetries = 3, retryDelay = 1000, onReconnect?: () => Promise<void>) {
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
    this.onReconnect = onReconnect
  }

  canRecover(error: Error): boolean {
    return (
      error instanceof ConnectionError &&
      !(error instanceof ReconnectionFailedError)
    )
  }

  async recover(_error: Error): Promise<void> {
    // Attempting to recover from connection error

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt))

        if (this.onReconnect) {
          await this.onReconnect()
        }

        // Recovery successful
        return
      } catch (retryError) {
        console.error(`Recovery attempt ${attempt} failed:`, retryError)

        if (attempt === this.maxRetries) {
          throw new ReconnectionFailedError(this.maxRetries)
        }
      }
    }
  }
}

// Sync error recovery
export class SyncErrorRecovery implements ErrorRecoveryStrategy {
  private onClearLocal?: () => Promise<void>
  private onResync?: () => Promise<void>

  constructor(onClearLocal?: () => Promise<void>, onResync?: () => Promise<void>) {
    this.onClearLocal = onClearLocal
    this.onResync = onResync
  }

  canRecover(error: Error): boolean {
    return error instanceof SyncError
  }

  async recover(error: Error): Promise<void> {
    // Attempting to recover from sync error

    if (error instanceof DataConflictError) {
      // For data conflicts, clear local and resync
      if (this.onClearLocal) {
        await this.onClearLocal()
      }
    }

    // Attempt to resync
    if (this.onResync) {
      await this.onResync()
    }

    // Sync recovery completed
  }
}

// Error handler with recovery
export class ErrorHandler {
  private strategies: ErrorRecoveryStrategy[] = []
  private errorListeners: Set<(error: ElectricError) => void> = new Set()

  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.push(strategy)
  }

  addErrorListener(listener: (error: ElectricError) => void): () => void {
    this.errorListeners.add(listener)
    return () => this.errorListeners.delete(listener)
  }

  async handleError(error: Error): Promise<void> {
    // Log the error
    console.error('Electric-SQL Error:', error)

    // Notify listeners if it's an ElectricError
    if (error instanceof ElectricError) {
      this.errorListeners.forEach((listener) => listener(error))
    }

    // Try recovery strategies
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error)
          // Error recovered successfully
          return
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError)
        }
      }
    }

    // If no recovery possible, re-throw
    throw error
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler()

// Utility function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const electricError = error instanceof ElectricError
      ? error
      : new ElectricError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR',
          { originalError: error, context: errorContext }
        )

    await globalErrorHandler.handleError(electricError)
    throw electricError
  }
}

// Initialize default recovery strategies
export function initializeErrorRecovery(
  onReconnect?: () => Promise<void>,
  onClearLocal?: () => Promise<void>,
  onResync?: () => Promise<void>
): void {
  globalErrorHandler.addRecoveryStrategy(
    new ConnectionErrorRecovery(3, 1000, onReconnect)
  )

  globalErrorHandler.addRecoveryStrategy(
    new SyncErrorRecovery(onClearLocal, onResync)
  )
}
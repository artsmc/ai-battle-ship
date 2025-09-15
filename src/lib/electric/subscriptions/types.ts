/**
 * Subscription Types
 * Type definitions for Electric-SQL subscriptions
 */

import { ElectricShape } from '../types'

// Subscription callback type
export type SubscriptionCallback<T> = (data: ElectricShape<T>) => void

// Subscription key type for tracking active subscriptions
export type SubscriptionKey = string

// Subscription registry entry
export interface SubscriptionEntry {
  key: SubscriptionKey
  unsubscribe: () => void
  callback: SubscriptionCallback<unknown>
}

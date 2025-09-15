/**
 * Subscription Manager
 * Manages active subscriptions and cleanup
 */

import { connect } from '../connection'
import { ElectricSubscription } from '../types'
import { SubscriptionCallback, SubscriptionKey } from './types'

// Active subscriptions registry
const activeSubscriptions: Map<string, ElectricSubscription> = new Map()

// Subscription callbacks registry
const subscriptionCallbacks: Map<string, Set<SubscriptionCallback<unknown>>> = new Map()

/**
 * Unsubscribe from a shape
 */
export async function unsubscribeFromShape(key: string): Promise<void> {
  const subscription = activeSubscriptions.get(key)
  if (subscription) {
    try {
      const client = await connect()
      client.sync.unsubscribe(subscription)
      activeSubscriptions.delete(key)
      subscriptionCallbacks.delete(key)
    } catch (error) {
      console.error(`Failed to unsubscribe from ${key}:`, error)
    }
  }
}

/**
 * Unsubscribe from all active subscriptions
 */
export async function unsubscribeAll(): Promise<void> {
  const keys = Array.from(activeSubscriptions.keys())

  for (const key of keys) {
    await unsubscribeFromShape(key)
  }

  activeSubscriptions.clear()
  subscriptionCallbacks.clear()
}

/**
 * Get active subscription count
 */
export function getActiveSubscriptionCount(): number {
  return activeSubscriptions.size
}

/**
 * Check if subscribed to a specific shape
 */
export function isSubscribedTo(key: string): boolean {
  return activeSubscriptions.has(key)
}

/**
 * Register a subscription
 */
export function registerSubscription(
  key: SubscriptionKey,
  subscription: ElectricSubscription,
  callback: SubscriptionCallback<unknown>
): void {
  activeSubscriptions.set(key, subscription)
  
  if (!subscriptionCallbacks.has(key)) {
    subscriptionCallbacks.set(key, new Set())
  }
  subscriptionCallbacks.get(key)?.add(callback)
}

/**
 * Get subscription callbacks for a key
 */
export function getSubscriptionCallbacks(key: SubscriptionKey): Set<SubscriptionCallback<unknown>> | undefined {
  return subscriptionCallbacks.get(key)
}

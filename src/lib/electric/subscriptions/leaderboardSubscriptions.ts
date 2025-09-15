/**
 * Leaderboard Subscriptions
 * Subscription functions for leaderboard and ranking data
 */

import { ELECTRIC_SHAPES } from '../config'
import { connect } from '../connection'
import { ShapeDefinition, User } from '../types'
import { registerSubscription, unsubscribeFromShape } from './subscriptionManager'
import { SubscriptionCallback } from './types'

/**
 * Subscribe to leaderboard updates
 */
export async function subscribeToLeaderboard(
  callback: SubscriptionCallback<User>,
  limit: number = 100
): Promise<() => void> {
  const subscriptionKey = 'leaderboard'

  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    const shape: ShapeDefinition = {
      table: ELECTRIC_SHAPES.leaderboard.table,
      where: ELECTRIC_SHAPES.leaderboard.where,
      orderBy: [...ELECTRIC_SHAPES.leaderboard.orderBy],
      limit,
    }

    const subscription = await client.sync.subscribe(shape)

    const db = client.db
    const unsubscribeDb = db.users.subscribe((users: User[]) => {
      const leaderboardUsers = users
        .filter((u) => u.games_played >= 5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit)

      callback({
        data: leaderboardUsers,
        synced: true,
        loading: false,
      })
    })

    registerSubscription(subscriptionKey, subscription, callback as SubscriptionCallback<unknown>)

    return () => {
      unsubscribeDb.unsubscribe()
      unsubscribeFromShape(subscriptionKey)
    }
  } catch (error) {
    console.error('Failed to subscribe to leaderboard:', error)
    throw error
  }
}
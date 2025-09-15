/**
 * User Subscriptions
 * Subscription functions for user profile and user-related data
 */

import { connect } from '../connection'
import { Game, ShapeDefinition, User } from '../types'
import { registerSubscription, unsubscribeFromShape } from './subscriptionManager'
import { SubscriptionCallback } from './types'

/**
 * Subscribe to user profile updates
 */
export async function subscribeToUserProfile(
  userId: string,
  callback: SubscriptionCallback<User>
): Promise<() => void> {
  const subscriptionKey = `user-profile-${userId}`

  // Unsubscribe existing subscription if any
  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    // Create shape definition
    const shape: ShapeDefinition = {
      table: 'users',
      where: `id = '${userId}'`,
      include: [
        {
          table: 'games',
          as: 'player1Games',
          foreignKey: 'player1_id',
          where: `player1_id = '${userId}'`,
        },
        {
          table: 'games',
          as: 'player2Games',
          foreignKey: 'player2_id',
          where: `player2_id = '${userId}'`,
        },
      ],
    }

    // Subscribe to shape
    const subscription = await client.sync.subscribe(shape)

    // Set up data change listener
    const db = client.db
    const unsubscribeDb = db.users.subscribe((users: User[]) => {
      const user = users.find((u) => u.id === userId)
      if (user) {
        callback({
          data: [user],
          synced: true,
          loading: false,
        })
      }
    })

    // Register subscription
    registerSubscription(subscriptionKey, subscription, callback as SubscriptionCallback<unknown>)

    // Return unsubscribe function
    return () => {
      unsubscribeDb.unsubscribe()
      unsubscribeFromShape(subscriptionKey)
    }
  } catch (error) {
    console.error('Failed to subscribe to user profile:', error)
    throw error
  }
}

/**
 * Subscribe to user's game history
 */
export async function subscribeToGameHistory(
  userId: string,
  callback: SubscriptionCallback<Game>,
  limit: number = 50
): Promise<() => void> {
  const subscriptionKey = `game-history-${userId}`

  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    const shape: ShapeDefinition = {
      table: 'games',
      where: `player1_id = '${userId}' OR player2_id = '${userId}'`,
      orderBy: [{ column: 'created_at', direction: 'DESC' }],
      limit,
    }

    const subscription = await client.sync.subscribe(shape)

    const db = client.db
    const unsubscribeDb = db.games.subscribe((games: Game[]) => {
      const userGames = games
        .filter((g) => g.player1_id === userId || g.player2_id === userId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, limit)

      callback({
        data: userGames,
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
    console.error('Failed to subscribe to game history:', error)
    throw error
  }
}
/**
 * Game State Subscriptions
 * Subscription functions for active game state and real-time updates
 */

import { connect } from '../connection'
import { Game, ShapeDefinition } from '../types'
import { registerSubscription, unsubscribeFromShape } from './subscriptionManager'
import { SubscriptionCallback } from './types'

/**
 * Subscribe to active game updates
 */
export async function subscribeToActiveGame(
  gameId: string,
  callback: SubscriptionCallback<Game>
): Promise<() => void> {
  const subscriptionKey = `active-game-${gameId}`

  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    // Create shape definition with all related data
    const shape: ShapeDefinition = {
      table: 'games',
      where: `id = '${gameId}'`,
      include: [
        {
          table: 'ship_placements',
          foreignKey: 'game_id',
        },
        {
          table: 'game_moves',
          foreignKey: 'game_id',
        },
        {
          table: 'chat_messages',
          foreignKey: 'game_id',
        },
      ],
    }

    // Subscribe to shape
    const subscription = await client.sync.subscribe(shape)

    // Set up data change listener
    const db = client.db
    const unsubscribeDb = db.games.subscribe((games: Game[]) => {
      const game = games.find((g) => g.id === gameId)
      if (game) {
        callback({
          data: [game],
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
    console.error('Failed to subscribe to active game:', error)
    throw error
  }
}
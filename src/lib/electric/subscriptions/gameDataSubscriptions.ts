/**
 * Game Data Subscriptions
 * Subscription functions for game moves, ship placements, and chat messages
 */

import { connect } from '../connection'
import { ChatMessage, GameMove, ShapeDefinition, ShipPlacement } from '../types'
import { registerSubscription, unsubscribeFromShape } from './subscriptionManager'
import { SubscriptionCallback } from './types'

/**
 * Subscribe to game moves
 */
export async function subscribeToGameMoves(
  gameId: string,
  callback: SubscriptionCallback<GameMove>
): Promise<() => void> {
  const subscriptionKey = `game-moves-${gameId}`

  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    const shape: ShapeDefinition = {
      table: 'game_moves',
      where: `game_id = '${gameId}'`,
      orderBy: [{ column: 'move_number', direction: 'ASC' }],
    }

    const subscription = await client.sync.subscribe(shape)

    const db = client.db
    const unsubscribeDb = db.game_moves.subscribe((moves: GameMove[]) => {
      const gameMoves = moves.filter((m) => m.game_id === gameId)
      callback({
        data: gameMoves,
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
    console.error('Failed to subscribe to game moves:', error)
    throw error
  }
}

/**
 * Subscribe to chat messages
 */
export async function subscribeToChatMessages(
  gameId: string,
  callback: SubscriptionCallback<ChatMessage>
): Promise<() => void> {
  const subscriptionKey = `chat-messages-${gameId}`

  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    const shape: ShapeDefinition = {
      table: 'chat_messages',
      where: `game_id = '${gameId}'`,
      orderBy: [{ column: 'created_at', direction: 'ASC' }],
    }

    const subscription = await client.sync.subscribe(shape)

    const db = client.db
    const unsubscribeDb = db.chat_messages.subscribe((messages: ChatMessage[]) => {
      const gameMessages = messages.filter((m) => m.game_id === gameId)
      callback({
        data: gameMessages,
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
    console.error('Failed to subscribe to chat messages:', error)
    throw error
  }
}

/**
 * Subscribe to ship placements for a game
 */
export async function subscribeToShipPlacements(
  gameId: string,
  playerId: string,
  callback: SubscriptionCallback<ShipPlacement>
): Promise<() => void> {
  const subscriptionKey = `ship-placements-${gameId}-${playerId}`

  await unsubscribeFromShape(subscriptionKey)

  try {
    const client = await connect()

    const shape: ShapeDefinition = {
      table: 'ship_placements',
      where: `game_id = '${gameId}' AND player_id = '${playerId}'`,
    }

    const subscription = await client.sync.subscribe(shape)

    const db = client.db
    const unsubscribeDb = db.ship_placements.subscribe((placements: ShipPlacement[]) => {
      const playerPlacements = placements.filter(
        (p) => p.game_id === gameId && p.player_id === playerId
      )

      callback({
        data: playerPlacements,
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
    console.error('Failed to subscribe to ship placements:', error)
    throw error
  }
}
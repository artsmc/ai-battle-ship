/**
 * Electric-SQL Subscription Management
 * Main entry point for subscription functionality
 */

// Re-export user subscription functions
export { subscribeToUserProfile, subscribeToGameHistory } from './userSubscriptions'

// Re-export game state subscription functions
export { subscribeToActiveGame } from './gameStateSubscriptions'

// Re-export game data subscription functions
export {
  subscribeToGameMoves,
  subscribeToChatMessages,
  subscribeToShipPlacements
} from './gameDataSubscriptions'

// Re-export leaderboard subscription functions
export { subscribeToLeaderboard } from './leaderboardSubscriptions'

// Re-export subscription management functions
export {
  getActiveSubscriptionCount,
  isSubscribedTo,
  unsubscribeAll,
  unsubscribeFromShape
} from './subscriptionManager'

// Re-export types
export type { SubscriptionCallback, SubscriptionKey } from './types'


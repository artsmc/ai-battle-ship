/**
 * Game Subscriptions
 * Subscription functions for game-related data
 *
 * This file re-exports all subscription functions from modular files for backwards compatibility.
 * New imports should use the specific subscription modules directly.
 */

// Re-export from modular subscription files
export { subscribeToUserProfile, subscribeToGameHistory } from './userSubscriptions'
export { subscribeToActiveGame } from './gameStateSubscriptions'
export {
  subscribeToGameMoves,
  subscribeToChatMessages,
  subscribeToShipPlacements
} from './gameDataSubscriptions'
export { subscribeToLeaderboard } from './leaderboardSubscriptions'
/**
 * Guest Mode Service
 * Handles guest user sessions and local gameplay
 */

import { v4 as uuidv4 } from 'uuid'
import { GuestSession, UserPreferences } from '../types'

/**
 * Guest session storage in localStorage
 */
const GUEST_SESSION_KEY = 'battleship_guest_session'
const GUEST_PREFERENCES_KEY = 'battleship_guest_preferences'
const GUEST_STATS_KEY = 'battleship_guest_stats'

/**
 * Guest user statistics
 */
interface GuestStats {
  gamesPlayed: number
  gamesWon: number
  totalShots: number
  totalHits: number
  accuracy: number
  bestWinStreak: number
  currentWinStreak: number
  favoriteShipType?: string
}

/**
 * Create a new guest session
 */
export function createGuestSession(): GuestSession {
  const guestId = uuidv4()
  const session: GuestSession = {
    isAuthenticated: false,
    guestId,
    createdAt: new Date(),
  }

  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session))
  }

  return session
}

/**
 * Get existing guest session
 */
export function getGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY)
    if (!stored) return null

    const session = JSON.parse(stored)
    // Validate session structure
    if (session.guestId && session.createdAt) {
      session.createdAt = new Date(session.createdAt)
      return session as GuestSession
    }

    return null
  } catch (error) {
    console.error('Error loading guest session:', error)
    return null
  }
}

/**
 * Get or create guest session
 */
export function getOrCreateGuestSession(): GuestSession {
  const existing = getGuestSession()
  if (existing) return existing

  return createGuestSession()
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_SESSION_KEY)
    localStorage.removeItem(GUEST_PREFERENCES_KEY)
    localStorage.removeItem(GUEST_STATS_KEY)
  }
}

/**
 * Get guest preferences
 */
export function getGuestPreferences(): Partial<UserPreferences> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(GUEST_PREFERENCES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error loading guest preferences:', error)
    return {}
  }
}

/**
 * Update guest preferences
 */
export function updateGuestPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return

  try {
    const current = getGuestPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving guest preferences:', error)
  }
}

/**
 * Get guest statistics
 */
export function getGuestStats(): GuestStats {
  if (typeof window === 'undefined') {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalShots: 0,
      totalHits: 0,
      accuracy: 0,
      bestWinStreak: 0,
      currentWinStreak: 0,
    }
  }

  try {
    const stored = localStorage.getItem(GUEST_STATS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading guest stats:', error)
  }

  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalShots: 0,
    totalHits: 0,
    accuracy: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
  }
}

/**
 * Update guest statistics after a game
 */
export function updateGuestStats(update: {
  won: boolean
  shots: number
  hits: number
  shipType?: string
}): GuestStats {
  const current = getGuestStats()

  const newStats: GuestStats = {
    gamesPlayed: current.gamesPlayed + 1,
    gamesWon: current.gamesWon + (update.won ? 1 : 0),
    totalShots: current.totalShots + update.shots,
    totalHits: current.totalHits + update.hits,
    accuracy: 0, // Will be calculated below
    bestWinStreak: current.bestWinStreak,
    currentWinStreak: update.won ? current.currentWinStreak + 1 : 0,
    favoriteShipType: update.shipType || current.favoriteShipType,
  }

  // Calculate accuracy
  newStats.accuracy = newStats.totalShots > 0 ? (newStats.totalHits / newStats.totalShots) * 100 : 0

  // Update best win streak
  if (newStats.currentWinStreak > newStats.bestWinStreak) {
    newStats.bestWinStreak = newStats.currentWinStreak
  }

  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(newStats))
    } catch (error) {
      console.error('Error saving guest stats:', error)
    }
  }

  return newStats
}

/**
 * Check if user has a guest session
 */
export function hasGuestSession(): boolean {
  return getGuestSession() !== null
}

/**
 * Migrate guest data to registered user account
 * This would be called after successful registration
 */
export async function migrateGuestData(userId: string): Promise<{
  preferences?: Partial<UserPreferences>
  stats?: GuestStats
}> {
  const preferences = getGuestPreferences()
  const stats = getGuestStats()

  // In a full implementation, this would save the data to the user's account
  // For now, we just return the data to be processed by the caller

  // Clear guest data after migration
  clearGuestSession()

  return {
    preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
    stats: stats.gamesPlayed > 0 ? stats : undefined,
  }
}

/**
 * Get guest display information
 */
export function getGuestDisplayInfo(): {
  displayName: string
  isGuest: boolean
  sessionInfo: string
} {
  const session = getGuestSession()
  const stats = getGuestStats()

  if (!session) {
    return {
      displayName: 'Guest',
      isGuest: true,
      sessionInfo: 'No active session',
    }
  }

  return {
    displayName: `Guest Player`,
    isGuest: true,
    sessionInfo: stats.gamesPlayed > 0
      ? `${stats.gamesPlayed} games played, ${stats.gamesWon} wins`
      : 'New session',
  }
}
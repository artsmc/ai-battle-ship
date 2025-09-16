/**
 * User Service
 * Database operations for user management and authentication
 */

import { v4 as uuidv4 } from 'uuid'
import { User, UserSession } from '../../database/types/user'
import { AuthUser, RegisterCredentials, UserPreferences } from '../types'
import { hashPassword, verifyPassword } from '../validation/password'
import { AUTH_ERRORS } from '../config'
import { createAuthError } from '../api-utils'

// This is a simplified in-memory user store for Phase 4 MVP
// In production, this would integrate with the Electric-SQL database
interface UserStore {
  users: Map<string, User>
  usersByEmail: Map<string, User>
  usersByUsername: Map<string, User>
  sessions: Map<string, UserSession>
}

const userStore: UserStore = {
  users: new Map(),
  usersByEmail: new Map(),
  usersByUsername: new Map(),
  sessions: new Map(),
}

/**
 * Create a new user account
 */
export async function createUser(credentials: RegisterCredentials): Promise<AuthUser> {
  const { username, email, password } = credentials

  // Check if email already exists
  if (userStore.usersByEmail.has(email.toLowerCase())) {
    throw createAuthError(AUTH_ERRORS.EMAIL_ALREADY_EXISTS, 'Email address is already registered', 409)
  }

  // Check if username already exists
  if (userStore.usersByUsername.has(username.toLowerCase())) {
    throw createAuthError(AUTH_ERRORS.USERNAME_ALREADY_EXISTS, 'Username is already taken', 409)
  }

  // Hash the password
  const passwordHash = await hashPassword(password)

  // Create user object
  const userId = uuidv4()
  const now = new Date()

  const user: User = {
    id: userId,
    username: username,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    display_name: null,
    avatar_url: null,
    bio: null,
    country_code: null,
    preferred_language: 'en',

    // Statistics
    rating: 1200, // Starting ELO rating
    peak_rating: 1200,
    games_played: 0,
    games_won: 0,
    games_drawn: 0,
    total_shots_fired: 0,
    total_hits: 0,
    ships_sunk: 0,
    perfect_games: 0,

    // Progression
    experience_points: 0,
    level: 1,
    achievements: [],
    unlocked_ships: ['destroyer', 'cruiser', 'battleship'], // Starting ships

    // Metadata
    created_at: now,
    updated_at: now,
    last_active: now,
    is_online: false,
    is_ai: false,
    is_premium: false,
    banned_until: null,
  }

  // Store user
  userStore.users.set(userId, user)
  userStore.usersByEmail.set(email.toLowerCase(), user)
  userStore.usersByUsername.set(username.toLowerCase(), user)

  // Return auth user (without sensitive data)
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_premium: user.is_premium,
    created_at: user.created_at,
    last_active: user.last_active,
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<AuthUser> {
  const user = userStore.usersByEmail.get(email.toLowerCase())

  if (!user) {
    throw createAuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 'Invalid email or password', 401)
  }

  // Check if account is banned
  if (user.banned_until && user.banned_until > new Date()) {
    throw createAuthError(AUTH_ERRORS.ACCOUNT_LOCKED, 'Account is temporarily suspended', 403)
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
    throw createAuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 'Invalid email or password', 401)
  }

  // Update last active time
  user.last_active = new Date()
  user.is_online = true

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_premium: user.is_premium,
    created_at: user.created_at,
    last_active: user.last_active,
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = userStore.users.get(userId)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_premium: user.is_premium,
    created_at: user.created_at,
    last_active: user.last_active,
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const user = userStore.usersByEmail.get(email.toLowerCase())

  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_premium: user.is_premium,
    created_at: user.created_at,
    last_active: user.last_active,
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'display_name' | 'bio' | 'country_code' | 'preferred_language'>>
): Promise<AuthUser> {
  const user = userStore.users.get(userId)

  if (!user) {
    throw createAuthError(AUTH_ERRORS.USER_NOT_FOUND, 'User not found', 404)
  }

  // Update user data
  Object.assign(user, updates, { updated_at: new Date() })

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_premium: user.is_premium,
    created_at: user.created_at,
    last_active: user.last_active,
  }
}

/**
 * Change user password
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = userStore.users.get(userId)

  if (!user) {
    throw createAuthError(AUTH_ERRORS.USER_NOT_FOUND, 'User not found', 404)
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password_hash)
  if (!isValidPassword) {
    throw createAuthError(AUTH_ERRORS.INVALID_CREDENTIALS, 'Current password is incorrect', 401)
  }

  // Hash and update new password
  user.password_hash = await hashPassword(newPassword)
  user.updated_at = new Date()
}

/**
 * Update user's last active time and online status
 */
export async function updateUserActivity(userId: string, isOnline: boolean = true): Promise<void> {
  const user = userStore.users.get(userId)

  if (user) {
    user.last_active = new Date()
    user.is_online = isOnline
    user.updated_at = new Date()
  }
}

/**
 * Create a user session
 */
export async function createUserSession(
  userId: string,
  sessionToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserSession> {
  const user = userStore.users.get(userId)

  if (!user) {
    throw createAuthError(AUTH_ERRORS.USER_NOT_FOUND, 'User not found', 404)
  }

  const sessionId = uuidv4()
  const now = new Date()

  const session: UserSession = {
    id: sessionId,
    user_id: userId,
    user,
    session_token: sessionToken,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    started_at: now,
    last_activity: now,
    ended_at: null,
    games_played: 0,
    chat_messages_sent: 0,
  }

  userStore.sessions.set(sessionId, session)
  return session
}

/**
 * Get user session by token
 */
export async function getUserSessionByToken(sessionToken: string): Promise<UserSession | null> {
  for (const session of userStore.sessions.values()) {
    if (session.session_token === sessionToken) {
      return session
    }
  }
  return null
}

/**
 * End user session
 */
export async function endUserSession(sessionToken: string): Promise<void> {
  for (const [sessionId, session] of userStore.sessions.entries()) {
    if (session.session_token === sessionToken) {
      session.ended_at = new Date()
      userStore.sessions.delete(sessionId)

      // Update user online status if no other active sessions
      const hasActiveSessions = Array.from(userStore.sessions.values()).some(
        s => s.user_id === session.user_id && !s.ended_at
      )

      if (!hasActiveSessions) {
        await updateUserActivity(session.user_id, false)
      }

      break
    }
  }
}

/**
 * Get user profile (detailed user info)
 */
export async function getUserProfile(userId: string): Promise<Partial<User> | null> {
  const user = userStore.users.get(userId)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    country_code: user.country_code,
    preferred_language: user.preferred_language,
    rating: user.rating,
    peak_rating: user.peak_rating,
    games_played: user.games_played,
    games_won: user.games_won,
    games_drawn: user.games_drawn,
    level: user.level,
    experience_points: user.experience_points,
    achievements: user.achievements,
    unlocked_ships: user.unlocked_ships,
    created_at: user.created_at,
    last_active: user.last_active,
    is_premium: user.is_premium,
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string): Promise<Partial<User> | null> {
  const user = userStore.users.get(userId)

  if (!user) {
    return null
  }

  return {
    rating: user.rating,
    peak_rating: user.peak_rating,
    games_played: user.games_played,
    games_won: user.games_won,
    games_drawn: user.games_drawn,
    total_shots_fired: user.total_shots_fired,
    total_hits: user.total_hits,
    ships_sunk: user.ships_sunk,
    perfect_games: user.perfect_games,
    experience_points: user.experience_points,
    level: user.level,
    achievements: user.achievements,
    unlocked_ships: user.unlocked_ships,
  }
}

// In-memory preferences store for MVP
const preferencesStore: Map<string, UserPreferences> = new Map()

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  let preferences = preferencesStore.get(userId)

  if (!preferences) {
    // Return default preferences
    preferences = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        browser: true,
        gameUpdates: true,
        achievements: true,
      },
      gameSettings: {
        soundEffects: true,
        backgroundMusic: true,
        animationSpeed: 'normal',
        autoConfirmMoves: false,
      },
      privacy: {
        showOnlineStatus: true,
        allowFriendRequests: true,
        showGameHistory: true,
      },
    }
    preferencesStore.set(userId, preferences)
  }

  return preferences
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const user = userStore.users.get(userId)

  if (!user) {
    throw createAuthError(AUTH_ERRORS.USER_NOT_FOUND, 'User not found', 404)
  }

  const currentPreferences = await getUserPreferences(userId)

  // Deep merge preferences
  const updatedPreferences: UserPreferences = {
    ...currentPreferences,
    ...updates,
    notifications: {
      ...currentPreferences.notifications,
      ...(updates.notifications || {}),
    },
    gameSettings: {
      ...currentPreferences.gameSettings,
      ...(updates.gameSettings || {}),
    },
    privacy: {
      ...currentPreferences.privacy,
      ...(updates.privacy || {}),
    },
  }

  preferencesStore.set(userId, updatedPreferences)
  return updatedPreferences
}

/**
 * Seed some test users for development
 */
export async function seedTestUsers(): Promise<void> {
  const testUsers = [
    {
      username: 'admin',
      email: 'admin@battleship.dev',
      password: 'Admin123!',
      confirmPassword: 'Admin123!',
      acceptTerms: true,
    },
    {
      username: 'player1',
      email: 'player1@battleship.dev',
      password: 'Player123!',
      confirmPassword: 'Player123!',
      acceptTerms: true,
    },
  ]

  for (const userData of testUsers) {
    try {
      if (!userStore.usersByEmail.has(userData.email)) {
        await createUser(userData)
        console.log(`Seeded test user: ${userData.username}`)
      }
    } catch (error) {
      // User already exists, skip
    }
  }
}

// Seed test users in development
if (process.env.NODE_ENV === 'development') {
  seedTestUsers().catch(console.error)
}
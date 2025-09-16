/**
 * Authentication Module Index
 * Central exports for the authentication system
 */

// Types
export type {
  AuthUser,
  JWTPayload,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  AuthSession,
  GuestSession,
  UserSession,
  AuthResponse,
  TokenValidationResult,
  PasswordResetRequest,
  UserPreferences,
  AuthError,
  AuthConfig,
} from './types'

// Configuration
export { AUTH_CONFIG, AUTH_ERRORS, TOKEN_TYPES, PASSWORD_REQUIREMENTS } from './config'

// JWT Token utilities
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpirationDate,
  refreshAccessToken,
} from './tokens/jwt'

// Validation schemas
export {
  passwordSchema,
  usernameSchema,
  emailSchema,
  displayNameSchema,
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  profileUpdateSchema,
  userPreferencesSchema,
  changePasswordSchema,
  tokenSchema,
  guestSessionSchema,
} from './validation/schemas'

// Password utilities
export {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  generateSecurePassword,
  generateResetToken,
  validatePasswordRequirements,
} from './validation/password'

// User service
export {
  createUser,
  authenticateUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  changeUserPassword,
  updateUserActivity,
  createUserSession,
  getUserSessionByToken,
  endUserSession,
  getUserStatistics,
} from './services/user'

// API utilities
export {
  createAuthError,
  createSuccessResponse,
  createErrorResponse,
  validateRequestBody,
  setAuthCookies,
  clearAuthCookies,
  getTokensFromCookies,
  getTokenFromHeader,
  extractUserFromToken,
  requireAuth,
  checkRateLimit,
  getClientIP,
  handleApiError,
} from './api-utils'
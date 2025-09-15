/**
 * Design Tokens for Battleship Naval Strategy Game
 *
 * This file provides backwards compatibility for existing imports.
 * All design tokens have been refactored into smaller, more manageable modules
 * under src/styles/tokens/ directory.
 *
 * @deprecated Consider importing directly from 'src/styles/tokens' for better tree-shaking
 */

// Re-export everything from the tokens index for backwards compatibility
export * from './tokens';
export { designTokens as default } from './tokens';
/**
 * Design Tokens Index
 *
 * Re-exports all design tokens and utilities for backwards compatibility
 * and convenient access. This file maintains the same API as the original
 * design-tokens.ts file.
 */

// Import all token modules
import { colors } from './colors';
import { typography } from './typography';
import { spacing, breakpoints, zIndex } from './layout';
import { boxShadow, borderRadius, animation } from './effects';
import { game } from './game';

// Import utilities and types
export * from './utils';
export * from './types';

// Reconstruct the original designTokens object
export const designTokens = {
  colors,
  typography,
  spacing,
  breakpoints,
  boxShadow,
  borderRadius,
  zIndex,
  animation,
  game,
} as const;

// CSS-in-JS theme object (for styled-components or emotion if needed)
export const theme = {
  colors: designTokens.colors,
  typography: designTokens.typography,
  spacing: designTokens.spacing,
  breakpoints: designTokens.breakpoints,
  boxShadow: designTokens.boxShadow,
  borderRadius: designTokens.borderRadius,
  zIndex: designTokens.zIndex,
  animation: designTokens.animation,
  game: designTokens.game,
};

// Default export for backwards compatibility
export default designTokens;

// Re-export individual modules for direct access
export {
  colors,
  typography,
  spacing,
  breakpoints,
  zIndex,
  boxShadow,
  borderRadius,
  animation,
  game,
};
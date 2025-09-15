/**
 * Type Definitions for Design Tokens
 *
 * Contains all TypeScript type definitions for design tokens,
 * providing type safety and IntelliSense support.
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing, breakpoints, zIndex } from './layout';
import { boxShadow, borderRadius } from './effects';

// Color-related types
export type ColorScale = typeof colors.navy;
export type MaritimeColor = keyof typeof colors.maritime;
export type GameColor = keyof typeof colors.game;
export type StatusColor = keyof typeof colors.status;
export type SemanticColor = keyof typeof colors.semantic;

// Typography types
export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type LetterSpacing = keyof typeof typography.letterSpacing;

// Layout types
export type Spacing = keyof typeof spacing;
export type Breakpoint = keyof typeof breakpoints;
export type ZIndex = keyof typeof zIndex;

// Effects types
export type BoxShadow = keyof typeof boxShadow;
export type BorderRadius = keyof typeof borderRadius;

// Combined design tokens type
export interface DesignTokens {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  breakpoints: typeof breakpoints;
  boxShadow: typeof boxShadow;
  borderRadius: typeof borderRadius;
  zIndex: typeof zIndex;
}
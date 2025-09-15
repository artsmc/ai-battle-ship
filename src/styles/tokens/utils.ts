/**
 * Utility Functions for Design Tokens
 *
 * Helper functions for accessing design tokens programmatically,
 * providing type-safe access to token values.
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing, breakpoints } from './layout';
import { boxShadow, borderRadius } from './effects';
import type {
  FontSize,
  Spacing,
  Breakpoint,
  BoxShadow,
  BorderRadius,
} from './types';

/**
 * Get a color value by path (e.g., 'navy.500', 'maritime.wave.light')
 */
export const getColor = (color: string, shade?: number): string => {
  const colorPath = color.split('.');
  let colorValue: Record<string, unknown> = colors;

  for (const path of colorPath) {
    if (colorValue && typeof colorValue === 'object' && path in colorValue) {
      colorValue = colorValue[path] as Record<string, unknown>;
    } else {
      return color;
    }
  }

  if (shade && colorValue && typeof colorValue === 'object' && shade.toString() in colorValue) {
    return (colorValue[shade.toString()] as string) || color;
  }

  return (typeof colorValue === 'string' ? colorValue : color);
};

/**
 * Get a spacing value by key
 */
export const getSpacing = (size: Spacing): string => {
  return spacing[size] || size;
};

/**
 * Get a font size value with line height by key
 */
export const getFontSize = (size: FontSize): readonly [string, { readonly lineHeight: string }] => {
  return typography.fontSize[size] || typography.fontSize.base;
};

/**
 * Get a breakpoint value by key
 */
export const getBreakpoint = (breakpoint: Breakpoint): string => {
  return breakpoints[breakpoint] || breakpoint;
};

/**
 * Get a box shadow value by key
 */
export const getShadow = (shadow: BoxShadow): string => {
  return boxShadow[shadow] || boxShadow.default;
};

/**
 * Get a border radius value by key
 */
export const getBorderRadius = (radius: BorderRadius): string => {
  return borderRadius[radius] || borderRadius.default;
};
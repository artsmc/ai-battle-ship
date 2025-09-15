/**
 * Color Design Tokens
 *
 * Contains all color-related design tokens including:
 * - Primary theme colors (navy, ocean, steel)
 * - Maritime-themed colors
 * - Game state colors
 * - Status indicators
 * - Semantic colors
 */

export const colors = {
  // Primary Navy Theme
  navy: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#083344',
  },

  // Ocean Theme
  ocean: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#0c3a4a',
  },

  // Steel/Gray Theme
  steel: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Maritime Colors (Light/Dark variants)
  maritime: {
    wave: {
      light: '#e0f2fe',
      dark: '#164e63',
    },
    depth: {
      light: '#0ea5e9',
      dark: '#0891b2',
    },
    ship: {
      light: '#475569',
      dark: '#cbd5e1',
    },
    deck: {
      light: '#94a3b8',
      dark: '#64748b',
    },
    anchor: {
      light: '#334155',
      dark: '#f1f5f9',
    },
  },

  // Game State Colors
  game: {
    water: '#0ea5e9',
    ship: '#1f2937',
    hit: '#dc2626',
    miss: '#6b7280',
    sunk: '#991b1b',
    targeting: '#f59e0b',
    selected: '#10b981',
    hover: '#3b82f6',
  },

  // Status Indicators
  status: {
    online: '#10b981',
    offline: '#6b7280',
    waiting: '#f59e0b',
    playing: '#3b82f6',
    spectating: '#8b5cf6',
  },

  // Semantic Colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;
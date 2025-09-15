/**
 * Game-Specific Design Tokens
 *
 * Contains all game-related design tokens including:
 * - Board dimensions and layout
 * - Ship specifications (colors and sizes)
 * - UI layout constants
 */

export const game = {
  board: {
    size: {
      mobile: '280px',
      tablet: '400px',
      desktop: '500px',
    },
    cellSize: {
      mobile: '24px',
      tablet: '36px',
      desktop: '45px',
    },
    gap: '2px',
  },

  ship: {
    colors: {
      destroyer: '#6b7280',
      submarine: '#374151',
      cruiser: '#1f2937',
      battleship: '#111827',
      carrier: '#030712',
    },
    sizes: {
      destroyer: 2,
      submarine: 3,
      cruiser: 3,
      battleship: 4,
      carrier: 5,
    },
  },

  ui: {
    sidebarWidth: {
      mobile: '100%',
      desktop: '400px',
    },
    headerHeight: '4rem',
    footerHeight: '3rem',
  },
} as const;
'use client'

/**
 * GridCoordinates Component
 *
 * Displays A-J, 1-10 coordinate labels for the game board.
 * Provides clear visual reference for targeting and ship placement
 * with responsive sizing and theme-aware styling.
 */

import React, { useMemo } from 'react'
import { colors } from '../../../styles/tokens/colors'
import { game } from '../../../styles/tokens/game'

// =============================================
// TYPES
// =============================================

export interface GridCoordinatesProps {
  /** Board dimensions */
  width: number
  height: number
  /** Coordinate positioning */
  position?: 'outside' | 'inside' | 'overlay'
  /** Visual theme */
  theme?: 'maritime' | 'combat' | 'neutral'
  /** Cell size for proper alignment */
  cellSize?: number
  /** Show letters (columns) */
  showLetters?: boolean
  /** Show numbers (rows) */
  showNumbers?: boolean
  /** Custom offset for positioning */
  offset?: {
    x: number
    y: number
  }
  /** Additional CSS classes */
  className?: string
}

type CoordinateTheme = {
  textColor: string
  backgroundColor: string
  borderColor: string
  fontSize: string
  fontWeight: string
  opacity: number
}

// =============================================
// THEME CONFIGURATIONS
// =============================================

const themes: Record<string, CoordinateTheme> = {
  maritime: {
    textColor: colors.maritime.foam.light,
    backgroundColor: colors.maritime.wave.dark,
    borderColor: colors.maritime.foam.dark,
    fontSize: '0.75rem',
    fontWeight: '600',
    opacity: 0.9,
  },
  combat: {
    textColor: colors.accent.light,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: colors.accent.DEFAULT,
    fontSize: '0.75rem',
    fontWeight: '700',
    opacity: 1.0,
  },
  neutral: {
    textColor: colors.text.secondary,
    backgroundColor: colors.surface.tertiary,
    borderColor: colors.border.primary,
    fontSize: '0.75rem',
    fontWeight: '500',
    opacity: 0.8,
  },
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const generateLetters = (count: number): string[] => {
  const letters = []
  for (let i = 0; i < count && i < 26; i++) {
    letters.push(String.fromCharCode(65 + i)) // A-Z
  }
  return letters
}

const generateNumbers = (count: number): string[] => {
  const numbers = []
  for (let i = 1; i <= count; i++) {
    numbers.push(i.toString())
  }
  return numbers
}

// =============================================
// MAIN COMPONENT
// =============================================

export const GridCoordinates: React.FC<GridCoordinatesProps> = ({
  width,
  height,
  position = 'outside',
  theme = 'maritime',
  cellSize = 40,
  showLetters = true,
  showNumbers = true,
  offset = { x: 0, y: 0 },
  className = '',
}) => {
  // =============================================
  // DERIVED STATE
  // =============================================

  const themeConfig = themes[theme] || themes.neutral
  const letters = useMemo(() => generateLetters(width), [width])
  const numbers = useMemo(() => generateNumbers(height), [height])

  // =============================================
  // POSITIONING CONFIGURATION
  // =============================================

  const positionConfig = useMemo(() => {
    const padding = position === 'inside' ? 8 : position === 'overlay' ? 0 : -24
    const zIndex = position === 'overlay' ? 20 : 10

    return {
      padding,
      zIndex,
      isOverlay: position === 'overlay',
    }
  }, [position])

  // =============================================
  // STYLES
  // =============================================

  const coordinateStyle: React.CSSProperties = {
    color: themeConfig.textColor,
    backgroundColor: position === 'overlay' ? 'transparent' : themeConfig.backgroundColor,
    fontSize: themeConfig.fontSize,
    fontWeight: themeConfig.fontWeight,
    opacity: themeConfig.opacity,
    border: position !== 'overlay' ? `1px solid ${themeConfig.borderColor}` : 'none',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    pointerEvents: 'none',
    fontFamily: 'monospace',
  }

  const letterStyle: React.CSSProperties = {
    ...coordinateStyle,
    width: `${cellSize}px`,
    height: '20px',
  }

  const numberStyle: React.CSSProperties = {
    ...coordinateStyle,
    width: '20px',
    height: `${cellSize}px`,
    writingMode: 'vertical-rl' as const,
    textOrientation: 'mixed' as const,
  }

  // =============================================
  // RENDER HELPERS
  // =============================================

  const renderLetters = () => {
    if (!showLetters) return null

    const top = positionConfig.isOverlay
      ? `${offset.y}px`
      : `${offset.y + positionConfig.padding}px`

    return (
      <div
        className="coordinate-letters absolute flex"
        style={{
          top,
          left: `${offset.x + (position === 'outside' ? 24 : 0)}px`,
          zIndex: positionConfig.zIndex,
          gap: '2px',
        }}
      >
        {letters.map((letter, index) => (
          <div
            key={`letter-${letter}`}
            className="coordinate-label letter"
            style={{
              ...letterStyle,
              left: `${index * (cellSize + 2)}px`,
            }}
            aria-label={`Column ${letter}`}
          >
            {letter}
          </div>
        ))}
      </div>
    )
  }

  const renderNumbers = () => {
    if (!showNumbers) return null

    const left = positionConfig.isOverlay
      ? `${offset.x}px`
      : `${offset.x + positionConfig.padding}px`

    return (
      <div
        className="coordinate-numbers absolute flex flex-col"
        style={{
          top: `${offset.y + (position === 'outside' ? 24 : 0)}px`,
          left,
          zIndex: positionConfig.zIndex,
          gap: '2px',
        }}
      >
        {numbers.map((number, index) => (
          <div
            key={`number-${number}`}
            className="coordinate-label number"
            style={{
              ...numberStyle,
              top: `${index * (cellSize + 2)}px`,
            }}
            aria-label={`Row ${number}`}
          >
            {number}
          </div>
        ))}
      </div>
    )
  }

  // =============================================
  // ACCESSIBILITY HELPERS
  // =============================================

  const coordinateDescription = useMemo(() => {
    const letterRange = letters.length > 0 ? `${letters[0]}-${letters[letters.length - 1]}` : ''
    const numberRange = numbers.length > 0 ? `${numbers[0]}-${numbers[numbers.length - 1]}` : ''

    return `Grid coordinates: columns ${letterRange}, rows ${numberRange}`
  }, [letters, numbers])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div
      className={`grid-coordinates ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      role="img"
      aria-label={coordinateDescription}
    >
      {renderLetters()}
      {renderNumbers()}

      {/* Screen reader only description */}
      <div className="sr-only">
        Game board coordinates from {letters[0] || 'A'} to {letters[letters.length - 1] || 'J'}
        and {numbers[0] || '1'} to {numbers[numbers.length - 1] || '10'}
      </div>
    </div>
  )
}

export default GridCoordinates
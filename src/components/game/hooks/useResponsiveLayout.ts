'use client'

/**
 * useResponsiveLayout Hook
 *
 * Custom hook for managing responsive layout state and breakpoint detection
 * for the game board interface. Provides consistent layout behavior across
 * all game board components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { layout } from '../../../styles/tokens/layout'

// =============================================
// TYPES
// =============================================

export type LayoutBreakpoint = 'mobile' | 'tablet' | 'desktop'
export type BoardLayoutMode = 'single' | 'side-by-side' | 'stacked'

export interface ResponsiveLayoutState {
  breakpoint: LayoutBreakpoint
  width: number
  height: number
  boardLayoutMode: BoardLayoutMode
  showSidebar: boolean
  sidebarWidth: number
  boardDimensions: {
    width: number
    height: number
    cellSize: number
  }
}

export interface ResponsiveLayoutActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  getBoardContainerStyles: () => React.CSSProperties
  getSidebarStyles: () => React.CSSProperties
  getBoardStyles: () => React.CSSProperties
}

export interface UseResponsiveLayoutOptions {
  /** Initial sidebar state */
  initialSidebarOpen?: boolean
  /** Minimum board size */
  minBoardSize?: number
  /** Maximum board size */
  maxBoardSize?: number
  /** Force specific layout mode */
  forceLayoutMode?: BoardLayoutMode
  /** Responsive breakpoint overrides */
  breakpointOverrides?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

// =============================================
// DEFAULT OPTIONS
// =============================================

const DEFAULT_OPTIONS: UseResponsiveLayoutOptions = {
  initialSidebarOpen: true,
  minBoardSize: 300,
  maxBoardSize: 600,
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const getBreakpoint = (
  width: number,
  overrides?: UseResponsiveLayoutOptions['breakpointOverrides']
): LayoutBreakpoint => {
  const mobileMax = overrides?.mobile ?? parseInt(layout.breakpoints['mobile-game'])
  const tabletMax = overrides?.tablet ?? parseInt(layout.breakpoints['tablet-game-max'])

  if (width <= mobileMax) return 'mobile'
  if (width <= tabletMax) return 'tablet'
  return 'desktop'
}

const getBoardLayoutMode = (
  breakpoint: LayoutBreakpoint,
  forceMode?: BoardLayoutMode
): BoardLayoutMode => {
  if (forceMode) return forceMode

  switch (breakpoint) {
    case 'mobile':
      return 'single'
    case 'tablet':
      return 'stacked'
    case 'desktop':
      return 'side-by-side'
    default:
      return 'side-by-side'
  }
}

const calculateBoardDimensions = (
  containerWidth: number,
  containerHeight: number,
  breakpoint: LayoutBreakpoint,
  layoutMode: BoardLayoutMode,
  showSidebar: boolean,
  minSize: number,
  maxSize: number
) => {
  const sidebarWidth = showSidebar ? (breakpoint === 'mobile' ? 0 : 320) : 0
  const availableWidth = containerWidth - sidebarWidth
  const availableHeight = containerHeight

  // Calculate board dimensions based on layout mode
  let boardWidth: number
  let boardHeight: number

  switch (layoutMode) {
    case 'single':
      boardWidth = Math.min(availableWidth - 32, maxSize) // 32px padding
      boardHeight = Math.min(availableHeight - 64, maxSize) // 64px for header/footer
      break

    case 'stacked':
      boardWidth = Math.min(availableWidth - 32, maxSize)
      boardHeight = Math.min((availableHeight - 64) / 2 - 16, maxSize / 2) // Half height minus spacing
      break

    case 'side-by-side':
      boardWidth = Math.min((availableWidth - 48) / 2, maxSize / 2) // Half width minus spacing
      boardHeight = Math.min(availableHeight - 64, maxSize)
      break

    default:
      boardWidth = availableWidth
      boardHeight = availableHeight
  }

  // Ensure minimum size
  boardWidth = Math.max(boardWidth, minSize)
  boardHeight = Math.max(boardHeight, minSize)

  // Calculate optimal cell size
  const cellSize = Math.floor(Math.min(boardWidth / 12, boardHeight / 12)) // 10x10 grid + labels

  return {
    width: boardWidth,
    height: boardHeight,
    cellSize: Math.max(cellSize, 20), // Minimum 20px cells
  }
}

// =============================================
// MAIN HOOK
// =============================================

export const useResponsiveLayout = (
  options: UseResponsiveLayoutOptions = {}
): ResponsiveLayoutState & ResponsiveLayoutActions => {
  const {
    initialSidebarOpen = DEFAULT_OPTIONS.initialSidebarOpen,
    minBoardSize = DEFAULT_OPTIONS.minBoardSize!,
    maxBoardSize = DEFAULT_OPTIONS.maxBoardSize!,
    forceLayoutMode,
    breakpointOverrides,
  } = { ...DEFAULT_OPTIONS, ...options }

  // =============================================
  // STATE
  // =============================================

  const [dimensions, setDimensions] = useState({ width: 1024, height: 768 })
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen)

  // =============================================
  // WINDOW RESIZE HANDLER
  // =============================================

  const updateDimensions = useCallback(() => {
    if (typeof window !== 'undefined') {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [updateDimensions])

  // =============================================
  // DERIVED STATE
  // =============================================

  const breakpoint = useMemo(
    () => getBreakpoint(dimensions.width, breakpointOverrides),
    [dimensions.width, breakpointOverrides]
  )

  const boardLayoutMode = useMemo(
    () => getBoardLayoutMode(breakpoint, forceLayoutMode),
    [breakpoint, forceLayoutMode]
  )

  const sidebarWidth = useMemo(() => {
    if (!sidebarOpen) return 0
    return breakpoint === 'mobile' ? dimensions.width : 320
  }, [sidebarOpen, breakpoint, dimensions.width])

  const boardDimensions = useMemo(() =>
    calculateBoardDimensions(
      dimensions.width,
      dimensions.height,
      breakpoint,
      boardLayoutMode,
      sidebarOpen,
      minBoardSize,
      maxBoardSize
    ),
    [
      dimensions.width,
      dimensions.height,
      breakpoint,
      boardLayoutMode,
      sidebarOpen,
      minBoardSize,
      maxBoardSize,
    ]
  )

  // =============================================
  // ACTIONS
  // =============================================

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const setSidebarOpenAction = useCallback((open: boolean) => {
    setSidebarOpen(open)
  }, [])

  const getBoardContainerStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      transition: 'all 0.3s ease',
    }

    switch (boardLayoutMode) {
      case 'single':
        return {
          ...baseStyles,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }

      case 'stacked':
        return {
          ...baseStyles,
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
        }

      case 'side-by-side':
        return {
          ...baseStyles,
          flexDirection: 'row',
          gap: '24px',
          padding: '16px',
        }

      default:
        return baseStyles
    }
  }, [boardLayoutMode])

  const getSidebarStyles = useCallback((): React.CSSProperties => {
    return {
      width: sidebarOpen ? `${sidebarWidth}px` : '0px',
      height: '100%',
      overflow: 'hidden',
      transition: 'width 0.3s ease',
      borderLeft: sidebarOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    }
  }, [sidebarOpen, sidebarWidth])

  const getBoardStyles = useCallback((): React.CSSProperties => {
    return {
      width: `${boardDimensions.width}px`,
      height: `${boardDimensions.height}px`,
      flexShrink: 0,
      transition: 'all 0.3s ease',
    }
  }, [boardDimensions.width, boardDimensions.height])

  // =============================================
  // AUTO-HIDE SIDEBAR ON MOBILE
  // =============================================

  useEffect(() => {
    if (breakpoint === 'mobile' && sidebarOpen) {
      // Auto-hide sidebar on mobile when not needed
      const timer = setTimeout(() => setSidebarOpen(false), 100)
      return () => clearTimeout(timer)
    }
  }, [breakpoint, sidebarOpen])

  // =============================================
  // RETURN STATE AND ACTIONS
  // =============================================

  return {
    // State
    breakpoint,
    width: dimensions.width,
    height: dimensions.height,
    boardLayoutMode,
    showSidebar: sidebarOpen,
    sidebarWidth,
    boardDimensions,

    // Actions
    toggleSidebar,
    setSidebarOpen: setSidebarOpenAction,
    getBoardContainerStyles,
    getSidebarStyles,
    getBoardStyles,
  }
}

export default useResponsiveLayout
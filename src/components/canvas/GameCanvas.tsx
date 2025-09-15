'use client'

/**
 * GameCanvas Component
 *
 * Main Konva.js Stage and Layer setup for the Battleship Naval Strategy Game.
 * Provides the foundational canvas system with performance optimization,
 * responsive sizing, and integration with the existing game state.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import { colors } from '../../styles/tokens/colors'
import { DEFAULTS } from '../../lib/game/utils/constants'
import {
  ResponsiveCanvas,
  CanvasMetrics,
  getPerformanceRenderingOptions,
} from '../../lib/canvas/ResponsiveCanvas'
import {
  CanvasCoordinateTransform,
  createResponsiveCoordinateTransform,
} from '../../lib/canvas/CoordinateTransform'
import {
  CanvasEventHandler,
  CanvasEventHandlers,
  CanvasEventData,
} from '../../lib/canvas/EventHandler'
import { Coordinate, BoardState } from '../../lib/game/types'

// =============================================
// TYPES
// =============================================

export interface GameCanvasProps {
  /** Canvas container className */
  className?: string
  /** Board state from game engine */
  boardState?: BoardState
  /** Board dimensions */
  boardWidth?: number
  boardHeight?: number
  /** Canvas event handlers */
  onCellClick?: (coordinate: Coordinate) => void
  onCellHover?: (coordinate: Coordinate | null) => void
  onCellDoubleClick?: (coordinate: Coordinate) => void
  onCanvasReady?: (canvas: GameCanvasRef) => void
  /** Performance and display options */
  enableAnimations?: boolean
  enableEffects?: boolean
  showGrid?: boolean
  showCoordinates?: boolean
  /** Custom rendering layer components */
  children?: React.ReactNode
}

export interface GameCanvasRef {
  stage: Konva.Stage | null
  coordinateTransform: CanvasCoordinateTransform | null
  eventHandler: CanvasEventHandler | null
  getMetrics: () => CanvasMetrics | null
  centerBoard: () => void
  fitToCanvas: () => void
  setScale: (scale: number, centerX?: number, centerY?: number) => void
  forceUpdate: () => void
}

interface CanvasState {
  isReady: boolean
  metrics: CanvasMetrics | null
  coordinateTransform: CanvasCoordinateTransform | null
  eventHandler: CanvasEventHandler | null
  performanceOptions: ReturnType<typeof getPerformanceRenderingOptions>
}

// =============================================
// MAIN COMPONENT
// =============================================

export const GameCanvas = React.forwardRef<GameCanvasRef, GameCanvasProps>(({
  className = '',
  boardState: _boardState,
  boardWidth = DEFAULTS.BOARD_WIDTH,
  boardHeight = DEFAULTS.BOARD_HEIGHT,
  onCellClick,
  onCellHover,
  onCellDoubleClick,
  onCanvasReady,
  enableAnimations = true,
  enableEffects = true,
  showGrid: _showGrid = true,
  showCoordinates: _showCoordinates = true,
  children,
}, ref) => {
  // =============================================
  // REFS AND STATE
  // =============================================

  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const responsiveCanvasRef = useRef<ResponsiveCanvas | null>(null)
  const stateRef = useRef<CanvasState>({
    isReady: false,
    metrics: null,
    coordinateTransform: null,
    eventHandler: null,
    performanceOptions: getPerformanceRenderingOptions(),
  })

  const [, forceRender] = React.useReducer(x => x + 1, 0)

  // =============================================
  // PERFORMANCE OPTIONS
  // =============================================

  const performanceOptions = useMemo(() => {
    const options = getPerformanceRenderingOptions()
    return {
      ...options,
      enableAnimations: enableAnimations && options.enableAnimations,
      enableShadows: enableEffects && options.enableShadows,
    }
  }, [enableAnimations, enableEffects])

  // =============================================
  // CANVAS EVENT HANDLERS
  // =============================================

  const canvasEventHandlers: CanvasEventHandlers = useMemo(() => ({
    onClick: (event: CanvasEventData) => {
      if (event.gridCoordinate && onCellClick) {
        onCellClick(event.gridCoordinate)
      }
    },

    onDoubleClick: (event: CanvasEventData) => {
      if (event.gridCoordinate && onCellDoubleClick) {
        onCellDoubleClick(event.gridCoordinate)
      }
    },

    onHover: (event: CanvasEventData) => {
      if (onCellHover) {
        onCellHover(event.gridCoordinate)
      }
    },

    onWheel: (event: CanvasEventData) => {
      if (!stateRef.current.coordinateTransform) return

      const wheelEvent = event.originalEvent as WheelEvent
      const zoomFactor = wheelEvent.deltaY > 0 ? 0.9 : 1.1
      const currentScale = stateRef.current.coordinateTransform.getScale()
      const newScale = currentScale * zoomFactor

      stateRef.current.coordinateTransform.setScale(
        newScale,
        event.screenCoordinate.x,
        event.screenCoordinate.y
      )

      updateStageTransform()
    },
  }), [onCellClick, onCellDoubleClick, onCellHover, updateStageTransform])

  // =============================================
  // STAGE TRANSFORM UPDATE
  // =============================================

  const updateStageTransform = useCallback(() => {
    if (!stageRef.current || !stateRef.current.coordinateTransform) return

    const viewport = stateRef.current.coordinateTransform.getViewport()

    stageRef.current.scale({
      x: viewport.scale,
      y: viewport.scale,
    })

    stageRef.current.position({
      x: viewport.offsetX,
      y: viewport.offsetY,
    })
  }, [])

  // =============================================
  // CANVAS SETUP AND MANAGEMENT
  // =============================================

  const setupCanvas = useCallback((metrics: CanvasMetrics) => {
    if (!containerRef.current || !stageRef.current) return

    // Create coordinate transform
    const canvas = stageRef.current.content?.querySelector('canvas')
    if (!canvas) return

    const coordinateTransform = createResponsiveCoordinateTransform(
      canvas,
      boardWidth,
      boardHeight
    )

    // Create event handler
    const eventHandler = new CanvasEventHandler(
      canvas,
      coordinateTransform,
      canvasEventHandlers,
      {
        enablePanning: true,
        enableZooming: true,
        enableDragDrop: true,
      }
    )

    // Update state
    stateRef.current = {
      ...stateRef.current,
      isReady: true,
      metrics,
      coordinateTransform,
      eventHandler,
      performanceOptions,
    }

    // Apply initial transform
    updateStageTransform()

    // Notify parent component
    if (onCanvasReady && ref) {
      const canvasRef: GameCanvasRef = {
        stage: stageRef.current,
        coordinateTransform,
        eventHandler,
        getMetrics: () => metrics,
        centerBoard: () => {
          coordinateTransform.centerGrid()
          updateStageTransform()
        },
        fitToCanvas: () => {
          coordinateTransform.fitToCanvas()
          updateStageTransform()
        },
        setScale: (scale: number, centerX?: number, centerY?: number) => {
          coordinateTransform.setScale(scale, centerX, centerY)
          updateStageTransform()
        },
        forceUpdate: () => forceRender(),
      }

      if (typeof ref === 'function') {
        ref(canvasRef)
      } else if (ref) {
        ref.current = canvasRef
      }

      onCanvasReady(canvasRef)
    }
  }, [boardWidth, boardHeight, canvasEventHandlers, performanceOptions, onCanvasReady, ref, updateStageTransform])

  const handleCanvasResize = useCallback((metrics: CanvasMetrics) => {
    if (!stateRef.current.isReady) {
      setupCanvas(metrics)
    } else {
      // Update existing transforms
      if (stateRef.current.coordinateTransform) {
        stateRef.current.coordinateTransform.updateCanvasSize(
          metrics.canvasSize.width,
          metrics.canvasSize.height
        )
      }

      stateRef.current.metrics = metrics
      updateStageTransform()
    }

    forceRender()
  }, [setupCanvas, updateStageTransform])

  // =============================================
  // EFFECTS
  // =============================================

  // Initialize responsive canvas
  useEffect(() => {
    if (!containerRef.current) return

    // Create a temporary canvas to get the responsive system working
    const tempCanvas = document.createElement('canvas')
    tempCanvas.style.display = 'none'
    containerRef.current.appendChild(tempCanvas)

    responsiveCanvasRef.current = new ResponsiveCanvas(
      containerRef.current,
      tempCanvas,
      {
        aspectRatio: 1,
        maintainAspectRatio: true,
      }
    )

    responsiveCanvasRef.current.onResize(handleCanvasResize)

    return () => {
      if (responsiveCanvasRef.current) {
        responsiveCanvasRef.current.destroy()
        responsiveCanvasRef.current = null
      }
    }
  }, [handleCanvasResize])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stateRef.current.eventHandler) {
        stateRef.current.eventHandler.destroy()
      }
    }
  }, [])

  // Update board size when props change
  useEffect(() => {
    if (stateRef.current.coordinateTransform) {
      stateRef.current.coordinateTransform.updateBoardSize(boardWidth, boardHeight)
      updateStageTransform()
    }
  }, [boardWidth, boardHeight, updateStageTransform])

  // =============================================
  // KONVA CONFIGURATION
  // =============================================

  const stageConfig = useMemo(() => {
    const metrics = stateRef.current.metrics

    if (!metrics) {
      return {
        width: 400,
        height: 400,
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
      }
    }

    return {
      width: metrics.canvasSize.displayWidth,
      height: metrics.canvasSize.displayHeight,
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
    }
  }, [])

  const layerConfig = useMemo(() => ({
    // Performance optimizations based on device capability
    listening: true,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: performanceOptions.enableShadows,
    hitGraphEnabled: true,
    clearBeforeDraw: true,
  }), [performanceOptions])

  // =============================================
  // RENDER
  // =============================================

  return (
    <div
      ref={containerRef}
      className={`game-canvas-container relative w-full h-full ${className}`}
      style={{
        backgroundColor: colors.maritime.wave.light,
        minHeight: '400px',
      }}
    >
      <Stage
        ref={stageRef}
        {...stageConfig}
        onWheel={(e) => {
          // Prevent browser zoom
          e.evt.preventDefault()
        }}
      >
        <Layer {...layerConfig}>
          {/* Render children (grid, ships, etc.) */}
          {stateRef.current.isReady && children}
        </Layer>
      </Stage>

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-50 text-white p-1 rounded">
          {stateRef.current.metrics?.breakpoint.name} | {performanceOptions.renderQuality}
        </div>
      )}
    </div>
  )
})

GameCanvas.displayName = 'GameCanvas'

// =============================================
// HOOKS FOR CANVAS INTEGRATION
// =============================================

/**
 * Hook to access canvas context from child components
 */
export const useGameCanvas = () => {
  const canvasContext = React.useContext(GameCanvasContext)
  if (!canvasContext) {
    throw new Error('useGameCanvas must be used within a GameCanvas component')
  }
  return canvasContext
}

/**
 * Context for sharing canvas state with child components
 */
export const GameCanvasContext = React.createContext<{
  coordinateTransform: CanvasCoordinateTransform | null
  metrics: CanvasMetrics | null
  performanceOptions: ReturnType<typeof getPerformanceRenderingOptions>
} | null>(null)

/**
 * Provider wrapper for GameCanvas context
 */
export const GameCanvasProvider: React.FC<{
  children: React.ReactNode
  coordinateTransform: CanvasCoordinateTransform | null
  metrics: CanvasMetrics | null
  performanceOptions: ReturnType<typeof getPerformanceRenderingOptions>
}> = ({ children, coordinateTransform, metrics, performanceOptions }) => {
  const contextValue = useMemo(() => ({
    coordinateTransform,
    metrics,
    performanceOptions,
  }), [coordinateTransform, metrics, performanceOptions])

  return (
    <GameCanvasContext.Provider value={contextValue}>
      {children}
    </GameCanvasContext.Provider>
  )
}

export default GameCanvas
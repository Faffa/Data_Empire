/**
 * useGameTick Hook
 * React hook that manages the game loop and tick timing
 *
 * Responsibilities:
 * - Run game tick every second using setInterval
 * - Monitor tick performance (<100ms requirement)
 * - Handle pause/resume
 * - Clean up interval on unmount
 * - Log performance warnings
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { TICK_INTERVAL_MS, MAX_TICK_DURATION_MS } from '@/game/balance'

/**
 * Performance statistics for monitoring
 */
export interface TickPerformance {
  /** Average tick duration over last 10 ticks */
  averageDurationMs: number
  /** Maximum tick duration in last 10 ticks */
  maxDurationMs: number
  /** Number of ticks that exceeded performance target */
  slowTickCount: number
  /** Total ticks processed */
  totalTicks: number
}

/**
 * Hook options
 */
export interface UseGameTickOptions {
  /** Whether game loop should be running */
  isPaused?: boolean
  /** Callback to execute on each tick */
  onTick: () => void
  /** Optional callback when tick performance is slow */
  onSlowTick?: (durationMs: number) => void
}

/**
 * useGameTick Hook
 * Manages the game loop interval and performance monitoring
 *
 * @param options Hook configuration
 * @returns Performance statistics
 *
 * @example
 * ```tsx
 * const { averageDurationMs } = useGameTick({
 *   isPaused: gameStore.currentEvent !== null,
 *   onTick: gameStore.tick,
 *   onSlowTick: (duration) => console.warn(`Slow tick: ${duration}ms`)
 * })
 * ```
 */
export function useGameTick(options: UseGameTickOptions): TickPerformance {
  const { isPaused = false, onTick, onSlowTick } = options

  // Performance tracking
  const [performance, setPerformance] = useState<TickPerformance>({
    averageDurationMs: 0,
    maxDurationMs: 0,
    slowTickCount: 0,
    totalTicks: 0,
  })

  // Store last 10 tick durations for averaging
  const tickDurations = useRef<number[]>([])
  const intervalRef = useRef<number | null>(null)
  const slowTickCountRef = useRef(0)
  const totalTicksRef = useRef(0)

  /**
   * Process a single tick with performance monitoring
   */
  const processTick = useCallback(() => {
    const startTime = performance.now()

    // Execute game tick
    onTick()

    // Measure duration
    const duration = performance.now() - startTime

    // Track performance
    tickDurations.current.push(duration)
    if (tickDurations.current.length > 10) {
      tickDurations.current.shift() // Keep only last 10
    }

    totalTicksRef.current += 1

    // Check if tick was slow
    if (duration > MAX_TICK_DURATION_MS) {
      slowTickCountRef.current += 1
      onSlowTick?.(duration)
      console.warn(
        `[GameTick] Slow tick detected: ${duration.toFixed(2)}ms (target: <${MAX_TICK_DURATION_MS}ms)`
      )
    }

    // Update performance stats
    const average =
      tickDurations.current.reduce((sum, d) => sum + d, 0) / tickDurations.current.length
    const max = Math.max(...tickDurations.current)

    setPerformance({
      averageDurationMs: average,
      maxDurationMs: max,
      slowTickCount: slowTickCountRef.current,
      totalTicks: totalTicksRef.current,
    })
  }, [onTick, onSlowTick])

  /**
   * Start game loop interval
   */
  const startInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      return // Already running
    }

    console.log('[GameTick] Starting game loop')
    intervalRef.current = window.setInterval(() => {
      processTick()
    }, TICK_INTERVAL_MS)
  }, [processTick])

  /**
   * Stop game loop interval
   */
  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      console.log('[GameTick] Stopping game loop')
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  /**
   * Effect: Manage interval based on pause state
   */
  useEffect(() => {
    if (isPaused) {
      stopInterval()
    } else {
      startInterval()
    }

    // Cleanup on unmount
    return () => {
      stopInterval()
    }
  }, [isPaused, startInterval, stopInterval])

  return performance
}

/**
 * useOfflineProgress Hook
 * Calculates and applies offline progress when player returns
 *
 * @param lastTickTime Timestamp of last game tick
 * @param onOfflineProgress Callback with offline results
 *
 * @example
 * ```tsx
 * useOfflineProgress(
 *   gameStore.lastTickTime,
 *   ({ dcEarned, secondsElapsed }) => {
 *     gameStore.applyOfflineProgress(dcEarned, secondsElapsed)
 *   }
 * )
 * ```
 */
export function useOfflineProgress(
  lastTickTime: number,
  onOfflineProgress: (result: {
    dcEarned: number
    secondsElapsed: number
    ticksSimulated: number
  }) => void
) {
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Only run once on mount
    if (hasProcessed.current) {
      return
    }

    const now = Date.now()
    const secondsElapsed = Math.floor((now - lastTickTime) / 1000)

    // Only apply if player was gone for at least 10 seconds
    if (secondsElapsed >= 10) {
      console.log(`[OfflineProgress] Player was offline for ${secondsElapsed} seconds`)

      // Note: Actual offline calculation happens in Zustand store
      // This hook just triggers the callback
      onOfflineProgress({
        dcEarned: 0, // Calculated by store
        secondsElapsed,
        ticksSimulated: 0, // Calculated by store
      })
    }

    hasProcessed.current = true
  }, [lastTickTime, onOfflineProgress])
}

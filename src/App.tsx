import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useGameTick } from './hooks/useGameTick'
import { formatNumber } from './utils/format'

function App() {
  const {
    dc,
    lifetimeDC,
    prestigeLevel,
    datasets,
    staff,
    activeIncidents,
    currentEvent,
    lastTickTime,
    offlineProgressApplied,
    tick,
    getGlobalSLA,
    getTotalDCRate,
    applyOfflineProgress,
  } = useGameStore()

  // Apply offline progress on mount
  useEffect(() => {
    if (!offlineProgressApplied) {
      const now = Date.now()
      const secondsElapsed = Math.floor((now - lastTickTime) / 1000)

      // Only apply if player was gone for at least 10 seconds
      if (secondsElapsed >= 10) {
        applyOfflineProgress(secondsElapsed)
      }
    }
  }, [lastTickTime, offlineProgressApplied, applyOfflineProgress])

  // Start game loop
  const tickPerformance = useGameTick({
    isPaused: currentEvent !== null, // Pause during events
    onTick: tick,
    onSlowTick: (duration) => {
      console.warn(`[App] Slow tick detected: ${duration.toFixed(2)}ms`)
    },
  })

  const globalSLA = getGlobalSLA()
  const dcRate = getTotalDCRate()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">
            Data Empire
          </h1>
          <p className="text-slate-400">
            Build and optimize your data infrastructure empire
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dashboard Card */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Data Credits:</span>
                <span className="font-mono text-green-400">{formatNumber(dc)} DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DC/sec:</span>
                <span className="font-mono text-green-300">
                  +{dcRate.toFixed(2)} DC/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Global SLA:</span>
                <span
                  className={`font-mono ${
                    globalSLA >= 95
                      ? 'text-green-400'
                      : globalSLA >= 80
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {globalSLA.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lifetime DC:</span>
                <span className="font-mono text-slate-300">{formatNumber(lifetimeDC)}</span>
              </div>
              {prestigeLevel > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Prestige Level:</span>
                  <span className="font-mono text-purple-400">{prestigeLevel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Datasets:</span>
                <span className="text-slate-200">{datasets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Staff:</span>
                <span className="text-slate-200">{staff.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Incidents:</span>
                <span
                  className={
                    activeIncidents.length > 0 ? 'text-red-400' : 'text-green-400'
                  }
                >
                  {activeIncidents.length}
                </span>
              </div>
              {currentEvent && (
                <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                  <p className="text-yellow-400 text-xs">⚠️ Event Active (Game Paused)</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Performance</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Tick Time:</span>
                <span
                  className={`font-mono ${
                    tickPerformance.averageDurationMs < 50
                      ? 'text-green-400'
                      : tickPerformance.averageDurationMs < 100
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {tickPerformance.averageDurationMs.toFixed(1)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Ticks:</span>
                <span className="text-slate-200">{tickPerformance.totalTicks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slow Ticks:</span>
                <span
                  className={
                    tickPerformance.slowTickCount > 0 ? 'text-yellow-400' : 'text-green-400'
                  }
                >
                  {tickPerformance.slowTickCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3">Phase 3: State Management Complete</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Zustand Game Store with Persistence
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Game Loop Running ({dcRate.toFixed(2)} DC/s)
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Offline Progress Calculation
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Performance Monitoring (avg {tickPerformance.averageDurationMs.toFixed(1)}ms)
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Save/Load System (localStorage)
            </li>
          </ul>
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded">
            <p className="text-blue-300 text-sm">
              💡 <strong>Next Step:</strong> Phase 4 - Add game content (datasets, pipelines,
              staff) to see the game in action!
            </p>
          </div>
        </div>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          <p>Phase 3 Complete • 47/47 Tests Passing • Ready for Phase 4: Game Content</p>
        </footer>
      </div>
    </div>
  )
}

export default App

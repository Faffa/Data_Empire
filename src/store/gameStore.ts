/**
 * Game Store - Main Zustand Store
 * Central state management for Data Empire
 *
 * This store integrates the pure game engine with React state management,
 * providing all game state and player actions in one place.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dataset, Staff, Incident, Event, Technology } from '@/types'
import {
  processTick,
  calculateOfflineProgress,
  type TickResult,
} from '@/game/engine'
import {
  calculateGlobalSLA,
  calculateTotalDC,
  calculateDatasetDC,
  calculateStaffMultiplier,
  canPrestige,
  calculatePrestigeBonus,
} from '@/game/formulas'
import { SAVE } from '@/game/balance'
import { getStarterDataset } from '@/data/contentLoader'

/**
 * Game State Interface
 * Matches the GameState type from types/index.ts but with Zustand actions
 */
interface GameState {
  // Currency & Progress
  dc: number
  lifetimeDC: number
  prestigeLevel: number

  // Game Entities
  datasets: Dataset[]
  purchasedPipelines: string[] // Global pipeline purchases
  staff: Staff[]
  unlockedTechnologies: string[]

  // Active Game State
  activeIncidents: Incident[]
  currentEvent: Event | null
  lastTickTime: number

  // Offline Progress Tracking
  offlineProgressApplied: boolean

  // Game Loop Actions
  tick: () => void

  // Player Actions
  purchasePipeline: (pipelineId: string, datasetId: string) => boolean
  hireStaff: (staff: Staff) => boolean
  unlockTechnology: (tech: Technology) => boolean
  resolveEvent: (choiceId: string) => void
  prestige: () => void

  // Dataset Management
  unlockDataset: (dataset: Dataset) => void

  // Queries (Derived State)
  getGlobalSLA: () => number
  getDatasetDCRate: (datasetId: string) => number
  getTotalDCRate: () => number
  canAfford: (cost: number) => boolean
  canPrestige: () => boolean

  // Offline Progress
  applyOfflineProgress: (secondsElapsed: number) => void

  // Manual Save/Load (for export/import)
  exportSave: () => string
  importSave: (saveData: string) => boolean

  // Reset (for testing)
  reset: () => void
}

/**
 * Initial state factory
 * Creates a fresh game state with starter dataset
 */
const createInitialState = () => ({
  // Currency
  dc: 0,
  lifetimeDC: 0,
  prestigeLevel: 0,

  // Entities
  datasets: [getStarterDataset()], // Start with first dataset!
  purchasedPipelines: [] as string[],
  staff: [] as Staff[],
  unlockedTechnologies: [] as string[],

  // Active state
  activeIncidents: [] as Incident[],
  currentEvent: null as Event | null,
  lastTickTime: Date.now(),

  // Offline tracking
  offlineProgressApplied: false,
})

/**
 * Game Store
 * Main Zustand store with persistence
 */
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...createInitialState(),

      /**
       * Main game tick - called every second by useGameTick hook
       * Processes all game systems and updates state
       */
      tick: () => {
        const state = get()

        // Process the tick
        const result: TickResult = processTick({
          datasets: state.datasets,
          staff: state.staff,
          activeIncidents: state.activeIncidents,
          currentEvent: state.currentEvent,
          dc: state.dc,
          lifetimeDC: state.lifetimeDC,
          prestigeLevel: state.prestigeLevel,
        })

        // Apply prestige bonuses to all datasets
        const prestigeBonus = calculatePrestigeBonus(state.prestigeLevel)
        const datasetsWithPrestige = result.updatedDatasets.map(dataset => ({
          ...dataset,
          current_metrics: {
            T: Math.min(100, dataset.current_metrics.T + prestigeBonus),
            A: Math.min(100, dataset.current_metrics.A + prestigeBonus),
            C: Math.min(100, dataset.current_metrics.C + prestigeBonus),
          },
        }))

        // Update state
        set({
          dc: state.dc + result.dcGenerated,
          lifetimeDC: state.lifetimeDC + result.dcGenerated,
          datasets: datasetsWithPrestige,
          activeIncidents: [...result.updatedIncidents, ...result.newIncidents],
          currentEvent: result.newEvent || state.currentEvent,
          lastTickTime: Date.now(),
        })

        // Log performance warnings if tick was slow
        if (result.performance.tickDurationMs > 100) {
          console.warn(
            `[GameStore] Slow tick: ${result.performance.tickDurationMs.toFixed(2)}ms`,
            result.performance
          )
        }
      },

      /**
       * Purchase a pipeline for a specific dataset
       * Costs DC and applies pipeline effects
       */
      purchasePipeline: (_pipelineId: string, _datasetId: string) => {
        // Find the pipeline (in real implementation, this would load from pipelines.json)
        // For now, we'll need to pass the full pipeline object or load it
        // This is a placeholder - Phase 4 will add content loading
        console.warn('[GameStore] purchasePipeline: Content loading not yet implemented')
        return false

        // TODO: Implement in Phase 4 when we have pipelines.json
        // const pipeline = loadPipeline(pipelineId)
        // if (!pipeline || !state.canAfford(pipeline.cost_dc)) return false
        //
        // const dataset = state.datasets.find(d => d.id === datasetId)
        // if (!dataset) return false
        //
        // // Check if already installed
        // if (dataset.pipelines_installed.includes(pipelineId)) return false
        //
        // // Apply purchase
        // set({
        //   dc: state.dc - pipeline.cost_dc,
        //   datasets: state.datasets.map(d =>
        //     d.id === datasetId ? applyPipelineEffects(d, pipeline) : d
        //   ),
        //   purchasedPipelines: [...state.purchasedPipelines, pipelineId],
        // })
        //
        // return true
      },

      /**
       * Hire a staff member
       * Costs DC and adds to staff array
       */
      hireStaff: (staff: Staff) => {
        const state = get()

        // Check if already hired
        if (state.staff.some(s => s.id === staff.id)) {
          console.warn('[GameStore] Staff already hired:', staff.id)
          return false
        }

        // Check if can afford
        if (!state.canAfford(staff.cost_to_hire)) {
          console.warn('[GameStore] Cannot afford staff:', staff.cost_to_hire)
          return false
        }

        // Hire staff
        set({
          dc: state.dc - staff.cost_to_hire,
          staff: [...state.staff, staff],
        })

        console.log('[GameStore] Hired staff:', staff.name)
        return true
      },

      /**
       * Unlock a technology
       * Costs DC and applies tech effects
       */
      unlockTechnology: (tech: Technology) => {
        const state = get()

        // Check if already unlocked
        if (state.unlockedTechnologies.includes(tech.id)) {
          console.warn('[GameStore] Technology already unlocked:', tech.id)
          return false
        }

        // Check prerequisites
        const hasPrerequisites = tech.requires.every(reqId =>
          state.unlockedTechnologies.includes(reqId)
        )
        if (!hasPrerequisites) {
          console.warn('[GameStore] Missing prerequisites for tech:', tech.id)
          return false
        }

        // Check if can afford
        if (!state.canAfford(tech.cost_dc)) {
          console.warn('[GameStore] Cannot afford technology:', tech.cost_dc)
          return false
        }

        // Unlock technology
        set({
          dc: state.dc - tech.cost_dc,
          unlockedTechnologies: [...state.unlockedTechnologies, tech.id],
        })

        // TODO: Apply technology unlocks (datasets, pipelines, staff, bonuses)
        // This will be implemented in Phase 4 when we have content

        console.log('[GameStore] Unlocked technology:', tech.name)
        return true
      },

      /**
       * Resolve an event by choosing an option
       * Applies event effects and clears current event
       */
      resolveEvent: (choiceId: string) => {
        const state = get()
        const event = state.currentEvent

        if (!event) {
          console.warn('[GameStore] No active event to resolve')
          return
        }

        const choice = event.choices.find(c => c.id === choiceId)
        if (!choice) {
          console.warn('[GameStore] Invalid choice ID:', choiceId)
          return
        }

        // Apply choice effects
        const effects = choice.effects
        let newDC = state.dc

        if (effects.dc_change) {
          newDC += effects.dc_change
        }

        // Apply metric changes to all datasets (or specific dataset if specified)
        let newDatasets = state.datasets
        if (effects.metric_changes) {
          newDatasets = state.datasets.map(dataset => ({
            ...dataset,
            current_metrics: {
              T: Math.max(
                0,
                Math.min(100, dataset.current_metrics.T + (effects.metric_changes?.T || 0))
              ),
              A: Math.max(
                0,
                Math.min(100, dataset.current_metrics.A + (effects.metric_changes?.A || 0))
              ),
              C: Math.max(
                0,
                Math.min(100, dataset.current_metrics.C + (effects.metric_changes?.C || 0))
              ),
            },
          }))
        }

        // TODO: Handle spawn_incident effect in Phase 6

        // Clear event and apply effects
        set({
          currentEvent: null,
          dc: newDC,
          datasets: newDatasets,
        })

        console.log('[GameStore] Resolved event:', event.id, 'with choice:', choiceId)
      },

      /**
       * Prestige reset
       * Resets progress but keeps technologies and grants permanent bonus
       */
      prestige: () => {
        const state = get()

        if (!state.canPrestige()) {
          console.warn('[GameStore] Cannot prestige yet')
          return
        }

        // Keep technologies, reset everything else
        set({
          ...createInitialState(),
          prestigeLevel: state.prestigeLevel + 1,
          unlockedTechnologies: state.unlockedTechnologies,
        })

        console.log('[GameStore] Prestige! New level:', state.prestigeLevel + 1)
      },

      /**
       * Unlock a dataset (add to available datasets)
       */
      unlockDataset: (dataset: Dataset) => {
        const state = get()

        // Check if already unlocked
        if (state.datasets.some(d => d.id === dataset.id)) {
          console.warn('[GameStore] Dataset already unlocked:', dataset.id)
          return
        }

        set({
          datasets: [...state.datasets, dataset],
        })

        console.log('[GameStore] Unlocked dataset:', dataset.name)
      },

      /**
       * Get global SLA across all datasets
       */
      getGlobalSLA: () => {
        const state = get()
        return calculateGlobalSLA(state.datasets)
      },

      /**
       * Get DC generation rate for specific dataset
       */
      getDatasetDCRate: (datasetId: string) => {
        const state = get()
        const dataset = state.datasets.find(d => d.id === datasetId)
        if (!dataset) return 0

        const staffMultiplier = calculateStaffMultiplier(state.staff)
        return calculateDatasetDC(dataset, staffMultiplier)
      },

      /**
       * Get total DC generation rate
       */
      getTotalDCRate: () => {
        const state = get()
        return calculateTotalDC(state.datasets, state.staff)
      },

      /**
       * Check if player can afford a cost
       */
      canAfford: (cost: number) => {
        return get().dc >= cost
      },

      /**
       * Check if player can prestige
       */
      canPrestige: () => {
        const state = get()
        return canPrestige(state.datasets, state.lifetimeDC)
      },

      /**
       * Apply offline progress when player returns
       */
      applyOfflineProgress: (secondsElapsed: number) => {
        const state = get()

        if (state.offlineProgressApplied) {
          console.log('[GameStore] Offline progress already applied this session')
          return
        }

        console.log(`[GameStore] Calculating offline progress for ${secondsElapsed} seconds`)

        const result = calculateOfflineProgress(
          {
            datasets: state.datasets,
            staff: state.staff,
            activeIncidents: state.activeIncidents,
            dc: state.dc,
            lifetimeDC: state.lifetimeDC,
            prestigeLevel: state.prestigeLevel,
          },
          secondsElapsed
        )

        set({
          dc: state.dc + result.dcEarned,
          lifetimeDC: state.lifetimeDC + result.dcEarned,
          datasets: result.finalDatasets,
          activeIncidents: [], // Clear incidents after offline period
          offlineProgressApplied: true,
          lastTickTime: Date.now(),
        })

        console.log(
          `[GameStore] Offline progress applied: +${result.dcEarned} DC over ${result.ticksSimulated} ticks`
        )
      },

      /**
       * Export save data as JSON string
       */
      exportSave: () => {
        const state = get()
        const saveData = {
          version: SAVE.VERSION,
          timestamp: Date.now(),
          state: {
            dc: state.dc,
            lifetimeDC: state.lifetimeDC,
            prestigeLevel: state.prestigeLevel,
            datasets: state.datasets,
            purchasedPipelines: state.purchasedPipelines,
            staff: state.staff,
            unlockedTechnologies: state.unlockedTechnologies,
            activeIncidents: state.activeIncidents,
            lastTickTime: state.lastTickTime,
          },
        }
        return JSON.stringify(saveData, null, 2)
      },

      /**
       * Import save data from JSON string
       */
      importSave: (saveData: string) => {
        try {
          const parsed = JSON.parse(saveData)

          // Validate version
          if (parsed.version !== SAVE.VERSION) {
            console.error('[GameStore] Invalid save version:', parsed.version)
            return false
          }

          // Apply loaded state
          set({
            ...parsed.state,
            currentEvent: null, // Don't restore events
            offlineProgressApplied: false, // Allow offline progress calculation
          })

          console.log('[GameStore] Save imported successfully')
          return true
        } catch (error) {
          console.error('[GameStore] Failed to import save:', error)
          return false
        }
      },

      /**
       * Reset game to initial state (for testing/new game)
       */
      reset: () => {
        set(createInitialState())
        console.log('[GameStore] Game reset to initial state')
      },
    }),
    {
      name: SAVE.STORAGE_KEY, // 'data-empire-save'
      version: SAVE.VERSION,
      // Only persist game state, not derived functions
      partialize: (state) => ({
        dc: state.dc,
        lifetimeDC: state.lifetimeDC,
        prestigeLevel: state.prestigeLevel,
        datasets: state.datasets,
        purchasedPipelines: state.purchasedPipelines,
        staff: state.staff,
        unlockedTechnologies: state.unlockedTechnologies,
        activeIncidents: state.activeIncidents,
        lastTickTime: state.lastTickTime,
      }),
    }
  )
)

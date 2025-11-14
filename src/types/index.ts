/**
 * Central export file for all game types
 * Import from here to get all type definitions
 */

export type {
  Dataset,
  Metrics,
  SLATargets,
  RiskRating,
  DatasetStatus,
} from './dataset'

export type {
  Pipeline,
  PipelineEffects,
} from './pipeline'

export type {
  Staff,
  StaffEffects,
  StaffRole,
} from './staff'

export type {
  Technology,
  TechnologyUnlocks,
} from './technology'

export type {
  Event,
  EventChoice,
  EventEffects,
  EventType,
  Incident,
  IncidentType,
} from './event'

import type { Dataset } from './dataset'
import type { Staff } from './staff'
import type { Incident, Event } from './event'

/**
 * Game State - Complete state of the game
 * Managed by Zustand store
 */
export interface GameState {
  // Currency & Progress
  /** Current Data Credits balance */
  dc: number
  /** Total DC earned lifetime (for prestige calculation) */
  lifetimeDC: number
  /** Current prestige level */
  prestigeLevel: number

  // Game Entities
  /** All datasets (unlocked and available) */
  datasets: Dataset[]
  /** IDs of purchased pipelines (global) */
  purchasedPipelines: string[]
  /** Hired staff members */
  staff: Staff[]
  /** IDs of unlocked technologies */
  unlockedTechnologies: string[]

  // Active Game State
  /** Currently active incidents */
  activeIncidents: Incident[]
  /** Current event awaiting player choice (null if none) */
  currentEvent: Event | null
  /** Last tick timestamp (for offline progress) */
  lastTickTime: number

  // Game Loop Actions
  /** Main game tick - called every second */
  tick: () => void

  // Player Actions
  /** Purchase a pipeline for a dataset */
  purchasePipeline: (pipelineId: string, datasetId: string) => void
  /** Hire a staff member */
  hireStaff: (staffId: string) => void
  /** Unlock a technology */
  unlockTechnology: (techId: string) => void
  /** Resolve an event by choosing an option */
  resolveEvent: (choiceId: string) => void
  /** Trigger prestige reset */
  prestige: () => void

  // Queries (Derived State)
  /** Calculate global SLA across all datasets */
  getGlobalSLA: () => number
  /** Calculate DC generation rate for specific dataset */
  getDatasetDCRate: (datasetId: string) => number
  /** Calculate total DC generation rate */
  getTotalDCRate: () => number
}

/**
 * UI State - Separate from game state, not persisted
 * For UI-only concerns like modal visibility, selected tabs, etc.
 */
export interface UIState {
  /** Currently selected dataset ID (for detail view) */
  selectedDatasetId: string | null
  /** Tech tree visibility */
  showTechTree: boolean
  /** Current active tab */
  currentTab: 'datasets' | 'pipelines' | 'staff' | 'tech'
  /** Notification queue */
  notifications: Array<{
    id: number
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
  }>

  // UI Actions
  setSelectedDataset: (id: string | null) => void
  toggleTechTree: () => void
  setTab: (tab: UIState['currentTab']) => void
  addNotification: (message: string, type: UIState['notifications'][0]['type']) => void
  dismissNotification: (id: number) => void
}

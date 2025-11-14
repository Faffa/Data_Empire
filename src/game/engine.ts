/**
 * Game Engine - Tick Orchestration
 * Coordinates all game systems and processes each game tick
 *
 * This is the "heart" of the game loop that runs every second
 */

import type { Dataset, Staff, Incident, Event, GameState } from '@/types'
import {
  applyMetricDecay,
  calculateSLA,
  calculateTotalDC,
  calculateDatasetStatus,
  calculateIncidentChance,
  calculateGlobalSLA,
  applyStaffBonuses,
} from './formulas'
import { BASE_DECAY_RATE, INCIDENT } from './balance'

/**
 * Result of processing a game tick
 */
export interface TickResult {
  /** DC generated this tick */
  dcGenerated: number
  /** New incidents spawned this tick */
  newIncidents: Incident[]
  /** New event triggered (if any) */
  newEvent: Event | null
  /** Updated datasets after all processing */
  updatedDatasets: Dataset[]
  /** Updated incidents after resolution progress */
  updatedIncidents: Incident[]
  /** Performance metrics */
  performance: {
    tickDurationMs: number
    decayTimeMs: number
    incidentTimeMs: number
    dcCalcTimeMs: number
  }
}

/**
 * Process a single game tick
 * This is called every second by the game loop
 *
 * Order of operations:
 * 1. Apply metric decay to all datasets
 * 2. Apply staff bonuses to counteract decay
 * 3. Process active incidents (reduce metrics, update progress)
 * 4. Calculate SLA and dataset status
 * 5. Generate DC based on current SLA
 * 6. Roll for new incidents
 * 7. Roll for random events
 * 8. Return all updates
 *
 * @param state Current game state snapshot
 * @returns Tick result with all updates
 */
export function processTick(state: {
  datasets: Dataset[]
  staff: Staff[]
  activeIncidents: Incident[]
  currentEvent: Event | null
  dc: number
  lifetimeDC: number
  prestigeLevel: number
}): TickResult {
  const startTime = performance.now()
  const perfMetrics = {
    tickDurationMs: 0,
    decayTimeMs: 0,
    incidentTimeMs: 0,
    dcCalcTimeMs: 0,
  }

  // Don't process game logic if there's an active event (game is paused)
  if (state.currentEvent !== null) {
    return {
      dcGenerated: 0,
      newIncidents: [],
      newEvent: null,
      updatedDatasets: state.datasets,
      updatedIncidents: state.activeIncidents,
      performance: perfMetrics,
    }
  }

  // Step 1: Apply metric decay to all datasets
  const decayStart = performance.now()
  let datasets = state.datasets.map(dataset => {
    // Calculate effective decay rate (base - pipeline reductions)
    const decayReduction = dataset.pipelines_installed.length * 0.01 // Simplified for now
    const effectiveDecayRate = Math.max(0.01, BASE_DECAY_RATE - decayReduction)

    // Apply decay
    const decayed = applyMetricDecay(dataset, effectiveDecayRate)

    // Apply staff bonuses to counteract decay (in same step)
    return state.staff.length > 0 ? applyStaffBonuses(decayed, state.staff) : decayed
  })
  perfMetrics.decayTimeMs = performance.now() - decayStart

  // Step 3: Process active incidents
  const incidentStart = performance.now()
  const { updatedDatasets: datasetsAfterIncidents, updatedIncidents } = processIncidents(
    datasets,
    state.activeIncidents,
    state.staff
  )
  datasets = datasetsAfterIncidents
  perfMetrics.incidentTimeMs = performance.now() - incidentStart

  // Step 4: Update SLA and status for all datasets
  datasets = datasets.map(dataset => ({
    ...dataset,
    currentSLA: calculateSLA(dataset.current_metrics),
    status: calculateDatasetStatus(dataset),
  }))

  // Step 5: Calculate DC generation
  const dcCalcStart = performance.now()
  const dcGenerated = calculateTotalDC(datasets, state.staff)
  perfMetrics.dcCalcTimeMs = performance.now() - dcCalcStart

  // Step 6: Roll for new incidents
  const newIncidents: Incident[] = []
  datasets.forEach(dataset => {
    const incidentChance = calculateIncidentChance(dataset)
    if (Math.random() < incidentChance) {
      // Spawn incident (simplified - will be expanded with incident templates)
      const incident = createIncident(dataset)
      newIncidents.push(incident)
    }
  })

  // Step 7: Roll for random events (TODO: implement event system)
  const newEvent: Event | null = null // Placeholder for Phase 6

  // Calculate total tick duration
  perfMetrics.tickDurationMs = performance.now() - startTime

  return {
    dcGenerated,
    newIncidents,
    newEvent,
    updatedDatasets: datasets,
    updatedIncidents,
    performance: perfMetrics,
  }
}

/**
 * Process all active incidents
 * Updates incident progress and applies metric penalties
 *
 * @param datasets Current datasets
 * @param incidents Active incidents
 * @param staff Hired staff (affects resolution speed)
 * @returns Updated datasets and incidents
 */
function processIncidents(
  datasets: Dataset[],
  incidents: Incident[],
  staff: Staff[]
): {
  updatedDatasets: Dataset[]
  updatedIncidents: Incident[]
} {
  // Calculate staff resolution speed bonus
  const resolutionSpeedMultiplier = staff.reduce(
    (multiplier, member) => multiplier * member.effects.incident_resolution_speed,
    1.0
  )

  // Update incident progress
  const updatedIncidents = incidents
    .map(incident => {
      // Progress towards resolution (1 tick = 1 second)
      const progressPerTick = (1 / incident.base_resolution_time) * resolutionSpeedMultiplier
      const newProgress = incident.resolution_progress + progressPerTick

      return {
        ...incident,
        resolution_progress: newProgress,
      }
    })
    .filter(incident => incident.resolution_progress < 1.0) // Remove resolved incidents

  // Apply incident penalties to affected datasets
  const updatedDatasets = datasets.map(dataset => {
    // Find incidents affecting this dataset
    const affectingIncidents = updatedIncidents.filter(
      incident => incident.dataset_id === dataset.id
    )

    if (affectingIncidents.length === 0) {
      return dataset
    }

    // Apply all incident impacts (cumulative)
    let current_metrics = { ...dataset.current_metrics }
    affectingIncidents.forEach(incident => {
      current_metrics = {
        T: Math.max(0, current_metrics.T + incident.metric_impact.T),
        A: Math.max(0, current_metrics.A + incident.metric_impact.A),
        C: Math.max(0, current_metrics.C + incident.metric_impact.C),
      }
    })

    return {
      ...dataset,
      current_metrics,
    }
  })

  return {
    updatedDatasets,
    updatedIncidents,
  }
}

/**
 * Create a new incident for a dataset
 * TODO: Load from incident templates in Phase 6
 *
 * @param dataset Dataset to create incident for
 * @returns New incident instance
 */
function createIncident(dataset: Dataset): Incident {
  // Simplified incident creation - will be expanded with templates
  const incidentTypes: Array<{
    type: Incident['type']
    title: string
    description: string
    impact: Incident['metric_impact']
    resolutionTime: number
    haltsDC: boolean
  }> = [
    {
      type: 'data-delay',
      title: 'Data Delay',
      description: `${dataset.name} is experiencing upstream delays`,
      impact: INCIDENT.IMPACT.MINOR,
      resolutionTime: INCIDENT.RESOLUTION_TIME.MINOR,
      haltsDC: false,
    },
    {
      type: 'corrupted-batch',
      title: 'Corrupted Batch',
      description: `Data quality issue detected in ${dataset.name}`,
      impact: INCIDENT.IMPACT.MODERATE,
      resolutionTime: INCIDENT.RESOLUTION_TIME.MODERATE,
      haltsDC: false,
    },
    {
      type: 'pipeline-failure',
      title: 'Pipeline Failure',
      description: `Critical pipeline failure in ${dataset.name}`,
      impact: INCIDENT.IMPACT.MAJOR,
      resolutionTime: INCIDENT.RESOLUTION_TIME.MAJOR,
      haltsDC: true,
    },
  ]

  // Select random incident type
  const template = incidentTypes[Math.floor(Math.random() * incidentTypes.length)]

  return {
    id: `incident-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: template.type,
    title: template.title,
    description: template.description,
    dataset_id: dataset.id,
    metric_impact: template.impact,
    base_resolution_time: template.resolutionTime,
    resolution_progress: 0,
    started_at: Date.now(),
    halts_dc_generation: template.haltsDC,
  }
}

/**
 * Calculate offline progress when player returns
 * Simulates ticks in batches for performance
 *
 * @param state Last saved game state
 * @param secondsElapsed Time since last tick
 * @returns Updated state after offline simulation
 */
export function calculateOfflineProgress(
  state: {
    datasets: Dataset[]
    staff: Staff[]
    activeIncidents: Incident[]
    dc: number
    lifetimeDC: number
    prestigeLevel: number
  },
  secondsElapsed: number
): {
  dcEarned: number
  ticksSimulated: number
  finalDatasets: Dataset[]
} {
  // Cap offline progress at 24 hours (balance constant)
  const MAX_OFFLINE_SECONDS = 86400
  const ticksToSimulate = Math.min(secondsElapsed, MAX_OFFLINE_SECONDS)

  // Offline efficiency: 50% DC generation while offline
  const OFFLINE_EFFICIENCY = 0.5

  let totalDCEarned = 0
  let currentDatasets = state.datasets
  let ticksProcessed = 0

  // Simulate in batches of 60 seconds for performance
  const BATCH_SIZE = 60
  const batches = Math.ceil(ticksToSimulate / BATCH_SIZE)

  for (let batch = 0; batch < batches; batch++) {
    const ticksInBatch = Math.min(BATCH_SIZE, ticksToSimulate - ticksProcessed)

    // Process batch
    const result = processTick({
      ...state,
      datasets: currentDatasets,
      activeIncidents: [], // Clear incidents during offline (too complex to simulate)
      currentEvent: null,
    })

    // Apply offline efficiency to DC generation
    const batchDC = result.dcGenerated * ticksInBatch * OFFLINE_EFFICIENCY
    totalDCEarned += batchDC

    // Update datasets for next batch
    currentDatasets = result.updatedDatasets

    ticksProcessed += ticksInBatch
  }

  return {
    dcEarned: Math.floor(totalDCEarned),
    ticksSimulated: ticksProcessed,
    finalDatasets: currentDatasets,
  }
}

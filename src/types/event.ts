/**
 * Event and Incident Type Definitions
 * Based on Functional Specification Section 3.6 and 3.8
 */

export type EventType = 'audit' | 'incident' | 'bonus' | 'choice'
export type IncidentType =
  | 'pipeline-failure'
  | 'data-delay'
  | 'corrupted-batch'
  | 'hardware-outage'
  | 'quality-crash'
  | 'regulatory-warning'

/**
 * Effects that can be applied by event choices or incidents
 */
export interface EventEffects {
  /** DC change (positive or negative) */
  dc_change?: number
  /** Metric changes (applied to specific or all datasets) */
  metric_changes?: {
    T?: number
    A?: number
    C?: number
  }
  /** Incident chance modifier (0.1 = +10% incident chance) */
  incident_chance_change?: number
  /** Spawn a new incident */
  spawn_incident?: {
    type: IncidentType
    dataset_id: string
  }
}

/**
 * Choice in an event - player must select one
 */
export interface EventChoice {
  /** Unique identifier for this choice */
  id: string
  /** Button text */
  label: string
  /** What happens if player selects this */
  effects: EventEffects
}

/**
 * Event - Random occurrence requiring player decision
 * Pauses game until player responds
 */
export interface Event {
  /** Unique identifier */
  id: string
  /** Event title */
  title: string
  /** Event description/message */
  message: string
  /** Event type */
  type: EventType
  /** Available choices (empty array = auto-resolving event) */
  choices: EventChoice[]
  /** Trigger probability per tick (0-1) */
  trigger_chance?: number
  /** Conditions that must be met for event to trigger */
  trigger_conditions?: {
    /** Minimum global SLA required */
    min_sla?: number
    /** Maximum global SLA (event only triggers if below this) */
    max_sla?: number
    /** Minimum DC balance */
    min_dc?: number
    /** Required technology unlocked */
    requires_tech?: string
  }
}

/**
 * Incident - Active negative effect on a dataset
 * Reduces metrics and DC generation until resolved
 */
export interface Incident {
  /** Unique identifier (generated at runtime) */
  id: string
  /** Type of incident */
  type: IncidentType
  /** Title for display */
  title: string
  /** Description */
  description: string
  /** Dataset affected */
  dataset_id: string
  /** Metric impact (negative values) */
  metric_impact: {
    T: number
    A: number
    C: number
  }
  /** Base time to resolve (ticks) */
  base_resolution_time: number
  /** Current resolution progress (0 = just started, 1 = resolved) */
  resolution_progress: number
  /** When incident started (timestamp) */
  started_at: number
  /** If true, DC generation is halted for this dataset */
  halts_dc_generation: boolean
}

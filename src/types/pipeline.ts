/**
 * Pipeline Type Definitions
 * Based on Functional Specification Section 3.4
 */

/**
 * Pipeline Effects on Dataset Metrics
 * Positive numbers improve metrics, negative numbers worsen them
 */
export interface PipelineEffects {
  /** Timeliness improvement */
  T: number
  /** Accuracy improvement */
  A: number
  /** Completeness improvement */
  C: number
  /** Decay rate reduction (0-1, where 0.1 = 10% reduction) */
  decay_reduction: number
  /** Incident chance reduction (0-1, where 0.1 = 10% reduction) */
  incident_reduction: number
}

/**
 * Pipeline - Upgrades that improve dataset performance
 * One-time purchase, permanent effects
 */
export interface Pipeline {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Description of what the pipeline does */
  description: string
  /** Cost in Data Credits */
  cost_dc: number
  /** Effects applied to dataset metrics */
  effects: PipelineEffects
  /** Technology requirement (optional) */
  requires_tech?: string
  /** If true, pipeline can be purchased per dataset. If false, global effect */
  per_dataset: boolean
  /** Category for UI grouping */
  category: 'validation' | 'etl' | 'streaming' | 'quality' | 'automation'
}

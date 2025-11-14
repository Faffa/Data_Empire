/**
 * Dataset Type Definitions
 * Based on Functional Specification Section 3.3
 */

export type RiskRating = 'low' | 'medium' | 'high'
export type DatasetStatus = 'ok' | 'warning' | 'failing'

/**
 * Metrics: Timeliness, Accuracy, Completeness
 * Range: 0-100 for each metric
 */
export interface Metrics {
  /** Timeliness - Data freshness and latency */
  T: number
  /** Accuracy - Data quality and correctness */
  A: number
  /** Completeness - Data coverage and comprehensiveness */
  C: number
}

/**
 * SLA Targets for each metric
 * Defines the minimum acceptable levels
 */
export interface SLATargets {
  T: number
  A: number
  C: number
}

/**
 * Dataset - Core game entity representing a data source
 * Generates Data Credits (DC) based on SLA performance
 */
export interface Dataset {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Description of the dataset */
  description: string
  /** Base DC generation per minute (before SLA multiplier) */
  base_dc: number
  /** Data volume - affects latency and incident chance */
  volume: number
  /** Risk rating - affects incident probability */
  risk_rating: RiskRating
  /** Target SLA thresholds */
  sla_targets: SLATargets
  /** Current metric values (0-100) */
  current_metrics: Metrics
  /** IDs of pipelines installed on this dataset */
  pipelines_installed: string[]
  /** Current SLA compliance percentage (derived) */
  currentSLA: number
  /** Current status based on SLA performance */
  status: DatasetStatus
  /** Unlock requirement (DC threshold or tech requirement) */
  unlock_requirement?: {
    dc_threshold?: number
    tech_required?: string
  }
}

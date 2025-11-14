/**
 * Technology Type Definitions
 * Based on Functional Specification Section 3.7
 */

/**
 * What a technology unlocks when purchased
 */
export interface TechnologyUnlocks {
  /** Dataset IDs that become available */
  datasets: string[]
  /** Pipeline IDs that become available */
  pipelines: string[]
  /** Staff role IDs that become available */
  staff_roles: string[]
  /** Global bonuses applied permanently */
  global_bonuses: {
    /** DC generation multiplier (1.1 = +10%) */
    dc_multiplier?: number
    /** Global SLA bonus (added to all datasets) */
    sla_bonus?: number
    /** Decay rate reduction (0.1 = 10% slower decay) */
    decay_reduction?: number
    /** Incident chance reduction (0.1 = 10% fewer incidents) */
    incident_reduction?: number
  }
}

/**
 * Technology - Research/upgrade in the tech tree
 * Unlocks new capabilities and provides permanent bonuses
 */
export interface Technology {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Description of benefits */
  description: string
  /** Cost in Data Credits */
  cost_dc: number
  /** What this technology unlocks */
  unlocks: TechnologyUnlocks
  /** Technology IDs that must be unlocked first */
  requires: string[]
  /** Tier/level for visual organization (1 = early, 5 = late game) */
  tier: number
  /** Category for grouping */
  category: 'infrastructure' | 'processing' | 'governance' | 'automation' | 'advanced'
}

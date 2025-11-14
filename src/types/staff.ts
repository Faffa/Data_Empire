/**
 * Staff Type Definitions
 * Based on Functional Specification Section 3.5
 */

export type StaffRole = 'data-engineer' | 'data-steward' | 'sre' | 'architect' | 'cdao'

/**
 * Staff Effects - Bonuses provided by hired staff
 */
export interface StaffEffects {
  /** Global Timeliness bonus (added to all datasets) */
  global_T_bonus: number
  /** Global Accuracy bonus */
  global_A_bonus: number
  /** Global Completeness bonus */
  global_C_bonus: number
  /** Incident resolution speed multiplier (higher = faster) */
  incident_resolution_speed: number
  /** DC generation bonus multiplier (1.1 = +10%) */
  dc_generation_bonus: number
}

/**
 * Staff Member - Provides passive bonuses
 * Costs salary per minute (deducted from DC)
 */
export interface Staff {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Job title */
  role: StaffRole
  /** Description of role benefits */
  description: string
  /** One-time hiring cost (DC) */
  cost_to_hire: number
  /** Ongoing salary per minute (DC) */
  salary_per_minute: number
  /** Effects provided by this staff member */
  effects: StaffEffects
  /** When this staff member was hired (timestamp) */
  hired_at?: number
  /** Technology requirement to unlock this role (optional) */
  requires_tech?: string
}

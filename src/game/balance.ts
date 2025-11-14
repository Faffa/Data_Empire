/**
 * Game Balance Constants
 * Central location for all game tuning values
 *
 * Adjust these values to balance difficulty, progression, and player experience
 * All formulas reference these constants for easy rebalancing
 */

/**
 * TICK TIMING
 */
export const TICK_INTERVAL_MS = 1000 // 1 second per tick
export const MAX_TICK_DURATION_MS = 100 // Performance target: ticks should complete in <100ms

/**
 * METRIC DECAY
 * Base decay rate per tick (all metrics naturally degrade)
 */
export const BASE_DECAY_RATE = 0.1 // 0.1 points per second
export const MIN_DECAY_RATE = 0.01 // Minimum decay (with max pipeline/tech bonuses)
export const MAX_DECAY_RATE = 0.5 // Maximum decay (during incidents)

/**
 * SLA CALCULATION
 * Weights for SLA formula: (T × 0.4) + (A × 0.4) + (C × 0.2)
 */
export const SLA_WEIGHT_TIMELINESS = 0.4
export const SLA_WEIGHT_ACCURACY = 0.4
export const SLA_WEIGHT_COMPLETENESS = 0.2

/**
 * DC GENERATION
 * DC per minute values for datasets (divided by 60 for per-second rate)
 */
export const DC_GENERATION = {
  // Early game datasets (Tier 1)
  TIER_1_MIN: 60, // 1 DC/sec at 100% SLA
  TIER_1_MAX: 180, // 3 DC/sec at 100% SLA

  // Mid game datasets (Tier 2)
  TIER_2_MIN: 300, // 5 DC/sec at 100% SLA
  TIER_2_MAX: 900, // 15 DC/sec at 100% SLA

  // Late game datasets (Tier 3)
  TIER_3_MIN: 1800, // 30 DC/sec at 100% SLA
  TIER_3_MAX: 6000, // 100 DC/sec at 100% SLA
}

/**
 * INCIDENT SYSTEM
 */
export const INCIDENT = {
  // Base chance per tick (0.003 = 0.3% per second)
  BASE_CHANCE: 0.003,

  // Chance range (clamped after all multipliers)
  MIN_CHANCE: 0.001, // 0.1% minimum
  MAX_CHANCE: 0.1, // 10% maximum

  // Volume scaling (volumeFactor = 1 + volume / 1000)
  VOLUME_DIVISOR: 1000,

  // Risk rating multipliers
  RISK_MULTIPLIERS: {
    low: 1.0,
    medium: 1.5,
    high: 2.0,
  },

  // Resolution times (in ticks/seconds)
  RESOLUTION_TIME: {
    MINOR: 30, // 30 seconds
    MODERATE: 60, // 1 minute
    MAJOR: 120, // 2 minutes
    CRITICAL: 300, // 5 minutes
  },

  // Metric impact ranges (negative values)
  IMPACT: {
    MINOR: { T: -5, A: -5, C: -5 },
    MODERATE: { T: -15, A: -15, C: -10 },
    MAJOR: { T: -30, A: -30, C: -20 },
    CRITICAL: { T: -50, A: -50, C: -30 },
  },
}

/**
 * DATASET STATUS THRESHOLDS
 */
export const STATUS_THRESHOLDS = {
  // Status is "ok" if SLA >= target
  OK_MULTIPLIER: 1.0,

  // Status is "warning" if SLA >= target * 0.8
  WARNING_MULTIPLIER: 0.8,

  // Status is "failing" if SLA < target * 0.8
  // (no multiplier needed, it's the fallback)
}

/**
 * STAFF BONUSES
 */
export const STAFF = {
  // DC generation bonus range
  DC_BONUS_MIN: 1.05, // +5% weakest staff
  DC_BONUS_MAX: 1.25, // +25% strongest staff

  // Global metric bonus range (added to all datasets)
  METRIC_BONUS_MIN: 0.5, // +0.5 points per tick
  METRIC_BONUS_MAX: 2.0, // +2.0 points per tick

  // Incident resolution speed multiplier
  RESOLUTION_SPEED_MIN: 1.1, // 10% faster
  RESOLUTION_SPEED_MAX: 2.0, // 2x faster

  // Salary costs (DC per minute)
  SALARY_MIN: 10, // Entry level
  SALARY_MAX: 1000, // Senior/expert level
}

/**
 * PIPELINE EFFECTS
 */
export const PIPELINE = {
  // Metric improvements (one-time boost when installed)
  METRIC_BOOST_MIN: 5, // +5 points
  METRIC_BOOST_MAX: 20, // +20 points

  // Decay reduction (reduces decay rate)
  DECAY_REDUCTION_MIN: 0.05, // 5% slower decay
  DECAY_REDUCTION_MAX: 0.25, // 25% slower decay

  // Incident chance reduction
  INCIDENT_REDUCTION_MIN: 0.05, // 5% fewer incidents
  INCIDENT_REDUCTION_MAX: 0.3, // 30% fewer incidents

  // Cost range
  COST_MIN: 500, // Early pipelines
  COST_MAX: 500000, // Late game pipelines
}

/**
 * TECHNOLOGY UNLOCKS
 */
export const TECHNOLOGY = {
  // Cost range
  COST_MIN: 1000, // Tier 1 tech
  COST_MAX: 10000000, // Tier 5 tech

  // Global DC multiplier bonuses
  DC_MULTIPLIER_MIN: 1.05, // +5%
  DC_MULTIPLIER_MAX: 1.5, // +50%

  // Global SLA bonuses (added to all datasets)
  SLA_BONUS_MIN: 1, // +1%
  SLA_BONUS_MAX: 10, // +10%
}

/**
 * PRESTIGE SYSTEM
 */
export const PRESTIGE = {
  // Requirements
  MIN_DATASETS: 10,
  MIN_GLOBAL_SLA: 95, // 95% average
  MIN_LIFETIME_DC: 2000000, // 2 million DC

  // Bonuses
  SLA_BONUS_PER_LEVEL: 5, // +5% global SLA per prestige level
}

/**
 * EVENT SYSTEM
 */
export const EVENTS = {
  // Base chance for random event per tick
  BASE_CHANCE: 0.001, // 0.1% per second

  // Cooldown between events (in ticks)
  MIN_COOLDOWN: 300, // 5 minutes minimum between events

  // Effect ranges
  DC_REWARD_MIN: 1000,
  DC_REWARD_MAX: 100000,
  DC_PENALTY_MIN: -5000,
  DC_PENALTY_MAX: -50000,
}

/**
 * OFFLINE PROGRESS
 */
export const OFFLINE = {
  // Maximum offline time to simulate (in seconds)
  MAX_SIMULATION_TIME: 86400, // 24 hours

  // Offline efficiency (DC generation reduced when offline)
  EFFICIENCY_MULTIPLIER: 0.5, // 50% DC generation while offline

  // Tick batch size for offline simulation
  BATCH_SIZE: 60, // Simulate 60 seconds at a time
}

/**
 * UI REFRESH RATES
 */
export const UI = {
  // How often to update UI (in milliseconds)
  UPDATE_INTERVAL_MS: 100, // 10 FPS for smooth animations

  // Number formatting thresholds
  ABBREVIATE_THRESHOLD: 10000, // Use K/M/B notation above 10k
}

/**
 * PERSISTENCE
 */
export const SAVE = {
  // Auto-save interval (in ticks)
  AUTO_SAVE_INTERVAL: 10, // Save every 10 seconds

  // Save version (increment when making breaking changes)
  VERSION: 1,

  // LocalStorage key
  STORAGE_KEY: 'data-empire-save',
}

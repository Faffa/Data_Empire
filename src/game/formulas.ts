/**
 * Game Formulas - Pure calculation functions
 * Based on Functional Specification Section 3
 *
 * All functions are pure (no side effects) and unit testable
 */

import type { Dataset, Metrics, Staff, Pipeline } from '@/types'

/**
 * Calculate SLA compliance percentage
 * Formula: (T × 0.4) + (A × 0.4) + (C × 0.2)
 *
 * Weight: Timeliness 40%, Accuracy 40%, Completeness 20%
 * Why: Regulatory priorities emphasize timeliness and accuracy
 *
 * @param metrics Current metric values (T/A/C)
 * @returns SLA percentage (0-100)
 */
export function calculateSLA(metrics: Metrics): number {
  const sla = metrics.T * 0.4 + metrics.A * 0.4 + metrics.C * 0.2

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, sla))
}

/**
 * Calculate DC generation per second for a dataset
 * Formula: base_dc * (SLA / 100) * globalMultipliers / 60
 *
 * @param dataset The dataset generating DC
 * @param globalMultipliers Combined staff + tech bonuses (default 1.0)
 * @returns DC per second
 */
export function calculateDatasetDC(
  dataset: Dataset,
  globalMultipliers: number = 1.0
): number {
  const sla = calculateSLA(dataset.current_metrics)
  const baseDC = dataset.base_dc

  // SLA acts as efficiency multiplier (0-100% efficiency)
  const efficiency = sla / 100

  // DC per minute converted to per second
  return (baseDC * efficiency * globalMultipliers) / 60
}

/**
 * Calculate total DC generation across all datasets
 *
 * @param datasets All active datasets
 * @param staff All hired staff (for bonus calculation)
 * @returns Total DC per second
 */
export function calculateTotalDC(datasets: Dataset[], staff: Staff[]): number {
  const staffMultiplier = calculateStaffMultiplier(staff)

  return datasets.reduce((total, dataset) => {
    return total + calculateDatasetDC(dataset, staffMultiplier)
  }, 0)
}

/**
 * Calculate combined staff DC generation bonus
 *
 * @param staff All hired staff
 * @returns Combined multiplier (1.0 = no bonus, 1.5 = +50%)
 */
export function calculateStaffMultiplier(staff: Staff[]): number {
  return staff.reduce((multiplier, member) => {
    return multiplier * member.effects.dc_generation_bonus
  }, 1.0)
}

/**
 * Apply natural metric decay to a dataset
 * All metrics decay by decayRate per tick (default 0.1)
 * Pipelines and staff can reduce decay rate
 *
 * @param dataset Dataset to decay
 * @param decayRate Base decay rate per tick (default 0.1)
 * @returns Dataset with decayed metrics
 */
export function applyMetricDecay(dataset: Dataset, decayRate: number = 0.1): Dataset {
  return {
    ...dataset,
    current_metrics: {
      T: Math.max(0, dataset.current_metrics.T - decayRate),
      A: Math.max(0, dataset.current_metrics.A - decayRate),
      C: Math.max(0, dataset.current_metrics.C - decayRate),
    },
  }
}

/**
 * Apply metric decay to all datasets
 *
 * @param datasets All datasets
 * @param decayRate Base decay rate
 * @returns Datasets with decayed metrics
 */
export function applyMetricDecayToAll(
  datasets: Dataset[],
  decayRate: number = 0.1
): Dataset[] {
  return datasets.map(dataset => applyMetricDecay(dataset, decayRate))
}

/**
 * Apply pipeline effects to a dataset
 * Permanently improves metrics and reduces decay/incidents
 *
 * @param dataset Dataset to upgrade
 * @param pipeline Pipeline to apply
 * @returns Dataset with pipeline effects applied
 */
export function applyPipelineEffects(dataset: Dataset, pipeline: Pipeline): Dataset {
  return {
    ...dataset,
    current_metrics: {
      T: Math.min(100, dataset.current_metrics.T + pipeline.effects.T),
      A: Math.min(100, dataset.current_metrics.A + pipeline.effects.A),
      C: Math.min(100, dataset.current_metrics.C + pipeline.effects.C),
    },
    pipelines_installed: [...dataset.pipelines_installed, pipeline.id],
  }
}

/**
 * Apply staff bonuses to dataset metrics
 * Staff provide global bonuses to all datasets
 *
 * @param dataset Dataset to apply bonuses to
 * @param staff All hired staff
 * @returns Dataset with staff bonuses applied
 */
export function applyStaffBonuses(dataset: Dataset, staff: Staff[]): Dataset {
  const totalBonus = staff.reduce(
    (acc, member) => ({
      T: acc.T + member.effects.global_T_bonus,
      A: acc.A + member.effects.global_A_bonus,
      C: acc.C + member.effects.global_C_bonus,
    }),
    { T: 0, A: 0, C: 0 }
  )

  return {
    ...dataset,
    current_metrics: {
      T: Math.min(100, dataset.current_metrics.T + totalBonus.T),
      A: Math.min(100, dataset.current_metrics.A + totalBonus.A),
      C: Math.min(100, dataset.current_metrics.C + totalBonus.C),
    },
  }
}

/**
 * Calculate dataset status based on SLA performance
 *
 * @param dataset Dataset to check
 * @returns Status: 'ok', 'warning', or 'failing'
 */
export function calculateDatasetStatus(dataset: Dataset): Dataset['status'] {
  const sla = calculateSLA(dataset.current_metrics)
  const target = calculateSLA(dataset.sla_targets)

  if (sla >= target) return 'ok'
  if (sla >= target * 0.8) return 'warning' // Within 80% of target
  return 'failing'
}

/**
 * Calculate incident trigger chance for a dataset
 * Formula: base_chance * volume_factor * (100 - current_SLA) / 100
 *
 * Higher volume and lower SLA = more incidents
 *
 * @param dataset Dataset to check
 * @param baseChance Base incident chance per tick (default 0.003 = 0.3%)
 * @returns Incident probability (0-1)
 */
export function calculateIncidentChance(
  dataset: Dataset,
  baseChance: number = 0.003
): number {
  const sla = calculateSLA(dataset.current_metrics)

  // Volume factor: higher volume = more incidents
  const volumeFactor = 1 + dataset.volume / 1000

  // SLA factor: lower SLA = more incidents
  const slaFactor = (100 - sla) / 100

  // Risk rating multiplier
  const riskMultipliers: Record<Dataset['risk_rating'], number> = {
    low: 1.0,
    medium: 1.5,
    high: 2.0,
  }
  const riskMultiplier = riskMultipliers[dataset.risk_rating]

  const chance = baseChance * volumeFactor * slaFactor * riskMultiplier

  // Clamp between 0.1% and 10%
  return Math.max(0.001, Math.min(0.1, chance))
}

/**
 * Calculate global SLA across all datasets
 * Simple average of all dataset SLAs
 *
 * @param datasets All datasets
 * @returns Average SLA percentage (0-100)
 */
export function calculateGlobalSLA(datasets: Dataset[]): number {
  if (datasets.length === 0) return 100

  const totalSLA = datasets.reduce((sum, dataset) => {
    return sum + calculateSLA(dataset.current_metrics)
  }, 0)

  return totalSLA / datasets.length
}

/**
 * Check if prestige is unlocked
 * Requirements: 10 datasets, 95% global SLA, 2M lifetime DC
 *
 * @param datasets All datasets
 * @param lifetimeDC Total DC earned
 * @returns True if prestige is available
 */
export function canPrestige(datasets: Dataset[], lifetimeDC: number): boolean {
  const hasEnoughDatasets = datasets.length >= 10
  const hasHighSLA = calculateGlobalSLA(datasets) >= 95
  const hasEnoughDC = lifetimeDC >= 2000000

  return hasEnoughDatasets && hasHighSLA && hasEnoughDC
}

/**
 * Calculate prestige bonus
 * +5% global SLA per prestige level
 *
 * @param prestigeLevel Current prestige level
 * @returns SLA bonus to apply (e.g., 5 for +5%)
 */
export function calculatePrestigeBonus(prestigeLevel: number): number {
  return prestigeLevel * 5
}

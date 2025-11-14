import { describe, it, expect } from 'vitest'
import {
  calculateSLA,
  calculateDatasetDC,
  calculateTotalDC,
  calculateStaffMultiplier,
  applyMetricDecay,
  applyPipelineEffects,
  calculateDatasetStatus,
  calculateIncidentChance,
  calculateGlobalSLA,
  canPrestige,
  calculatePrestigeBonus,
} from './formulas'
import type { Dataset, Staff, Pipeline } from '@/types'

describe('calculateSLA', () => {
  it('calculates weighted SLA correctly (40/40/20)', () => {
    const metrics = { T: 100, A: 100, C: 100 }
    expect(calculateSLA(metrics)).toBe(100)
  })

  it('applies correct weights', () => {
    const metrics = { T: 100, A: 50, C: 0 }
    const expected = 100 * 0.4 + 50 * 0.4 + 0 * 0.2
    expect(calculateSLA(metrics)).toBe(expected)
  })

  it('clamps to 0-100 range', () => {
    expect(calculateSLA({ T: -10, A: 150, C: 50 })).toBeGreaterThanOrEqual(0)
    expect(calculateSLA({ T: -10, A: 150, C: 50 })).toBeLessThanOrEqual(100)
  })

  it('handles zero metrics', () => {
    expect(calculateSLA({ T: 0, A: 0, C: 0 })).toBe(0)
  })
})

describe('calculateDatasetDC', () => {
  const mockDataset: Dataset = {
    id: 'test',
    name: 'Test Dataset',
    description: 'Test',
    base_dc: 60, // 60 DC per minute = 1 DC per second at 100% SLA
    volume: 100,
    risk_rating: 'low',
    sla_targets: { T: 95, A: 95, C: 95 },
    current_metrics: { T: 100, A: 100, C: 100 },
    pipelines_installed: [],
    currentSLA: 100,
    status: 'ok',
  }

  it('generates 1 DC/sec at 100% SLA with base_dc=60', () => {
    expect(calculateDatasetDC(mockDataset, 1.0)).toBe(1)
  })

  it('generates 0.5 DC/sec at 50% SLA', () => {
    const dataset = {
      ...mockDataset,
      current_metrics: { T: 50, A: 50, C: 50 },
    }
    expect(calculateDatasetDC(dataset, 1.0)).toBe(0.5)
  })

  it('applies global multipliers correctly', () => {
    const dcWithoutBonus = calculateDatasetDC(mockDataset, 1.0)
    const dcWithBonus = calculateDatasetDC(mockDataset, 1.5)
    expect(dcWithBonus).toBe(dcWithoutBonus * 1.5)
  })

  it('generates 0 DC at 0% SLA', () => {
    const dataset = {
      ...mockDataset,
      current_metrics: { T: 0, A: 0, C: 0 },
    }
    expect(calculateDatasetDC(dataset, 1.0)).toBe(0)
  })
})

describe('calculateStaffMultiplier', () => {
  const mockStaff: Staff = {
    id: 'engineer',
    name: 'Data Engineer',
    role: 'data-engineer',
    description: 'Test',
    cost_to_hire: 1000,
    salary_per_minute: 10,
    effects: {
      global_T_bonus: 0,
      global_A_bonus: 0,
      global_C_bonus: 0,
      incident_resolution_speed: 1.0,
      dc_generation_bonus: 1.1, // +10%
    },
  }

  it('returns 1.0 with no staff', () => {
    expect(calculateStaffMultiplier([])).toBe(1.0)
  })

  it('applies single staff bonus', () => {
    expect(calculateStaffMultiplier([mockStaff])).toBe(1.1)
  })

  it('multiplies bonuses from multiple staff', () => {
    const staff = [mockStaff, mockStaff] // Two 10% bonuses
    expect(calculateStaffMultiplier(staff)).toBeCloseTo(1.21, 5) // 1.1 * 1.1
  })
})

describe('applyMetricDecay', () => {
  const mockDataset: Dataset = {
    id: 'test',
    name: 'Test',
    description: 'Test',
    base_dc: 10,
    volume: 100,
    risk_rating: 'low',
    sla_targets: { T: 95, A: 95, C: 95 },
    current_metrics: { T: 100, A: 80, C: 50 },
    pipelines_installed: [],
    currentSLA: 0,
    status: 'ok',
  }

  it('reduces metrics by decay rate', () => {
    const decayed = applyMetricDecay(mockDataset, 0.1)
    expect(decayed.current_metrics.T).toBe(99.9)
    expect(decayed.current_metrics.A).toBe(79.9)
    expect(decayed.current_metrics.C).toBe(49.9)
  })

  it('does not go below 0', () => {
    const dataset = { ...mockDataset, current_metrics: { T: 0.05, A: 0, C: 0 } }
    const decayed = applyMetricDecay(dataset, 0.1)
    expect(decayed.current_metrics.T).toBeGreaterThanOrEqual(0)
    expect(decayed.current_metrics.A).toBe(0)
    expect(decayed.current_metrics.C).toBe(0)
  })

  it('uses default decay rate of 0.1', () => {
    const decayed = applyMetricDecay(mockDataset)
    expect(decayed.current_metrics.T).toBe(99.9)
  })
})

describe('applyPipelineEffects', () => {
  const mockDataset: Dataset = {
    id: 'test',
    name: 'Test',
    description: 'Test',
    base_dc: 10,
    volume: 100,
    risk_rating: 'low',
    sla_targets: { T: 95, A: 95, C: 95 },
    current_metrics: { T: 80, A: 70, C: 60 },
    pipelines_installed: [],
    currentSLA: 0,
    status: 'ok',
  }

  const mockPipeline: Pipeline = {
    id: 'validation',
    name: 'Validation Pipeline',
    description: 'Test',
    cost_dc: 100,
    effects: {
      T: 10,
      A: 15,
      C: 5,
      decay_reduction: 0.1,
      incident_reduction: 0.1,
    },
    per_dataset: true,
    category: 'validation',
  }

  it('applies pipeline effects to metrics', () => {
    const upgraded = applyPipelineEffects(mockDataset, mockPipeline)
    expect(upgraded.current_metrics.T).toBe(90)
    expect(upgraded.current_metrics.A).toBe(85)
    expect(upgraded.current_metrics.C).toBe(65)
  })

  it('adds pipeline to installed list', () => {
    const upgraded = applyPipelineEffects(mockDataset, mockPipeline)
    expect(upgraded.pipelines_installed).toContain('validation')
  })

  it('does not exceed 100', () => {
    const dataset = { ...mockDataset, current_metrics: { T: 95, A: 95, C: 95 } }
    const upgraded = applyPipelineEffects(dataset, mockPipeline)
    expect(upgraded.current_metrics.T).toBe(100)
    expect(upgraded.current_metrics.A).toBe(100)
    expect(upgraded.current_metrics.C).toBe(100)
  })
})

describe('calculateDatasetStatus', () => {
  const createDataset = (metrics: { T: number; A: number; C: number }): Dataset => ({
    id: 'test',
    name: 'Test',
    description: 'Test',
    base_dc: 10,
    volume: 100,
    risk_rating: 'low',
    sla_targets: { T: 95, A: 95, C: 95 },
    current_metrics: metrics,
    pipelines_installed: [],
    currentSLA: 0,
    status: 'ok',
  })

  it('returns "ok" when above target', () => {
    const dataset = createDataset({ T: 100, A: 100, C: 100 })
    expect(calculateDatasetStatus(dataset)).toBe('ok')
  })

  it('returns "warning" when within 80% of target', () => {
    // Target SLA: 95, 80% of that is 76
    const dataset = createDataset({ T: 80, A: 80, C: 80 })
    expect(calculateDatasetStatus(dataset)).toBe('warning')
  })

  it('returns "failing" when below 80% of target', () => {
    const dataset = createDataset({ T: 50, A: 50, C: 50 })
    expect(calculateDatasetStatus(dataset)).toBe('failing')
  })
})

describe('calculateIncidentChance', () => {
  const createDataset = (
    metrics: { T: number; A: number; C: number },
    volume: number = 100,
    risk: 'low' | 'medium' | 'high' = 'low'
  ): Dataset => ({
    id: 'test',
    name: 'Test',
    description: 'Test',
    base_dc: 10,
    volume,
    risk_rating: risk,
    sla_targets: { T: 95, A: 95, C: 95 },
    current_metrics: metrics,
    pipelines_installed: [],
    currentSLA: 0,
    status: 'ok',
  })

  it('returns low chance at high SLA', () => {
    const dataset = createDataset({ T: 100, A: 100, C: 100 })
    const chance = calculateIncidentChance(dataset)
    expect(chance).toBeLessThan(0.01) // <1%
  })

  it('returns higher chance at low SLA', () => {
    const highSLA = createDataset({ T: 100, A: 100, C: 100 })
    const lowSLA = createDataset({ T: 30, A: 30, C: 30 })

    expect(calculateIncidentChance(lowSLA)).toBeGreaterThan(
      calculateIncidentChance(highSLA)
    )
  })

  it('increases with volume', () => {
    const lowVolume = createDataset({ T: 50, A: 50, C: 50 }, 100)
    const highVolume = createDataset({ T: 50, A: 50, C: 50 }, 5000)

    expect(calculateIncidentChance(highVolume)).toBeGreaterThan(
      calculateIncidentChance(lowVolume)
    )
  })

  it('increases with risk rating', () => {
    const low = createDataset({ T: 50, A: 50, C: 50 }, 100, 'low')
    const medium = createDataset({ T: 50, A: 50, C: 50 }, 100, 'medium')
    const high = createDataset({ T: 50, A: 50, C: 50 }, 100, 'high')

    expect(calculateIncidentChance(medium)).toBeGreaterThan(calculateIncidentChance(low))
    expect(calculateIncidentChance(high)).toBeGreaterThan(calculateIncidentChance(medium))
  })

  it('clamps between 0.1% and 10%', () => {
    const dataset = createDataset({ T: 0, A: 0, C: 0 }, 10000, 'high')
    const chance = calculateIncidentChance(dataset)
    expect(chance).toBeGreaterThanOrEqual(0.001)
    expect(chance).toBeLessThanOrEqual(0.1)
  })
})

describe('calculateGlobalSLA', () => {
  const createDataset = (metrics: { T: number; A: number; C: number }): Dataset => ({
    id: 'test',
    name: 'Test',
    description: 'Test',
    base_dc: 10,
    volume: 100,
    risk_rating: 'low',
    sla_targets: { T: 95, A: 95, C: 95 },
    current_metrics: metrics,
    pipelines_installed: [],
    currentSLA: 0,
    status: 'ok',
  })

  it('returns 100 for empty datasets', () => {
    expect(calculateGlobalSLA([])).toBe(100)
  })

  it('calculates average SLA', () => {
    const datasets = [
      createDataset({ T: 100, A: 100, C: 100 }), // SLA: 100
      createDataset({ T: 50, A: 50, C: 50 }), // SLA: 50
    ]
    expect(calculateGlobalSLA(datasets)).toBe(75)
  })
})

describe('canPrestige', () => {
  const createDatasets = (count: number): Dataset[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `dataset-${i}`,
      name: `Dataset ${i}`,
      description: 'Test',
      base_dc: 10,
      volume: 100,
      risk_rating: 'low' as const,
      sla_targets: { T: 95, A: 95, C: 95 },
      current_metrics: { T: 100, A: 100, C: 100 },
      pipelines_installed: [],
      currentSLA: 100,
      status: 'ok' as const,
    }))

  it('requires 10 datasets, 95% SLA, and 2M DC', () => {
    expect(canPrestige(createDatasets(10), 2000000)).toBe(true)
  })

  it('fails with insufficient datasets', () => {
    expect(canPrestige(createDatasets(9), 2000000)).toBe(false)
  })

  it('fails with insufficient DC', () => {
    expect(canPrestige(createDatasets(10), 1999999)).toBe(false)
  })

  it('fails with low SLA', () => {
    const datasets = createDatasets(10).map(d => ({
      ...d,
      current_metrics: { T: 50, A: 50, C: 50 },
    }))
    expect(canPrestige(datasets, 2000000)).toBe(false)
  })
})

describe('calculatePrestigeBonus', () => {
  it('gives 5% per prestige level', () => {
    expect(calculatePrestigeBonus(0)).toBe(0)
    expect(calculatePrestigeBonus(1)).toBe(5)
    expect(calculatePrestigeBonus(3)).toBe(15)
  })
})

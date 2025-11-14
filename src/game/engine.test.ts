import { describe, it, expect, beforeEach } from 'vitest'
import { processTick, calculateOfflineProgress } from './engine'
import type { Dataset, Staff, Incident } from '@/types'

describe('processTick', () => {
  let mockDataset: Dataset
  let mockStaff: Staff[]
  let mockIncidents: Incident[]

  beforeEach(() => {
    mockDataset = {
      id: 'test-dataset',
      name: 'Test Dataset',
      description: 'Test',
      base_dc: 60, // 1 DC/sec at 100% SLA
      volume: 100,
      risk_rating: 'low',
      sla_targets: { T: 95, A: 95, C: 95 },
      current_metrics: { T: 100, A: 100, C: 100 },
      pipelines_installed: [],
      currentSLA: 100,
      status: 'ok',
    }

    mockStaff = []
    mockIncidents = []
  })

  it('generates DC based on dataset SLA', () => {
    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: mockIncidents,
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // 60 base_dc / 60 seconds = 1 DC per second at 100% SLA
    expect(result.dcGenerated).toBeCloseTo(1, 1)
  })

  it('applies metric decay to datasets', () => {
    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: mockIncidents,
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // Metrics should decay by 0.1 per tick
    expect(result.updatedDatasets[0].current_metrics.T).toBe(99.9)
    expect(result.updatedDatasets[0].current_metrics.A).toBe(99.9)
    expect(result.updatedDatasets[0].current_metrics.C).toBe(99.9)
  })

  it('updates dataset SLA after decay', () => {
    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: mockIncidents,
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // SLA should be recalculated after decay
    const expectedSLA = 99.9 * 0.4 + 99.9 * 0.4 + 99.9 * 0.2
    expect(result.updatedDatasets[0].currentSLA).toBeCloseTo(expectedSLA, 1)
  })

  it('updates dataset status based on SLA', () => {
    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: mockIncidents,
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    expect(result.updatedDatasets[0].status).toBe('ok')
  })

  it('applies staff bonuses to counteract decay', () => {
    // Start with lower metrics so we can see the bonus without hitting the 100 cap
    const dataset: Dataset = {
      ...mockDataset,
      current_metrics: { T: 95, A: 95, C: 95 },
    }

    const staff: Staff[] = [
      {
        id: 'engineer',
        name: 'Data Engineer',
        role: 'data-engineer',
        description: 'Improves metrics',
        cost_to_hire: 1000,
        salary_per_minute: 10,
        effects: {
          global_T_bonus: 0.2, // Counteracts decay
          global_A_bonus: 0.2,
          global_C_bonus: 0.2,
          incident_resolution_speed: 1.0,
          dc_generation_bonus: 1.0,
        },
      },
    ]

    const result = processTick({
      datasets: [dataset],
      staff,
      activeIncidents: mockIncidents,
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // Decay is 0.1, staff bonus is 0.2, net change is +0.1
    // Starting at 95: 95 - 0.1 (decay) + 0.2 (staff) = 95.1
    expect(result.updatedDatasets[0].current_metrics.T).toBeCloseTo(95.1, 1)
  })

  it('processes active incidents', () => {
    const incident: Incident = {
      id: 'incident-1',
      type: 'data-delay',
      title: 'Data Delay',
      description: 'Test incident',
      dataset_id: 'test-dataset',
      metric_impact: { T: -10, A: -5, C: -5 },
      base_resolution_time: 30,
      resolution_progress: 0,
      started_at: Date.now(),
      halts_dc_generation: false,
    }

    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: [incident],
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // Incident should apply metric penalties
    // T: 100 (start) - 0.1 (decay) - 10 (incident) = 89.9
    expect(result.updatedDatasets[0].current_metrics.T).toBeCloseTo(89.9, 1)

    // Incident should progress towards resolution
    // Progress per tick = 1 / 30 = 0.0333...
    expect(result.updatedIncidents[0].resolution_progress).toBeCloseTo(0.0333, 3)
  })

  it('removes resolved incidents', () => {
    const incident: Incident = {
      id: 'incident-1',
      type: 'data-delay',
      title: 'Data Delay',
      description: 'Test incident',
      dataset_id: 'test-dataset',
      metric_impact: { T: -10, A: -5, C: -5 },
      base_resolution_time: 30,
      resolution_progress: 0.97, // Close to resolved - will go over 1.0 this tick
      started_at: Date.now(),
      halts_dc_generation: false,
    }

    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: [incident],
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // Incident should be removed (progress >= 1.0)
    // 0.97 + (1/30) = 0.97 + 0.0333 = 1.0033 >= 1.0 ✓
    expect(result.updatedIncidents).toHaveLength(0)
  })

  it('staff improves incident resolution speed', () => {
    const staff: Staff[] = [
      {
        id: 'engineer',
        name: 'Data Engineer',
        role: 'data-engineer',
        description: 'Resolves incidents faster',
        cost_to_hire: 1000,
        salary_per_minute: 10,
        effects: {
          global_T_bonus: 0,
          global_A_bonus: 0,
          global_C_bonus: 0,
          incident_resolution_speed: 2.0, // 2x faster
          dc_generation_bonus: 1.0,
        },
      },
    ]

    const incident: Incident = {
      id: 'incident-1',
      type: 'data-delay',
      title: 'Data Delay',
      description: 'Test incident',
      dataset_id: 'test-dataset',
      metric_impact: { T: -10, A: -5, C: -5 },
      base_resolution_time: 30,
      resolution_progress: 0,
      started_at: Date.now(),
      halts_dc_generation: false,
    }

    const result = processTick({
      datasets: [mockDataset],
      staff,
      activeIncidents: [incident],
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // With 2x speed, progress should be 2 / 30 = 0.0666...
    expect(result.updatedIncidents[0].resolution_progress).toBeCloseTo(0.0666, 3)
  })

  it('pauses game when event is active', () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Test Event',
      message: 'Test',
      type: 'choice' as const,
      choices: [],
    }

    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: mockIncidents,
      currentEvent: mockEvent,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    // No DC should be generated when game is paused
    expect(result.dcGenerated).toBe(0)
    // Datasets should not change
    expect(result.updatedDatasets[0].current_metrics.T).toBe(100)
  })

  it('tracks performance metrics', () => {
    const result = processTick({
      datasets: [mockDataset],
      staff: mockStaff,
      activeIncidents: mockIncidents,
      currentEvent: null,
      dc: 0,
      lifetimeDC: 0,
      prestigeLevel: 0,
    })

    expect(result.performance.tickDurationMs).toBeGreaterThan(0)
    expect(result.performance.decayTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.performance.incidentTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.performance.dcCalcTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('can spawn new incidents randomly', () => {
    // Dataset with low SLA = higher incident chance
    const lowSLADataset: Dataset = {
      ...mockDataset,
      current_metrics: { T: 30, A: 30, C: 30 },
      currentSLA: 30,
      status: 'failing',
    }

    // Run many ticks to ensure at least one incident spawns
    let totalIncidents = 0
    for (let i = 0; i < 1000; i++) {
      const result = processTick({
        datasets: [lowSLADataset],
        staff: mockStaff,
        activeIncidents: mockIncidents,
        currentEvent: null,
        dc: 0,
        lifetimeDC: 0,
        prestigeLevel: 0,
      })
      totalIncidents += result.newIncidents.length
    }

    // With low SLA, we should have spawned at least one incident over 1000 ticks
    expect(totalIncidents).toBeGreaterThan(0)
  })
})

describe('calculateOfflineProgress', () => {
  let mockDataset: Dataset

  beforeEach(() => {
    mockDataset = {
      id: 'test-dataset',
      name: 'Test Dataset',
      description: 'Test',
      base_dc: 60, // 1 DC/sec at 100% SLA
      volume: 100,
      risk_rating: 'low',
      sla_targets: { T: 95, A: 95, C: 95 },
      current_metrics: { T: 100, A: 100, C: 100 },
      pipelines_installed: [],
      currentSLA: 100,
      status: 'ok',
    }
  })

  it('calculates DC earned during offline time', () => {
    const result = calculateOfflineProgress(
      {
        datasets: [mockDataset],
        staff: [],
        activeIncidents: [],
        dc: 0,
        lifetimeDC: 0,
        prestigeLevel: 0,
      },
      60 // 60 seconds offline
    )

    // 1 DC/sec * 60 sec * 0.5 (offline efficiency) = ~30 DC
    // Allow for decay reducing DC generation over time
    expect(result.dcEarned).toBeGreaterThan(25)
    expect(result.dcEarned).toBeLessThan(35)
    expect(result.ticksSimulated).toBe(60)
  })

  it('applies metric decay during offline time', () => {
    const result = calculateOfflineProgress(
      {
        datasets: [mockDataset],
        staff: [],
        activeIncidents: [],
        dc: 0,
        lifetimeDC: 0,
        prestigeLevel: 0,
      },
      60 // 60 seconds offline
    )

    // After 60 ticks, metrics should have decayed significantly
    expect(result.finalDatasets[0].current_metrics.T).toBeLessThan(100)
  })

  it('caps offline simulation at 24 hours', () => {
    const result = calculateOfflineProgress(
      {
        datasets: [mockDataset],
        staff: [],
        activeIncidents: [],
        dc: 0,
        lifetimeDC: 0,
        prestigeLevel: 0,
      },
      100000 // More than 24 hours
    )

    // Should cap at 86400 seconds (24 hours)
    expect(result.ticksSimulated).toBe(86400)
  })

  it('simulates ticks in batches for performance', () => {
    const result = calculateOfflineProgress(
      {
        datasets: [mockDataset],
        staff: [],
        activeIncidents: [],
        dc: 0,
        lifetimeDC: 0,
        prestigeLevel: 0,
      },
      300 // 5 minutes
    )

    // Should successfully simulate 300 ticks
    expect(result.ticksSimulated).toBe(300)
    expect(result.dcEarned).toBeGreaterThan(0)
  })
})

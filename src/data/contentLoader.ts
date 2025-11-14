/**
 * Content Loader
 * Loads game content from JSON files and provides initialization
 */

import type { Dataset, Pipeline, Staff, Technology, Event } from '@/types'
import type { Incident } from '@/types'
import datasetsData from './datasets.json'
import pipelinesData from './pipelines.json'
import staffData from './staff.json'
import technologiesData from './technologies.json'
import eventsData from './events.json'
import incidentsData from './incidents.json'

/**
 * Get all available datasets
 */
export function getAllDatasets(): Dataset[] {
  return datasetsData.datasets.map(d => ({
    ...d,
    current_metrics: { T: 100, A: 100, C: 100 }, // Start at perfect metrics
    pipelines_installed: [],
    currentSLA: 100,
    status: 'ok' as const,
  })) as Dataset[]
}

/**
 * Get dataset by ID
 */
export function getDatasetById(id: string): Dataset | undefined {
  const datasets = getAllDatasets()
  return datasets.find(d => d.id === id)
}

/**
 * Get all available pipelines
 */
export function getAllPipelines(): Pipeline[] {
  return pipelinesData.pipelines as Pipeline[]
}

/**
 * Get pipeline by ID
 */
export function getPipelineById(id: string): Pipeline | undefined {
  return (pipelinesData.pipelines as Pipeline[]).find(p => p.id === id)
}

/**
 * Get all available staff
 */
export function getAllStaff(): Staff[] {
  return staffData.staff as Staff[]
}

/**
 * Get staff by ID
 */
export function getStaffById(id: string): Staff | undefined {
  return (staffData.staff as Staff[]).find(s => s.id === id)
}

/**
 * Get all available technologies
 */
export function getAllTechnologies(): Technology[] {
  return technologiesData.technologies as Technology[]
}

/**
 * Get technology by ID
 */
export function getTechnologyById(id: string): Technology | undefined {
  return (technologiesData.technologies as Technology[]).find(t => t.id === id)
}

/**
 * Get all available events
 */
export function getAllEvents(): Event[] {
  return eventsData.events as Event[]
}

/**
 * Get event by ID
 */
export function getEventById(id: string): Event | undefined {
  return (eventsData.events as Event[]).find(e => e.id === id)
}

/**
 * Get all incident templates
 */
export function getAllIncidentTemplates(): Incident[] {
  return (incidentsData.incidents as any[]).map(i => ({
    ...i,
    id: '', // Will be generated when spawned
    dataset_id: '', // Will be set when spawned
    resolution_progress: 0,
    started_at: 0,
  })) as Incident[]
}

/**
 * Get incident template by ID
 */
export function getIncidentTemplateById(id: string) {
  return incidentsData.incidents.find(i => i.id === id)
}

/**
 * Get starter dataset (the first one to unlock)
 */
export function getStarterDataset(): Dataset {
  const dataset = getDatasetById('customer-transactions')
  if (!dataset) {
    throw new Error('Starter dataset not found!')
  }
  return dataset
}

/**
 * Check if a dataset can be unlocked based on requirements
 */
export function canUnlockDataset(
  dataset: Dataset,
  currentDC: number,
  unlockedTechnologies: string[]
): boolean {
  if (!dataset.unlock_requirement) {
    return true // No requirements
  }

  const req = dataset.unlock_requirement

  // Check DC threshold
  if (req.dc_threshold && currentDC < req.dc_threshold) {
    return false
  }

  // Check tech requirement
  if (req.tech_required && !unlockedTechnologies.includes(req.tech_required)) {
    return false
  }

  return true
}

/**
 * Get available datasets that can be unlocked
 */
export function getAvailableDatasets(
  currentDC: number,
  unlockedTechnologies: string[],
  alreadyUnlockedIds: string[]
): Dataset[] {
  const allDatasets = getAllDatasets()

  return allDatasets.filter(dataset => {
    // Skip already unlocked
    if (alreadyUnlockedIds.includes(dataset.id)) {
      return false
    }

    // Check if can unlock
    return canUnlockDataset(dataset, currentDC, unlockedTechnologies)
  })
}

/**
 * Get available pipelines based on unlocked technologies
 */
export function getAvailablePipelines(unlockedTechnologies: string[]): Pipeline[] {
  return getAllPipelines().filter(pipeline => {
    if (!pipeline.requires_tech) {
      return true // No tech requirement
    }
    return unlockedTechnologies.includes(pipeline.requires_tech)
  })
}

/**
 * Get available staff based on unlocked technologies
 */
export function getAvailableStaff(unlockedTechnologies: string[]): Staff[] {
  return getAllStaff().filter(staff => {
    if (!staff.requires_tech) {
      return true // No tech requirement
    }
    return unlockedTechnologies.includes(staff.requires_tech)
  })
}

/**
 * Get available technologies based on current unlocks
 */
export function getAvailableTechnologies(unlockedTechnologies: string[]): Technology[] {
  return getAllTechnologies().filter(tech => {
    // Skip already unlocked
    if (unlockedTechnologies.includes(tech.id)) {
      return false
    }

    // Check prerequisites
    return tech.requires.every(reqId => unlockedTechnologies.includes(reqId))
  })
}

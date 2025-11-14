/**
 * UI Store - Zustand Store for UI-Only State
 * Separate from game state for clean separation of concerns
 *
 * This store handles:
 * - Selected items (dataset, pipeline, etc.)
 * - UI visibility (modals, panels)
 * - Notifications
 * - Current tab/view
 */

import { create } from 'zustand'

/**
 * Notification type for toast messages
 */
export interface Notification {
  id: number
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: number
}

/**
 * UI State Interface
 */
interface UIState {
  // Selection State
  selectedDatasetId: string | null
  selectedPipelineId: string | null
  selectedStaffId: string | null
  selectedTechId: string | null

  // View State
  currentTab: 'dashboard' | 'datasets' | 'pipelines' | 'staff' | 'tech'
  showTechTree: boolean
  showEventModal: boolean
  showPrestigeModal: boolean
  showSettingsModal: boolean

  // Notifications
  notifications: Notification[]
  nextNotificationId: number

  // Actions - Selection
  setSelectedDataset: (id: string | null) => void
  setSelectedPipeline: (id: string | null) => void
  setSelectedStaff: (id: string | null) => void
  setSelectedTech: (id: string | null) => void

  // Actions - View
  setTab: (tab: UIState['currentTab']) => void
  toggleTechTree: () => void
  showEvent: () => void
  hideEvent: () => void
  showPrestige: () => void
  hidePrestige: () => void
  showSettings: () => void
  hideSettings: () => void

  // Actions - Notifications
  addNotification: (message: string, type: Notification['type']) => void
  dismissNotification: (id: number) => void
  clearNotifications: () => void

  // Reset
  reset: () => void
}

/**
 * Initial UI state
 */
const createInitialState = () => ({
  // Selection
  selectedDatasetId: null,
  selectedPipelineId: null,
  selectedStaffId: null,
  selectedTechId: null,

  // View
  currentTab: 'dashboard' as const,
  showTechTree: false,
  showEventModal: false,
  showPrestigeModal: false,
  showSettingsModal: false,

  // Notifications
  notifications: [] as Notification[],
  nextNotificationId: 1,
})

/**
 * UI Store
 * Not persisted - resets on page refresh
 */
export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  ...createInitialState(),

  // Selection Actions
  setSelectedDataset: (id) => set({ selectedDatasetId: id }),
  setSelectedPipeline: (id) => set({ selectedPipelineId: id }),
  setSelectedStaff: (id) => set({ selectedStaffId: id }),
  setSelectedTech: (id) => set({ selectedTechId: id }),

  // View Actions
  setTab: (tab) => set({ currentTab: tab }),
  toggleTechTree: () => set((state) => ({ showTechTree: !state.showTechTree })),
  showEvent: () => set({ showEventModal: true }),
  hideEvent: () => set({ showEventModal: false }),
  showPrestige: () => set({ showPrestigeModal: true }),
  hidePrestige: () => set({ showPrestigeModal: false }),
  showSettings: () => set({ showSettingsModal: true }),
  hideSettings: () => set({ showSettingsModal: false }),

  // Notification Actions
  addNotification: (message, type) => {
    const state = get()
    const notification: Notification = {
      id: state.nextNotificationId,
      message,
      type,
      timestamp: Date.now(),
    }

    set({
      notifications: [...state.notifications, notification],
      nextNotificationId: state.nextNotificationId + 1,
    })

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      get().dismissNotification(notification.id)
    }, 5000)
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  // Reset
  reset: () => {
    set(createInitialState())
  },
}))

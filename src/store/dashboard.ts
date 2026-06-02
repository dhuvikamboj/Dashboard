import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LayoutItem {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  config: Record<string, unknown>
}

export type Background = 'solid' | 'dots' | 'gridlines'

export interface Theme {
  accent: string
  background: Background
}

interface DashboardStore {
  editMode: boolean
  layout: LayoutItem[]
  theme: Theme
  toggleEditMode: () => void
  setLayout: (layout: LayoutItem[]) => void
  updateWidgetConfig: (id: string, config: Record<string, unknown>) => void
  addWidget: (type: string, defaultConfig: Record<string, unknown>, defaultSize: { w: number; h: number }) => void
  removeWidget: (id: string) => void
  setTheme: (theme: Partial<Theme>) => void
}

export const useDashboard = create<DashboardStore>()(
  persist(
    (set, get) => ({
      editMode: false,
      layout: [],
      theme: { accent: '#7c6af7', background: 'solid' },

      toggleEditMode: () => set(s => ({ editMode: !s.editMode })),

      setLayout: (layout) => set({ layout }),

      updateWidgetConfig: (id, config) =>
        set(s => ({
          layout: s.layout.map(item => item.id === id ? { ...item, config } : item),
        })),

      addWidget: (type, defaultConfig, defaultSize) => {
        const { layout } = get()
        const id = `${type}-${Date.now()}`
        const newItem: LayoutItem = {
          id,
          type,
          x: 0,
          y: 0,
          w: defaultSize.w,
          h: defaultSize.h,
          config: defaultConfig,
        }
        set({ layout: [...layout, newItem] })
      },

      removeWidget: (id) =>
        set(s => ({ layout: s.layout.filter(item => item.id !== id) })),

      setTheme: (theme) =>
        set(s => ({ theme: { ...s.theme, ...theme } })),
    }),
    {
      name: 'launchpad-store',
      // Only persist theme to localStorage; layout comes from backend
      partialize: (s) => ({ theme: s.theme }),
    }
  )
)

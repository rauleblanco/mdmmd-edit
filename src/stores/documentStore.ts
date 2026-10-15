import { create } from 'zustand'

export interface DocumentTab {
  id: string
  filePath: string | null
  fileName: string
  content: string
  isDirty: boolean
  scrollPosition: number
}

interface DocumentState {
  tabs: DocumentTab[]
  activeTabId: string | null

  addTab: (tab: DocumentTab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  updateTabFile: (id: string, filePath: string, fileName: string) => void
  setTabDirty: (id: string, dirty: boolean) => void
  markTabClean: (id: string) => void
  setTabScrollPosition: (id: string, position: number) => void
  getActiveTab: () => DocumentTab | null
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) =>
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
    })),

  removeTab: (id) =>
    set((s) => {
      const newTabs = s.tabs.filter((t) => t.id !== id)
      let newActiveId = s.activeTabId
      if (s.activeTabId === id) {
        const idx = s.tabs.findIndex((t) => t.id === id)
        newActiveId = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null
      }
      return { tabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t)),
    })),

  updateTabFile: (id, filePath, fileName) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, filePath, fileName, isDirty: false } : t
      ),
    })),

  setTabDirty: (id, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: dirty } : t)),
    })),

  markTabClean: (id) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: false } : t)),
    })),

  setTabScrollPosition: (id, position) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, scrollPosition: position } : t)),
    })),

  getActiveTab: () => {
    const state = get()
    return state.tabs.find((t) => t.id === state.activeTabId) ?? null
  },
}))

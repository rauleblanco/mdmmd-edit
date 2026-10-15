import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'
export type ViewMode = 'preview' | 'split' | 'editor'
export type DocumentTheme = 'github' | 'academic' | 'modern' | 'dark-elegant'

interface AppState {
  // Theme
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setResolvedTheme: (resolved: 'light' | 'dark') => void

  // View
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // Document theme
  documentTheme: DocumentTheme
  setDocumentTheme: (theme: DocumentTheme) => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Zoom
  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void

  // Focus mode
  focusMode: boolean
  toggleFocusMode: () => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Settings modal
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  settingsTab: 'general' | 'editor' | 'shortcuts' | 'about'
  setSettingsTab: (tab: 'general' | 'editor' | 'shortcuts' | 'about') => void
  openSettings: (tab?: 'general' | 'editor' | 'shortcuts' | 'about') => void

  // Find / Search in document
  findOpen: boolean
  setFindOpen: (open: boolean) => void

  // Editor preferences
  editorFontSize: number
  setEditorFontSize: (size: number) => void
  editorLineNumbers: boolean
  setEditorLineNumbers: (show: boolean) => void
  editorWordWrap: boolean
  setEditorWordWrap: (wrap: boolean) => void

  // Split view ratio
  splitRatio: number
  setSplitRatio: (ratio: number) => void
  resetSplitRatio: () => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => set({ theme }),
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),

  viewMode: 'split',
  setViewMode: (viewMode) => set({ viewMode }),

  documentTheme: 'github',
  setDocumentTheme: (documentTheme) => set({ documentTheme }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  zoom: 1,
  zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom + 0.1, 2) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom - 0.1, 0.5) })),
  zoomReset: () => set({ zoom: 1 }),

  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  settingsTab: 'general',
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  openSettings: (tab) => set((s) => ({ settingsOpen: true, settingsTab: tab ?? s.settingsTab })),

  findOpen: false,
  setFindOpen: (findOpen) => set({ findOpen }),

  editorFontSize: 14,
  setEditorFontSize: (editorFontSize) => set({ editorFontSize }),

  editorLineNumbers: true,
  setEditorLineNumbers: (editorLineNumbers) => set({ editorLineNumbers }),

  editorWordWrap: true,
  setEditorWordWrap: (editorWordWrap) => set({ editorWordWrap }),

  splitRatio: (() => {
    try {
      const saved = localStorage.getItem('mdmmd_split_ratio')
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= 0.15 && parsed <= 0.85) return parsed
      }
    } catch {}
    return 0.5
  })(),
  setSplitRatio: (splitRatio) => {
    const clamped = Math.min(Math.max(splitRatio, 0.15), 0.85)
    try {
      localStorage.setItem('mdmmd_split_ratio', String(clamped))
    } catch {}
    set({ splitRatio: clamped })
  },
  resetSplitRatio: () => {
    try {
      localStorage.setItem('mdmmd_split_ratio', '0.5')
    } catch {}
    set({ splitRatio: 0.5 })
  },
}))

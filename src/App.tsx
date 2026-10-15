import { useEffect, useCallback, useState, useRef } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useDocumentStore } from '@/stores/documentStore'
import { Titlebar } from '@/components/Titlebar'
import { TabBar } from '@/components/TabBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PasteDialog } from '@/components/PasteDialog'
import { Sidebar } from '@/features/sidebar/Sidebar'
import { Preview } from '@/features/preview/Preview'
import { Editor } from '@/features/editor/Editor'
import { CommandPalette } from '@/components/CommandPalette'
import { ExportDialog } from '@/features/export/ExportDialog'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { FindBar } from '@/components/FindBar'
import { SplitResizer } from '@/components/SplitResizer'
import {
  FileText,
  FolderOpen,
  ClipboardPaste,
  Sparkles,
  Network,
  Plus,
  Minimize2,
  Gauge,
  Edit3,
} from 'lucide-react'
import { isRawMermaid, isMermaidFile } from '@/lib/mermaid/renderer'

// Bundled sample documents
import kitchenSinkSample from '../fixtures/kitchen-sink.md?raw'
import diagramsSample from '../fixtures/diagrams.md?raw'
import largeDocSample from '../fixtures/large-document.md?raw'

function useThemeEffect(): void {
  const theme = useAppStore((s) => s.theme)
  const setResolvedTheme = useAppStore((s) => s.setResolvedTheme)

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (): void => {
      let resolved: 'light' | 'dark'
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light'
      } else {
        resolved = theme
      }
      root.classList.toggle('dark', resolved === 'dark')
      setResolvedTheme(resolved)

      // Sync with Electron native theme
      const themeAPI = window.mdmmd?.theme || window.mermak?.theme || window.markview?.theme
      if (themeAPI) {
        themeAPI.set(theme)
      }
    }

    applyTheme()
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [theme, setResolvedTheme])
}

export default function App(): JSX.Element {
  useThemeEffect()

  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportElementTarget, setExportElementTarget] = useState<HTMLElement | null>(null)

  // Split-view synchronized scrolling state
  const [editorScrollRatio, setEditorScrollRatio] = useState<number | undefined>(undefined)
  const [previewScrollRatio, setPreviewScrollRatio] = useState<number | undefined>(undefined)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const previewContentRef = useRef<HTMLDivElement>(null)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const tabs = useDocumentStore((s) => s.tabs)
  const activeTabId = useDocumentStore((s) => s.activeTabId)
  const addTab = useDocumentStore((s) => s.addTab)
  const updateTabContent = useDocumentStore((s) => s.updateTabContent)
  const updateTabFile = useDocumentStore((s) => s.updateTabFile)
  const markTabClean = useDocumentStore((s) => s.markTabClean)
  const removeTab = useDocumentStore((s) => s.removeTab)
  const getActiveTab = useDocumentStore((s) => s.getActiveTab)

  const activeTab = getActiveTab()
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const focusMode = useAppStore((s) => s.focusMode)
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode)
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const findOpen = useAppStore((s) => s.findOpen)
  const setFindOpen = useAppStore((s) => s.setFindOpen)
  const splitRatio = useAppStore((s) => s.splitRatio)
  const setSplitRatio = useAppStore((s) => s.setSplitRatio)
  const resetSplitRatio = useAppStore((s) => s.resetSplitRatio)

  // Local live content for debounced preview updates
  const [liveContent, setLiveContent] = useState(activeTab?.content || '')

  useEffect(() => {
    if (activeTab) {
      setLiveContent(activeTab.content)
    }
  }, [activeTab?.id])

  const handleEditorChange = (newVal: string) => {
    setLiveContent(newVal)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      if (activeTab) {
        updateTabContent(activeTab.id, newVal)
      }
    }, 150)
  }

  // Save active document to file
  const handleSaveFile = useCallback(async () => {
    const active = getActiveTab()
    if (!active) return

    const fileAPI = window.mdmmd?.file || window.mermak?.file || window.markview?.file
    if (!fileAPI) return

    try {
      if (active.filePath) {
        // Direct save to existing path
        await fileAPI.save(active.filePath, liveContent)
        updateTabContent(active.id, liveContent)
        markTabClean(active.id)
      } else {
        // Save As for untitled files
        const savedPath = await fileAPI.saveAs(liveContent, active.fileName)
        if (savedPath) {
          const newName = savedPath.split(/[\\/]/).pop() || active.fileName
          updateTabContent(active.id, liveContent)
          updateTabFile(active.id, savedPath, newName)
        }
      }
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }, [getActiveTab, liveContent, updateTabContent, markTabClean, updateTabFile])

  // Save As active document (always prompts for location)
  const handleSaveFileAs = useCallback(async () => {
    const active = getActiveTab()
    if (!active) return

    const fileAPI = window.mdmmd?.file || window.mermak?.file || window.markview?.file
    if (!fileAPI) return

    try {
      const savedPath = await fileAPI.saveAs(liveContent, active.fileName)
      if (savedPath) {
        const newName = savedPath.split(/[\\/]/).pop() || active.fileName
        updateTabContent(active.id, liveContent)
        updateTabFile(active.id, savedPath, newName)
      }
    } catch (err) {
      console.error('Failed to save file as:', err)
    }
  }, [getActiveTab, liveContent, updateTabContent, updateTabFile])

  // Open file via native dialog
  const handleOpenFile = useCallback(async () => {
    const fileAPI = window.mdmmd?.file || window.mermak?.file || window.markview?.file
    if (!fileAPI) return

    const result = await fileAPI.open()
    if (result) {
      const fileName = result.path.split(/[\\/]/).pop() || 'document.md'
      addTab({
        id: `tab-${Date.now()}`,
        filePath: result.path,
        fileName,
        content: result.content,
        isDirty: false,
        scrollPosition: 0,
      })
      if (viewMode === 'preview') {
        setViewMode('split')
      }
    }
  }, [addTab, viewMode, setViewMode])

  // Create a new scratchpad tab (Markdown or Mermaid)
  const handleNewTab = useCallback(
    (type: 'md' | 'mmd' = 'md') => {
      const tabNum = tabs.length + 1
      if (type === 'mmd') {
        addTab({
          id: `tab-${Date.now()}`,
          filePath: null,
          fileName: `Untitled-${tabNum}.mmd`,
          content: `graph TD
    A[Start] --> B{Process}
    B -->|Yes| C[Done]
    B -->|No| D[Retry]`,
          isDirty: false,
          scrollPosition: 0,
        })
      } else {
        addTab({
          id: `tab-${Date.now()}`,
          filePath: null,
          fileName: `Untitled-${tabNum}.md`,
          content: '# Untitled\n\nStart typing markdown or mermaid here...',
          isDirty: false,
          scrollPosition: 0,
        })
      }
      setViewMode('split')
    },
    [tabs.length, addTab, setViewMode]
  )

  // Handle submitted paste from dialog
  const handlePasteSubmit = useCallback(
    (content: string, title = 'Pasted Document') => {
      const isMmd = isRawMermaid(content)
      const ext = isMmd ? 'mmd' : 'md'
      addTab({
        id: `tab-${Date.now()}`,
        filePath: null,
        fileName: `${title}.${ext}`,
        content,
        isDirty: true,
        scrollPosition: 0,
      })
    },
    [addTab]
  )

  // Load sample fixtures
  const handleLoadKitchenSink = useCallback(() => {
    addTab({
      id: `tab-kitchen-sink-${Date.now()}`,
      filePath: null,
      fileName: 'kitchen-sink.md',
      content: kitchenSinkSample,
      isDirty: false,
      scrollPosition: 0,
    })
  }, [addTab])

  const handleLoadDiagrams = useCallback(() => {
    addTab({
      id: `tab-diagrams-${Date.now()}`,
      filePath: null,
      fileName: 'diagrams.md',
      content: diagramsSample,
      isDirty: false,
      scrollPosition: 0,
    })
  }, [addTab])

  const handleLoadLargeDoc = useCallback(() => {
    addTab({
      id: `tab-large-doc-${Date.now()}`,
      filePath: null,
      fileName: 'large-document.md',
      content: largeDocSample,
      isDirty: false,
      scrollPosition: 0,
    })
  }, [addTab])

  // Drag and drop handler (supports .md, .markdown, .mmd, .mermaid)
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]
        const text = await file.text()
        addTab({
          id: `tab-${Date.now()}`,
          filePath: file.name,
          fileName: file.name,
          content: text,
          isDirty: false,
          scrollPosition: 0,
        })
      }
    },
    [addTab]
  )

  // Open Export Dialog handler: defaults to the complete diagram element (for Mermaid) or complete document
  const handleOpenExportDialog = useCallback(() => {
    const isStandalone = isMermaidFile(activeTab?.fileName) || isRawMermaid(liveContent)
    const container = previewContainerRef.current

    if (isStandalone && container) {
      // In standalone Mermaid diagrams, default to the complete diagram element in the preview
      const diagramEl = (container.querySelector('.group.relative') ||
        container.querySelector('svg')?.closest('.group') ||
        container.querySelector('svg')) as HTMLElement
      setExportElementTarget(diagramEl || previewContentRef.current || container)
    } else {
      // In markdown documents, default to the complete document container
      setExportElementTarget(previewContentRef.current || container)
    }
    setExportDialogOpen(true)
  }, [activeTab?.fileName, liveContent])

  // Element export handler
  const handleExportElement = useCallback((element: HTMLElement) => {
    setExportElementTarget(element)
    setExportDialogOpen(true)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      if (e.key === 'Escape') {
        if (focusMode) toggleFocusMode()
        if (findOpen) setFindOpen(false)
        if (settingsOpen) setSettingsOpen(false)
        return
      }

      if (!isCmdOrCtrl) return

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (e.shiftKey) {
          handleSaveFileAs()
        } else {
          handleSaveFile()
        }
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        handleOpenFile()
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleNewTab()
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        if (activeTabId) {
          const active = getActiveTab()
          if (active?.isDirty) {
            const confirmClose = window.confirm(
              `"${active.fileName}" has unsaved changes. Do you want to close without saving?`
            )
            if (!confirmClose) return
          }
          removeTab(activeTabId)
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        toggleSidebar()
      } else if (e.key === '1') {
        e.preventDefault()
        setViewMode('preview')
      } else if (e.key === '2') {
        e.preventDefault()
        setViewMode('split')
      } else if (e.key === '3') {
        e.preventDefault()
        setViewMode('editor')
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        handleOpenExportDialog()
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.shiftKey) {
          e.preventDefault()
          toggleFocusMode()
        } else {
          e.preventDefault()
          setFindOpen(!findOpen)
        }
      } else if (e.key === ',') {
        e.preventDefault()
        setSettingsOpen(!settingsOpen)
      } else if ((e.key === 'v' || e.key === 'V') && tabs.length === 0) {
        e.preventDefault()
        setPasteDialogOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleOpenFile,
    handleNewTab,
    handleSaveFile,
    handleSaveFileAs,
    activeTabId,
    getActiveTab,
    removeTab,
    toggleSidebar,
    setViewMode,
    tabs.length,
    focusMode,
    toggleFocusMode,
    findOpen,
    setFindOpen,
    settingsOpen,
    setSettingsOpen,
  ])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-background text-foreground relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Title bar (hidden in Focus mode) */}
      {!focusMode && <Titlebar />}

      {/* Tabs and Toolbar (when not in Focus mode and at least one doc open) */}
      {!focusMode && tabs.length > 0 && (
        <TabBar
          onOpenPasteDialog={() => setPasteDialogOpen(true)}
          onNewTab={handleNewTab}
          onSave={handleSaveFile}
          onSaveAs={handleSaveFileAs}
          isDirty={activeTab?.isDirty}
          onOpenExportDialog={handleOpenExportDialog}
        />
      )}

      {/* Floating Exit Button for Focus Mode */}
      {focusMode && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleFocusMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            title="Exit Focus Mode (Esc or Cmd+Shift+F)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Focus</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {tabs.length === 0 ? (
          /* Empty / Welcome State */
          <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
            <div className="flex flex-col items-center gap-7 max-w-lg text-center">
              {/* App Logo */}
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                  <FileText className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md px-1">
                  <span className="text-white text-[9px] font-bold tracking-tight">md/mmd</span>
                </div>
              </div>

              {/* Welcome text */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Welcome to md/mmd Edit
                </h1>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-md">
                  Modern desktop editor and live renderer for Markdown (.md) and Mermaid (.mmd) diagrams.
                  Create, open, edit in real time, and export to PNG, SVG, PDF, and DOCX.
                </p>
              </div>

              {/* Primary Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <button
                  onClick={() => handleNewTab('md')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all hover:scale-[1.02]"
                  title="Create a new Markdown file (Cmd/Ctrl+N)"
                >
                  <Plus className="w-4 h-4" />
                  <span>New .md</span>
                </button>

                <button
                  onClick={() => handleNewTab('mmd')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:scale-[1.02]"
                  title="Create a new Mermaid diagram (.mmd)"
                >
                  <Network className="w-4 h-4" />
                  <span>New .mmd</span>
                </button>

                <button
                  onClick={handleOpenFile}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]"
                  title="Open Markdown (.md) or Mermaid (.mmd) file (Cmd/Ctrl+O)"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Open File</span>
                </button>

                <button
                  onClick={() => setPasteDialogOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border shadow-sm transition-all hover:scale-[1.02]"
                  title="Paste text or diagrams (Cmd/Ctrl+V)"
                >
                  <ClipboardPaste className="w-4 h-4 text-emerald-500" />
                  <span>Paste</span>
                </button>
              </div>

              {/* Secondary sample buttons */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <button
                  onClick={handleLoadKitchenSink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border/70 bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Kitchen Sink</span>
                </button>

                <button
                  onClick={handleLoadDiagrams}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border/70 bg-card hover:bg-muted text-xs font-medium transition-colors"
                >
                  <Network className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Diagrams</span>
                </button>

                <button
                  onClick={handleLoadLargeDoc}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border/70 bg-card hover:bg-muted text-xs font-medium transition-colors"
                  title="5,000+ line performance benchmark"
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                  <span>Stress Test</span>
                </button>
              </div>

              {/* Drag & drop target box */}
              <div className="w-full rounded-xl border-2 border-dashed border-border/70 py-6 px-4 text-muted-foreground/60 text-xs">
                Drag and drop a <span className="font-mono text-muted-foreground">.md</span> or{' '}
                <span className="font-mono text-muted-foreground">.mermaid</span> file here, or press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground">
                  Cmd/Ctrl+V
                </kbd>{' '}
                to paste
              </div>

              {/* Theme toggle & Settings button */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Theme:</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Preferences
                </button>
              </div>
            </div>
          </main>
        ) : (
          /* Active Document Workspace */
          <>
            {/* Sidebar with Table of Contents (hidden in focus mode) */}
            {!focusMode && <Sidebar content={liveContent} />}

            {/* Editor / Split / Preview View Workspace */}
            <main className="flex-1 flex overflow-hidden">
              {viewMode === 'preview' && (
                <div className="flex-1 h-full overflow-hidden relative group">
                  <div className="absolute top-3 right-5 z-20">
                    <button
                      onClick={() => setViewMode('split')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/90 hover:bg-background text-foreground border border-border shadow-md text-xs font-semibold backdrop-blur-xs transition-all hover:scale-105"
                      title="Switch to Split View (Cmd/Ctrl+2) to edit with WYSIWYG toolbar"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>Edit Document</span>
                    </button>
                  </div>
                  <Preview
                    content={liveContent}
                    fileName={activeTab?.fileName}
                    scrollRef={previewContainerRef}
                    contentRef={previewContentRef}
                    onExportElement={handleExportElement}
                  />
                </div>
              )}

              {viewMode === 'editor' && (
                <>
                  <div className="flex-1 h-full overflow-hidden">
                    <Editor
                      content={liveContent}
                      fileName={activeTab?.fileName}
                      onChange={handleEditorChange}
                    />
                  </div>
                  {/* Offscreen Preview for Editor-only mode to keep export target available */}
                  <div
                    className="absolute -left-[9999px] top-0 w-[1024px] h-screen overflow-hidden opacity-0 pointer-events-none"
                    aria-hidden="true"
                  >
                    <Preview
                      content={liveContent}
                      fileName={activeTab?.fileName}
                      scrollRef={previewContainerRef}
                      contentRef={previewContentRef}
                      onExportElement={handleExportElement}
                    />
                  </div>
                </>
              )}

              {viewMode === 'split' && (
                <div
                  ref={splitContainerRef}
                  className="flex-1 h-full flex overflow-hidden relative select-auto"
                >
                  <div
                    style={{ width: `${splitRatio * 100}%` }}
                    className="h-full overflow-hidden min-w-0"
                  >
                    <Editor
                      content={liveContent}
                      fileName={activeTab?.fileName}
                      onChange={handleEditorChange}
                      onScroll={(r) => setEditorScrollRatio(r)}
                      scrollRatio={previewScrollRatio}
                    />
                  </div>

                  <SplitResizer
                    splitRatio={splitRatio}
                    onSplitChange={setSplitRatio}
                    onReset={resetSplitRatio}
                    containerRef={splitContainerRef}
                  />

                  <div
                    style={{ width: `${(1 - splitRatio) * 100}%` }}
                    className="h-full overflow-hidden min-w-0"
                  >
                    <Preview
                      content={liveContent}
                      fileName={activeTab?.fileName}
                      scrollRef={previewContainerRef}
                      contentRef={previewContentRef}
                      onScroll={(r) => setPreviewScrollRatio(r)}
                      scrollRatio={editorScrollRatio}
                      onExportElement={handleExportElement}
                    />
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* Find Bar (Cmd/Ctrl+F) */}
      <FindBar
        isOpen={findOpen}
        onClose={() => setFindOpen(false)}
        containerRef={previewContainerRef}
      />

      {/* Paste Dialog modal */}
      <PasteDialog
        isOpen={pasteDialogOpen}
        onClose={() => setPasteDialogOpen(false)}
        onPasteSubmit={handlePasteSubmit}
      />

      {/* Command Palette (Cmd/Ctrl+K) */}
      <CommandPalette
        onOpenFile={handleOpenFile}
        onNewTab={handleNewTab}
        onSaveFile={handleSaveFile}
        onSaveFileAs={handleSaveFileAs}
        onOpenPasteDialog={() => setPasteDialogOpen(true)}
        onOpenExportDialog={handleOpenExportDialog}
        onLoadKitchenSink={handleLoadKitchenSink}
        onLoadDiagrams={handleLoadDiagrams}
      />

      {/* Settings Dialog (Cmd/Ctrl+,) */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => {
          setExportDialogOpen(false)
          setExportElementTarget(null)
        }}
        targetElement={exportElementTarget || previewContentRef.current || previewContainerRef.current}
        markdownContent={liveContent}
        documentTitle={
          exportElementTarget &&
          exportElementTarget !== previewContentRef.current &&
          exportElementTarget !== previewContainerRef.current
            ? 'Element-Export'
            : activeTab?.fileName.replace(/\.(md|mmd|markdown|mermaid|mdx)$/i, '') || 'Document'
        }
      />
    </div>
  )
}

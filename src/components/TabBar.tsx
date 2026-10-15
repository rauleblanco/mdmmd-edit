import {
  FileText,
  Network,
  X,
  Plus,
  ClipboardPaste,
  Eye,
  Columns2,
  Code2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Download,
  Maximize2,
  Save,
} from 'lucide-react'
import { useDocumentStore } from '@/stores/documentStore'
import { useAppStore, type ViewMode, type DocumentTheme } from '@/stores/appStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

interface TabBarProps {
  onOpenPasteDialog: () => void
  onNewTab: (type?: 'md' | 'mmd') => void
  onSave?: () => void
  onSaveAs?: () => void
  isDirty?: boolean
  onOpenExportDialog?: () => void
}

export function TabBar({
  onOpenPasteDialog,
  onNewTab,
  onSave,
  onSaveAs,
  isDirty,
  onOpenExportDialog,
}: TabBarProps): JSX.Element {
  const tabs = useDocumentStore((s) => s.tabs)
  const activeTabId = useDocumentStore((s) => s.activeTabId)
  const setActiveTab = useDocumentStore((s) => s.setActiveTab)
  const removeTab = useDocumentStore((s) => s.removeTab)

  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const documentTheme = useAppStore((s) => s.documentTheme)
  const setDocumentTheme = useAppStore((s) => s.setDocumentTheme)
  const zoom = useAppStore((s) => s.zoom)
  const zoomIn = useAppStore((s) => s.zoomIn)
  const zoomOut = useAppStore((s) => s.zoomOut)
  const zoomReset = useAppStore((s) => s.zoomReset)
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode)

  return (
    <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-3 h-10 select-none">
      {/* Left: Document Tabs + New / Paste buttons */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 mr-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isMmd = /\.(mmd|mermaid)$/i.test(tab.fileName)
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all max-w-[200px]',
                isActive
                  ? 'bg-background text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {isMmd ? (
                <Network className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
              )}
              <span className="truncate">{tab.fileName}</span>
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (tab.isDirty) {
                    const confirmClose = window.confirm(
                      `"${tab.fileName}" has unsaved changes. Do you want to close without saving?`
                    )
                    if (!confirmClose) return
                  }
                  removeTab(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}

        {/* New Tab Buttons (.md and .mmd) */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={() => onNewTab('md')}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="New Markdown Document (.md) — Cmd/Ctrl+N"
            aria-label="New Markdown Document"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">.md</span>
          </button>

          <button
            onClick={() => onNewTab('mmd')}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            title="New Mermaid Diagram (.mmd)"
            aria-label="New Mermaid Diagram"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">.mmd</span>
          </button>
        </div>

        {/* Quick Paste Button */}
        <button
          onClick={onOpenPasteDialog}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors ml-1"
          title="Paste Markdown or Mermaid"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Paste</span>
        </button>
      </div>

      {/* Right controls: View mode switcher, Document theme, Zoom */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Document Theme Switcher */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Palette className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          <select
            value={documentTheme}
            onChange={(e) => setDocumentTheme(e.target.value as DocumentTheme)}
            className="bg-transparent text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none border-0"
            title="Document Theme"
          >
            <option value="github">GitHub</option>
            <option value="academic">Academic</option>
            <option value="modern">Modern Minimal</option>
            <option value="dark-elegant">Dark Elegant</option>
          </select>
        </div>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg bg-muted/60 p-0.5 gap-0.5 border border-border/50">
          {(
            [
              { mode: 'split', icon: Columns2, label: 'Split (WYSIWYG)', shortcut: 'Cmd+2' },
              { mode: 'editor', icon: Code2, label: 'Editor', shortcut: 'Cmd+3' },
              { mode: 'preview', icon: Eye, label: 'Preview', shortcut: 'Cmd+1' },
            ] as const
          ).map(({ mode, icon: Icon, label, shortcut }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-2 py-1 rounded-md transition-all text-xs flex items-center gap-1.5 font-medium',
                viewMode === mode
                  ? 'bg-background text-foreground font-semibold shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
              title={`${label} (${shortcut})`}
            >
              <Icon className={cn('w-3.5 h-3.5', viewMode === mode ? 'text-primary' : 'text-muted-foreground')} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={zoomOut}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomReset}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Focus Mode Button */}
        <button
          onClick={toggleFocusMode}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Focus / Reading Mode (Cmd+Shift+F)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Save Document Button */}
        {onSave && (
          <>
            <div className="w-px h-4 bg-border/60 mx-1" />
            <button
              onClick={onSave}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-sm',
                isDirty
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 font-semibold'
                  : 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20'
              )}
              title="Save Document to Disk (Cmd/Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
              {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            </button>
          </>
        )}

        {/* Export Document Button */}
        {onOpenExportDialog && (
          <>
            <div className="w-px h-4 bg-border/60 mx-1" />
            <button
              onClick={onOpenExportDialog}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-colors"
              title="Export Document (Cmd/Ctrl+E)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </>
        )}

        {/* Light / Dark Mode Theme Switcher (Same toolbar next to Export) */}
        <div className="w-px h-4 bg-border/60 mx-1" />
        <ThemeToggle />
      </div>
    </div>
  )
}

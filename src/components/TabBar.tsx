import {
  Eye,
  Columns2,
  Code2,
  ZoomIn,
  ZoomOut,
  Palette,
  Download,
  Maximize2,
  Save,
} from 'lucide-react'
import { useAppStore, type DocumentTheme } from '@/stores/appStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

interface TabBarProps {
  onSave?: () => void
  onSaveAs?: () => void
  isDirty?: boolean
  onOpenExportDialog?: () => void
}

export function TabBar({
  onSave,
  isDirty,
  onOpenExportDialog,
}: TabBarProps): JSX.Element {
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
    <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3 h-9 select-none shrink-0">
      {/* Left controls: Document theme, Save, Export, Focus, Zoom */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Document Theme Switcher */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Palette className="w-3.5 h-3.5 text-muted-foreground mr-0.5 shrink-0" />
          <select
            value={documentTheme}
            onChange={(e) => setDocumentTheme(e.target.value as DocumentTheme)}
            className="bg-transparent text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none border-0 py-0.5"
            title="Document Typography Theme"
          >
            <option value="github">GitHub</option>
            <option value="academic">Academic</option>
            <option value="modern">Modern Minimal</option>
            <option value="dark-elegant">Dark Elegant</option>
          </select>
        </div>

        <div className="w-px h-3.5 bg-border/60 mx-0.5 shrink-0" />

        {/* Save Document Button */}
        {onSave && (
          <button
            onClick={onSave}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shadow-2xs shrink-0',
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
        )}

        {/* Export Document Button */}
        {onOpenExportDialog && (
          <button
            onClick={onOpenExportDialog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 transition-colors shrink-0"
            title="Export Document (Cmd/Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}

        <div className="w-px h-3.5 bg-border/60 mx-0.5 shrink-0 hidden sm:block" />

        {/* Focus Mode Button */}
        <button
          onClick={toggleFocusMode}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 hidden sm:inline-flex"
          title="Focus / Reading Mode (Cmd+Shift+F)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 shrink-0 hidden md:flex">
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
      </div>

      {/* Right controls: View mode switcher and Dark/Light ThemeToggle */}
      <div className="flex items-center gap-2 shrink-0">
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
                'px-2 py-0.5 rounded-md transition-all text-xs flex items-center gap-1.5 font-medium',
                viewMode === mode
                  ? 'bg-background text-foreground font-semibold shadow-2xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
              title={`${label} (${shortcut})`}
            >
              <Icon
                className={cn(
                  'w-3.5 h-3.5',
                  viewMode === mode ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-3.5 bg-border/60 mx-0.5 shrink-0" />

        {/* Light / Dark Mode Theme Switcher */}
        <ThemeToggle />
      </div>
    </div>
  )
}

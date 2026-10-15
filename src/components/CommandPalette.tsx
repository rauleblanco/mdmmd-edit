import { useEffect } from 'react'
import { Command } from 'cmdk'
import {
  FileText,
  FolderOpen,
  Plus,
  ClipboardPaste,
  Eye,
  Columns2,
  Code2,
  Sun,
  Moon,
  Monitor,
  Palette,
  Download,
  Copy,
  Save,
  Sparkles,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sidebar as SidebarIcon,
} from 'lucide-react'
import { useAppStore, type ViewMode, type DocumentTheme, type Theme } from '@/stores/appStore'
import { useDocumentStore } from '@/stores/documentStore'

interface CommandPaletteProps {
  onOpenFile: () => void
  onNewTab: (type?: 'md' | 'mmd') => void
  onSaveFile?: () => void
  onSaveFileAs?: () => void
  onOpenPasteDialog: () => void
  onOpenExportDialog: () => void
  onLoadKitchenSink: () => void
  onLoadDiagrams: () => void
}

export function CommandPalette({
  onOpenFile,
  onNewTab,
  onSaveFile,
  onSaveFileAs,
  onOpenPasteDialog,
  onOpenExportDialog,
  onLoadKitchenSink,
  onLoadDiagrams,
}: CommandPaletteProps): JSX.Element | null {
  const open = useAppStore((s) => s.commandPaletteOpen)
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const setTheme = useAppStore((s) => s.setTheme)
  const setDocumentTheme = useAppStore((s) => s.setDocumentTheme)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const zoomIn = useAppStore((s) => s.zoomIn)
  const zoomOut = useAppStore((s) => s.zoomOut)
  const zoomReset = useAppStore((s) => s.zoomReset)

  const activeTab = useDocumentStore((s) => s.getActiveTab())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  if (!open) return null

  const runAction = (action: () => void) => {
    action()
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col bg-transparent font-sans">
          <div className="flex items-center border-b border-border/60 px-4">
            <Command.Input
              placeholder="Type a command or search..."
              className="w-full bg-transparent py-3.5 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin text-xs text-foreground">
            <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Document Actions */}
            <Command.Group heading="Document" className="px-2 py-1.5 font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(onOpenFile)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <FolderOpen className="w-4 h-4 text-primary" />
                <span>Open File...</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+O</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onNewTab('md'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>New Markdown Document (.md)</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+N</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onNewTab('mmd'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Network className="w-4 h-4 text-emerald-500" />
                <span>New Mermaid Diagram (.mmd)</span>
              </Command.Item>

              {activeTab && onSaveFile && (
                <Command.Item
                  onSelect={() => runAction(onSaveFile)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
                >
                  <Save className="w-4 h-4 text-emerald-500" />
                  <span>Save File</span>
                  <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+S</kbd>
                </Command.Item>
              )}

              {activeTab && onSaveFileAs && (
                <Command.Item
                  onSelect={() => runAction(onSaveFileAs)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
                >
                  <Save className="w-4 h-4 text-emerald-500" />
                  <span>Save File As...</span>
                  <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+Shift+S</kbd>
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => runAction(onOpenPasteDialog)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <ClipboardPaste className="w-4 h-4 text-emerald-500" />
                <span>Paste Markdown or Mermaid...</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+V</kbd>
              </Command.Item>

              {activeTab && (
                <Command.Item
                  onSelect={() => runAction(onOpenExportDialog)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Export Document...</span>
                  <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+E</kbd>
                </Command.Item>
              )}
            </Command.Group>

            {/* View Mode Actions */}
            <Command.Group heading="View Mode" className="px-2 py-1.5 font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(() => setViewMode('preview'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>Preview Only</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+1</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => setViewMode('split'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Columns2 className="w-4 h-4 text-muted-foreground" />
                <span>Split View (Editor + Preview)</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+2</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => setViewMode('editor'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Code2 className="w-4 h-4 text-muted-foreground" />
                <span>Editor Only</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+3</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(toggleSidebar)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <SidebarIcon className="w-4 h-4 text-muted-foreground" />
                <span>Toggle Outline Sidebar</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+B</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => useAppStore.getState().toggleFocusMode())}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Eye className="w-4 h-4 text-primary" />
                <span>Toggle Focus / Reading Mode</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+Shift+F</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => useAppStore.getState().setFindOpen(true))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span>Find in Document...</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+F</kbd>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => useAppStore.getState().setSettingsOpen(true))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Palette className="w-4 h-4 text-primary" />
                <span>Preferences & Settings...</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+,</kbd>
              </Command.Item>
            </Command.Group>

            {/* Zoom Controls */}
            <Command.Group heading="Zoom" className="px-2 py-1.5 font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(zoomIn)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
                <span>Zoom In (+10%)</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd++</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(zoomOut)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <ZoomOut className="w-4 h-4 text-muted-foreground" />
                <span>Zoom Out (-10%)</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+-</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(zoomReset)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                <span>Reset Zoom (100%)</span>
                <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Cmd+0</kbd>
              </Command.Item>
            </Command.Group>

            {/* Document Themes */}
            <Command.Group heading="Document Themes" className="px-2 py-1.5 font-semibold text-muted-foreground">
              {(
                [
                  { id: 'github', label: 'GitHub Theme' },
                  { id: 'academic', label: 'Academic / Serif Theme' },
                  { id: 'modern', label: 'Modern Minimal Theme' },
                  { id: 'dark-elegant', label: 'Dark Elegant Theme' },
                ] as const
              ).map(({ id, label }) => (
                <Command.Item
                  key={id}
                  onSelect={() => runAction(() => setDocumentTheme(id))}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
                >
                  <Palette className="w-4 h-4 text-primary" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* App Themes */}
            <Command.Group heading="Appearance" className="px-2 py-1.5 font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(() => setTheme('light'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Theme</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => setTheme('dark'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Dark Theme</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => setTheme('system'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Monitor className="w-4 h-4 text-muted-foreground" />
                <span>System Preference</span>
              </Command.Item>
            </Command.Group>

            {/* Sample Documents */}
            <Command.Group heading="Sample Documents" className="px-2 py-1.5 font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(onLoadKitchenSink)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Open Kitchen Sink Showcase</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(onLoadDiagrams)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors text-foreground"
              >
                <Network className="w-4 h-4 text-emerald-500" />
                <span>Open Diagrams Showcase</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

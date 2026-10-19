import { useRef, useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Network,
  Plus,
  ClipboardPaste,
  X,
  Minus,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useDocumentStore } from '@/stores/documentStore'
import { cn } from '@/lib/utils'
import { getPlatform } from '@/lib/utils/platform'

interface TitlebarProps {
  onOpenPasteDialog: () => void
  onNewTab: (type?: 'md' | 'mmd') => void
}

export function Titlebar({ onOpenPasteDialog, onNewTab }: TitlebarProps): JSX.Element {
  const platform = getPlatform()
  const isMac = platform === 'darwin'
  const isWindows = platform === 'win32'

  const tabs = useDocumentStore((s) => s.tabs)
  const activeTabId = useDocumentStore((s) => s.activeTabId)
  const setActiveTab = useDocumentStore((s) => s.setActiveTab)
  const removeTab = useDocumentStore((s) => s.removeTab)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll overflow to toggle chevron scroll buttons
  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth
    setCanScrollLeft(hasOverflow && el.scrollLeft > 4)
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    const resizeObserver = new ResizeObserver(() => checkScroll())
    resizeObserver.observe(el)
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      resizeObserver.disconnect()
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, tabs.length])

  // Scroll active tab into view when activeTabId changes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const activeEl = el.querySelector('[data-active-tab="true"]') as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
    checkScroll()
  }, [activeTabId, checkScroll])

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  // Handle horizontal mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY) {
      e.currentTarget.scrollLeft += e.deltaY
      checkScroll()
    }
  }

  return (
    <div
      className={cn(
        'titlebar-drag flex items-center shrink-0 select-none',
        'h-[var(--titlebar-height)] bg-background/90 backdrop-blur-xl',
        'border-b border-border/70 relative z-30',
        // Traffic lights padding on macOS; overlay caption controls padding on Windows
        isMac ? 'pl-[78px] pr-3' : isWindows ? 'pl-3 pr-[140px]' : 'pl-3 pr-2'
      )}
    >
      {/* App brand/logo in title bar */}
      <div className="titlebar-drag flex items-center gap-1.5 shrink-0 mr-2 select-none">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-2xs">
          <FileText className="w-3 h-3" />
        </div>
        <span className="text-xs font-bold tracking-tight text-foreground/80 hidden sm:inline">
          md/mmd
        </span>
      </div>

      <div className="w-px h-4 bg-border/60 mr-2 shrink-0 hidden sm:block" />

      {/* Tabs scroll left button (visible when scrolled right) */}
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-180)}
          className="titlebar-no-drag p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-0.5 shrink-0"
          title="Scroll tabs left"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Scrollable Tab Strip containing document tabs, +.md, +.mmd, and Paste */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 h-full min-w-0 select-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isMmd = /\.(mmd|mermaid)$/i.test(tab.fileName)
          return (
            <div
              key={tab.id}
              data-active-tab={isActive ? 'true' : 'false'}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'titlebar-no-drag group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all shrink-0 max-w-[190px] min-w-[100px] h-[30px]',
                isActive
                  ? 'bg-background text-foreground shadow-2xs border border-border/80 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
              title={tab.filePath || tab.fileName}
            >
              {isMmd ? (
                <Network className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
              )}
              <span className="truncate flex-1 text-[11.5px]">{tab.fileName}</span>
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
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
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 ml-0.5"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}

        {/* New Tab Buttons (.md and .mmd) and Quick Paste Button */}
        <div className="titlebar-no-drag flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={() => onNewTab('md')}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors h-[28px]"
            title="New Markdown Document (.md) — Cmd/Ctrl+N"
            aria-label="New Markdown Document"
          >
            <Plus className="w-3 h-3" />
            <span className="font-mono text-[11px]">.md</span>
          </button>

          <button
            onClick={() => onNewTab('mmd')}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors h-[28px]"
            title="New Mermaid Diagram (.mmd)"
            aria-label="New Mermaid Diagram"
          >
            <Plus className="w-3 h-3" />
            <span className="font-mono text-[11px]">.mmd</span>
          </button>

          <button
            onClick={onOpenPasteDialog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors h-[28px]"
            title="Paste Markdown or Mermaid (Cmd/Ctrl+V)"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span className="text-[11px] font-semibold">Paste</span>
          </button>
        </div>
      </div>

      {/* Tabs scroll right button (visible when tabs overflow to right) */}
      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(180)}
          className="titlebar-no-drag p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5 shrink-0"
          title="Scroll tabs right"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Draggable empty region so user can grab the window anywhere */}
      <div className="titlebar-drag flex-1 h-full min-w-[20px]" />

      {/* Non-overlay fallback window controls (Linux / non-Win32 fallback) */}
      {!isMac && !isWindows && (
        <div className="titlebar-no-drag flex items-center h-full ml-auto">
          <button
            onClick={() => window.markview?.window.minimize()}
            className="h-full px-3.5 hover:bg-muted/80 transition-colors inline-flex items-center justify-center"
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4 text-foreground/70" />
          </button>
          <button
            onClick={() => window.markview?.window.maximize()}
            className="h-full px-3.5 hover:bg-muted/80 transition-colors inline-flex items-center justify-center"
            aria-label="Maximize"
          >
            <Square className="w-3.5 h-3.5 text-foreground/70" />
          </button>
          <button
            onClick={() => window.markview?.window.close()}
            className="h-full px-3.5 hover:bg-red-500/90 hover:text-white transition-colors inline-flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

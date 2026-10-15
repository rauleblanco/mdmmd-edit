import { ListTree, ChevronLeft, ChevronRight, Hash, Network } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { extractToc, type TocItem } from '@/lib/markdown/pipeline'
import { isRawMermaid } from '@/lib/mermaid/renderer'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  content: string
}

export function Sidebar({ content }: SidebarProps): JSX.Element {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const isMermaid = useMemo(() => isRawMermaid(content), [content])

  const toc = useMemo<TocItem[]>(() => {
    return extractToc(content)
  }, [content])

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col border-r border-border/70 bg-card/20 p-2">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Open outline sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-border/70 bg-card/20 select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <ListTree className="w-4 h-4 text-primary" />
          <span>{isMermaid ? 'Diagram' : `Outline (${toc.length})`}</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* TOC Items List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {toc.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground px-4">
            {isMermaid ? (
              <div className="flex flex-col items-center gap-2 text-emerald-500/80">
                <Network className="w-7 h-7 text-emerald-500" />
                <span className="text-foreground text-xs font-semibold">Mermaid Diagram</span>
                <span className="text-[11px] text-muted-foreground">Interactive vector render</span>
              </div>
            ) : (
              'No headings in document'
            )}
          </div>
        ) : (
          <nav className="flex flex-col gap-0.5">
            {toc.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => scrollToHeading(item.id)}
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                className={cn(
                  'flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-left text-xs font-medium transition-colors truncate',
                  item.level === 1
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                title={item.text}
              >
                <Hash className="w-3 h-3 shrink-0 opacity-40" />
                <span className="truncate">{item.text}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}

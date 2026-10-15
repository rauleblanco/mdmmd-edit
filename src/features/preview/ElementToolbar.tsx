import { useState } from 'react'
import { Copy, Check, Download, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ElementToolbarProps {
  onCopy?: () => Promise<void> | void
  onExport?: () => void
  onZoom?: () => void
  label?: string
  className?: string
}

export function ElementToolbar({
  onCopy,
  onExport,
  onZoom,
  label,
  className,
}: ElementToolbarProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCopy) {
      await onCopy()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation()
    onExport?.()
  }

  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation()
    onZoom?.()
  }

  return (
    <div
      data-element-toolbar="true"
      className={cn(
        'absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg border border-border/60',
        'bg-background/90 backdrop-blur-md p-1 shadow-md opacity-0 transition-opacity duration-200',
        'group-hover:opacity-100 focus-within:opacity-100',
        className
      )}
    >
      {label && (
        <span className="px-1.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}

      {onZoom && (
        <button
          onClick={handleZoom}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom diagram"
          aria-label="Zoom diagram"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}

      {onCopy && (
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={copied ? 'Copied!' : 'Copy'}
          aria-label="Copy element"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {onExport && (
        <button
          onClick={handleExport}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Export element"
          aria-label="Export element"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

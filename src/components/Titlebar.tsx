import { Minus, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPlatform } from '@/lib/utils/platform'

/**
 * Custom title bar for the app.
 * - macOS: invisible (native hiddenInset handles it), just provides drag region + padding
 * - Windows: custom minimize/maximize/close buttons with titleBarOverlay
 */
export function Titlebar(): JSX.Element {
  const platform = getPlatform()
  const isMac = platform === 'darwin'

  return (
    <div
      className={cn(
        'titlebar-drag flex items-center shrink-0 select-none',
        'h-[var(--titlebar-height)] bg-background/80 backdrop-blur-xl',
        'border-b border-border/50',
        // On macOS, pad left for traffic lights
        isMac ? 'pl-[78px]' : 'pl-4'
      )}
    >
      {/* App title / breadcrumb area */}
      <div className="flex-1 flex items-center gap-2 px-2">
        <span className="text-sm font-semibold text-foreground/80 tracking-tight">md/mmd Edit</span>
      </div>

      {/* Windows-only: window control buttons (fallback for non-overlay systems) */}
      {!isMac && (
        <div className="titlebar-no-drag flex items-center h-full">
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

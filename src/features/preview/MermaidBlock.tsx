import { useState, useEffect, useRef } from 'react'
import { renderMermaidDiagram, type MermaidRenderResult } from '@/lib/mermaid/renderer'
import { useAppStore } from '@/stores/appStore'
import { DiagramLightbox } from './DiagramLightbox'
import { ElementToolbar } from './ElementToolbar'
import { AlertCircle } from 'lucide-react'

interface MermaidBlockProps {
  code: string
  className?: string
  onExport?: (element: HTMLElement) => void
}

export function MermaidBlock({ code, className, onExport }: MermaidBlockProps): JSX.Element {
  const [result, setResult] = useState<MermaidRenderResult>({ svg: null, error: null })
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resolvedTheme = useAppStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  // Lazy render when scrolled into view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Render diagram once visible or when theme changes
  useEffect(() => {
    if (!isVisible) return

    let isMounted = true
    setLoading(true)

    renderMermaidDiagram(code, isDark).then((res) => {
      if (isMounted) {
        setResult(res)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [code, isDark, isVisible])

  const handleCopySvg = async () => {
    if (result.svg) {
      await navigator.clipboard.writeText(result.svg)
    }
  }

  const handleExport = () => {
    if (containerRef.current && onExport) {
      onExport(containerRef.current)
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="group relative my-6 flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card/40 p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
        onClick={() => {
          if (result.svg) setLightboxOpen(true)
        }}
      >
        <ElementToolbar
          label="Mermaid"
          onCopy={result.svg ? handleCopySvg : undefined}
          onExport={result.svg ? handleExport : undefined}
          onZoom={result.svg ? () => setLightboxOpen(true) : undefined}
        />

        {loading ? (
          <div className="flex items-center gap-3 py-10 text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-mono">Rendering diagram...</span>
          </div>
        ) : result.error ? (
          <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-left">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Mermaid Syntax Error</span>
              {result.errorLine && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-red-500/20 font-mono">
                  Line {result.errorLine}
                </span>
              )}
            </div>
            <pre className="mt-2 text-xs font-mono text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">
              {result.error}
            </pre>
          </div>
        ) : result.svg ? (
          <div
            className="w-full flex items-center justify-center overflow-x-auto p-2"
            dangerouslySetInnerHTML={{ __html: result.svg }}
          />
        ) : null}
      </div>

      {result.svg && (
        <DiagramLightbox
          svgContent={result.svg}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

import { useState, useEffect, useRef } from 'react'
import { highlightCode } from '@/lib/markdown/shiki'
import { useAppStore } from '@/stores/appStore'
import { ElementToolbar } from './ElementToolbar'
import { Hash } from 'lucide-react'

interface CodeBlockProps {
  code: string
  lang?: string
  title?: string
  onExport?: (element: HTMLElement) => void
}

export function CodeBlock({ code, lang = 'text', title, onExport }: CodeBlockProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const resolvedTheme = useAppStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    let isMounted = true
    highlightCode(code, lang, isDark).then((html) => {
      if (isMounted) {
        setHighlightedHtml(html)
      }
    })
    return () => {
      isMounted = false
    }
  }, [code, lang, isDark])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
  }

  const lines = code.trimEnd().split('\n')

  return (
    <div
      ref={containerRef}
      className="group relative my-5 overflow-hidden rounded-xl border border-border/70 bg-card/60 shadow-sm transition-all hover:border-border"
    >
      {/* Code Header Bar (if title or language present) */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-2 select-none text-xs">
        <div className="flex items-center gap-2">
          {title ? (
            <span className="font-medium text-foreground">{title}</span>
          ) : (
            <span className="font-mono text-muted-foreground uppercase">{lang || 'text'}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLineNumbers((v) => !v)}
            className={`p-1 rounded text-xs transition-colors ${
              showLineNumbers ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Toggle line numbers"
            aria-label="Toggle line numbers"
          >
            <Hash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ElementToolbar
        onCopy={handleCopy}
        onExport={onExport ? () => onExport(containerRef.current || document.body) : undefined}
        className="top-10"
      />

      {/* Code body with optional line numbers */}
      <div className="relative flex overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        {showLineNumbers && (
          <div className="mr-4 select-none text-right font-mono text-xs text-muted-foreground/40 leading-relaxed pr-3 border-r border-border/40">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-x-auto">
          {highlightedHtml ? (
            <div
              className="[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!font-mono text-sm"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre className="!bg-transparent !m-0 !p-0">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

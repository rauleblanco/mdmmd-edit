import { useEffect, useState, useRef, useMemo } from 'react'
import { processMarkdown, type ProcessedDocument } from '@/lib/markdown/pipeline'
import { isRawMermaid, isMermaidFile, renderMermaidDiagram, stripMermaidFences } from '@/lib/mermaid/renderer'
import { MermaidBlock } from './MermaidBlock'
import { FrontMatterCard } from './FrontMatterCard'
import { DiagramLightbox } from './DiagramLightbox'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

interface PreviewProps {
  content: string
  fileName?: string
  className?: string
  scrollRef?: React.RefObject<HTMLDivElement>
  contentRef?: React.RefObject<HTMLDivElement>
  onScroll?: (ratio: number) => void
  scrollRatio?: number
  onExportElement?: (el: HTMLElement) => void
}

export function Preview({
  content,
  fileName,
  className,
  scrollRef,
  contentRef,
  onScroll,
  scrollRatio,
  onExportElement,
}: PreviewProps): JSX.Element {
  const [doc, setDoc] = useState<ProcessedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeLightboxSvg, setActiveLightboxSvg] = useState<string | null>(null)
  const internalRef = useRef<HTMLDivElement>(null)
  const internalContentRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)
  const effectiveRef = scrollRef || internalRef
  const effectiveContentRef = contentRef || internalContentRef

  const zoom = useAppStore((s) => s.zoom)
  const documentTheme = useAppStore((s) => s.documentTheme)
  const resolvedTheme = useAppStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)

  const isStandaloneMermaid = useMemo(() => {
    return isMermaidFile(fileName) || isRawMermaid(content)
  }, [content, fileName])

  // Markdown processing pipeline
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    if (isStandaloneMermaid) {
      setDoc({
        html: '',
        frontmatter: null,
        toc: [],
        rawContent: content,
      })
      setLoading(false)
      return
    }

    processMarkdown(content)
      .then((processed) => {
        if (isMounted) {
          setDoc(processed)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Markdown processing failed:', err)
        if (isMounted) {
          setDoc({
            html: `<p class="text-red-500">Error processing markdown: ${String(err)}</p>`,
            frontmatter: null,
            toc: [],
            rawContent: content,
          })
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [content, isStandaloneMermaid])

  // Post-process rendered DOM to render Mermaid diagrams and interactive element toolbars
  useEffect(() => {
    const root = effectiveRef.current
    if (!root || !doc?.html) return

    // 1. Process fenced mermaid blocks (<pre><code class="language-mermaid">)
    const mermaidCodes = root.querySelectorAll('pre > code.language-mermaid')
    mermaidCodes.forEach((codeEl) => {
      const pre = codeEl.parentElement
      if (!pre) return

      const mermaidCode = stripMermaidFences(codeEl.textContent || '')
      const wrapper = document.createElement('div')
      wrapper.className = 'group relative my-6 flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card/40 p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer'

      pre.replaceWith(wrapper)

      renderMermaidDiagram(mermaidCode, isDark).then((res) => {
        if (res.svg) {
          wrapper.innerHTML = `
            <div data-element-toolbar="true" class="no-export no-print absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 backdrop-blur-md p-1 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span class="px-1.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Mermaid</span>
              <button class="mermak-copy-btn p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy SVG">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button class="mermak-export-btn p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Export Diagram">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              </button>
            </div>
            <div class="w-full flex items-center justify-center overflow-x-auto p-2">
              ${res.svg}
            </div>
          `

          const copyBtn = wrapper.querySelector('.mermak-copy-btn')
          copyBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            if (res.svg) navigator.clipboard.writeText(res.svg)
          })

          const exportBtn = wrapper.querySelector('.mermak-export-btn')
          exportBtn?.addEventListener('click', (e) => {
            e.stopPropagation()
            onExportElement?.(wrapper)
          })

          wrapper.addEventListener('click', () => {
            if (res.svg) setActiveLightboxSvg(res.svg)
          })
        } else if (res.error) {
          wrapper.className = 'w-full my-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-left'
          wrapper.innerHTML = `
            <div class="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
              <span>Mermaid Syntax Error</span>
              ${res.errorLine ? `<span class="ml-auto text-xs px-2 py-0.5 rounded bg-red-500/20 font-mono">Line ${res.errorLine}</span>` : ''}
            </div>
            <pre class="mt-2 text-xs font-mono text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">${res.error}</pre>
          `
        }
      })
    })

    // 2. Add copy and export buttons to other code blocks
    const codePres = root.querySelectorAll('pre:not([data-toolbar="true"])')
    codePres.forEach((pre) => {
      pre.setAttribute('data-toolbar', 'true')
      pre.classList.add('group', 'relative')
      const btnGroup = document.createElement('div')
      btnGroup.setAttribute('data-element-toolbar', 'true')
      btnGroup.className = 'no-export no-print absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 backdrop-blur-md p-1 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100'
      btnGroup.innerHTML = `
        <button class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy code">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
        <button class="mermak-export-code p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Export as Image">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </button>
      `
      const copyBtn = btnGroup.querySelector('button')
      copyBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        const text = pre.querySelector('code')?.textContent || pre.textContent || ''
        navigator.clipboard.writeText(text)
      })

      const exportBtn = btnGroup.querySelector('.mermak-export-code')
      exportBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        onExportElement?.(pre as HTMLElement)
      })

      pre.appendChild(btnGroup)
    })

    // 3. Add export capability to tables
    const tables = root.querySelectorAll('table:not([data-exportable="true"])')
    tables.forEach((tbl) => {
      tbl.setAttribute('data-exportable', 'true')
      const wrapper = document.createElement('div')
      wrapper.className = 'group relative my-4 overflow-x-auto rounded-lg border border-border/60'
      tbl.parentNode?.insertBefore(wrapper, tbl)
      wrapper.appendChild(tbl)

      const tblToolbar = document.createElement('div')
      tblToolbar.setAttribute('data-element-toolbar', 'true')
      tblToolbar.className = 'no-export no-print absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 backdrop-blur-md p-1 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100'
      tblToolbar.innerHTML = `
        <button class="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Export Table as Image">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </button>
      `
      tblToolbar.querySelector('button')?.addEventListener('click', (e) => {
        e.stopPropagation()
        onExportElement?.(wrapper)
      })
      wrapper.appendChild(tblToolbar)
    })
  }, [doc?.html, isDark, onExportElement])

  // Synchronized scrolling listener
  useEffect(() => {
    const el = effectiveRef.current
    if (!el) return

    const handleScroll = () => {
      if (isSyncingRef.current) return
      const max = el.scrollHeight - el.clientHeight
      if (max > 0 && onScroll) {
        onScroll(el.scrollTop / max)
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [onScroll, effectiveRef])

  // React to incoming scroll ratio from editor
  useEffect(() => {
    if (scrollRatio === undefined) return
    const el = effectiveRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) {
      isSyncingRef.current = true
      el.scrollTop = scrollRatio * max
      setTimeout(() => {
        isSyncingRef.current = false
      }, 60)
    }
  }, [scrollRatio, effectiveRef])

  return (
    <>
      <div
        ref={effectiveRef}
        onDoubleClick={() => {
          if (viewMode === 'preview') {
            setViewMode('split')
          }
        }}
        className={cn(
          'relative h-full w-full overflow-y-auto overflow-x-auto px-8 sm:px-10 lg:px-12 py-10 scrollbar-thin select-text min-w-0',
          `doc-theme-${documentTheme}`,
          className
        )}
      >
        <div
          ref={effectiveContentRef}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: zoom > 1 ? 'top left' : 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="mx-auto max-w-4xl preview-content-container min-w-0"
        >
          {/* Render Front Matter if present */}
          {doc?.frontmatter && <FrontMatterCard data={doc.frontmatter} />}

          {/* If standalone raw Mermaid or .mmd file */}
          {isStandaloneMermaid ? (
            <div className="py-4">
              {content.trim() ? (
                <MermaidBlock
                  code={content}
                  onExport={(el) => onExportElement?.(el)}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center text-muted-foreground flex flex-col items-center gap-3 bg-card/20">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm tracking-wider">
                    MMD
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">Empty Mermaid Diagram</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Type your Mermaid flowchart, sequence diagram, or mindmap in the editor to see it render live.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Render full processed markdown body */
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: doc?.html || '' }}
            />
          )}
        </div>
      </div>

      {/* Lightbox for clicked diagrams */}
      {activeLightboxSvg && (
        <DiagramLightbox
          svgContent={activeLightboxSvg}
          isOpen={true}
          onClose={() => setActiveLightboxSvg(null)}
        />
      )}
    </>
  )
}

import { useState, useEffect, useRef } from 'react'
import {
  Network,
  X,
  Play,
  Copy,
  Check,
  Code2,
  Eye,
  AlertCircle,
  Sparkles,
  GitBranch,
  Kanban,
  BrainCircuit,
  Calendar,
  PieChart,
  Boxes,
} from 'lucide-react'
import { MERMAID_TEMPLATES, type MermaidTemplate } from './mermaidTemplates'
import { renderMermaidDiagram } from '@/lib/mermaid/renderer'
import { useAppStore } from '@/stores/appStore'

interface MermaidInsertDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (mermaidCode: string) => void
}

export function MermaidInsertDialog({
  isOpen,
  onClose,
  onInsert,
}: MermaidInsertDialogProps): JSX.Element | null {
  const [selectedTemplate, setSelectedTemplate] = useState<MermaidTemplate>(MERMAID_TEMPLATES[0])
  const [code, setCode] = useState<string>(MERMAID_TEMPLATES[0].code)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'both' | 'code' | 'preview'>('both')

  const resolvedTheme = useAppStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Render diagram when code or theme changes
  useEffect(() => {
    if (!isOpen) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!code.trim()) {
        setSvg(null)
        setError('Diagram code is empty.')
        return
      }

      const result = await renderMermaidDiagram(code, isDark)
      if (result.svg) {
        setSvg(result.svg)
        setError(null)
      } else {
        setSvg(null)
        setError(result.error || 'Failed to parse Mermaid diagram syntax.')
      }
    }, 180)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [code, isDark, isOpen])

  if (!isOpen) return null

  const handleSelectTemplate = (tmpl: MermaidTemplate) => {
    setSelectedTemplate(tmpl)
    setCode(tmpl.code)
  }

  const handleInsert = () => {
    if (!code.trim()) return
    onInsert(code.trim())
    onClose()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`\`\`\`mermaid\n${code.trim()}\n\`\`\``)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'flowchart-td':
      case 'flowchart-lr':
        return Network
      case 'sequence':
        return Boxes
      case 'git-graph':
        return GitBranch
      case 'mindmap':
        return BrainCircuit
      case 'kanban':
        return Kanban
      case 'gantt':
        return Calendar
      case 'pie-chart':
        return PieChart
      default:
        return Sparkles
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Mermaid Diagram Visual Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  WYSIWYG
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Select a diagram type, tweak the live syntax, and insert rendered vector graphics into your markdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle for Modal */}
            <div className="hidden sm:flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'both'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'code'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Code Only
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Preview Only
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Templates Sidebar + Live Editor + Live Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Templates Column */}
          <div className="w-64 border-r border-border/70 flex flex-col bg-muted/15 shrink-0 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Diagram Templates
            </span>
            {MERMAID_TEMPLATES.map((tmpl) => {
              const Icon = getTemplateIcon(tmpl.id)
              const isSelected = selectedTemplate.id === tmpl.id
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20 shadow-xs'
                      : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{tmpl.title}</div>
                    <div className="text-[10px] text-muted-foreground/75 truncate">{tmpl.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Interactive Live Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Live Code Editor Pane */}
            {(activeTab === 'both' || activeTab === 'code') && (
              <div
                className={`flex flex-col border-r border-border/60 ${
                  activeTab === 'both' ? 'w-1/2' : 'w-full'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/10 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Mermaid Definition:</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy snippet"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-4 font-mono text-xs leading-relaxed bg-background resize-none focus:outline-none scrollbar-thin text-foreground"
                  placeholder="Enter Mermaid diagram syntax..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Live Rendered SVG Preview Pane */}
            {(activeTab === 'both' || activeTab === 'preview') && (
              <div
                className={`flex flex-col overflow-hidden bg-muted/5 ${
                  activeTab === 'both' ? 'w-1/2' : 'w-full'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/10 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Real-Time Vector Preview:</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Interactive SVG
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative scrollbar-thin">
                  {error ? (
                    <div className="flex flex-col items-center max-w-sm text-center p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1.5">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <div className="font-semibold">Syntax Parse Error</div>
                      <div className="text-[11px] opacity-80 font-mono break-words">{error}</div>
                    </div>
                  ) : svg ? (
                    <div
                      className="w-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-[500px]"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">Rendering preview...</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/70 bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Inserting:</span>
            <span className="font-semibold text-foreground">{selectedTemplate.title}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!code.trim() || !!error}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Insert into Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

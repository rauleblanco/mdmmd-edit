import { useState } from 'react'
import {
  ClipboardPaste,
  Sparkles,
  GitBranch,
  FileCode,
  Network,
  Kanban,
  BrainCircuit,
  X,
  Play,
} from 'lucide-react'
import { isRawMermaid } from '@/lib/mermaid/renderer'

interface PasteDialogProps {
  isOpen: boolean
  onClose: () => void
  onPasteSubmit: (content: string, title?: string) => void
}

const TEMPLATES: {
  title: string
  syntax: string
  icon: typeof FileCode
  content: string
}[] = [
  {
    title: 'Flowchart Diagram',
    syntax: 'Mermaid',
    icon: Network,
    content: `graph TD
    Start([User Request]) --> Check{Syntax Type?}
    Check -->|Markdown| MD[Render GFM Document]
    Check -->|Mermaid| MMD[Render Inline Vector SVG]
    MD --> Export[Export PNG / PDF / DOCX]
    MMD --> Export
    Export --> Success([Done!])`,
  },
  {
    title: 'Sequence Diagram',
    syntax: 'Mermaid',
    icon: Network,
    content: `sequenceDiagram
    autonumber
    actor User
    participant Editor as md/mmd Edit
    participant Pipeline as Unified Pipeline
    participant Mermaid as Mermaid Engine
    participant Preview as Live Preview

    User->>Editor: Paste Markdown / Mermaid
    Editor->>Pipeline: Parse AST & Sanitize
    Pipeline->>Mermaid: Extract & Render Diagrams
    Mermaid-->>Pipeline: Return SVG
    Pipeline-->>Preview: Update Live DOM
    Preview-->>User: Instant Visual Render`,
  },
  {
    title: 'Git Graph',
    syntax: 'Mermaid',
    icon: GitBranch,
    content: `gitGraph
    commit id: "Initial commit"
    branch feature/mermaid
    checkout feature/mermaid
    commit id: "Add SVG renderer"
    commit id: "Add lightbox zoom"
    checkout main
    merge feature/mermaid id: "Merge PR #1"
    branch release/v1.0
    checkout release/v1.0
    commit id: "Bump version"
    checkout main
    merge release/v1.0 id: "Release 1.0" tag: "v1.0.0"`,
  },
  {
    title: 'Mindmap',
    syntax: 'Mermaid',
    icon: BrainCircuit,
    content: `mindmap
  root((md/mmd Edit))
    Rendering
      CommonMark
      GFM Tables
      KaTeX Math
      GitHub Alerts
      YAML Frontmatter
    Mermaid Diagrams
      Flowchart
      Sequence
      Class & State
      ER & Gantt
      GitGraph & Mindmap
    Export Engine
      High-res PNG
      Vector SVG
      Print-quality PDF
      DOCX Document
      Self-contained HTML`,
  },
  {
    title: 'Kanban Board',
    syntax: 'Mermaid',
    icon: Kanban,
    content: `kanban
  Todo
    [Scaffold Architecture]
    [Playwright Tests]
  In Progress
    [Markdown Pipeline]
    [Mermaid Renderer]
  Done
    [Project Planning]
    [Theme System]`,
  },
  {
    title: 'Markdown with Math & Alerts',
    syntax: 'Markdown',
    icon: Sparkles,
    content: `# Document Title

> [!NOTE]
> This is a GitHub-style alert callout rendered with md/mmd Edit.

> [!TIP]
> You can paste both full Markdown documents and standalone Mermaid diagrams!

## Mathematical Formulas
Euler's identity is defined as:
$$e^{i\\pi} + 1 = 0$$

Inline math also works seamlessly: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$.

## GFM Table Example
| Feature | Supported | Format |
| :--- | :---: | ---: |
| High-res PNG | Yes | 1x, 2x, 3x, 4x |
| Vector SVG | Yes | Native SVG |
| Print PDF | Yes | Chromium Native |
`,
  },
]

export function PasteDialog({ isOpen, onClose, onPasteSubmit }: PasteDialogProps): JSX.Element | null {
  const [text, setText] = useState('')

  if (!isOpen) return null

  const handleClipboardPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      if (clipboardText) {
        setText(clipboardText)
      }
    } catch (e) {
      console.warn('Could not read from clipboard directly:', e)
    }
  }

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    let finalContent = trimmed
    let title = 'Pasted Snippet'

    if (isRawMermaid(trimmed)) {
      title = 'Mermaid Diagram'
    } else {
      title = 'Pasted Document'
    }

    onPasteSubmit(finalContent, title)
    setText('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Paste Markdown or Mermaid</h2>
              <p className="text-xs text-muted-foreground">
                Paste any text snippet, diagram code, or select a template to render immediately
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Template chips */}
        <div className="my-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Quick Insert Template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon
              return (
                <button
                  key={tmpl.title}
                  onClick={() => setText(tmpl.content)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/70 bg-muted/40 hover:bg-muted text-foreground transition-colors"
                >
                  <Icon className="w-3 h-3 text-primary" />
                  <span>{tmpl.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Textarea Header Bar with unobstructed Paste from Clipboard */}
        <div className="flex items-center justify-between mt-3 mb-1.5">
          <label htmlFor="paste-textarea" className="text-xs font-semibold text-muted-foreground">
            Markdown / Mermaid Input:
          </label>
          <button
            type="button"
            onClick={handleClipboardPaste}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors shadow-sm"
            title="Read and paste from system clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste from Clipboard</span>
          </button>
        </div>

        {/* Clean, completely unobstructed Textarea */}
        <div className="mb-3">
          <textarea
            id="paste-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your Markdown, Mermaid diagram (e.g. flowchart TD, sequenceDiagram, etc.), or KaTeX math formulas here..."
            className="w-full h-56 p-4 rounded-xl border border-border bg-background font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none scrollbar-thin cursor-text"
            autoFocus
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono">
            {text.length > 0 ? `${text.length} characters` : 'Supports Markdown, Mermaid, Math, Alerts'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Render & View
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

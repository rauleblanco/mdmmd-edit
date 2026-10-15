import { useState } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  AlertTriangle,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  FileCode,
  Minus,
  Network,
  ChevronDown,
  Sigma,
  Sparkles,
  Info,
  CheckCircle2,
  Flame,
  ShieldAlert,
} from 'lucide-react'
import { MERMAID_TEMPLATES, type MermaidTemplate } from './mermaidTemplates'
import { isMermaidFile, isRawMermaid } from '@/lib/mermaid/renderer'

export interface WysiwygToolbarProps {
  fileName?: string
  content?: string
  onWrapText: (prefix: string, suffix: string, placeholder?: string) => void
  onInsertLinePrefix: (prefix: string) => void
  onInsertBlock: (blockText: string) => void
  onOpenMermaidWizard: () => void
  onOpenTableDialog: () => void
}

export function WysiwygToolbar({
  fileName,
  content,
  onWrapText,
  onInsertLinePrefix,
  onInsertBlock,
  onOpenMermaidWizard,
  onOpenTableDialog,
}: WysiwygToolbarProps): JSX.Element {
  const [headingOpen, setHeadingOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [mermaidMenuOpen, setMermaidMenuOpen] = useState(false)
  const [mathOpen, setMathOpen] = useState(false)

  const isMermaid = isMermaidFile(fileName) || (content ? isRawMermaid(content) : false)

  const handleHeadingSelect = (level: number) => {
    if (level === 0) {
      onInsertLinePrefix('')
    } else {
      onInsertLinePrefix('#'.repeat(level) + ' ')
    }
    setHeadingOpen(false)
  }

  const handleAlertSelect = (type: 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION') => {
    onInsertBlock(`\n> [!${type}]\n> Insert ${type.toLowerCase()} details here...\n`)
    setAlertOpen(false)
  }

  const handleInsertMermaidTemplate = (tmpl: MermaidTemplate) => {
    if (isMermaid) {
      onInsertBlock(`\n${tmpl.code}\n`)
    } else {
      onInsertBlock(`\n\`\`\`mermaid\n${tmpl.code}\n\`\`\`\n`)
    }
    setMermaidMenuOpen(false)
  }

  const handleInsertLink = () => {
    onWrapText('[', '](https://example.com)', 'Link Title')
  }

  const handleInsertImage = () => {
    onWrapText('![', '](https://example.com/image.png)', 'Image Alt Text')
  }

  const handleInsertCodeBlock = () => {
    onInsertBlock('\n```typescript\n// Code snippet here\nconsole.log("Hello, MerMark!");\n```\n')
  }

  const handleInsertInlineMath = () => {
    onWrapText('$', '$', 'E = mc^2')
    setMathOpen(false)
  }

  const handleInsertBlockMath = () => {
    onInsertBlock('\n$$\n\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$\n')
    setMathOpen(false)
  }

  return (
    <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 border-b border-border/70 bg-muted/40 select-none text-foreground text-xs shrink-0">
      {/* Headings Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setHeadingOpen(!headingOpen)
            setAlertOpen(false)
            setMermaidMenuOpen(false)
            setMathOpen(false)
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted font-medium text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Headings & Hierarchy"
        >
          <span>Heading</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {headingOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-36 rounded-xl border border-border bg-popover p-1 shadow-xl z-30 space-y-0.5 animate-in fade-in duration-100"
            onMouseLeave={() => setHeadingOpen(false)}
          >
            <button
              onClick={() => handleHeadingSelect(1)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-bold"
            >
              <Heading1 className="w-3.5 h-3.5 text-primary" />
              <span>Heading 1</span>
            </button>
            <button
              onClick={() => handleHeadingSelect(2)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-semibold"
            >
              <Heading2 className="w-3.5 h-3.5 text-primary" />
              <span>Heading 2</span>
            </button>
            <button
              onClick={() => handleHeadingSelect(3)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-medium"
            >
              <Heading3 className="w-3.5 h-3.5 text-primary" />
              <span>Heading 3</span>
            </button>
            <button
              onClick={() => handleHeadingSelect(0)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs text-muted-foreground"
            >
              <span>Paragraph</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border/60 mx-0.5" />

      {/* Inline Formatting */}
      <button
        onClick={() => onWrapText('**', '**', 'bold text')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Bold (Cmd/Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onWrapText('*', '*', 'italic text')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Italic (Cmd/Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onWrapText('~~', '~~', 'strikethrough')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onWrapText('`', '`', 'code')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Inline Code (Cmd/Ctrl+E)"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-border/60 mx-0.5" />

      {/* Lists */}
      <button
        onClick={() => onInsertLinePrefix('- ')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Bulleted List (- item)"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onInsertLinePrefix('1. ')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Numbered List (1. item)"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onInsertLinePrefix('- [ ] ')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Task Checklist (- [ ] item)"
      >
        <ListTodo className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-border/60 mx-0.5" />

      {/* Quote & Alerts */}
      <button
        onClick={() => onInsertLinePrefix('> ')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Blockquote (> quote)"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      {/* GitHub Alerts Menu */}
      <div className="relative">
        <button
          onClick={() => {
            setAlertOpen(!alertOpen)
            setHeadingOpen(false)
            setMermaidMenuOpen(false)
            setMathOpen(false)
          }}
          className="flex items-center gap-1 px-1.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="GitHub Alert Callouts"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px]">Alert</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {alertOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-36 rounded-xl border border-border bg-popover p-1 shadow-xl z-30 space-y-0.5 animate-in fade-in duration-100"
            onMouseLeave={() => setAlertOpen(false)}
          >
            <button
              onClick={() => handleAlertSelect('NOTE')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-medium text-blue-500"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Note</span>
            </button>
            <button
              onClick={() => handleAlertSelect('TIP')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-medium text-emerald-500"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tip</span>
            </button>
            <button
              onClick={() => handleAlertSelect('IMPORTANT')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-medium text-purple-500"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Important</span>
            </button>
            <button
              onClick={() => handleAlertSelect('WARNING')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-medium text-amber-500"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warning</span>
            </button>
            <button
              onClick={() => handleAlertSelect('CAUTION')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted text-left text-xs font-medium text-rose-500"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Caution</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border/60 mx-0.5" />

      {/* Links, Images, Tables, Math, Code */}
      <button
        onClick={handleInsertLink}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Hyperlink [text](url)"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleInsertImage}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Image ![alt](url)"
      >
        <ImageIcon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onOpenTableDialog}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Insert GFM Table..."
      >
        <TableIcon className="w-3.5 h-3.5 text-blue-500" />
      </button>

      {/* Math KaTeX */}
      <div className="relative">
        <button
          onClick={() => {
            setMathOpen(!mathOpen)
            setHeadingOpen(false)
            setAlertOpen(false)
            setMermaidMenuOpen(false)
          }}
          className="flex items-center gap-0.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Mathematical Formulas (KaTeX)"
        >
          <Sigma className="w-3.5 h-3.5 text-indigo-500" />
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {mathOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-36 rounded-xl border border-border bg-popover p-1 shadow-xl z-30 space-y-0.5 animate-in fade-in duration-100"
            onMouseLeave={() => setMathOpen(false)}
          >
            <button
              onClick={handleInsertInlineMath}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs"
            >
              <span>Inline Math ($...$)</span>
            </button>
            <button
              onClick={handleInsertBlockMath}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs"
            >
              <span>Block Formula ($$...$$)</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleInsertCodeBlock}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Code Block (```lang)"
      >
        <FileCode className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onInsertBlock('\n---\n')}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Horizontal Rule (---)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-border/60 mx-1" />

      {/* Mermaid Visual Diagram Section */}
      <div className="relative flex items-center">
        <button
          onClick={() => {
            setMermaidMenuOpen(!mermaidMenuOpen)
            setHeadingOpen(false)
            setAlertOpen(false)
            setMathOpen(false)
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/25 transition-all shadow-xs"
          title="Mermaid Diagrams & Flowcharts"
        >
          <Network className="w-3.5 h-3.5" />
          <span>Mermaid</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {mermaidMenuOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 w-60 rounded-xl border border-border bg-popover p-1.5 shadow-2xl z-40 space-y-1 animate-in fade-in duration-100 max-h-96 overflow-y-auto scrollbar-thin"
            onMouseLeave={() => setMermaidMenuOpen(false)}
          >
            {/* Visual Wizard Launcher */}
            <button
              onClick={() => {
                setMermaidMenuOpen(false)
                onOpenMermaidWizard()
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Visual Wizard...</span>
            </button>

            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Quick 1-Click Templates:
            </div>

            {MERMAID_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleInsertMermaidTemplate(tmpl)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted text-left text-xs transition-colors group"
              >
                <span className="font-medium text-foreground">{tmpl.title}</span>
                <span className="text-[10px] text-muted-foreground opacity-60 group-hover:opacity-100">
                  {tmpl.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

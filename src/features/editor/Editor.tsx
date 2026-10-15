import { useEffect, useRef, useState, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { useAppStore } from '@/stores/appStore'
import { WysiwygToolbar } from './WysiwygToolbar'
import { MermaidInsertDialog } from './MermaidInsertDialog'
import { TableInsertDialog } from './TableInsertDialog'
import { isMermaidFile, isRawMermaid } from '@/lib/mermaid/renderer'

interface EditorProps {
  content: string
  fileName?: string
  onChange: (value: string) => void
  onScroll?: (ratio: number) => void
  scrollRatio?: number
}

export function Editor({ content, fileName, onChange, onScroll, scrollRatio }: EditorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isSyncingRef = useRef(false)

  const [mermaidDialogOpen, setMermaidDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)

  const resolvedTheme = useAppStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'
  const fontSize = useAppStore((s) => s.editorFontSize)
  const showLineNumbers = useAppStore((s) => s.editorLineNumbers)
  const wordWrap = useAppStore((s) => s.editorWordWrap)

  // Formatting operations
  const handleWrapText = useCallback(
    (prefix: string, suffix: string, placeholder = 'text') => {
      const view = viewRef.current
      if (!view) return
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const textToInsert = selected || placeholder
      view.dispatch({
        changes: {
          from,
          to,
          insert: `${prefix}${textToInsert}${suffix}`,
        },
        selection: {
          anchor: from + prefix.length,
          head: from + prefix.length + textToInsert.length,
        },
      })
      view.focus()
    },
    []
  )

  const handleInsertLinePrefix = useCallback((prefix: string) => {
    const view = viewRef.current
    if (!view) return
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)

    if (!prefix) {
      // Clear heading or quote prefix
      const cleaned = line.text
        .replace(/^#{1,6}\s+/, '')
        .replace(/^>\s+/, '')
        .replace(/^[-*+]\s+/, '')
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: cleaned },
        selection: { anchor: line.from + cleaned.length },
      })
    } else {
      view.dispatch({
        changes: { from: line.from, to: line.from, insert: prefix },
        selection: { anchor: from + prefix.length },
      })
    }
    view.focus()
  }, [])

  const handleInsertBlock = useCallback((blockText: string) => {
    const view = viewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    view.dispatch({
      changes: { from, to, insert: blockText },
      selection: { anchor: from + blockText.length },
    })
    view.focus()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    // Create theme styling
    const editorTheme = EditorView.theme(
      {
        '&': {
          height: '100%',
          fontSize: `${fontSize}px`,
          fontFamily: "'JetBrains Mono', Menlo, Monaco, monospace",
          backgroundColor: 'transparent',
          color: isDark ? '#f1f5f9' : '#0f172a',
        },
        '.cm-scroller': {
          overflow: 'auto',
          lineHeight: '1.6',
          minHeight: '100%',
        },
        '.cm-content': {
          padding: '16px 20px',
          caretColor: isDark ? '#60a5fa' : '#2563eb',
          minHeight: '100%',
          cursor: 'text',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          color: isDark ? '#64748b' : '#94a3b8',
          borderRight: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          paddingRight: '8px',
        },
        '.cm-activeLine': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'transparent',
          color: isDark ? '#93c5fd' : '#2563eb',
        },
      },
      { dark: isDark }
    )

    // CodeMirror shortcut handlers
    const customKeymap = keymap.of([
      {
        key: 'Mod-b',
        run: () => {
          handleWrapText('**', '**', 'bold text')
          return true
        },
      },
      {
        key: 'Mod-i',
        run: () => {
          handleWrapText('*', '*', 'italic text')
          return true
        },
      },
      {
        key: 'Mod-e',
        run: () => {
          handleWrapText('`', '`', 'code')
          return true
        },
      },
      {
        key: 'Mod-k',
        run: () => {
          handleWrapText('[', '](https://example.com)', 'Link Title')
          return true
        },
      },
      {
        key: 'Mod-Shift-m',
        run: () => {
          setMermaidDialogOpen(true)
          return true
        },
      },
    ])

    const extensions = [
      highlightActiveLineGutter(),
      highlightActiveLine(),
      markdown({ codeLanguages: languages }),
      editorTheme,
      customKeymap,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const nextValue = update.state.doc.toString()
          onChange(nextValue)
        }
      }),
    ]

    if (showLineNumbers) {
      extensions.unshift(lineNumbers())
    }

    if (wordWrap) {
      extensions.push(EditorView.lineWrapping)
    }

    const state = EditorState.create({
      doc: content,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view
    view.focus()

    const handleScroll = () => {
      if (isSyncingRef.current) return
      const scroller = view.scrollDOM
      const max = scroller.scrollHeight - scroller.clientHeight
      if (max > 0 && onScroll) {
        onScroll(scroller.scrollTop / max)
      }
    }

    view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      view.scrollDOM.removeEventListener('scroll', handleScroll)
      view.destroy()
      viewRef.current = null
    }
  }, [
    isDark,
    fontSize,
    showLineNumbers,
    wordWrap,
    handleWrapText,
    handleInsertLinePrefix,
    handleInsertBlock,
  ])

  // Sync external doc changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentDoc = view.state.doc.toString()
    if (currentDoc !== content) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      })
    }
  }, [content])

  // Sync scroll position from external scroll
  useEffect(() => {
    if (scrollRatio === undefined || !viewRef.current) return
    const scroller = viewRef.current.scrollDOM
    const max = scroller.scrollHeight - scroller.clientHeight
    if (max > 0) {
      isSyncingRef.current = true
      scroller.scrollTop = scrollRatio * max
      setTimeout(() => {
        isSyncingRef.current = false
      }, 60)
    }
  }, [scrollRatio])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background/50">
      {/* WYSIWYG Formatting Toolbar */}
      <WysiwygToolbar
        fileName={fileName}
        content={content}
        onWrapText={handleWrapText}
        onInsertLinePrefix={handleInsertLinePrefix}
        onInsertBlock={handleInsertBlock}
        onOpenMermaidWizard={() => setMermaidDialogOpen(true)}
        onOpenTableDialog={() => setTableDialogOpen(true)}
      />

      {/* CodeMirror Editor Area */}
      <div
        ref={containerRef}
        onClick={() => viewRef.current?.focus()}
        className="flex-1 w-full overflow-hidden cursor-text focus-within:ring-0"
      />

      {/* Mermaid Interactive Visual Wizard Modal */}
      <MermaidInsertDialog
        isOpen={mermaidDialogOpen}
        onClose={() => setMermaidDialogOpen(false)}
        onInsert={(mermaidCode) => {
          const isMermaid = isMermaidFile(fileName) || isRawMermaid(content)
          if (isMermaid) {
            handleInsertBlock(`\n${mermaidCode}\n`)
          } else {
            handleInsertBlock(`\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`)
          }
        }}
      />

      {/* GFM Table Builder Modal */}
      <TableInsertDialog
        isOpen={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        onInsert={handleInsertBlock}
      />
    </div>
  )
}

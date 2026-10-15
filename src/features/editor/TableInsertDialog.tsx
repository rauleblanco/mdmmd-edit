import { useState } from 'react'
import { Table, X, Plus, Trash2, Check } from 'lucide-react'

interface TableInsertDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (tableMarkdown: string) => void
}

type TableAlign = 'left' | 'center' | 'right'

export function TableInsertDialog({
  isOpen,
  onClose,
  onInsert,
}: TableInsertDialogProps): JSX.Element | null {
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(3)
  const [headers, setHeaders] = useState<string[]>(['Header 1', 'Header 2', 'Header 3'])
  const [alignments, setAlignments] = useState<TableAlign[]>([
    'left',
    'center',
    'right',
  ])

  if (!isOpen) return null

  const handleColChange = (newCols: number) => {
    if (newCols < 1 || newCols > 8) return
    setCols(newCols)
    setHeaders((prev) => {
      const copy = [...prev]
      while (copy.length < newCols) copy.push(`Header ${copy.length + 1}`)
      return copy.slice(0, newCols)
    })
    setAlignments((prev) => {
      const copy = [...prev]
      while (copy.length < newCols) copy.push('left')
      return copy.slice(0, newCols)
    })
  }

  const handleRowChange = (newRows: number) => {
    if (newRows < 1 || newRows > 20) return
    setRows(newRows)
  }

  const handleGenerate = () => {
    // Generate markdown table
    const headerRow = `| ${headers.map((h) => h || 'Col').join(' | ')} |`
    const separatorRow = `| ${alignments
      .map((a) => {
        if (a === 'center') return ':---:'
        if (a === 'right') return '---:'
        return ':---'
      })
      .join(' | ')} |`

    const dataRows: string[] = []
    for (let r = 1; r <= rows; r++) {
      const rowCols = headers.map((_, c) => `Item ${r}.${c + 1}`)
      dataRows.push(`| ${rowCols.join(' | ')} |`)
    }

    const tableMarkdown = `\n${headerRow}\n${separatorRow}\n${dataRows.join('\n')}\n`
    onInsert(tableMarkdown)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl transition-all text-foreground space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Insert GFM Markdown Table</h3>
              <p className="text-[11px] text-muted-foreground">
                Configure table dimensions and alignments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Columns (1-8):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={8}
                value={cols}
                onChange={(e) => handleColChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Data Rows (1-20):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => handleRowChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Column Headers & Alignments */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Column Headers & Alignment:</label>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h}
                  onChange={(e) => {
                    const next = [...headers]
                    next[i] = e.target.value
                    setHeaders(next)
                  }}
                  className="flex-1 px-2.5 py-1 rounded-md border border-border bg-background text-xs"
                  placeholder={`Column ${i + 1}`}
                />
                <select
                  value={alignments[i] || 'left'}
                  onChange={(e) => {
                    const next = [...alignments]
                    next[i] = e.target.value as 'left' | 'center' | 'right'
                    setAlignments(next)
                  }}
                  className="px-2 py-1 rounded-md border border-border bg-background text-xs"
                >
                  <option value="left">Align Left</option>
                  <option value="center">Align Center</option>
                  <option value="right">Align Right</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm shadow-primary/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insert Table</span>
          </button>
        </div>
      </div>
    </div>
  )
}

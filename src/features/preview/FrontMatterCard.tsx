import { useState } from 'react'
import { ChevronDown, ChevronRight, Tag, Copy, Check } from 'lucide-react'

interface FrontMatterCardProps {
  data: Record<string, unknown>
}

export function FrontMatterCard({ data }: FrontMatterCardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const entries = Object.entries(data)
  if (entries.length === 0) return <></>

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-border/80 bg-muted/20 shadow-sm transition-all">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-muted/40 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <Tag className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Document Metadata ({entries.length})
          </span>
        </div>

        <div
          onClick={handleCopy}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Copy metadata JSON"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/60 p-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            {entries.map(([key, value]) => (
              <div key={key} className="contents">
                <span className="font-mono font-medium text-muted-foreground">{key}:</span>
                <span className="font-mono text-foreground break-all">
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

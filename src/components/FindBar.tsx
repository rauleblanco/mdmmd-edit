import { useState, useEffect, useRef } from 'react'
import { Search, ChevronUp, ChevronDown, X, CaseSensitive } from 'lucide-react'

interface FindBarProps {
  isOpen: boolean
  onClose: () => void
  containerRef?: React.RefObject<HTMLElement | null>
}

export function FindBar({ isOpen, onClose, containerRef }: FindBarProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    } else {
      setQuery('')
      setMatchCount(0)
      setCurrentIndex(0)
      // Clear custom highlights if any
      clearHighlights()
    }
  }, [isOpen])

  const clearHighlights = () => {
    const root = containerRef?.current || document.body
    const marks = root.querySelectorAll('mark.mermak-find-highlight')
    marks.forEach((mark) => {
      const parent = mark.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
        parent.normalize()
      }
    })
  }

  // Perform search whenever query or caseSensitive changes
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      clearHighlights()
      setMatchCount(0)
      setCurrentIndex(0)
      return
    }

    clearHighlights()

    const root = containerRef?.current || document.body
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
        if (node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    })

    const textNodes: Text[] = []
    let curr = walker.nextNode()
    while (curr) {
      textNodes.push(curr as Text)
      curr = walker.nextNode()
    }

    let count = 0
    const flags = caseSensitive ? 'g' : 'gi'
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedQuery, flags)

    for (const textNode of textNodes) {
      const matches = [...(textNode.textContent?.matchAll(regex) || [])]
      if (matches.length === 0) continue

      const parent = textNode.parentNode
      if (!parent) continue

      const frag = document.createDocumentFragment()
      let lastIdx = 0
      const text = textNode.textContent || ''

      for (const m of matches) {
        const matchStart = m.index!
        const matchEnd = matchStart + m[0].length

        if (matchStart > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, matchStart)))
        }

        const mark = document.createElement('mark')
        mark.className = 'mermak-find-highlight bg-amber-300 dark:bg-amber-500/50 text-foreground px-0.5 rounded'
        mark.dataset.matchIndex = String(count)
        mark.textContent = text.slice(matchStart, matchEnd)
        frag.appendChild(mark)

        count++
        lastIdx = matchEnd
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)))
      }

      parent.replaceChild(frag, textNode)
    }

    setMatchCount(count)
    setCurrentIndex(count > 0 ? 1 : 0)

    if (count > 0) {
      highlightActive(0)
    }
  }, [query, caseSensitive, isOpen])

  const highlightActive = (idx: number) => {
    const root = containerRef?.current || document.body
    const marks = root.querySelectorAll('mark.mermak-find-highlight')
    marks.forEach((m, i) => {
      if (i === idx) {
        m.classList.add('ring-2', 'ring-primary', 'bg-amber-400', 'dark:bg-amber-400')
        m.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        m.classList.remove('ring-2', 'ring-primary')
      }
    })
  }

  const handleNext = () => {
    if (matchCount === 0) return
    const next = currentIndex >= matchCount ? 1 : currentIndex + 1
    setCurrentIndex(next)
    highlightActive(next - 1)
  }

  const handlePrev = () => {
    if (matchCount === 0) return
    const prev = currentIndex <= 1 ? matchCount : currentIndex - 1
    setCurrentIndex(prev)
    highlightActive(prev - 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        handlePrev()
      } else {
        handleNext()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-12 right-6 z-40 flex items-center gap-1.5 rounded-xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md animate-in slide-in-from-top-2 duration-150 text-xs">
      <Search className="w-3.5 h-3.5 text-muted-foreground ml-1.5 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Find in document..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-48 bg-transparent px-1.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />

      <span className="text-[11px] font-mono text-muted-foreground px-1 select-none shrink-0">
        {query ? (matchCount > 0 ? `${currentIndex} of ${matchCount}` : 'No matches') : ''}
      </span>

      <button
        onClick={() => setCaseSensitive(!caseSensitive)}
        className={`p-1 rounded transition-colors ${
          caseSensitive
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Match case"
      >
        <CaseSensitive className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handlePrev}
        disabled={matchCount === 0}
        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleNext}
        disabled={matchCount === 0}
        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
        title="Next match (Enter)"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onClose}
        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-0.5"
        title="Close (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

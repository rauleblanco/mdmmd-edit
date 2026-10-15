import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Copy, Check } from 'lucide-react'

interface DiagramLightboxProps {
  svgContent: string
  isOpen: boolean
  onClose: () => void
}

export function DiagramLightbox({
  svgContent,
  isOpen,
  onClose,
}: DiagramLightboxProps): JSX.Element | null {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset transform when opened
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.002
    setScale((prev) => Math.min(Math.max(0.2, prev + delta), 6))
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCopySvg = async () => {
    await navigator.clipboard.writeText(svgContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Lightbox Controls toolbar */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-xl bg-background/90 backdrop-blur-md border border-border p-1.5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setScale((s) => Math.min(s + 0.25, 6))}
          className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s - 0.25, 0.2))}
          className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }}
          className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Reset zoom"
          aria-label="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={handleCopySvg}
          className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
          title={copied ? 'Copied SVG!' : 'Copy SVG'}
          aria-label="Copy SVG"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-500 text-foreground transition-colors"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Diagram zoom/pan container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-12"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            transformOrigin: 'center center',
          }}
          className="max-w-full max-h-full flex items-center justify-center p-8 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 shadow-2xl"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border">
        {Math.round(scale * 100)}%
      </div>
    </div>
  )
}

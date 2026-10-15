import { useState, useEffect, useCallback, type MouseEvent, type TouchEvent } from 'react'
import { cn } from '@/lib/utils'

interface SplitResizerProps {
  splitRatio: number
  onSplitChange: (newRatio: number) => void
  onReset?: () => void
  containerRef: React.RefObject<HTMLElement>
  minRatio?: number
  maxRatio?: number
}

export function SplitResizer({
  splitRatio,
  onSplitChange,
  onReset,
  containerRef,
  minRatio = 0.15,
  maxRatio = 0.85,
}: SplitResizerProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)

  const handleMove = useCallback(
    (clientX: number) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      if (rect.width <= 0) return

      const rawRatio = (clientX - rect.left) / rect.width
      const clamped = Math.min(Math.max(rawRatio, minRatio), maxRatio)
      onSplitChange(clamped)
    },
    [containerRef, minRatio, maxRatio, onSplitChange]
  )

  const startDragging = useCallback(() => {
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopDragging = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Mouse event listeners during drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      handleMove(e.clientX)
    }

    const handleMouseUp = () => {
      stopDragging()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMove, stopDragging])

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    startDragging()
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      startDragging()
    }
  }

  const handleTouchMove = (e: globalThis.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX)
    }
  }

  // Touch listener during drag
  useEffect(() => {
    if (!isDragging) return

    const onTouchEnd = () => stopDragging()

    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [isDragging, stopDragging])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onSplitChange(Math.max(splitRatio - 0.02, minRatio))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onSplitChange(Math.min(splitRatio + 0.02, maxRatio))
    } else if (e.key === 'Enter' || e.key === 'Home') {
      e.preventDefault()
      onReset?.()
    }
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize editor and preview split panes"
      aria-valuenow={Math.round(splitRatio * 100)}
      aria-valuemin={Math.round(minRatio * 100)}
      aria-valuemax={Math.round(maxRatio * 100)}
      title="Drag to resize panes • Double-click to reset (50%)"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex items-center justify-center h-full w-3 -mx-1.5 z-30 cursor-col-resize select-none focus:outline-none transition-colors shrink-0',
        isDragging && 'bg-primary/10'
      )}
    >
      {/* Visual track line */}
      <div
        className={cn(
          'w-[2px] h-full transition-colors duration-150',
          isDragging
            ? 'bg-primary shadow-xs shadow-primary/30'
            : 'bg-border/80 group-hover:bg-primary/70 group-focus:bg-primary'
        )}
      />

      {/* Grip handle in vertical center */}
      <div
        className={cn(
          'absolute flex flex-col items-center justify-center gap-1 w-4 h-8 rounded-full border bg-background/95 backdrop-blur-xs shadow-xs transition-all duration-150 pointer-events-none',
          isDragging
            ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/20'
            : 'border-border/80 text-muted-foreground group-hover:border-primary/60 group-hover:text-primary group-hover:scale-105 group-focus:border-primary'
        )}
      >
        <div className="w-0.5 h-0.5 rounded-full bg-current" />
        <div className="w-0.5 h-0.5 rounded-full bg-current" />
        <div className="w-0.5 h-0.5 rounded-full bg-current" />
      </div>
    </div>
  )
}

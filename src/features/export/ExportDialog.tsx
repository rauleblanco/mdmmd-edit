import { useState } from 'react'
import {
  Download,
  Image,
  FileCode,
  FileText,
  File,
  Copy,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Sliders,
} from 'lucide-react'
import {
  captureElementToDataUrl,
  downloadDataUrl,
  downloadBlob,
  dataUrlToUint8Array,
  checkCanvasLimit,
} from './exportImage'
import { buildStandaloneHtml, stripExportToolbars } from './exportHtml'
import { generateDocxBlob } from './exportDocx'
import { copyElementAsPng, copyAsRichHtml, copyAsPlainMarkdown } from './clipboard'
import { useAppStore } from '@/stores/appStore'

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'html' | 'docx' | 'markdown'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  targetElement: HTMLElement | null
  markdownContent: string
  renderedHtml?: string
  documentTitle?: string
}

export function ExportDialog({
  isOpen,
  onClose,
  targetElement,
  markdownContent,
  renderedHtml = '',
  documentTitle = 'Document',
}: ExportDialogProps): JSX.Element | null {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scope, setScope] = useState<'full' | 'viewport'>('full')
  const [scale, setScale] = useState<number>(2)
  const [quality, setQuality] = useState<number>(0.92)
  const [transparentBg, setTransparentBg] = useState<boolean>(false)
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [pdfPageSize, setPdfPageSize] = useState<'A4' | 'Letter' | 'Legal'>('A4')

  const [exporting, setExporting] = useState<boolean>(false)
  const [copiedAction, setCopiedAction] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const resolvedTheme = useAppStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  const isElementTarget = Boolean(
    targetElement &&
    (targetElement.classList.contains('group') ||
      targetElement.tagName.toLowerCase() === 'svg' ||
      targetElement.querySelector('svg') !== null && targetElement.classList.contains('py-4') ||
      targetElement.closest?.('.group') !== null)
  )

  if (!isOpen) return null

  // Check canvas height limit
  const limitCheck = targetElement
    ? checkCanvasLimit(targetElement, scale)
    : { exceeds: false, height: 0, scaledHeight: 0 }

  const handleExport = async () => {
    setExporting(true)
    try {
      const cleanTitle = documentTitle.replace(/[^\w\s-]/g, '').trim() || 'export'

      if (format === 'png' || format === 'jpeg' || format === 'webp' || format === 'svg') {
        if (!targetElement) {
          throw new Error('No render element available to capture.')
        }

        const bgColor = transparentBg && format === 'png'
          ? null
          : isDark ? '#090d16' : '#ffffff'

        const dataUrl = await captureElementToDataUrl(targetElement, {
          format,
          scale,
          quality,
          backgroundColor: bgColor,
          scope,
        })

        // Save via native dialog if Electron available, else browser download
        const ext = format
        const defaultFilename = `${cleanTitle}.${ext}`

        const exportAPI = window.mdmmd?.export || window.mermak?.export || window.markview?.export
        if (exportAPI) {
          const filePath = await exportAPI.showSaveDialog({
            defaultPath: defaultFilename,
            filters: [{ name: format.toUpperCase(), extensions: [ext] }],
          })
          if (filePath) {
            const bytes = dataUrlToUint8Array(dataUrl)
            await exportAPI.saveFile(filePath, bytes)
            setToastMsg(`Saved to ${filePath}`)
          }
        } else {
          downloadDataUrl(dataUrl, defaultFilename)
        }
      } else if (format === 'html') {
        const rawHtml = renderedHtml || targetElement?.innerHTML || ''
        const cleanHtml = stripExportToolbars(rawHtml)
        const fullHtml = buildStandaloneHtml(cleanHtml, cleanTitle, isDark)
        const exportAPI = window.mdmmd?.export || window.mermak?.export || window.markview?.export
        if (exportAPI) {
          const filePath = await exportAPI.showSaveDialog({
            defaultPath: `${cleanTitle}.html`,
            filters: [{ name: 'HTML Document (*.html)', extensions: ['html', 'htm'] }],
          })
          if (filePath) {
            const bytes = new TextEncoder().encode(fullHtml)
            await exportAPI.saveFile(filePath, bytes)
            setToastMsg(`Saved to ${filePath}`)
          }
        } else {
          const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
          downloadBlob(blob, `${cleanTitle}.html`)
        }
      } else if (format === 'docx') {
        const docxBlob = await generateDocxBlob(markdownContent, cleanTitle)
        const exportAPI = window.mdmmd?.export || window.mermak?.export || window.markview?.export
        if (exportAPI) {
          const filePath = await exportAPI.showSaveDialog({
            defaultPath: `${cleanTitle}.docx`,
            filters: [{ name: 'Word Document (*.docx)', extensions: ['docx'] }],
          })
          if (filePath) {
            const arrayBuf = await docxBlob.arrayBuffer()
            await exportAPI.saveFile(filePath, new Uint8Array(arrayBuf))
            setToastMsg(`Saved to ${filePath}`)
          }
        } else {
          downloadBlob(docxBlob, `${cleanTitle}.docx`)
        }
      } else if (format === 'markdown') {
        const exportAPI = window.mdmmd?.export || window.mermak?.export || window.markview?.export
        if (exportAPI) {
          const filePath = await exportAPI.showSaveDialog({
            defaultPath: `${cleanTitle}.md`,
            filters: [{ name: 'Markdown Document (*.md)', extensions: ['md', 'markdown'] }],
          })
          if (filePath) {
            const bytes = new TextEncoder().encode(markdownContent)
            await exportAPI.saveFile(filePath, bytes)
            setToastMsg(`Saved to ${filePath}`)
          }
        } else {
          const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
          downloadBlob(blob, `${cleanTitle}.md`)
        }
      } else if (format === 'pdf') {
        const exportAPI = window.mdmmd?.export || window.mermak?.export || window.markview?.export
        if (exportAPI?.printToPDF) {
          const rawHtml = targetElement?.innerHTML || renderedHtml || ''
          const cleanHtml = stripExportToolbars(rawHtml)
          const fullHtml = buildStandaloneHtml(cleanHtml, cleanTitle, isDark)

          const filePath = await exportAPI.showSaveDialog({
            defaultPath: `${cleanTitle}.pdf`,
            filters: [{ name: 'PDF Document (*.pdf)', extensions: ['pdf'] }],
          })

          if (filePath) {
            const pdfBytes = await exportAPI.printToPDF({
              html: fullHtml,
              landscape: pdfOrientation === 'landscape',
              pageSize: pdfPageSize,
              printBackground: true,
            })
            await exportAPI.saveFile(filePath, pdfBytes)
            setToastMsg(`Saved PDF to ${filePath}`)
          }
        } else {
          window.print()
        }
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert(`Export failed: ${String(err)}`)
    } finally {
      setExporting(false)
    }
  }

  // Quick clipboard copies
  const handleCopyImage = async () => {
    if (!targetElement) return
    const success = await copyElementAsPng(targetElement, scale, {
      scope,
      backgroundColor: transparentBg && format === 'png' ? null : isDark ? '#090d16' : '#ffffff',
    })
    if (success) {
      setCopiedAction('image')
      setTimeout(() => setCopiedAction(null), 2000)
    }
  }

  const handleCopyHtml = async () => {
    const success = await copyAsRichHtml(renderedHtml || targetElement?.innerHTML || '')
    if (success) {
      setCopiedAction('html')
      setTimeout(() => setCopiedAction(null), 2000)
    }
  }

  const handleCopyMarkdown = async () => {
    const success = await copyAsPlainMarkdown(markdownContent)
    if (success) {
      setCopiedAction('markdown')
      setTimeout(() => setCopiedAction(null), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Export Document</h2>
              <p className="text-xs text-muted-foreground">
                Export whole document or element to high-res images, PDF, Word, or HTML
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

        {/* Format Selector Grid */}
        <div className="my-5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Select Format:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: 'png', label: 'PNG Image', icon: Image, badge: 'High-Res' },
                { id: 'pdf', label: 'PDF Document', icon: FileText, badge: 'Vector' },
                { id: 'svg', label: 'SVG Vector', icon: FileCode, badge: 'Lossless' },
                { id: 'docx', label: 'Word (DOCX)', icon: File, badge: 'Editable' },
                { id: 'jpeg', label: 'JPEG Image', icon: Image, badge: 'Compact' },
                { id: 'webp', label: 'WebP Image', icon: Image, badge: 'Modern' },
                { id: 'html', label: 'HTML Webpage', icon: FileCode, badge: 'Standalone' },
                { id: 'markdown', label: 'Markdown', icon: FileText, badge: 'Source' },
              ] as const
            ).map((item) => {
              const Icon = item.icon
              const isSelected = format === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setFormat(item.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'border-border/70 bg-muted/30 hover:bg-muted text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{item.badge}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Capture Scope (Complete Element/Document vs Current Viewport) */}
        {(format === 'png' || format === 'jpeg' || format === 'webp' || format === 'svg' || format === 'pdf') && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                Export Scope:
              </span>
              <span className="text-[11px] text-muted-foreground">
                {scope === 'full'
                  ? isElementTarget
                    ? 'Capturing complete diagram element (unclipped)'
                    : 'Capturing complete document (unclipped)'
                  : 'Capturing visible window viewport only'}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5 border border-border/60">
              <button
                type="button"
                onClick={() => setScope('full')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  scope === 'full'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isElementTarget ? 'Complete Element' : 'Complete Document'} (Default)
              </button>
              <button
                type="button"
                onClick={() => setScope('viewport')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  scope === 'viewport'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Visible Viewport
              </button>
            </div>
          </div>
        )}

        {/* Format Specific Options */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 mb-5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground mb-3">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Format Options</span>
          </div>

          {(format === 'png' || format === 'jpeg' || format === 'webp') && (
            <div className="space-y-3">
              {/* Pixel Ratio Scale */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Resolution Scale:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        scale === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* PNG Transparency toggle */}
              {format === 'png' && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transparent Background:</span>
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="accent-primary cursor-pointer w-4 h-4"
                  />
                </div>
              )}

              {/* JPEG/WebP Quality Slider */}
              {(format === 'jpeg' || format === 'webp') && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quality ({Math.round(quality * 100)}%):</span>
                  <input
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="accent-primary cursor-pointer w-36"
                  />
                </div>
              )}
            </div>
          )}

          {format === 'pdf' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Orientation:</span>
                <div className="flex items-center gap-1">
                  {(['portrait', 'landscape'] as const).map((ori) => (
                    <button
                      key={ori}
                      onClick={() => setPdfOrientation(ori)}
                      className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-colors ${
                        pdfOrientation === ori ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {ori}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paper Size:</span>
                <select
                  value={pdfPageSize}
                  onChange={(e) => setPdfPageSize(e.target.value as any)}
                  className="bg-muted px-2 py-1 rounded text-xs border border-border"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                </select>
              </div>
            </div>
          )}

          {format === 'docx' && (
            <p className="text-muted-foreground leading-relaxed">
              Maps headings, paragraphs, bullet/numbered lists, quotes, and code blocks into a native Microsoft Word (.docx) document.
            </p>
          )}

          {format === 'html' && (
            <p className="text-muted-foreground leading-relaxed">
              Self-contained HTML package with embedded KaTeX CSS, typography, and dark mode support for offline viewing.
            </p>
          )}

          {format === 'svg' && (
            <p className="text-muted-foreground leading-relaxed">
              Extracts high-resolution vector graphics. Ideal for Mermaid diagrams and charts.
            </p>
          )}

          {format === 'markdown' && (
            <p className="text-muted-foreground leading-relaxed">
              Saves the raw CommonMark / GFM source code to disk.
            </p>
          )}
        </div>

        {/* Large document height warning if canvas exceeds limit */}
        {limitCheck.exceeds && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              Document is very tall ({limitCheck.scaledHeight}px). Canvas size limits may clip raster images. We recommend exporting as <strong>PDF</strong>.
            </span>
          </div>
        )}

        {/* Quick Clipboard Copy Section */}
        <div className="flex items-center justify-between py-2 border-t border-border/60 text-xs">
          <span className="text-muted-foreground font-medium">Copy to Clipboard:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 hover:bg-muted text-foreground transition-colors"
            >
              {copiedAction === 'image' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Image</span>
            </button>
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 hover:bg-muted text-foreground transition-colors"
            >
              {copiedAction === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Rich HTML</span>
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 hover:bg-muted text-foreground transition-colors"
            >
              {copiedAction === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60 mt-2">
          <span className="text-xs text-emerald-500 font-medium">
            {toastMsg || ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20 transition-all"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download / Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { describe, it, expect } from 'vitest'
import { checkCanvasLimit, dataUrlToUint8Array, captureElementToDataUrl } from '../../src/features/export/exportImage'

describe('Export Image Utilities', () => {
  it('detects canvas limit thresholds correctly', () => {
    const mockElSmall = { scrollHeight: 1200 } as HTMLElement
    const resultSmall = checkCanvasLimit(mockElSmall, 2)
    expect(resultSmall.exceeds).toBe(false)
    expect(resultSmall.scaledHeight).toBe(2400)

    const mockElHuge = { scrollHeight: 9000 } as HTMLElement
    const resultHuge = checkCanvasLimit(mockElHuge, 2)
    expect(resultHuge.exceeds).toBe(true)
    expect(resultHuge.scaledHeight).toBe(18000)
  })

  it('converts base64 Data URLs to Uint8Array', () => {
    // "Hello World" in base64: SGVsbG8gV29ybGQ=
    const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ='
    const bytes = dataUrlToUint8Array(dataUrl)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBe(11)
    const decoded = Buffer.from(bytes).toString('utf8')
    expect(decoded).toBe('Hello World')
  })

  it('converts SVG URL-encoded Data URLs to Uint8Array without atob errors', () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
    const bytes = dataUrlToUint8Array(dataUrl)
    expect(bytes).toBeInstanceOf(Uint8Array)
    const decoded = Buffer.from(bytes).toString('utf8')
    expect(decoded).toBe(svgContent)
  })

  it('converts raw SVG XML Data URLs to Uint8Array without atob errors', () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'
    const dataUrl = `data:image/svg+xml;charset=utf-8,${svgContent}`
    const bytes = dataUrlToUint8Array(dataUrl)
    expect(bytes).toBeInstanceOf(Uint8Array)
    const decoded = Buffer.from(bytes).toString('utf8')
    expect(decoded).toBe(svgContent)
  })

  it('detects canvas limit thresholds using max of scrollHeight and offsetHeight', () => {
    const mockEl = { scrollHeight: 500, offsetHeight: 1500 } as HTMLElement
    const result = checkCanvasLimit(mockEl, 2)
    expect(result.exceeds).toBe(false)
    expect(result.height).toBe(1500)
    expect(result.scaledHeight).toBe(3000)
  })
})

describe('Export HTML & DOCX Utilities', () => {
  it('strips interactive overlay toolbars from HTML for clean export', async () => {
    const { stripExportToolbars } = await import('../../src/features/export/exportHtml')
    const htmlWithToolbars = `
      <div class="group relative">
        <div data-element-toolbar="true" class="no-export no-print">
          <span>Mermaid</span>
          <button class="mermak-copy-btn">Copy</button>
          <button class="mermak-export-btn">Export</button>
        </div>
        <svg><text>Diagram</text></svg>
      </div>
      <p>Start typing markdown or mermaid here...</p>
    `
    const cleaned = stripExportToolbars(htmlWithToolbars)
    expect(cleaned).not.toContain('Mermaid')
    expect(cleaned).not.toContain('mermak-copy-btn')
    expect(cleaned).not.toContain('mermak-export-btn')
    expect(cleaned).toContain('Diagram')
    expect(cleaned).toContain('Start typing markdown or mermaid here...')
  })

  it('generates a valid DOCX blob from markdown including mermaid blocks and paragraphs', async () => {
    const { generateDocxBlob } = await import('../../src/features/export/exportDocx')
    const markdown = '```mermaid\nerDiagram\n  USERS ||--o{ DOCUMENTS : owns\n```\n\n# Untitled\n\nStart typing markdown or mermaid here...'
    const blob = await generateDocxBlob(markdown, 'Untitled')
    expect(blob).toBeDefined()
    expect(blob.size).toBeGreaterThan(1000)
  })
})

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ImageRun,
} from 'docx'
import { renderMermaidDiagram, stripMermaidFences, isRawMermaid } from '@/lib/mermaid/renderer'
import { dataUrlToUint8Array } from './exportImage'
import { domToPng } from 'modern-screenshot'

/**
 * Parse inline markdown styles (bold, italic, inline code) into TextRun objects
 */
function parseMarkdownInline(text: string): TextRun[] {
  const runs: TextRun[] = []
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: 24 }))
    }
    if (match[2]) {
      // Bold
      runs.push(new TextRun({ text: match[2], bold: true, size: 24 }))
    } else if (match[3]) {
      // Italic
      runs.push(new TextRun({ text: match[3], italics: true, size: 24 }))
    } else if (match[4]) {
      // Inline code
      runs.push(
        new TextRun({
          text: match[4],
          font: 'Courier New',
          size: 20,
          color: 'be185d',
        })
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), size: 24 }))
  }

  return runs.length > 0 ? runs : [new TextRun({ text, size: 24 })]
}

/**
 * Convert an SVG diagram string into PNG binary bytes and dimensions for DOCX embedding.
 */
async function svgToPngBytes(
  svgString: string,
  maxWidth = 560
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  if (typeof document === 'undefined') {
    return null
  }

  // 1. Extract natural dimensions from SVG
  let origWidth = 600
  let origHeight = 400

  const viewBoxMatch = svgString.match(/viewBox=["']([0-9.\s-]+)["']/i)
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      origWidth = parts[2]
      origHeight = parts[3]
    }
  } else {
    const wMatch = svgString.match(/width=["']([0-9.]+)(px)?["']/i)
    const hMatch = svgString.match(/height=["']([0-9.]+)(px)?["']/i)
    if (wMatch && Number(wMatch[1]) > 0) origWidth = Number(wMatch[1])
    if (hMatch && Number(hMatch[1]) > 0) origHeight = Number(hMatch[1])
  }

  // Calculate target dimensions in Word DOCX (points)
  let docxWidth = Math.round(origWidth)
  let docxHeight = Math.round(origHeight)
  if (docxWidth > maxWidth) {
    docxHeight = Math.round((docxHeight * maxWidth) / docxWidth)
    docxWidth = maxWidth
  }
  docxWidth = Math.max(docxWidth, 60)
  docxHeight = Math.max(docxHeight, 40)

  // 2. High-fidelity rendering with off-screen DOM container + domToPng
  try {
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '-99999px'
    container.style.left = '-99999px'
    container.style.width = `${Math.ceil(docxWidth)}px`
    container.style.backgroundColor = '#ffffff'
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.innerHTML = svgString

    const svgEl = container.querySelector('svg')
    if (svgEl) {
      svgEl.style.maxWidth = '100%'
      svgEl.style.height = 'auto'
      svgEl.style.display = 'block'
    }

    document.body.appendChild(container)
    try {
      const dataUrl = await domToPng(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: Math.ceil(docxWidth),
      })
      const bytes = dataUrlToUint8Array(dataUrl)
      if (bytes && bytes.length > 0) {
        return {
          data: bytes,
          width: docxWidth,
          height: docxHeight,
        }
      }
    } finally {
      container.remove()
    }
  } catch (err) {
    console.warn('domToPng conversion failed, trying Image/Canvas fallback:', err)
  }

  // 3. Fallback: Image + Canvas conversion
  try {
    let cleanSvg = svgString
    if (!cleanSvg.includes('xmlns=')) {
      cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`

    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (e) => reject(e)
      img.src = svgDataUri
    })

    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(docxWidth * scale)
    canvas.height = Math.ceil(docxHeight * scale)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (pngBlob) {
        const arrayBuffer = await pngBlob.arrayBuffer()
        return {
          data: new Uint8Array(arrayBuffer),
          width: docxWidth,
          height: docxHeight,
        }
      }
    }
  } catch (err) {
    console.error('All SVG to PNG conversions failed for DOCX:', err)
  }

  return null
}

/**
 * Generate a DOCX document blob from markdown or raw mermaid text.
 */
export async function generateDocxBlob(markdown: string, title = 'Document'): Promise<Blob> {
  const trimmed = markdown.trim()
  const docElements: (Paragraph | Table)[] = []

  // Check if entire document is a standalone Mermaid diagram (or pure .mmd content)
  const isPureMermaid =
    isRawMermaid(trimmed) ||
    (trimmed.startsWith('```mermaid') && trimmed.endsWith('```') && !trimmed.slice(10, -3).includes('```'))

  if (isPureMermaid) {
    const diagramCode = stripMermaidFences(trimmed)
    let rendered = false

    if (diagramCode && typeof document !== 'undefined') {
      try {
        const renderRes = await renderMermaidDiagram(diagramCode, false)
        if (renderRes?.svg) {
          const pngImg = await svgToPngBytes(renderRes.svg)
          if (pngImg) {
            if (title && title !== 'Document' && title !== 'Untitled') {
              docElements.push(
                new Paragraph({
                  text: title,
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 240, after: 120 },
                })
              )
            }
            docElements.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: pngImg.data,
                    transformation: {
                      width: pngImg.width,
                      height: pngImg.height,
                    },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              })
            )
            rendered = true
          }
        }
      } catch (err) {
        console.warn('Failed to render standalone mermaid diagram for docx export:', err)
      }
    }

    if (!rendered) {
      if (title && title !== 'Document' && title !== 'Untitled') {
        docElements.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        )
      }
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: diagramCode || trimmed,
              font: 'Courier New',
              size: 20,
              color: '334155',
            }),
          ],
          spacing: { before: 200, after: 200 },
        })
      )
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docElements }],
    })
    return await Packer.toBlob(doc)
  }

  // Process mixed Markdown document
  const lines = markdown.split(/\r?\n/)
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBuffer = []
        codeLang = line.trim().replace(/^```+/, '').trim().toLowerCase()
      } else {
        inCodeBlock = false
        const codeText = codeBuffer.join('\n')

        if (codeLang === 'mermaid' || codeLang === 'mmd') {
          let diagramInserted = false
          if (typeof document !== 'undefined') {
            try {
              const res = await renderMermaidDiagram(codeText, false)
              if (res.svg) {
                const img = await svgToPngBytes(res.svg)
                if (img) {
                  docElements.push(
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: img.data,
                          transformation: {
                            width: img.width,
                            height: img.height,
                          },
                          type: 'png',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 240, after: 240 },
                    })
                  )
                  diagramInserted = true
                }
              }
            } catch (err) {
              console.warn('Failed to render mermaid diagram for docx:', err)
            }
          }

          if (!diagramInserted) {
            // Fallback to styled courier code block
            docElements.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: codeText,
                    font: 'Courier New',
                    size: 20, // 10pt
                    color: '334155',
                  }),
                ],
                spacing: { before: 200, after: 200 },
              })
            )
          }
        } else {
          // Regular non-mermaid code block
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeText,
                  font: 'Courier New',
                  size: 20, // 10pt
                  color: '334155',
                }),
              ],
              spacing: { before: 200, after: 200 },
            })
          )
        }
        codeBuffer = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // Skip YAML frontmatter
    if (i === 0 && line.trim() === '---') {
      let j = 1
      while (j < lines.length && lines[j].trim() !== '---') {
        j++
      }
      i = j
      continue
    }

    // Markdown table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [line]
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('|') &&
        lines[i + 1].trim().endsWith('|')
      ) {
        i++
        tableLines.push(lines[i])
      }

      const rows: TableRow[] = []
      for (const tLine of tableLines) {
        // Skip separator row |---|---|
        if (/^\|(\s*:?-+:?\s*\|)+$/.test(tLine.trim())) {
          continue
        }
        const cells = tLine
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim())

        const tableCells = cells.map(
          (c) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: parseMarkdownInline(c),
                  spacing: { before: 60, after: 60 },
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
              },
            })
        )

        rows.push(new TableRow({ children: tableCells }))
      }

      if (rows.length > 0) {
        docElements.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        )
      }
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('# ', '').trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 120 },
        })
      )
    } else if (line.startsWith('## ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('## ', '').trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 100 },
        })
      )
    } else if (line.startsWith('### ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('### ', '').trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list
      docElements.push(
        new Paragraph({
          children: parseMarkdownInline(line.replace(/^[-*]\s+/, '').trim()),
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
        })
      )
    } else if (/^\d+\.\s+/.test(line)) {
      // Numbered list
      docElements.push(
        new Paragraph({
          children: parseMarkdownInline(line.replace(/^\d+\.\s+/, '').trim()),
          numbering: { reference: 'numbered-list', level: 0 },
          spacing: { before: 60, after: 60 },
        })
      )
    } else if (line.startsWith('> ')) {
      // Blockquote / Alert
      docElements.push(
        new Paragraph({
          children: parseMarkdownInline(line.replace(/^>\s*/, '').trim()),
          indent: { left: 720 },
          spacing: { before: 120, after: 120 },
        })
      )
    } else if (line.trim().length > 0) {
      // Regular paragraph
      docElements.push(
        new Paragraph({
          children: parseMarkdownInline(line),
          spacing: { before: 80, after: 80 },
        })
      )
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: docElements,
      },
    ],
  })

  return await Packer.toBlob(doc)
}

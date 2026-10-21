import { domToPng, domToJpeg, domToWebp, domToSvg } from 'modern-screenshot'

export interface ImageExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'svg'
  scale?: number // 1, 2, 3, 4
  quality?: number // 0.1 to 1.0 (jpeg/webp)
  backgroundColor?: string | null // null = transparent (png)
  padding?: number
  scope?: 'full' | 'viewport' // 'full' = complete unclipped document/element (default), 'viewport' = visible window
}

const MAX_CANVAS_HEIGHT = 16384

/**
 * Check if element exceeds maximum safe canvas height
 */
export function checkCanvasLimit(element: HTMLElement, scale = 2): {
  exceeds: boolean
  height: number
  scaledHeight: number
} {
  const height = Math.max(element.scrollHeight || 0, element.offsetHeight || 0)
  const scaledHeight = height * scale
  return {
    exceeds: scaledHeight > MAX_CANVAS_HEIGHT,
    height,
    scaledHeight,
  }
}

/**
 * Export a DOM element to image data URL or blob.
 * Defaults to capturing the complete unclipped element or document.
 */
export async function captureElementToDataUrl(
  element: HTMLElement,
  options: ImageExportOptions
): Promise<string> {
  const scale = options.scale || 2
  const quality = options.quality ?? 0.95
  const backgroundColor = options.backgroundColor !== undefined ? options.backgroundColor : '#ffffff'
  const isViewport = options.scope === 'viewport'

  // If format is SVG and target is or contains an SVG diagram, serialize clean vector directly with light styling
  if (options.format === 'svg') {
    const sanitizeSvgToLight = (str: string) => {
      return str
        .replace(/#090d16/g, '#ffffff')
        .replace(/#0f172a/g, '#ffffff')
        .replace(/#1e293b/g, '#f8fafc')
        .replace(/#f1f5f9/g, '#0f172a')
        .replace(/#f8fafc/g, '#0f172a')
        .replace(/fill:\s*(#090d16|#000000)/gi, 'fill: #ffffff')
    }

    if (element.tagName.toLowerCase() === 'svg') {
      const svgStr = sanitizeSvgToLight(new XMLSerializer().serializeToString(element))
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`
    }
    const directSvg = element.querySelector('svg')
    if (directSvg && (element.classList.contains('group') || element.querySelectorAll('svg').length === 1)) {
      const svgStr = sanitizeSvgToLight(new XMLSerializer().serializeToString(directSvg))
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`
    }
  }

  // Calculate full unclipped dimensions
  let targetWidth = element.clientWidth || element.offsetWidth || 0
  let targetHeight = element.clientHeight || element.offsetHeight || 0

  if (!isViewport) {
    targetWidth = Math.max(element.scrollWidth || 0, element.offsetWidth || 0, element.clientWidth || 0)
    targetHeight = Math.max(element.scrollHeight || 0, element.offsetHeight || 0, element.clientHeight || 0)

    let maxContentBottom = targetHeight
    // Inspect child elements (e.g. wide Mermaid diagrams or tables) to avoid clipping
    element.querySelectorAll('*').forEach((child) => {
      const ch = child as HTMLElement
      if (ch.scrollWidth && ch.scrollWidth > targetWidth) {
        targetWidth = ch.scrollWidth
      }
      if (ch.scrollHeight && ch.scrollHeight > targetHeight) {
        targetHeight = ch.scrollHeight
      }
      if (typeof ch.offsetTop === 'number' && typeof ch.offsetHeight === 'number') {
        const bottom = ch.offsetTop + ch.offsetHeight
        if (bottom > maxContentBottom) {
          maxContentBottom = bottom
        }
      }
      if (ch instanceof SVGSVGElement && ch.viewBox?.baseVal) {
        const vb = ch.viewBox.baseVal
        if (vb.width && vb.width > targetWidth) {
          targetWidth = Math.ceil(vb.width) + 32
        }
        if (vb.height && vb.height > targetHeight) {
          targetHeight = Math.ceil(vb.height) + 32
        }
      }
    })

    targetHeight = Math.max(targetHeight, maxContentBottom) + 48
    targetWidth = Math.ceil(targetWidth)
  }

  // Clamp scale safely if total pixel height exceeds browser canvas limit
  let safeScale = scale
  if (targetHeight * safeScale > MAX_CANVAS_HEIGHT) {
    safeScale = Math.max(1, Math.floor(MAX_CANVAS_HEIGHT / targetHeight))
  }

  const screenshotOptions = {
    scale: safeScale,
    quality,
    backgroundColor,
    width: targetWidth,
    height: targetHeight,
    style: {
      width: `${targetWidth}px`,
      height: `${targetHeight}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      overflow: 'visible',
      transform: 'none',
      transformOrigin: 'top left',
      margin: '0',
    },
    features: {
      removeControlCharacter: true,
    },
    onCloneNode: (clone: Node) => {
      if (clone instanceof HTMLElement) {
        // Enforce clean white background and light-theme typography/tokens across all exports
        clone.classList.remove('dark')
        clone.setAttribute('data-theme', 'light')
        clone.style.setProperty('--background', '0 0% 100%')
        clone.style.setProperty('--foreground', '222.2 84% 4.9%')
        clone.style.setProperty('--card', '0 0% 100%')
        clone.style.setProperty('--card-foreground', '222.2 84% 4.9%')
        clone.style.setProperty('--popover', '0 0% 100%')
        clone.style.setProperty('--popover-foreground', '222.2 84% 4.9%')
        clone.style.setProperty('--muted', '210 40% 96.1%')
        clone.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%')
        clone.style.setProperty('--border', '214.3 31.8% 91.4%')
        clone.style.setProperty('color-scheme', 'light')
        clone.style.backgroundColor = backgroundColor || '#ffffff'
        clone.style.color = '#0f172a'

        // Remove dark class from all nested children
        clone.querySelectorAll('.dark').forEach((el) => {
          el.classList.remove('dark')
        })

        // Ensure text elements that had light text in dark mode use dark text
        clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, td, th, blockquote').forEach((el) => {
          const htmlEl = el as HTMLElement
          const c = htmlEl.style?.color
          if (c === 'rgb(248, 250, 252)' || c === 'rgb(241, 245, 249)' || c === '#f8fafc' || c === '#f1f5f9') {
            htmlEl.style.color = '#0f172a'
          }
        })

        // Ensure code blocks use light background and dark text
        clone.querySelectorAll('pre').forEach((pre) => {
          pre.style.backgroundColor = '#f8fafc'
          pre.style.borderColor = '#e2e8f0'
          pre.style.color = '#0f172a'
        })

        // Ensure SVG elements (such as Mermaid diagrams) use light fills and borders
        clone.querySelectorAll('svg rect').forEach((rect) => {
          const r = rect as SVGRectElement
          const fill = r.getAttribute('fill')
          if (fill === '#090d16' || fill === '#000000' || fill === '#000' || fill === '#1e293b' || fill === 'rgb(9, 13, 22)') {
            r.setAttribute('fill', '#ffffff')
          }
        })

        clone.querySelectorAll('svg style').forEach((st) => {
          if (st.textContent) {
            st.textContent = st.textContent
              .replace(/#090d16/g, '#ffffff')
              .replace(/#0f172a/g, '#ffffff')
              .replace(/#1e293b/g, '#f8fafc')
              .replace(/#f1f5f9/g, '#0f172a')
              .replace(/#f8fafc/g, '#0f172a')
          }
        })

        if (!isViewport) {
          clone.style.width = `${targetWidth}px`
          clone.style.height = `${targetHeight}px`
          clone.style.maxWidth = 'none'
          clone.style.maxHeight = 'none'
          clone.style.overflow = 'visible'
          clone.style.transform = 'none'
          clone.scrollTop = 0
          clone.scrollLeft = 0

          // Unclip any nested scroll containers
          clone.querySelectorAll('*').forEach((node) => {
            const el = node as HTMLElement
            if (el.style) {
              if (el.style.transform && el.style.transform.includes('scale')) {
                el.style.transform = 'none'
              }
              if (
                el.scrollHeight > el.clientHeight ||
                el.scrollWidth > el.clientWidth ||
                el.classList.contains('overflow-x-auto') ||
                el.classList.contains('overflow-y-auto')
              ) {
                el.style.overflow = 'visible'
                el.style.maxWidth = 'none'
                el.style.maxHeight = 'none'
                el.scrollTop = 0
                el.scrollLeft = 0
              }
            }
          })
        }

        // Always remove floating UI elements / toolbars from the screenshot
        clone
          .querySelectorAll(
            '[data-element-toolbar], .no-export, .no-print, .mermak-copy-btn, .mermak-export-btn, .mermak-export-code'
          )
          .forEach((el) => el.remove())
      }
    },
  }

  switch (options.format) {
    case 'jpeg':
      return await domToJpeg(element, screenshotOptions)
    case 'webp':
      return await domToWebp(element, screenshotOptions)
    case 'svg':
      return await domToSvg(element, screenshotOptions)
    case 'png':
    default:
      return await domToPng(element, screenshotOptions)
  }
}

/**
 * Trigger browser file download from Blob directly
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Trigger browser file download from Data URL
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  if (dataUrl.startsWith('blob:')) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  const link = document.createElement('a')
  link.download = filename

  let objectUrl: string | null = null
  try {
    const bytes = dataUrlToUint8Array(dataUrl)
    const isSvg = filename.endsWith('.svg') || dataUrl.includes('image/svg+xml')
    const mime = isSvg ? 'image/svg+xml;charset=utf-8' : 'application/octet-stream'
    const blob = new Blob([bytes as unknown as BlobPart], { type: mime })
    objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
  } catch {
    link.href = dataUrl
  }

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  if (objectUrl) {
    setTimeout(() => URL.revokeObjectURL(objectUrl!), 1000)
  }
}

/**
 * Convert Data URL (Base64 or URL/text encoded) to Uint8Array for binary saving
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex === -1) {
    return new TextEncoder().encode(dataUrl)
  }

  const meta = dataUrl.substring(0, commaIndex)
  const rawData = dataUrl.substring(commaIndex + 1)

  if (meta.includes(';base64')) {
    const cleanBase64 = rawData.replace(/\s/g, '')
    const binaryString = atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } else {
    // URL-encoded or UTF-8 plain text (e.g. data:image/svg+xml;charset=utf-8,...)
    let decodedText: string
    try {
      decodedText = decodeURIComponent(rawData)
    } catch {
      decodedText = rawData
    }
    return new TextEncoder().encode(decodedText)
  }
}

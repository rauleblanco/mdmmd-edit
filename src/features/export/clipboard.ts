import { captureElementToDataUrl, dataUrlToUint8Array, type ImageExportOptions } from './exportImage'

/**
 * Copy a DOM element as a high-resolution PNG image to the system clipboard.
 */
export async function copyElementAsPng(
  element: HTMLElement,
  scale = 2,
  options?: Partial<ImageExportOptions>
): Promise<boolean> {
  try {
    const dataUrl = await captureElementToDataUrl(element, {
      format: 'png',
      scale,
      ...options,
    })
    const bytes = dataUrlToUint8Array(dataUrl)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'image/png' })

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
    return true
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err)
    return false
  }
}

/**
 * Copy rich formatted HTML to clipboard.
 */
export async function copyAsRichHtml(html: string): Promise<boolean> {
  try {
    const blob = new Blob([html], { type: 'text/html' })
    const textBlob = new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob,
      }),
    ])
    return true
  } catch (err) {
    console.error('Failed to copy HTML to clipboard:', err)
    return false
  }
}

/**
 * Copy plain Markdown to clipboard.
 */
export async function copyAsPlainMarkdown(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy Markdown to clipboard:', err)
    return false
  }
}

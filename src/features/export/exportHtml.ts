/**
 * Build a standalone, self-contained HTML file with styles and fonts inlined.
 */
export function buildStandaloneHtml(
  contentHtml: string,
  title = 'Document',
  isDark = false
): string {
  return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
  <style>
    :root {
      --background: #ffffff;
      --foreground: #090d16;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --primary: #2563eb;
    }
    .dark {
      --background: #090d16;
      --foreground: #f8fafc;
      --muted: #1e293b;
      --muted-foreground: #94a3b8;
      --border: #1e293b;
      --primary: #3b82f6;
    }
    body {
      background-color: var(--background);
      color: var(--foreground);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
    }
    pre {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Menlo, monospace;
      font-size: 13px;
    }
    code {
      font-family: 'JetBrains Mono', Menlo, monospace;
      font-size: 0.9em;
      background: var(--muted);
      padding: 2px 6px;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background: var(--muted);
    }
    blockquote {
      margin: 20px 0;
      padding: 12px 20px;
      border-left: 4px solid var(--primary);
      background: var(--muted);
      border-radius: 0 8px 8px 0;
    }
    .gh-alert, .markdown-alert {
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 8px;
      border-left: 4px solid var(--primary);
      background: var(--muted);
    }
    .markdown-alert-note { border-left-color: #2563eb; }
    .markdown-alert-tip { border-left-color: #10b981; }
    .markdown-alert-important { border-left-color: #8b5cf6; }
    .markdown-alert-warning { border-left-color: #f59e0b; }
    .markdown-alert-caution { border-left-color: #ef4444; }
    .mermaid-block {
      margin: 20px 0;
      text-align: center;
      display: flex;
      justify-content: center;
    }
    img, svg {
      max-width: 100%;
      height: auto;
    }
    [data-element-toolbar], .mermak-copy-btn, .mermak-export-btn, .mermak-export-code, .no-export, .no-print {
      display: none !important;
    }
    @page {
      margin: 15mm;
      size: auto;
    }
    @media print {
      html, body {
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        height: auto !important;
        overflow: visible !important;
      }
      .container {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      table, pre, blockquote, .gh-alert, .markdown-alert, .mermaid-block, svg, img, tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      h1, h2, h3, h4, h5, h6 {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="container markdown-body">
    ${contentHtml}
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Strip interactive overlay toolbars and buttons before exporting to HTML/PDF.
 */
export function stripExportToolbars(html: string): string {
  if (!html) return ''
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    doc
      .querySelectorAll('[data-element-toolbar], .no-export, .no-print, .mermak-copy-btn, .mermak-export-btn, .mermak-export-code')
      .forEach((el) => el.remove())
    return doc.body.innerHTML
  }
  return html
    .replace(/<div[^>]*data-element-toolbar[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<button[^>]*class="[^"]*mermak-(?:copy|export)[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '')
}

import mermaid from 'mermaid'

// Simple content hash function for caching rendered diagrams
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

// In-memory cache for rendered SVG strings
const svgCache = new Map<string, string>()

let isInitialized = false

export function initMermaid(isDark = false): void {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark ? 'dark' : 'default',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: isDark
      ? {
          darkMode: true,
          background: '#090d16',
          primaryColor: '#3b82f6',
          primaryTextColor: '#f1f5f9',
          primaryBorderColor: '#60a5fa',
          lineColor: '#94a3b8',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
        }
      : {
          darkMode: false,
          background: '#ffffff',
          primaryColor: '#2563eb',
          primaryTextColor: '#0f172a',
          primaryBorderColor: '#3b82f6',
          lineColor: '#64748b',
          secondaryColor: '#f8fafc',
          tertiaryColor: '#f1f5f9',
        },
  })
  isInitialized = true
}

export interface MermaidRenderResult {
  svg: string | null
  error: string | null
  errorLine?: number
}

let diagramCounter = 0

/**
 * Strip Markdown code fences (e.g. ```mermaid ... ``` or ``` ... ```) from a diagram string.
 */
export function stripMermaidFences(code: string): string {
  let cleaned = code.trim()
  cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '')
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  return cleaned.trim()
}

/**
 * Render a Mermaid diagram string to inline SVG.
 * Handles errors gracefully without crashing the app.
 */
export async function renderMermaidDiagram(
  code: string,
  isDark = false
): Promise<MermaidRenderResult> {
  const cleaned = stripMermaidFences(code)
  if (!cleaned) {
    return { svg: null, error: 'Empty diagram definition' }
  }

  const cacheKey = `${isDark ? 'dark' : 'light'}:${hashString(cleaned)}`
  if (svgCache.has(cacheKey)) {
    return { svg: svgCache.get(cacheKey)!, error: null }
  }

  // Re-initialize if theme changed
  initMermaid(isDark)

  const id = `mermaid-diagram-${Date.now()}-${++diagramCounter}`

  try {
    const { svg } = await mermaid.render(id, cleaned)
    svgCache.set(cacheKey, svg)
    return { svg, error: null }
  } catch (err: unknown) {
    // Clean up any error element injected into DOM by mermaid
    const errorEl = document.getElementById(id)
    if (errorEl) {
      errorEl.remove()
    }
    const dErrorEl = document.getElementById(`d${id}`)
    if (dErrorEl) {
      dErrorEl.remove()
    }

    const message = err instanceof Error ? err.message : String(err)
    
    // Extract line number if present
    const lineMatch = message.match(/line\s+(\d+)/i) || message.match(/on line (\d+)/i)
    const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : undefined

    return {
      svg: null,
      error: message,
      errorLine,
    }
  }
}

/**
 * Check if a filename corresponds to a Mermaid diagram (.mmd, .mermaid)
 */
export function isMermaidFile(fileName?: string | null): boolean {
  if (!fileName) return false
  return /\.(mmd|mermaid)$/i.test(fileName)
}

/**
 * Check if a text string looks like raw Mermaid syntax
 * (e.g. pasted directly without ```mermaid code fence, or an .mmd file content)
 */
export function isRawMermaid(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  const mermaidKeywords = [
    'graph',
    'flowchart',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'erDiagram',
    'journey',
    'gantt',
    'pie',
    'gitGraph',
    'mindmap',
    'timeline',
    'quadrantChart',
    'sankey-beta',
    'xychart-beta',
    'block-beta',
    'architecture-beta',
    'packet-beta',
    'requirementDiagram',
    'kanban',
    'C4Context',
    'C4Container',
    'C4Component',
    'C4Dynamic',
    'C4Deployment',
    'zenuml',
  ]

  // Check lines ignoring comments (%%) and directive lines
  const lines = trimmed.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('%%')) continue
    return mermaidKeywords.some((keyword) => line.startsWith(keyword))
  }

  return false
}


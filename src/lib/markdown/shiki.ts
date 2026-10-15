import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

const POPULAR_LANGUAGES = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'json',
  'yaml',
  'markdown',
  'mdx',
  'html',
  'css',
  'scss',
  'python',
  'rust',
  'go',
  'bash',
  'sh',
  'zsh',
  'shell',
  'c',
  'cpp',
  'csharp',
  'java',
  'kotlin',
  'swift',
  'sql',
  'graphql',
  'dockerfile',
  'diff',
  'xml',
  'toml',
  'ini',
  'mermaid',
]

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark-default'],
      langs: POPULAR_LANGUAGES,
    })
  }
  return highlighterPromise
}

/**
 * Highlight a code string synchronously if loaded, or fallback to safe escaped HTML.
 */
export async function highlightCode(
  code: string,
  lang: string,
  isDark = false
): Promise<string> {
  try {
    const highlighter = await getHighlighter()
    const theme = isDark ? 'github-dark-default' : 'github-light'

    // Verify language is loaded or fallback to text
    const supportedLangs = highlighter.getLoadedLanguages()
    const targetLang = supportedLangs.includes(lang.toLowerCase()) ? lang.toLowerCase() : 'text'

    return highlighter.codeToHtml(code, {
      lang: targetLang,
      theme,
    })
  } catch (error) {
    console.warn(`Failed to highlight code with language "${lang}":`, error)
    // Escape HTML as fallback
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `<pre><code>${escaped}</code></pre>`
  }
}

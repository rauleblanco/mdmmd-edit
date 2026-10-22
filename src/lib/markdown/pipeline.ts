import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import remarkEmoji from 'remark-emoji'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { remarkAlerts } from './plugins/remarkAlerts'
import { customSanitizeSchema } from './sanitizeSchema'

import GithubSlugger from 'github-slugger'

export interface TocItem {
  id: string
  text: string
  level: number
  line: number
}

export interface ProcessedDocument {
  html: string
  frontmatter: Record<string, unknown> | null
  toc: TocItem[]
  rawContent: string
}

/**
 * Extract Table of Contents heading structure from raw markdown.
 */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const headings: TocItem[] = []
  const lines = markdown.split(/\r?\n/)
  let inCodeBlock = false
  let inFrontmatter = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true
      continue
    }
    if (inFrontmatter) {
      if (line.trim() === '---') {
        inFrontmatter = false
      }
      continue
    }

    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const rawText = match[2].trim().replace(/\s+#+$/, '').trim()
      // Strip markdown formatting from TOC text
      const cleanText = rawText
        .replace(/[*_~`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      const id = slugger.slug(cleanText)

      headings.push({ id, text: cleanText, level, line: i + 1 })
    }
  }

  return headings
}

/**
 * Build the unified processor instance.
 */
function createProcessor() {
  return (
    unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml', 'toml'])
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkEmoji)
      .use(remarkAlerts)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: 'append',
        properties: { className: ['heading-anchor'], ariaHidden: 'true' },
        content: {
          type: 'element',
          tagName: 'span',
          properties: { className: ['heading-anchor-icon'] },
          children: [{ type: 'text', value: ' #' }],
        },
      })
      .use(rehypeKatex)
      .use(rehypeSanitize, customSanitizeSchema)
      .use(rehypeStringify)
  )
}

const processor = createProcessor()

/**
/**
 * Browser-safe YAML frontmatter parser.
 */
function parseFrontmatter(markdown: string): { data: Record<string, unknown> | null; content: string } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: null, content: markdown }

  const yamlBlock = match[1]
  const content = match[2]
  const data: Record<string, unknown> = {}

  for (const line of yamlBlock.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      let val: unknown = line.slice(colonIdx + 1).trim()
      const strVal = String(val)
      if (strVal.startsWith('"') && strVal.endsWith('"')) val = strVal.slice(1, -1)
      else if (strVal.startsWith("'") && strVal.endsWith("'")) val = strVal.slice(1, -1)
      else if (strVal.startsWith('[') && strVal.endsWith(']')) {
        val = strVal
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      } else if (strVal === 'true') val = true
      else if (strVal === 'false') val = false
      else if (!isNaN(Number(strVal)) && strVal !== '') val = Number(strVal)
      data[key] = val
    }
  }

  return { data, content }
}

/**
 * Process a Markdown document string into HTML, frontmatter, and TOC.
 */
export async function processMarkdown(content: string): Promise<ProcessedDocument> {
  // Parse frontmatter
  const { data: parsedFrontmatter, content: bodyContent } = parseFrontmatter(content)

  const toc = extractToc(content)

  // Run unified pipeline
  const file = await processor.process(bodyContent)
  const html = String(file)

  return {
    html,
    frontmatter: parsedFrontmatter,
    toc,
    rawContent: content,
  }
}

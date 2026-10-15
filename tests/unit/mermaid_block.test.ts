import { describe, it, expect } from 'vitest'
import { processMarkdown } from '../../src/lib/markdown/pipeline'
import { stripMermaidFences } from '../../src/lib/mermaid/renderer'

describe('Mermaid Fence Stripping & Markdown Processing', () => {
  it('strips ```mermaid fences cleanly', () => {
    const raw = '```mermaid\ngraph TD\n  A --> B\n```'
    expect(stripMermaidFences(raw)).toBe('graph TD\n  A --> B')
  })

  it('strips ``` fences without language tag', () => {
    const raw = '```\nsequenceDiagram\n  Alice->>Bob: Hi\n```'
    expect(stripMermaidFences(raw)).toBe('sequenceDiagram\n  Alice->>Bob: Hi')
  })

  it('leaves clean mermaid code untouched', () => {
    const raw = 'flowchart LR\n  X --> Y'
    expect(stripMermaidFences(raw)).toBe('flowchart LR\n  X --> Y')
  })

  it('generates expected html for fenced mermaid in markdown pipeline', async () => {
    const md = '```mermaid\ngraph TD\n  A --> B\n```'
    const result = await processMarkdown(md)
    expect(result.html).toContain('class="language-mermaid"')
    expect(result.html).toContain('graph TD')
  })
})

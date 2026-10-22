import { describe, it, expect } from 'vitest'
import { processMarkdown, extractToc } from '../../src/lib/markdown/pipeline'

describe('Markdown Processing Pipeline', () => {
  it('extracts TOC headers accurately with levels', () => {
    const md = `
# Main Header
Some introduction.
## Sub Section A
Content A.
### Deep Detail
Detail content.
## Sub Section B
Content B.
`
    const toc = extractToc(md)
    expect(toc).toHaveLength(4)
    expect(toc[0]).toEqual({ id: 'main-header', text: 'Main Header', level: 1, line: 2 })
    expect(toc[1]).toEqual({ id: 'sub-section-a', text: 'Sub Section A', level: 2, line: 4 })
    expect(toc[2]).toEqual({ id: 'deep-detail', text: 'Deep Detail', level: 3, line: 6 })
    expect(toc[3]).toEqual({ id: 'sub-section-b', text: 'Sub Section B', level: 2, line: 8 })
  })

  it('generates TOC IDs that precisely match rehype-slug HTML IDs for complex and duplicate headings', async () => {
    const md = `
## Section 1: Advanced Distributed Architecture & System Design
## Section 2: Advanced Distributed Architecture & System Design
### Duplicate Title
### Duplicate Title
`
    const result = await processMarkdown(md)
    expect(result.toc).toHaveLength(4)
    expect(result.toc[0].id).toBe('section-1-advanced-distributed-architecture--system-design')
    expect(result.toc[1].id).toBe('section-2-advanced-distributed-architecture--system-design')
    expect(result.toc[2].id).toBe('duplicate-title')
    expect(result.toc[3].id).toBe('duplicate-title-1')

    for (const item of result.toc) {
      expect(result.html).toContain(`id="${item.id}"`)
    }
  })

  it('extracts TOC from the stress test large document where every heading ID matches the rendered HTML', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const largeDoc = fs.readFileSync(path.resolve(__dirname, '../../fixtures/large-document.md'), 'utf-8')
    const result = await processMarkdown(largeDoc)
    expect(result.toc.length).toBeGreaterThan(100)
    for (const item of result.toc) {
      expect(result.html).toContain(`id="${item.id}"`)
      expect(item.line).toBeGreaterThan(0)
    }
  })

  it('parses frontmatter metadata cleanly', async () => {
    const md = `---
title: "Document Title"
author: "Engineer"
version: 1
published: true
tags: [alpha, beta]
---

# Content
`
    const result = await processMarkdown(md)
    expect(result.frontmatter).not.toBeNull()
    expect(result.frontmatter?.title).toBe('Document Title')
    expect(result.frontmatter?.author).toBe('Engineer')
    expect(result.frontmatter?.version).toBe(1)
    expect(result.frontmatter?.published).toBe(true)
    expect(result.frontmatter?.tags).toEqual(['alpha', 'beta'])
  })

  it('renders GFM tables and math formulas', async () => {
    const md = `
| Header 1 | Header 2 |
| :--- | ---: |
| Value A | 100 |

Inline math $E = mc^2$ and block math:

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$
`
    const result = await processMarkdown(md)
    expect(result.html).toContain('<table')
    expect(result.html).toContain('Value A')
    expect(result.html).toContain('katex')
  })

  it('renders GitHub alerts with custom container', async () => {
    const md = `
> [!NOTE]
> Important operational notice.

> [!WARNING]
> Breaking change caution.
`
    const result = await processMarkdown(md)
    expect(result.html).toContain('gh-alert')
    expect(result.html).toContain('gh-alert-note')
    expect(result.html).toContain('gh-alert-warning')
  })
})

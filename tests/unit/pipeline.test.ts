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
    expect(toc[0]).toEqual({ id: 'main-header', text: 'Main Header', level: 1 })
    expect(toc[1]).toEqual({ id: 'sub-section-a', text: 'Sub Section A', level: 2 })
    expect(toc[2]).toEqual({ id: 'deep-detail', text: 'Deep Detail', level: 3 })
    expect(toc[3]).toEqual({ id: 'sub-section-b', text: 'Sub Section B', level: 2 })
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

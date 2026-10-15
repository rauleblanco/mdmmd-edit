import { describe, it, expect } from 'vitest'
import { isRawMermaid, isMermaidFile } from '../../src/lib/mermaid/renderer'

describe('Mermaid Syntax Detection', () => {
  it('correctly detects raw mermaid keywords', () => {
    expect(isRawMermaid('flowchart TD\n  A --> B')).toBe(true)
    expect(isRawMermaid('graph LR\n  X --- Y')).toBe(true)
    expect(isRawMermaid('sequenceDiagram\n  Alice->>Bob: Hello')).toBe(true)
    expect(isRawMermaid('gitGraph\n  commit')).toBe(true)
    expect(isRawMermaid('mindmap\n  root((Idea))')).toBe(true)
    expect(isRawMermaid('kanban\n  todo')).toBe(true)
    expect(isRawMermaid('stateDiagram-v2\n  [*] --> Still')).toBe(true)
    expect(isRawMermaid('erDiagram\n  CUSTOMER ||--o{ ORDER : places')).toBe(true)
    expect(isRawMermaid('gantt\n  title Project')).toBe(true)
  })

  it('correctly detects raw mermaid with leading comments or directives', () => {
    expect(isRawMermaid('%% This is a comment\ngraph TD\n  A --> B')).toBe(true)
    expect(isRawMermaid('%%{init: {"theme": "dark"}}%%\nsequenceDiagram\n  A->>B: Hi')).toBe(true)
    expect(isRawMermaid('\n\n%% Comment\nflowchart LR\n  X --> Y')).toBe(true)
  })

  it('identifies .mmd and .mermaid files by extension', () => {
    expect(isMermaidFile('diagram.mmd')).toBe(true)
    expect(isMermaidFile('/path/to/my-flowchart.MMD')).toBe(true)
    expect(isMermaidFile('model.mermaid')).toBe(true)
    expect(isMermaidFile('document.md')).toBe(false)
    expect(isMermaidFile('README.markdown')).toBe(false)
    expect(isMermaidFile(null)).toBe(false)
  })

  it('rejects regular markdown text and headers', () => {
    expect(isRawMermaid('# Title\nSome content')).toBe(false)
    expect(isRawMermaid('The graph shows growth over time.')).toBe(false)
    expect(isRawMermaid('```mermaid\nflowchart TD\n```')).toBe(false)
    expect(isRawMermaid('')).toBe(false)
  })
})

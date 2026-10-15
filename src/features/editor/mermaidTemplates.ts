export interface MermaidTemplate {
  id: string
  title: string
  category: 'workflow' | 'architecture' | 'database' | 'management' | 'charts'
  description: string
  code: string
}

export const MERMAID_TEMPLATES: MermaidTemplate[] = [
  {
    id: 'flowchart-td',
    title: 'Flowchart (Top to Bottom)',
    category: 'workflow',
    description: 'Decision flow with branching logic and styled states',
    code: `graph TD
    Start([User Request]) --> Validate{Is Valid?}
    Validate -->|Yes| Process[Process Data]
    Validate -->|No| Reject[Return Error 400]
    Process --> Cache[(Update Cache)]
    Cache --> Success([Return 200 OK])
    Reject --> End([End Request])
    Success --> End`,
  },
  {
    id: 'flowchart-lr',
    title: 'Flowchart (Left to Right)',
    category: 'workflow',
    description: 'Horizontal step-by-step pipeline',
    code: `graph LR
    Input[Markdown Input] --> Parser[AST Parser]
    Parser --> Sanitizer[Rehype Sanitize]
    Sanitizer --> Renderer[Live Preview]
    Renderer --> Export[PNG / PDF / DOCX]`,
  },
  {
    id: 'sequence',
    title: 'Sequence Diagram',
    category: 'workflow',
    description: 'Message interactions between actors and services',
    code: `sequenceDiagram
    autonumber
    actor User
    participant App as md/mmd Edit
    participant Parser as Pipeline Engine
    participant Mermaid as Mermaid Renderer

    User->>App: Paste or Type Markdown
    App->>Parser: Transform AST & Sanitize
    Parser->>Mermaid: Extract Mermaid Diagrams
    Mermaid-->>App: Render Scalable SVG
    App-->>User: Instant Visual Update`,
  },
  {
    id: 'class-diagram',
    title: 'Class Diagram',
    category: 'architecture',
    description: 'Object-oriented classes, attributes, methods, and inheritance',
    code: `classDiagram
    class Document {
      +String id
      +String title
      +String content
      +Boolean isDirty
      +save() void
      +exportPDF() Promise
    }
    class TabManager {
      +List~Document~ tabs
      +String activeTabId
      +addTab(doc) void
      +closeTab(id) void
    }
    class Renderer {
      +parseMarkdown(source) Element
      +renderMermaid(code) SVG
    }
    TabManager o-- Document : manages
    Document --> Renderer : renders with`,
  },
  {
    id: 'state-diagram',
    title: 'State Machine Diagram',
    category: 'workflow',
    description: 'Lifecycle states and transition events',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Editing : User types
    Editing --> Saving : Cmd/Ctrl + S
    Saving --> Clean : Disk write success
    Saving --> Error : Write failed
    Error --> Editing : Retry
    Clean --> Editing : New edits
    Clean --> Closed : Close Tab
    Editing --> ConfirmClose : Close clicked
    ConfirmClose --> Clean : Save first
    ConfirmClose --> Closed : Discard changes
    Closed --> [*]`,
  },
  {
    id: 'er-diagram',
    title: 'Entity Relationship (ER)',
    category: 'database',
    description: 'Relational database schema with keys and cardinalities',
    code: `erDiagram
    USERS ||--o{ DOCUMENTS : owns
    DOCUMENTS ||--o{ EXPORTS : generates
    DOCUMENTS ||--o{ TAGS : categorized_by

    USERS {
      string id PK
      string email
      string username
      datetime created_at
    }
    DOCUMENTS {
      string id PK
      string user_id FK
      string title
      text markdown_body
      boolean is_dirty
      datetime updated_at
    }
    EXPORTS {
      string id PK
      string document_id FK
      string format
      string file_path
      datetime exported_at
    }`,
  },
  {
    id: 'git-graph',
    title: 'Git Graph',
    category: 'management',
    description: 'Branches, commits, merges, and release tags',
    code: `gitGraph
    commit id: "Initial Commit"
    branch feature/wysiwyg
    checkout feature/wysiwyg
    commit id: "Add WYSIWYG Toolbar"
    commit id: "Add Mermaid Wizard"
    checkout main
    merge feature/wysiwyg id: "Merge PR #10"
    branch release/v1.1
    checkout release/v1.1
    commit id: "Version bump 1.1.0" tag: "v1.1.0"
    checkout main
    merge release/v1.1 id: "Release 1.1"`,
  },
  {
    id: 'mindmap',
    title: 'Mindmap',
    category: 'architecture',
    description: 'Hierarchical brain-storming tree',
    code: `mindmap
  root((md/mmd Edit))
    WYSIWYG Suite
      Rich Toolbar
      Table Generator
      Math Formula Helper
      GitHub Alerts
    Mermaid Visuals
      Flowcharts
      Sequence
      Git Graphs
      Interactive Wizard
    Export Formats
      Retina PNG
      Vector SVG
      Searchable PDF
      Word DOCX`,
  },
  {
    id: 'kanban',
    title: 'Kanban Board',
    category: 'management',
    description: 'Agile project tracking boards',
    code: `kanban
  Todo
    [Setup CI Build Action]
    [Ad-hoc macOS Notarization]
  In Progress
    [WYSIWYG Markdown Toolbar]
    [Visual Mermaid Wizard]
  Done
    [Save & Save As Shortcuts]
    [Light & Dark Mode Switch]
    [Paste Dialog Layout Fix]`,
  },
  {
    id: 'gantt',
    title: 'Gantt Project Schedule',
    category: 'management',
    description: 'Project timeline, milestones, and task dependencies',
    code: `gantt
    title Application Development Roadmap
    dateFormat  YYYY-MM-DD
    section Core Shell
    App Scaffold        :done, des1, 2026-10-01, 2026-10-03
    Markdown Pipeline   :done, des2, 2026-10-03, 2026-10-06
    section Editing Suite
    WYSIWYG Toolbar     :active, des3, 2026-10-07, 3d
    Mermaid Wizard      :active, des4, after des3, 2d
    section Release
    Packaging & CI      :des5, 2026-10-12, 2d`,
  },
  {
    id: 'pie-chart',
    title: 'Pie Chart',
    category: 'charts',
    description: 'Proportional dataset breakdown',
    code: `pie title Document Content Breakdown
    "Markdown Text" : 55
    "Mermaid Diagrams" : 25
    "Code Blocks" : 12
    "Mathematical Formulas" : 8`,
  },
]

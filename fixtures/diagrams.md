# Mermaid Diagram Types Showcase

This document contains one example of each major Mermaid diagram type supported in MerMark Viewer.

---

## 1. Flowchart
```mermaid
graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me see}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
```

---

## 2. Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts prevail...
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

---

## 3. Class Diagram
```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
```

---

## 4. State Diagram
```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

---

## 5. Entity Relationship (ER) Diagram
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
```

---

## 6. Gantt Chart
```mermaid
gantt
    title Software Development Lifecycle
    dateFormat  YYYY-MM-DD
    section Planning
    Scaffold Project       :done,    des1, 2026-10-01,2026-10-03
    Design Pipeline        :active,  des2, 2026-10-04, 3d
    section Implementation
    Markdown Renderer      :         des3, after des2, 5d
    Export Engine          :         des4, after des3, 4d
```

---

## 7. Pie Chart
```mermaid
pie title Markdown Pipeline Time Distribution
    "AST Parsing" : 30
    "KaTeX Math" : 20
    "Mermaid SVG" : 35
    "DOM Rendering" : 15
```

---

## 8. User Journey
```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

---

## 9. Git Graph
```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

---

## 10. Mindmap
```mermaid
mindmap
  root((Engineering))
    Frontend
      React
      Vite
      Tailwind
    Backend
      Node
      Electron IPC
    Formats
      Markdown
      Mermaid
      KaTeX
```

---

## 11. Timeline
```mermaid
timeline
    title History of Markdown
    2004 : John Gruber creates Markdown
    2014 : CommonMark spec established
    2017 : GitHub Flavored Markdown RFC
    2026 : MerMark Viewer Released
```

---

## 12. Quadrant Chart
```mermaid
quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
```

---

## 13. Kanban
```mermaid
kanban
  Todo
    [Set up Vitest]
    [Playwright e2e tests]
  In Progress
    [Markdown preview]
    [Mermaid lightbox]
  Done
    [Project scaffolding]
    [Design tokens]
```

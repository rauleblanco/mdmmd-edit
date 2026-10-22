# md/mmd Edit ⚡

> **A modern, production-grade Markdown (.md) + Mermaid (.mmd) desktop editor and renderer.**  
> Crafted with Electron, Vite, React 18, TypeScript, Tailwind CSS, CodeMirror 6, unified, and Shiki.

[![CI Build](https://github.com/rauleblanco/mdmmd-edit/actions/workflows/build.yml/badge.svg)](https://github.com/rauleblanco/mdmmd-edit/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux-brightgreen.svg)]()

---

## ✨ Features

### 📖 Unified Markdown & Mermaid Pipeline
- **GitHub Flavored Markdown (GFM)**: Tables with custom alignments, task lists, strikethrough, autolinks, and footnotes.
- **Full Mermaid Diagram Engine (.mmd)**: Flowcharts, Sequence Diagrams, Class Diagrams, State Diagrams, ER Diagrams, Git Graphs, Mindmaps, Gantt charts, Timelines, Kanban boards, and C4 Architecture models.
- **Native .md and .mmd File Support**: Open, edit, create, and save `.mmd` diagrams as easily as `.md` documents.
- **Interactive Diagram Lightbox**: Click any diagram to open a full-screen pan and zoom lightbox with 25%–300% zoom controls.
- **Dedicated "Paste In" Feature**: Dedicated dialog (`Cmd/Ctrl+V` or toolbar button) to paste raw Mermaid code or Markdown snippets with instant rendering and built-in template presets (Flowchart, Sequence, Git Graph, Mindmap, Kanban).
- **KaTeX Mathematics**: Full support for inline math (`$E = mc^2$`) and block math equations (`$$\int_0^\infty f(x)dx$$`).
- **Shiki Syntax Highlighting**: Dual-theme code blocks with language headers, line numbers toggle, and instant clipboard copy.
- **GitHub Alerts**: Official alert callouts (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`) with distinctive accents and icons.
- **Front Matter Metadata**: Parses YAML front matter headers into collapsible summary cards.

### 🎛️ Workspace & Editor Shell
- **Full File Editing & Creation**: Create new `.md` or `.mmd` documents (`Cmd/Ctrl+N`), save modifications directly to disk (`Cmd/Ctrl+S`), or save as new files (`Cmd/Ctrl+Shift+S`) with native save dialogs, dirty-state indicators, and unsaved changes confirmation prompts.
- **WYSIWYG Markdown & Mermaid Writing Toolbar**:
  - **Visual Formatting Bar**: Heading level selector (H1–H4, Paragraph), Bold (`Cmd+B`), Italic (`Cmd+I`), Strikethrough, Inline Code (`Cmd+E`), Bulleted/Numbered/Task checklists, Blockquotes, and GitHub Alerts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`).
  - **Interactive Mermaid Diagram Assistant**: Live visual preview modal (`Cmd+Shift+M`) with real-time SVG rendering for 11+ diagram types (Flowcharts TD/LR, Sequence, Class, State, ER, Git Graph, Mindmap, Kanban, Gantt, Pie charts) with 1-click insertion into the editor.
  - **Visual Table Generator**: Interactive GFM table builder with configurable columns, rows, and per-column text alignment.
  - **Math Formula Helper**: Inline (`$...$`) and block (`$$...$$`) KaTeX mathematics insertion.
  - **Hyperlink & Image Inserters**: 1-click insertion for markdown hyperlinks and images.
- **Multi-Document Tabs**: Open multiple files simultaneously with distinct `.md` and `.mmd` tab badges, active indicators, unsaved changes dirty badges, and keyboard navigation.
- **CodeMirror 6 Markdown & Mermaid Editor**: Full-featured code editor with syntax highlighting, word wrap, and line numbers.
- **Triple View Modes**:
  - `Cmd/Ctrl+1`: **Preview Only** — Clean reading and presentation mode.
  - `Cmd/Ctrl+2`: **Split View** — Synchronized live preview with bi-directional proportional scrolling.
  - `Cmd/Ctrl+3`: **Editor Only** — Distraction-free source editing with WYSIWYG writing tools.
- **Toolbar Quick-Controls**: Instant Light/Dark/System theme switch, Save status button, Export dialog, Document theme dropdown, and Zoom controls in one unified bar.
- **Focus / Reading Mode**: Toggle chrome-free reading mode with `Cmd/Ctrl+Shift+F` or toolbar button.
- **Outline Sidebar**: Auto-generated Table of Contents from document headings or Mermaid diagram indicator with instant jump navigation (`Cmd/Ctrl+B`).
- **Command Palette (`Cmd/Ctrl+K`)**: Rapid access to all actions, file operations, themes, zoom, and exports.
- **In-Document Search (`Cmd/Ctrl+F`)**: Match highlighting, match counter, case-sensitive toggle, and next/previous jump navigation.

### 🎨 Document Themes & Aesthetics
- **Application Themes**: Seamless Light, Dark, and System appearance modes with native title bar styling (macOS `hiddenInset` traffic lights, Windows overlay controls).
- **Four Curated Document Themes**:
  - **GitHub Style**: Standard layout with crisp typography and subtle borders.
  - **Academic Paper**: Classic serif typography with structured margins and formal formatting.
  - **Modern Minimal**: Clean sans-serif high-contrast layout.
  - **Dark Elegant**: Deep slate background with vibrant emerald accents.
- **Bundled Fonts**: Inter (UI and body) and JetBrains Mono (code and monospace) bundled offline.

### 📤 Multi-Format Export Engine
Export the entire document or any individual element (diagram, table, code block) with zero external server dependencies:
- **High-Resolution Images**:
  - **PNG**: Crisp output at 1x, 2x (retina), 3x, and 4x scale factors with optional transparent background.
  - **JPEG & WebP**: Configurable quality slider.
  - **SVG**: Vector export for diagrams and document blocks.
  - **Large Canvas Protection**: Automatic height detection (up to 16,384px) to avoid browser canvas limits.
- **Vector PDF Export**: Electron `printToPDF` with selectable text, clickable links, custom headers/footers with page numbers, and print CSS preventing broken tables or diagrams.
- **Standalone Offline HTML**: Single self-contained HTML file with embedded fonts, CSS, and SVG graphics that opens anywhere offline.
- **Microsoft Word (DOCX)**: Structured document generation with headings, tables, formatted paragraphs, and embedded diagrams.
- **One-Click Clipboard Actions**:
  - Copy element as PNG image.
  - Copy rendered element as rich HTML (for Google Docs / Word / Mail).
  - Copy plain Markdown or Mermaid source.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v24.21.0 LTS or higher
- npm 10.x or higher

### Installation
```bash
git clone https://github.com/rauleblanco/mdmmd-edit.git
cd mdmmd-edit
npm install
```

### Development
```bash
# Start Vite development server with Electron live reload
npm run dev
```

### Type Checking & Unit Tests
```bash
# Run TypeScript strict type checks across Node & Web configs
npm run typecheck

# Run Vitest test suite
npm run test
```

### Production Build
```bash
# Build main, preload, and renderer production bundles
npm run build
```

---

## 📦 Packaging

### macOS (Ad-hoc Universal DMG & Tarball)
```bash
npm run dist:mac
```
(APPLE_SIGNING_IDENTITY: "-"): Produces ad-hoc signed universal binaries (`universal-apple-darwin` supporting Apple Silicon M1/M2/M3/M4 and Intel x86_64), packaged as DMG and tarball releases.
Output artifacts:
- `release/mdmmd Edit-1.0.0-universal.dmg`
- `release/mdmmd Edit-1.0.0-universal-mac.tar.gz`

### Windows (.exe NSIS Installer & .msi Package)
```bash
npm run dist:win
```
Output artifacts:
- `release/mdmmd Edit Setup 1.0.0.exe` (with embedded high-resolution `.ico` application icon)
- `release/mdmmd Edit-1.0.0.msi`

### Linux (.AppImage & .deb)
```bash
npm run dist:linux
```
Output artifacts:
- `release/mdmmd-edit-1.0.0.AppImage`
- `release/mdmmd-edit-1.0.0.deb`

### Multi-Platform
```bash
npm run dist
```

---

## 🚀 Automated GitHub Releases

The GitHub Actions workflow **Release Unsigned Desktop Builds** automatically compiles, packages, and attaches releases across all platforms:
- **Triggers**: Pushes to `main`, version tags (`v*`), or manual trigger via **Run workflow** (`workflow_dispatch` with custom `release_tag` input).
- **Ad-Hoc Signing**: Builds are created with `APPLE_SIGNING_IDENTITY: "-"` for macOS and NSIS installers for Windows.
- **Published Artifacts**: Uploaded directly to the corresponding GitHub Release for instant download.

---

## 🔐 Code Signing & Notarization

### macOS Signing: Ad-Hoc Universal Mode (Default)
By default in CI and local builds without explicit developer certificates, the build runs with:
```bash
APPLE_SIGNING_IDENTITY="-"
CSC_IDENTITY_AUTO_DISCOVERY="false"
```
Produces ad-hoc signed universal binaries (`universal-apple-darwin` supporting Apple Silicon M1/M2/M3/M4 and Intel x86_64), packaged as DMG and tarball releases that run directly on modern macOS.

### macOS Commercial Production Signing (Optional)
If deploying via official Apple Developer ID with notarization, configure the following GitHub repository secrets:
- `CSC_LINK`: Base64-encoded Developer ID Application `.p12` certificate.
- `CSC_KEY_PASSWORD`: Password for the `.p12` certificate.
- `APPLE_ID`: Your Apple ID email address.
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password generated from appleid.apple.com.
- `APPLE_TEAM_ID`: 10-character Apple Developer Team ID.

### Windows Authenticode Signing Setup (Optional)
Configure the following secrets for Windows Authenticode signing:
- `WIN_CSC_LINK`: Base64-encoded `.pfx` code signing certificate.
- `WIN_CSC_KEY_PASSWORD`: Password for the `.pfx` certificate.

---

## 🔄 Updates, macOS Background Activity & Privacy

### 🔒 Privacy & Zero-Telemetry Commitment
`mdmmd Edit` is built as an offline-first desktop editor with strict respect for user privacy:
- **No Telemetry or Analytics**: There are zero tracking pixels, analytics beacons, crash-telemetry daemons, or marketing identifiers embedded in this application.
- **No Unrelated Background Tasks**: When the application window is closed (`Cmd+Q`), no background processes, listeners, or helper daemons remain running.
- **Update Checks Only**: The only network communication performed is an optional check against GitHub's public API (`https://api.github.com/repos/rauleblanco/mdmmd-edit/releases/latest`) to notify you when a newer version or build is available, and downloading the update artifact when you explicitly click to install it.

---

### 🍎 macOS "Background Items Added" Notification

On **macOS Ventura (13.0)**, **Sonoma (14.0)**, and **Sequoia (15.0)**, installing Build 37 or newer may trigger an Apple system notification:
> *"mdmmd Edit added items that can run in the background. You can manage this in Login Items Settings."*

#### Why does this happen?
- `mdmmd Edit` desktop releases are distributed as ad-hoc signed binaries (`APPLE_SIGNING_IDENTITY: "-"`), which cannot use Apple's proprietary notarized Squirrel update server.
- To enable seamless 1-click in-app updating, the app writes a temporary detached updater script (`install_mac_update.sh`) that mounts the downloaded `.dmg` (`hdiutil attach`), replaces the `.app` bundle inside `/Applications` using `ditto`, and relaunches the application.
- macOS's Background Task Management (BTM) daemon detects this detached updater capability and automatically categorizes the app under **Login Items & Extensions → Allow in the Background**.

---

### ⚙️ Option 1: Allowing Background Activity (Automated In-Place Updates)

If you want the in-app 1-click update feature to download, replace, and relaunch automatically:

1. Open **System Settings** on your Mac.
2. Navigate to **General → Login Items & Extensions**.
3. Under **Allow in the Background**, verify that **mdmmd Edit** is set to **On**.
4. *(Optional)* If `mdmmd Edit` is listed under **Open at Login**, you can select it and click the **`—` (minus)** button to remove it. The application does **not** need to open at login.

---

### 🛠️ Option 2: Disabling Background Activity & Performing Manual Updates

If you prefer not to grant background execution permissions, you can safely turn it off with zero impact on the editor:

1. In macOS **System Settings → General → Login Items & Extensions**:
   - Under **Allow in the Background**, toggle **mdmmd Edit** to **Off**.
   - Under **Open at Login**, remove **mdmmd Edit** if present.
2. The application will continue to run normally with full editing, previewing, and export functionality.

#### How to update manually:
- **In-App Notification**: Click **md/mmd Edit → Check for Updates...** in the menu bar, or navigate to **Preferences (`Cmd+,`) → About**. When an update is detected, click the release link to open the GitHub Release page in your browser.
- **Direct Download**: Download the latest `mdmmd Edit-*.dmg` from the [GitHub Releases page](https://github.com/rauleblanco/mdmmd-edit/releases), open the disk image, and drag `mdmmd Edit.app` into your `/Applications` folder (select **Replace**).

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + O` | Open File from Disk (.md or .mmd) |
| `Cmd/Ctrl + N` | New Markdown Document (.md) |
| `Cmd/Ctrl + K` → New .mmd | New Mermaid Diagram (.mmd) |
| `Cmd/Ctrl + S` | Save Document to Disk |
| `Cmd/Ctrl + Shift + S` | Save Document As... |
| `Cmd/Ctrl + W` | Close Active Document Tab (with unsaved changes prompt) |
| `Cmd/Ctrl + V` | Open Paste Text / Mermaid Dialog (on empty screen) |
| `Cmd/Ctrl + E` | Open Document Export Dialog |
| `Cmd/Ctrl + F` | Toggle Find-in-Document Bar |
| `Cmd/Ctrl + B` | Toggle Outline Sidebar (or Bold text in editor) |
| `Cmd/Ctrl + I` | Italic Text (in editor) |
| `Cmd/Ctrl + Shift + M` | Open Interactive Mermaid Diagram Assistant |
| `Cmd/Ctrl + 1` | Switch to Preview Only Mode |
| `Cmd/Ctrl + 2` | Switch to Split View Mode |
| `Cmd/Ctrl + 3` | Switch to Editor Only Mode |
| `Cmd/Ctrl + Shift + F` | Toggle Focus / Reading Mode |
| `Cmd/Ctrl + ,` | Open Preferences & Settings |
| `Cmd/Ctrl + +` | Zoom In (+10%) |
| `Cmd/Ctrl + -` | Zoom Out (-10%) |
| `Cmd/Ctrl + 0` | Reset Zoom to 100% |
| `Escape` | Close Dialogs / Exit Focus Mode |

---

## 📂 Project Architecture

```
mdmmd-edit/
├── .github/workflows/       # GitHub Actions CI build & release workflow
├── build/                   # App icons (.icns, .ico, .png) and macOS entitlements
├── electron/
│   ├── main.ts              # Secure Electron main process (IPC, PDF, native dialogs)
│   └── preload.ts           # Context-isolated IPC bridge (window.mdmmd)
├── fixtures/                # Test fixtures (kitchen-sink.md, diagrams.md, large-document.md)
├── src/
│   ├── components/          # Reusable UI (TabBar, Titlebar, CommandPalette, FindBar, PasteDialog)
│   ├── features/
│   │   ├── editor/          # CodeMirror 6 markdown editor
│   │   ├── export/          # PNG, PDF, HTML, DOCX, SVG, and clipboard export engines
│   │   ├── preview/         # Markdown preview, MermaidBlock, CodeBlock, Lightbox
│   │   ├── settings/        # Preferences & Settings modal
│   │   └── sidebar/         # Table of Contents heading outline
│   ├── fonts/               # Bundled Inter and JetBrains Mono variable fonts
│   ├── lib/
│   │   ├── markdown/        # unified/remark/rehype pipeline, alerts, sanitize schema
│   │   └── mermaid/         # Mermaid diagram rendering, caching, and syntax detection
│   ├── stores/              # Zustand stores (appStore, documentStore)
│   └── styles/              # Tailwind CSS tokens and document typography themes
├── tests/
│   └── unit/                # Vitest pipeline, mermaid, and export unit tests
├── electron.vite.config.ts  # Multi-entry build configuration
├── LICENSE                  # MIT License
└── package.json             # App metadata, dependencies, electron-builder config
```

---

## 📄 License & Attribution

This project is licensed under the [MIT License](LICENSE) — Copyright (c) 2026 Raul E. Blanco (rauleblanco).

> **Artificial Intelligence Co-Authorship & Vibe Coding Attribution:**
> This application was entirely vibe coded with Gemini 3.8 Flash Medium (Google DeepMind Advanced Agentic Coding).

- **Official Website**: [https://rauleblanco.com/mdmmd-edit](https://rauleblanco.com/mdmmd-edit)
- **GitHub Repository**: [https://github.com/rauleblanco/mdmmd-edit](https://github.com/rauleblanco/mdmmd-edit)

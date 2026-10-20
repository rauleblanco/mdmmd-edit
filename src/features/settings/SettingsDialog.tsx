import { useState } from 'react'
import {
  X,
  Settings,
  Sun,
  Moon,
  Monitor,
  FileCode,
  Type,
  Hash,
  WrapText,
  Keyboard,
  Info,
  Globe,
  ExternalLink,
  Sparkles,
  GitBranch,
  Heart,
} from 'lucide-react'
import { useAppStore, type Theme, type DocumentTheme } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import appIconUrl from '@/assets/icon.png'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps): JSX.Element | null {
  const activeTab = useAppStore((s) => s.settingsTab)
  const setActiveTab = useAppStore((s) => s.setSettingsTab)

  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
  const buildVersion = import.meta.env.VITE_BUILD_VERSION || `v${appVersion}`
  const githubRunNumber = import.meta.env.VITE_GITHUB_RUN_NUMBER || ''
  const githubSha = import.meta.env.VITE_GITHUB_SHA || ''

  const handleOpenUrl = (url: string) => {
    if (window.mdmmd?.shell?.openExternal) {
      window.mdmmd.shell.openExternal(url)
    } else {
      window.open(url, '_blank', 'noreferrer,noopener')
    }
  }

  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const documentTheme = useAppStore((s) => s.documentTheme)
  const setDocumentTheme = useAppStore((s) => s.setDocumentTheme)
  const editorFontSize = useAppStore((s) => s.editorFontSize)
  const setEditorFontSize = useAppStore((s) => s.setEditorFontSize)
  const editorLineNumbers = useAppStore((s) => s.editorLineNumbers)
  const setEditorLineNumbers = useAppStore((s) => s.setEditorLineNumbers)
  const editorWordWrap = useAppStore((s) => s.editorWordWrap)
  const setEditorWordWrap = useAppStore((s) => s.setEditorWordWrap)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Preferences</h2>
              <p className="text-xs text-muted-foreground">Customize your md/mmd Edit workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/60 px-6 bg-muted/20">
          {(
            [
              { id: 'general', label: 'Appearance', icon: Sun },
              { id: 'editor', label: 'Editor', icon: FileCode },
              { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
              { id: 'about', label: 'About', icon: Info },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-all -mb-[1px]',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* UI Theme */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Interface Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon
                    const isSelected = theme === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTheme(opt.id as Theme)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-medium transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/70 hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Document Rendering Theme */}
              <div className="space-y-3 pt-3 border-t border-border/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Document Typography Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        id: 'github',
                        label: 'GitHub Style',
                        desc: 'Classic GitHub markdown layout and colors',
                      },
                      {
                        id: 'academic',
                        label: 'Academic Paper',
                        desc: 'Serif typography with formal layout',
                      },
                      {
                        id: 'modern',
                        label: 'Modern Minimal',
                        desc: 'High-contrast clean sans-serif typography',
                      },
                      {
                        id: 'dark-elegant',
                        label: 'Dark Elegant',
                        desc: 'Deep slate background with emerald accents',
                      },
                    ] as const
                  ).map((docOpt) => {
                    const isSelected = documentTheme === docOpt.id
                    return (
                      <button
                        key={docOpt.id}
                        onClick={() => setDocumentTheme(docOpt.id as DocumentTheme)}
                        className={cn(
                          'flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/70 hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <span className="text-xs font-semibold text-foreground">
                          {docOpt.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {docOpt.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-6">
              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-primary" />
                    Editor Font Size
                  </span>
                  <span className="font-mono text-muted-foreground">{editorFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="11"
                  max="22"
                  step="1"
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Line Numbers Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-primary" />
                    Show Line Numbers
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Display line numbers in editor gutter
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editorLineNumbers}
                  onChange={(e) => setEditorLineNumbers(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Word Wrap Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <WrapText className="w-4 h-4 text-primary" />
                    Soft Word Wrap
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Wrap long lines automatically in editor
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editorWordWrap}
                  onChange={(e) => setEditorWordWrap(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Command Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { keys: 'Cmd/Ctrl + K', desc: 'Open Command Palette' },
                  { keys: 'Cmd/Ctrl + O', desc: 'Open Markdown File' },
                  { keys: 'Cmd/Ctrl + N', desc: 'New Document Tab' },
                  { keys: 'Cmd/Ctrl + W', desc: 'Close Current Tab' },
                  { keys: 'Cmd/Ctrl + E', desc: 'Open Export Dialog' },
                  { keys: 'Cmd/Ctrl + F', desc: 'Find in Document' },
                  { keys: 'Cmd/Ctrl + B', desc: 'Toggle Table of Contents' },
                  { keys: 'Cmd/Ctrl + 1', desc: 'Preview Only Mode' },
                  { keys: 'Cmd/Ctrl + 2', desc: 'Split View Mode' },
                  { keys: 'Cmd/Ctrl + 3', desc: 'Editor Only Mode' },
                  { keys: 'Cmd/Ctrl + Shift + F', desc: 'Toggle Focus Mode' },
                  { keys: 'Cmd/Ctrl + ,', desc: 'Open Preferences' },
                ].map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20"
                  >
                    <span className="text-muted-foreground">{s.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] font-semibold text-foreground border border-border/60">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 text-center py-2 max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto flex items-center justify-center">
                <img
                  src={appIconUrl}
                  alt="md/mmd Edit logo"
                  className="w-20 h-20 rounded-2xl shadow-xl object-contain hover:scale-105 transition-transform"
                />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">md/mmd Edit</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">v{appVersion}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-medium border border-primary/20">
                    {githubRunNumber
                      ? `GitHub Actions Build #${githubRunNumber}${githubSha ? ` (${githubSha})` : ''}`
                      : buildVersion.includes('Build')
                        ? buildVersion
                        : `GitHub Actions Build: ${buildVersion}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                A modern desktop application that opens, edits, renders, and exports Markdown documents (.md)
                and Mermaid diagrams (.mmd) with print-quality typography.
              </p>

              {/* Links */}
              <div className="flex flex-col gap-2 pt-1 max-w-md mx-auto w-full text-left">
                <a
                  href="https://rauleblanco.com/mdmmd-edit"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleOpenUrl('https://rauleblanco.com/mdmmd-edit')
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground hover:text-primary transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground font-semibold">Application Website</div>
                      <div className="truncate font-mono text-[11px] text-primary">https://rauleblanco.com/mdmmd-edit</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-70 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </a>

                <a
                  href="https://github.com/rauleblanco/mdmmd-edit"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleOpenUrl('https://github.com/rauleblanco/mdmmd-edit')
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground hover:text-primary transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GitBranch className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground font-semibold">GitHub Repository</div>
                      <div className="truncate font-mono text-[11px] text-primary">https://github.com/rauleblanco/mdmmd-edit</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-70 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </a>
                <a
                  href="https://github.com/sponsors/rauleblanco"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleOpenUrl('https://github.com/sponsors/rauleblanco')
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-xs font-medium text-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20 group-hover:scale-110 transition-transform shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground font-semibold">Support the developer</div>
                      <div className="truncate font-mono text-[11px] text-pink-600 dark:text-pink-400">https://github.com/sponsors/rauleblanco</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-70 shrink-0 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </a>
              </div>

              {/* Copyright Notice */}
              <div className="pt-3 border-t border-border/50 space-y-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Copyright (c) 2026 Raul E. Blanco (rauleblanco)
                </p>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-left text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Artificial Intelligence Co-Authorship &amp; Vibe Coding Attribution</span>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-muted-foreground pl-5">
                    This application was entirely vibe coded with Gemini 3.8 Flash Medium (Google DeepMind Advanced Agentic Coding).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-6 py-3 bg-muted/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

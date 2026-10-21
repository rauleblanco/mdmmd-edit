import { useState, useEffect } from 'react'
import {
  X,
  Shield,
  RotateCw,
  Globe,
  ExternalLink,
  Heart,
  Zap,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  FileText,
  Network,
  Sigma,
  Code2,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import appIconUrl from '@/assets/icon.png'

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps): JSX.Element | null {
  const updaterState = useAppStore((s) => s.updaterState)
  const setUpdaterState = useAppStore((s) => s.setUpdaterState)

  const [checking, setChecking] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
  const displayVersion = import.meta.env.VITE_DISPLAY_VERSION || `v${appVersion}`
  const buildInfo = import.meta.env.VITE_BUILD_INFO || 'Development Build'
  const fullVersionDisplay = `${displayVersion} • ${buildInfo} • Modern Markdown & Mermaid Editor`

  // Sync real-time updater events from Electron main process
  useEffect(() => {
    const updater = window.mdmmd?.updater
    if (!updater) return

    updater.getStatus().then((st) => {
      if (st) setUpdaterState(st)
    }).catch(() => {})

    const unsubscribe = updater.onStatusChange((st) => {
      setUpdaterState(st)
      if (st.status !== 'checking') {
        setChecking(false)
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [setUpdaterState])

  if (!isOpen) return null

  const handleOpenUrl = (url: string) => {
    if (window.mdmmd?.shell?.openExternal) {
      window.mdmmd.shell.openExternal(url)
    } else {
      window.open(url, '_blank', 'noreferrer,noopener')
    }
  }

  const handleCheckForUpdates = async () => {
    setChecking(true)
    const updater = window.mdmmd?.updater
    if (updater) {
      try {
        const result = await updater.check()
        setUpdaterState(result)
      } catch (err) {
        setUpdaterState({
          status: 'error',
          error: (err as Error).message || 'Failed to check for updates',
        })
      } finally {
        setChecking(false)
      }
    } else {
      // Browser / preview fallback: fetch GitHub API directly
      try {
        setUpdaterState({ status: 'checking', error: null })
        const res = await fetch('https://api.github.com/repos/rauleblanco/mdmmd-edit/releases/latest', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        })
        if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`)
        const data = await res.json()
        const tagName = data.tag_name || ''
        const hasUpdate = tagName && tagName !== displayVersion

        setUpdaterState({
          status: hasUpdate ? 'available' : 'not-available',
          info: {
            version: tagName,
            releaseName: data.name || tagName,
            releaseNotes: data.body || '',
            publishedAt: data.published_at || '',
            releaseUrl: data.html_url || 'https://github.com/rauleblanco/mdmmd-edit/releases',
            assetName: data.assets?.[0]?.name,
            assetSize: data.assets?.[0]?.size,
            downloadUrl: data.assets?.[0]?.browser_download_url,
          },
        })
      } catch (err) {
        setUpdaterState({
          status: 'error',
          error: (err as Error).message || 'Unable to check for updates',
        })
      } finally {
        setChecking(false)
      }
    }
  }

  const handleDownloadUpdate = async () => {
    const updater = window.mdmmd?.updater
    if (updater) {
      try {
        await updater.download()
      } catch (err) {
        setUpdaterState({
          status: 'error',
          error: (err as Error).message || 'Download failed',
        })
      }
    } else if (updaterState.info?.releaseUrl) {
      handleOpenUrl(updaterState.info.releaseUrl)
    }
  }

  const handleInstallRestart = async () => {
    const updater = window.mdmmd?.updater
    if (updater) {
      await updater.install()
    } else if (updaterState.info?.releaseUrl) {
      handleOpenUrl(updaterState.info.releaseUrl)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl flex flex-col max-h-[90vh] text-card-foreground backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Window Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span>About md/mmd Edit</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          {/* Hero: Icon + Title + Version + Check for Updates */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-background to-primary/5 p-1 border border-border/70 shadow-lg shrink-0 flex items-center justify-center overflow-hidden group">
              <img
                src={appIconUrl}
                alt="md/mmd Edit Desktop"
                className="w-14 h-14 rounded-xl object-contain group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                md/mmd Edit Desktop
              </h1>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed truncate">
                {fullVersionDisplay}
              </p>

              {/* Check for Updates pill button matching screenshot */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCheckForUpdates}
                  disabled={checking || updaterState.status === 'downloading' || updaterState.status === 'installing'}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all shadow-2xs',
                    checking || updaterState.status === 'checking'
                      ? 'border-primary/40 bg-primary/10 text-primary cursor-wait'
                      : 'border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300'
                  )}
                >
                  <RotateCw
                    className={cn(
                      'w-3.5 h-3.5',
                      checking || updaterState.status === 'checking' ? 'animate-spin text-primary' : 'text-sky-400'
                    )}
                  />
                  <span>
                    {checking || updaterState.status === 'checking'
                      ? 'Checking for updates...'
                      : 'Check for Updates'}
                  </span>
                </button>

                {/* Status indicator badges */}
                {updaterState.status === 'not-available' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Up to date ({updaterState.currentVersion})</span>
                  </span>
                )}

                {updaterState.status === 'error' && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium cursor-help"
                    title={updaterState.error || 'Update check failed'}
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">Update check failed</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Update Notification Box (when available, downloading, or ready) */}
          {(updaterState.status === 'available' ||
            updaterState.status === 'downloading' ||
            updaterState.status === 'downloaded' ||
            updaterState.status === 'installing') && (
            <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span className="text-xs font-semibold text-foreground">
                    {updaterState.status === 'downloaded'
                      ? `Update ${updaterState.info?.version} Ready to Install`
                      : updaterState.status === 'downloading'
                        ? `Downloading ${updaterState.info?.version}...`
                        : `New Update Available: ${updaterState.info?.version}`}
                  </span>
                </div>

                {updaterState.info?.releaseNotes && (
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    {showNotes ? 'Hide Notes' : 'Release Notes'}
                  </button>
                )}
              </div>

              {/* Progress bar when downloading */}
              {updaterState.status === 'downloading' && (
                <div className="space-y-1.5">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/50">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: `${updaterState.progress?.percent || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>{updaterState.progress?.percent || 0}% downloaded</span>
                    {updaterState.progress?.total ? (
                      <span>
                        {(updaterState.progress.transferred / (1024 * 1024)).toFixed(1)} /{' '}
                        {(updaterState.progress.total / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {updaterState.status === 'available' && (
                  <button
                    onClick={handleDownloadUpdate}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download &amp; Update</span>
                  </button>
                )}

                {updaterState.status === 'downloaded' && (
                  <button
                    onClick={handleInstallRestart}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 animate-pulse"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restart md/mmd Edit</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenUrl(updaterState.info?.releaseUrl || 'https://github.com/rauleblanco/mdmmd-edit/releases')}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  View on GitHub
                </button>
              </div>

              {/* Release Notes expansion */}
              {showNotes && updaterState.info?.releaseNotes && (
                <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground max-h-36 overflow-y-auto scrollbar-thin whitespace-pre-wrap font-mono">
                  {updaterState.info.releaseNotes}
                </div>
              )}
            </div>
          )}

          {/* MIT Open Source Card matching attached screenshot */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 font-mono text-[11px] font-semibold text-emerald-400">
                MIT License
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-[11px] font-semibold text-sky-400">
                Open Source
              </span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground font-semibold">Permitted:</strong> Free personal and
              commercial use, modification, distribution, and sublicensing under the standard MIT
              License.
            </p>

            <p className="text-muted-foreground pt-1 border-t border-border/50">
              <strong className="text-foreground font-semibold">Copyright:</strong> Copyright &copy; 2026
              Raul E. Blanco (
              <a
                href="https://github.com/rauleblanco"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  handleOpenUrl('https://github.com/rauleblanco')
                }}
                className="text-sky-400 hover:underline font-mono"
              >
                rauleblanco
              </a>
              )
            </p>
          </div>

          {/* Project & Repository Links */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Project &amp; Repository Links
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="https://rauleblanco.com/mdmmd-edit"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  handleOpenUrl('https://rauleblanco.com/mdmmd-edit')
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 text-xs text-foreground transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">
                    Official Project Page{' '}
                    <span className="text-muted-foreground font-mono text-[11px]">
                      (rauleblanco.com/mdmmd-edit)
                    </span>
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
              </a>

              <a
                href="https://github.com/rauleblanco/mdmmd-edit"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  handleOpenUrl('https://github.com/rauleblanco/mdmmd-edit')
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 text-xs text-foreground transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    GitHub Repository{' '}
                    <span className="text-muted-foreground font-mono text-[11px]">
                      (github.com/rauleblanco/mdmmd-edit)
                    </span>
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
              </a>
            </div>
          </div>

          {/* Support the Developer */}
          <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/5 flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20 group-hover:scale-110 transition-transform shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground">Support the developer</div>
                <a
                  href="https://github.com/sponsors/rauleblanco"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleOpenUrl('https://github.com/sponsors/rauleblanco')
                  }}
                  className="font-mono text-[11px] text-rose-400 hover:underline truncate block"
                >
                  https://github.com/sponsors/rauleblanco
                </a>
              </div>
            </div>
            <button
              onClick={() => handleOpenUrl('https://github.com/sponsors/rauleblanco')}
              className="p-1 text-muted-foreground group-hover:text-rose-400 transition-colors shrink-0"
              title="Open GitHub Sponsors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* AI Co-Authorship */}
          <div className="p-3.5 rounded-xl border border-purple-500/25 bg-purple-500/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />
              <span>Artificial Intelligence Co-Authorship</span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
              This entire application and codebase was vibe coded with{' '}
              <strong className="text-foreground font-semibold">Gemini 3.8 Flash Medium</strong>{' '}
              (Google DeepMind Advanced Agentic Coding).
            </p>
          </div>

          {/* Document Specifications & Foundations */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Document Specifications &amp; Foundations
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground">CommonMark &amp; GFM</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <Network className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-muted-foreground">Mermaid.js v11 Diagrams</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <Sigma className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-muted-foreground">KaTeX Math Typesetting</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <Code2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-muted-foreground">Shiki Syntax Highlighting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Window Footer */}
        <div className="border-t border-border/60 px-6 py-3 bg-muted/10 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            {displayVersion} ({buildInfo})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

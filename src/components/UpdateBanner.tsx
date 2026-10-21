import { useState } from 'react'
import { Sparkles, Download, RefreshCw, X, RotateCw, ExternalLink } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

export function UpdateBanner(): JSX.Element | null {
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null)
  const updaterState = useAppStore((s) => s.updaterState)
  const setUpdaterState = useAppStore((s) => s.setUpdaterState)
  const openAbout = useAppStore((s) => s.openAbout)

  const isVisible =
    (updaterState.status === 'available' && dismissedVersion !== updaterState.info?.version) ||
    updaterState.status === 'downloading' ||
    updaterState.status === 'downloaded'

  if (!isVisible) return null

  const handleDownload = async () => {
    const updater = window.mdmmd?.updater
    if (updater) {
      try {
        await updater.download()
      } catch (err) {
        setUpdaterState({ status: 'error', error: (err as Error).message })
      }
    } else if (updaterState.info?.releaseUrl) {
      window.open(updaterState.info.releaseUrl, '_blank', 'noreferrer,noopener')
    }
  }

  const handleInstall = async () => {
    const updater = window.mdmmd?.updater
    if (updater) {
      await updater.install()
    } else if (updaterState.info?.releaseUrl) {
      window.open(updaterState.info.releaseUrl, '_blank', 'noreferrer,noopener')
    }
  }

  return (
    <div className="bg-gradient-to-r from-sky-600 via-primary to-emerald-600 text-white px-3 py-1.5 text-xs flex items-center justify-between shadow-md relative z-40 select-none animate-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2 min-w-0">
        {updaterState.status === 'downloading' ? (
          <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0 text-white" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300 animate-pulse" />
        )}

        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold truncate">
            {updaterState.status === 'downloaded'
              ? `Update ${updaterState.info?.version || ''} Ready!`
              : updaterState.status === 'downloading'
                ? `Downloading update ${updaterState.info?.version || ''}...`
                : `Update Available: md/mmd Edit ${updaterState.info?.version || ''}`}
          </span>

          {updaterState.status === 'downloading' && (
            <div className="flex items-center gap-2">
              <div className="w-24 bg-white/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${updaterState.progress?.percent || 0}%` }}
                />
              </div>
              <span className="font-mono text-[11px] opacity-90">
                {updaterState.progress?.percent || 0}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {updaterState.status === 'available' && (
          <>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white text-sky-950 font-semibold text-xs hover:bg-white/90 transition-all shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Update Now</span>
            </button>
            <button
              onClick={openAbout}
              className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-medium text-xs transition-colors hidden sm:inline"
            >
              Details
            </button>
          </>
        )}

        {updaterState.status === 'downloaded' && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-0.5 rounded-md bg-white text-emerald-950 font-bold text-xs hover:bg-white/90 transition-all shadow-sm animate-pulse"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restart to Apply</span>
          </button>
        )}

        {updaterState.status === 'available' && (
          <button
            onClick={() => setDismissedVersion(updaterState.info?.version || 'dismissed')}
            className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

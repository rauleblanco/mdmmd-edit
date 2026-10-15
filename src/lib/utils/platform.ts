/**
 * Detect the current platform for UI rendering.
 * In the renderer process, we use the preload-exposed API.
 * Falls back to userAgent sniffing if the API isn't available (e.g. in tests).
 */
export function getPlatform(): 'darwin' | 'win32' | 'linux' {
  if (typeof window !== 'undefined' && window.markview?.platform) {
    return window.markview.platform as 'darwin' | 'win32' | 'linux'
  }
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'darwin'
  if (ua.includes('win')) return 'win32'
  return 'linux'
}

export const isMac = () => getPlatform() === 'darwin'
export const isWindows = () => getPlatform() === 'win32'

/**
 * Returns the correct modifier key label for the current platform.
 */
export const modKey = () => (isMac() ? '⌘' : 'Ctrl')

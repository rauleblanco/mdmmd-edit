import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { createWriteStream, existsSync, mkdirSync, unlinkSync, statSync } from 'fs'
import { get as httpsGet, RequestOptions } from 'https'
import { spawn } from 'child_process'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'error'

export interface UpdateInfo {
  version: string
  releaseName: string
  releaseNotes: string
  publishedAt: string
  releaseUrl: string
  assetName?: string
  assetSize?: number
  downloadUrl?: string
}

export interface DownloadProgress {
  percent: number
  transferred: number
  total: number
}

export interface UpdaterState {
  status: UpdateStatus
  currentVersion: string
  info: UpdateInfo | null
  progress: DownloadProgress | null
  error: string | null
  downloadedFilePath: string | null
}

const GITHUB_REPO = 'rauleblanco/mdmmd-edit'
const GITHUB_API_LATEST = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

class AppUpdater {
  private currentVersion: string
  private state: UpdaterState
  private mainWindow: BrowserWindow | null = null
  private downloadAbortController: AbortController | null = null

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`
    this.state = {
      status: 'idle',
      currentVersion: this.currentVersion,
      info: null,
      progress: null,
      error: null,
      downloadedFilePath: null,
    }
  }

  public setWindow(win: BrowserWindow | null): void {
    this.mainWindow = win
  }

  public getState(): UpdaterState {
    return { ...this.state }
  }

  private setState(updates: Partial<UpdaterState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyRenderer()
  }

  private notifyRenderer(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:status', this.state)
    }
  }

  /**
   * Parse semantic or build version into comparable tuple [major, minor, patch/build]
   */
  private parseVersion(v: string): [number, number, number] {
    const cleaned = v.replace(/^v/i, '').trim()
    const buildMatch = cleaned.match(/build-(\d+)/i) || cleaned.match(/build\s*#?(\d+)/i)
    if (buildMatch) {
      return [1, 0, parseInt(buildMatch[1], 10) || 0]
    }
    const parts = cleaned.split('.').map((p) => parseInt(p, 10) || 0)
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
  }

  /**
   * Returns true if remote version is strictly newer than current version
   */
  private isNewer(current: string, remote: string): boolean {
    const [cMajor, cMinor, cPatch] = this.parseVersion(current)
    const [rMajor, rMinor, rPatch] = this.parseVersion(remote)

    if (rMajor !== cMajor) return rMajor > cMajor
    if (rMinor !== cMinor) return rMinor > cMinor
    return rPatch > cPatch
  }

  /**
   * Safely pick the most suitable asset for the current OS and architecture
   */
  private findMatchingAsset(assets: any[]): { name: string; url: string; size: number } | null {
    if (!Array.isArray(assets) || assets.length === 0) return null

    const platform = process.platform
    const arch = process.arch

    let matched: any = null

    if (platform === 'darwin') {
      // macOS: Look for universal or architecture-matched dmg, then tar.gz / zip
      if (arch === 'arm64') {
        matched = assets.find((a) => /arm64.*\.dmg$/i.test(a.name))
      }
      if (!matched) {
        matched = assets.find((a) => /universal.*\.dmg$/i.test(a.name))
      }
      if (!matched) {
        matched = assets.find((a) => /\.dmg$/i.test(a.name))
      }
      if (!matched) {
        matched = assets.find((a) => /\.tar\.gz$/i.test(a.name) || /\.zip$/i.test(a.name))
      }
    } else if (platform === 'win32') {
      // Windows: Prefer NSIS exe installer, then msi
      matched = assets.find((a) => /setup.*\.exe$/i.test(a.name) || /\.exe$/i.test(a.name))
      if (!matched) {
        matched = assets.find((a) => /\.msi$/i.test(a.name))
      }
    } else {
      // Linux: Prefer AppImage, then deb
      matched = assets.find((a) => /\.AppImage$/i.test(a.name))
      if (!matched) {
        matched = assets.find((a) => /\.deb$/i.test(a.name))
      }
    }

    if (!matched && assets.length > 0) {
      matched = assets[0]
    }

    if (matched) {
      return {
        name: matched.name,
        url: matched.browser_download_url,
        size: matched.size || 0,
      }
    }

    return null
  }

  /**
   * HTTP helper to fetch JSON with redirect handling
   */
  private fetchJson(urlStr: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options: RequestOptions = {
        headers: {
          'User-Agent': 'mdmmd-edit-desktop-app',
          Accept: 'application/vnd.github.v3+json',
        },
      }

      const req = httpsGet(urlStr, options, (res) => {
        // Handle redirects
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return this.fetchJson(res.headers.location).then(resolve).catch(reject)
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`GitHub API returned HTTP ${res.statusCode}: ${res.statusMessage}`))
        }

        let body = ''
        res.setEncoding('utf-8')
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            resolve(parsed)
          } catch (err) {
            reject(new Error('Failed to parse release metadata: ' + (err as Error).message))
          }
        })
      })

      req.on('error', reject)
      req.setTimeout(12000, () => {
        req.destroy()
        reject(new Error('Connection timed out while checking for updates'))
      })
    })
  }

  /**
   * Checks GitHub Releases for a newer version
   */
  public async checkForUpdates(isUserInitiated = true): Promise<UpdaterState> {
    // Prevent duplicate checks while downloading or installing
    if (this.state.status === 'downloading' || this.state.status === 'installing') {
      return this.getState()
    }

    this.setState({ status: 'checking', error: null })

    try {
      const release = await this.fetchJson(GITHUB_API_LATEST)
      const tagName = release.tag_name || ''
      const releaseName = release.name || tagName || 'Latest Release'
      const releaseNotes = release.body || 'No release notes provided.'
      const publishedAt = release.published_at || new Date().toISOString()
      const releaseUrl = release.html_url || `https://github.com/${GITHUB_REPO}/releases`

      const matchingAsset = this.findMatchingAsset(release.assets || [])
      const hasNewerVersion = this.isNewer(this.currentVersion, tagName)

      const updateInfo: UpdateInfo = {
        version: tagName,
        releaseName,
        releaseNotes,
        publishedAt,
        releaseUrl,
        assetName: matchingAsset?.name,
        assetSize: matchingAsset?.size,
        downloadUrl: matchingAsset?.url,
      }

      if (hasNewerVersion) {
        this.setState({
          status: 'available',
          info: updateInfo,
          error: null,
        })
      } else {
        this.setState({
          status: 'not-available',
          info: updateInfo,
          error: null,
        })
      }
    } catch (err) {
      const errMsg = (err as Error).message || 'Unable to connect to GitHub update service'
      console.warn('Update check failed:', errMsg)
      if (isUserInitiated) {
        this.setState({
          status: 'error',
          error: errMsg,
        })
      } else {
        // Silently reset to idle on automatic background checks
        this.setState({ status: 'idle', error: null })
      }
    }

    return this.getState()
  }

  /**
   * Downloads the matched release asset to the local temp directory
   */
  public async downloadUpdate(): Promise<void> {
    if (!this.state.info?.downloadUrl) {
      this.setState({
        status: 'error',
        error: 'No download asset available for your platform',
      })
      return
    }

    const downloadUrl = this.state.info.downloadUrl
    const fileName = this.state.info.assetName || `mdmmd-edit-update-${this.state.info.version}`
    const tempDir = join(app.getPath('temp'), 'mdmmd-edit-updater')

    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    const targetFilePath = join(tempDir, fileName)

    // Remove older incomplete download if present
    if (existsSync(targetFilePath)) {
      try {
        unlinkSync(targetFilePath)
      } catch {
        // ignore
      }
    }

    this.setState({
      status: 'downloading',
      progress: { percent: 0, transferred: 0, total: this.state.info.assetSize || 0 },
      error: null,
    })

    const downloadStream = (urlStr: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const fileStream = createWriteStream(targetFilePath)

        const options: RequestOptions = {
          headers: {
            'User-Agent': 'mdmmd-edit-desktop-app',
            Accept: 'application/octet-stream',
          },
        }

        const req = httpsGet(urlStr, options, (res) => {
          // Follow AWS S3 / GitHub redirects
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            fileStream.close()
            return downloadStream(res.headers.location).then(resolve).catch(reject)
          }

          if (res.statusCode !== 200) {
            fileStream.close()
            return reject(new Error(`Download failed with HTTP ${res.statusCode}`))
          }

          const total = parseInt(res.headers['content-length'] || '0', 10) || this.state.info?.assetSize || 0
          let transferred = 0
          let lastReport = 0

          res.on('data', (chunk) => {
            transferred += chunk.length
            const now = Date.now()
            if (now - lastReport > 200 || transferred === total) {
              lastReport = now
              const percent = total > 0 ? Math.min(Math.round((transferred / total) * 100), 100) : 0
              this.setState({
                progress: { percent, transferred, total },
              })
            }
          })

          res.pipe(fileStream)

          fileStream.on('finish', () => {
            fileStream.close(() => resolve(targetFilePath))
          })

          fileStream.on('error', (err) => {
            fileStream.close()
            reject(err)
          })
        })

        req.on('error', (err) => {
          fileStream.close()
          reject(err)
        })

        req.setTimeout(60000, () => {
          req.destroy()
          reject(new Error('Update download timed out'))
        })
      })
    }

    try {
      const savedPath = await downloadStream(downloadUrl)

      // Verify file size
      if (existsSync(savedPath)) {
        const stats = statSync(savedPath)
        if (stats.size > 0) {
          this.setState({
            status: 'downloaded',
            downloadedFilePath: savedPath,
            progress: { percent: 100, transferred: stats.size, total: stats.size },
            error: null,
          })
          return
        }
      }
      throw new Error('Downloaded file is empty or missing')
    } catch (err) {
      const errMsg = (err as Error).message || 'Failed to download update'
      this.setState({
        status: 'error',
        error: errMsg,
        progress: null,
      })
    }
  }

  /**
   * Applies the downloaded update and prompts restart
   */
  public async installUpdate(): Promise<void> {
    const filePath = this.state.downloadedFilePath
    if (!filePath || !existsSync(filePath)) {
      this.setState({
        status: 'error',
        error: 'Downloaded installer file not found. Please check for updates again.',
      })
      return
    }

    this.setState({ status: 'installing' })

    const platform = process.platform

    try {
      if (platform === 'win32') {
        // Run Windows installer executable detached and quit mdmmd Edit
        const child = spawn(filePath, [], {
          detached: true,
          stdio: 'ignore',
        })
        child.unref()
        app.quit()
      } else if (platform === 'darwin') {
        // On macOS, open the DMG or archive in Finder so user can copy to Applications
        await shell.openPath(filePath)
        app.quit()
      } else {
        // Linux: Make executable and launch or open folder
        const { chmodSync } = await import('fs')
        try {
          chmodSync(filePath, 0o755)
        } catch {
          // ignore
        }
        await shell.openPath(filePath)
        app.quit()
      }
    } catch (err) {
      this.setState({
        status: 'error',
        error: 'Failed to launch installer: ' + (err as Error).message,
      })
    }
  }
}

let updaterInstance: AppUpdater | null = null

export function initUpdater(currentVersion: string, mainWindow: BrowserWindow | null): AppUpdater {
  updaterInstance = new AppUpdater(currentVersion)
  updaterInstance.setWindow(mainWindow)

  // Register IPC handlers
  ipcMain.handle('updater:getStatus', () => updaterInstance?.getState())
  ipcMain.handle('updater:check', () => updaterInstance?.checkForUpdates(true))
  ipcMain.handle('updater:download', () => updaterInstance?.downloadUpdate())
  ipcMain.handle('updater:install', () => updaterInstance?.installUpdate())

  // Schedule safe background check 8 seconds after app launch
  setTimeout(() => {
    updaterInstance?.checkForUpdates(false)
  }, 8000)

  return updaterInstance
}

export function getUpdater(): AppUpdater | null {
  return updaterInstance
}

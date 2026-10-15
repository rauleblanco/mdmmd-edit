import { app, BrowserWindow, shell, ipcMain, dialog, nativeTheme } from 'electron'
import { join } from 'path'
import { readFile, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

function getAppIconPath(): string {
  const devPath = join(__dirname, '../../build/icon.png')
  const resPath = join(process.resourcesPath, 'build/icon.png')
  const appPath = join(app.getAppPath(), 'build/icon.png')
  if (existsSync(devPath)) return devPath
  if (existsSync(resPath)) return resPath
  if (existsSync(appPath)) return appPath
  return devPath
}

function createWindow(): void {
  const isMac = process.platform === 'darwin'
  const appIcon = getAppIconPath()

  mainWindow = new BrowserWindow({
    title: 'md/mmd Edit',
    icon: appIcon,
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    show: false,
    // macOS: hidden title bar with native traffic lights
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    // Windows 11: title bar overlay with system controls
    ...(process.platform === 'win32'
      ? {
          titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#888888',
            height: 40,
          },
          backgroundMaterial: 'mica' as const,
        }
      : {}),
    // macOS vibrancy
    ...(isMac ? { vibrancy: 'sidebar' as const } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: file: asset:; " +
            "font-src 'self' data: file: asset:; " +
            "connect-src 'self'; " +
            "worker-src 'self' blob:;",
        ],
      },
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- IPC Handlers ---

// File: Open dialog
ipcMain.handle('file:open', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown or Mermaid Document',
    properties: ['openFile'],
    filters: [
      { name: 'Supported Documents (*.md, *.mmd)', extensions: ['md', 'mmd', 'markdown', 'mermaid', 'mdx'] },
      { name: 'Markdown Document (*.md, *.markdown, *.mdx)', extensions: ['md', 'markdown', 'mdx'] },
      { name: 'Mermaid Diagram (*.mmd, *.mermaid)', extensions: ['mmd', 'mermaid'] },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const content = await readFile(filePath, 'utf-8')
  return { path: filePath, content }
})

// File: Read a specific path
ipcMain.handle('file:openPath', async (_event, filePath: string) => {
  if (typeof filePath !== 'string') throw new Error('Invalid file path')
  const content = await readFile(filePath, 'utf-8')
  return { path: filePath, content }
})

// File: Save
ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
  if (typeof filePath !== 'string') throw new Error('Invalid file path')
  if (typeof content !== 'string') throw new Error('Invalid content')
  const { writeFile } = await import('fs/promises')
  await writeFile(filePath, content, 'utf-8')
})

// File: Save As
ipcMain.handle('file:saveAs', async (_event, content: string, defaultName?: string) => {
  if (!mainWindow) return null
  const isMmd = defaultName?.toLowerCase().endsWith('.mmd') || defaultName?.toLowerCase().endsWith('.mermaid')
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Document As',
    defaultPath: defaultName || 'untitled.md',
    filters: isMmd
      ? [
          { name: 'Mermaid Diagram (*.mmd)', extensions: ['mmd', 'mermaid'] },
          { name: 'Markdown Document (*.md)', extensions: ['md', 'markdown', 'mdx'] },
          { name: 'All Files (*.*)', extensions: ['*'] },
        ]
      : [
          { name: 'Markdown Document (*.md)', extensions: ['md', 'markdown', 'mdx'] },
          { name: 'Mermaid Diagram (*.mmd)', extensions: ['mmd', 'mermaid'] },
          { name: 'All Files (*.*)', extensions: ['*'] },
        ],
  })
  if (result.canceled || !result.filePath) return null
  const { writeFile } = await import('fs/promises')
  await writeFile(result.filePath, content, 'utf-8')
  return result.filePath
})

// File: Read directory
ipcMain.handle('file:readDirectory', async (_event, dirPath: string) => {
  if (typeof dirPath !== 'string') throw new Error('Invalid directory path')
  const entries = await readdir(dirPath, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const entryPath = join(dirPath, entry.name)
    const stats = await stat(entryPath).catch(() => null)
    result.push({
      name: entry.name,
      path: entryPath,
      isDirectory: entry.isDirectory(),
      size: stats?.size ?? 0,
    })
  }
  return result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name)
  })
})

// Export: Save dialog
ipcMain.handle('export:showSaveDialog', async (_event, options: Electron.SaveDialogOptions) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, options)
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

// Export: Save file (binary)
ipcMain.handle('export:saveFile', async (_event, filePath: string, data: Uint8Array) => {
  if (typeof filePath !== 'string') throw new Error('Invalid file path')
  const { writeFile } = await import('fs/promises')
  await writeFile(filePath, Buffer.from(data))
})

// Export: Print to PDF (supports multi-page document HTML via offscreen window)
ipcMain.handle(
  'export:printToPDF',
  async (
    _event,
    options: {
      html?: string
      landscape?: boolean
      pageSize?: Electron.PrintToPDFOptions['pageSize']
      printBackground?: boolean
    }
  ) => {
    const { html, ...pdfOptions } = options

    if (html) {
      const printWin = new BrowserWindow({
        show: false,
        width: 1200,
        height: 900,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      })

      try {
        const base64Html = Buffer.from(html, 'utf-8').toString('base64')
        await printWin.loadURL(`data:text/html;charset=utf-8;base64,${base64Html}`)
        // Allow fonts, math, and rendered layout to finish rendering
        await new Promise((resolve) => setTimeout(resolve, 600))

        const data = await printWin.webContents.printToPDF({
          landscape: pdfOptions.landscape ?? false,
          pageSize: (pdfOptions.pageSize as any) || 'A4',
          printBackground: pdfOptions.printBackground ?? true,
          preferCSSPageSize: true,
          displayHeaderFooter: true,
          headerTemplate:
            '<div style="font-size:9px;color:#888;width:100%;text-align:right;padding-right:20mm;"><span class="title"></span></div>',
          footerTemplate:
            '<div style="font-size:9px;color:#888;width:100%;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        })
        return new Uint8Array(data)
      } finally {
        printWin.destroy()
      }
    } else if (mainWindow) {
      const data = await mainWindow.webContents.printToPDF(pdfOptions)
      return new Uint8Array(data)
    }

    throw new Error('No window or HTML available for printing PDF')
  }
)

// Shell: Open external
ipcMain.on('shell:openExternal', (_event, url: string) => {
  if (typeof url !== 'string') return
  // Only allow http(s) and mailto protocols
  if (/^https?:\/\//.test(url) || /^mailto:/.test(url)) {
    shell.openExternal(url)
  }
})

// Shell: Show in folder
ipcMain.on('shell:showInFolder', (_event, filePath: string) => {
  if (typeof filePath !== 'string') return
  shell.showItemInFolder(filePath)
})

// Theme
ipcMain.handle('theme:get', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

ipcMain.on('theme:set', (_event, theme: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = theme
})

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// Platform info
ipcMain.handle('platform:get', () => process.platform)

// --- App Lifecycle ---

app.whenReady().then(() => {
  const appIcon = getAppIconPath()

  // On macOS, set dock icon explicitly
  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(appIcon)
    } catch {
      // ignore in dev / environments where dock is unavailable
    }
  }

  // Configure native About panel options (used by macOS application menu)
  try {
    app.setAboutPanelOptions({
      applicationName: 'md/mmd Edit',
      applicationVersion: '1.0.0',
      version: '1.0.0',
      copyright: 'Copyright © 2026 Raul E. Blanco (rauleblanco)',
      website: 'https://rauleblanco.com/mdmmd-edit',
      credits:
        'A modern desktop Markdown & Mermaid editor.\nVibe coded with Gemini 3.8 Flash Medium (Google DeepMind Advanced Agentic Coding).\nApplication Website: https://rauleblanco.com/mdmmd-edit\nGitHub: https://github.com/rauleblanco/mdmmd-edit',
      iconPath: appIcon,
    })
  } catch {
    // ignore
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

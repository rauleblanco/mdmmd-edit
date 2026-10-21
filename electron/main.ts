import { app, BrowserWindow, shell, ipcMain, dialog, nativeTheme, Menu } from 'electron'
import { join } from 'path'
import { readFile, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import { initUpdater, getUpdater } from './updater'

let mainWindow: BrowserWindow | null = null
let pendingFilePath: string | null = null

declare const __APP_VERSION__: string
declare const __DISPLAY_VERSION__: string
declare const __BUILD_INFO__: string
declare const __FULL_VERSION_DISPLAY__: string
declare const __GITHUB_RUN_NUMBER__: string
declare const __GITHUB_SHA__: string

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'
const displayVersion = typeof __DISPLAY_VERSION__ !== 'undefined' ? __DISPLAY_VERSION__ : `v${appVersion}`
const buildInfo = typeof __BUILD_INFO__ !== 'undefined' ? __BUILD_INFO__ : 'Development Build'
const fullVersionDisplay = typeof __FULL_VERSION_DISPLAY__ !== 'undefined'
  ? __FULL_VERSION_DISPLAY__
  : `${displayVersion} • ${buildInfo} • Modern Markdown & Mermaid Editor`

function extractFilePathFromArgv(argv: string[]): string | null {
  for (const arg of argv) {
    if (!arg || arg.startsWith('-')) continue
    if (arg === '.' || arg.endsWith('main.js') || arg.endsWith('electron') || arg.endsWith('electron.exe')) continue
    const lower = arg.toLowerCase()
    if (
      lower.endsWith('.md') ||
      lower.endsWith('.mmd') ||
      lower.endsWith('.markdown') ||
      lower.endsWith('.mermaid') ||
      lower.endsWith('.mdx')
    ) {
      return arg
    }
  }
  return null
}

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
            "img-src 'self' data: file: asset: https://github.com/sponsors/ https://avatars.githubusercontent.com https://objects.githubusercontent.com; " +
            "font-src 'self' data: file: asset:; " +
            "frame-src 'self' https://github.com/sponsors/; " +
            "connect-src 'self' https://api.github.com https://github.com https://objects.githubusercontent.com; " +
            "worker-src 'self' blob:;",
        ],
      },
    })
  })

  // Initialize auto-updater
  initUpdater(displayVersion, mainWindow)

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

// File: Get initial file (CLI argv on Windows/Linux or pending open-file on macOS)
ipcMain.handle('file:getInitialFile', async () => {
  const filePath = pendingFilePath || extractFilePathFromArgv(process.argv)
  pendingFilePath = null
  if (!filePath) return null
  try {
    const content = await readFile(filePath, 'utf-8')
    return { path: filePath, content }
  } catch (err) {
    console.error('Failed to read initial file:', err)
    return null
  }
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

// --- App Lifecycle & File Associations ---

// Handle macOS open-file event (e.g. file double-clicked or dragged to dock)
app.on('open-file', async (event, filePath) => {
  event.preventDefault()
  if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
    try {
      const content = await readFile(filePath, 'utf-8')
      mainWindow.webContents.send('file:opened', { path: filePath, content })
    } catch (err) {
      console.error('Failed to open file via macOS open-file:', err)
    }
  } else {
    pendingFilePath = filePath
  }
})

// Single instance lock for Windows & Linux
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', async (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      const filePath = extractFilePathFromArgv(argv)
      if (filePath) {
        try {
          const content = await readFile(filePath, 'utf-8')
          mainWindow.webContents.send('file:opened', { path: filePath, content })
        } catch (err) {
          console.error('Failed to open file from second instance:', err)
        }
      }
    }
  })

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
        applicationVersion: displayVersion,
        version: `${buildInfo} • Modern Markdown & Mermaid Editor`,
        copyright: 'Copyright © 2026 Raul E. Blanco (rauleblanco)',
        website: 'https://rauleblanco.com/mdmmd-edit',
        credits:
          'A modern desktop application that opens, edits, renders, and exports Markdown documents (.md) and Mermaid diagrams (.mmd) with print-quality typography.\n\nOpen source software under the MIT License.',
        iconPath: appIcon,
      })
    } catch {
      // ignore
    }

    // Configure macOS application menu
    if (process.platform === 'darwin') {
      const template: Electron.MenuItemConstructorOptions[] = [
        {
          label: 'md/mmd Edit',
          submenu: [
            {
              label: 'About md/mmd Edit',
              click: () => {
                app.showAboutPanel()
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu:open-settings', 'about')
                }
              },
            },
            {
              label: 'Check for Updates...',
              click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu:open-settings', 'about')
                }
                const updater = getUpdater()
                updater?.checkForUpdates(true)
              },
            },
            { type: 'separator' },
            {
              label: 'Preferences...',
              accelerator: 'CmdOrCtrl+,',
              click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu:open-settings', 'general')
                }
              },
            },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
        {
          role: 'fileMenu',
        },
        {
          role: 'editMenu',
        },
        {
          role: 'viewMenu',
        },
        {
          role: 'windowMenu',
        },
        {
          role: 'help',
          submenu: [
            {
              label: 'Check for Updates...',
              click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu:open-settings', 'about')
                }
                const updater = getUpdater()
                updater?.checkForUpdates(true)
              },
            },
            { type: 'separator' },
            {
              label: 'md/mmd Edit Documentation & Website',
              click: () => {
                shell.openExternal('https://rauleblanco.com/mdmmd-edit')
              },
            },
            {
              label: 'GitHub Repository',
              click: () => {
                shell.openExternal('https://github.com/rauleblanco/mdmmd-edit')
              },
            },
            {
              label: 'Support the Developer (GitHub Sponsors)',
              click: () => {
                shell.openExternal('https://github.com/sponsors/rauleblanco')
              },
            },
          ],
        },
      ]
      Menu.setApplicationMenu(Menu.buildFromTemplate(template))
    }

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

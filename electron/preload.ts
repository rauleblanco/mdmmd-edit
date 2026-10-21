import { contextBridge, ipcRenderer } from 'electron'

export interface DirectoryEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
}

export interface FileResult {
  path: string
  content: string
}

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

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'error'

export interface UpdaterState {
  status: UpdateStatus
  currentVersion: string
  info: UpdateInfo | null
  progress: DownloadProgress | null
  error: string | null
  downloadedFilePath: string | null
}

export interface MarkViewAPI {
  file: {
    open(): Promise<FileResult | null>
    openPath(path: string): Promise<FileResult>
    save(path: string, content: string): Promise<void>
    saveAs(content: string, defaultName?: string): Promise<string | null>
    readDirectory(dirPath: string): Promise<DirectoryEntry[]>
    getInitialFile(): Promise<FileResult | null>
    onFileOpened(callback: (file: FileResult) => void): () => void
  }
  export: {
    showSaveDialog(options: {
      defaultPath?: string
      filters?: { name: string; extensions: string[] }[]
    }): Promise<string | null>
    printToPDF(options: {
      html?: string
      landscape?: boolean
      marginsType?: number
      pageSize?: string
      printBackground?: boolean
    }): Promise<Uint8Array>
    saveFile(path: string, data: Uint8Array): Promise<void>
    showInFolder(path: string): void
  }
  shell: {
    openExternal(url: string): void
  }
  window: {
    minimize(): void
    maximize(): void
    close(): void
    isMaximized(): Promise<boolean>
  }
  theme: {
    get(): Promise<'light' | 'dark'>
    set(theme: 'light' | 'dark' | 'system'): void
  }
  menu?: {
    onOpenSettings(callback: (tab?: 'general' | 'editor' | 'shortcuts' | 'about') => void): () => void
  }
  updater: {
    getStatus(): Promise<UpdaterState>
    check(): Promise<UpdaterState>
    download(): Promise<void>
    install(): Promise<void>
    onStatusChange(callback: (state: UpdaterState) => void): () => void
  }
  platform: NodeJS.Platform
}

const api: MarkViewAPI = {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    openPath: (path: string) => ipcRenderer.invoke('file:openPath', path),
    save: (path: string, content: string) => ipcRenderer.invoke('file:save', path, content),
    saveAs: (content: string, defaultName?: string) =>
      ipcRenderer.invoke('file:saveAs', content, defaultName),
    readDirectory: (dirPath: string) => ipcRenderer.invoke('file:readDirectory', dirPath),
    getInitialFile: () => ipcRenderer.invoke('file:getInitialFile'),
    onFileOpened: (callback: (file: FileResult) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, file: FileResult) => callback(file)
      ipcRenderer.on('file:opened', listener)
      return () => {
        ipcRenderer.removeListener('file:opened', listener)
      }
    },
  },
  export: {
    showSaveDialog: (options) => ipcRenderer.invoke('export:showSaveDialog', options),
    printToPDF: (options) => ipcRenderer.invoke('export:printToPDF', options),
    saveFile: (path: string, data: Uint8Array) =>
      ipcRenderer.invoke('export:saveFile', path, data),
    showInFolder: (path: string) => ipcRenderer.send('shell:showInFolder', path),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.send('shell:openExternal', url),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme: 'light' | 'dark' | 'system') => ipcRenderer.send('theme:set', theme),
  },
  menu: {
    onOpenSettings: (callback: (tab?: 'general' | 'editor' | 'shortcuts' | 'about') => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        tab?: 'general' | 'editor' | 'shortcuts' | 'about'
      ) => callback(tab)
      ipcRenderer.on('menu:open-settings', listener)
      return () => {
        ipcRenderer.removeListener('menu:open-settings', listener)
      }
    },
  },
  updater: {
    getStatus: () => ipcRenderer.invoke('updater:getStatus'),
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatusChange: (callback: (state: UpdaterState) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: UpdaterState) => callback(state)
      ipcRenderer.on('updater:status', listener)
      return () => {
        ipcRenderer.removeListener('updater:status', listener)
      }
    },
  },
  platform: process.platform,
}

contextBridge.exposeInMainWorld('mdmmd', api)
contextBridge.exposeInMainWorld('mermak', api)
contextBridge.exposeInMainWorld('markview', api)

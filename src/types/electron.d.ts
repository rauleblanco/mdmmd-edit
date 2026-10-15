import type { MarkViewAPI } from '../../electron/preload'

declare global {
  interface Window {
    mdmmd?: MarkViewAPI
    mermak?: MarkViewAPI
    markview?: MarkViewAPI
  }
}

export type { MarkViewAPI, DirectoryEntry, FileResult } from '../../electron/preload'

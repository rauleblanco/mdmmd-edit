/// <reference types="vite/client" />

declare module '*?raw' {
  const content: string
  export default content
}

declare const __APP_VERSION__: string
declare const __DISPLAY_VERSION__: string
declare const __BUILD_INFO__: string
declare const __FULL_VERSION_DISPLAY__: string
declare const __GITHUB_RUN_NUMBER__: string
declare const __GITHUB_SHA__: string

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string
  readonly VITE_DISPLAY_VERSION?: string
  readonly VITE_BUILD_INFO?: string
  readonly VITE_FULL_VERSION_DISPLAY?: string
  readonly VITE_BUILD_VERSION?: string
  readonly VITE_GITHUB_RUN_NUMBER?: string
  readonly VITE_GITHUB_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/// <reference types="vite/client" />

declare module '*?raw' {
  const content: string
  export default content
}

declare const __APP_VERSION__: string
declare const __BUILD_VERSION__: string
declare const __GITHUB_RUN_NUMBER__: string
declare const __GITHUB_SHA__: string

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string
  readonly VITE_BUILD_VERSION?: string
  readonly VITE_GITHUB_RUN_NUMBER?: string
  readonly VITE_GITHUB_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

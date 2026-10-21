import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'))

const runNumber = process.env.GITHUB_RUN_NUMBER || process.env.VITE_GITHUB_RUN_NUMBER || ''
const gitSha = (process.env.GITHUB_SHA || process.env.VITE_GITHUB_SHA || '').slice(0, 7)

const pkgVersion = pkg.version || '1.0.0'
const versionParts = pkgVersion.split('.')
const majorMinor = `${versionParts[0] || '1'}.${versionParts[1] || '0'}`
// If GitHub run number is provided (e.g. 33), version is "1.0.33" (display: "v1.0.33"), otherwise "1.0.0"
const appVersion = runNumber ? `${majorMinor}.${runNumber}` : pkgVersion
const displayVersion = `v${appVersion}`
const buildInfo = runNumber
  ? `Build #${runNumber}${gitSha ? ` (${gitSha})` : ''}`
  : 'Development Build'
const fullVersionDisplay = `${displayVersion} • ${buildInfo} • Modern Markdown & Mermaid Editor`

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __DISPLAY_VERSION__: JSON.stringify(displayVersion),
      __BUILD_INFO__: JSON.stringify(buildInfo),
      __FULL_VERSION_DISPLAY__: JSON.stringify(fullVersionDisplay),
      __GITHUB_RUN_NUMBER__: JSON.stringify(runNumber),
      __GITHUB_SHA__: JSON.stringify(gitSha),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_DISPLAY_VERSION': JSON.stringify(displayVersion),
      'import.meta.env.VITE_BUILD_INFO': JSON.stringify(buildInfo),
      'import.meta.env.VITE_FULL_VERSION_DISPLAY': JSON.stringify(fullVersionDisplay),
      'import.meta.env.VITE_GITHUB_RUN_NUMBER': JSON.stringify(runNumber),
      'import.meta.env.VITE_GITHUB_SHA': JSON.stringify(gitSha),
    },
    build: {
      lib: {
        entry: resolve('electron/main.ts')
      },
      rollupOptions: {
        external: ['chokidar', 'electron-store']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve('electron/preload.ts')
      }
    }
  },
  renderer: {
    root: resolve('src'),
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __DISPLAY_VERSION__: JSON.stringify(displayVersion),
      __BUILD_INFO__: JSON.stringify(buildInfo),
      __FULL_VERSION_DISPLAY__: JSON.stringify(fullVersionDisplay),
      __GITHUB_RUN_NUMBER__: JSON.stringify(runNumber),
      __GITHUB_SHA__: JSON.stringify(gitSha),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_DISPLAY_VERSION': JSON.stringify(displayVersion),
      'import.meta.env.VITE_BUILD_INFO': JSON.stringify(buildInfo),
      'import.meta.env.VITE_FULL_VERSION_DISPLAY': JSON.stringify(fullVersionDisplay),
      'import.meta.env.VITE_GITHUB_RUN_NUMBER': JSON.stringify(runNumber),
      'import.meta.env.VITE_GITHUB_SHA': JSON.stringify(gitSha),
    },
    build: {
      rollupOptions: {
        input: resolve('src/index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()]
      }
    }
  }
})


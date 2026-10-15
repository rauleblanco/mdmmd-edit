import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'))

const runNumber = process.env.GITHUB_RUN_NUMBER || process.env.VITE_GITHUB_RUN_NUMBER || ''
const gitSha = (process.env.GITHUB_SHA || process.env.VITE_GITHUB_SHA || '').slice(0, 7)
const buildVersion =
  process.env.BUILD_VERSION ||
  process.env.VITE_BUILD_VERSION ||
  (runNumber ? `v${pkg.version} (Build #${runNumber}${gitSha ? ` · ${gitSha}` : ''})` : `v${pkg.version}`)

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
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
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_VERSION__: JSON.stringify(buildVersion),
      __GITHUB_RUN_NUMBER__: JSON.stringify(runNumber),
      __GITHUB_SHA__: JSON.stringify(gitSha),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
      'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildVersion),
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


import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const styleMockPath = resolve(__dirname, './test-config/styleMock.ts')
/**
 * 与 `rsbuild.config.ts` 里 `source.define` / 环境变量语义一致，保证单测里 `import.meta.env` 可用。
 * 根目录 `pnpm test` 经 Turbo 会执行各包的 `test` 脚本。
 */
const importMetaEnv = {
  BASE_URL: '/',
  MODE: 'test',
  DEV: true,
  PROD: false,
  SSR: false,
  PUBLIC_SKIP_AUTH: 'false',
  PUBLIC_IS_ADMIN: 'false',
  PUBLIC_ENABLED_MODULES: '',
  PUBLIC_TOKEN: '',
  PUBLIC_REFRESH_TOKEN: '',
}

// Plugin to remove mac-scrollbar CSS import that causes resolution issues
function macScrollbarMockPlugin() {
  return {
    name: 'mac-scrollbar-mock',
    transform(code: string, id: string) {
      let newCode = code
        // Remove all css/less imports without default import (import "./index.less";)
        .replace(/import\s+["'][^"']*\.(less|css)["'];?\n?/g, '')
        // Remove less/css imports and add empty styles object for css modules
        // Handle all named imports like "import xxx from './xxx.less'" or "import xxx from './xxx.css'"
        .replace(/import\s+(\w+)\s+from\s+["'][^"']*\.(less|css)["'];?\n?/g, 'const $1 = {};\n')
        // Mock SVG ?react imports - replace with a simple functional component
        .replace(/import\s+(\w+)\s+from\s+["'][^"']*\.svg\?react["'];?\n?/g, 'const $1 = () => null;\n')
        // Remove arbitrary value brackets from className to avoid nwsapi parsing errors
        .replace(/mb-\[.*?\]/g, '')
        .replace(/py-\[.*?\]/g, '')
        .replace(/px-\[.*?\]/g, '')
        .replace(/text-\[.*?\]/g, '')
        .replace(/accent-\[.*?\]/g, '')
      // Only return modified code if changes were made
      if (newCode !== code) {
        return { code: newCode }
      }
      return null
    },
  }
}

// Bridge plugin type mismatch when multiple Vite versions coexist in workspace.
const asPlugin = <T,>(plugin: T): T => plugin

export default defineConfig({
  plugins: [asPlugin(react()) as any, asPlugin(macScrollbarMockPlugin()) as any],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      // mock main entry first (exact match)
      { find: 'mac-scrollbar', replacement: resolve(__dirname, './test-config/macScrollbarMock.tsx') },
      // `.css` / `.less`：构建由 Rsbuild 处理；Vitest 侧用占位模块，避免未配置预处理器时导入失败
      { find: /\.(css|less)$/, replacement: styleMockPath },
    ],
  },
  define: {
    'import.meta.env': JSON.stringify(importMetaEnv),
  },
  test: {
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './test-config/setupTests.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/components/DigitalHumanSetting/AdPromptInput/**'],
    passWithNoTests: true,
  },
})

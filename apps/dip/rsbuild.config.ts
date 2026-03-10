import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginLess } from '@rsbuild/plugin-less'
import { pluginSvgr } from '@rsbuild/plugin-svgr'
import { Agent as HttpsAgent } from 'https'
import { rsbuildMiddlewarePlugin } from './rsbuild-plugin-middleware'

// 开发环境代理到 HTTPS 后端时，使用自定义 Agent 忽略自签名证书校验，避免 ECONNRESET
const isHttpsTarget = process.env.DEBUG_ORIGIN?.startsWith('https://')
const proxyAgent = isHttpsTarget
  ? new HttpsAgent({ rejectUnauthorized: false })
  : undefined

const proxyBase = {
  target: process.env.DEBUG_ORIGIN,
  changeOrigin: true,
  secure: false,
  ...(proxyAgent && { agent: proxyAgent }),
}

// Docs: https://rsbuild.rs/config/
// 确保 assetPrefix 始终以 / 结尾，而 BASE_PATH 不带尾部斜杠
const rawPublicPath = process.env.PUBLIC_PATH || '/dip-hub/'
const assetPrefix = rawPublicPath.endsWith('/')
  ? rawPublicPath
  : `${rawPublicPath}/`
const basePath = assetPrefix.endsWith('/')
  ? assetPrefix.slice(0, -1)
  : assetPrefix

export default defineConfig({
  output: {
    // 设置公共路径，默认为 /dip-hub/
    // 可以通过环境变量 PUBLIC_PATH 覆盖
    // rsbuild 使用 assetPrefix 而不是 publicPath
    // assetPrefix 应该以 / 结尾
    assetPrefix,
  },
  source: {
    // 注入全局变量，供前端代码使用
    // BASE_PATH 不带尾部斜杠（用于路由和路径拼接）
    // 使用项目特定的命名，避免与其他项目冲突（特别是微前端场景）
    define: {
      'window.__DIP_HUB_BASE_PATH__': JSON.stringify(basePath),
    },
    // 配置 antd 按需加载（antd 6.0 使用 CSS-in-JS，自动按需加载）
    transformImport: [
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: false, // antd 6.0 使用 CSS-in-JS，不需要加载 CSS
      },
      {
        libraryName: 'lodash',
        customName: 'lodash/{{ member }}',
      },
    ],
  },
  server: {
    port: 3001,
    // 配置代理，解决远程微应用 CORS 问题
    proxy: {
      // 开发环境：将 API 请求代理到远程服务器
      // 登录相关路由由中间件插件处理，不走代理
      '/api/dip-hub': {
        ...proxyBase,
        // 排除登录相关路由，这些由中间件插件处理
        bypass(req) {
          const url = req.url || ''
          if (
            url.includes('/v1/login') ||
            url.includes('/v1/logout') ||
            url.includes('/v1/login/callback') ||
            url.includes('/v1/logout/callback')
          ) {
            // 返回 false 表示不使用代理，由中间件处理
            return false
          }
          return undefined // 其他路由继续使用代理
        },
      },
      '/api/dip-studio':proxyBase,      
      '/api/mdl-data-model': proxyBase,
      '/api/agent-factory': proxyBase,
      '/api/deploy-web-service': proxyBase,
      '/api/ontology-manager': proxyBase,
      // 剩余所有 API 请求代理到 DEBUG_ORIGIN
      '/api/*': proxyBase,
      '/oauth2/*': proxyBase,
    },
  },
  plugins: [
    pluginReact(),
    pluginLess(),
    pluginSvgr(),
    // 开发环境中间件插件：处理登录和服务转发
    rsbuildMiddlewarePlugin(),
  ],
  html: {
    // 设置页面标题，覆盖 Rsbuild 默认的 "Rsbuild App"
    title: 'DIP',
    // 使用 public/dip.png 作为浏览器标签页图标
    // 这里路径相对于项目根目录（public/dip.svg）
    favicon: 'public/dip.png',
    // 设置根元素 id，避免与微应用的 #root 冲突
    template: 'public/index.html',
  },
  resolve: {
    alias: {
      '@': './src',
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import viteMiddlewarePlugin from './vite-plugin-middleware.js'
import { proxyConfigs } from './config/proxy.ts'

// 自定义插件：处理所有 SVG 导入
const svgPlugin = () => ({
    name: 'svg-handler',
    enforce: 'pre',
    resolveId(id) {
        // 匹配所有 SVG 文件的导入
        if (id.includes('.svg')) {
            return `\0svg-fallback:${id}`
        }
        return null
    },
    load(id) {
        if (id.startsWith('\0svg-fallback:')) {
            return `
                import React from 'react';

                const SvgPlaceholder = React.forwardRef((props, ref) => {
                    return React.createElement('span', {
                        ...props,
                        ref,
                        style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '1em',
                            height: '1em',
                            fontSize: '12px',
                            ...props.style
                        }
                    }, '📦');
                });

                export const ReactComponent = SvgPlaceholder;
                export { SvgPlaceholder as default };
            `
        }
        return null
    },
})

export default defineConfig(({ mode }) => {
    // 加载环境变量
    const env = loadEnv(mode, process.cwd(), '')
    const { DEBUG_ORIGIN } = env

    return {
        base: '/anyfabric/',

        plugins: [
            // 自定义中间件
            viteMiddlewarePlugin(),
            react(),
            svgPlugin(),
        ],

        server: {
            host: '0.0.0.0',
            port: 3000, // 如果端口被占用，Vite会自动尝试下一个可用端口
            open: true,
            hmr: {
                overlay: false,
            },
            proxy: {
                // 从 config/proxy.ts 导入的代理配置 - 优先级更高
                ...proxyConfigs,
                '/api/': {
                    target: DEBUG_ORIGIN,
                    changeOrigin: true,
                    secure: false,
                    rejectUnauthorized: false,
                },
                '/af/api/': {
                    target: DEBUG_ORIGIN,
                    changeOrigin: true,
                    secure: false,
                    rejectUnauthorized: false,
                    // 排除认证路由 - 这些由viteMiddlewarePlugin处理
                    bypass(req, res, options) {
                        // 认证路由由中间件处理,不走代理
                        if (
                            [
                                '/af/api/session/v1/login',
                                '/af/api/session/v1/logout',
                            ].some((o) => req.url.includes(o))
                        ) {
                            return false // 返回false表示不使用代理
                        }
                        return undefined // 其他路由继续使用代理
                    },
                },
            },
        },

        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                'react-native': 'react-native-web',
                // 确保 React 和 ReactDOM 只有一个实例
                'react': path.resolve(__dirname, 'node_modules/react'),
                'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
            mainFields: ['browser', 'module', 'main'],
        },

        css: {
            preprocessorOptions: {
                less: {
                    javascriptEnabled: true,
                    modifyVars: {
                        '@ant-prefix': 'any-fabric-ant',
                        '@ant-icon-prefix': 'any-fabric-anticon',
                    },
                    // 修改 additionalData，使用追加方式而不是前插方式
                    additionalData: (source) => {
                        const commonLessPath = path.resolve(
                            __dirname,
                            'src/common.less',
                        )
                        return `${source}\n@import "${commonLessPath}";`
                    },
                },
            },
        },

        // 定义全局变量，兼容 process.env.NODE_ENV 等老写法，只暴露安全的变量
        define: {
            'process.env': {
                NODE_ENV: env.NODE_ENV,
                MODE: env.MODE,
                DEV: env.DEV,
                PROD: env.PROD,
                BASE_URL: env.BASE_URL,
                DEBUG_ORIGIN: env.DEBUG_ORIGIN,
            },
            global: 'window',
        },

        // 配置构建选项
        build: {
            // 减少并行处理的数量以节省内存
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
                input: {
                    // 主页面
                    index: path.resolve(__dirname, 'config/vite/index.html'),
                    // 子应用页面
                    dataOperationAudit: path.resolve(
                        __dirname,
                        'config/vite/dataOperationAudit.html',
                    ),
                    download: path.resolve(
                        __dirname,
                        'config/vite/download.html',
                    ),
                    dmdAudit: path.resolve(
                        __dirname,
                        'config/vite/dmdAudit.html',
                    ),
                    afPluginFrameworkForAs: path.resolve(
                        __dirname,
                        'config/vite/afPluginFrameworkForAs.html',
                    ),
                },
                output: {
                    // 确保每个页面的输出文件名不冲突
                    entryFileNames: 'static/js/[name].[hash].js',
                    chunkFileNames: 'static/js/[name].[hash].chunk.js',
                    assetFileNames: 'static/[ext]/[name].[hash].[ext]',
                    // 减少内存使用的配置
                    manualChunks: undefined,
                },
                // 减少 rollup 的内存使用
                maxParallelFileOps: 5,
            },
            // 减少并行处理的文件数
            target: 'es2015',
            minify: 'esbuild',
        },

        // 优化依赖构建
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react-router-dom',
                'antd',
                'lodash',
                'axios',
            ],
            exclude: ['vite-plugin-svgr'],
            // 强制去重 React 和 ReactDOM
            force: true,
        },
    }
})

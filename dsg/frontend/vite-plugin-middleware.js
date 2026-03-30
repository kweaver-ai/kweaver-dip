import { loadEnv } from 'vite'
import express from 'express'
import axios from 'axios'
import { Agent } from 'https'

/**
 * 统一身份认证平台登录代理插件
 */
export default function viteMiddlewarePlugin () {
    return {
        name: 'vite-plugin-middleware',

        configureServer (server) {
            const env = loadEnv(server.config.mode, process.cwd(), '')

            // 创建 Express 应用
            const app = express()

            // 设置中间件
            setupParsers(app)

            // 创建一个动态获取端口的函数
            const getActualPort = () => {
                return (
                    server.httpServer?.address()?.port ||
                    server.config.server.port ||
                    3000
                )
            }

            // 设置认证路由，但使用动态端口获取
            setupAuthRoutes(app, env, server, getActualPort)
            setupLogging(app)

            // 监听服务器启动完成事件，确保OAuth客户端使用正确端口
            server.httpServer?.once('listening', () => {
                const actualPort = server.httpServer.address()?.port
                // 通知认证路由更新端口信息
                if (app.updatePort) {
                    app.updatePort(actualPort)
                }
            })

            // 将 Express 应用挂载到 Vite 中间件
            // 由于 base URL 是 /anyfabric/，我们需要挂载在 /af/api 上
            server.middlewares.use('/af/api', app)
        },
    }
}

function setupParsers (app) {
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))
}

function setupAuthRoutes (app, env, server, getPort) {
    const { DEBUG_ORIGIN } = env

    let clientCache = null
    let currentPort = null

    // 动态获取端口和URI的函数
    const getConfig = () => {
        const port = typeof getPort === 'function' ? getPort() : getPort
        if (port !== currentPort) {
            currentPort = port
            // 端口变化时清除客户端缓存
            clientCache = null
        }
        const ORIGIN = `http://localhost:${port}`
        const REDIRECT_URI = `${ORIGIN}/af/api/session/v1/login/callback`
        const POST_LOGOUT_REDIRECT_URI = `${ORIGIN}/af/api/session/v1/logout/callback`

        return { port, ORIGIN, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI }
    }

    // 提供端口更新方法
    app.updatePort = (newPort) => {
        if (newPort !== currentPort) {
            clientCache = null // 清除缓存，强制重新注册客户端
        }
    }

    const initialConfig = getConfig()

    const registerClient = async () => {
        if (clientCache) return clientCache

        try {
            const config = getConfig()
            const { data } = await axios.post(
                '/oauth2/clients',
                {
                    grant_types: [
                        'authorization_code',
                        'refresh_token',
                        'implicit',
                    ],
                    scope: 'offline openid all',
                    redirect_uris: [config.REDIRECT_URI],
                    post_logout_redirect_uris: [
                        config.POST_LOGOUT_REDIRECT_URI,
                    ],
                    client_name: 'WebDebugClient',
                    metadata: {
                        device: {
                            name: 'WebDebugClient',
                            client_type: 'unknown',
                            description: 'WebDebugClient',
                        },
                    },
                    response_types: ['token id_token', 'code', 'token'],
                },
                {
                    baseURL: DEBUG_ORIGIN,
                    httpsAgent: new Agent({ rejectUnauthorized: false }),
                },
            )

            clientCache = data
            // console.log('✅ OAuth2 客户端注册成功')
            return data
        } catch (error) {
            console.error('❌ OAuth2 客户端注册失败:', error.message)
            return null
        }
    }

    // 登录路由 (注意：路径不需要包含 /af/api 前缀，因为中间件已经挂载在 /af/api 上)
    app.get('/session/v1/login', async function (req, res) {
        try {
            const config = getConfig()

            const clientData = await registerClient()
            if (!clientData) {
                return res.status(500).send('OAuth 客户端注册失败')
            }

            const { client_id } = clientData
            const { redirect, lang } = req.query

            // 保持与旧配置一致，不设置默认值
            const state = Buffer.from(decodeURIComponent(redirect)).toString(
                'base64',
            )

            res.cookie('state', state, { httpOnly: true })
            const url = `${DEBUG_ORIGIN}/oauth2/auth?client_id=${client_id}&response_type=code&scope=offline+openid+all&redirect_uri=${encodeURIComponent(
                config.REDIRECT_URI,
            )}&state=${encodeURIComponent(state)}&lang=${lang || 'zh-cn'}`

            res.redirect(url)
        } catch (error) {
            console.error('❌ 登录路由错误:', error)
            res.status(500).send('登录处理失败')
        }
    })

    // 登录回调
    app.get('/session/v1/login/callback', async function (req, res) {
        const config = getConfig()

        const { client_secret, client_id } = await registerClient()
        const { code, state } = req.query
        const params = new URLSearchParams()

        params.append('grant_type', 'authorization_code')
        params.append('code', code)
        params.append('redirect_uri', config.REDIRECT_URI)
        try {
            const {
                data: { access_token, id_token },
            } = await axios.post(`${DEBUG_ORIGIN}oauth2/token`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(
                        `${encodeURIComponent(client_id)}:${encodeURIComponent(
                            client_secret,
                        )}`,
                    ).toString('base64')}`,
                },
                httpsAgent: new Agent({
                    rejectUnauthorized: false,
                }),
            })

            res.cookie('af.oauth2_token', access_token, { httpOnly: false })
            res.cookie('id_token', id_token, { httpOnly: false })
            res.clearCookie('state')
            res.redirect('/anyfabric/login-success')
        } catch (error) {
            // 与旧配置保持一致，静默处理错误
            // console.log(error)
        }
    })

    // 登出
    app.get('/session/v1/logout', async function (req, res) {
        res.clearCookie('af.oauth2_token')
        res.clearCookie('id_token')
        res.clearCookie('state')
        res.redirect('/session/v1/logout/callback')
    })

    // 登出回调
    app.get('/session/v1/logout/callback', async function (req, res) {
        res.redirect('/')
    })

    // 注意：所有API代理现在都通过Vite的server.proxy配置处理
    // 这里只处理认证相关的路由
}

function setupLogging (app) {
    app.use((req, res, next) => {
        if (
            req.url.startsWith('/af/api/session/') ||
            req.url.startsWith('/api/')
        ) {
            const start = Date.now()
            res.on('finish', () => {
                const duration = Date.now() - start
                console.log(
                    `[${new Date().toLocaleTimeString()}]`,
                    req.method.padEnd(6),
                    req.url.substring(0, 60).padEnd(60),
                    res.statusCode,
                    `${duration}ms`,
                )
            })
        }
        next()
    })
}

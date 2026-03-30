import axios, {
    AxiosRequestConfig,
    AxiosResponse,
    CancelTokenSource,
} from 'axios'
import { message } from 'antd'
import Cookies from 'js-cookie'
import { isFunction, isEmpty } from 'lodash'
import { getActualUrl } from './browser'
import { createTokenIntercepter } from './token-intercepter'
import { tokenManager, TokenManager } from './tokenManager'

interface RequestDefault {
    micro?: any
    accessToken?: string
}

// 在 AxiosRequestConfig 中扩展自定义配置
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    returnFullResponse?: boolean // 是否返回完整响应对象
}

interface Reuqests {
    get<T = any>(
        url: string,
        params?: any,
        config?: AxiosRequestConfig,
    ): Promise<T>
    post<T = any, R = any>(
        url: string,
        body?: T,
        config?: CustomAxiosRequestConfig,
    ): Promise<R>
    put<T = any, R = any>(
        url: string,
        body?: T,
        config?: AxiosRequestConfig,
    ): Promise<R>
    delete(url: string, params?: any, body?: any): Promise<any>
    patch<T = any, R = any>(url: string, body: T): Promise<R>
    head(url: string): Promise<void>
    default: RequestDefault
}

const requests: Reuqests = {
    get: (url, params?, config?) =>
        axiosInstance.get(url, {
            params: { ...(params || {}), _t: new Date().getTime() },
            ...config,
        }),
    post: (url, body, config) => axiosInstance.post(url, body, { ...config }),
    put: (url, body, config) => axiosInstance.put(url, body, { ...config }),

    delete: (url, params?, body?) =>
        axiosInstance.delete(url, {
            params: { ...(params || {}), _t: new Date().getTime() },
            data: body,
        }),
    patch: (url, body) => axiosInstance.patch(url, body),
    head: (url) => axiosInstance.head(url),
    default: {},
}

export const axiosInstance = axios.create({
    timeout: 0,
    headers: {
        'Content-Type': 'application/json',
    },
})

const { CancelToken } = axios
let sourceArr: { source: CancelTokenSource; config: AxiosRequestConfig }[] = []

export const clearSource = () => {
    sourceArr = []
}

export const getSource = () => sourceArr

export const cancelRequest = (
    url: string,
    method: 'get' | 'post' | 'put' | 'delete',
) => {
    const sor = getSource()
    if (sor.length > 0) {
        sor.forEach((info) => {
            if (info.config?.url === url && info.config?.method === method) {
                info.source.cancel()
            }
        })
    }
}

// 添加请求拦截器
axiosInstance.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
        const configInner = config

        let token: string | null = null

        if (requests.default.micro) {
            try {
                token = await tokenManager.getToken()
            } catch (error) {
                console.warn(
                    '[Request] Failed to get token from TokenManager:',
                    error,
                )
            }
        }
        // 独立模式: 从cookie读取
        else {
            token = Cookies.get('af.oauth2_token') || ''
        }

        if (configInner && configInner.headers && token) {
            configInner.headers.Authorization = `Bearer ${token}`
        }

        const source = CancelToken.source()
        sourceArr.push({ source, config })
        configInner.cancelToken = source.token

        return configInner
    },
    (error) => Promise.reject(error),
)

// 调用宿主刷新能力 (优先使用 qiankun props 传入的 refreshToken)
async function refreshTokenFromHost() {
    // 使用全局挂载的刷新 (兼容旧代码)
    const globalRefresh: (() => Promise<{ accessToken?: string }>) | undefined =
        // eslint-disable-next-line no-underscore-dangle
        (window as any).__QIANKUN_REFRESH_TOKEN__

    // 使用微应用 props 中的 refreshToken
    const propsRefresh = requests.default.micro?.token?.refreshToken

    // 尝试使用 accessToken getter 获取最新 token
    const getLatestToken = requests.default.micro?.token?.accessToken

    const hostRefresh = globalRefresh || propsRefresh

    // 如果主应用提供了 getter,尝试直接获取最新 token
    if (getLatestToken && !hostRefresh) {
        try {
            const latestToken =
                typeof getLatestToken === 'function'
                    ? await getLatestToken()
                    : getLatestToken

            if (latestToken) {
                tokenManager.setToken(latestToken)

                // 独立模式写cookie
                if (!requests.default.micro) {
                    TokenManager.setCookie(latestToken, { expires: 1 })
                }

                return { accessToken: latestToken }
            }
        } catch (error) {
            // 如果 getter 失败,继续尝试其他方式
            console.warn('Failed to get latest token from getter:', error)
        }
    }

    if (isFunction(hostRefresh)) {
        const result = await hostRefresh()
        const accessToken = result?.accessToken || (result as any)?.access_token
        if (accessToken) {
            tokenManager.setToken(accessToken)
            // 独立模式写cookie
            if (!requests.default.micro) {
                TokenManager.setCookie(accessToken, { expires: 1 })
            }
        }
        return result
    }
    return null
}

// 调用AF refresh token 接口刷新 AF token
export async function refreshOauth2Token(): Promise<any> {
    const hostResult = await refreshTokenFromHost()
    if (hostResult) {
        return hostResult
    }
    return requests.get('/af/api/session/v1/refresh-token')
}

// 集成到宿主应用，获取最新的有效token
export async function refreshByNewHostToken(): Promise<any> {
    if (
        requests.default.micro?.config?.getMicroWidgetByCommand({
            command: 'anyfabric-app',
        }).length > 0 &&
        isFunction(requests.default.micro?.token?.refreshOauth2Token)
    ) {
        try {
            // 从宿主获取新的token
            const asToken =
                await requests.default.micro?.token?.refreshOauth2Token()

            if (asToken?.access_token) {
                // 刷新 AF sso 接口，获取新的AF token
                const res = await requests.post(`/af/api/session/v1/sso`, {
                    code: asToken?.access_token,
                })

                const newToken = res?.access_token
                if (newToken) {
                    tokenManager.setToken(newToken)
                    requests.default.accessToken = newToken
                }

                return res
            }
        } catch (error) {
            return error
        }
    }
    return null
}

export const onTokenExpired = () => {
    if (isFunction(requests.default.micro?.token?.onTokenExpired)) {
        requests.default.micro?.token?.onTokenExpired?.()
        return
    }

    if (isFunction(requests.default.micro?.logout)) {
        requests.default.micro?.logout?.()
        return
    }
    window.location.href = getActualUrl('/')
}

const tokenIntercepter = createTokenIntercepter({
    refreshToken: () => refreshOauth2Token(),
    onTokenExpired,
    refreshByNewHostToken: () => refreshByNewHostToken(),
    getMicroWidget: () => requests.default.micro,
})

axiosInstance.interceptors.response.use((res) => res, tokenIntercepter)

axiosInstance.interceptors.response.use(
    (res: AxiosResponse) => {
        const { data, config } = res
        if ((config as CustomAxiosRequestConfig).returnFullResponse) {
            return res
        }
        return data // 返回数据
    },
    (error) => {
        let errorInner = error

        if (
            errorInner.code === 'ECONNABORTED' &&
            errorInner.message.indexOf('timeout') !== -1
        ) {
            errorInner = {
                response: {
                    data: {
                        message: 'Timeout',
                    },
                },
            }
        } else if (errorInner.code === 'ERR_CANCELED') {
            errorInner = {
                response: {
                    data: {
                        code: errorInner.code,
                        message: 'Cancel',
                    },
                },
            }
        }

        if (
            errorInner?.response?.data?.code ===
            'TaskCenter.Common.MissingUserToken'
        ) {
            message.error('登录信息失效，请重新登录', 5)
            window.location.href = getActualUrl('/')
        }

        return Promise.reject(
            errorInner && errorInner.response ? errorInner.response : null,
        )
    },
)

export default requests

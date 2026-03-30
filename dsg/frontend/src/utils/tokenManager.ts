/**
 * TokenManager - 微应用Token安全管理器
 */

import Cookies from 'js-cookie'
import type { IMicroAppProps } from '@/context/MicroAppPropsProvider'

interface TokenInfo {
    token: string
    expiresAt: number
}

class TokenManager {
    /**
     * 微应用props(包含token的getter)
     */
    private microAppProps: IMicroAppProps | null = null

    /**
     * 内存中的token缓存
     */
    private memoryToken: string | null = null

    /**
     * 设置微应用props
     */
    setMicroAppProps(props: IMicroAppProps): void {
        this.microAppProps = props
    }

    /**
     * 清理微应用props和内存token
     */
    clearMicroAppProps(): void {
        this.microAppProps = null
        this.memoryToken = null
    }

    /**
     * 获取当前token
     */
    async getToken(): Promise<string | null> {
        if (this.microAppProps?.token?.accessToken) {
            try {
                const tokenGetter: any = this.microAppProps.token.accessToken
                const token =
                    typeof tokenGetter === 'function'
                        ? await tokenGetter()
                        : tokenGetter

                if (token) {
                    this.memoryToken = token
                    return token
                }
            } catch (error) {
                console.warn(
                    '[TokenManager] Failed to get token from props getter:',
                    error,
                )
            }
        }

        if (this.memoryToken) {
            return this.memoryToken
        }

        const cookieToken = Cookies.get('af.oauth2_token')
        if (cookieToken) {
            this.memoryToken = cookieToken
            return cookieToken
        }

        return null
    }

    /**
     * 设置token到内存
     */
    setToken(token: string): void {
        this.memoryToken = token
    }

    /**
     * 设置cookie(仅用于独立模式)
     */
    static setCookie(token: string, options?: { expires?: number }): void {
        const isHttps = window.location.protocol === 'https:'
        Cookies.set('af.oauth2_token', token, {
            expires: options?.expires || 1, // 默认1天
            path: '/',
            secure: isHttps, // 仅HTTPS传输
            sameSite: 'strict', // 防止CSRF攻击
        })
    }

    /**
     * 清理所有token
     */
    clearAll(): void {
        this.memoryToken = null
        this.microAppProps = null
        Cookies.remove('af.oauth2_token', { path: '/' })

        // 清理旧localStorage key(兼容)
        try {
            localStorage.removeItem('micro_app_access_token')
        } catch (error) {
            // 忽略
        }
    }

    /**
     * 初始化清理机制
     */
    initCleanupMechanism(): void {
        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            this.clearMicroAppProps()
        })

        window.addEventListener('storage', (e) => {
            if (e.key === 'logout_event' && e.newValue === 'logout') {
                this.clearAll()
            }
        })
    }

    /**
     * 检查是否在微应用模式
     */
    isMicroAppMode(): boolean {
        return this.microAppProps !== null
    }
}

// 导出类和单例
export { TokenManager }
export const tokenManager = new TokenManager()

/**
 * Hook: 使用TokenManager
 */
export const useTokenManager = () => {
    return {
        getToken: () => tokenManager.getToken(),
        setToken: (token: string) => tokenManager.setToken(token),
        clearAll: () => tokenManager.clearAll(),
        isMicroAppMode: () => tokenManager.isMicroAppMode(),
    }
}

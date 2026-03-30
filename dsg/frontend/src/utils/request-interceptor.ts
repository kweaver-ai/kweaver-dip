/**
 * 获取微应用的token (从qiankun主应用传递的token)
 * 保留兼容
 */
export const getMicroAppToken = (): string | null => {
    try {
        // eslint-disable-next-line no-underscore-dangle
        const qiankunProps = (window as any).__QIANKUN_PROPS__
        if (qiankunProps?.token?.accessToken) {
            return qiankunProps.token.accessToken
        }

        // eslint-disable-next-line no-underscore-dangle
        const globalRefresh = (window as any).__QIANKUN_REFRESH_TOKEN__
        if (typeof globalRefresh === 'function') {
            // eslint-disable-next-line no-console
            console.warn(
                '[request] getMicroAppToken is deprecated, use TokenManager instead',
            )
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[request] 获取微应用token失败:', error)
    }
    return null
}

/**
 * 检查是否为微应用模式
 */
export const isMicroAppMode = (): boolean => {
    try {
        if (localStorage.getItem('micro_app_platform')) {
            return true
        }

        // 检查是否在qiankun环境中
        // eslint-disable-next-line no-underscore-dangle
        if ((window as any).__POWERED_BY_QIANKUN__) {
            return true
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[request] 检查微应用模式失败:', error)
    }
    return false
}

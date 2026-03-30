/**
 * qiankun全局类型定义
 */

declare global {
    interface Window {
        /** qiankun环境标记 */
        __POWERED_BY_QIANKUN__?: boolean
        /** qiankun注入的publicPath */
        __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string
        /** 保存qiankun传递的props */
        __QIANKUN_PROPS__?: any
        /** 开发环境微应用导出 */
        __ANYFABRIC_MICRO_APP__?: {
            bootstrap: () => Promise<void>
            mount: (props: any) => Promise<void>
            unmount: (props: any) => Promise<void>
        }
        /** 当前微应用类型标识 */
        __MICRO_APP_TYPE__?: string
    }
}

// 扩展ImportMeta
interface ImportMeta {
    env: {
        DEV: boolean
        MODE: string
        BASE_URL: string
        PROD: boolean
        SSR: boolean
    }
}

export {}

// 额外的window属性
declare global {
    interface Window {
        /** 保存当前用户信息 */
        __CURRENT_USER__?: any
        /** 保存token刷新方法 */
        __QIANKUN_REFRESH_TOKEN__?: () => Promise<any>
    }
}

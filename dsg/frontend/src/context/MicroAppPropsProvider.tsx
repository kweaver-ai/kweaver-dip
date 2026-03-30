import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

/**
 * 微应用Props接口 (对接dip)
 */
export interface IMicroAppProps {
    application?: {
        icon: string
        id: number
        name: string
    }
    /** token信息 */
    token?: {
        /** 访问令牌 (getter,每次访问获取最新值) */
        get accessToken(): string
        /** 刷新token */
        refreshToken: () => Promise<{ accessToken: string }>
        /** token过期处理 */
        onTokenExpired?: (code?: number) => void
    }
    /** 路由信息 */
    route?: {
        /** 基础路径 */
        basename: string
        /** 首页路由 */
        homeRoute?: string
    }
    /** 用户信息 */
    user?: {
        /** 用户ID */
        id: string
        /** 显示名称 (getter) */
        get vision_name(): string
        /** 账号 (getter) */
        get account(): string
    }
    /** UI组件渲染函数 */
    renderAppMenu?: (container: HTMLElement | string) => void
    /** 退出登录 */
    logout?: () => void
    /** 全局状态管理 */
    setMicroAppState?: (state: Record<string, any>) => boolean
    onMicroAppStateChange?: (
        callback: (state: any, prev: any) => void,
        fireImmediately?: boolean,
    ) => () => void
    /** 容器DOM */
    container?: HTMLElement
    /** 显示侧边栏 */
    toggleSideBarShow?: (show: boolean) => void
}

interface IMicroAppPropsContext {
    microAppProps: IMicroAppProps
    setMicroAppProps: Dispatch<SetStateAction<IMicroAppProps>>
}

interface IMicroAppPropsProvider {
    initMicroAppProps?: IMicroAppProps
    children: ReactNode
}

export const MicroAppPropsContext = React.createContext<IMicroAppPropsContext>({
    microAppProps: {},
    setMicroAppProps: noop,
})

/**
 * 微应用Props Provider
 * 用于管理qiankun传递的props
 */
export const MicroAppPropsProvider: React.FC<IMicroAppPropsProvider> = ({
    initMicroAppProps = {},
    children,
}) => {
    const [microAppProps, setMicroAppProps] =
        useState<IMicroAppProps>(initMicroAppProps)
    const values = useMemo(
        () => ({ microAppProps, setMicroAppProps }),
        [microAppProps, setMicroAppProps],
    )

    return (
        <MicroAppPropsContext.Provider value={values}>
            {children}
        </MicroAppPropsContext.Provider>
    )
}

/**
 * Hook: 获取微应用Props
 */
export const useMicroAppProps = () => {
    const context = React.useContext(MicroAppPropsContext)
    if (!context) {
        // eslint-disable-next-line no-console
        console.warn(
            'useMicroAppProps must be used within MicroAppPropsProvider',
        )
        return { microAppProps: {} as any, setMicroAppProps: noop }
    }
    return context
}

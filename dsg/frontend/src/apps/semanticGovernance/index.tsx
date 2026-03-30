import '../../public-path'
import React from 'react'
import ReactDOM from 'react-dom'
import { logout } from '@/core'
import '../../font/iconfont.css'
import '../../font/iconfont.js'
import AppShell from '@/AppShell'
import type { IMicroAppProps } from '@/context/MicroAppPropsProvider'

// 设置全局微应用类型标识
// eslint-disable-next-line no-underscore-dangle
window.__MICRO_APP_TYPE__ = 'semantic-governance'

/**
 * 将 microWidgetProps (AnyShare格式) 转换为 IMicroAppProps (DIP格式)
 * 用于兼容两种不同的宿主传入格式
 */
function transformPropsToMicroAppProps(props: any): IMicroAppProps {
    // 如果已经是标准的 microAppProps 格式,直接返回
    if (
        props?.token?.accessToken ||
        props?.user?.id ||
        props?.route?.basename
    ) {
        return props
    }

    // 如果是 microWidgetProps 格式 (类似 afPluginFrameworkForAs)
    const microWidgetProps = props?.microWidgetProps || props

    return {
        token: {
            get accessToken(): string {
                return microWidgetProps?.token?.getToken?.access_token || ''
            },
            refreshToken: microWidgetProps?.token?.refreshOauth2Token,
            onTokenExpired: microWidgetProps?.token?.onTokenExpired,
        },
        route: {
            basename: microWidgetProps?.history?.getBasePath,
        },
        user: {
            id: microWidgetProps?.config?.userInfo?.id || '',
            get vision_name(): string {
                return (
                    microWidgetProps?.config?.userInfo?.user?.displayName || ''
                )
            },
            get account(): string {
                return microWidgetProps?.config?.userInfo?.user?.loginName || ''
            },
        },
        application: microWidgetProps?.application,
        renderAppMenu: microWidgetProps?.renderAppMenu,
        logout: microWidgetProps?.logout,
        setMicroAppState: microWidgetProps?.setMicroAppState,
        onMicroAppStateChange: microWidgetProps?.onMicroAppStateChange,
        container: microWidgetProps?.container,
        toggleSideBarShow: microWidgetProps?.toggleSideBarShow,
    }
}

/**
 * 渲染函数 - 支持qiankun微应用和独立运行
 * @param props qiankun传递的props,包含token, route, user等信息
 * 支持两种格式:
 * 1. 标准的 IMicroAppProps (DIP格式)
 * 2. 包含 microWidgetProps 的对象 (AnyShare格式,类似 afPluginFrameworkForAs)
 */
function render(props?: any) {
    const { container } = props || {}
    // 转换属性格式以兼容两种宿主传入方式
    const microAppProps = transformPropsToMicroAppProps(props)
    ReactDOM.render(
        <AppShell
            mode="micro-app"
            containerId="semantic-governance"
            microAppProps={microAppProps}
        />,
        container
            ? container.querySelector('#semantic-governance')
            : document.querySelector('#semantic-governance') ||
                  document.querySelector('#root'),
    )
}

// 如果不是在qiankun环境中运行,直接渲染(用于本地开发调试)
// eslint-disable-next-line no-underscore-dangle
if (!window.__POWERED_BY_QIANKUN__) {
    render({})
}

/**
 * qiankun生命周期 - bootstrap
 * 只在首次加载时调用一次
 */
export async function bootstrap() {
    // console.log('[AnyFabric微应用-semanticGovernance] bootstrap')
}

/**
 * qiankun生命周期 - mount
 * 每次进入微应用时调用
 */
export async function mount(props: any) {
    // 将qiankun传递的props保存到window,供应用内部使用
    // eslint-disable-next-line no-underscore-dangle
    window.__QIANKUN_PROPS__ = props

    // 调用宿主的 toggleSideBarShow 隐藏侧边栏
    if (props.toggleSideBarShow) {
        props.toggleSideBarShow(false)
    }

    render(props)
}

/**
 * qiankun生命周期 - unmount
 * 每次离开微应用时调用
 */
export async function unmount(props: any) {
    const { container } = props || {}

    try {
        // 调用logout清理资源
        await logout()
    } catch (error) {
        // console.error('[AnyFabric微应用-semanticGovernance] unmount时logout出错:', error)
    }

    ReactDOM.unmountComponentAtNode(
        container
            ? container.querySelector('#semantic-governance')
            : document.querySelector('#semantic-governance') ||
                  document.querySelector('#root'),
    )

    // 清理保存的props
    // eslint-disable-next-line no-underscore-dangle
    delete window.__QIANKUN_PROPS__
}

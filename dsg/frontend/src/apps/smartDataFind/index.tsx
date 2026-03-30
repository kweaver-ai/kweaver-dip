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
window.__MICRO_APP_TYPE__ = 'smart-data-find'

/**
 * 渲染函数 - 支持qiankun微应用和独立运行
 * @param props qiankun传递的props,包含token, route, user等信息
 */
function render(props?: IMicroAppProps) {
    const { container } = props || {}
    ReactDOM.render(
        <AppShell
            mode="micro-app"
            containerId="smart-data-find"
            microAppProps={props || {}}
        />,
        container
            ? container.querySelector('#smart-data-find')
            : document.querySelector('#smart-data-find') ||
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
    // console.log('[AnyFabric微应用] bootstrap')
}

/**
 * qiankun生命周期 - mount
 * 每次进入微应用时调用
 */
export async function mount(props: any) {
    // console.log('[AnyFabric微应用] mount', props)
    // 将qiankun传递的props保存到window,供应用内部使用
    // eslint-disable-next-line no-underscore-dangle
    window.__QIANKUN_PROPS__ = props
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
        // console.error('[AnyFabric微应用] unmount时logout出错:', error)
    }

    ReactDOM.unmountComponentAtNode(
        container
            ? container.querySelector('#smart-data-find')
            : document.querySelector('#smart-data-find') ||
                  document.querySelector('#root'),
    )

    // 清理保存的props
    // eslint-disable-next-line no-underscore-dangle
    delete window.__QIANKUN_PROPS__
}

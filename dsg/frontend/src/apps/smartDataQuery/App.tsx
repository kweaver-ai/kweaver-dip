import { ConfigProvider, message } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import 'moment/locale/zh-cn'
import 'normalize.css'
import 'antd/dist/antd.less'
import '../../common.less'
// 提前导入 Chatkit 以确保样式被注入（样式已打包在 JS 中）
// 即使组件是 lazy 加载的，这里导入会触发样式注入
import '@kweaver-ai/chatkit'
import { BrowserRouter } from 'react-router-dom'
import React, { Suspense, useEffect, useMemo } from 'react'
import requests, { i18n, axiosInstance } from '@/utils'
import { MicroAppPropsProvider } from '@/context'
import { Loader } from '@/ui'
import styles from './styles.module.less'
import Routes from './Routes'
import { tokenManager } from '@/utils/tokenManager'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

function App(props: any) {
    const microWidgetProps = props?.props || {}
    const language: string = 'zh-cn'

    const getAntdLocal = (lang: string) => {
        switch (lang) {
            case 'zh-cn':
                return zhCN

            case 'zh-tw':
                return zhTW

            default:
                return enUS
        }
    }

    useEffect(() => {
        i18n.setup({
            locale: language,
        })
    }, [language])

    // 配置 message 的挂载容器,确保在微应用环境中正确显示
    useEffect(() => {
        const container =
            document.getElementById('smart-data-query') ||
            document.getElementById('root') ||
            document.body

        // 配置 message 组件
        message.config({
            maxCount: 1,
            duration: 3,
            top: 60,
            getContainer: () => container,
        })
    }, [])

    // 初始化token清理
    useEffect(() => {
        tokenManager.initCleanupMechanism()
    }, [])

    // 设置 token（从 qiankun props 中获取）
    useEffect(() => {
        // 如果存在 microWidgetProps 且包含 token.accessToken 函数
        if (microWidgetProps?.token?.accessToken) {
            try {
                // 调用 accessToken 函数获取 token
                const { accessToken } = microWidgetProps.token || {}

                if (accessToken) {
                    // 设置 requests.default.micro，这样 request.ts 中的逻辑会跳过 cookies token
                    requests.default.micro = microWidgetProps
                    // 设置 requests.default.accessToken
                    requests.default.accessToken = accessToken
                    // 设置 axios 默认请求头
                    axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
                    // 设置 tokenManager.setMicroAppProps
                    tokenManager.setMicroAppProps(microWidgetProps)
                }
            } catch (error) {
                // console.error(
                //     '[smartDataQuery] Failed to get token from qiankun props:',
                //     error,
                // )
            }
        }
    }, [microWidgetProps?.token?.accessToken])

    const [Router, basename] = useMemo(() => {
        const basePath =
            (microWidgetProps?.route?.basename as string) ||
            'smartDataQuery.html'

        return [BrowserRouter, basePath] as const
    }, [microWidgetProps?.route?.basename])

    return (
        <Suspense fallback={<Loader />}>
            <Router basename={basename}>
                <ConfigProvider
                    locale={getAntdLocal(language)}
                    prefixCls="any-fabric-ant"
                    iconPrefixCls="any-fabric-anticon"
                    autoInsertSpaceInButton={false}
                    getPopupContainer={() =>
                        document.getElementById('smart-data-query') ||
                        document.body
                    }
                >
                    <MicroAppPropsProvider initMicroAppProps={props}>
                        <div className={styles.smartDataQueryWrapper}>
                            <Routes />
                        </div>
                    </MicroAppPropsProvider>
                </ConfigProvider>
            </Router>
        </Suspense>
    )
}

export default App

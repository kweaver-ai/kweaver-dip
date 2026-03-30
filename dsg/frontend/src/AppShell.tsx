/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, message, Modal, Spin } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import 'moment/locale/zh-cn'
import Cookies from 'js-cookie'
import 'normalize.css'
import 'antd/dist/antd.less'
import '@/common.less'
import { Provider } from 'react-redux'
import AnyFabricRoutes from '@/routers'
import {
    LanguageProvider,
    ConfigInfoProvider,
    initConfigInfoData,
    MessageProvider,
    DocumentTitleProvider,
    MicroAppPropsProvider,
    useMicroAppProps,
    type IMicroAppProps,
} from '@/context'
import requestClient, { getLanguage, i18n } from '@/utils'
import store from '@/redux/store'
import UserPermissionsProvider from '@/context/UserPermissionProvider'
import { ScopePermissionProvider } from '@/hooks/useScopePermission'
import { AuthProvider, MenuProvider, useAuthContext } from '@/providers'
import { setRuntimeConfig } from '@/utils/runtimeConfig'
import { tokenManager } from '@/utils/tokenManager'

type AppRuntimeMode = 'standalone' | 'micro-app'

declare global {
    interface Window {
        __QIANKUN_REFRESH_TOKEN__?: () => Promise<{ accessToken: string }>
        __CURRENT_USER__?: unknown
    }
}

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

interface AppShellProps {
    mode: AppRuntimeMode
    microAppProps?: IMicroAppProps
    containerId?: string
}

const MicroAppAuthSync: React.FC<{ mode: AppRuntimeMode }> = ({ mode }) => {
    const { microAppProps } = useMicroAppProps()
    const { setAuthenticated, setUserId, setLoading } = useAuthContext()

    useEffect(() => {
        if (mode === 'micro-app' && microAppProps?.user?.id) {
            setAuthenticated(true)
            setUserId(String(microAppProps.user.id))
        } else if (mode === 'standalone') {
            const token = Cookies.get('af.oauth2_token')
            if (token) {
                setAuthenticated(true)
            }
        }
        setLoading(false)
    }, [mode, microAppProps?.user, setAuthenticated, setUserId, setLoading])

    return null
}

const getStandaloneBasename = (pathname: string) => {
    return /anyfabric/.test(pathname) ? `/anyfabric` : '/'
}

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

const AppShellInner: React.FC<{
    mode: AppRuntimeMode
    containerId?: string
}> = ({ mode, containerId }) => {
    const { microAppProps } = useMicroAppProps()
    const [microAppReady, setMicroAppReady] = useState(mode !== 'micro-app')
    const language: string = getLanguage() || 'zh-cn'
    const { pathname } = window.location

    const basename = useMemo(() => {
        if (microAppProps?.route?.basename) {
            return microAppProps.route.basename
        }
        return getStandaloneBasename(pathname)
    }, [microAppProps?.route?.basename, pathname])

    const popupContainerId: string =
        mode === 'micro-app' ? (containerId as string) : 'root'

    useMemo(() => {
        i18n.setup({
            locale: language,
        })
    }, [language])

    useEffect(() => {
        const container =
            document.getElementById(popupContainerId) ||
            document.getElementById('root') ||
            document.body

        // 配置 message 组件
        message.config({
            maxCount: 1,
            duration: 3,
            top: 60,
            getContainer: () => container,
        })
    }, [popupContainerId])

    useEffect(() => {
        const handler = () => Modal.destroyAll()
        window.addEventListener('popstate', handler, false)
        return () => {
            window.removeEventListener('popstate', handler, false)
        }
    }, [])

    setRuntimeConfig({ basename, mode })

    // 初始化token清理
    useEffect(() => {
        tokenManager.initCleanupMechanism()
    }, [])

    useEffect(() => {
        if (mode !== 'micro-app') {
            requestClient.default.micro = undefined
            tokenManager.clearMicroAppProps()
            localStorage.removeItem('micro_app_platform')
            setMicroAppReady(true)
            return
        }

        setMicroAppReady(false)
        requestClient.default.micro = microAppProps
        tokenManager.setMicroAppProps(microAppProps)

        // 设置全局刷新token函数(兼容)
        if (typeof microAppProps?.token?.refreshToken === 'function') {
            window.__QIANKUN_REFRESH_TOKEN__ = microAppProps.token.refreshToken
        }

        if (microAppProps?.user) {
            window.__CURRENT_USER__ = microAppProps.user
        }

        const getMicroAppToken = async () => {
            try {
                const token = await tokenManager.getToken()
                if (token) {
                    const { hostname } = window.location
                    Cookies.set('af.oauth2_token', token, {
                        expires: 1, // 1天过期
                        path: '/',
                        domain: hostname,
                    })
                }
            } catch (error) {
                //
            } finally {
                setMicroAppReady(true)
            }
        }

        getMicroAppToken()

        localStorage.setItem('micro_app_platform', '1')

        return () => {
            setMicroAppReady(false)
            requestClient.default.micro = undefined
            tokenManager.clearMicroAppProps()
            localStorage.removeItem('micro_app_platform')
            // 清理微应用设置的 Cookie
            const { hostname } = window.location
            Cookies.remove('af.oauth2_token', {
                path: '/',
                domain: hostname,
            })
        }
    }, [mode, microAppProps])

    return (
        <Suspense>
            <BrowserRouter basename={basename}>
                <Provider store={store}>
                    <DocumentTitleProvider>
                        <LanguageProvider initLanguage="zh-cn">
                            <MessageProvider initMessageInfo={{}}>
                                <ConfigInfoProvider
                                    initConfigInfo={initConfigInfoData}
                                >
                                    <ConfigProvider
                                        locale={getAntdLocal(language)}
                                        prefixCls="any-fabric-ant"
                                        iconPrefixCls="any-fabric-anticon"
                                        autoInsertSpaceInButton={false}
                                        getPopupContainer={() =>
                                            document.getElementById(
                                                popupContainerId,
                                            ) ||
                                            document.getElementById('root') ||
                                            document.body
                                        }
                                    >
                                        <AuthProvider>
                                            <MicroAppAuthSync mode={mode} />
                                            <MenuProvider>
                                                <UserPermissionsProvider>
                                                    <ScopePermissionProvider>
                                                        {microAppReady ? (
                                                            <AnyFabricRoutes />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    justifyContent:
                                                                        'center',
                                                                    minHeight:
                                                                        '100vh',
                                                                }}
                                                            >
                                                                <Spin />
                                                            </div>
                                                        )}
                                                    </ScopePermissionProvider>
                                                </UserPermissionsProvider>
                                            </MenuProvider>
                                        </AuthProvider>
                                    </ConfigProvider>
                                </ConfigInfoProvider>
                            </MessageProvider>
                        </LanguageProvider>
                    </DocumentTitleProvider>
                </Provider>
            </BrowserRouter>
        </Suspense>
    )
}

const AppShell: React.FC<AppShellProps> = ({
    mode,
    microAppProps = {},
    containerId,
}) => {
    return (
        <MicroAppPropsProvider initMicroAppProps={microAppProps}>
            <AppShellInner mode={mode} containerId={containerId} />
        </MicroAppPropsProvider>
    )
}

export default AppShell

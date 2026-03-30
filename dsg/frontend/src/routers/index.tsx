/* eslint-disable prettier/prettier */
import { Spin } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useRoutes } from 'react-router-dom'
import { useDocumentTitleContext, useMicroAppProps } from '@/context'
import { goEffectivePath, LoginPlatform } from '@/core'
import { getInnerUrl } from '@/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getRouteByAttr, useMenus } from '@/hooks/useMenus'
import { useAuthContext } from '@/providers'
import { loginRoutes, otherRoutes } from './config'
import styles from './styles.module.less'

interface AnyFabricRoutesProps {
    /** 是否为微应用模式 */
    isMicroApp?: boolean
}

const AnyFabricRoutes: React.FC<AnyFabricRoutesProps> = ({
    isMicroApp = false,
}) => {
    const navigator = useNavigate()
    const [menus] = useMenus()
    const [routes, setRoutes] = useState<any[]>([])
    const { authenticated, loading } = useAuthContext()
    const element = useRoutes([...routes, ...otherRoutes, ...loginRoutes])
    const { setCurrentPath, setMenusData } = useDocumentTitleContext()
    const { pathname } = useLocation()
    const [userInfo] = useCurrentUser()
    const { microAppProps } = useMicroAppProps()
    const isMicroAppMode = Boolean(microAppProps?.route?.basename)
    // 记录是否已经执行过初始路由跳转
    const [hasInitialRouted, setHasInitialRouted] = useState(false)

    useEffect(() => {
        setCurrentPath(pathname)
    }, [pathname, setCurrentPath])

    useEffect(() => {
        if (isMicroAppMode || loading) {
            return
        }

        const isLoginRoute = loginRoutes.some(
            (route) => pathname === route.path,
        )
        // 如果不是登录路由且未认证,跳转到登录页
        if (!isLoginRoute && !authenticated) {
            navigator('/login')
        }
    }, [authenticated, loading, pathname, navigator, isMicroAppMode])

    useEffect(() => {
        if (!isMicroAppMode) {
            return
        }

        // 等待菜单加载完成后再进行路由跳转
        // 只在首次且 pathname 为根路径时执行
        if ((pathname === '/' || pathname === '') && !hasInitialRouted) {
            // 只有当 menus 不为空且包含实际的业务菜单时才执行跳转逻辑
            // 检查是否有非默认路由、非模块容器的菜单项
            const hasBusinessMenus = menus.some(
                (menu) =>
                    menu.type !== 'module' &&
                    ![
                        '/',
                        'login',
                        'login-success',
                        'login-failed',
                        'logout',
                        'login-sso',
                        '403',
                        '404',
                        'no-permission',
                        'personal-center',
                    ].includes(menu.key),
            )

            if (menus && menus.length > 0 && hasBusinessMenus) {
                // 使用 goEffectivePath 按优先级查找第一个有权限的页面并跳转
                goEffectivePath(menus, LoginPlatform.default, false, navigator)
                // 标记已经执行过初始跳转
                setHasInitialRouted(true)
            }
        }
    }, [pathname, navigator, isMicroAppMode, menus, hasInitialRouted])

    useEffect(() => {
        setMenusData(menus)
    }, [menus, setMenusData])

    useEffect(() => {
        setRoutes(menus)
    }, [menus])

    useMemo(() => {
        if (menus.length) {
            const innerPathname = getInnerUrl(pathname)
            // 从可用路由中获取当前路径的key
            const key1 =
                getRouteByAttr(innerPathname, 'path', menus)?.key ||
                getRouteByAttr(pathname, 'path', menus)?.key
            // 如果当前路径不在路由中，跳转到403
            if (!key1) {
                navigator('403')
            }
        }
    }, [pathname, userInfo, menus])

    return routes.length ? (
        element
    ) : (
        <div className={styles.routesLoading}>
            <Spin />
        </div>
    )
}

export default AnyFabricRoutes

import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { dataAssetsIndicatorPath } from '@/components/DataAssetsIndicator/const'

export const lazyLoadLayout = (moduleName: string) => {
    const Module = lazy(
        () => import(/* @vite-ignore */ `../layout/${moduleName}`),
    )
    return <Module />
}

export const lazyLoad = (moduleName: string) => {
    const Module = lazy(
        () => import(/* @vite-ignore */ `../pages/${moduleName}`),
    )
    return <Module />
}

export const lazyLoadIcon = (attribute: any) => {
    if (attribute?.icon) {
        const Icon = lazy(
            () => import(/* @vite-ignore */ `../icons/${attribute.icon}`),
        )
        return <Icon />
    }
    if (attribute?.iconColored) {
        return (
            <FontIcon
                name={attribute.iconColored}
                type={IconType.COLOREDICON}
            />
        )
    }
    if (attribute?.iconFont) {
        return <FontIcon name={attribute.iconFont} />
    }
    // if (attribute?.iconGradient) {
    //     const { name, colors, ...others } = attribute.iconGradient
    //     return <GradientSvgIcon name={name} colors={colors} {...others} />
    // }
    return null
}

/**
 * 单点登录 path
 */
export const ssoRoutePath = ['/login-sso', dataAssetsIndicatorPath]
/**
 * 登录相关 path
 */
export const loginRoutePath = [
    '/',
    '/login',
    '/login-failed',
    '/logout',
    ...ssoRoutePath,
]

/**
 * 首页路由key
 */
export const homeRouteKeys = {
    1: [
        // 'asset-center',
        // 'asset-view',
        'data-assets',
        // 'app-center',
        'work-center',
        // 'my-assets',
        'config-center',
        // 'audit-center',
    ],
    2: ['drmb-home', 'business-home'],
    4: [
        'portal-home',
        'data-assets',
        // 'news-zone',
        'work-zone',
        // 'md-province',
        'platform-service',
        'application-overview',
    ],
    8: ['md-ca'],
    16: ['md-cd'],
}
/**
 * 管理员默认路由
 */
export const adminRouteKey = {
    1: 'config-center',
    2: 'md-platform',
    4: 'md-platform',
    8: 'systemConfig',
    16: 'systemConfigManage',
}

/**
 * 登录相关路由配置
 * 用于独立模式(非微应用模式)下的登录流程
 */
export const loginRoutes = [
    {
        path: '/login',
        key: 'login',
        element: lazyLoad('login/LoginPage'),
    },
    {
        path: '/login-sso',
        key: 'login-sso',
        element: lazyLoad('login/LoginSuccess'),
    },
    {
        path: '/login-failed',
        key: 'login-failed',
        element: lazyLoad('login/LoginFailed'),
    },
    {
        path: '/logout',
        key: 'logout',
        element: lazyLoad('login/LoginPage'), // 登出后重定向到登录页
    },
]

export const otherRoutes = [
    {
        path: '*',
        element: <Navigate to="/404" />,
    },
    {
        label: __('数据服务超市'),
        domTitle: __('数据服务超市'),
        path: dataAssetsIndicatorPath,
        key: 'data-assets-indicator',
        hide: true,
        element: lazyLoadLayout('AssetCenterGKLayout'),
        children: [
            {
                index: true,
                element: lazyLoad('DataCatlgIndicator'),
            },
        ],
    },
]

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { omit } from 'lodash'
import Cookies from 'js-cookie'
import { getAllMenus, HasAccess, LoginPlatform } from '@/core'
import {
    homeRouteKeys,
    lazyLoad,
    lazyLoadIcon,
    lazyLoadLayout,
    otherRoutes,
} from '@/routers/config'
import MicroAppPage from '@/pages/MicroAppPage'
import WorkflowManagePage from '@/pages/WorkflowManagePage'
import { useTestLLM } from './useTestLLM'
import { useGeneralConfig } from './useGeneralConfig'
import { dataAssetsIndicatorPath } from '@/components/DataAssetsIndicator/const'
import {
    getActualUrl,
    getInnerUrl,
    getPlatformNumber,
    getCurrentMicroAppType,
    MicroAppType,
} from '@/utils'
import { isRuntimeMicroApp } from '@/utils/runtimeConfig'
import { tokenManager } from '@/utils/tokenManager'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

let globalMenus: any[] = [] // 权限路由
let globalRawMenus: any[] = [] // 原始菜单(未按配置过滤)

/** 不受权限管控的路由 */
const defaultRoute = [
    {
        path: '/',
        layoutElement: 'LoginLayout',
        key: '/',
        children: [
            {
                key: 'default-login',
                path: '',
                element: 'login/LoginPage',
                index: true,
            },
            {
                path: 'login',
                element: 'login/LoginPage',
                key: 'login',
            },
        ],
    },
    {
        path: 'login-success',
        layoutElement: 'LoginLayout',
        key: 'login-success',
        children: [
            {
                key: 'login-success-index',
                path: '',
                element: 'login/LoginSuccess',
                index: true,
            },
        ],
    },
    {
        path: 'login-failed',
        layoutElement: 'LoginLayout',
        key: 'login-failed',
        children: [
            {
                path: '',
                key: 'login-failed-index',
                element: 'login/LoginFailed',
                index: true,
            },
        ],
    },
    {
        path: 'logout',
        layoutElement: 'LoginLayout',
        key: 'logout',
        children: [
            {
                path: '',
                key: 'logout-index',
                element: 'login/Logout',
                index: true,
            },
        ],
    },
    {
        path: 'login-sso',
        layoutElement: 'LoginLayout',
        key: 'login-sso',
        children: [
            {
                key: 'login-sso-index',
                path: '',
                element: 'login/Sso',
                index: true,
            },
        ],
    },
    {
        path: '403',
        layoutElement: 'LoginLayout',
        key: '403',
        children: [
            {
                key: '403-index',
                path: '',
                element: 'NoAccess',
                index: true,
            },
        ],
    },
    {
        path: '404',
        layoutElement: 'LoginLayout',
        key: '404',
        children: [
            {
                key: '404-index',
                path: '',
                element: 'NotFound',
                index: true,
            },
        ],
    },
    {
        path: 'no-permission',
        layoutElement: 'IndexRouterLayout',
        key: 'no-permission',
        children: [
            {
                key: 'no-permission-index',
                path: '',
                element: 'NoPermission',
                index: true,
            },
        ],
    },
    {
        label: '个人中心',
        key: 'personal-center',
        path: 'personal-center',
        belong: ['resource', 'catalog'],
        layoutElement: 'PersonalCenterLayout',
        children: [
            {
                index: true,
                key: 'personalCenterIndex',
                element: 'PersonalCenterPage',
            },
            {
                key: 'personalCenterDocAuditClient',
                path: 'doc-audit-client',
                element: 'PersonalCenterPage',
            },
        ],
    },
]

/** 分组菜单 */
const groupMenus = {
    [MicroAppType.SmartDataFind]: [
        {
            label: '数据服务超市',
            layoutElement: 'IndexRouterLayout',
            key: 'data-market',
            path: '',
            type: 'module',
            module: ['data-market'],
        },
        {
            // 超市默认有权限
            label: '数据服务超市',
            path: 'data-assets',
            layoutElement: 'IndexRouterLayout',
            key: 'data-assets',
            children: [
                {
                    key: 'data-assets-index',
                    path: '',
                    element: 'DataCatlg',
                    index: true,
                },
            ],
            belong: ['resource', 'catalog'],
            module: ['data-market'],
        },
        {
            label: '资产全景',
            layoutElement: 'IndexRouterLayout',
            key: 'asset-overview',
            path: '',
            type: 'module',
            module: ['asset-overview'],
        },
        {
            label: '数据运营管理',
            layoutElement: 'IndexRouterLayout',
            key: 'work-center',
            path: '',
            type: 'module',
            module: ['work-center'],
        },
        {
            label: '应用配置',
            path: '',
            type: 'module',
            key: 'config-center',
            module: ['config-center'],
            hide: true,
        },
        {
            label: '服务管理',
            path: '',
            key: 'serviceManageGroup',
            type: 'group',
            module: ['work-center'],
        },
        {
            label: '数据资源目录管理',
            path: '',
            key: 'dataAssetManageGroup',
            type: 'group',
            module: ['work-center'],
        },
        {
            label: '库表直供',
            path: '',
            key: 'dataSheetGroup',
            type: 'group',
            module: ['work-center'],
        },
    ],
    [MicroAppType.SemanticGovernance]: [
        {
            label: '数据语义治理',
            layoutElement: 'IndexRouterLayout',
            key: 'work-center',
            path: '',
            type: 'module',
            module: ['work-center'],
            attribute: {
                iconFont: 'icon-shujuyuyizhili',
            },
        },
        {
            label: '配置',
            path: '',
            type: 'module',
            key: 'config-center',
            module: ['config-center'],
            attribute: {
                iconFont: 'icon-shezhi',
            },
        },
        {
            label: '库表管理',
            path: '',
            key: 'sheetViewManageGroup',
            type: 'group',
            module: ['work-center'],
        },
        {
            label: '数据质量管理',
            path: '',
            key: 'dataQualityManageGroup',
            type: 'group',
            module: ['work-center'],
        },
        {
            label: '标准管理',
            path: '',
            key: 'standardManageGroup',
            type: 'group',
            module: ['work-center'],
        },
        {
            label: '扩展配置',
            path: '',
            key: 'extendedConfig',
            type: 'group',
            module: ['config-center'],
        },
        {
            label: '分级配置',
            path: '',
            key: 'levelManageGroup',
            type: 'group',
            module: ['config-center'],
        },
    ],
}

const normalizeModule = (moduleValue: any, menuItem?: any) => {
    if (!moduleValue) return moduleValue
    if (Array.isArray(moduleValue)) return moduleValue
    if (typeof moduleValue === 'string') {
        const segments = moduleValue
            .split(/[/,|>]+/)
            .map((item) => item.trim())
            .filter(Boolean)
        if (segments.length === 0) return moduleValue
        if (segments.length === 1) {
            const groupKey = menuItem?.groupKey || menuItem?.group_key
            return groupKey ? [segments[0], groupKey] : segments
        }
        return segments
    }
    return moduleValue
}

// 适配菜单 -- 将方法提取出来
export const getRouters = (routers: any, parentKey?: string) => {
    const list = routers.map((item) => {
        const { layoutElement, element, children, key, attribute } = item
        const normalizedModule = normalizeModule(item.module, item)
        let el
        // 插件为组件加载模式，解决刷新过程中的偶现挂载节点未加载
        if (element === 'WorkflowManagePage') {
            el = <WorkflowManagePage />
        } else if (element === 'MicroAppPage') {
            el = <MicroAppPage />
        } else if (layoutElement && element) {
            // 同时存在 layoutElement 和 element 时，创建嵌套路由结构
            el = lazyLoadLayout(layoutElement)
            // 如果没有 children，将 element 作为默认子路由
            if (!children?.length) {
                return {
                    ...omit(item, ['layoutElement']),
                    // 是否是待开发页面
                    isDeveloping: checkMenuDeveloping(item),
                    element: el,
                    icon: lazyLoadIcon(attribute),
                    module: normalizedModule,
                    children: getRouters(
                        [{ index: true, element, layoutElement: undefined }],
                        key,
                    ),
                }
            }
        } else {
            el = layoutElement
                ? lazyLoadLayout(layoutElement)
                : element
                ? lazyLoad(element)
                : undefined
        }
        return {
            ...omit(item, ['layoutElement']),
            // 是否是待开发页面
            isDeveloping: checkMenuDeveloping(item),
            element: el,
            icon: lazyLoadIcon(attribute),
            module: normalizedModule,
            children: children?.length ? getRouters(children, key) : undefined,
        }
    })
    return list
}
/**
 * 获取菜单
 * @returns [菜单数组, 获取菜单函数, 清除菜单函数]
 */
export const useMenus = (): [
    any[],
    (pf?: number) => Promise<void>,
    () => void,
] => {
    const [llm] = useTestLLM()
    const { checkPermissions } = useUserPermCtx()
    const [{ using, local_app }] = useGeneralConfig()
    const [menus, setMenus] = useState<any[]>(globalMenus)
    const [rawMenus, setRawMenus] = useState<any[]>(globalRawMenus)
    const platform = getPlatformNumber()
    const pathname = getInnerUrl(window.location.pathname)
    const currentToken = Cookies.get('af.oauth2_token') || ''
    const tokenRef = useRef(currentToken)
    const applyRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )

    // 根据配置过滤菜单
    useEffect(() => {
        // using === -1 表示全局配置尚未从后端加载完成，此时 belong 过滤无法正确执行
        if (using === -1) return

        const sourceMenus = rawMenus.length ? rawMenus : menus
        const filterKeys: string[] = []

        // 没有大模型时，不显示数据应用
        if (llm === false) {
            filterKeys.push('intelligentQA')
        }

        // 没有开启本地应用且没有普通用户权限，则不显示我的资产
        if (local_app === false && !applyRoles) {
            filterKeys.push('my-assets')
        }

        if (filterKeys.length > 0) {
            const filtered = sourceMenus.filter(
                (item) => !filterKeys.includes(item.key),
            )
            globalMenus = filtered
            setMenus(filtered)
        } else {
            const felterMenus = filterMenusByBelong(sourceMenus)
            globalMenus = felterMenus
            setMenus(felterMenus)
        }
    }, [llm, local_app, applyRoles, using, rawMenus])

    // 重定向登录
    const redirectToLogin = (pf: number = platform) => {
        const { hostname } = window.location
        Cookies.remove('af.session_id', {
            domain: `${hostname}`,
            path: '/',
        })
        Cookies.remove('af.oauth2_token', {
            domain: `${hostname}`,
            path: '/',
        })

        window.location.href = '/anyfabric/'
    }

    // 根据 key 替换菜单项 - 调试使用
    const replaceMenuItemByKey = (
        menusData: any[],
        key: string,
        newMenuItem: any,
    ): any[] => {
        return menusData.map((menu) => {
            // 如果当前项是目标项，直接替换
            if (menu.key === key) {
                return {
                    ...menu,
                    ...newMenuItem,
                }
            }

            // 如果当前项有子菜单，递归处理
            if (menu.children && menu.children.length > 0) {
                return {
                    ...menu,
                    children: replaceMenuItemByKey(
                        menu.children,
                        key,
                        newMenuItem,
                    ),
                }
            }

            return menu
        })
    }

    const filterMenusByBelong = (menusData: any[]) => {
        const resource = using === 2 ? 'resource' : 'catalog'

        const processMenu = (menu: any) => {
            // 检查当前菜单项是否符合条件
            if (menu.belong?.length && !menu.belong.includes(resource)) {
                return null
            }

            // 递归处理子菜单
            if (menu.children && menu.children.length > 0) {
                const filteredChildren = menu.children
                    .map(processMenu)
                    .filter(Boolean)

                // 如果子菜单过滤后为空，返回null
                if (filteredChildren.length === 0) {
                    return null
                }

                return {
                    ...menu,
                    children: filteredChildren,
                }
            }

            // 没有子菜单的菜单项，直接返回
            return menu
        }

        return menusData.map(processMenu).filter(Boolean)
    }

    const getMenus = useCallback(
        async (pf: number = platform) => {
            const token = isRuntimeMicroApp()
                ? await tokenManager.getToken()
                : Cookies.get('af.oauth2_token')
            try {
                // 单点登录不需要请求菜单，在otherRoutes里面配置
                if (dataAssetsIndicatorPath === pathname) {
                    const routers = getRouters([
                        ...otherRoutes,
                        ...defaultRoute,
                    ])
                    globalRawMenus = routers
                    setRawMenus(routers)
                    globalMenus = routers
                    setMenus(routers)
                    return
                }
                if (!token) {
                    if (!isRuntimeMicroApp()) {
                        const routers = getRouters(defaultRoute || [])
                        globalRawMenus = routers
                        setRawMenus(routers)
                        globalMenus = routers
                        setMenus(routers)
                    }
                } else {
                    // 根据微应用类型决定 resource_type
                    const microAppType = getCurrentMicroAppType()
                    let resourceType = 'smart_data_find' // 默认值

                    if (microAppType === MicroAppType.SmartDataFind) {
                        resourceType = 'smart_data_find'
                    } else if (
                        microAppType === MicroAppType.SemanticGovernance
                    ) {
                        resourceType = 'idrm_menus'
                    }
                    // 默认type与智能找数一致
                    const groupType = microAppType || MicroAppType.SmartDataFind
                    const res = await getAllMenus({
                        resource_type: resourceType,
                    })

                    const backendMenus = res?.menus || []
                    const routers = getRouters([
                        ...defaultRoute,
                        ...(groupType ? groupMenus[groupType] : []),
                        ...backendMenus,
                    ])
                    globalRawMenus = routers
                    setRawMenus(routers)
                    globalMenus = routers
                    setMenus(routers)
                }
            } catch (err) {
                if (
                    err?.data?.code ===
                    'ConfigurationCenter.Public.GetMenuNotOpen'
                ) {
                    redirectToLogin(err?.data?.detail?.platform)
                    return
                }

                Cookies.remove('af.oauth2_token')
                window.location.href = getActualUrl('/')
            }
        },
        [platform, pathname],
    )

    const clearMenus = useCallback(() => {
        globalMenus = []
        globalRawMenus = []
        setMenus([])
        setRawMenus([])
    }, [])

    useEffect(() => {
        if (!menus.length) {
            getMenus()
        }
    }, [getMenus, menus.length])

    useEffect(() => {
        if (tokenRef.current !== currentToken) {
            tokenRef.current = currentToken
            getMenus()
        }
    }, [currentToken, getMenus])

    return [menus, getMenus, clearMenus]
}

/**
 * 扁平化路由信息
 * @param routeArr 路由信息
 * @param accumulate 是否path累计
 * @param preffix 前缀
 * @returns 扁平化后的路由信息
 */
export const flatRoute = (
    routeArr: any[],
    accumulate?: boolean,
    preffix = '',
): any[] =>
    routeArr.reduce((prev: any[], route) => {
        const { children, ...rest } = route
        const path = rest?.path
            ? rest?.path?.startsWith('/')
                ? rest.path
                : `/${rest.path}`
            : ''

        let childs: any[] = []
        if (children?.length) {
            const preffixStr = !accumulate ? '' : `${preffix}${path}`
            childs = flatRoute(children, accumulate, preffixStr)
        }
        return [
            ...prev,
            { ...rest, path: `${preffix === '/' ? '' : preffix}${path}` },
            ...childs,
        ]
    }, [])

const isUUID = (str: string) => {
    // 正则表达式匹配UUID的模式
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return regex.test(str)
}

/**
 * 从路由中根据路由属性查找路由，平铺查询
 * @param value 查询字符串
 * @param attr 查询字段：key or path
 * @param routeData 路由数据, 默认globalMenus
 * @returns 路由对象
 */
export const getRouteByAttr = (
    value: string,
    attr: string,
    routeData: any = globalMenus,
) => {
    // 空值检查
    if (!value) {
        return undefined
    }

    // 去除path后 /
    let result =
        value?.slice(-1) === '/' ? value?.slice(0, value.length - 1) : value
    if (attr === 'path') {
        result = result.startsWith('/') ? result : `/${result}`
    }
    const temp = flatRoute(routeData, true)
    // 部分详情页面取路由最后一段匹配
    let lastPath = result.split('/')[result.split('/').length - 1]
    if (
        attr === 'path' &&
        isUUID(result.split('/')[result.split('/').length - 1])
    ) {
        lastPath = `/${result.split('/')[result.split('/').length - 2]}/:id`
    } else if (
        attr === 'path' &&
        isUUID(result.split('/')[result.split('/').length - 2])
    ) {
        lastPath = `${result
            .split('/')
            .slice(0, result.split('/').length - 2)
            .join('/')}/:id`
    }
    return temp.find((item) => item[attr] === result || item[attr] === lastPath)
}

/**
 * 根据路径查找一级菜单，平铺查询
 * @param path 路径
 * @param routeData 路由数据, 默认globalMenus
 * @returns 一级菜单
 */
export const getRootMenuByPath = (
    path: string,
    routeData: any = globalMenus,
) => {
    // 空值检查
    if (!path) {
        return undefined
    }

    // 去除path后 /
    const tempPath =
        path?.slice(-1) === '/' ? path?.slice(0, path.length - 1) : path
    // 去除path前 /
    const path1 = tempPath?.startsWith('/') ? tempPath.substring(1) : tempPath
    let path2 = tempPath
    if (isUUID(tempPath.split('/')[tempPath.split('/').length - 1])) {
        path2 = `/${tempPath.split('/')[tempPath.split('/').length - 2]}/:id`
    }
    let rootMenu: any
    for (let i = 0; i < routeData.length; i += 1) {
        const item = routeData[i]
        if (item.path === path1) {
            rootMenu = item
            break
        }
        if (item.children) {
            const flatChildren = flatRoute([item], true)
            const find = flatChildren.find((it) => it.path === path2)
            if (find) {
                rootMenu = item
                break
            }
        }
    }
    return rootMenu
}

/**
 * 根据 key 查找路径 key 路径数组
 * @param parentMenu 父级菜单
 * @param key 菜单 key
 * @returns 路径
 */
export const getMenuKeyPath = (parentMenu: any, key: string) => {
    const path: string[] = []
    const findPath = (menu: any, targetKey: string, currentPath: string[]) => {
        if (!menu) return false
        if (menu.key === targetKey) {
            path.push(...currentPath, menu.key)
            return true
        }
        if (menu.children) {
            for (let i = 0; i < menu.children.length; i += 1) {
                const child = menu.children[i]
                if (findPath(child, targetKey, [...currentPath, menu.key])) {
                    return true
                }
            }
        }
        return false
    }

    findPath(parentMenu, key, [])
    return path
}

/**
 * 根据 key 查找父级菜单项
 * @param key 菜单项的 key
 * @param routeData 路由数据, 默认menus
 * @returns 父级菜单项
 */
export const findParentMenuByKey = (
    key: string,
    routeData: any[] = globalMenus,
) => {
    for (let i = 0; i < routeData.length; i += 1) {
        const item = routeData[i]
        if (item.children?.some((child) => child.key === key)) {
            return item
        }
        if (item.children) {
            const result = findParentMenuByKey(key, item.children)
            if (result) {
                return result
            }
        }
    }
    return undefined
}

/**
 * 根据 key 递归查找指定菜单项
 * @param key 菜单项的 key
 * @param routeData 路由数据, 默认menus
 * @param ignoreDeveloping 是否忽略待开发页面
 * @returns 菜单项-树结构
 */
export const findMenuTreeByKey = (
    key: string,
    routeData: any[] = globalMenus,
    ignoreDeveloping = true,
) => {
    for (let i = 0; i < routeData.length; i += 1) {
        const menu = routeData[i]
        if (menu.key === key && (!ignoreDeveloping || !menu.isDeveloping)) {
            return menu
        }
        // 如果有 children
        if (menu.children && menu.children.length > 0) {
            const result = findMenuTreeByKey(
                key,
                menu.children,
                ignoreDeveloping,
            )
            if (result) {
                return result
            }
        }
    }
    return ''
}

/**
 * 递归查找菜单项的第一个路径
 * @param routeData 路由数据, 默认globalMenus
 * @param ignoreDeveloping 是否忽略待开发页面
 * @returns 菜单项的路径
 */
export const findFirstPath = (
    routeData: any[] = globalMenus,
    ignoreDeveloping = true,
) => {
    // 先过滤掉 hide 为 true 的路由
    const filteredRouteData = filterHideRoutes(routeData)

    for (let i = 0; i < filteredRouteData.length; i += 1) {
        const menu = filteredRouteData[i]
        // 跳过模块容器页：只有当有 layoutElement、有 path、且 children 中有 index 子路由时才跳过
        // 这种情况是像 work-center 这样的顶层模块容器
        const isTopLevelModuleContainer =
            menu.layoutElement &&
            menu.path &&
            menu.children &&
            menu.children.some((child) => child.index)

        // 修改判断逻辑：path 为空字符串时，优先递归查找 children
        if (menu.path && menu.path !== '') {
            if (
                (!ignoreDeveloping || !menu.isDeveloping) &&
                !isTopLevelModuleContainer
            ) {
                return menu.path?.substring(0, 1) === '/'
                    ? menu.path
                    : `/${menu.path}`
            }
        }

        // 如果有 children，递归查找（即使 path 不为空也要查找，因为可能被标记为 isDeveloping）
        if (menu.children && menu.children.length > 0) {
            const result = findFirstPath(menu.children, ignoreDeveloping)
            if (result) {
                return result
            }
        }
    }
    return ''
}

/**
 * 根据路由 keys 数组过滤存在的路由
 * @param keys 路由 keys 数组
 * @param routeData 路由数组, 默认menus
 * @returns 过滤后的路由数组
 */
export const getRouteByKeys = (
    keys: string[],
    routeData: any = globalMenus,
) => {
    return routeData.filter((item) => keys.includes(item.key))
}

/**
 * 递归过滤掉 hide 为 true 的路由
 * @param routeData 路由数组
 * @returns 过滤后的路由数组
 */
export const filterHideRoutes = (routeData: any[]): any[] => {
    if (!routeData || routeData.length === 0) {
        return []
    }

    return routeData.reduce((result: any[], route) => {
        // 如果当前路由 hide 为 true，直接跳过
        if (route.hide) {
            return result
        }

        // 创建路由副本
        const filteredRoute = { ...route }

        // 如果有 children，递归过滤
        if (route.children && route.children.length > 0) {
            const filteredChildren = filterHideRoutes(route.children)

            // 检查是否有 index 子路由（用于默认页面）
            const hasIndexChild = route.children.some(
                (child: any) => child.index && !child.hide,
            )

            // 如果过滤后的 children 为空
            if (filteredChildren.length === 0) {
                // 如果有 index 子路由且未隐藏，或者有 layoutElement，说明是有效的容器页面，应该保留
                // 这样可以保留像"业务标准"这样有 index 子路由的页面
                if (hasIndexChild || route.layoutElement) {
                    result.push(filteredRoute)
                }
                // 否则不添加该项（所有子菜单都被隐藏了且不是有效页面）
            } else {
                // 有有效的 children，保留并更新 children
                filteredRoute.children = filteredChildren
                result.push(filteredRoute)
            }
        } else {
            // 没有 children 且 hide 不为 true，直接添加
            result.push(filteredRoute)
        }

        return result
    }, [])
}

/**
 * 从路由 keys 数组中获取第一个路径，筛选传入的首层菜单
 * @param keys 路由keys数组
 * @param routeData 路由数组, 默认globalMenus
 * @param ignoreDeveloping 是否忽略待开发页面
 * @returns 第一个路径
 */
export const findFirstPathByKeys = (
    keys: string[],
    routeData: any = globalMenus,
    ignoreDeveloping = true,
) => {
    const keyRoutes = getRouteByKeys(keys, routeData)
    // 过滤掉 hide 为 true 的路由
    const filteredRoutes = filterHideRoutes(keyRoutes)
    return findFirstPath(filteredRoutes, ignoreDeveloping)
}

/**
 * 根据 module 查找路由
 * @param module 模块
 * @param routeData 路由数组, 默认globalMenus
 * @returns 路径
 */
export const getRouteByModule = (
    module: string,
    routeData: any = globalMenus,
) => {
    return routeData.filter((item) => item.module?.includes(module))
}

/**
 * 根据 module 查找路由并按分组组织
 * @param module 模块
 * @param routeData 路由数组, 默认globalMenus
 * @returns 按分组组织后的路由
 */
export const getRouteByModuleWithGroups = (
    module: string,
    routeData: any = globalMenus,
) => {
    // 获取所有属于该模块的菜单项，排除模块容器本身（type === 'module' 且 key 等于 module）
    const allItems = routeData.filter(
        (item) =>
            item.module?.includes(module) &&
            !(item.type === 'module' && item.key === module) &&
            !item.hide, // 过滤掉 hide 为 true 的菜单项
    )

    // 分离分组项和功能模块项
    const groupItems = allItems.filter((item) => item.type === 'group')
    // 功能模块项：排除分组项，排除属于分组的项（module.length > 1）
    const nonGroupItems = allItems.filter(
        (item) => item.type !== 'group' && item.module?.length === 1,
    )

    // 构建分组映射
    const groupMap = new Map<string, any[]>()
    allItems.forEach((item) => {
        // 如果 module.length > 1，说明属于某个分组
        if (item.module && item.module.length > 1) {
            const groupKey = item.module[1] // module[1] 是分组 key
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, [])
            }
            groupMap.get(groupKey)!.push(item)
        }
    })

    // 构建结果：非分组项 + 分组项及其下属模块
    const result: any[] = []

    // 添加非分组项（不属于任何分组的功能模块）
    nonGroupItems.forEach((item) => {
        result.push(item)
    })

    // 添加分组及其下属模块
    groupItems.forEach((group) => {
        const groupChildren = groupMap.get(group.key) || []
        // 只有当分组下有非 hide 的子菜单时才显示该分组
        if (groupChildren.length > 0) {
            result.push({
                ...group,
                children: groupChildren,
            })
        }
    })

    return result
}

/**
 * 从 module 包含的路由中获取第一个路径，筛选传入的首层菜单
 * @param module 模块
 * @param routeData 路由数组, 默认globalMenus
 * @param ignoreDeveloping 是否忽略待开发页面
 * @returns 第一个路径
 */
export const findFirstPathByModule = (
    module: string,
    routeData: any = globalMenus,
    ignoreDeveloping = true,
) => {
    // 使用 getRouteByModuleWithGroups 获取按分组组织的菜单结构
    const moduleRoutes = getRouteByModuleWithGroups(module, routeData)
    return findFirstPath(moduleRoutes, ignoreDeveloping)
}

/**
 * 获取用户最近使用路由
 * @param userId 用户id
 * @returns 最近使用路由
 */
export const getRecentUseRoutesByUserId = (
    userId: string,
    startWith: string = 'drmb',
) => {
    let list: any[] = []
    if (localStorage.getItem('af_recentUseMenu')) {
        list =
            JSON.parse(localStorage.getItem('af_recentUseMenu') || '{}')?.[
                `${startWith}-${userId}`
            ] || []
    }
    return list.filter((item) => item)
}

/**
 * 添加最近使用路由
 * @param userId 用户id
 * @param path 路径
 */
export const addRecentUseRoutes = (
    userId: string,
    path: string,
    platform: LoginPlatform = LoginPlatform.drmb,
) => {
    const startWith = platform === LoginPlatform.drmb ? 'drmb' : 'ca'
    const list = getRecentUseRoutesByUserId(userId, startWith)
    const menu = getRouteByAttr(path, 'path') || {}

    const ignoreKeys = [
        '/',
        'login',
        'login-success',
        'login-failed',
        'logout',
        '403',
        '404',
        'personalCenterDocAuditClient',
        'taskContent',
    ]
    if (
        !menu.key ||
        menu.hide ||
        homeRouteKeys[2].includes(menu.key) ||
        ignoreKeys.includes(menu.key)
    ) {
        return
    }
    const recentUseMenu = JSON.parse(
        localStorage.getItem('af_recentUseMenu') || '{}',
    )
    const menus = [menu.key, ...list.filter((item) => item !== menu.key)].slice(
        0,
        platform === LoginPlatform.drmb ? 4 : 5,
    )
    localStorage.setItem(
        'af_recentUseMenu',
        JSON.stringify({
            ...recentUseMenu,
            [`${startWith}-${userId}`]: menus,
        }),
    )
}

/**
 * 检查菜单是否为待开发页面
 * @param item 菜单项
 * @returns 是否为待开发页面
 */
export const checkMenuDeveloping = (item: any): boolean => {
    if (item?.element?.includes('Developing')) {
        return true
    }

    if (item?.children && item.children.length > 0) {
        return item.children
            .filter((child: any) => !child.hide)
            .every((child: any) => checkMenuDeveloping(child))
    }

    return false
}

/**
 * 获取模块下的所有子模块 key
 * @param moduleKey 模块 key
 * @param menusData 菜单数据
 * @returns 子模块 key 数组
 */
const getModuleChildrenKeys = (
    moduleKey: string,
    menusData: any[],
): string[] => {
    const children: string[] = []
    const findChildren = (items: any[]) => {
        items.forEach((item) => {
            if (item.module?.includes(moduleKey)) {
                if (item.key && item.type !== 'group') {
                    children.push(item.key)
                }
                if (item.children) {
                    findChildren(item.children)
                }
            }
        })
    }
    findChildren(menusData)
    return children
}

/**
 * 检查分组下是否有有效的模块路由
 * @param groupKey 分组 key
 * @param menusData 菜单数据
 * @returns 是否有有效模块
 */
const hasValidModulesInGroup = (
    groupKey: string,
    menusData: any[],
): boolean => {
    const moduleChildrenKeys = getModuleChildrenKeys(groupKey, menusData)
    return moduleChildrenKeys.length > 0
}

/**
 * 检查模块下是否有有效的分组（分组下有模块路由）
 * @param moduleKey 模块 key
 * @param menusData 菜单数据
 * @returns 是否有有效分组
 */
const hasValidGroupsInModule = (
    moduleKey: string,
    menusData: any[],
): boolean => {
    const groupChildren = menusData.filter(
        (item) => item.module?.includes(moduleKey) && item.type === 'group',
    )

    // 如果有直接子菜单（非分组），也有有效模块
    const directChildren = menusData.filter(
        (item) =>
            item.module?.includes(moduleKey) &&
            item.type !== 'group' &&
            !item.hide,
    )
    if (directChildren.length > 0) return true

    // 检查分组下是否有有效模块
    return groupChildren.some((group) =>
        hasValidModulesInGroup(group.key, menusData),
    )
}

/**
 * 过滤掉没有权限的分组和模块
 * @param menusData 菜单数据
 * @returns 过滤后的菜单数据
 */
export const filterMenusByPermission = (menusData: any[]): any[] => {
    const result: any[] = []
    const validKeys = new Set<string>()

    // 第一遍：收集所有有效的菜单 key（非隐藏、非分组类型）
    const collectValidKeys = (items: any[]) => {
        items.forEach((item) => {
            if (!item.hide && item.type !== 'group') {
                validKeys.add(item.key)
            }
            if (item.children) {
                collectValidKeys(item.children)
            }
        })
    }
    collectValidKeys(menusData)

    // 第二遍：过滤分组（检查是否有有效的子模块）
    const filterGroup = (items: any[]): any[] => {
        return items.filter((item) => {
            // 如果是分组类型，检查是否有有效的子模块
            if (item.type === 'group') {
                return hasValidModulesInGroup(item.key, menusData)
            }

            // 如果是模块类型（如 work-center），检查是否有有效的分组
            if (item.module && item.children) {
                const validChildren = filterGroup(item.children)
                return validChildren.length > 0
            }

            return true
        })
    }

    return filterGroup(menusData)
}

/**
 * 判断菜单是否为空（排除默认路由）
 * @param menus 菜单数据
 * @returns 是否为空
 */
export const isMenusEmpty = (menus: any[]): boolean => {
    // 排除默认路由的 key（包括模块容器和分组）
    const defaultRouteKeys = [
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
        // 模块容器
        'data-market',
        'asset-overview',
        'work-center',
        'config-center',
        // 数据运营管理分组
        'standardManageGroup',
        'dataAssetManageGroup',
        'dataQualityManageGroup',
        // 应用配置分组
        'extendedConfig',
        'dataSecurity',
        'systemAndReview',
    ]

    const validMenus = menus.filter(
        (item) => !defaultRouteKeys.includes(item.key),
    )
    return validMenus.length === 0
}

/**
 * 判断是否有服务超市菜单
 * @param menus 菜单数据
 * @returns 是否有服务超市
 */
export const hasDataAssetsMenus = (menus: any[]): boolean => {
    return menus.some((item) => item.key === 'data-market')
}

/**
 * 判断是否有我的任务菜单（用于 AssetCenterHeader 显示控制）
 * @param menus 菜单数据
 * @returns 是否有我的任务
 */
export const hasMyTaskMenus = (menus: any[]): boolean => {
    // 如果菜单为空，则不显示我的任务
    return !isMenusEmpty(menus)
}

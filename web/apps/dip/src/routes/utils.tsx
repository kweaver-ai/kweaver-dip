import type { GuideStatusResponse } from '@/apis/dip-studio/guide'
import { getGuideStatus } from '@/apis/dip-studio/guide'
import { usePreferenceStore } from '@/stores'
import { BASE_PATH } from '@/utils/config'
import { routeConfigs } from './routes'
import type { EnabledModule, RouteConfig, RouteModule, RouteSidebarMode } from './types'

/** 缺省为 hidden，与未配置时的侧栏行为一致 */
export const getRouteSidebarMode = (route: RouteConfig): RouteSidebarMode =>
  route.sidebarMode ?? 'hidden'

/**
 * 将动态路由路径模式转换为正则表达式
 * 例如: 'studio/project-management/:projectId' -> /^studio\/project-management\/([^/]+)$/
 */
const routePatternToRegex = (pattern: string): RegExp => {
  // 将路径中的 :param 替换为正则表达式的捕获组
  const regexPattern = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        return '([^/]+)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return new RegExp(`^${regexPattern}$`)
}

/**
 * 检查实际路径是否匹配路由模式（支持动态参数）
 */
const matchRoutePattern = (pattern: string, actualPath: string): boolean => {
  if (pattern === actualPath) return true
  if (!pattern.includes(':')) return false
  const regex = routePatternToRegex(pattern)
  return regex.test(actualPath)
}

/**
 * 根据路径获取路由配置
 * 支持动态路由匹配（如 /application/:appKey/* 和 studio/project-management/:projectId）
 * 自动处理 BASE_PATH 前缀，调用方无需手动移除
 */
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  // 先移除 BASE_PATH 前缀（如果存在）
  let processedPath = path
  if (BASE_PATH !== '/' && path.startsWith(BASE_PATH)) {
    processedPath = path.slice(BASE_PATH.length) || '/'
  }

  // 移除前导斜杠
  const normalizedPath = processedPath.startsWith('/') ? processedPath.slice(1) : processedPath

  // 匹配动态路由 /application/:appKey/*
  const appRouteMatch = normalizedPath.match(/^application\/([^/]+)/)
  if (appRouteMatch) {
    return {
      path: normalizedPath,
      key: `micro-app-${appRouteMatch[1]}`,
      label: appRouteMatch[1],
      sidebarMode: 'hidden',
    }
  }

  // 优先精确匹配
  const exactMatch = routeConfigs.find((route) => route.path === normalizedPath)
  if (exactMatch) return exactMatch

  // 匹配动态路由模式（如 studio/project-management/:projectId）
  const dynamicMatch = routeConfigs.find((route) => {
    if (!route.path) return false
    return matchRoutePattern(route.path, normalizedPath)
  })
  if (dynamicMatch) return dynamicMatch

  // 按前缀匹配（处理子路径）
  return routeConfigs.find(
    (route) => route.path && `${normalizedPath}/`.startsWith(`${route.path}/`),
  )
}

/**
 * 查找路由的父路由
 * 通过比较路径前缀来找到父路由
 */
export const getParentRoute = (route: RouteConfig): RouteConfig | undefined => {
  if (!route.path) return undefined

  // 移除动态参数部分，获取基础路径
  // 例如: 'studio/project-management/:projectId' -> 'studio/project-management'
  const pathSegments = route.path.split('/')
  if (pathSegments.length <= 1) return undefined

  // 移除最后一个段（可能是动态参数或普通段）
  const basePath = pathSegments.slice(0, -1).join('/')
  if (!basePath) return undefined

  // 查找匹配基础路径的路由（排除自身）
  return routeConfigs.find((r) => r.path === basePath && r.key !== route.key)
}

/**
 * 根据 key 获取路由配置
 */
export const getRouteByKey = (key: string): RouteConfig | undefined => {
  return routeConfigs.find((route) => route.key === key)
}

/**
 * 面包屑中「分类」之后的祖先路由列表（不含当前页）。
 * - 配置了 breadcrumbParentKeys（含 []）：仅按 key 解析，不再用路径前缀推导。
 * - 未配置：回退到 getParentRoute 单层父级。
 */
export const getBreadcrumbAncestorRoutes = (route: RouteConfig): RouteConfig[] => {
  if (route.breadcrumbParentKeys !== undefined) {
    return route.breadcrumbParentKeys
      .map((key) => getRouteByKey(key))
      .filter((r): r is RouteConfig => r !== undefined)
  }
  const parent = getParentRoute(route)
  return parent ? [parent] : []
}

/** 是否在面包屑末项展示当前路由；默认展示 */
export const shouldShowCurrentRouteInBreadcrumb = (route: RouteConfig): boolean => {
  return route.showInBreadcrumb !== false
}

/**
 * 面包屑可点击路径；带动态段的路径不生成链接（约定动态段不出现在面包屑祖先中）
 */
export const getBreadcrumbLinkPathForRoute = (route: RouteConfig): string | undefined => {
  if (!route.path || route.path.includes(':')) return undefined
  return `/${route.path}`
}

/**
 * 判断路由是否对用户可见
 * TODO: 当前没有角色系统，所有路由都允许访问，直接返回 true
 */
export const isRouteVisibleForRoles = (route: RouteConfig, roleIds: Set<string>): boolean => {
  // 当前没有角色系统，所有路由都允许访问
  void route
  void roleIds
  return true
  // 以下代码为角色系统的实现（暂时禁用）
  // const required = route.requiredRoleIds
  // if (!required || required.length === 0) return true
  // if (roleIds.size === 0) return false
  // return required.some((id) => roleIds.has(id))
}

export const getFirstVisibleSidebarRoute = (roleIds: Set<string>): RouteConfig | undefined => {
  return routeConfigs.find(
    (r) => getRouteSidebarMode(r) === 'menu' && r.key && isRouteVisibleForRoles(r, roleIds),
  )
}

/**
 * 根据路由归属模块获取第一个有权限的路由
 * 用于面包屑首页、分类首跳等
 */
export const getFirstVisibleRouteByModule = (
  module: RouteModule,
  roleIds: Set<string>,
): RouteConfig | undefined => {
  return routeConfigs.find((route) => {
    if (!route.key) {
      return false
    }
    const mode = getRouteSidebarMode(route)
    if (mode !== 'menu' && mode !== 'entry-only') {
      return false
    }

    const hasPermission = isRouteVisibleForRoles(route, roleIds)
    if (!hasPermission) {
      return false
    }

    return route.handle?.layout?.module === module
  })
}

/**
 * @deprecated 使用 getFirstVisibleRouteByModule；兼容旧调用（'home' 无模块匹配）
 */
export const getFirstVisibleRouteBySiderType = (
  legacy: 'store' | 'home' | 'studio',
  roleIds: Set<string>,
): RouteConfig | undefined => {
  if (legacy === 'home') {
    return undefined
  }
  return getFirstVisibleRouteByModule(legacy, roleIds)
}

/**
 * 从路径中移除 BASE_PATH 前缀
 * 用于处理包含 BASE_PATH 的完整路径，转换为 React Router navigate 可用的相对路径
 * 因为 React Router 配置了 basename，navigate 会自动处理 basename
 *
 * @param path 包含 BASE_PATH 的完整路径（如 /dip-hub/application/123）
 * @returns 移除 BASE_PATH 后的相对路径（如 /application/123）
 */
export const removeBasePath = (path: string): string => {
  if (BASE_PATH === '/' || !path.startsWith(BASE_PATH)) {
    return path
  }
  return path.slice(BASE_PATH.length) || '/'
}

/**
 * 通过固定应用 key（WENSHU_APP_KEY）解析默认微应用路由
 * - 成功时返回 /application/{key}
 * - 失败或找不到应用时返回 /application/error
 */
export const resolveDefaultMicroAppPath = async (): Promise<string> => {
  // 优先使用当前 store 中缓存的 wenshu 应用信息
  let { fetchPinnedMicroApps, wenshuAppInfo } = usePreferenceStore.getState()

  if (wenshuAppInfo) {
    return `/application/${encodeURIComponent(wenshuAppInfo.key)}`
  }

  // 如果还没有数据，则触发一次加载
  try {
    await fetchPinnedMicroApps()
    const state = usePreferenceStore.getState()
    wenshuAppInfo = state.wenshuAppInfo

    if (wenshuAppInfo) {
      return `/application/${encodeURIComponent(wenshuAppInfo.key)}`
    }
  } catch {
    // 加载失败时，后续直接走兜底逻辑
  }

  return '/application/error'
}

/** 登录后 / 访问根路径时的默认跳转目标，与 DefaultIndexRedirect 逻辑一致 */
export type DefaultAuthRedirectResult = {
  path: string
  state?: { guideStatus: GuideStatusResponse; breadcrumbMode: 'init-only' }
}

export async function resolveDefaultAuthRedirect(
  isAdmin: boolean,
  modules: EnabledModule[],
): Promise<DefaultAuthRedirectResult> {
  const hasStudio = modules.includes('studio')
  const hasStore = modules.includes('store')
  try {
    if (isAdmin && hasStudio) {
      const guideStatus = await getGuideStatus()
      if (guideStatus.ready) {
        return { path: '/studio/digital-human' }
      }
      return {
        path: '/studio/initial-configuration',
        state: { guideStatus, breadcrumbMode: 'init-only' },
      }
    }
    if (hasStore && !hasStudio) {
      const targetPath = await resolveDefaultMicroAppPath()
      return { path: targetPath }
    }
    return { path: '/home' }
  } catch {
    if (hasStore && !hasStudio) {
      const targetPath = await resolveDefaultMicroAppPath()
      return { path: targetPath }
    }
    return { path: isAdmin ? '/studio/digital-human' : '/home' }
  }
}

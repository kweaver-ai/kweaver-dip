import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logoImage from '@/assets/images/brand/logo.png'
import type { HeaderType, SiderType } from '@/routes/types'
import {
  getBreadcrumbAncestorRoutes,
  getBreadcrumbLinkPathForRoute,
  getFirstVisibleRouteBySiderType,
  getRouteByPath,
  shouldShowCurrentRouteInBreadcrumb,
} from '@/routes/utils'
import { useBreadcrumbDetailStore, useLanguageStore, useOEMConfigStore } from '@/stores'
import { useUserInfoStore } from '@/stores/userInfoStore'
import type { BreadcrumbItem } from '@/utils/micro-app/globalState'
import { Breadcrumb } from '../components/Breadcrumb'
import { UserInfo } from '../components/UserInfo'

/**
 * 获取 BaseHeaderType 对应的名称
 */
const getSectionName = (type: HeaderType): string => {
  return type === 'store' ? 'AI Store' : 'DIP Studio'
}

// /**
//  * 根据路由路径和配置判断 BaseHeaderType
//  */
// const getHeaderTypeFromRoute = (
//   pathname: string,
//   routeConfig: ReturnType<typeof getRouteByPath>,
// ): HeaderType => {
//   // 优先从路由配置的 siderType 判断
//   const siderType = routeConfig?.handle?.layout?.siderType
//   if (siderType === 'store' || siderType === 'studio') {
//     return siderType
//   }

//   // 如果路由配置中没有 siderType，通过路径判断
//   // location.pathname 已经是相对于 basename 的路径，不包含 BASE_PATH
//   const normalizedPath = pathname.startsWith('/') ? pathname.slice(1) : pathname
//   if (normalizedPath.startsWith('store/')) {
//     return 'store'
//   }
//   if (normalizedPath.startsWith('studio/')) {
//     return 'studio'
//   }

//   // 默认返回 store
//   return 'store'
// }

/**
 * 商店/工作室版块通用的导航头
 * 通过路由路径和配置自动判断分类，无需传递 type prop
 */
const BaseHeader = ({ headerType }: { headerType: HeaderType }) => {
  const isStudioHeader = headerType === 'studio'
  const location = useLocation()
  const navigate = useNavigate()
  const { getOEMResourceConfig } = useOEMConfigStore()
  const { language } = useLanguageStore()
  const { isAdmin } = useUserInfoStore()
  const detailBreadcrumb = useBreadcrumbDetailStore((s) => s.detail)
  const oemResourceConfig = getOEMResourceConfig(language)

  // 不同平台（store）各自的首路由，用于面包屑首页返回
  const roleIds = useMemo(() => new Set<string>([]), [])
  const homePath = useMemo(() => {
    const firstRoute = getFirstVisibleRouteBySiderType(headerType as SiderType, roleIds)
    if (!isAdmin && headerType === 'studio') {
      return '/home'
    }
    const path =
      firstRoute?.path ?? (headerType === 'store' ? 'store/my-app' : 'digital-human/management')
    return `/${path}`
  }, [headerType, roleIds])

  // 面包屑导航跳转
  const handleBreadcrumbNavigate = useCallback(
    (item: BreadcrumbItem) => {
      if (!item.path) return
      navigate(item.path)
    },
    [navigate],
  )

  // 获取当前路由配置
  const currentRoute = useMemo(() => getRouteByPath(location.pathname), [location.pathname])

  const breadcrumbMode = (location.state as { breadcrumbMode?: string } | null)?.breadcrumbMode
  const isInitialConfigOnlyMode =
    currentRoute?.key === 'initial-configuration' && breadcrumbMode === 'init-only'

  // 构建面包屑数据：BaseHeaderType名称 / 父路由名称 / 当前路由名称
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const result: BreadcrumbItem[] = []

    if (!isInitialConfigOnlyMode) {
      // BaseHeaderType 名称（只显示，不可点击）
      const sectionName = getSectionName(headerType)
      result.push({
        key: `section-${headerType}`,
        name: sectionName,
        disabled: true,
      })
    }

    if (currentRoute) {
      const customAncestors =
        detailBreadcrumb && detailBreadcrumb.routeKey === currentRoute.key
          ? detailBreadcrumb.replaceAncestorRoutes
          : undefined

      if (!isInitialConfigOnlyMode) {
        if (customAncestors?.length) {
          for (const item of customAncestors) {
            result.push({
              key: item.key,
              name: item.name,
              path: item.path,
            })
          }
        } else {
          const ancestorRoutes = getBreadcrumbAncestorRoutes(currentRoute)
          for (const ancestor of ancestorRoutes) {
            if (!ancestor.label) continue
            result.push({
              key: ancestor.key || `route-${ancestor.path}`,
              name: ancestor.label,
              path: getBreadcrumbLinkPathForRoute(ancestor),
            })
          }
        }
      }

      if (shouldShowCurrentRouteInBreadcrumb(currentRoute) && currentRoute.label) {
        const dynamicTitle =
          detailBreadcrumb && currentRoute.key && detailBreadcrumb.routeKey === currentRoute.key
            ? detailBreadcrumb.title
            : undefined
        const displayName = dynamicTitle ?? currentRoute.label
        let routePath: string | undefined
        if (currentRoute.path?.includes(':')) {
          routePath = location.pathname
        } else if (currentRoute.path) {
          routePath = `/${currentRoute.path}`
        }

        result.push({
          key: currentRoute.key || `route-${currentRoute.path}`,
          name: displayName,
          path: routePath,
        })
      }
    }

    return result
  }, [headerType, currentRoute, detailBreadcrumb, location.pathname, isInitialConfigOnlyMode])

  const getLogoUrl = () => {
    const base64Image = oemResourceConfig?.['logo.png']
    if (!base64Image) {
      return logoImage
    }
    // 如果已经是 data URL 格式，直接使用
    if (base64Image.startsWith('data:image/')) {
      return base64Image
    }
    // 否则添加 base64 前缀
    return `data:image/png;base64,${base64Image}`
  }
  const logoUrl = getLogoUrl()

  return (
    <>
      {/* 左侧：Logo 和面包屑 */}
      <div className="flex items-center gap-x-8">
        <img src={logoUrl} alt="logo" className="h-8 w-auto" />
        <Breadcrumb
          type={headerType}
          items={breadcrumbItems}
          homePath={homePath}
          onNavigate={handleBreadcrumbNavigate}
          showHomeIcon={!isInitialConfigOnlyMode}
          // lastItemSuffix={
          //   isWorkPlanDetailRoute && workPlanInfo ? (
          //     <ProjectInfoPopover
          //       projectInfo={workPlanInfo}
          //       open={workPlanInfoOpen}
          //       onOpenChange={(open) => {
          //         setProjectInfoOpen(open)
          //       }}
          //       onClose={() => {
          //         setProjectInfoOpen(false)
          //       }}
          //       styles={{
          //         container: { padding: '24px 0' },
          //       }}
          //     >
          //       <button
          //         type="button"
          //         className="flex items-center justify-center w-6 h-6 text-[#505050]"
          //         title="查看项目信息"
          //       >
          //         <InfoIcon />
          //       </button>
          //     </ProjectInfoPopover>
          //   ) : null
          // }
        />
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-x-4 h-full">{isStudioHeader ? null : <UserInfo />}</div>
    </>
  )
}

export default BaseHeader

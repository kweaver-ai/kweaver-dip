import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logoImage from '@/assets/images/brand/logo.png'
import InfoIcon from '@/assets/images/info.svg?react'
import type { HeaderType, SiderType } from '@/routes/types'
import { getFirstVisibleRouteBySiderType, getParentRoute, getRouteByPath } from '@/routes/utils'
import { useLanguageStore, useOEMConfigStore, useProjectStore } from '@/stores'
import type { BreadcrumbItem } from '@/utils/micro-app/globalState'
import { Breadcrumb } from '../components/Breadcrumb'
import { ProjectInfoPopover } from '../components/ProjectInfoPopover'
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
  const location = useLocation()
  const navigate = useNavigate()
  const { getOEMResourceConfig } = useOEMConfigStore()
  const { language } = useLanguageStore()
  const oemResourceConfig = getOEMResourceConfig(language)
  // 从 store 中获取项目信息
  const projectInfo = useProjectStore((state) => state.currentProjectInfo)
  const [projectInfoOpen, setProjectInfoOpen] = useState(false)

  // 不同平台（store/studio）各自的首路由，用于面包屑首页返回
  const roleIds = useMemo(() => new Set<string>([]), [])
  const homePath = useMemo(() => {
    const firstRoute = getFirstVisibleRouteBySiderType(headerType as SiderType, roleIds)
    const path =
      firstRoute?.path ?? (headerType === 'store' ? 'store/my-app' : 'studio/project-management')
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

  // 检查是否是项目详情路由
  const isProjectDetailRoute = currentRoute?.path === 'studio/project-management/:projectId'

  // 构建面包屑数据：BaseHeaderType名称 / 父路由名称 / 当前路由名称
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const result: BreadcrumbItem[] = []

    // BaseHeaderType 名称（只显示，不可点击）
    const sectionName = getSectionName(headerType)
    result.push({
      key: `section-${headerType}`,
      name: sectionName,
      disabled: true,
    })

    // 查找父路由（如果存在）
    if (currentRoute) {
      const parentRoute = getParentRoute(currentRoute)
      if (parentRoute?.label) {
        result.push({
          key: parentRoute.key || `route-${parentRoute.path}`,
          name: parentRoute.label,
          path: parentRoute.path ? `/${parentRoute.path}` : undefined,
        })
      }

      // 当前路由名称（如果存在）
      if (currentRoute.label) {
        // 如果是项目详情路由，使用项目真实名称
        let displayName = currentRoute.label
        if (isProjectDetailRoute && projectInfo) {
          displayName = projectInfo.name
        }

        // 如果当前路由路径包含动态参数（如 :projectId），使用实际路径
        // 否则使用路由配置中的路径
        let routePath: string | undefined
        if (currentRoute.path?.includes(':')) {
          // 动态路由，使用实际路径
          // location.pathname 已经是相对于 basename 的路径，React Router 会自动处理
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
  }, [headerType, currentRoute, location.pathname, isProjectDetailRoute, projectInfo])

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
          lastItemSuffix={
            isProjectDetailRoute && projectInfo ? (
              <ProjectInfoPopover
                projectInfo={projectInfo}
                open={projectInfoOpen}
                onOpenChange={(open) => {
                  setProjectInfoOpen(open)
                }}
                onClose={() => {
                  setProjectInfoOpen(false)
                }}
                styles={{
                  container: { padding: '24px 0' },
                }}
              >
                <button
                  type="button"
                  className="flex items-center justify-center w-6 h-6 text-[#505050]"
                  title="查看项目信息"
                >
                  <InfoIcon />
                </button>
              </ProjectInfoPopover>
            ) : null
          }
        />
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-x-4 h-full">
        <UserInfo />
      </div>
    </>
  )
}

export default BaseHeader

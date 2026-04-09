import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BUSINESS_NETWORK_BASE_PATH,
  businessLeafMenuItems,
} from '@/components/Sider/BusinessSider/menus'
import type { RouteConfig } from '@/routes/types'
import { useLanguageStore, useOEMConfigStore } from '@/stores'
import { useGlobalLayoutStore } from '@/stores/globalLayoutStore'
import type { BreadcrumbItem } from '@/utils/micro-app/globalState'
import { Breadcrumb } from '../components/Breadcrumb'
import { UserInfo } from '../components/UserInfo'

const BusinessHeader = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { getOEMResourceConfig } = useOEMConfigStore()
  const { language } = useLanguageStore()
  const oemResourceConfig = getOEMResourceConfig(language)

  const businessHeaderBreadcrumbHidden = useGlobalLayoutStore(
    (s) => s.businessHeaderBreadcrumbHidden,
  )
  const businessSiderHidden = useGlobalLayoutStore((s) => s.businessSiderHidden)
  const businessHeaderCustomBreadcrumbLabel = useGlobalLayoutStore(
    (s) => s.businessHeaderCustomBreadcrumbLabel,
  )

  // 业务布局：有侧栏时用户入口在侧栏，顶栏不显示用户；无侧栏时顶栏显示用户
  const showHeaderUserInfo = businessSiderHidden

  // 不同平台（business）面包屑首页返回路径：固定为 /
  const homePath = '/'

  // 获取当前路由配置（business 走业务菜单最长路径匹配，避免深层子路径被 business-network 根路由吞掉）
  const currentRoute = useMemo(() => {
    const matchedBusinessMenu = businessLeafMenuItems
      .filter((item) => location.pathname.startsWith(item.path))
      .sort((a, b) => b.path.length - a.path.length)[0]

    if (matchedBusinessMenu) {
      return {
        key: matchedBusinessMenu.key,
        label: matchedBusinessMenu.label,
        path: matchedBusinessMenu.path.replace(/^\//, ''),
        sidebarMode: 'hidden',
      } as RouteConfig
    }

    return undefined
  }, [location.pathname])

  const breadcrumbMode = (location.state as { breadcrumbMode?: string } | null)?.breadcrumbMode
  const isInitialConfigOnlyMode =
    currentRoute?.key === 'initial-configuration' && breadcrumbMode === 'init-only'

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        key: 'section-business',
        name: '全局业务知识网络',
        path: BUSINESS_NETWORK_BASE_PATH,
      },
    ]

    if (currentRoute?.label) {
      items.push({
        key: currentRoute.key || `route-${currentRoute.path}`,
        name: currentRoute.label,
        path: currentRoute.path ? `/${currentRoute.path}` : undefined,
      })
    }

    if (businessHeaderCustomBreadcrumbLabel) {
      items.push({
        key: 'business-custom-breadcrumb-third-level',
        name: businessHeaderCustomBreadcrumbLabel,
      })
    }

    return items
  }, [currentRoute, businessHeaderCustomBreadcrumbLabel])

  const handleBreadcrumbNavigate = useCallback(
    (item: BreadcrumbItem) => {
      if (!item.path) return
      navigate(item.path)
    },
    [navigate],
  )

  const getLogoUrl = () => {
    return oemResourceConfig?.['logo.png']
  }
  const logoUrl = getLogoUrl()

  return (
    <>
      <div className="flex items-center gap-x-8">
        <img src={logoUrl} alt="logo" className="h-8 w-auto" />
        <Breadcrumb
          type="business"
          items={businessHeaderBreadcrumbHidden ? [] : breadcrumbItems}
          homePath={homePath}
          onNavigate={handleBreadcrumbNavigate}
          showHomeIcon={!isInitialConfigOnlyMode}
        />
      </div>

      <div className="flex items-center gap-x-4 h-full">
        {showHeaderUserInfo ? <UserInfo /> : null}
      </div>
    </>
  )
}

export default BusinessHeader

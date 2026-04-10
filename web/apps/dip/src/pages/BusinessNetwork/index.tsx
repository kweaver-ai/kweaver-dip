import { Spin } from 'antd'
import { memo, Suspense, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MicroAppComponent from '@/components/MicroAppComponent'
import {
  BUSINESS_NETWORK_BASE_PATH,
  businessLeafMenuItems,
  defaultBusinessMenuItem,
} from '@/components/Sider/BusinessSider/menus'
import { useLanguageStore, useUserInfoStore } from '@/stores'
import { useGlobalLayoutStore } from '@/stores/globalLayoutStore'
import type { CurrentMicroAppInfo } from '@/stores/microAppStore'
import { BASE_PATH, getFullPath } from '@/utils/config'
import { buildMicroAppInfo, normalizeMicroAppEntry } from './micro-app-info'
import { buildBusinessMicroAppProps } from './micro-app-props'
import styles from './micro-app-scope.module.less'
import { businessComponentPageRegistry } from './page-registry'

interface ContentProps {
  currentMenu: any
  microAppInfo: CurrentMicroAppInfo | null
  customProps: Record<string, unknown>
}

const Content = memo(({ currentMenu, microAppInfo, customProps }: ContentProps) => {
  // vega微应用加载时，有点问题，这么处理避免重复加载
  if (currentMenu.key !== microAppInfo?.key && microAppInfo?.routeBasename?.includes('/vega/'))
    return null

  if (currentMenu.page.type === 'micro-app') {
    if (!microAppInfo) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <Spin />
        </div>
      )
    }
    return (
      <div className={styles.microAppScope}>
        <MicroAppComponent
          appBasicInfo={microAppInfo}
          homeRoute={getFullPath(BUSINESS_NETWORK_BASE_PATH)}
          customProps={customProps}
        />
      </div>
    )
  }

  const ComponentPage = businessComponentPageRegistry[currentMenu.page.componentKey]
  if (ComponentPage) {
    return (
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center">
            <Spin />
          </div>
        }
      >
        <ComponentPage
          appBasicInfo={microAppInfo}
          homeRoute={getFullPath(BUSINESS_NETWORK_BASE_PATH)}
          customProps={customProps}
        />
      </Suspense>
    )
  }

  return (
    <div className="h-full w-full p-6">
      <div className="rounded-lg border border-[var(--dip-border-color)] bg-white p-6">
        未实现的组件页面：{currentMenu.page.componentKey}
      </div>
    </div>
  )
})

const BusinessNetwork = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const { userInfo } = useUserInfoStore()
  const currentMenu =
    businessLeafMenuItems.find((item) => location.pathname.startsWith(item.path)) ??
    defaultBusinessMenuItem
  const [microAppInfo, setMicroAppInfo] = useState<CurrentMicroAppInfo | null>(null)
  const customProps = useMemo(() => {
    return buildBusinessMicroAppProps({
      basePath: `${BASE_PATH}${currentMenu.path}`,
      language,
      userInfo: userInfo ?? undefined,
      navigateToMicroWidget: (params) => {
        // 从menus中找到page.app.name为params.name的item，然后跳转到该item的path，并拼接params.path
        const item = businessLeafMenuItems.find(
          (menuItem) =>
            menuItem.page?.type === 'micro-app' && menuItem.page?.app?.name === params.name,
        )
        if (!item) return

        const targetPath = item.path + params.path
        if (params.isNewTab) {
          const url = `${window.location.origin}${getFullPath(targetPath)}`
          window.open(url, '_blank', 'noopener,noreferrer')
        } else {
          navigate(targetPath)
        }
      },
      toggleSideBarShow: (show: boolean) => {
        useGlobalLayoutStore.getState().setBusinessSiderHidden(!show)
      },
      navigate: (path: string) => {
        let newPath = path.replace(BASE_PATH, '')

        // 解决从agent无法跳转回业务知识网络页面的问题
        if (newPath.endsWith('/vega')) {
          newPath = `${newPath}/ontology`
        }
        navigate(newPath)
      },
      changeCustomPathComponent: (param: { label: string } | null) => {
        // 如果label存在，则header的面包屑新增第三级，lable作为第三级的名称
        // 如果label不存在，则header的面包屑恢复两级
        useGlobalLayoutStore.getState().setBusinessHeaderCustomBreadcrumbLabel(param?.label ?? null)
      },
    })
  }, [currentMenu.path, language, navigate, userInfo?.id])

  /** URL：?hidesidebar=true 隐藏侧栏；?hideHeaderPath=true 隐藏顶栏面包屑；离开本页时恢复 */
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hideSidebar = params.get('hidesidebar') === 'true'
    const hideHeaderBreadcrumb = params.get('hideHeaderPath') === 'true'
    const store = useGlobalLayoutStore.getState()
    store.setBusinessSiderHidden(hideSidebar)
    store.setBusinessHeaderBreadcrumbHidden(hideHeaderBreadcrumb)
    return () => {
      store.setBusinessSiderHidden(false)
      store.setBusinessHeaderBreadcrumbHidden(false)
      store.setBusinessHeaderCustomBreadcrumbLabel(null)
    }
  }, [])

  // 访问 /business-network 时自动跳到默认菜单
  useEffect(() => {
    if (location.pathname === BUSINESS_NETWORK_BASE_PATH) {
      navigate(defaultBusinessMenuItem.path, { replace: true })
    }
  }, [location.pathname, navigate])

  // micro-app 菜单时，构造 MicroAppComponent 需要的配置
  useEffect(() => {
    if (currentMenu.page.type !== 'micro-app') {
      setMicroAppInfo(null)
      return
    }
    const appInfo = buildMicroAppInfo(
      currentMenu.key,
      currentMenu.label,
      currentMenu.path,
      currentMenu.page.app.name,
      normalizeMicroAppEntry(currentMenu.page.app.entry),
    )
    setMicroAppInfo(appInfo)
  }, [currentMenu])

  return (
    <div className="w-full h-full">
      <Content currentMenu={currentMenu} microAppInfo={microAppInfo} customProps={customProps} />
    </div>
  )
}

export default BusinessNetwork

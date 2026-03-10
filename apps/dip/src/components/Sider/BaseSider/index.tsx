import { MenuFoldOutlined, MenuUnfoldOutlined, PushpinOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Menu, message, Popover, Tooltip } from 'antd'
import clsx from 'clsx'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppIcon from '@/components/AppIcon'
import { routeConfigs } from '@/routes/routes'
import type { RouteConfig, SiderType } from '@/routes/types'
import {
  getFirstVisibleRouteBySiderType,
  getRouteByPath,
  isRouteVisibleForRoles,
} from '@/routes/utils'
import { useMicroAppStore, usePreferenceStore } from '@/stores'
import { MaskIcon } from '../components/GradientMaskIcon'

interface BaseSiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /** 侧边栏类型（store 或 studio） */
  type: SiderType
}

/**
 * 商店/工作室版块通用的侧边栏（BaseSider）
 * 用于 store 和 studio 类型的侧边栏
 */
const BaseSider = ({ collapsed, onCollapse, type }: BaseSiderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [messageApi, messageContextHolder] = message.useMessage()
  const { pinnedMicroApps, unpinMicroApp, wenshuAppInfo } = usePreferenceStore()

  // TODO: 角色信息需要从其他地方获取，暂时使用空数组
  const roleIds = useMemo(() => new Set<string>([]), [])
  const firstVisibleRoute = useMemo(
    () => getFirstVisibleRouteBySiderType(type, roleIds),
    [type, roleIds],
  )

  const { setAppSource } = useMicroAppStore()
  const handleOpenApp = useCallback(
    (appId: number) => {
      // 记录来源类型，针对特定 appId 进行持久化
      setAppSource(appId, type)
      // 移除 URL 中的 type 参数，完全依赖 Store 持久化
      navigate(`/application/${appId}`)
    },
    [navigate, type, setAppSource],
  )

  const handleUnpin = useCallback(
    async (appId: number) => {
      try {
        await unpinMicroApp(appId)
        messageApi.success('已取消钉住')
      } catch (error) {
        console.error('Failed to unpin micro app:', error)
        messageApi.error('取消钉住失败，请稍后重试')
      }
    },
    [unpinMicroApp, messageApi],
  )

  // 根据当前路由确定选中的菜单项
  const getSelectedKey = useCallback(() => {
    const pathname = location.pathname
    if (pathname === '/') {
      return firstVisibleRoute?.key || 'my-app'
    }

    // 检查是否是应用路由（/application/:appId）
    const appMatch = pathname.match(/^\/application\/(\d+)/)
    if (appMatch) {
      const appId = Number(appMatch[1])
      return `micro-app-${appId}`
    }

    const route = getRouteByPath(pathname)
    return route?.key || 'my-app'
  }, [location.pathname, firstVisibleRoute])

  const selectedKey = getSelectedKey()

  const menuItems = useMemo<MenuProps['items']>(() => {
    const hasKey = (route: RouteConfig): route is RouteConfig & { key: string } => {
      return Boolean(route.key)
    }

    const visibleSidebarRoutes = routeConfigs
      .filter((route) => route.showInSidebar && route.key)
      .filter((route) => isRouteVisibleForRoles(route, roleIds))
      .filter((route) => {
        const routeSiderType = route.handle?.layout?.siderType || 'store'
        return routeSiderType === type
      })
      .filter(hasKey)

    const items: MenuProps['items'] = []

    // 1. MyApp (Only for store)
    const myAppIndex = visibleSidebarRoutes.findIndex((r) => r.key === 'my-app')
    if (type === 'store') {
      if (myAppIndex !== -1) {
        const myApp = visibleSidebarRoutes[myAppIndex]
        items.push({
          key: myApp.key,
          label: myApp.label || myApp.key,
          icon: myApp.iconUrl ? (
            <MaskIcon
              url={myApp.iconUrl}
              className="w-4 h-4"
              background={
                selectedKey === myApp.key
                  ? 'linear-gradient(210deg, #1C4DFA 0%, #3FA9F5 100%)'
                  : '#333333'
              }
            />
          ) : null,
          onClick: () => {
            // MyApp 点击时不再显式传递 type 参数，容器会从 Store 读取
            navigate(`/${myApp.path}`)
          },
        })
      }

      // 2. 钉住的应用（显示在 MyApp 下面，排除问数，避免重复）
      pinnedMicroApps
        .filter((app) => app.id !== wenshuAppInfo?.id)
        .forEach((app) => {
          items.push({
            key: `micro-app-${app.id}`,
            label: (
              <div className="w-full h-full flex justify-between items-center">
                {app.name}
                <Popover content="取消固定">
                  <PushpinOutlined
                    className="w-6 h-6 text-base flex items-center justify-center rounded text-[var(--dip-warning-color)] pin-icon opacity-0 hover:bg-[rgba(0,0,0,0.04)]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnpin(app.id)
                    }}
                  />
                </Popover>
              </div>
            ),
            icon: <AppIcon icon={app.icon} name={app.name} size={16} shape="square" />,
            onClick: () => handleOpenApp(app.id),
          })
        })

      if (visibleSidebarRoutes.length > 1) {
        items.push({ type: 'divider' })
      }
    }

    if (type === 'studio') {
      items.push({ type: 'group', label: '项目' })
    }

    // 3. Main Sidebar Items (excluding my-app)
    visibleSidebarRoutes.forEach((route) => {
      if (route.key === 'my-app' && type === 'store') return

      items.push({
        key: route.key,
        label: route.label || route.key,
        icon: route.iconUrl ? (
          <MaskIcon
            url={route.iconUrl}
            className="w-4 h-4"
            background={
              selectedKey === route.key
                ? 'linear-gradient(210deg, #1C4DFA 0%, #3FA9F5 100%)'
                : '#333333'
            }
          />
        ) : null,
        onClick: () => {
          if (route.path) {
            // 普通常规页面跳转，统一移除 URL 参数
            navigate(`/${route.path}`)
          }
        },
      })
    })

    return items
  }, [
    type,
    roleIds,
    selectedKey,
    navigate,
    pinnedMicroApps,
    wenshuAppInfo,
    handleOpenApp,
    handleUnpin,
    firstVisibleRoute,
  ])

  return (
    <div className="flex flex-col h-full px-0 pt-4 pb-2 overflow-hidden min-h-0">
      {messageContextHolder}
      {/* 菜单内容：min-h-0 保证 flex 子项正确收缩，避免撑开导致底部块位移引发 CLS */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dip-hideScrollbar">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          inlineCollapsed={collapsed}
          selectable={true}
        />
      </div>

      {/* 底部块固定占位，避免菜单渲染后挤压导致 CLS */}
      <div className="shrink-0">
        <div className="h-px bg-[--dip-border-color] my-2 shrink-0" />
        <div
          className={clsx(
            'flex items-center min-h-8',
            collapsed ? 'justify-center' : 'justify-between pl-2 pr-2',
          )}
        >
          <Tooltip title={collapsed ? '展开' : '收起'} placement="right">
            <button
              type="button"
              className="text-sm cursor-pointer flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color] hover:text-[--dip-primary-color]"
              onClick={() => onCollapse(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default BaseSider

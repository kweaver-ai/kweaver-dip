import type { MenuProps } from 'antd'
import { Menu, Popover } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import PinIcon from '@/assets/icons/icon_pin.svg?react'
import aiStoreUrl from '@/assets/images/sider/aiStore.svg'
import AppIcon from '@/components/AppIcon'
import { routeConfigs } from '@/routes/routes'
import type { RouteConfig } from '@/routes/types'
import { getRouteSidebarMode, isRouteVisibleForRoles } from '@/routes/utils'
import { usePreferenceStore } from '@/stores'
import { MaskIcon } from './GradientMaskIcon'

const AI_STORE_SUBMENU_KEY = 'ai-store'

interface StoreMenuSectionProps {
  collapsed: boolean
  selectedKey?: string
  navigate: NavigateFunction
  roleIds?: Set<string>
}

export const StoreMenuSection = ({
  collapsed,
  selectedKey,
  navigate,
  roleIds = new Set<string>(),
}: StoreMenuSectionProps) => {
  const { pinnedMicroApps, wenshuAppInfo, unpinMicroApp } = usePreferenceStore()
  const [openKeys, setOpenKeys] = useState<string[]>([AI_STORE_SUBMENU_KEY])
  const isAiStoreOpen = openKeys.includes(AI_STORE_SUBMENU_KEY)

  const visibleSidebarRoutes = useMemo(() => {
    const hasKey = (route: RouteConfig): route is RouteConfig & { key: string } => {
      return Boolean(route.key)
    }
    return routeConfigs
      .filter((route) => getRouteSidebarMode(route) === 'menu' && route.key)
      .filter((route) => isRouteVisibleForRoles(route, roleIds))
      .filter((route) => route.handle?.layout?.module === 'store')
      .filter(hasKey)
  }, [roleIds])

  /** 仅当前 AI Store 子菜单内实际渲染的项（钉住应用 + 侧栏路由），用于判断是否高亮整组 */
  const aiStoreChildKeys = useMemo(() => {
    const keys = new Set<string>()
    if (wenshuAppInfo) {
      keys.add(`micro-app-${wenshuAppInfo.key}`)
    }
    pinnedMicroApps.forEach((app) => {
      if (app.key !== wenshuAppInfo?.key) {
        keys.add(`micro-app-${app.key}`)
      }
    })
    visibleSidebarRoutes.forEach((route) => {
      keys.add(route.key)
    })
    return keys
  }, [pinnedMicroApps, visibleSidebarRoutes, wenshuAppInfo])

  const isSelectionUnderAiStore = useMemo(() => {
    if (!selectedKey) return false
    if (selectedKey === 'my-app' || selectedKey === 'app-store') return true
    return aiStoreChildKeys.has(selectedKey)
  }, [aiStoreChildKeys, selectedKey])

  useEffect(() => {
    if (collapsed) return
    if (isSelectionUnderAiStore) {
      setOpenKeys((prev) =>
        prev.includes(AI_STORE_SUBMENU_KEY) ? prev : [...prev, AI_STORE_SUBMENU_KEY],
      )
    }
  }, [collapsed, isSelectionUnderAiStore])

  const menuItems = useMemo<MenuProps['items']>(() => {
    const children: NonNullable<MenuProps['items']> = []

    if (wenshuAppInfo) {
      children.push({
        key: `micro-app-${wenshuAppInfo.key}`,
        label: '智能问数',
        icon: (
          <AppIcon icon={wenshuAppInfo.icon} name={wenshuAppInfo.name} size={16} shape="square" />
        ),
        onClick: () => {
          navigate(`/application/${encodeURIComponent(wenshuAppInfo.key)}`)
        },
      })
    }

    pinnedMicroApps
      .filter((app) => app.key !== wenshuAppInfo?.key)
      .forEach((app) => {
        children.push({
          key: `micro-app-${app.key}`,
          label: (
            <div className="flex justify-between items-center">
              <span className="truncate flex-1">{app.name}</span>
              <Popover content="取消固定">
                <div className="w-6 h-6 ml-2 items-center justify-center rounded hidden flex-shrink-0 rounded text-[var(--dip-warning-color)] pin-icon hover:bg-[rgba(0,0,0,0.04)]">
                  <PinIcon
                    className="w-4 h-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      void unpinMicroApp(app.key)
                    }}
                  />
                </div>
              </Popover>
            </div>
          ),
          icon: <AppIcon icon={app.icon} name={app.name} size={16} shape="square" />,
          onClick: () => {
            navigate(`/application/${encodeURIComponent(app.key)}`)
          },
        })
      })

    visibleSidebarRoutes.forEach((route) => {
      children.push({
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
            navigate(`/${route.path}`)
          }
        },
      })
    })

    if (children.length === 0) {
      return []
    }

    return [
      {
        key: AI_STORE_SUBMENU_KEY,
        label: 'AI Store',
        popupClassName: 'dip-sider-submenu-popup',
        className:
          isSelectionUnderAiStore && !isAiStoreOpen ? 'store-submenu-parent-highlight' : undefined,
        icon: (
          <MaskIcon
            url={aiStoreUrl}
            className="w-4 h-4"
            background={
              isSelectionUnderAiStore
                ? 'linear-gradient(210deg, #1C4DFA 0%, #3FA9F5 100%)'
                : '#333333'
            }
          />
        ),
        children,
      },
    ]
  }, [
    isAiStoreOpen,
    isSelectionUnderAiStore,
    navigate,
    pinnedMicroApps,
    selectedKey,
    visibleSidebarRoutes,
    wenshuAppInfo,
  ])

  return (
    <Menu
      mode="inline"
      inlineIndent={0}
      selectedKeys={selectedKey ? [selectedKey] : []}
      openKeys={collapsed ? undefined : openKeys}
      onOpenChange={collapsed ? undefined : setOpenKeys}
      items={menuItems}
      inlineCollapsed={collapsed}
      selectable
    />
  )
}

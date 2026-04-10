import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { useMemo } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { routeConfigs } from '@/routes/routes'
import type { RouteConfig } from '@/routes/types'
import { getRouteSidebarMode, isRouteVisibleForRoles } from '@/routes/utils'
import { MaskIcon } from './GradientMaskIcon'

interface StudioMenuSectionProps {
  collapsed: boolean
  selectedKey?: string
  navigate: NavigateFunction
  roleIds?: Set<string>
  allowedKeys?: string[]
}

export const StudioMenuSection = ({
  collapsed,
  selectedKey,
  navigate,
  roleIds = new Set<string>(),
  allowedKeys,
}: StudioMenuSectionProps) => {
  const menuItems = useMemo<MenuProps['items']>(() => {
    const hasKey = (route: RouteConfig): route is RouteConfig & { key: string } =>
      Boolean(route.key)

    const visibleSidebarRoutes = routeConfigs
      .filter((route) => getRouteSidebarMode(route) === 'menu' && route.key)
      .filter((route) => isRouteVisibleForRoles(route, roleIds))
      .filter((route) => route.handle?.layout?.module === 'studio')
      .filter((route) => !allowedKeys || allowedKeys.includes(route.key as string))
      .filter(hasKey)

    const items: MenuProps['items'] = []
    const groupMap = new Map<string, NonNullable<MenuProps['items']>>()
    const groupedRouteOrder: string[] = []

    visibleSidebarRoutes.forEach((route) => {
      const item: Exclude<MenuProps['items'], undefined>[number] = {
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
      }

      if (!route.group) {
        items.push(item)
        return
      }

      if (!groupMap.has(route.group)) {
        groupMap.set(route.group, [])
        groupedRouteOrder.push(route.group)
      }
      groupMap.get(route.group)?.push(item)
    })

    groupedRouteOrder.forEach((groupName) => {
      const children = groupMap.get(groupName)
      if (!children || children.length === 0) return

      items.push({
        key: `group-${groupName}`,
        label: groupName,
        type: 'group',
      })
      children.forEach((child) => {
        items.push(child)
      })
    })

    return items
  }, [allowedKeys, navigate, roleIds, selectedKey])

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={menuItems}
      inlineCollapsed={collapsed}
      selectable
    />
  )
}

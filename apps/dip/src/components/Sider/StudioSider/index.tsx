import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Button, Menu, Tooltip } from 'antd'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ProjectIcon from '@/assets/images/sider/project.svg?react'
import { routeConfigs } from '@/routes/routes'
import type { RouteConfig } from '@/routes/types'
import {
  getFirstVisibleRouteBySiderType,
  getRouteByPath,
  isRouteVisibleForRoles,
} from '@/routes/utils'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'
import { MaskIcon } from '../components/GradientMaskIcon'

interface StudioSiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
}

/**
 * 工作室版块通用的侧边栏（StudioSider）
 * 用于 studio 类型的侧边栏
 */
const StudioSider = ({ collapsed, onCollapse }: StudioSiderProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const { plans, fetchPlans, setSelectedPlanId } = useUserWorkPlanStore()

  // TODO: 角色信息需要从其他地方获取，暂时使用空数组
  const roleIds = useMemo(() => new Set<string>([]), [])
  const firstVisibleRoute = useMemo(
    () => getFirstVisibleRouteBySiderType('studio', roleIds),
    [roleIds],
  )

  // 首次进入时拉取当前用户的工作计划列表
  useEffect(() => {
    if (!plans.length) {
      void fetchPlans()
    }
  }, [plans.length, fetchPlans])

  // 根据当前路由确定选中的菜单项
  const getSelectedKey = useCallback(() => {
    const pathname = location.pathname
    if (pathname === '/') {
      return 'conversation'
    }

    // studio 工作计划详情路由：/studio/work-plan/:workPlanId
    const workPlanMatch = pathname.match(/^\/studio\/work-plan\/(\d+)/)
    if (workPlanMatch) {
      const planId = Number(workPlanMatch[1])
      return `work-plan-${planId}`
    }

    const route = getRouteByPath(pathname)
    return route?.key || 'conversation'
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
        const routeSiderType = route.handle?.layout?.siderType || ''
        return routeSiderType === 'studio' && route.key !== 'studio-home'
      })
      .filter(hasKey)

    const items: MenuProps['items'] = []

    // 1. 工作计划分组（父节点 + 动态计划列表）
    if (plans.length > 0) {
      items.push({
        type: 'group',
        key: 'work-plan',
        label: '工作计划',
      })
      items.push(
        ...plans.map((plan) => ({
          key: `work-plan-${plan.id}`,
          label: plan.name,
          icon: <ProjectIcon className="w-4 h-4" />,
          onClick: () => {
            setSelectedPlanId(plan.id)
            navigate(`/studio/work-plan/${plan.id}`)
          },
        })),
      )
    }

    // 2. routes 筛选出来的路由，按 group 分组展示
    const groupMap = new Map<string, NonNullable<MenuProps['items']>>()
    const groupedRouteOrder: string[] = []

    visibleSidebarRoutes.forEach((route) => {
      if (!route.key) return

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
        // 无 group 的路由直接平铺
        items.push(item)
        return
      }

      if (!groupMap.has(route.group)) {
        groupMap.set(route.group, [])
        groupedRouteOrder.push(route.group)
      }
      const groupChildren = groupMap.get(route.group)
      if (groupChildren) {
        groupChildren.push(item)
      }
    })

    groupedRouteOrder.forEach((groupName) => {
      const children = groupMap.get(groupName)
      if (!children || children.length === 0) return

      // 分组标题作为一个普通、不可点击的菜单项，后面紧跟该分组下的子项，整体平铺展示
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
  }, [roleIds, selectedKey, navigate, plans, setSelectedPlanId, firstVisibleRoute])

  /** 新建工作计划 */
  const handleCreateWorkPlan = () => {
    navigate('/studio/work-plan/new')
  }

  return (
    <div className="flex flex-col h-full px-0 pt-4 pb-2 overflow-hidden min-h-0">
      {/* 新建工作计划按钮 */}
      <div
        className={clsx(
          'flex items-center gap-2 pb-10',
          collapsed ? 'justify-center px-1.5' : 'justify-between px-5',
        )}
      >
        <Tooltip title={collapsed ? '新建工作计划' : ''} placement="right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateWorkPlan}
            styles={{ root: { width: '100%' } }}
          >
            {collapsed ? '' : '新建工作计划'}
          </Button>
        </Tooltip>
      </div>

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

export default StudioSider

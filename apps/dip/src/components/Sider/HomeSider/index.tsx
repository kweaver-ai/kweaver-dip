import type { MenuProps } from 'antd'
import { Button, Menu, message, Modal, Tooltip } from 'antd'
import clsx from 'classnames'
import { useCallback, useEffect, useMemo } from 'react'
import { createSearchParams, useLocation, useNavigate } from 'react-router-dom'
import logoImage from '@/assets/images/brand/logo.png'
import { routeConfigs } from '@/routes/routes'
import type { RouteConfig, SiderType } from '@/routes/types'
import { getRouteByPath, getRouteSidebarMode, isRouteVisibleForRoles } from '@/routes/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import { useUserHistoryStore } from '@/stores/userHistoryStore'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'
import IconFont from '../../IconFont'
import { ExternalLinksMenu } from '../components/ExternalLinksMenu'
import { MaskIcon } from '../components/GradientMaskIcon'
import { HistorySection } from '../components/HistorySection'
import { UserMenuItem } from '../components/UserMenuItem'
import { WorkPlanSection } from '../components/WorkPlanSection'

interface HomeSiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /**
   * 与布局一致：`home` 展示 Logo + 外链；`studio`（DIP Studio）不展示
   */
  siderType?: SiderType
}

/**
 * 首页侧边栏（HomeSider）
 *
 * - 负责渲染：Logo + 折叠按钮 + 用户信息
 * - 显示路由菜单项、钉住的应用、外部链接等
 */
const HomeSider = ({ collapsed, onCollapse, siderType = 'home' }: HomeSiderProps) => {
  const isHomeSider = siderType === 'home'
  const navigate = useNavigate()
  const location = useLocation()
  const [, messageContextHolder] = message.useMessage()
  const [modal, modalContextHolder] = Modal.useModal()
  const {
    plans,
    total,
    fetchPlans,
    refreshPlansOnFocus,
    pausePlan,
    resumePlan,
    deletePlan,
    selectedPlanId,
    setSelectedPlanId,
  } = useUserWorkPlanStore()
  const {
    sessions: historySessions,
    total: historyTotal,
    fetchSessions,
    refreshSessionsOnFocus,
    selectedSessionKey,
    setSelectedSessionKey,
    deleteHistorySession,
  } = useUserHistoryStore()
  const { language } = useLanguageStore()
  const { getOEMResourceConfig } = useOEMConfigStore()
  const oemResourceConfig = getOEMResourceConfig(language)
  // TODO: 角色信息需要从其他地方获取，暂时使用空数组
  const roleIds = useMemo(() => new Set<string>([]), [])

  /** 新建会话 */
  const handleCreateSession = () => {
    navigate('/home')
  }
  const handleOpenPlanDetail = useCallback(
    (planId: string, _agentId: string, sessionId: string) => {
      navigate({
        pathname: `/work-plan/${planId}`,
        search: `?${createSearchParams({
          sessionKey: sessionId,
        })}`,
      })
    },
    [navigate],
  )

  /** 根据当前路由确定选中的菜单项 */
  const getSelectedKey = useCallback(() => {
    const pathname = location.pathname
    if (pathname === '/') {
      return 'home'
    }

    const route = getRouteByPath(pathname)
    return route?.key || 'home'
  }, [location.pathname])

  const selectedKey = getSelectedKey()
  const topPlans = useMemo(() => plans.slice(0, 5), [plans])
  const hasPlanMore = total > 5
  const topHistorySessions = useMemo(() => historySessions.slice(0, 5), [historySessions])
  const hasHistoryMore = historyTotal > 5

  useEffect(() => {
    void fetchPlans()
  }, [fetchPlans])
  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    const match = location.pathname.match(/^\/history\/([^/]+)$/)
    setSelectedSessionKey(match ? decodeURIComponent(match[1]) : undefined)
  }, [location.pathname, setSelectedSessionKey])

  useEffect(() => {
    const match = location.pathname.match(/^\/work-plan\/([^/]+)$/)
    setSelectedPlanId(match ? decodeURIComponent(match[1]) : undefined)
  }, [location.pathname, setSelectedPlanId])

  useEffect(() => {
    const handleWindowFocus = () => {
      void refreshPlansOnFocus()
      void refreshSessionsOnFocus()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshPlansOnFocus()
        void refreshSessionsOnFocus()
      }
    }
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshPlansOnFocus, refreshSessionsOnFocus])

  /** 菜单项 */
  const menuItems = useMemo<MenuProps['items']>(() => {
    const hasKey = (route: RouteConfig): route is RouteConfig & { key: string } => {
      return Boolean(route.key)
    }

    const visibleSidebarRoutes = routeConfigs
      .filter((route) => getRouteSidebarMode(route) === 'menu' && route.key)
      .filter((route) => isRouteVisibleForRoles(route, roleIds))
      .filter((route) => route.handle?.layout?.siderType === 'studio')
      .filter(hasKey)

    const items: MenuProps['items'] = []

    // 第一组：普通数字员工路由，按 group 分组展示
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
  }, [roleIds, selectedKey, navigate])

  // 获取 OEM logo，如果获取不到则使用默认 logo
  const logoUrl = useMemo(() => {
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
  }, [oemResourceConfig])

  return (
    <div className="flex flex-col h-full px-0 pt-4 pb-1 overflow-hidden">
      {messageContextHolder}
      {modalContextHolder}
      {/* logo：仅 home 布局；DIP Studio（studio）不展示 */}
      {isHomeSider ? (
        <div
          className={clsx(
            'flex items-center gap-2 pb-4',
            collapsed ? 'justify-center pl-1.5 pr-1.5' : 'justify-between pl-3 pr-2',
          )}
        >
          <img src={logoUrl} alt="logo" className={clsx('h-8 w-auto', collapsed && 'hidden')} />
        </div>
      ) : null}

      {/* 新建会话按钮 */}
      <div
        className={clsx(
          'flex items-center gap-2 pb-3',
          collapsed ? 'justify-center px-3' : 'justify-between px-3',
        )}
      >
        <Tooltip title={collapsed ? '会话' : ''} placement="right">
          <Button
            type="primary"
            icon={<IconFont type="icon-dip-add" />}
            onClick={handleCreateSession}
            styles={{ root: { width: '100%' } }}
          >
            {collapsed ? '' : '会话'}
          </Button>
        </Tooltip>
      </div>

      {/* 菜单内容 */}
      <div className="flex-1 flex flex-col dip-hideScrollbar">
        <div className="flex-1">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            inlineCollapsed={collapsed}
            selectable
          />

          {!collapsed && topPlans.length > 0 ? (
            <WorkPlanSection
              plans={topPlans}
              hasMore={hasPlanMore}
              selectedPlanId={selectedPlanId}
              onMore={() => navigate('/work-plan')}
              onOpenPlanDetail={(planId, agentId, sessionId) => {
                setSelectedPlanId(planId)
                handleOpenPlanDetail(planId, agentId, sessionId)
              }}
              onPausePlan={pausePlan}
              onResumePlan={resumePlan}
              onDeletePlan={deletePlan}
            />
          ) : null}

          {!collapsed && topHistorySessions.length > 0 ? (
            <HistorySection
              sessions={topHistorySessions}
              hasMore={hasHistoryMore}
              selectedSessionKey={selectedSessionKey}
              onMore={() => navigate('/history')}
              onOpenHistoryDetail={(sessionKey) => {
                setSelectedSessionKey(sessionKey)
                navigate(`/history/${sessionKey}`)
              }}
              onDeleteHistory={(session) => {
                modal.confirm({
                  title: '确认删除',
                  content: '删除后将无法恢复，是否继续？',
                  okText: '确定',
                  okType: 'primary',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: async () => {
                    await deleteHistorySession(session.key)
                  },
                })
              }}
            />
          ) : null}
        </div>
        <ExternalLinksMenu collapsed={collapsed} roleIds={roleIds} />
      </div>

      {collapsed ? null : (
        <div className="mx-3 my-2 h-px shrink-0 bg-[var(--dip-border-color)]" aria-hidden />
      )}

      {/* 用户 + 收缩：样式与上方 Menu 项一致（40px 行、边距与 hover） */}
      {collapsed ? (
        <div className="dip-sider-footer-stack shrink-0">
          <div className="dip-sider-footer-row">
            <Tooltip title="展开" placement="right">
              <span className="flex min-w-0 flex-1">
                <button
                  type="button"
                  className="flex h-10 min-h-10 w-full min-w-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--dip-text-color)]"
                  onClick={() => onCollapse(false)}
                >
                  <IconFont type="icon-dip-cebianlan" className="text-base leading-none" />
                </button>
              </span>
            </Tooltip>
          </div>
          <div className="dip-sider-footer-row">
            <UserMenuItem collapsed={collapsed} />
          </div>
        </div>
      ) : (
        <div className="dip-sider-footer-row dip-sider-footer-row-horizontal shrink-0">
          <div className="min-w-0 flex-1">
            <UserMenuItem collapsed={collapsed} />
          </div>
          <Tooltip title="收起" placement="right">
            <button
              type="button"
              className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--dip-text-color)] hover:text-[var(--dip-primary-color)]"
              onClick={() => onCollapse(true)}
            >
              <IconFont type="icon-dip-cebianlan" className="text-base leading-none" />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

export default HomeSider

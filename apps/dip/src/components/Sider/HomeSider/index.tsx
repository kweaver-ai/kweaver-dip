import { Modal, message, Tooltip } from 'antd'
import clsx from 'classnames'
import { useCallback, useEffect, useMemo } from 'react'
import { createSearchParams, useLocation, useNavigate } from 'react-router-dom'
import dipFavicon from '@/assets/favicons/dip.png'
import ChatIcon from '@/assets/images/sider/chat.svg?react'
import type { SiderType } from '@/routes/types'
import { getRouteByPath } from '@/routes/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import { useUserHistoryStore } from '@/stores/userHistoryStore'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'
import { ExternalLinksSection } from '../components/ExternalLinksMenu'
import { HistorySection } from '../components/HistorySection'
import { SiderFooterUser } from '../components/SiderFooterUser'
import { StoreMenuSection } from '../components/StoreMenuSection'
import { StudioMenuSection } from '../components/StudioMenuSection'
import { WorkPlanSection } from '../components/WorkPlanSection'

interface HomeSiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /** 侧边栏布局形态 */
  layout?: SiderType
}

/**
 * 首页侧边栏（HomeSider）
 *
 * - 负责渲染：Logo + 折叠按钮 + 用户信息
 * - 显示路由菜单项、钉住的应用、外部链接等
 */
const HomeSider = ({ collapsed, onCollapse, layout = 'entry' }: HomeSiderProps) => {
  const isHomeSider = layout === 'entry'
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
  const modules = useUserInfoStore((s) => s.modules)
  // TODO: 角色信息需要从其他地方获取，暂时使用空数组
  const roleIds = useMemo(() => new Set<string>([]), [])
  const hasStudio = modules.includes('studio')
  const hasStore = modules.includes('store')

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
  /** 与菜单选中一致：仅 home、studio/conversation 为「会话」主按钮（深色） */
  const isSessionRouteActive = selectedKey === 'home' || selectedKey === 'studio-conversation'
  const topPlans = useMemo(() => plans.slice(0, 5), [plans])
  const hasPlanMore = total > 5
  const topHistorySessions = useMemo(() => historySessions.slice(0, 5), [historySessions])
  const hasHistoryMore = historyTotal > 5

  useEffect(() => {
    if (!hasStudio) return
    void fetchPlans()
  }, [fetchPlans, hasStudio])
  useEffect(() => {
    if (!hasStudio) return
    void fetchSessions()
  }, [fetchSessions, hasStudio])

  useEffect(() => {
    const match = location.pathname.match(/^\/history\/([^/]+)$/)
    setSelectedSessionKey(match ? decodeURIComponent(match[1]) : undefined)
  }, [location.pathname, setSelectedSessionKey])

  useEffect(() => {
    const match = location.pathname.match(/^\/work-plan\/([^/]+)$/)
    setSelectedPlanId(match ? decodeURIComponent(match[1]) : undefined)
  }, [location.pathname, setSelectedPlanId])

  useEffect(() => {
    if (!hasStudio) return
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
  }, [refreshPlansOnFocus, refreshSessionsOnFocus, hasStudio])

  // 获取 OEM logo，如果获取不到则使用默认 logo
  const logoUrl = useMemo(() => {
    return oemResourceConfig?.['logo.png']
  }, [oemResourceConfig])
  const logoIconUrl = dipFavicon

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
          {collapsed ? (
            <img src={logoIconUrl} alt="logo" className={clsx('h-6 w-auto')} />
          ) : (
            <img src={logoUrl} alt="logo" className={clsx('h-8 w-auto')} />
          )}
        </div>
      ) : null}

      {hasStudio ? (
        <div className={clsx('flex items-center px-1.5', collapsed ? 'h-9 my-1' : 'pb-3')}>
          <Tooltip title={collapsed ? '会话' : ''} placement="right">
            <button
              type="button"
              onClick={handleCreateSession}
              className={clsx(
                `w-full h-9 flex justify-center items-center gap-x-2 rounded`,
                isSessionRouteActive
                  ? 'bg-[--dip-primary-color] text-white'
                  : collapsed
                    ? 'text-[--dip-text-color] hover:bg-[--dip-hover-bg-color-6]'
                    : 'bg-[#EBF4FF] text-[--dip-primary-color]',
              )}
            >
              <ChatIcon className="w-4 h-4" />
              {collapsed ? '' : '会话'}
            </button>
          </Tooltip>
        </div>
      ) : null}

      {/* 菜单内容 */}
      <div className="flex-1 flex flex-col dip-hideScrollbar">
        <div className="flex-1">
          {hasStudio ? (
            <>
              <StudioMenuSection
                collapsed={collapsed}
                selectedKey={selectedKey}
                roleIds={roleIds}
                navigate={navigate}
                allowedKeys={['digital-human-management']}
              />

              {!collapsed && topPlans.length > 0 ? (
                <WorkPlanSection
                  plans={topPlans}
                  hasMore={hasPlanMore}
                  total={plans.length}
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
                  total={historySessions.length}
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
            </>
          ) : null}
        </div>
        {hasStore ? (
          <StoreMenuSection
            collapsed={collapsed}
            selectedKey={selectedKey}
            roleIds={roleIds}
            navigate={navigate}
          />
        ) : null}
        <ExternalLinksSection collapsed={collapsed} roleIds={roleIds} />
      </div>

      {collapsed ? null : (
        <div className="mx-3 my-2 h-px shrink-0 bg-[var(--dip-border-color)]" aria-hidden />
      )}

      <SiderFooterUser collapsed={collapsed} onCollapse={onCollapse} />
    </div>
  )
}

export default HomeSider

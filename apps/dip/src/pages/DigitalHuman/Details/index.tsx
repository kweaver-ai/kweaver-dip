import { message, Spin, Tabs } from 'antd'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import intl from 'react-intl-universal'
import { createSearchParams, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppIcon from '@/components/AppIcon'
import DigitalHumanSetting from '@/components/DigitalHumanSetting'
import { useDigitalHumanStore } from '@/components/DigitalHumanSetting/digitalHumanStore'
import IconFont from '@/components/IconFont'
import WorkPlanList from '@/components/WorkPlanList'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'
import { useDigitalHumanPageLoad } from '../useDigitalHumanPageLoad'
import Conversation from './Conversation'
import styles from './index.module.less'

type DetailsParams = {
  digitalHumanId?: string
}

export type DigitalHumanDetailTab = 'plan' | 'session' | 'config'

// Tab 暂由页面 state 管理，恢复 URL 分段时可启用
// function tabFromPathname(pathname: string): DigitalHumanDetailTab | null {
//   const normalized = pathname.replace(/\/$/, '')
//   const last = normalized.split('/').pop()
//   if (last === 'plan' || last === 'session' || last === 'config') return last
//   return null
// }

/** 非管理员：员工详情（多 Tab），配置 Tab 仅只读，无新建/编辑 */
const Details = () => {
  const params = useParams<DetailsParams>()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = useUserInfoStore((s) => s.isAdmin)
  const { basic, detail } = useDigitalHumanStore()
  const [, messageContextHolder] = message.useMessage()

  const digitalHumanId = params.digitalHumanId
  const [activeTab, setActiveTab] = useState<DigitalHumanDetailTab>('plan')

  /** 管理员走全页配置 */
  useLayoutEffect(() => {
    if (!isAdmin) return
    if (!digitalHumanId) {
      navigate('/digital-human/management/setting', { replace: true })
      return
    }
    navigate(`/digital-human/management/${digitalHumanId}/setting${location.search}`, {
      replace: true,
    })
  }, [isAdmin, digitalHumanId, navigate, location.search])

  /** 无 plan|session|config 段时补默认 Tab（路由 Tab 恢复时启用） */
  // useEffect(() => {
  //   if (!digitalHumanId || isAdmin) return
  //   if (!activeTab) {
  //     navigate(`/digital-human/management/${digitalHumanId}/plan`, { replace: true })
  //   }
  // }, [digitalHumanId, activeTab, isAdmin, navigate])

  /** 非法 id */
  useEffect(() => {
    if (!digitalHumanId) {
      navigate('/digital-human/management', { replace: true })
    }
  }, [digitalHumanId, navigate])

  const loading = useDigitalHumanPageLoad(digitalHumanId, 'detail', null, !isAdmin)

  const onTabChange = useCallback((key: string) => {
    setActiveTab(key as DigitalHumanDetailTab)
    // if (!digitalHumanId) return
    // const k = key as DigitalHumanDetailTab
    // navigate(`/digital-human/management/${digitalHumanId}/${k}`, { replace: true })
  }, [])

  const tabItems = useMemo(() => {
    return [
      {
        key: 'plan',
        label: '工作计划',
        icon: <IconFont type="icon-dip-gailan" />,
      },
      {
        key: 'session',
        label: '会话',
        icon: <IconFont type="icon-dip-chat" />,
      },
      {
        key: 'config',
        label: '员工配置',
        icon: <IconFont type="icon-dip-shezhi" />,
      },
    ]
  }, [])

  if (!digitalHumanId) {
    return null
  }

  if (isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[--dip-white] overflow-hidden">
      {messageContextHolder}
      <div className="h-12 grid grid-cols-3 items-center gap-2 pl-3 pr-6 border-b border-[--dip-border-color] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/digital-human/management')}
            className="flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color] shrink-0"
          >
            <IconFont type="icon-dip-left" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <AppIcon
              name={basic.name}
              size={32}
              className="w-8 h-8 rounded-md overflow-hidden"
              shape="square"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-[--dip-text-color]">{basic.name}</span>
              {detail?.updated_at && (
                <span className="text-[--dip-text-color-65] text-xs">
                  更新：{formatTimeSlash(new Date(detail.updated_at).getTime())}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center min-w-0 self-end">
          <Tabs
            indicator={{ size: 0 }}
            size="small"
            activeKey={activeTab}
            onChange={onTabChange}
            items={tabItems}
            className={styles.tabs}
            styles={{
              header: { padding: '0', margin: '0' },
              indicator: { backgroundColor: 'var(--dip-text-color)' },
            }}
          />
        </div>
        <div className="flex items-center justify-end gap-2 min-w-0" />
      </div>

      {activeTab === 'plan' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col pt-5">
          <WorkPlanList
            source={{ mode: 'digitalHuman', digitalHumanId: digitalHumanId }}
            onPlanClick={(job) => {
              const from = `${location.pathname}${location.search}`
              navigate(
                {
                  pathname: `/work-plan/${job.id}`,
                  search: `?${createSearchParams({
                    sessionKey: job.sessionKey,
                  })}`,
                },
                { state: { from } },
              )
            }}
          />
        </div>
      )}
      {activeTab === 'session' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Conversation digitalHumanId={digitalHumanId} />
        </div>
      )}
      {activeTab === 'config' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <DigitalHumanSetting readonly />
        </div>
      )}
    </div>
  )
}

export default Details

import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Dropdown, Modal, message, Tabs } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getDigitalHumanDetail } from '@/apis/dip-studio/digital-human'
import { type CronJob, getCronJob } from '@/apis/dip-studio/plan'
import IconFont from '@/components/IconFont'
import ActionModal from '@/components/WorkPlanDetail/ActionModal/ActionModal'
import Outcome from '@/components/WorkPlanDetail/Outcome'
import Tasks from '@/components/WorkPlanDetail/Tasks'
import { useBreadcrumbDetailStore, useGlobalLayoutStore } from '@/stores'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'
import Conversation from './Conversation'
import styles from './index.module.less'
export type WorkPlanDetailTab = 'results' | 'tasks' | 'conversation'

/** 工作计划详情（从全局列表或数字员工详情计划 Tab 进入时，通过 location.state.from 返回来源页；Tab 使用内部 state） */
const WorkPlanDetail = () => {
  const { workPlanId } = useParams<{ workPlanId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  type WorkPlanDetailLocationState = {
    from?: string
    /** 从数字员工详情「工作计划」Tab 进入时由上游传入，用于面包屑祖先链 */
    breadcrumbFrom?: 'digital-human-detail'
    digitalHumanName?: string
  }
  const locationState = location.state as WorkPlanDetailLocationState | null
  const from = locationState?.from
  const sessionKey = searchParams.get('sessionKey')?.trim() ?? ''
  const digitalHumanId = sessionKey.split('agent:')[1]?.split(':')[0]
  const { setCollapsed } = useGlobalLayoutStore()
  const setDetailBreadcrumb = useBreadcrumbDetailStore((s) => s.setDetailBreadcrumb)
  const { fetchPlans, pausePlan, resumePlan, deletePlan } = useUserWorkPlanStore()
  const [modal, modalContextHolder] = Modal.useModal()
  const [messageApi, messageContextHolder] = message.useMessage()

  const workPlanDetailRootRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<WorkPlanDetailTab>('results')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [digitalHumanName, setDigitalHumanName] = useState('--')
  const [currentPlan, setCurrentPlan] = useState<CronJob | undefined>(undefined)
  const plans = useUserWorkPlanStore((s) => s.plans)

  useEffect(() => {
    // setCollapsed(true)
  }, [setCollapsed])

  useEffect(() => {
    setActiveTab('results')
  }, [workPlanId])

  const loadCurrentPlan = useCallback(async () => {
    if (!workPlanId) {
      setCurrentPlan(undefined)
      return
    }
    try {
      const plan = await getCronJob(workPlanId)
      setCurrentPlan(plan)
    } catch {
      setCurrentPlan(undefined)
    }
  }, [workPlanId])

  useEffect(() => {
    void loadCurrentPlan()
  }, [loadCurrentPlan])

  useEffect(() => {
    if (!workPlanId) {
      setCurrentPlan(undefined)
      return
    }
    // 防止切换到另一个 workPlanId 时，短暂展示上一项的标题
    if (currentPlan && currentPlan.id !== workPlanId) {
      setCurrentPlan(undefined)
    }
  }, [workPlanId, currentPlan])

  useEffect(() => {
    // 卸载时清理，避免跨路由残留影响动态标题
    return () => setDetailBreadcrumb(null)
  }, [setDetailBreadcrumb])

  useEffect(() => {
    if (!workPlanId) {
      setDetailBreadcrumb(null)
      return
    }

    // 1) 先从列表缓存中读取标题（避免加载中动态面包屑缺省）
    const fromList = plans.find((p) => p.id === workPlanId)
    const listTitle = fromList?.name?.trim()

    // 2) 再用详情请求结果覆盖（确保名称最新）
    const detailTitle = currentPlan?.id === workPlanId ? currentPlan.name?.trim() : undefined
    const title = detailTitle ?? listTitle

    const isFromDigitalHumanDetail = locationState?.breadcrumbFrom === 'digital-human-detail'
    const dhName = locationState?.digitalHumanName?.trim()
    const replaceAncestorRoutes =
      isFromDigitalHumanDetail && dhName
        ? [
            {
              key: 'breadcrumb-digital-human-mgmt',
              name: '我的数字员工',
              path: '/studio/digital-human',
            },
            {
              key: 'breadcrumb-digital-human-name',
              name: dhName,
              path: locationState?.from,
            },
          ]
        : undefined

    setDetailBreadcrumb(title ? { routeKey: 'work-plan-item', title, replaceAncestorRoutes } : null)
  }, [workPlanId, plans, currentPlan, setDetailBreadcrumb, locationState])

  useEffect(() => {
    let disposed = false

    const loadDigitalHumanName = async () => {
      setDigitalHumanName('--')

      if (!digitalHumanId) return

      try {
        const digitalHumanDetail = await getDigitalHumanDetail(digitalHumanId)
        if (!disposed) {
          setDigitalHumanName(digitalHumanDetail.name?.trim() || '--')
        }
      } catch {
        if (!disposed) {
          setDigitalHumanName('--')
        }
      }
    }

    void loadDigitalHumanName()

    return () => {
      disposed = true
    }
  }, [digitalHumanId, sessionKey])

  const handleBack = useCallback(() => {
    if (from) {
      navigate(from)
      return
    }
    navigate('/studio/work-plan')
  }, [from, navigate])

  const handleDeletePlan = useCallback(() => {
    if (!workPlanId) return
    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleFilled />,
      content: '删除计划后，相关配置和数据将被清除，用户将无法使用计划。是否继续？',
      okText: '确定',
      okType: 'primary',
      okButtonProps: { danger: true },
      cancelText: '取消',
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      ),
      onOk: async () => {
        const success = await deletePlan(workPlanId)
        if (success) {
          messageApi.success('删除成功')
          handleBack()
        }
      },
    })
  }, [deletePlan, handleBack, messageApi, modal, workPlanId])

  const operationItems: MenuProps['items'] = useMemo(() => {
    if (!workPlanId) return []
    return [
      {
        key: currentPlan?.enabled ? 'pause' : 'resume',
        label: currentPlan?.enabled ? '暂停' : '启动',
        onClick: async () => {
          if (!workPlanId) return
          if (currentPlan?.enabled) {
            const ok = await pausePlan(workPlanId)
            if (ok) {
              await Promise.all([loadCurrentPlan(), fetchPlans({ silent: true })])
            }
          } else {
            const ok = await resumePlan(workPlanId)
            if (ok) {
              await Promise.all([loadCurrentPlan(), fetchPlans({ silent: true })])
            }
          }
        },
      },
      {
        key: 'edit',
        label: '编辑',
        onClick: () => {
          setEditModalOpen(true)
        },
      },
      {
        key: 'delete',
        label: '删除',
        danger: true,
        onClick: () => {
          handleDeletePlan()
        },
      },
    ]
  }, [
    currentPlan?.enabled,
    fetchPlans,
    handleDeletePlan,
    loadCurrentPlan,
    pausePlan,
    resumePlan,
    workPlanId,
  ])

  const tabItems = useMemo(
    () => [
      {
        key: 'results' satisfies WorkPlanDetailTab,
        label: '成果',
        icon: <IconFont type="icon-doclib" />,
      },
      {
        key: 'tasks' satisfies WorkPlanDetailTab,
        label: '执行',
        icon: <IconFont type="icon-taskplanning" />,
      },
      {
        key: 'conversation' satisfies WorkPlanDetailTab,
        label: '指令',
        icon: <IconFont type="icon-dialog" />,
      },
    ],
    [],
  )

  return (
    <div
      ref={workPlanDetailRootRef}
      className="relative flex h-full flex-col overflow-hidden bg-[--dip-white]"
    >
      {modalContextHolder}
      {messageContextHolder}
      <div className="grid h-12 shrink-0 grid-cols-3 items-center gap-2 border-b border-[--dip-border-color] pl-3 pr-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[--dip-text-color]"
            aria-label="返回"
          >
            <IconFont type="icon-left" />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#60AEFF]">
              <IconFont type="icon-plan" className="text-[18px] text-white" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium text-[--dip-text-color]">
                {currentPlan?.name || '--'}
              </span>
              <span className="text-xs text-[--dip-text-color-65] truncate">
                数字员工：{digitalHumanName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 justify-center self-end">
          <Tabs
            indicator={{ size: 0 }}
            activeKey={activeTab}
            items={tabItems}
            size="small"
            className={styles.tabs}
            onChange={(key) => setActiveTab(key as WorkPlanDetailTab)}
            styles={{
              header: { padding: '0', margin: '0' },
              indicator: { backgroundColor: 'var(--dip-text-color)' },
            }}
          />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <Dropdown menu={{ items: operationItems }} trigger={['click']} placement="bottomRight">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-[--dip-text-color-65] hover:bg-[--dip-hover-bg-color]"
            >
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>
      </div>

      {activeTab === 'results' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outcome
            planId={workPlanId}
            dhId={digitalHumanId}
            sessionId={sessionKey}
            previewDrawerGetContainer={() => workPlanDetailRootRef.current ?? undefined}
          />
        </div>
      )}
      {activeTab === 'tasks' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tasks
            planId={workPlanId}
            dhId={digitalHumanId}
            sessionId={sessionKey}
            previewDrawerGetContainer={() => workPlanDetailRootRef.current ?? undefined}
          />
        </div>
      )}
      {activeTab === 'conversation' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Conversation planId={workPlanId} dhId={digitalHumanId} sessionId={sessionKey} />
        </div>
      )}
      <ActionModal
        open={editModalOpen}
        plan={currentPlan}
        onCancel={() => setEditModalOpen(false)}
        onSuccess={async () => {
          setEditModalOpen(false)
          await Promise.all([loadCurrentPlan(), fetchPlans({ silent: true })])
        }}
      />
    </div>
  )
}

export default WorkPlanDetail

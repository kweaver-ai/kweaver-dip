import { DownOutlined, ExclamationCircleFilled, UpOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Dropdown, Modal, message } from 'antd'
import clsx from 'classnames'
import { useState } from 'react'
import type { CronJob } from '@/apis/dip-studio/plan'
import IconFont from '@/components/IconFont'
import { getPlanJobDisplayStatus } from '@/components/WorkPlanList/utils'
import { formatTotalDisplay } from '../utils'

interface WorkPlanSectionProps {
  plans: CronJob[]
  hasMore: boolean
  total: number
  selectedPlanId?: string
  onMore: () => void
  onOpenPlanDetail: (planId: string, agentId: string, sessionId: string) => void
  onPausePlan: (id: string) => Promise<boolean>
  onResumePlan: (id: string) => Promise<boolean>
  onDeletePlan: (id: string) => Promise<boolean>
}

export const WorkPlanSection = ({
  plans,
  hasMore,
  total,
  selectedPlanId,
  onMore,
  onOpenPlanDetail,
  onPausePlan,
  onResumePlan,
  onDeletePlan,
}: WorkPlanSectionProps) => {
  const [modal, contextHolder] = Modal.useModal()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const getPlanStatusMeta = (plan: CronJob): { prefix: string; colorClass: string } => {
    const status = getPlanJobDisplayStatus(plan)
    if (status === 'running') return { prefix: '[执行中]', colorClass: 'text-[#497ED2]' }
    if (status === 'ok') return { prefix: '[已完成]', colorClass: 'text-[#519B72]' }
    if (status === 'error') return { prefix: '[失败]', colorClass: 'text-[#ff4d4f]' }
    if (status === 'skipped') return { prefix: '[已跳过]', colorClass: 'text-[rgba(0,0,0,0.65)]' }
    if (status === 'disabled') return { prefix: '[已暂停]', colorClass: 'text-[#D48806]' }
    return { prefix: '[待执行]', colorClass: 'text-[rgba(0,0,0,0.65)]' }
  }

  const handleDeletePlan = (id: string) => {
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
        try {
          await onDeletePlan(id)
          messageApi.success('删除成功')
        } catch (err: any) {
          if (err?.description) {
            messageApi.error(err.description)
          }
        }
      },
    })
  }

  return (
    <>
      {contextHolder}
      {messageContextHolder}
      <div className="px-2 py-1">
        {/* <div className="h-px bg-[--dip-line-color-10] mb-1.5" /> */}
        <div className="flex items-center justify-between px-2 py-1">
          <button
            type="button"
            className="text-xs leading-[20px] text-[--dip-text-color-45] bg-transparent border-0 p-0 cursor-pointer flex flex-1 items-center"
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            工作计划（{formatTotalDisplay(total)}）
            {isCollapsed ? (
              <UpOutlined className="text-xs" />
            ) : (
              <DownOutlined className="text-xs" />
            )}
          </button>
          {hasMore ? (
            <button
              type="button"
              className="text-xs text-[--dip-primary-color] bg-transparent border-0 cursor-pointer hover:underline"
              onClick={onMore}
            >
              更多
            </button>
          ) : null}
        </div>
        {isCollapsed ? null : (
          <div className="flex flex-col gap-0.5">
            {plans.length === 0 ? (
              <div className="text-xs text-[--dip-text-color-45] px-2 py-2">暂无计划</div>
            ) : (
              plans.map((plan) => {
                const isActive = selectedPlanId === plan.id
                const { prefix: statusPrefix, colorClass } = getPlanStatusMeta(plan)
                const operationItems: MenuProps['items'] = [
                  {
                    key: plan.enabled ? 'pause' : 'resume',
                    label: plan.enabled ? '暂停' : '启用',
                    onClick: (e) => {
                      e.domEvent.stopPropagation()
                      if (plan.enabled) {
                        void onPausePlan(plan.id)
                      } else {
                        void onResumePlan(plan.id)
                      }
                    },
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    danger: true,
                    onClick: (e) => {
                      e.domEvent.stopPropagation()
                      handleDeletePlan(plan.id)
                    },
                  },
                ]
                return (
                  <button
                    key={`work-plan-${plan.id}`}
                    type="button"
                    onClick={() => onOpenPlanDetail(plan.id, plan.agentId, plan.sessionKey)}
                    className={clsx(
                      'group w-full text-left min-h-[44px] px-2 py-1.5 rounded-md relative border-0 flex items-center',
                      isActive
                        ? 'bg-[#f1f7fe] text-[--dip-primary-color]'
                        : 'bg-transparent hover:bg-[--dip-hover-bg-color]',
                    )}
                  >
                    {/* {isActive ? (
                  <span className="absolute left-[-4px] top-[10px] bottom-[10px] w-[2px] rounded-[2px] bg-[linear-gradient(180deg,#3fa9f5_0%,#126ee3_100%)]" />
                ) : null} */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={clsx(
                          'truncate text-sm group-hover:mr-2',
                          isActive ? 'text-[--dip-primary-color]' : 'text-[--dip-text-color]',
                        )}
                        title={plan.name}
                      >
                        {plan.name}
                      </div>
                      <div
                        className={clsx(`mt-0.5 truncate text-xs leading-4 ${colorClass}`)}
                        title={statusPrefix}
                      >
                        {statusPrefix}
                      </div>
                    </div>
                    <Dropdown menu={{ items: operationItems }} trigger={['click']}>
                      <button
                        type="button"
                        className="w-6 h-6 flex-shrink-0 hidden items-center justify-center rounded text-[--dip-text-color-45] group-hover:inline-flex hover:bg-[rgba(0,0,0,0.06)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <IconFont type="icon-more" />
                      </button>
                    </Dropdown>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )
}

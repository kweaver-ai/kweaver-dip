import { ClockCircleOutlined, MessageOutlined, SnippetsOutlined } from '@ant-design/icons'
import { memo, type ReactNode } from 'react'
import type { PlanListItemProps } from './types'
import { formatPlanRelativeDayTime, getSessionTitle } from './utils'

function PlanMetaColumn({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 max-w-[140px] flex-col gap-1">
      <div className="flex items-center justify-center gap-1 text-xs leading-[18px] text-[--dip-text-color-45]">
        <span className="inline-flex shrink-0 text-[10px]">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div
        className="truncate text-xs leading-[18px] text-[--dip-text-color-45]"
        title={value === '—' ? undefined : value}
      >
        {value}
      </div>
    </div>
  )
}

function PlanListItemInner({ session, onClick }: PlanListItemProps) {
  const title = getSessionTitle(session)
  const updatedAtText = formatPlanRelativeDayTime(session.updatedAt)
  const chatTypeText =
    session.kind === 'direct'
      ? '私聊'
      : session.kind === 'group'
        ? '群聊'
        : session.kind === 'global'
          ? '全局'
          : '会话'

  return (
    <button
      type="button"
      onClick={() => onClick?.(session)}
      className="max-w-[880px] mx-auto flex w-full items-center gap-4 rounded-lg border border-[var(--dip-line-color-10)] bg-[--dip-white] px-4 py-3 text-left transition-[border-color,background-color] hover:border-[#BEDBFF] hover:bg-[#EFF6FF]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#60AEFF]">
        <SnippetsOutlined className="text-lg text-white" />
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate text-sm font-medium leading-[22px] text-[--dip-text-color]"
            title={title}
          >
            {title}
          </span>
          <span className="inline-flex shrink-0 items-center rounded bg-[#E6FFFB] px-1.5 py-0.5 text-xs font-normal leading-[18px] text-[#08979C]">
            {chatTypeText}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-start justify-end gap-6 gap-y-2 max-w-[min(100%,420px)]">
        <PlanMetaColumn icon={<MessageOutlined />} label="类型" value={chatTypeText} />
        <PlanMetaColumn icon={<ClockCircleOutlined />} label="更新时间" value={updatedAtText} />
      </div>
    </button>
  )
}

const PlanListItem = memo(PlanListItemInner)
export default PlanListItem

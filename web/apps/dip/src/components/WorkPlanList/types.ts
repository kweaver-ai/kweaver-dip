import type { CronJob } from '@/apis/dip-studio/plan'

/** 列表默认分页大小 */
export const DEFAULT_PAGE_SIZE = 20

/** 滚动触底提前量（px），用于触发加载更多 */
export const SCROLL_THRESHOLD_PX = 80

/** react-window List 单行固定高度（含卡片与行间距，与 PlanListItem 对齐） */
export const PLAN_LIST_ROW_HEIGHT = 86

/** 列表项右侧灰色/状态胶囊共用基础 class */
export const planListPillBase =
  'inline-flex max-w-full items-center gap-1 rounded-md px-2.5 py-2 text-xs whitespace-nowrap'

/** 列表数据来源：全局计划 API 或指定数字员工的计划 API */
export type PlanListSource = { mode: 'global' } | { mode: 'digitalHuman'; digitalHumanId: string }

export interface PlanListProps {
  source: PlanListSource
  /** 每页条数 */
  pageSize?: number
  className?: string
  /** 搜索值（前端过滤标题） */
  searchValue?: string
  /** 点击计划行 */
  onPlanClick?: (job: CronJob) => void
}

export interface PlanListItemProps {
  job: CronJob
  onClick?: (job: CronJob) => void
  onPause?: (id: string) => Promise<boolean>
  onResume?: (id: string) => Promise<boolean>
  onDelete?: (id: string) => Promise<boolean>
  onEdit?: (job: CronJob) => void
}

/** 计划列表项右侧状态胶囊（文案 + Tailwind class） */
export type PlanStatusPill = { text: string; className: string }

/** 计划列表行展示用状态（左侧图标 + 右侧胶囊统一由此派生） */
export type PlanJobDisplayStatus = 'disabled' | 'running' | 'ok' | 'error' | 'pending' | 'skipped'

export interface PlanJobLeftIconStyle {
  boxClassName: string
  iconClassName: string
}

export interface PlanJobDisplayStyle {
  status: PlanJobDisplayStatus
  pill: PlanStatusPill
  leftIcon: PlanJobLeftIconStyle
}

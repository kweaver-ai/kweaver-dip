import type { SessionSummary } from '@/apis/dip-studio/sessions'

/** 列表默认分页大小 */
export const DEFAULT_PAGE_SIZE = 10

/** 滚动触底提前量（px），用于触发加载更多 */
export const SCROLL_THRESHOLD_PX = 80

/** react-window List 单行固定高度（含卡片与行间距，与 HistoryListItem 对齐） */
export const HISTORY_LIST_ROW_HEIGHT = 86

/** 列表数据来源：全局会话 API 或指定数字员工会话 API */
export type HistoryListSource =
  | { mode: 'global' }
  | { mode: 'digitalHuman'; digitalHumanId: string }

export interface HistoryListProps {
  source: HistoryListSource
  /** 每页条数 */
  pageSize?: number
  className?: string
  /** 搜索值（前端过滤 derivedTitle） */
  searchValue?: string
  /** 点击计划行 */
  onHistoryClick?: (session: SessionSummary) => void
}

export interface PlanListItemProps {
  session: SessionSummary
  onClick?: (session: SessionSummary) => void
  onDelete?: (session: SessionSummary) => void
  digitalHumanName?: string
}

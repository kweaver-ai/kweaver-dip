import type { CronRunEntry } from '@/apis/dip-studio/plan'

/** 滚动触底提前量（px） */
export const TASKS_SCROLL_THRESHOLD_PX = 80

/** 分页大小 */
export const TASKS_PAGE_SIZE = 50

export type TasksPanelProps = {
  planId?: string
  dhId: string
  sessionId: string
  previewDrawerGetContainer?: HTMLElement | (() => HTMLElement | null | undefined)
}

/** 列表展示用：运行记录 + 可选成果数量（mock 或接口扩展） */
export type TaskRunDisplayEntry = CronRunEntry & {
  outcomeCount?: number
}

export type TaskRunUiStatus = 'running' | 'success' | 'failed' | 'skipped' | 'pending'

/**
 * 状态胶囊颜色，与 {@link TaskRunUiStatus} 一一对应。
 * `color`：颜色；`bgColor`：背景颜色；`bdColor`：边框颜色。
 */
export type TaskRunUiStatusColors = {
  color: string
  bgColor: string
  bdColor: string
}

export const TASK_RUN_UI_STATUS_COLORS: Record<TaskRunUiStatus, TaskRunUiStatusColors> = {
  running: {
    color: '#1677ff',
    bgColor: '#e6f4ff',
    bdColor: '#bae0ff',
  },
  success: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    bdColor: '#d9f7be',
  },
  failed: {
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    bdColor: '#ffccc7',
  },
  skipped: {
    color: 'rgba(0,0,0,0.65)',
    bgColor: 'rgba(0,0,0,0.04)',
    bdColor: 'rgba(0,0,0,0.15)',
  },
  pending: {
    color: '#d48806',
    bgColor: '#fffbe6',
    bdColor: '#ffe58f',
  },
}

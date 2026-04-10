import dayjs from 'dayjs'
import type { CronRunEntry } from '@/apis/dip-studio/plan'
import type { TaskRunUiStatus } from './types'

/** 主行日期文案：YYYY/MM/DD执行 */
export function formatExecutionDateLabel(entry: CronRunEntry): string {
  const t = entry.runAtMs ?? entry.ts
  if (t == null) return '—'
  return `${dayjs(t).format('YYYY/MM/DD')}执行`
}

/** 进行中：`runningAtMs` 有值表示当前正在运行（与 CronJobState.runningAtMs 一致） */
function isRunningByTimestamp(entry: CronRunEntry): boolean {
  return entry.runningAtMs != null && Number.isFinite(entry.runningAtMs)
}

export function getRunUiStatus(entry: CronRunEntry): TaskRunUiStatus {
  if (isRunningByTimestamp(entry)) return 'running'

  switch (entry.status) {
    case 'ok':
      return 'success'
    case 'error':
      return 'failed'
    case 'skipped':
      return 'skipped'
    default:
      return 'pending'
  }
}

export function taskStatusTagLabel(status: TaskRunUiStatus): string {
  switch (status) {
    case 'running':
      return '进行中'
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'skipped':
      return '已跳过'
    default:
      return '待执行'
  }
}

import type { CronRunListResponse } from '@/apis/dip-studio/plan'
import type { TaskRunDisplayEntry } from './types'

/** 设为 `true` 时使用本地 mock；接入稳定接口后改为 `false` */
export const TASKS_USE_MOCK = false

const MOCK_TOTAL = 16
const MOCK_DELAY_MS = 320

function at(year: number, month: number, day: number, h = 10, m = 0): number {
  return new Date(year, month - 1, day, h, m, 0, 0).getTime()
}

function buildMockEntry(index: number): TaskRunDisplayEntry {
  const statuses: Array<'ok' | 'error' | 'skipped'> = [
    'ok',
    'ok',
    'ok',
    'ok',
    'ok',
    'error',
    'ok',
    'ok',
    'ok',
    'ok',
    'ok',
    'skipped',
    'ok',
    'ok',
    'ok',
    'ok',
  ]
  const status = statuses[index] ?? 'ok'
  const runDays: [number, number, number][] = [
    [2025, 2, 28],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 7],
    [2025, 2, 21],
    [2025, 2, 14],
    [2025, 2, 21],
    [2025, 1, 31],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 21],
    [2025, 2, 21],
  ]
  const [y, mo, d] = runDays[index] ?? [2025, 2, 21]
  const runAtMs = at(y, mo, d, 9 + (index % 8), (index * 7) % 60)

  const outcomeCount = status === 'ok' && index !== 0 ? 2 : undefined

  const action = index === 14 ? 'pending' : 'run'

  return {
    ts: runAtMs,
    jobId: `job-${index}`,
    action,
    status,
    runAtMs,
    ...(index < 3 ? { sessionId: `mock-session-${index}` } : {}),
    ...(index === 0 ? { runningAtMs: Date.now() } : {}),
    jobName: `执行任务 #${index + 1}`,
    ...(outcomeCount != null ? { outcomeCount } : {}),
  }
}

export function mockFetchPlanRunsPage(offset: number, limit: number): Promise<CronRunListResponse> {
  const entries: TaskRunDisplayEntry[] = []
  for (let i = 0; i < limit && offset + i < MOCK_TOTAL; i++) {
    entries.push(buildMockEntry(offset + i))
  }
  const end = offset + entries.length
  const hasMore = end < MOCK_TOTAL

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        total: MOCK_TOTAL,
        offset,
        limit,
        hasMore,
        nextOffset: hasMore ? end : null,
        entries,
      })
    }, MOCK_DELAY_MS)
  })
}

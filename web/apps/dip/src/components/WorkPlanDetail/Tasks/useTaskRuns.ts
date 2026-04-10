import { throttle } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CronRunListResponse } from '@/apis/dip-studio/plan'
import { getPlanRuns } from '@/apis/dip-studio/plan'
import { mockFetchPlanRunsPage, TASKS_USE_MOCK } from './tasksMock'
import { TASKS_PAGE_SIZE, type TaskRunDisplayEntry } from './types'

export type UseTaskRunsResult = {
  entries: TaskRunDisplayEntry[]
  total: number
  initialLoading: boolean
  loadingMore: boolean
  loadError: boolean
  loadMore: () => void
}

export function useTaskRuns(planId?: string): UseTaskRunsResult {
  const offsetRef = useRef(0)
  const hasMoreRef = useRef(true)
  const isLoadingMoreRef = useRef(false)
  const requestIdRef = useRef(0)

  const [entries, setEntries] = useState<TaskRunDisplayEntry[]>([])
  const [total, setTotal] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const fetchPage = useCallback(
    async (isLoadMore: boolean) => {
      if (!planId?.trim()) {
        setEntries([])
        setTotal(0)
        setInitialLoading(false)
        return
      }

      if (isLoadMore) {
        if (isLoadingMoreRef.current || !hasMoreRef.current) return
        isLoadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        offsetRef.current = 0
        hasMoreRef.current = true
      }

      const reqId = ++requestIdRef.current
      const offset = offsetRef.current

      try {
        const res: CronRunListResponse = TASKS_USE_MOCK
          ? await mockFetchPlanRunsPage(offset, TASKS_PAGE_SIZE)
          : await getPlanRuns(planId, { offset, limit: TASKS_PAGE_SIZE })

        if (reqId !== requestIdRef.current) return

        setLoadError(false)
        setTotal(res.total)
        const pageEntries = res.entries as TaskRunDisplayEntry[]
        if (isLoadMore) {
          setEntries((prev) => [...prev, ...pageEntries])
        } else {
          setEntries(pageEntries)
        }
        offsetRef.current = offset + pageEntries.length
        hasMoreRef.current = Boolean(res.hasMore && res.nextOffset != null)
      } catch {
        if (reqId !== requestIdRef.current) return
        setLoadError(true)
        if (!isLoadMore) {
          setEntries([])
          setTotal(0)
        }
        // message.error('加载执行记录失败')
      } finally {
        if (reqId === requestIdRef.current) {
          isLoadingMoreRef.current = false
          setLoadingMore(false)
          setInitialLoading(false)
        }
      }
    },
    [planId],
  )

  useEffect(() => {
    void fetchPage(false)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return
    void fetchPage(true)
  }, [fetchPage])

  const loadMoreThrottled = useRef(
    throttle(() => {
      loadMore()
    }, 150),
  )

  useEffect(() => () => loadMoreThrottled.current.cancel(), [])

  return {
    entries,
    total,
    initialLoading,
    loadingMore,
    loadError,
    loadMore: () => loadMoreThrottled.current(),
  }
}

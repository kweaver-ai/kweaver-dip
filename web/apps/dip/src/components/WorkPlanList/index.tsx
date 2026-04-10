import { Spin } from 'antd'
import { throttle } from 'lodash'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { List } from 'react-window'
import { type CronJob, getDigitalHumanPlanList } from '@/apis/dip-studio/plan'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import ActionModal from '@/components/WorkPlanDetail/ActionModal/ActionModal'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'
import { mockFetchPlanListPage, PLAN_LIST_USE_MOCK } from './mockPlanList'
import PlanListItem from './PlanListItem'
import {
  DEFAULT_PAGE_SIZE,
  PLAN_LIST_ROW_HEIGHT,
  type PlanListProps,
  SCROLL_THRESHOLD_PX,
} from './types'

function PlanListInner({
  source,
  pageSize = DEFAULT_PAGE_SIZE,
  className,
  onPlanClick,
  searchValue,
}: PlanListProps) {
  const pausePlan = useUserWorkPlanStore((state) => state.pausePlan)
  const resumePlan = useUserWorkPlanStore((state) => state.resumePlan)
  const deletePlan = useUserWorkPlanStore((state) => state.deletePlan)
  const globalPlans = useUserWorkPlanStore((state) => state.plans)
  const globalLoading = useUserWorkPlanStore((state) => state.loading)
  const fetchGlobalPlans = useUserWorkPlanStore((state) => state.fetchPlans)
  const offsetRef = useRef(0)
  const hasMoreRef = useRef(true)
  const isLoadingMoreRef = useRef(false)
  const requestIdRef = useRef(0)

  const [digitalHumanJobs, setDigitalHumanJobs] = useState<CronJob[]>([])
  const [digitalHumanLoading, setDigitalHumanLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CronJob | undefined>(undefined)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const isGlobalMode = source.mode === 'global'

  const handleEditPlan = useCallback((job: CronJob) => {
    setEditingPlan(job)
    setEditModalOpen(true)
  }, [])

  const handleEditSuccess = useCallback(
    async (updatedPlan: CronJob) => {
      setEditModalOpen(false)
      setEditingPlan(undefined)
      if (!isGlobalMode) {
        setDigitalHumanJobs((prev) =>
          prev.map((item) => (item.id === updatedPlan.id ? updatedPlan : item)),
        )
      }
      if (isGlobalMode) {
        await fetchGlobalPlans({ silent: true })
      }
    },
    [fetchGlobalPlans, isGlobalMode],
  )

  const fetchPage = useCallback(
    async (isLoadMore: boolean) => {
      if (source.mode === 'digitalHuman' && !source.digitalHumanId.trim()) {
        setDigitalHumanJobs([])
        setDigitalHumanLoading(false)
        return
      }

      if (isLoadMore) {
        if (!hasMoreRef.current || isLoadingMoreRef.current) return
        isLoadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        hasMoreRef.current = true
        offsetRef.current = 0
        isLoadingMoreRef.current = false
        setDigitalHumanLoading(true)
      }

      const currentOffset = isLoadMore ? offsetRef.current : 0
      const reqId = ++requestIdRef.current

      try {
        // const params = { offset: currentOffset, limit: pageSize }
        const digitalHumanId = source.mode === 'digitalHuman' ? source.digitalHumanId : ''
        const res = PLAN_LIST_USE_MOCK
          ? await mockFetchPlanListPage(currentOffset, pageSize)
          : await getDigitalHumanPlanList(digitalHumanId)

        if (reqId !== requestIdRef.current) return

        hasMoreRef.current = res.hasMore
        offsetRef.current = res.nextOffset ?? currentOffset + res.jobs.length

        if (isLoadMore) {
          setDigitalHumanJobs((prev) => [...prev, ...res.jobs])
        } else {
          setDigitalHumanJobs(res.jobs)
        }
      } catch {
        if (reqId !== requestIdRef.current) return
        // message.error(err?.description)
        if (!isLoadMore) setDigitalHumanJobs([])
      } finally {
        if (reqId === requestIdRef.current) {
          isLoadingMoreRef.current = false
          setLoadingMore(false)
          setDigitalHumanLoading(false)
        }
      }
    },
    [pageSize, source],
  )

  useEffect(() => {
    if (!isGlobalMode) return
    void fetchGlobalPlans()
  }, [fetchGlobalPlans, isGlobalMode])

  useEffect(() => {
    if (isGlobalMode) return
    fetchPage(false)
  }, [fetchPage, isGlobalMode])

  const handleScroll = useMemo(
    () =>
      throttle((params: { target?: HTMLElement }) => {
        const target = params?.target
        if (!target || isLoadingMoreRef.current || !hasMoreRef.current) return
        const { scrollTop, clientHeight, scrollHeight } = target
        if (scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD_PX) return
        void fetchPage(true)
      }, 150),
    [fetchPage],
  )

  useEffect(() => () => handleScroll.cancel(), [handleScroll])

  const handlePause = useCallback(
    async (id: string): Promise<boolean> => {
      const ok = await pausePlan(id)
      if (ok) {
        if (!isGlobalMode) {
          setDigitalHumanJobs((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: false } : item)),
          )
        }
      }
      return ok
    },
    [isGlobalMode, pausePlan],
  )

  const handleResume = useCallback(
    async (id: string): Promise<boolean> => {
      const ok = await resumePlan(id)
      if (ok) {
        if (!isGlobalMode) {
          setDigitalHumanJobs((prev) =>
            prev.map((item) => (item.id === id ? { ...item, enabled: true } : item)),
          )
        }
      }
      return ok
    },
    [isGlobalMode, resumePlan],
  )

  const handleDelete = useCallback(
    async (id: string): Promise<boolean> => {
      const ok = await deletePlan(id)
      if (ok) {
        if (!isGlobalMode) {
          setDigitalHumanJobs((prev) => prev.filter((item) => item.id !== id))
        }
      }
      return ok
    },
    [deletePlan, isGlobalMode],
  )

  const getRow = useCallback(
    ({ index, style, data }: any) => {
      const job = data[index] as CronJob | undefined
      if (!job) return null
      return (
        <div style={style} className="box-border px-6 pb-3 mx-auto">
          <PlanListItem
            job={job}
            onClick={onPlanClick}
            onPause={handlePause}
            onResume={handleResume}
            onDelete={handleDelete}
            onEdit={handleEditPlan}
          />
        </div>
      )
    },
    [handleDelete, handleEditPlan, handlePause, handleResume, onPlanClick],
  )

  const isNoDigitalHumanId = source.mode === 'digitalHuman' && !source.digitalHumanId.trim()
  const initialLoading = isGlobalMode ? globalLoading : digitalHumanLoading
  const listData = isGlobalMode ? globalPlans : digitalHumanJobs
  const trimmedSearchValue = searchValue?.trim() ?? ''

  const filteredListData = useMemo(() => {
    if (!trimmedSearchValue) return listData
    const keyword = trimmedSearchValue.toLowerCase()
    return listData.filter((job) => (job.name ?? '').toLowerCase().includes(keyword))
  }, [listData, trimmedSearchValue])

  const stateContent = (() => {
    if (isNoDigitalHumanId) {
      return <Empty title="暂无数据" />
    }

    if (initialLoading) {
      return <Spin />
    }

    if (filteredListData.length === 0) {
      if (trimmedSearchValue) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return <Empty title="暂无数据" />
    }

    return null
  })()

  return (
    <div className={`flex flex-1 min-h-0 flex-col overflow-hidden ${className ?? ''}`}>
      <div className="flex min-h-0 flex-1 flex-col">
        {stateContent ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 min-h-[300px]">
            {stateContent}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1">
              <List
                tagName={ScrollBarContainer as any}
                className="h-full w-full"
                rowComponent={getRow}
                rowCount={filteredListData.length}
                rowHeight={PLAN_LIST_ROW_HEIGHT}
                rowProps={{
                  data: filteredListData,
                }}
                style={{ height: '100%', width: '100%' }}
                // onScroll={(e) => {
                //   handleScroll({ target: e.currentTarget })
                // }}
              />
            </div>
            {!isGlobalMode && loadingMore ? (
              <div className="flex shrink-0 justify-center px-6 py-2">
                <Spin size="small" />
              </div>
            ) : null}
          </>
        )}

        <ActionModal
          open={editModalOpen}
          plan={editingPlan}
          onCancel={() => {
            setEditModalOpen(false)
            setEditingPlan(undefined)
          }}
          onSuccess={(updatedPlan) => {
            void handleEditSuccess(updatedPlan)
          }}
        />
      </div>
    </div>
  )
}

const WorkPlanList = memo(PlanListInner)
export default WorkPlanList

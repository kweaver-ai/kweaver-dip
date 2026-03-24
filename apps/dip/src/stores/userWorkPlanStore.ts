import { message } from 'antd'
import { create } from 'zustand'
import { type CronJob, deleteCronJob, getCronJobList, updateCronJob } from '@/apis/dip-studio/plan'
import {
  mockDeletePlan,
  mockFetchPlanListPage,
  mockPausePlan,
  mockResumePlan,
  PLAN_LIST_USE_MOCK,
} from '@/components/WorkPlanList/mockPlanList'

interface UserWorkPlanState {
  /** 全量计划缓存（实体缓存） */
  plans: CronJob[]
  /** 首页侧边栏是否加载中 */
  loading: boolean
  /** 全量总数 */
  total: number
  /** 上次刷新时间 */
  lastFetchedAt: number
  /** 当前选中的计划 id（用于侧边栏高亮等） */
  selectedPlanId?: string

  /** 拉取计划（用于首页侧边栏） */
  fetchPlans: (opts?: { silent?: boolean }) => Promise<void>
  /** 页面聚焦刷新（带节流） */
  refreshPlansOnFocus: () => Promise<void>
  /** 暂停计划 */
  pausePlan: (id: string) => Promise<boolean>
  /** 启用计划 */
  resumePlan: (id: string) => Promise<boolean>
  /** 删除工作计划 */
  deletePlan: (id: string) => Promise<boolean>
  /** 设置当前选中的计划 */
  setSelectedPlanId: (id?: string) => void
}

const FOCUS_REFRESH_THROTTLE_MS = 30 * 1000

// 缓存正在进行中的计划加载 Promise，避免并发重复请求
let fetchPlansPromise: Promise<void> | null = null

export const useUserWorkPlanStore = create<UserWorkPlanState>()((set, get) => ({
  plans: [],
  loading: false,
  total: 0,
  lastFetchedAt: 0,
  selectedPlanId: undefined,

  fetchPlans: async (opts) => {
    if (fetchPlansPromise) {
      return fetchPlansPromise
    }

    fetchPlansPromise = (async () => {
      if (!opts?.silent) {
        set({ loading: true })
      }
      try {
        const res = PLAN_LIST_USE_MOCK
          ? await mockFetchPlanListPage(0, 200)
          : await getCronJobList({
              includeDisabled: true,
              offset: 0,
              // limit: 200,
              sortBy: 'updatedAtMs',
              sortDir: 'desc',
            })
        set({
          plans: res.jobs,
          total: res.total,
          loading: false,
          lastFetchedAt: Date.now(),
        })
      } catch (error) {
        console.error('Failed to fetch work plans:', error)
        set({ loading: false })
      } finally {
        fetchPlansPromise = null
      }
    })()

    return fetchPlansPromise
  },

  refreshPlansOnFocus: async () => {
    const { lastFetchedAt } = get()
    if (Date.now() - lastFetchedAt < FOCUS_REFRESH_THROTTLE_MS) {
      return
    }
    await get().fetchPlans({ silent: true })
  },

  pausePlan: async (id) => {
    try {
      if (PLAN_LIST_USE_MOCK) {
        mockPausePlan(id)
      } else {
        await updateCronJob(id, { enabled: false })
      }
      set((state) => ({
        plans: state.plans.map((p) => (p.id === id ? { ...p, enabled: false } : p)),
      }))
      message.success('已暂停计划')
      return true
    } catch (error: any) {
      console.error('Failed to pause work plan:', error)
      if (error?.description) {
        message.error(error.description)
      } else {
        message.error('暂停计划失败，请稍后重试')
      }
      return false
    }
  },

  resumePlan: async (id) => {
    try {
      if (PLAN_LIST_USE_MOCK) {
        mockResumePlan(id)
      } else {
        await updateCronJob(id, { enabled: true })
      }
      set((state) => ({
        plans: state.plans.map((p) => (p.id === id ? { ...p, enabled: true } : p)),
      }))
      message.success('已启用计划')
      return true
    } catch (error: any) {
      console.error('Failed to resume work plan:', error)
      if (error?.description) {
        message.error(error.description)
      } else {
        message.error('启用计划失败，请稍后重试')
      }
      return false
    }
  },

  deletePlan: async (id) => {
    try {
      if (PLAN_LIST_USE_MOCK) {
        mockDeletePlan(id)
      } else {
        await deleteCronJob(id)
      }
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== id),
        total: state.total > 0 ? state.total - 1 : 0,
        selectedPlanId: state.selectedPlanId === id ? undefined : state.selectedPlanId,
      }))
      message.success('删除工作计划成功')
      return true
    } catch (error: any) {
      console.error('Failed to delete work plan:', error)
      if (error?.description) {
        message.error(error.description)
      } else {
        message.error('删除工作计划失败，请稍后重试')
      }
      return false
    }
  },

  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
}))

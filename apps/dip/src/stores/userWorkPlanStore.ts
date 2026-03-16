import { message } from 'antd'
import { create } from 'zustand'
import type { Project } from '@/apis/dip-studio'
import { deleteProjects, getProjects, postProjects, putProjects } from '@/apis/dip-studio'

interface UserWorkPlanState {
  /** 当前用户可见的工作计划（项目）列表 */
  plans: Project[]
  /** 是否加载中 */
  loading: boolean
  /** 当前选中的计划 id（用于侧边栏高亮等） */
  selectedPlanId?: number

  /** 拉取当前用户的工作计划列表 */
  fetchPlans: () => Promise<void>
  /** 新建工作计划 */
  createPlan: (payload: { name: string; description?: string }) => Promise<Project | null>
  /** 更新工作计划名称/描述 */
  updatePlan: (
    id: number,
    payload: { name?: string; description?: string },
  ) => Promise<Project | null>
  /** 删除工作计划 */
  deletePlan: (id: number) => Promise<boolean>
  /** 设置当前选中的计划 */
  setSelectedPlanId: (id?: number) => void
}

// 缓存正在进行中的计划加载 Promise，避免多个组件并发触发重复请求
let fetchPlansPromise: Promise<void> | null = null

export const useUserWorkPlanStore = create<UserWorkPlanState>()((set, get) => ({
  plans: [],
  loading: false,
  selectedPlanId: undefined,

  fetchPlans: async () => {
    if (fetchPlansPromise) {
      return fetchPlansPromise
    }

    fetchPlansPromise = (async () => {
      set({ loading: true })
      try {
        const plans = await getProjects()
        set({ plans, loading: false })
      } catch (error) {
        // 保守处理：只在控制台打印，避免打断主流程
        // eslint-disable-next-line no-console
        console.error('Failed to fetch work plans:', error)
        set({ loading: false })
      } finally {
        fetchPlansPromise = null
      }
    })()

    return fetchPlansPromise
  },

  createPlan: async (payload) => {
    try {
      const project = await postProjects(payload)
      // 创建成功后刷新列表，保证侧边栏等视图同步
      await get().fetchPlans()
      message.success('创建工作计划成功')
      return project
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to create work plan:', error)
      if (error?.description) {
        message.error(error.description)
      } else {
        message.error('创建工作计划失败，请稍后重试')
      }
      return null
    }
  },

  updatePlan: async (id, payload) => {
    try {
      const project = await putProjects(id, payload)
      // 更新成功后本地就地更新，避免不必要的全量刷新
      set((state) => ({
        plans: state.plans.map((p) => (p.id === id ? { ...p, ...project } : p)),
      }))
      message.success('更新工作计划成功')
      return project
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to update work plan:', error)
      if (error?.description) {
        message.error(error.description)
      } else {
        message.error('更新工作计划失败，请稍后重试')
      }
      return null
    }
  },

  deletePlan: async (id) => {
    try {
      await deleteProjects(id)
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== id),
        selectedPlanId: state.selectedPlanId === id ? undefined : state.selectedPlanId,
      }))
      message.success('删除工作计划成功')
      return true
    } catch (error: any) {
      // eslint-disable-next-line no-console
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

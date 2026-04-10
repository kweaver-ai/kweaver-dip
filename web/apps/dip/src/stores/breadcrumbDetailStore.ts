import { create } from 'zustand'

/** 替换默认「祖先路由」面包屑（与 routeConfigs 推导结果二选一） */
export interface BreadcrumbReplaceAncestorItem {
  key: string
  name: string
  path?: string
}

export interface BreadcrumbDetailPayload {
  /** 与路由配置的 `key` 一致，避免跨路由串名 */
  routeKey: string
  title: string
  /**
   * 若存在：覆盖 `getBreadcrumbAncestorRoutes` 的结果。
   * 用于同一详情页因入口不同需要不同祖先链（如从数字员工进入工作计划详情）。
   */
  replaceAncestorRoutes?: BreadcrumbReplaceAncestorItem[]
}

interface BreadcrumbDetailState {
  detail: BreadcrumbDetailPayload | null
  setDetailBreadcrumb: (payload: BreadcrumbDetailPayload | null) => void
}

export const useBreadcrumbDetailStore = create<BreadcrumbDetailState>((set) => ({
  detail: null,
  setDetailBreadcrumb: (payload) => set({ detail: payload }),
}))

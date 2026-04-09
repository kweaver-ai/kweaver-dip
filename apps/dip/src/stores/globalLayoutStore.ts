import { create } from 'zustand'

interface GlobalLayoutState {
  /** 侧边栏收起状态 */
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
  /** 业务知识网络：子应用或 URL 可完全隐藏侧栏（非收起） */
  businessSiderHidden: boolean
  setBusinessSiderHidden: (hidden: boolean) => void
  /** 业务知识网络：URL query hideHeaderPath=true 时隐藏顶栏面包屑（顶栏本身仍显示） */
  businessHeaderBreadcrumbHidden: boolean
  setBusinessHeaderBreadcrumbHidden: (hidden: boolean) => void
  /** 业务知识网络：面包屑第三级动态标题（由业务微应用驱动） */
  businessHeaderCustomBreadcrumbLabel: string | null
  setBusinessHeaderCustomBreadcrumbLabel: (label: string | null) => void
}

export const useGlobalLayoutStore = create<GlobalLayoutState>((set) => ({
  collapsed: false,
  setCollapsed: (collapsed) => set({ collapsed }),
  toggleCollapsed: () =>
    set((state) => ({
      collapsed: !state.collapsed,
    })),
  businessSiderHidden: false,
  setBusinessSiderHidden: (hidden) => set({ businessSiderHidden: hidden }),
  businessHeaderBreadcrumbHidden: false,
  setBusinessHeaderBreadcrumbHidden: (hidden) => set({ businessHeaderBreadcrumbHidden: hidden }),
  businessHeaderCustomBreadcrumbLabel: null,
  setBusinessHeaderCustomBreadcrumbLabel: (label) =>
    set({ businessHeaderCustomBreadcrumbLabel: label }),
}))

/**
 * 供外部非 React 代码控制侧边栏收起/展开
 * 使用方式：`setGlobalSiderCollapsed(true)`
 */
export const setGlobalSiderCollapsed = (collapsed: boolean) => {
  useGlobalLayoutStore.getState().setCollapsed(collapsed)
}

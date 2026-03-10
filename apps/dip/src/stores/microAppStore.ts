import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ApplicationBasicInfo } from '@/apis'
import type { SiderType } from '@/routes/types'

/**
 * 当前激活的微应用信息
 * 用于主应用内部使用，不会传递给微应用
 */
export interface CurrentMicroAppInfo extends ApplicationBasicInfo {
  /** 微应用路由基础路径 */
  routeBasename: string
}

interface MicroAppStoreState {
  /** 当前激活的微应用信息 */
  currentMicroApp: CurrentMicroAppInfo | null
  /**
   * 当前微应用对应的「首页」路由（与 MicroAppContainer 中传入 MicroAppComponent 的 homeRoute 一致）
   * 用于面包屑等组件的「首页」链接
   */
  homeRoute: string | null
  /**
   * 每个应用的来源 Sider 类型映射表
   * key 为 appId, value 为 SiderType
   * 用于支持跨应用切换时依然能正确记录每个应用的返回路径
   */
  appSourceMap: Record<number, SiderType>
  /** 设置当前激活的微应用 */
  setCurrentMicroApp: (info: CurrentMicroAppInfo | null) => void
  /** 设置当前微应用对应的首页路由 */
  setHomeRoute: (route: string | null) => void
  /** 记录特定应用的来源类型 */
  setAppSource: (appId: number, type: SiderType) => void
  /** 清空当前微应用信息 */
  clearCurrentMicroApp: () => void
}

/**
 * 微应用信息 Store
 * 用于存储当前激活的微应用信息，方便主应用各组件使用
 */
export const useMicroAppStore = create<MicroAppStoreState>()(
  persist(
    (set) => ({
      currentMicroApp: null,
      homeRoute: null,
      appSourceMap: {},

      setCurrentMicroApp: (info) => {
        set({ currentMicroApp: info })
      },

      setHomeRoute: (route) => {
        set({ homeRoute: route })
      },

      setAppSource: (appId, type) => {
        set((state) => ({
          appSourceMap: {
            ...state.appSourceMap,
            [appId]: type,
          },
        }))
      },

      clearCurrentMicroApp: () => {
        set({ currentMicroApp: null, homeRoute: null })
      },
    }),
    {
      name: 'dip-micro-app-storage',
      storage: createJSONStorage(() => sessionStorage),
      // 仅持久化 appSourceMap，currentMicroApp 随页面销毁更安全
      partialize: (state) => ({ appSourceMap: state.appSourceMap }),
    },
  ),
)

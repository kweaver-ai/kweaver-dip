import { create } from 'zustand'
import type { ApplicationBasicInfo } from '@/apis'

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
  /** 当前微应用对应的首页路由（用于面包屑首页链接） */
  homeRoute: string | null
  /** 设置当前激活的微应用 */
  setCurrentMicroApp: (info: CurrentMicroAppInfo | null) => void
  /** 设置当前微应用对应的首页路由 */
  setHomeRoute: (route: string | null) => void
  /** 清空当前微应用信息 */
  clearCurrentMicroApp: () => void
}

export const useMicroAppStore = create<MicroAppStoreState>((set) => ({
  currentMicroApp: null,
  homeRoute: null,

  setCurrentMicroApp: (info) => {
    set({ currentMicroApp: info })
  },

  setHomeRoute: (route) => {
    set({ homeRoute: route })
  },

  clearCurrentMicroApp: () => {
    set({ currentMicroApp: null, homeRoute: null })
  },
}))

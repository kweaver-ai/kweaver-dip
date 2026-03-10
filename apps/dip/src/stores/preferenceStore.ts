import { message } from 'antd'
import { create } from 'zustand'
import { type ApplicationInfo, getApplications, pinMicroAppApi } from '@/apis'
import { WENSHU_APP_KEY } from '../routes/types'

/**
 * 用户偏好配置 Store
 * 用于存储侧边栏钉住的微应用等用户偏好
 * 数据从后端接口获取和更新
 */
interface PreferenceState {
  /** 钉在侧边栏的微应用 Key 列表 */
  pinnedMicroApps: ApplicationInfo[]
  /** wenshu 应用信息 */
  wenshuAppInfo: ApplicationInfo | null

  /** 加载状态 */
  loading: boolean
  /** 从后端获取钉住的微应用列表 */
  fetchPinnedMicroApps: () => Promise<void>
  /** 添加钉住的微应用 */
  pinMicroApp: (appId: number) => Promise<boolean>
  /** 取消钉住的微应用 */
  unpinMicroApp: (appId: number, needRequest?: boolean) => Promise<boolean>
  /** 检查是否已钉住 */
  isPinned: (appId: number) => boolean
  /** 切换钉住状态 */
  togglePin: (appId: number) => Promise<boolean>
}

// 缓存正在进行中的 pinned 微应用加载 Promise，避免重复请求
let fetchPinnedMicroAppsPromise: Promise<void> | null = null

export const usePreferenceStore = create<PreferenceState>()((set, get) => ({
  pinnedMicroApps: [],
  wenshuAppInfo: null,
  loading: false,

  fetchPinnedMicroApps: async () => {
    // 如果已经有加载中的 Promise，复用该 Promise，避免重复请求
    if (fetchPinnedMicroAppsPromise) {
      return fetchPinnedMicroAppsPromise
    }

    fetchPinnedMicroAppsPromise = (async () => {
      set({ loading: true })
      try {
        // 通过应用列表接口获取应用列表，再本地过滤出已钉住的微应用，并缓存 wenshu 应用信息
        const apps: ApplicationInfo[] = await getApplications()
        const wenshuAppInfo = (apps ?? []).find((app) => app?.key === WENSHU_APP_KEY) ?? null
        set({
          pinnedMicroApps: (apps ?? []).filter((app) => app?.pinned ?? false),
          wenshuAppInfo,
          loading: false,
        })
      } catch {
        set({ loading: false })
      } finally {
        fetchPinnedMicroAppsPromise = null
      }
    })()

    return fetchPinnedMicroAppsPromise
  },

  pinMicroApp: async (appId: number) => {
    const { pinnedMicroApps } = get()
    if (pinnedMicroApps.some((app) => app.id === appId)) {
      return true
    }

    try {
      await pinMicroAppApi({ appId, pinned: true })
      await get().fetchPinnedMicroApps()
      message.success('固定成功')
      return true
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description)
      }
      return false
    }
  },

  unpinMicroApp: async (appId: number, needRequest = true) => {
    const { pinnedMicroApps } = get()
    if (!pinnedMicroApps.some((app) => app.id === appId)) {
      return true
    }
    if (!needRequest) {
      set({ pinnedMicroApps: pinnedMicroApps.filter((app) => app.id !== appId) })
      return true
    }
    try {
      await pinMicroAppApi({ appId, pinned: false })
      set({ pinnedMicroApps: pinnedMicroApps.filter((app) => app.id !== appId) })
      message.success('已取消固定')
      return true
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description)
      }
      return false
    }
  },

  isPinned: (appId: number) => {
    return get().pinnedMicroApps.some((app) => app.id === appId)
  },

  togglePin: async (appId: number) => {
    const { isPinned, pinMicroApp, unpinMicroApp } = get()
    if (isPinned(appId)) {
      return await unpinMicroApp(appId)
    } else {
      return await pinMicroApp(appId)
    }
  },
}))

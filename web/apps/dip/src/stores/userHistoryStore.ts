import { message } from 'antd'
import { create } from 'zustand'
import { deleteSession, getSessionsList, type SessionSummary } from '@/apis/dip-studio/sessions'
import {
  HISTORY_LIST_USE_MOCK,
  mockGetSessionsList,
} from '@/components/HistoryList/mockHistoryList'

interface UserHistoryState {
  /** 全量历史会话缓存（实体缓存） */
  sessions: SessionSummary[]
  /** 首页侧边栏是否加载中 */
  loading: boolean
  /** 最近一次拉取失败原因 */
  error?: unknown
  /** 全量总数 */
  total: number
  /** 上次刷新时间 */
  lastFetchedAt: number
  /** 当前选中的历史会话 key（用于侧边栏高亮等） */
  selectedSessionKey?: string

  /** 拉取历史会话（用于首页侧边栏） */
  fetchSessions: (opts?: { silent?: boolean }) => Promise<void>
  /** 页面聚焦刷新（带节流） */
  refreshSessionsOnFocus: () => Promise<void>
  /** 设置当前选中的历史会话 */
  setSelectedSessionKey: (key?: string) => void
  /** 删除历史会话 */
  deleteHistorySession: (key: string) => Promise<boolean>
}

const FOCUS_REFRESH_THROTTLE_MS = 30 * 1000

// 缓存正在进行中的历史会话加载 Promise，避免并发重复请求
let fetchSessionsPromise: Promise<void> | null = null

export const useUserHistoryStore = create<UserHistoryState>()((set, get) => ({
  sessions: [],
  loading: false,
  error: null,
  total: 0,
  lastFetchedAt: 0,
  selectedSessionKey: undefined,

  fetchSessions: async (opts) => {
    if (fetchSessionsPromise) {
      return fetchSessionsPromise
    }

    fetchSessionsPromise = (async () => {
      const silent = !!opts?.silent
      if (!opts?.silent) {
        set({ loading: true, error: null })
      } else {
        // 静默刷新：不影响页面错误展示，但先清理上一次 error
        set({ error: null })
      }
      try {
        const res = HISTORY_LIST_USE_MOCK ? await mockGetSessionsList() : await getSessionsList()
        set({
          sessions: res.sessions,
          total: res.count,
          loading: false,
          error: null,
          lastFetchedAt: Date.now(),
        })
      } catch (error) {
        console.error('Failed to fetch history sessions:', error)
        if (silent) {
          // 静默失败：保持已有 sessions，只结束 loading
          set({ loading: false })
        } else {
          set({ loading: false, error, sessions: [], total: 0 })
        }
      } finally {
        fetchSessionsPromise = null
      }
    })()

    return fetchSessionsPromise
  },

  refreshSessionsOnFocus: async () => {
    const { lastFetchedAt } = get()
    if (Date.now() - lastFetchedAt < FOCUS_REFRESH_THROTTLE_MS) {
      return
    }
    await get().fetchSessions({ silent: true })
  },

  setSelectedSessionKey: (key) => set({ selectedSessionKey: key }),
  deleteHistorySession: async (key) => {
    const targetSession = get().sessions.find((item) => item.key === key)
    if (!targetSession?.sessionId) {
      message.warning('当前会话不存在')
      return false
    }
    try {
      await deleteSession(key)
      set((state) => {
        const nextSessions = state.sessions.filter((item) => item.key !== key)
        const removed = nextSessions.length !== state.sessions.length
        return {
          sessions: nextSessions,
          total: removed && state.total > 0 ? state.total - 1 : state.total,
          selectedSessionKey:
            state.selectedSessionKey === key ? undefined : state.selectedSessionKey,
        }
      })
      message.success('删除成功')
      return true
    } catch (error: any) {
      console.error('Failed to delete history session:', error)
      if (error?.description) {
        message.error(error.description)
      } else {
        message.error('删除失败，请稍后重试')
      }
      return false
    }
  },
}))

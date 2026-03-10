import { create } from 'zustand'
import { getLogoutUrl, getUserInfo, type UserInfo } from '@/apis'
import { getAccessToken } from '@/utils/http/token-config'

/**
 * 用户信息 Store
 * 专职处理用户信息的获取、存储和管理
 */
interface UserInfoState {
  /** 用户信息 */
  userInfo: UserInfo | null
  /** 加载状态 */
  isLoading: boolean
  /** 设置用户信息 */
  setUserInfo: (userInfo: UserInfo | null) => void
  /** 登出：清除用户信息、Cookie 并跳转到登出 URL */
  logout: () => void
  /** 从服务端获取用户信息 */
  fetchUserInfo: () => Promise<void>
}

// 用于跟踪正在进行的请求，防止重复请求和竞态条件
let fetchPromise: Promise<void> | null = null
let currentToken: string | null = null
let requestId = 0 // 用于跟踪当前请求 ID

export const useUserInfoStore = create<UserInfoState>((set) => ({
  userInfo: null,
  isLoading: false,

  setUserInfo: (userInfo: UserInfo | null) => set({ userInfo }),

  logout: () => {
    // 清除本地状态
    set({ userInfo: null })
    // 清除正在进行的请求
    fetchPromise = null
    currentToken = null
    // 注意：不清除 Cookie，让后端在登出流程中处理
    // 后端需要从 Cookie 中获取 session_id 来执行完整的登出流程：
    // 1. 获取 Session 信息（需要 session_id）
    // 2. 撤销 Refresh Token（需要从 Session 中获取）
    // 3. 删除 Session 记录
    // 4. 构建 OAuth2 登出 URL（需要从 Session 中获取 id_token 和 state）
    // 后端会在登出回调时清除所有 Cookie
    // clearAuthCookies()
    // 跳转到登出 URL，让后端处理完整的登出流程
    window.location.replace(getLogoutUrl())
  },

  fetchUserInfo: async () => {
    const token = getAccessToken()
    if (!token) {
      // 清除正在进行的请求
      fetchPromise = null
      currentToken = null
      set({ userInfo: null, isLoading: false })
      return
    }

    // 如果已经有相同 token 的请求正在进行，直接返回该 Promise
    // 此时 isLoading 应该已经是 true，状态是同步的
    if (fetchPromise && currentToken === token) {
      return fetchPromise
    }

    // 如果 token 变化了，取消之前的请求（通过忽略其结果）
    if (currentToken && currentToken !== token) {
      fetchPromise = null
    }

    // 创建新的请求前，先同步设置 isLoading: true
    // 这样可以确保调用者立即看到正确的状态，避免时序问题
    set({ isLoading: true })

    // 创建新的请求 Promise
    currentToken = token
    const requestToken = token // 保存请求时的 token，用于后续验证
    const thisRequestId = ++requestId // 生成唯一的请求 ID

    // 创建 Promise
    const requestPromise = (async () => {
      try {
        const userInfo: UserInfo = await getUserInfo()

        // 只有在 token 没有变化且这是当前请求时才更新状态（防止竞态条件）
        const latestToken = getAccessToken()
        const isCurrentRequest = requestId === thisRequestId
        if (latestToken === requestToken && isCurrentRequest) {
          set({
            userInfo,
            isLoading: false,
          })
        }
      } catch (error) {
        // 只有在 token 没有变化且这是当前请求时才更新状态（防止竞态条件）
        const latestToken = getAccessToken()
        const isCurrentRequest = requestId === thisRequestId
        if (latestToken === requestToken && isCurrentRequest) {
          set({
            userInfo: null,
            isLoading: false,
          })
        }
        // 重新抛出错误，让调用者能够捕获到失败的情况
        throw error
      } finally {
        // 如果这是当前请求，清除 Promise 引用
        if (requestId === thisRequestId && currentToken === requestToken) {
          fetchPromise = null
        }
      }
    })()

    // 赋值给 fetchPromise
    fetchPromise = requestPromise
    return requestPromise
  },
}))

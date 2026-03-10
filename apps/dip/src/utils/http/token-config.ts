import axios from 'axios'
import Cookies from 'js-cookie'
import { removeBasePath } from '@/routes/utils'
import { BASE_PATH, getFullPath, normalizePath } from '@/utils/config'

export interface HttpConfig {
  accessToken: string
  refreshToken?: () => Promise<{ accessToken: string }>
  onTokenExpired?: (code?: number) => void
}

// 后端设置的Cookie名称是 dip.oauth2_token
const ACCESS_TOKEN_KEY = 'dip.oauth2_token'
const REFRESH_TOKEN_KEY = 'dip.refresh_token'

function getCookieOptions() {
  return {
    domain: window.location.hostname,
    path: '/',
  }
}

function initDebugTokenFromEnv(): void {
  if (!import.meta.env.DEV) {
    return
  }

  const cookieOptions = getCookieOptions()
  if (!Cookies.get(ACCESS_TOKEN_KEY) && import.meta.env.PUBLIC_TOKEN) {
    Cookies.set(ACCESS_TOKEN_KEY, import.meta.env.PUBLIC_TOKEN, cookieOptions)
  }

  if (!Cookies.get(REFRESH_TOKEN_KEY) && import.meta.env.PUBLIC_REFRESH_TOKEN) {
    Cookies.set(REFRESH_TOKEN_KEY, import.meta.env.PUBLIC_REFRESH_TOKEN, cookieOptions)
  }
}

/**
 * 获取当前 access token（从 Cookie 读取，保证获取最新值）
 */
export function getAccessToken(): string {
  return Cookies.get(ACCESS_TOKEN_KEY) || (import.meta.env.DEV ? import.meta.env.PUBLIC_TOKEN || '' : '')
}

export function setAccessToken(token: string, refreshToken: string): void {
  const cookieOptions = getCookieOptions()
  Cookies.set(ACCESS_TOKEN_KEY, token, cookieOptions)
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, cookieOptions)
}

export function getRefreshToken(): string {
  return (
    Cookies.get(REFRESH_TOKEN_KEY) ||
    (import.meta.env.DEV ? import.meta.env.PUBLIC_REFRESH_TOKEN || '' : '')
  )
}

// 刷新中的 Promise，用于实现"第一个 401 触发刷新，其它等待结果"的队列逻辑
let refreshingPromise: Promise<{ accessToken: string }> | null = null

async function doRefreshTokenRequest(): Promise<{ accessToken: string }> {
  const response = await axios.get<{ access_token: string }>('/api/dip-hub/v1/refresh-token', {
    withCredentials: true, // 确保携带 Cookie
  })
  const newToken = response.data?.access_token
  if (!newToken) {
    throw new Error('刷新 token 接口未返回 access_token')
  }
  Cookies.set(ACCESS_TOKEN_KEY, newToken, getCookieOptions())
  return { accessToken: newToken }
}

/**
 * 默认的刷新 token 实现：
 * - 保证同一时间只会有一个真实的刷新请求
 * - 其它调用方共用这一次请求的结果
 */
export function defaultRefreshToken(): Promise<{ accessToken: string }> {
  if (!refreshingPromise) {
    refreshingPromise = doRefreshTokenRequest().finally(() => {
      refreshingPromise = null
    })
  }

  return refreshingPromise
}

/**
 * 清除所有认证相关的 Cookie
 * 后端设置的 Cookie：dip.session_id, dip.oauth2_token, dip.userid
 */
export function clearAuthCookies(): void {
  const cookieOptions = getCookieOptions()

  Cookies.remove('dip.oauth2_token', cookieOptions)
  Cookies.remove('dip.refresh_token', cookieOptions)
  Cookies.remove('dip.session_id', cookieOptions)
  Cookies.remove('dip.userid', cookieOptions)
}

const onTokenExpired = (_code?: number) => {
  // 清除所有认证相关的 Cookie（与后端登出逻辑保持一致）
  clearAuthCookies()

  // 如果已经在登录页面，只需要清除 Cookie，不需要跳转（避免循环重定向）
  const currentPathname = window.location.pathname
  const currentSearch = window.location.search
  const currentPath = currentPathname + currentSearch
  const loginPath = getFullPath('/login')

  if (currentPathname === loginPath) {
    // 已经在登录页，只清除 Cookie，不跳转
    return
  }

  // 检查是否是根路径（BASE_PATH 或 BASE_PATH + '/'）
  // 如果是根路径，不传递 asredirect，让后端重定向到 login-success
  const normalizedBasePath = normalizePath(BASE_PATH)
  const isRootPath = normalizePath(currentPathname) === normalizedBasePath

  // 跳转到登录页面，并携带当前路径作为重定向地址（去掉 BASE_PATH 前缀）
  // 注意：如果是根路径，不传递 asredirect，让后端重定向到 login-success，由前端处理首页跳转
  const redirectPath = removeBasePath(currentPath)
  const loginUrl = isRootPath
    ? loginPath
    : `${loginPath}?asredirect=${encodeURIComponent(redirectPath)}`
  window.location.replace(loginUrl)
}

export const httpConfig: HttpConfig = {
  get accessToken() {
    // 使用 getter，每次访问时都从 Cookie 读取最新值
    return getAccessToken()
  },
  refreshToken: defaultRefreshToken,
  onTokenExpired: onTokenExpired,
}

initDebugTokenFromEnv()

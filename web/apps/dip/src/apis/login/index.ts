import { get } from '@/utils/http'
import type { RefreshTokenResponse } from './index.d'

/**
 * 登录接口
 * OpenAPI: GET /login?asredirect=xxx
 * 注意：这是一个重定向接口，实际使用时应该直接跳转到该URL
 * @param asredirect 登录成功后重定向的URL（可选）
 * @returns 返回登录URL
 */
export function getLoginUrl(asredirect?: string): string {
  const params = new URLSearchParams()
  if (asredirect) {
    params.set('asredirect', asredirect)
  }
  const query = params.toString()
  return `/api/dip-hub/v1/login${query ? `?${query}` : ''}`
}

/**
 * 登出接口
 * OpenAPI: GET /logout
 * 注意：这是一个重定向接口，实际使用时应该直接跳转到该URL
 * @returns 返回登出URL
 */
export function getLogoutUrl(): string {
  return `/api/dip-hub/v1/logout`
}

/**
 * 刷新令牌接口
 * OpenAPI: GET /refresh-token
 * @returns 刷新后的token信息
 */
export function refreshToken(): Promise<RefreshTokenResponse> {
  return get(`/api/dip-hub/v1/refresh-token`)
}

import { get } from '@/utils/http'
import type { UserInfo } from './index.d'

// 导出类型定义
export type { RoleInfo, UserInfo } from './index.d'

/**
 * 获取用户信息接口
 * OpenAPI: GET /userinfo
 * @returns 用户信息
 */
export function getUserInfo(): Promise<UserInfo> {
  return get(`/api/dip-hub/v1/userinfo`)
}

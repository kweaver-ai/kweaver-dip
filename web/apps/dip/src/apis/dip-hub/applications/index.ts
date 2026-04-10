import { del, get, post, put } from '@/utils/http'
import type {
  AgentInfo,
  ApplicationBasicInfo,
  ApplicationInfo,
  OntologyInfo,
  PinMicroAppParams,
} from './index.d'

// 导出类型定义（仅导出外部使用的类型）
export type { ApplicationInfo, ApplicationBasicInfo, OntologyInfo, AgentInfo }

/**
 * 安装应用
 * OpenAPI: POST /applications (application/octet-stream, binary)
 * @returns 应用信息
 */
export const postApplications = (file: Blob | ArrayBuffer): Promise<ApplicationInfo> => {
  return post(`/api/dip-hub/v1/applications`, {
    body: file,
    headers: { 'Content-Type': 'application/octet-stream' },
    timeout: 600000 * 5, // 5分钟
  })
}

/**
 * 获取应用列表
 * @returns 应用列表
 */
export const getApplications = (params?: Record<string, any>): Promise<ApplicationInfo[]> => {
  const p1 = get(`/api/dip-hub/v1/applications`, { params })
  const p2 = p1.then((result: any) => {
    // 如果结果不是数组，返回空数组
    return Array.isArray(result) ? result : []
  })
  p2.abort = p1.abort
  return p2
}

/**
 * 查看应用基础信息
 * OpenAPI: GET /applications/basic-info?key=xxx 或 ?package_name=xxx
 * 支持通过 key 或 packageName 任意一个参数查询
 */
export const getApplicationsBasicInfo = (key?: string): Promise<ApplicationBasicInfo> => {
  return get(`/api/dip-hub/v1/applications/basic-info`, { params: { key } })
}

/**
 * 查看业务知识网络配置
 * OpenAPI: GET /applications/ontologies?key=xxx
 */
export const getApplicationsOntologies = (key: string): Promise<OntologyInfo[]> => {
  const p1 = get(`/api/dip-hub/v1/applications/ontologies`, { params: { key } })
  const p2 = p1.then((result: any) => {
    // 如果结果不是数组，返回空数组
    return Array.isArray(result) ? result : []
  })
  p2.abort = p1.abort
  return p2
}

/**
 * 查看智能体配置
 * OpenAPI: GET /applications/agents?key=xxx
 */
export const getApplicationsAgents = (key: string): Promise<AgentInfo[]> => {
  const p1 = get(`/api/dip-hub/v1/applications/agents`, { params: { key } })
  const p2 = p1.then((result: any) => {
    // 如果结果不是数组，返回空数组
    return Array.isArray(result) ? result : []
  })
  p2.abort = p1.abort
  return p2
}

/**
 * 卸载应用
 * @param key 应用包唯一标识
 */
export const deleteApplications = (key: string): Promise<void> => {
  return del(`/api/dip-hub/v1/applications/${encodeURIComponent(key)}`)
}

/**
 * 钉住/取消钉住微应用
 */
export async function pinMicroAppApi(params: PinMicroAppParams): Promise<ApplicationInfo> {
  const { key, pinned } = params
  return put(`/api/dip-hub/v1/applications/${encodeURIComponent(key)}/pinned`, {
    body: JSON.stringify({ pinned }),
  })
}

import { del, get } from '@/utils/http'
import type {
  GetDigitalHumanSessionsListParams,
  GetSessionMessagesParams,
  GetSessionsListParams,
  SessionArchivesResponse,
  SessionGetResponse,
  SessionSummary,
  SessionsListResponse,
} from './index.d'

export type {
  GetDigitalHumanSessionsListParams,
  GetSessionMessagesParams,
  GetSessionsListParams,
  SessionArchiveEntry,
  SessionArchiveEntryType,
  SessionArchivesResponse,
  SessionDefaults,
  SessionGetResponse,
  SessionKind,
  SessionMessage,
  SessionPreviewItem,
  SessionSummary,
  SessionsListResponse,
  SessionsPreviewRequest,
  SessionsPreviewResponse,
} from './index.d'

const BASE = '/api/dip-studio/v1'

/** 省略 undefined，避免作为 query 传出 */
function cleanParams<T extends Record<string, unknown>>(obj?: T): T | undefined {
  if (!obj) return undefined
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries) as T
}

/** 归档子路径分段 URL 编码（保留 `/` 作为层级） */
function encodeArchiveSubpath(subpath: string): string {
  return subpath.replace(/^\/+/, '').split('/').filter(Boolean).map(encodeURIComponent).join('/')
}

/** 获取会话列表（getSessionsList） */
export const getSessionsList = (params?: GetSessionsListParams): Promise<SessionsListResponse> =>
  get(`${BASE}/sessions`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<SessionsListResponse>

/** 获取指定数字员工的会话列表（getDigitalHumanSessionsList） */
export const getDigitalHumanSessionsList = (
  dhId: string,
  params?: GetDigitalHumanSessionsListParams,
): Promise<SessionsListResponse> =>
  get(`${BASE}/digital-human/${dhId}/sessions`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<SessionsListResponse>

/** 获取会话摘要详情（getSessionDetail） */
export const getSessionDetail = (
  sessionId: string,
  params?: GetSessionMessagesParams,
): Promise<SessionSummary> =>
  get(`${BASE}/sessions/${sessionId}`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<SessionSummary>

/**删除会话（deleteSession） */
export const deleteSession = (sessionId: string): Promise<void> =>
  del(`${BASE}/sessions/${sessionId}`) as Promise<void>

/** 获取会话消息详情（getSessionMessages） */
export const getSessionMessages = (
  sessionId: string,
  params?: GetSessionMessagesParams,
): Promise<SessionGetResponse> =>
  get(`${BASE}/sessions/${sessionId}/messages`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<SessionGetResponse>

/** 获取会话归档物（getSessionArchives） */
export const getSessionArchives = (sessionId: string): Promise<SessionArchivesResponse> =>
  get(`${BASE}/sessions/${sessionId}/archives`) as Promise<SessionArchivesResponse>

/**
 * 获取会话归档子路径内容（getSessionArchiveSubpath）
 * 目录多为 JSON（SessionArchivesResponse）；文件可能为 octet-stream / text，需传 `responseType`。
 */
export const getSessionArchiveSubpath = (
  sessionId: string,
  subpath: string,
  options?: { responseType?: 'json' | 'text' | 'arraybuffer'; timeout?: number },
): Promise<SessionArchivesResponse | string | ArrayBuffer> =>
  get(`${BASE}/sessions/${sessionId}/archives/${encodeArchiveSubpath(subpath)}`, {
    ...(options?.responseType !== undefined ? { responseType: options.responseType } : {}),
    ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
  }) as Promise<SessionArchivesResponse | string | ArrayBuffer>

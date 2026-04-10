import { get } from '@/utils/http'
import type {
  BknKnowledgeNetworkDetail,
  BknKnowledgeNetworkInfo,
  BknKnowledgeNetworksListResponse,
  GetBknKnowledgeNetworkDetailParams,
  GetBknKnowledgeNetworksParams,
} from './index.d'

export type {
  BknKnowledgeNetworkDetail,
  BknKnowledgeNetworkInfo,
  BknKnowledgeNetworksDirection,
  BknKnowledgeNetworksListResponse,
  BknKnowledgeNetworksSortField,
  GetBknKnowledgeNetworkDetailParams,
  GetBknKnowledgeNetworksParams,
} from './index.d'

const BASE = '/api/dip-studio/v1'

function cleanParams<T extends Record<string, unknown>>(obj?: T): T | undefined {
  if (!obj) return undefined
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries) as T
}

function normalizeKnowledgeNetwork(item: Record<string, unknown>): BknKnowledgeNetworkInfo {
  const id = String(item.id ?? item.kn_id ?? '')
  const name = String(item.name ?? item.kn_name ?? '')
  const updateTime = item.update_time
  const parsedUpdateTime =
    typeof updateTime === 'number'
      ? updateTime
      : typeof updateTime === 'string' && updateTime.trim() !== ''
        ? Number(updateTime)
        : undefined

  return {
    ...item,
    id,
    name,
    comment: typeof item.comment === 'string' ? item.comment : undefined,
    update_time: Number.isFinite(parsedUpdateTime) ? parsedUpdateTime : undefined,
  }
}

/** 获取业务知识网络列表（GET /knowledge-networks） */
export const getBknKnowledgeNetworks = (
  params?: GetBknKnowledgeNetworksParams,
): Promise<BknKnowledgeNetworksListResponse> => {
  const p1 = get(`${BASE}/knowledge-networks`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
    skipAuthRefreshOn401: true,
  })

  const p2 = p1.then((result: unknown) => {
    const data = (result ?? {}) as Record<string, unknown>
    const rawEntries = Array.isArray(data.entries)
      ? data.entries
      : Array.isArray(data.items)
        ? data.items
        : []
    const entries = rawEntries
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map(normalizeKnowledgeNetwork)
    const totalCount =
      typeof data.total_count === 'number'
        ? data.total_count
        : typeof data.total === 'number'
          ? data.total
          : entries.length

    return {
      entries,
      total_count: totalCount,
    }
  })

  p2.abort = p1.abort
  return p2
}

/** 获取业务知识网络详情（GET /knowledge-networks/{kn_id}） */
export const getBknKnowledgeNetworkById = (
  knId: string,
  params?: GetBknKnowledgeNetworkDetailParams,
): Promise<BknKnowledgeNetworkDetail> =>
  get(`${BASE}/knowledge-networks/${encodeURIComponent(knId)}`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<BknKnowledgeNetworkDetail>

import { get } from '@/utils/http'
import type { KnowledgeNetworkInfo } from './index.d'

export type { KnowledgeNetworkInfo }

/** 获取知识网络列表 */
export const getKnowledgeNetworks = (params: {
  limit?: number
}): Promise<{ entries: KnowledgeNetworkInfo[]; total_count: number }> => {
  const p1 = get(`/api/ontology-manager/v1/knowledge-networks`, {
    headers: { 'x-business-domain': 'bd_public' },
    params: params,
  })
  const p2 = p1.then((result: any) => {
    return {
      entries: Array.isArray(result.entries) ? result.entries : [],
      total_count: result.total_count || 0,
    }
  })
  p2.abort = p1.abort
  return p2
}

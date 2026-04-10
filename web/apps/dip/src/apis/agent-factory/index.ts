import { post } from '@/utils/http'
import type { Agent, GetAgentsByPostRequestBody } from './index.d'

const agentFactoryBaseUrl = '/api/agent-factory/v3'

// 获取已发布的智能体列表 - POST版本
export const getAgentsByPost = (
  body: GetAgentsByPostRequestBody,
): Promise<{ entries: Agent[]; pagination_marker_str: string; is_last_page: boolean }> => {
  return post(`${agentFactoryBaseUrl}/published/agent`, {
    headers: {
      'x-business-domain': 'bd_public',
    },
    body,
  })
}

export interface Category {
  category_id: string
  name: string
}

export interface Agent {
  id: string
  key: string
  is_built_in: number
  is_system_agent: number
  name: string
  category_id: string
  categroy_name: string
  description: string
  version: string
  avatar_type: number
  avatar: string
  product_key: number
  product_name: string
  publisher: string
  publish_time: string
  publish_user_info: {
    user_id: string
    username: string
  }
  update_user_info: {
    user_id: string
    username: string
  }
  updated_at: string
  update_by: string
  status: string
  profile: string
  published_at: number
  updated_by: string
  updated_by_name: string
  published_by: string
  published_by_name: string
  publish_info: {
    // 是否发布到API：0-否；1-是
    is_api_agent: 0 | 1
    // 是否发布为web SDK Agent：0-否；1-是
    is_sdk_agent: 0 | 1
    // 是否发布为技能Agent：0-否；1-是
    is_skill_agent: 0 | 1
  }
}

export interface GetAgentsByPostRequestBody {
  // 根据名称模糊查询
  name?: string

  // agent ID数组
  ids?: string[]

  // agent key数组
  agent_keys?: string[]

  // 需要排除的agent keys
  exclude_agent_keys?: string[]

  // 分类ID
  category_id?: string

  // 发布为标识("api_agent", "web_sdk_agent", "skill_agent", "data_flow_agent")
  publish_to_be?: AgentPublishToBeEnum

  // 自定义空间ID（如果不是自定义空间，传空。如广场）
  custom_space_id?: string

  // 每页返回条数
  size?: number

  // 分页marker（用于获取下一页数据）
  pagination_marker_str?: string

  // 获取发布到自定义空间的智能体
  is_to_custom_space?: 0 | 1

  // 获取发布到广场的智能体
  is_to_square?: 0 | 1

  // 业务域ID数组。如果不传，会使用headers中的x-business-domain。
  business_domain_ids?: string[]
}

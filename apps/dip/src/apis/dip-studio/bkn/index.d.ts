export type BknKnowledgeNetworksSortField = 'update_time' | 'name'

export type BknKnowledgeNetworksDirection = 'asc' | 'desc'

export interface GetBknKnowledgeNetworksParams {
  name_pattern?: string
  sort?: BknKnowledgeNetworksSortField
  direction?: BknKnowledgeNetworksDirection
  offset?: number
  limit?: number
  tag?: string
}

export interface BknKnowledgeNetworkInfo {
  id: string
  name: string
  comment?: string
  update_time?: number
  [key: string]: unknown
}

export interface BknKnowledgeNetworksListResponse {
  entries: BknKnowledgeNetworkInfo[]
  total_count: number
}

export interface GetBknKnowledgeNetworkDetailParams {
  mode?: '' | 'export'
  include_statistics?: boolean
}

export type BknKnowledgeNetworkDetail = Record<string, unknown>

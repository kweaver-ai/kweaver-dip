export interface KnowledgeNetworkInfo {
  id: string
  name: string
  tags: string[]
  comment?: string
  icon?: string
  color?: string
  detail?: string
  branch?: string
  business_domain?: string
  creator: {
    id: string
    type: string
    name: string
  }
  create_time: number
  updater: {
    id: string
    type: string
    name: string
  }
  update_time: number
  module_type: string
  operations: string[]
}

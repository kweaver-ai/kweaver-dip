/** 应用基础信息 */
export interface ApplicationBasicInfo {
  /** 应用 ID */
  id: number
  /** 应用包唯一标识 */
  key: string
  /** 应用名称 */
  name: string
  /** 应用描述 */
  description?: string
  /** 应用图标（Base64编码字符串） */
  icon?: string
  /** 应用所属分组 */
  category?: string
  /** 应用版本号 */
  version?: string
  /** 是否完成配置 */
  is_config: boolean
  /** 更新者用户 ID */
  updated_by: string
  /** 更新时间（ISO 8601 date-time） */
  updated_at: string
  /** 微应用配置 */
  micro_app: {
    /** 微应用名称 */
    name: string
    /** 微应用入口 */
    entry: string
    /** 是否无头模式 */
    headless: boolean
  }
  /** 是否钉住 */
  pinned: boolean
  /** 是否内置 */
  isBuiltIn: boolean
}

/** 应用信息 */
export interface ApplicationInfo extends ApplicationBasicInfo {
  /** 应用安装配置：记录应用安装了哪些 helm release */
  release_config: string[]
  /** 业务知识网络 ID 列表 */
  ontology_ids?: number[]
  /** 智能体 ID 列表 */
  agent_ids?: number[]
}

/** 业务知识网络信息 */
export interface OntologyInfo {
  /** 知识网络 ID */
  id: string
  /** 知识网络名称 */
  name: string
  /** 标签列表 */
  tags: string[]
  /** 备注 */
  comment: string
  /** 图标 */
  icon: string
  /** 颜色 */
  color: string
  /** 详细信息（JSON 字符串） */
  detail: string
  /** 分支 */
  branch: string
  /** 业务域 */
  business_domain: string
  /** 创建者信息 */
  creator: {
    /** 创建者 ID */
    id: string
    /** 创建者类型 */
    type: string
    /** 创建者名称 */
    name: string
  }
  /** 创建时间（时间戳） */
  create_time: number
  /** 更新者信息 */
  updater: {
    /** 更新者 ID */
    id: string
    /** 更新者类型 */
    type: string
    /** 更新者名称 */
    name: string
  }
  /** 更新时间（时间戳） */
  update_time: number
  /** 模块类型 */
  module_type: string
  /** 统计信息 */
  statistics: {
    /** 对象类型总数 */
    object_types_total: number
    /** 关系类型总数 */
    relation_types_total: number
  }
  /** 操作权限列表 */
  operations: string[]
}

/** 智能体输入字段 */
export interface AgentInputField {
  /** 字段名称 */
  name: string
  /** 字段类型 */
  type: string
  /** 字段描述 */
  desc: string
}

/** 智能体临时上传区配置 */
export interface AgentTempZoneConfig {
  /** 名称 */
  name: string
  /** 临时文件使用类型 */
  tmp_file_use_type: string
  /** 最大文件数量 */
  max_file_count: number
  /** 单次聊天最大选择文件数量 */
  single_chat_max_select_file_count: number
  /** 单个文件大小限制 */
  single_file_size_limit: number
  /** 单个文件大小限制单位 */
  single_file_size_limit_unit: string
  /** 支持的数据类型 */
  support_data_type: string[]
  /** 允许的文件类型列表 */
  allowed_file_types: string[]
  /** 允许的文件分类列表 */
  allowed_file_categories: string[]
}

/** 智能体输入配置 */
export interface AgentInputConfig {
  /** 输入字段列表 */
  fields: AgentInputField[]
  /** 重写配置 */
  rewrite: unknown | null
  /** 增强配置 */
  augment: unknown | null
  /** 是否启用临时上传区 */
  is_temp_zone_enabled: number
  /** 临时上传区配置 */
  temp_zone_config: AgentTempZoneConfig
}

/** 智能体数据源配置 */
export interface AgentDataSourceConfig {
  /** 知识图谱 */
  kg: unknown | null
  /** 文档 */
  doc: unknown | null
  /** 指标 */
  metric: unknown | null
  /** 知识网络入口 */
  kn_entry: unknown | null
  /** 知识网络 */
  knowledge_network: unknown | null
  /** 高级配置 */
  advanced_config: unknown | null
}

/** 智能体技能配置 */
export interface AgentSkillsConfig {
  /** 工具列表 */
  tools: unknown[]
  /** 智能体列表 */
  agents: unknown[]
  /** MCPs 配置 */
  mcps: unknown | null
}

/** LLM 配置 */
export interface LLMConfig {
  /** LLM ID */
  id: string
  /** LLM 名称 */
  name: string
  /** 模型类型 */
  model_type: string
  /** 温度 */
  temperature: number
  /** Top P */
  top_p: number
  /** Top K */
  top_k: number
  /** 频率惩罚 */
  frequency_penalty: number
  /** 存在惩罚 */
  presence_penalty: number
  /** 最大 token 数 */
  max_tokens: number
}

/** LLM 配置项 */
export interface LLMConfigItem {
  /** 是否默认 */
  is_default: boolean
  /** LLM 配置 */
  llm_config: LLMConfig
}

/** 智能体输出变量配置 */
export interface AgentOutputVariables {
  /** 答案变量 */
  answer_var: string
  /** 文档检索变量 */
  doc_retrieval_var: string
  /** 图谱检索变量 */
  graph_retrieval_var: string
  /** 相关问题变量 */
  related_questions_var: string
  /** 其他变量 */
  other_vars: unknown | null
  /** 中间输出变量 */
  middle_output_vars: unknown | null
}

/** 智能体输出配置 */
export interface AgentOutputConfig {
  /** 变量配置 */
  variables: AgentOutputVariables
  /** 默认格式 */
  default_format: string
}

/** 智能体内置可编辑字段配置 */
export interface AgentBuiltInCanEditFields {
  /** 名称 */
  name: boolean
  /** 头像 */
  avatar: boolean
  /** 简介 */
  profile: boolean
  /** 输入配置 */
  input_config: boolean
  /** 系统提示词 */
  system_prompt: boolean
  /** 数据源-知识图谱 */
  'data_source.kg': boolean
  /** 数据源-文档 */
  'data_source.doc': boolean
  /** 模型 */
  model: boolean
  /** 技能 */
  skills: boolean
  /** 开场白配置 */
  opening_remark_config: boolean
  /** 预设问题 */
  preset_questions: boolean
  /** 技能-工具-工具输入 */
  'skills.tools.tool_input': boolean
  /** 记忆 */
  memory: boolean
  /** 相关问题 */
  related_question: boolean
}

/** 智能体记忆配置 */
export interface AgentMemoryConfig {
  /** 是否启用 */
  is_enabled: boolean
}

/** 智能体相关问题配置 */
export interface AgentRelatedQuestionConfig {
  /** 是否启用 */
  is_enabled: boolean
}

/** 智能体计划模式配置 */
export interface AgentPlanModeConfig {
  /** 是否启用 */
  is_enabled: boolean
}

/** 智能体元数据 */
export interface AgentMetadata {
  /** 配置模板版本 */
  config_tpl_version: string
  /** 配置最后设置时间戳 */
  config_last_set_timestamp: number
}

/** 智能体配置 */
export interface AgentConfig {
  /** 输入配置 */
  input: AgentInputConfig
  /** 系统提示词 */
  system_prompt: string
  /** Dolphin 配置 */
  dolphin: string
  /** 是否启用 Dolphin 模式 */
  is_dolphin_mode: number
  /** 前置 Dolphin 配置 */
  pre_dolphin: unknown[]
  /** 后置 Dolphin 配置 */
  post_dolphin: unknown[]
  /** 数据源配置 */
  data_source: AgentDataSourceConfig
  /** 技能配置 */
  skills: AgentSkillsConfig
  /** LLM 配置列表 */
  llms: LLMConfigItem[]
  /** 是否启用数据流集合 */
  is_data_flow_set_enabled: number
  /** 开场白配置 */
  opening_remark_config: unknown | null
  /** 预设问题 */
  preset_questions: unknown | null
  /** 输出配置 */
  output: AgentOutputConfig
  /** 内置可编辑字段配置 */
  built_in_can_edit_fields: AgentBuiltInCanEditFields
  /** 记忆配置 */
  memory: AgentMemoryConfig
  /** 相关问题配置 */
  related_question: AgentRelatedQuestionConfig
  /** 计划模式配置 */
  plan_mode: AgentPlanModeConfig
  /** 元数据 */
  metadata: AgentMetadata
}

/** 智能体信息 */
export interface AgentInfo {
  /** 智能体 ID */
  id: string
  /** 智能体唯一标识 */
  key: string
  /** 是否内置 */
  is_built_in: number
  /** 是否系统智能体 */
  is_system_agent: number
  /** 智能体名称 */
  name: string
  /** 智能体简介 */
  profile: string
  /** 头像类型 */
  avatar_type: number
  /** 头像 */
  avatar: string
  /** 产品标识 */
  product_key: string
  /** 产品名称 */
  product_name: string
  /** 智能体配置 */
  config: AgentConfig
  /** 状态 */
  status: string
}

/** 应用配置请求体 */
export interface ApplicationConfigRequest {
  ontology_ids?: number[]
  agent_ids?: number[]
}

/** 获取钉住的微应用列表响应 */
export interface PinnedMicroAppsResponse {
  /** 钉住的微应用 ID 列表 */
  appIds: number[]
}

/** 钉住/取消钉住微应用参数 */
export interface PinMicroAppParams {
  /** 应用 ID */
  appId: number
  /** 是否钉住 */
  pinned: boolean
}

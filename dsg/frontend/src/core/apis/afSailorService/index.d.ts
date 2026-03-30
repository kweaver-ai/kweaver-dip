/**
 * @description 认知搜索-请求参数
 * @param asset_type string	类型
 * @param data_kind	number[]  基础信息分类
 * @param keyword	string	关键字
 * @param next_flag	string[] 分页参数
 * @param published_at	Record<string, number>	上线发布时间
 * @param shared_type	number[] 共享条件
 * @param size	string	分页大小
 * @param stop_entities	string	维度停用词
 * @param stopwords	string	对象停用词
 * @param update_cycle	string	更新频率
 * @param department_id 部门
 * @param subject_domain_id 主题域
 * @param data_owner_id 数据所有者
 * @param info_system_id 信息系统
 * @param available_option 默认0-不返回是否可读；1-返回是否可读资源；2-返回可读资源
 */
export interface ICogSearchQuery {
    asset_type: string
    data_kind: number[]
    keyword: string
    next_flag: string[]
    published_at: {
        start_time: number
        end_time: number
    }
    shared_type: number[]
    size: number
    // stop_entities: string[]
    stop_entity_infos: any[]
    stopwords: string[]
    update_cycle: number[]
    department_id?: string[]
    subject_domain_id?: string[]
    data_owner_id?: string[]
    info_system_id?: string[]
    available_option?: number
}

// 字段信息
export type IFieldItem = {
    field_name_en: string
    field_name_zh: string
    raw_field_name_en: string
    raw_field_name_zh: string
}

/**
 * @description 认知搜索-结果项
 * @param id	string	数据目录ID
 * @param code	string	数据目录编码
 * @param data_kind	number[]  基础信息分类
 * @param data_range  number 数据范围
 * @param data_source_id  string 数据源ID
 * @param data_source_name  string 数据源名称
 * @param description  string 数据目录描述
 * @param download_access  number 下载权限 1 无下载权限 2 审核中 3 有下载权限
 * @param download_expire_time  number 数据下载有效期  毫秒
 * @param fields  IFieldItem[] 字段信息
 * @param group_id  string 资源分类ID
 * @param orgcode  string 组织架构ID
 * @param orgname  string 组织架构名称
 * @param owner_id  string 数据OwnerID
 * @param owner_name  string 数据Owner名称
 * @param published_at  number 上线发布时间
 * @param raw_data_source_name  string 原始数据源名称
 * @param raw_description  string 数据目录描述
 * @param raw_orgname  string 组织架构名称
 * @param raw_owner_name  string 原始数据Owner名称
 * @param raw_schema_name  string 原始schema名称
 * @param raw_system_name  string 信息系统名称
 * @param raw_table_name  string 原始表名
 * @param raw_title  string 数据目录名称
 * @param recommend_detail  any 推荐详情
 * @param schema_id  string schema ID
 * @param schema_name  string schema名称
 * @param shared_type  string 共享条件
 * @param system_id  string 信息系统ID
 * @param system_name  string 信息系统名称
 * @param table_name  string 表名
 * @param table_rows  number 数据量
 * @param title  string 数据目录名称
 * @param type  string 数据资产类型 data_catalog | interface_svc
 * @param update_cycle  number 更新频率
 * @param updated_at  number 数据更新时间
 * @param available_status string 资源是否可用，“1”有权限；“0”无权限
 */
export interface ISearchItem {
    business_objects: { id: string; name: string }[]
    id: string
    code: string
    data_kind: Array<number>
    data_range: number
    data_source_id: string
    data_source_name: string
    description: string
    download_access: number
    download_expire_time: number
    fields: IFieldItem[]
    group_id: string
    orgcode: string
    orgname: string
    owner_id: string
    owner_name: string
    published_at: number
    raw_data_source_name: string
    raw_description: string
    raw_orgname: string
    raw_owner_name: string
    raw_schema_name: string
    raw_system_name: string
    raw_table_name: string
    raw_title: string
    recommend_detail: {
        count: number
        end: string
        starts: string[]
    }
    schema_id: string
    schema_name: string
    shared_type: string
    system_id: string
    system_name: string
    table_name: string
    table_rows: number
    title: string
    type: string
    update_cycle: number
    updated_at: number
    available_status: string
}

/**
 * @description 智能搜索维度
 * @param name  string 名称
 * @param count  number 计数
 * @param children ISearchDim 子项
 */
export type ISearchDim = {
    name: string
    class_name?: string
    count?: number
    children: ISearchDim[]
}

/**
 * @description 智能搜索对象
 * @param name  string 名称
 * @param count  number 计数
 * @param synonyms_flag boolean 是否同义词
 */
export type ISearchObj = {
    name: string
    count: number
    synonyms_flag: boolean
}

/**
 * @description 认知搜索-结果
 * @param entries  ISearchItem[] 搜索结果集合
 * @param filter  any 过滤条件
 * @param next_flag string[] 分页参数
 * @param synonyms string[][] 分词结果
 * @param total_count number 总数
 */
export interface ICogSearchResult {
    entries: ISearchItem[]
    filter: {
        entities: ISearchDim[]
        objects: ISearchObj[]
    }
    next_flag: string[]
    query_cuts: any[]
    total_count: number
}

/**
 * 多轮问答历史 item
 */
export interface IChatHistoryItem {
    // 多轮问答id
    session_id: string
    // 问答名字
    title: string
    // 最近问答时间
    updated_at: number
}

/**
 * 多轮收藏历史 item
 */
export interface IChatFavoriteItem {
    // 收藏id
    favorite_id: string
    // 问答名字
    title: string
    // 最近问答时间
    updated_at: number
}

/**
 * 引用详情
 */
export interface ICiteItem {
    // id
    id: string
    // 名称
    title: string
    // code
    code: string
    // 类型
    type: string
    // 描述
    description: string
    // 指标类型
    indicator_type?: string
    // 图谱
    connected_subgraph?: any
}

/**
 * 指定资源内容
 */
export interface IResourceItem {
    id: string
    // 名称
    name: string
    // 类型
    type: string
    // 指标类型
    indicator_type?: string
}

/**
 * 解析数据，接口和 sql 只会有一种
 */
export interface IExplainItem {
    // 接口数据
    method?: string
    url?: string
    params?: string
    title?: string
    // sql 数据
    sql?: string
    // 数据字段
    explanation?: { [key: string]: any[] }
}

/**
 * 图表数据
 */
export interface IChartItem {
    // 图表配置
    data: {
        config: {
            chart_type: string
            xField?: string
            yField?: string
            angleField?: string
            colorField?: string
            color?: string
            limit?: string
        }
        chart_config?: {
            chart_type: string
            xField?: string
            yField?: string
            angleField?: string
            colorField?: string
            seriesField?: string
            groupField?: string
        }
        // 显示数据
        data: any[]
    }
    // 图的名字
    title: string
}

/**
 * 表格数据
 */
interface ITableItem {
    // 表的名字
    title: string
    // 表格数据
    data: string
}

/**
 * 回答日志详情
 */
interface ILogDetails {
    // agent 的 思考过程，将会说明其下一步操作
    thought?: string
    // 工具名称，用于说明调用了什么工具
    tool_name?: string
    // 工具参数，用于说明工具的入参
    tool_input?: any
    // 工具的返回结果
    result?: {
        // 解析 sql
        sql?: string
        // 解析数据字段
        explanation?: any
        // 表格数据
        res?: string
        // 引用来源
        cites?: ICiteItem[]
        // 图表数据
        data?: any[]
        // 图表配置
        config?: any
        // 表格/图表名字
        title?: string

        [key: string]: any
    }
    time?: number
    tokens?: number
}

/**
 * 多轮问答中 qa 问答详情
 */
export interface IQaDetails {
    // 单轮问答id
    qa_id?: string
    // 答案
    answer?: {
        // 引用来源
        cites?: ICiteItem[]
        // 总结文本
        text?: string[]
        // 表格
        table?: ITableItem[]
        // 解析
        explain?: IExplainItem[]
        // 图表数据
        chart?: IChartItem[]
        // 图谱
        graph?: any
    }
    // 问句
    query?: string
    // like,dislike,neutrality
    like?: string
    // 问答时间
    qa_time?: number
    // 指定的资源
    resource?: IResourceItem[]
    // 回答日志
    logs?: ILogDetails[]

    [key: string]: any
}

/**
 * 多轮问答详情
 */
export interface IChatDetails {
    res?: IQaDetails[]
    // 多轮对话id
    session_id?: string
    // 收藏id
    favorite_id?: string

    [key: string]: any
}

/**
 * 助手发布信息
 */
export interface IAgentPublishInfo {
    /**
     * 是否为API Agent
     * - 0: 否
     * - 1: 是
     */
    is_api_agent: 0 | 1
    /**
     * 是否为web SDK Agent
     * - 0: 否
     * - 1: 是
     */
    is_sdk_agent: 0 | 1
    /**
     * 是否为技能Agent
     * - 0: 否
     * - 1: 是
     */
    is_skill_agent: 0 | 1
    /**
     * 是否为数据流Agent
     * - 0: 否
     * - 1: 是
     */
    is_data_flow_agent: 0 | 1
}

/**
 * 已发布助手项
 */
export interface IAgentItem {
    /** agent id */
    id: string
    /** agent 标识 */
    key: string
    /**
     * 是否是内置智能体
     * - 0: 否
     * - 1: 是
     */
    is_built_in: 0 | 1
    /**
     * 是否是系统智能体
     * - 0: 否
     * - 1: 是
     */
    is_system_agent: 0 | 1
    /** 名字 */
    name: string
    /** agent 简介 */
    profile: string
    /** agent 版本 */
    version: string
    /**
     * 头像类型
     * - 1: 内置头像
     * - 2: 用户上传头像
     * - 3: AI生成头像
     */
    avatar_type: 1 | 2 | 3
    /**
     * 头像信息
     * - 当头像类型为1时，为内置头像标识(如1-10等)
     * - 当头像类型为2时，为头像存储信息
     * - 当头像类型为3时，为头像存储信息
     */
    avatar: string
    /** 发布时间 (时间戳，单位: ms) */
    published_at: number
    /** 发布者uid */
    published_by: string
    /** 发布者名称 */
    published_by_name: string
    /** 发布信息 */
    publish_info: IAgentPublishInfo
    /** 业务域ID */
    business_domain_id?: string
    /**
     * 上架状态
     * - put-on: 上架
     * - pull-off: 下架
     */
    list_status: 'put-on' | 'pull-off'
    /** af agent id */
    af_agent_id: string
}

/**
 * 已发布助手列表响应
 */
export interface IAgentList {
    /** 已发布智能体列表 */
    entries: IAgentItem[]
    /**
     * 分页marker（用于获取下一页数据）
     * - base64编码的json字符串
     * - json格式: { "published_at": 1718774400123, "last_release_id": "xxx" }
     */
    pagination_marker_str: string
    /**
     * 是否是最后一页
     * - 当查询不到数据时，也是最后一页
     */
    is_last_page: boolean
}

/**
 * 发布标识枚举
 */
export type IPublishToBe =
    | 'api_agent'
    | 'web_sdk_agent'
    | 'skill_agent'
    | 'data_flow_agent'

/**
 * 获取助手列表入参
 */
export interface IGetAssistantListParams {
    /** 根据名称模糊查询 */
    name?: string
    /** agent ID数组 (最多1000项) */
    ids?: string[]
    /** agent key数组 (最多1000项) */
    agent_keys?: string[]
    /** 需要排除的agent keys (最多1000项) */
    exclude_agent_keys?: string[]
    /** 分类ID */
    category_id?: string
    /** 发布为标识 */
    publish_to_be?: IPublishToBe
    /** 自定义空间ID（如果不是自定义空间，传空，如广场） */
    custom_space_id?: string
    /** 每页返回条数，默认10 */
    size?: number
    /**
     * 分页marker（用于获取下一页数据）
     * - base64编码的json字符串
     * - json格式: { "published_at": 1718774400123, "last_release_id": "xxx" }
     */
    pagination_marker_str?: string
    /**
     * 获取发布到自定义空间的智能体
     * - 0或不传: 此字段不生效
     * - 1: 获取发布到自定义空间的智能体 (f_is_to_custom_space=1)
     */
    is_to_custom_space?: 0 | 1
    /**
     * 获取发布到广场的智能体
     * - 0或不传: 此字段不生效
     * - 1: 获取发布到广场的智能体 (f_is_to_square=1)
     */
    is_to_square?: 0 | 1
    /**
     * 业务域ID数组 (最多2项)
     * - 如果不传，会使用header中的"x-business-domain"
     * - 如果该header也没有传，会默认使用"公共业务域"进行过滤
     */
    business_domain_ids?: string[]
    /**
     * 是否上架（必须）
     * - 0: 全部
     * - 1: 上架
     */
    list_flag: 0 | 1
    /** 助手分类ID数组 */
    category_ids?: string[]
}

/**
 * 上架智能体入参
 */
export interface IPutOnAssistantParams {
    /** 智能体列表 */
    agent_list: Array<{
        /** agent key */
        agent_key: string
    }>
}

/**
 * 上架智能体返回结果
 */
export interface IPutOnAssistantResult {
    /** 返回结果 */
    res: {
        /** 状态 */
        status: string
    }
}

/**
 * 下架智能体入参
 */
export interface IPullOffAssistantParams {
    /** af agent id */
    af_agent_id: string
}

/**
 * 下架智能体返回结果
 */
export interface IPullOffAssistantResult {
    /** 返回结果 */
    res: {
        /** 状态 */
        status: string
    }
}

/**
 * Agent App 会话列表项
 */
export interface IAgentAppConversationItem {
    id: string
    title: string
    message_index: number
    read_message_index: number
    create_time: number
    update_time: number
}

/**
 * Agent App 会话列表响应
 */
export interface IAgentAppConversationList {
    total_count: number
    entries: IAgentAppConversationItem[]
}

/**
 * 助手分类项
 */
export interface IWsCategoryItem {
    config_desc: string
    config_group: string
    config_group_type: number
    config_id: string
    config_key: string
    config_value: string
}

/**
 * 助手分类列表数据
 * @description key 是不固定的中文 value 是该分类下的配置项数组
 */
export type IWsCategoryListData = Record<string, IWsCategoryItem[]>

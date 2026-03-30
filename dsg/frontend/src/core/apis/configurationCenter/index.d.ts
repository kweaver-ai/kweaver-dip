import {
    DataSourceFromType,
    IGetListParams,
    SortDirection,
    SortType,
} from '../common'

/**
 * 查重参数
 */
export interface roleDuplicatedParam {
    // 角色id
    id?: string

    // 角色名称
    name: string
}

/**
 * 获取角色列表参数
 */
export interface rolesParams {
    // 角色排序，正序或者逆序
    direction?: 'asc' | 'desc'

    // 每页大小
    limit?: number

    // 搜索关键字
    keyword?: string
    // 页码
    offset?: number

    // 排序类型 创建时间|更新时间
    sort?: 'created_at'
}

/**
 * 角色信息
 */
export type roleInfo = {
    // 颜色
    color: string
    // 创建时间
    created_at: number
    // 图标名称
    icon: string
    // 角色id
    id: string
    // 角色名称
    name: string
    // 是否是系统角色 0代表不是系统角色， 1代表是
    system: 0 | 1
    // 更新时间
    updated_at: number
}

/**
 * 角色列表
 */
export interface roleList {
    // 角色列表
    entries: Array<roleInfo>
    // 总数
    total_count: number
}

/**
 * 创建角色参数
 */
export interface roleCreateParams {
    // 颜色
    color: string
    // 图标名称
    icon: string
    // 角色名称
    name: string
}

/**
 * 创建完成的返回
 */
export interface roleCreateReturn {
    // 角色id
    id: string
    // 角色名称
    name: string
}

/**
 * 角色图标信息
 */
export type roleIconInfo = {
    // 图标数据
    icon: string
    // 图标名称
    name: string
    // 是否是系统角色图标
    system: number
}

/**
 * 更新角色的参数
 */
export type updateRoleParams = {
    // 颜色
    color?: string
    // 图标名称
    icon?: string
    // 角色名称
    name?: string
}

/**
 * 用户信息
 */
export type userInfo = {
    // 用户id
    id: string
    // 用户中文名
    name: string
}

/**
 * 用户返回
 */
export type userInfoReturn = {
    // 用户id
    id: string
    // 用户名称
    name: string
}

/**
 * 角色详细信息
 */
export interface usersOfRole {
    // 用户
    entries: Array<userInfo>
    // 总数
    total_count: number
}

export interface getRonInfoDetail {
    // 颜色
    color?: string
    // 创建时间
    created_at?: number
    // 图标名称
    icon?: string
    // 角色id
    id?: string
    // 角色名称
    name?: string
    // 是否是系统角色 0代表不是系统角色， 1代表是
    system?: 0 | 1
    // 更新时间
    updated_at?: number
    // 是否被删除 normal 未被删除,discard 被删除。
    status: 'normal' | 'discard'
}

/**
 * 数据源信息
 */
export interface dataBaseInfo {
    id: string
    name: string
    schema: string
    type: string
}

export interface dataSource {
    host: string
    info_system_id: string
    name: string
    id: string
    password: string
    port: number
    schema: string
    type: string
    username: string
    info_system_name: string
    database_name: string
    // 数据源来源类型-analytical,records
    source_type: string
    // 修改人
    updated_by_uid: string
    // 修改时间
    updated_at?: string
    department_id?: string
}
export interface repeatDataSource {
    id?: string
    info_system_id?: string
    name: string
    // 数据源来源类型-analytical,records
    source_type: string
}

/**
 * 更改连接状态参数
 */
export interface IChangeConnectStatusParams {
    // 连接状态 1已连接 2未连接
    connect_status: 1 | 2
    // 数据源标识
    id: string
}
export interface dataBaseParams {
    // 角色排序，正序或者逆序
    direction?: string

    // 系统id
    info_system_id?: string
    // 每页大小
    limit?: number

    // 搜索关键字
    keyword?: string
    // 页码
    offset?: number

    // 排序类型 创建时间|更新时间
    type?: string
    sort?: string
    source_type?: DataSourceFromType | string

    org_code?: string

    connect_status?: number
}

export interface IInfoSystemParams {
    direction?: 'asc' | 'desc'
    keyword?: string
    limit?: number
    offset?: number
    sort?: number
    department_id?: string
    is_register_gateway?: boolean
    js_department_id?: string
}

/**
 * 信息系统对象
 * @params created_at	number 信息系统创建时间
 * @params created_user	string  信息系统创建用户名称
 * @params description	string  信息系统描述
 * @params id	string  信息系统id
 * @params name	string  信息系统名称
 * @params updated_at	number 信息系统更新时间
 * @params updated_user	string  信息系统更新用户名称
 */
export interface ISystemItem {
    acceptance_at?: number
    created_at?: number
    created_user?: string
    description: string
    id?: string
    name: string
    department_id?: string
    department_name?: string
    department_path?: string
    updated_at?: number
    updated_user?: string
    register_at?: number
    system_identifier?: string
    responsiblers?: {
        id: string
        name: string
    }[]
    js_department_id?: string
    status?: number
}

export interface IUserAuth {
    normal: {
        business_domain?: number
        business_flowchart?: number
        business_form?: number
        business_indicator?: number
        business_knowledge_network?: number
        business_model?: number
        business_report?: number
        business_standard?: number
        data_acquisition?: number
        data_connection?: number
        data_processing?: number
        data_quality?: number
        data_security?: number
        data_understand?: number
        enterprise_architecture?: number
        metadata?: number
        pipeline?: number
        pipeline_kanban?: number
        project?: number
        role?: number
        task?: number
        task_kanban?: number
        glossary?: number
        data_standard?: number
        data_resource_catalog?: number
        catalog_category?: number
        data_feature?: number
        data_feature_analyze?: number
        service_management?: number
        data_asset_overview?: number
        data_resource_catalog_data_catalog?: number
        data_resource_catalog_data_feature?: number
        data_resource_catalog_apply_list?: number
    }
    task: {
        business_flowchart: number
        business_form: number
        business_indicator: number
        business_model: number
    }
}

export interface IObjects<T> {
    entries: Array<T>
    total_count: number
}

export interface IAssemblyLineGetRolesModel {
    entries: IAssemblyLineRoleItem[]
    total_count: number
}

/**
 * @description 角色Item
 * @param id string 角色ID
 * @param name string 角色名称
 * @param color string 颜色
 */
export interface IAssemblyLineRoleItem {
    id: string
    name: string
    color: string
}

export interface IAssemblyLineModel {
    entries: IAssemblyLineItem[]
    total_count: number
    released_total_count: number
    unreleased_total_count: number
}

/**
 * @description 预创建/编辑工作流程Params
 * @param name string 工作流程名称
 * @param description string? 工作流程描述
 */
export interface IAssemblyLineEditParams {
    name: string
    description?: string
    desc?: string
    id?: string
}
/**
 * @description 工作流程Item
 * @param id string 工作流程ID
 * @param name string 工作流程ID
 * @param description string? 工作流程描述
 * @param status string 工作流程状态，枚举：creating：未发布的状态；released：已发布状态不存在变更；editing: 已发布存在变更
 * @param image string? 工作流程图片base64编码
 * @param created_by string 创建人
 * @param created_at number 创建时间
 * @param updated_by string 更新人
 * @param updated_at number 更新时间
 * @param version_id string? 工作流程版本ID，任务中心使用。如果status是未发布，返回的是未发布的版本ID；如果status是已发布状态不存在变更，返回的是已发布的版本ID；如果status是已发布存在变更，返回的是在编辑状态下的版本ID
 */
export interface IAssemblyLineItem {
    id: string
    name: string
    config_status: 'missingRole' | 'normal'
    description?: string
    status: string
    image?: string
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
    version_id?: string
}

/**
 * @description 查看工作流程列表Params
 * @param offset number? 当前页数，默认1（>=1），小于1报错
 * @param limit number? 每页数量，默认12
 * @param direction string? 排序方向：默认desc降序，可选asc升序
 * @param keyword string? 关键字模糊查询
 * @param sort string? 排序类型：默认created_at，可选updated_at
 * @param release_state: string 发布状态过滤，枚举：unreleased：未发布；released：已发布
 * @param change_state: string? 变更状态，当release_state为released时有效，枚举。unchanged：已发布未变更；changed：已发布有变更
 */
export interface IAssemblyLineQueryParams {
    offset?: number
    limit?: number
    direction?: string
    keyword?: string
    sort?: string
    release_state: string
    change_state?: string
}

/**
 * @description 获取工作流程内容Model
 * @param id string 工作流程ID
 * @param content string 工作流程的内容，json形式
 */
export interface IAssemblyLineGetContentModel {
    id: string
    content: string
}

/**
 * @description 保存工作流程内容Model
 * @param content string 工作流程的内容，json形式
 * @param image string? 图片数据，base64编码
 * @param type string 保存类型，枚举：final：最终保存；temp：临时保存
 */
export interface IAssemblyLineSaveContentModel {
    content: string
    image?: string
    type: string
}
/**
 * @description 数据目录信息项
 * @param @param code	string 数据目录编码
 * @param data_kind	Array<number> 基础信息分类
 * @param data_range	number 数据范围
 * @param description	string 数据目录描述，可能存在高亮标签
 * @param group_id	string 资源分类ID
 * @param id	string 数据目录ID
 * @param orgcode	string 组织架构ID
 * @param orgname	string 组织架构名称
 * @param published_at	number 上线发布时间
 * @param raw_description	string 数据目录描述，不会存在高亮标签
 * @param raw_title	string 数据目录名称，不会存在高亮标签
 * @param shared_type	number 共享条件
 * @param table_rows	number 数据量
 * @param title	string 数据目录名称，可能存在高亮标签
 * @param update_cycle	number 更新频率
 * @param updated_at	number 数据更新时间
 * @param is_favored	boolean 是否收藏
 * @param favor_id	string 收藏id
 */
export interface IDataRescItem {
    code: string
    data_kind: number
    data_range: number
    description: string
    group_id: string
    id: string
    orgcode: string
    orgname: string
    published_at: number
    raw_description: string
    raw_title: string
    shared_type: number
    table_rows: number
    title: string
    update_cycle: number
    updated_at: number
    is_favored: boolean
    favor_id: string
}

// 1 无下载权限 2 审核中 3 有下载权限
export enum DownloadAccess {
    NO = 1,
    Auditing = 2,
    Yes = 3,
}
export interface IDownloadAccessOfBusinessObject {
    id: string
    result: DownloadAccess
}
/**
 * @description 业务对象质量数据model
 * @param field_num number 字段数量
 * @param check_num number 质量检测字段数量
 * @param rule_info object 质量检测规则信息
 * @param table_rule_num number 表级规则数量
 * @param field_rule_num number 字段级规则数量
 * @param score_info object score_info 质量评分信息
 * @param score number 质量评分（总评分）
 * @param dimensions_score array 维度评分信息
 * @param dimension_name string 评分维度名称
 * @param score number 分数
 * @param field_score array 字段评分信息
 * @param id string 字段ID
 * @param name_cn string 字段中文名称
 * @param name_en string 字段英文名称
 * @param rule_desc string 规则描述
 * @param score number 分数
 * @param weight number 字段权重
 * @param null_rows number 空值行数
 * @param total_rows number 总行数
 * @param null_rate number 空值率
 * @param alarm_status boolean 告警状态
 */
export interface IDataQualityModel {
    field_num: number
    check_num: number
    rule_info: {
        table_rule_num: number
        field_rule_num: number
    }
    score_info: {
        score: number
        dimensions_score: {
            dimension_name: string
            score: number
        }[]
        field_score: {
            id: string
            name_cn: string
            name_en: string
            rule_desc: string
            score: number
            weight: number
            null_rows: number
            total_rows: number
            null_rate: number
            alarm_status: boolean
        }[]
    }
}

/**
 * @description 业务对象类目节点查询参数
 * @param category_type	required	number	业务对象类目类型 1:业务 2:组织 3:技术
 * @param keyword	string	检索关键字(模糊匹配类目名称)

 */
export interface IBusinNodeParams {
    category_type: number
    keyword?: string
}

export interface IFlowchart {
    created_at: number
    created_by: string
    id: string
    name: string
    status: string
    updated_at: number
    updated_by: string
    version_id: string
    config_status: 'normal' | 'missingRole'
}

export interface IGetFlowchart {
    entries: IFlowchart[]
    released_total_count: number
    total_count: number
    unreleased_total_count: number
}

/**
 * @description 配置中心编码生成规则项
 * @param id string ID
 * @param created_at string 创建时间
 * @param updated_at string 更新时间
 * @param name string 名称
 * @param type string 类型
 * @param prefix string 前缀
 * @param prefix_enabled boolean 是否启用前缀
 * @param rule_code string 规则码
 * @param rule_code_enabled boolean 是否启用规则码
 * @param code_separator string 编码分隔符
 * @param code_separator_enabled boolean 是否启用编码分隔符
 * @param digital_code_type string 数字码类型
 * @param digital_code_width number 数字码位数
 * @param digital_code_starting number 数字码起始值
 * @param digital_code_ending number 数字码结束值
 * @param last_rule_code string 上一次生成的规则码
 * @param last_digital_code number 上一次生成的数字码
 * @param updater_id string 更新人ID
 * @param updater_name string 更新人名称
 */
export interface ICCRuleItem {
    id: string
    created_at: string
    updated_at: string
    name: string
    type: string
    prefix: string
    prefix_enabled: boolean
    rule_code: string
    rule_code_enabled: boolean
    code_separator: string
    code_separator_enabled: boolean
    digital_code_type: string
    digital_code_width: number
    digital_code_starting: number
    digital_code_ending: number
    last_rule_code: string
    last_digital_code: number
    updater_id: string
    updater_name: string
}

/**
 * 数据分级标签状态
 * @param Open 开启
 * @param Close 关闭
 */

export enum GradeLabelStatusEnum {
    Open = 'open',
    Close = 'close',
}

/**
 * 数据分级标签类型
 * @param Node 标签
 * @param Group 分组
 */

export enum DataGradeLabelType {
    Node = 1,
    Group = 2,
}
export interface ICreateDataGradeLabel {
    name: string
    id?: string
    description?: string
    nodeType: DataGradeLabelType
    parentId: string
    icon: string
}

export interface IGradeLabel {
    name: string
    id: string
    description: string
    node_type: DataGradeLabelType
    parent_id: string
    icon: string
    children: IGradeLabel[]
    path?: string[]
    data_protection_query?: boolean
    share_condition?: string
    secret_attri?: string
    sensitive_attri?: string
}

export interface IUserRoleInfo {
    color: string
    created_at: string
    deleted_at: number
    icon: string
    id: string
    name: string
    system: number
    updated_at: string
}

/**
 * 审核流程请求参数
 */
export interface IAuditProcessQuery {
    /** 审核类型 */
    audit_type: string
    /** 所属业务模块 */
    service_type: string
    /** 排序方向 */
    direction: string
    /** 每页大小 */
    limit: number
    /** 页码 */
    ofsset: number
    /** 排序类型 */
    sort: string
}

/**
 * 审核流程请求
 */
export interface IAuditProcessParam {
    /** 审核类型 */
    audit_type: string
    /** 所属业务模块 */
    service_type: string
    /** 审核流程Key */
    proc_def_key: string
    /** id */
    id: string
}

export interface IAppInfoParams {
    /**
     * 账户的名称
     */
    account_name?: string

    /**
     * 账户所拥有的权限范围，以字符串数组形式表示
     */
    authority_scope?: Array<string>

    /**
     * 应用的描述信息
     */
    description?: string

    /**
     * 应用的名称
     */
    name?: string

    /**
     * 密码
     */
    password?: string

    /**
     * 标记 cssjj
     */
    mark?: string
}

export interface AppInfo {
    /**
     * 账户的唯一ID
     */
    account_id: string
    /**
     * 账户的名称
     */
    account_name: string

    /**
     * 账户所拥有的权限范围，以字符串数组形式表示
     */
    authority_scope: Array<string>

    /**
     * 应用创建的时间戳
     */
    created_at?: number

    /**
     * 应用的创建者的名称
     */
    creator_name?: string

    /**
     * 应用的描述信息
     */
    description: string

    /**
     * 应用的唯一ID
     */
    id: string

    /**
     * 应用的名称
     */
    name: string

    /**
     * 应用最后更新的时间戳
     */
    updated_at?: number

    /**
     * 应用最后更新者的名称
     */
    updater_name?: string

    has_resource: boolean

    // 可选参数：访问密钥，用于身份验证
    access_key?: string

    // 可选参数：访问密钥的秘钥，用于签名和验证请求
    access_secret?: string

    // 可选参数：应用的唯一标识符，用于区分不同应用
    app_id?: string

    // 必填参数：信息系统的名称，用于标识系统身份
    info_system_name?: string

    application_developer_name?: string

    // 审核状态
    status: string
    // 是否可删除
    can_delete: string
    pass_id: string
    ip_addr: { ip: string; port: string }[]
    responsiblers: { id: string; name: string }[]
    token: string
}

/**
 * 扩展AppInfo接口，提供更详细的应用信息
 * 包含系统信息、应用开发者信息以及可选的省份应用信息
 */
export interface AppInfoDetail extends AppInfo {
    /**
     * 系统信息，包括系统ID和名称
     */
    info_systems: {
        id: string
        name: string
    }

    /**
     * 应用开发者信息，包括开发者ID和名称
     */
    application_developer: {
        id: string
        name: string
    }

    /**
     * 省份应用信息，可选
     * 如果应用与特定省份相关，则提供详细信息
     */
    province_app_info?: ProvinceAppInfo
}
/**
 * 省级应用信息接口
 * 该接口定义了省级应用的相关信息，包括访问密钥、应用ID、区域信息、联系人信息、部署地点、组织代码、组织信息、省级服务器IP、省级访问URL和范围信息。
 */
interface ProvinceAppInfo {
    // 访问密钥，用于身份验证
    access_key: string
    // 访问密钥秘密，用于身份验证
    access_secret: string
    // 应用ID，唯一标识应用
    app_id: string
    // 区域信息，包含区域ID和名称
    area_info: {
        id: number
        name: string
        value: string
    }
    // 联系人姓名，用于紧急联系
    contact_name: string
    // 联系人电话，用于紧急联系
    contact_phone: string
    // 部署地点，应用部署的物理或虚拟位置
    deploy_place: string
    // 组织代码，应用所属组织的唯一标识
    org_info: {
        department_id: string
        org_name: string
        org_code: string
        department_path: string
        department_name: string
    }
    // 省级服务器IP地址，用于网络通信
    province_ip: string
    // 省级访问URL，访问省级应用的统一资源定位符
    province_url: string
    // 范围信息，包含范围ID和名称
    range_info: {
        id: number
        name: string
        value: string
    }
}

export interface AppsListParams extends IGetListParams {
    only_developer?: boolean
}

// 数据字典类型
export enum DataDictType {
    // 所属领域
    // 应用领域
    Area = 'area',
    // 应用场景
    Scene = 'scene',
    // 应用场景类型
    SceneType = 'scene-type',
    // 高效办成"一件事
    OneThing = 'one-thing',
    // 应用范围
    Range = 'range',
    // 市敏感级别
    SensitiveLevel = 'sensitive-level',
    // 数据目录共享类型
    CatalogShareType = 'catalog-share-type',
    // 数据目录开放类型
    CatalogOpenType = 'catalog-open-type',
    // 数据资源共享类型
    ResourceShareType = 'resource-share-type',
    // 数据资源开放类型
    ResourceOpenType = 'resource-open-type',
    // 数据资源类型
    ResourceType = 'resource-type',
    // 字段类型
    ColumnType = 'column-type',
    // 服务类型
    ServiceType = 'service-type',
    // 使用范围
    UseScope = 'use-scope',
    // 更新周期
    UpdateCycle = 'update-cycle',
    // 是否发布
    IsPublish = 'is-publish',
    // 共享类型
    ShareType = 'share-type',
    // 省数据区域范围
    DataRegion = 'data-region',
    // 数据所属层级
    LevelType = 'level-type',
    // 开放类型
    OpenType = 'open-type',
    // 是否电子证照编码
    CertificationType = 'certification-type',
    // 提供渠道
    NetType = 'net-type',
    // 数据加工程度
    DataProcessing = 'data-processing',
    // 是否回流地市（州）
    DataBackflow = 'data-backflow',
    // 数据所属领域
    FieldType = 'field-type',
    // 统一社会信用代码
    OrgCode = 'org-code',
    // 行政区划代码
    DivisionCode = 'division-code',
    // 中央业务指导（实施）部门代码
    CenterDeptCode = 'center-dept-code',
    // 省数据分级
    DataSensitiveClass = 'data-sensitive-class',
    // 目录标签
    CatalogTag = 'catalog-tag',
    // 系统所属分类
    SystemClass = 'system-class',
    // 异议类型
    ObjectionType = 'objection-type',
    // 评分
    Score = 'score',
    // 调度方式
    ScheduleType = 'schedule-type',
    // 拒绝类型
    RejectType = 'reject-type',
    // 需求共享类型
    DemandShareType = 'demand-share-type',
    // 期望更新周期
    ProvinceUpdateCycle = 'province-update-cycle',
    // 市数据区域
    CityDataRegion = 'city-data-region',
    // 市数据分级
    CityDataSensitiveClass = 'city-data-sensitive-class',
    // 目录反馈类型
    CatalogFeedbackType = 'catalog-feedback-type',
}

// 数据字典查询类型
export enum DataDictQueryType {
    // 全部
    All = '',
    // 省市直达
    SSZD = '1',
    // 产品字典
    Product = '0',
}

// 获取数据字典列表分页数据
export interface IGetDataDictPageParams {
    // 页码
    offset?: number
    // 条数
    limit?: number
    // 排序方向
    direction?: SortDirection
    // 排序类型
    sort?: SortType
    // 查询属性类型，空：全部，1省市直达，0产品字典
    query_type?: DataDictQueryType
    // 字典名称
    name?: string
}

// 获取字典项列表分页数据
export interface IGetDataDictItemsParams {
    // 页码
    offset?: number
    // 条数
    limit?: number
    // 字典名称
    name?: string
    // 字典ID
    dict_id?: string
}

// 数据字典基本信息
export interface IDataDictBasicInfo {
    // 字典ID
    id?: string
    // 字典名称
    name: string
    // 字典类型
    dict_type: string
    // 字典描述
    description?: string
    // 版本
    version?: string
    // 创建时间
    created_at?: number
    // 创建人
    creator_name?: string
    // 更新时间
    updated_at?: number
    // 更新人
    updater_name?: string
    // 是否省市直达
    sszd_flag?: number
}

// 数据字典项
export interface IDataDictItem {
    // 字典项ID
    id?: string
    // 字典键
    dict_key: string
    // 字典项
    dict_value: string
    // 字典描述
    description?: string
    // 排序
    sort?: number
}

export interface IDataDictDetail {
    dict_resp: IDataDictBasicInfo
    dict_item_resp: IDataDictItem[]
}

export interface IDataDicts {
    // 字典属性类型
    dict_type: string
    // 字典项
    dict_item_resp: IDataDictItem[]
}

export interface IApplyFrontMachineParams {
    department: {
        id: string
        address: string
        path: string
    }
    contact: {
        phone?: string
        name: string
        mail?: string
        mobile?: string
    }
    comment?: string
    is_draft?: boolean
}

export interface IFrontMachineParams {
    phases?: string
    department_ids?: string
    limit?: number
    offset?: number
    direction?: SortDirection
    sort?: string
    order_id?: string
    node_ip?: string
    request_timestamp_start?: number
    request_timestamp_end?: number
}

// 前置机审核状态
export enum FrontMachineAuditStatus {
    // 未审核
    Pending = 'pending',
    // 审核中
    Auditing = 'auditing',
    // 审核拒绝
    Rejected = 'reject',
    // 审核通过
    Passed = 'pass',
    // 已撤销
    Undone = 'undone',
}

// 前置机在生命周期中所处的阶段
export enum FrontMachineStatus {
    // 全部
    All = 'All',
    // 未申报
    Pending = 'Pending',
    // 审核中
    Auditing = 'Auditing',
    // 待分配
    Allocating = 'Allocating',
    // 待签收
    Allocated = 'Allocated',
    // 已完成
    InCompleted = 'InCompleted',
    // 签收驳回
    Rejected = 'Rejected',
}

// 前置机状态
export enum MachineStatus {
    // 未签收
    Receipt = 'Receipt',
    // 已使用
    InUse = 'InUse',
    // 已回收
    Reclaimed = 'Reclaimed',
}

// 前置机申请类型
export enum ApplyType {
    // 前置机
    Machine = '1',
    // 前置库
    Library = '2',
}

// 部署区域类型
export enum DeploymentAreaType {
    // 外部数据中心区域
    External = 'outter_area',
    // 内部数据中心区域
    Internal = 'inner_area',
    // 业务数据库区域
    Business = 'database_area',
}

// 业务系统保护级别
export enum ProtectionLevelType {
    // 一级
    Level1 = 'level-1',
    // 二级
    Level2 = 'level-2',
    // 三级
    Level3 = 'level-3',
}

// 计算资源规格
export enum ResourceSpecType {
    // 2核 8GB
    Small = '2c8g',
    // 4核 16GB
    Medium = '4c16g',
    // 16核 32GB
    Large = '16c32g',
}

export interface IFrontMachineItem {
    creator_name: string
    creation_timestamp: string
    creator_id: string
    id: string
    order_id: string
    receipt_timestamp: string
    reclaim_timestamp: string
    request_timestamp: string
    update_timestamp: string
    recipient_id: string
    recipient_name: string
    request: IApplyFrontMachineParams
    node?: IAllocateFrontMachineParams
    apply_type?: ApplyType
    status: {
        audit: {
            result: string
            message: string
            audit_status?: FrontMachineAuditStatus
            biz_id?: string
            id?: string
            task_id?: string
        }
        phase: string
    }
    info: any
}

export interface IFrontMachineRes {
    entries: IFrontMachineItem[]
    total_count: number
}

export interface ILibraryItem {
    id?: string
    front_end_id?: string
    library_type?: string
    library_version?: string
    username?: string
    password?: string
    business_name?: string
    update_time?: string
    front_end_item_id?: string
}

export interface IAllocateFrontMachineParams {
    id?: string
    front_end_id?: string
    ip?: string
    port?: string
    name?: string
    administrator_name?: string
    administrator_phone?: string
    library_list?: ILibraryItem[]
}

export interface IFrontMachineOverview {
    departments_top_15: { name: string; count: number }[]
    last_year_in_use: number[]
    last_year_reclaimed: number[]
    allocated_count: number
    in_use_count: number
    reclaimed_count: number
    total_count: number
}
/**
 * 应用申请审核列表
 */
export interface AppApplyAuditParams extends IGetListParams {
    target: 'tasks' | 'historys' // 目标类型 tasks: 待审核 historys: 已审核
}

/**
 * 应用申请审核列表项
 */
export interface AppApplyAuditItem {
    // 审核时间
    audit_time: string
    // 申请时间
    apply_time: string
    // 申请人
    applyer: string
    // 审核状态
    id: string
    // 审核状态
    audit_status: string
    // 审核流程实例ID
    proc_inst_id: string
    // 名称
    name: string
    // 上报类型
    report_type: string
    // 任务ID
    task_id: string
}

/**
 * 应用上报列表
 */
export interface AppReportListParams extends IGetListParams {
    report_type: 'to_report' | 'reported' // 上报类型, to_report待上报, reported已经上报
    is_update: string // 更新状态, updated已更新, created已创建
}

/**
 * 应用上报状态
 */
export enum AppReportStatus {
    // 正常
    NORMAL = 'normal',
    // 审核中
    AUDITING = 'auditing',
    // 审核拒绝
    AUDIT_REJECTED = 'audit_rejected',
    // 上报失败
    REPORT_FAILED = 'report_failed',
}

// 厂商名录
// 创建厂商请求参数
export interface CreateFirmReq {
    // 厂商名称
    name: string
    // 统一社会信用代码
    uniform_code: string
    // 法定代表名称
    legal_represent: string
    // 联系电话
    contact_phone: string
}

// 获取厂商列表请求参数
export interface IGetFirmListParams {
    // 页码
    offset?: number
    // 条数
    limit?: number
    // 关键字
    keyword?: string
    // 排序方向
    direction?: SortDirection
    // 排序类型
    sort: SortType
    // 厂商ID
    ids?: string[]
}

// 厂商
export interface IFirm extends CreateFirmReq {
    // 厂商ID
    id: string
}

// 获取厂商列表响应
export interface IGetFirmListRes {
    // 厂商列表
    entries: IFirm[]
    // 总数
    total_count: number
}

// 厂商名录唯一性校验类型
export enum FirmCheckType {
    // 厂商名称
    Name = 'name',
    // 统一社会信用代码
    UniformCode = 'uniform_code',
}

/**
 * 登录平台
 * @param default 标品
 * @param drmb 数据资源管理平台-后台
 * @param drmp 数据资源管理平台-门户
 * @param ca 认知应用平台
 * @param cd 认知分析平台
 */
export enum LoginPlatform {
    default = 1,
    drmb = 2,
    drmp = 4,
    ca = 8,
    cd = 16,
}

// 通讯录管理 ------- start

export interface IAddressBookListParams extends IGetListParams {
    department_id?: string
}

export interface IAddressBookItem {
    id: string
    name: string
    contact_phone: string
    contact_mail: string
    department: string
    department_id: string
}

export interface IEditAddressBookItem {
    id?: string
    name: string
    contact_mail?: string
    contact_phone: string
    department_id: string
}

// 通讯录管理 ------- end

// 更新告警规则请求参数
export interface IUpdateAlarmRuleParams {
    // 临期告警内容
    deadline_reminder: string
    // 临期告警时间
    deadline_time: number
    // 提前告警内容
    beforehand_reminder: string
    // 提前告警时间
    beforehand_time: number
    // 告警规则ID
    id: string
}

// 告警规则
export interface IAlarmRule extends IUpdateAlarmRuleParams {
    // 规则类型
    type: string
    // 更新时间
    update_at: string
    // 更新人
    update_by: string
}

export interface IAlarmRuleRes {
    entries: IAlarmRule[]
}

/** 用户详情 */
export interface IUserDetails {
    id: string
    created_at: string
    updated_at: string
    created_by: {
        id: string
        name: string
    }
    updated_by: {
        id: string
        name: string
    }
    name: string
    display_name: string
    login_name: string
    scope: string
    user_type: number
    phone_number: string
    mail_address: string
    status: number
    parent_deps?: {
        path_id: string
        path: string
    }[]
    roles?: {
        id: string
        created_at: string
        updated_at: string
        created_by: string
        updated_by: string
        name: string
        type: string
        description: string
        color: string
        scope: string
        icon: string
    }[]
    role_groups?: {
        id: string
        created_at: string
        updated_at: string
        created_by: string
        updated_by: string
        name: string
        description: string
        roles: IRoleItem[]
    }[]
    // 经过计算叠加的权限
    permissions?: {
        id: string
        created_at: string
        updated_at: string
        name: string
        category: string
        scope: string
    }[]
    // 注册时间
    register_at?: string
    // 是否注册 1: 未注册  2 已注册
    registered?: number
    sex?: any
}

/**
 * 两种传值方式，可以搭配混合使用
 */
export interface IRoleBindingsParams {
    /** 方式一 */
    // 用户 ID 列表
    user_ids?: string[]
    // 角色 ID 列表
    role_ids?: string[]
    // 角色组 ID 列表
    role_group_ids?: string[]
    // 操作 增: Present | 减: Absent
    state?: string

    /** 方式二 */
    // 用户-角色、用户-角色组绑定关系列表
    bindings?: {
        user_id?: string
        role_id?: string
        role_group_id?: string
        state?: string
    }[]
}

/** 创建/更新角色请求参数 */
export interface IPostRoleParams {
    name: string
    description?: string
    color?: string
    scope?: string
    icon?: string
}

/** 角色简略信息 */
export interface IRoleItem {
    id: string
    created_at: string
    updated_at: string
    // 创建人id
    created_by: string
    // 更新人id
    updated_by: string
    name: string
    type: string
    description: string
    color: string
    scope: string
    icon?: string
}

/** 角色详情 */
export interface IRoleDetails {
    id: string
    created_at: string
    updated_at: string
    created_by: {
        id: string
        name: string
    }
    updated_by: {
        id: string
        name: string
    }
    name: string
    type: string
    description: string
    color: string
    scope: string
    icon: string
    permissions: {
        id: string
        created_at: string
        updated_at: string
        name: string
        category: string
    }[]
}

/** 创建角色组请求参数 */
export interface ICreateRoleGroupParams {
    name: string
    description?: string
}

/** 角色组详情 */
export interface IRoleGroupDetails {
    id: string
    created_at: string
    updated_at: string
    created_by: {
        id: string
        name: string
    }
    updated_by: {
        id: string
        name: string
    }
    name: string
    description: string
    roles: {
        id: string
        created_at: string
        updated_at: string
        created_by: string
        updated_by: string
        name: string
        type: string
        description: string
        color: string
        scope: string
        icon: string
    }[]
}

/** 角色组简略信息 */
export interface IRoleGroupItem {
    id: string
    created_at: string
    updated_at: string
    // 创建人id
    created_by: string
    // 更新人id
    updated_by: string
    name: string
    description: string
}

/** 权限详情 */
export interface IPermissions {
    id: string
    created_at: string
    updated_at: string
    name: string
    description?: string
    // 权限分类 PermissionCategory
    category: string
    // 权限范围 PermissionScope
    scope: string
}
export interface IExcellentCaseItem {
    id: string
    ID?: string
    UUID?: string
    name: string
    application_exampleID: string
    type: string
    state: string
}
export interface IExcellentCaseRes {
    items: IExcellentCaseItem[]
    total: number
}
export interface ICarouselsItem extends IExcellentCaseItem {
    Size: number
    create_at: string
    create_by: string
    update_at: string
    IntervalSeconds: string
}
export interface ICarouselsListRes {
    items: ICarouselsItem[]
    total: number
}

/**
 * 数据源树
 */
export interface IDataSourceTreeBySource {
    source_type: string
    entries: IDataSourceTreeByType[]
}

/**
 * 数据源树按类型分组
 */
export interface IDataSourceTreeByType {
    type: string
    entries: IDataSourceTreeByTypeItem[]
}

/**
 * 数据源树按类型分组
 */
export interface IDataSourceTreeByTypeItem {
    id: string
    name: string
    catalog_name: string
    type: string
    source_type: string
    database_name: string
    schema: string
    department_id: string
    department_name: string
    updated_by_uid: string
    updated_at: string
}

export enum AppTypeEnum {
    // 微应用
    MICRO_TYPE = 'micro_type',
    // 非微应用
    NON_MICRO_TYPE = 'non_micro_type',
}

export interface IAppRegisterListParams {
    keyword?: string
    offset?: number
    limit?: number
    sort?: string
    direction?: string
    app_type?: AppTypeEnum
    department_id?: string
    info_system_id?: string
    is_register_gateway?: boolean
    started_at?: number
    finished_at?: number
}

export interface IAppRegisterListItem {
    id: string
    name: string
    app_type: AppTypeEnum
    department_id: string
    department_name: string
    department_path: string
    description: string
    info_system_id: string
    info_system_name: string
    is_register_gateway: boolean
    ip_addr: {
        ip: string
        port: string
    }[]
    pass_id: string
    responsible_uids: string[]
}

export interface ISystemRegisterListParams {
    keyword?: string
    offset?: number
    limit?: number
    sort?: string
    direction?: string
}

export interface ISystemRegisterListItem {
    register_at: number
    created_at: number
    created_user: string
    department_id: string
    department_name: string
    department_path: string
    description: string
    id: string
    name: string
    system_identifier: string
    updated_at: number
    updated_user: string
    responsiblers: {
        id: string
        name: string
    }[]
}
// 负责人创建
export interface ICreateUser {
    // 用户id
    user_id: string
}

// 机构创建
export interface ICreateOrg {
    // 部门id
    dept_id: string
    // 部门职责
    dept_tag: string
    // 部门职责
    business_duty: string
    // 部门负责人
    user_ids: {
        user_id: string
    }[]
}

export interface IRegisterSystemParams {
    department_id: string
    info_system_id: string
    responsible_uids: string[]
    system_identifier: string
}

export interface IRegisterAppParams {
    // 应用ID
    id: string
    responsible_uids: string[]
}
export interface IBusinessMattersListParams extends ISystemRegisterListParams {
    type_key?: string
}
export interface IBusinessMattersListItem {
    department_id?: string
    department_name?: string
    id?: string
    materials_number?: number
    name?: string
    type_key?: string
    type_value?: string
}
export interface IcreateBusinessMatters {
    department_id?: string
    id?: string
    materials_number?: number
    name: string
    type_key?: string
}

// 资源权限申请-------------start

// 审核策略类型
export enum RescPolicyType {
    // 自定义的
    Customize = 'customize',
    // 内置目录
    BuiltInCatalog = 'built-in-data-catalog',
    // 内置接口
    BuiltInInterface = 'built-in-interface-svc',
    // 内置接口
    BuiltInView = 'built-in-data-view',
    // 内置接口
    BuiltInIndicator = 'built-in-indicator',
}

// 数据资源-资源类型
export enum PolicyDataRescType {
    NOLIMIT = '',
    // 数据资源目录
    DATA_RESC_CATLG = 'data-catalog',
    // 库表
    LOGICALVIEW = 'data-view',
    // 接口
    INTERFACE = 'interface-svc',
    // 指标
    INDICATOR = 'indicator',
}

// 资源策略状态
export enum RescPolicyStatus {
    // 未启用
    NotEnabled = 'not-enabled',
    // 已启用
    Enabled = 'enabled',
    // 已停用
    Disabled = 'disabled',
}

// 资源审核策略列表返回项
export interface IRescPolicyListItem {
    id: string
    name: string
    description?: string
    // 审核流程key
    proc_def_key?: string
    // 当前审核策略下资源数量, 如果是内置类型，为默认值0，前端忽略此字段
    resources_count?: number
    // 审核流程类型 af-data-permission-request：数据权限申请
    audit_type?: string
    // 审核流程所属业务模块，值：auth-service
    service_type?: string
    // 审核策略类型：customize(自定义的), built-in(内置的)）
    type?: RescPolicyType
    // // 取值：视图、指标、接口，内置策略时使用
    // resource_type?: string
    // 审核策略状态
    status?: RescPolicyStatus
    // 更新时间
    updated_at?: number
    // 更新人
    updater_name?: string
    // 创建时间
    created_at?: number
    // 创建人
    creator_name?: string

    // resources?: Array<{
    //     id?: string
    //     name?: string
    //     type:
    //         | DataRescType.LOGICALVIEW
    //         | DataRescType.INDICATOR
    //         | DataRescType.INTERFACE
    // }>
}

// 资源审核策略列表查询参数
export interface IGetRescPolicyList extends IGetListParams {
    // 审核流程 (是否设置流程)
    has_audit?: boolean

    // 审核资源（是否设置设置资源）
    has_resource?: boolean

    // 审核策略状态: not-enabled(未启用), enabled(已启用), disabled(已停止)
    status?: string
}

// 策略内容
export interface IRescPolicyItem {
    id?: string
    /** 审核流程类型，取值： PolicyType.AssetPermission */
    audit_type?: string
    /** 审核策略描述信息 */
    description?: string
    /** 审核策略名称 */
    name: string
    /** 审核流程的定义 key */
    proc_def_key?: string
    /** 关联的资源列表 */
    resources?: Array<{
        /** 资源 ID */
        id: string
        /** 资源类型 */
        type: string
    }>
    /** 审核流程所属业务模块 */
    service_type?: string
    /** 审核策略状态 */
    status?: RescPolicyStatus
    /** 审核策略类型 */
    type?: RescPolicyType
}

/**
 * 资源id是否有审核策略
 */
export interface ResourcePermissionConfig {
    /** 接口服务是否有内置审核流程 */
    interface_svc_has_built_in_audit: boolean
    /** 数据视图是否有内置审核流程 */
    data_view_has_built_in_audit: boolean
    /** 指标是否有内置审核流程 */
    indicator_has_built_in_audit: boolean
    /** 接口服务是否有已启用的自定义审核流程 */
    interface_svc_has_customize_audit: boolean
    /** 数据视图是否有已启用的自定义审核流程 */
    data_view_has_customize_audit: boolean
    /** 指标是否有已启用的自定义审核流程 */
    indicator_has_customize_audit: boolean
    /** 资源关联审核信息列表 */
    resources?: Array<{
        /** 资源 ID */
        id: string
        /** 是否设置审核流程 */
        has_audit: boolean
    }>
}
// 资源权限申请-------------end

// 短信推送配置-------------start
// 短信推送开关状态
export enum SmsSwitchStatus {
    // 开启
    On = 'on',
    // 关闭
    Off = 'off',
}

// 短信推送配置
export interface ISmsConfig {
    switch_status: SmsSwitchStatus
    push_role_id: string
}
// 短信推送配置-------------end
export interface IFormEnum {
    id: number
    value: string
    value_en: string
}

/**
 * @description 获取表单配置
 * @param origin_standard 原始表/业务表配置
 * @param fusion 融合表配置
 */
export interface IFormEnumConfigModel {
    data_range: IFormEnum[]
    update_cycle: IFormEnum[]
    formulate_basis: IFormEnum[]
    // 业务表标准类型与数据标准模块枚举值对应情况
    standard_formulate_basis: IFormEnum[]
    overall_priority_rule: IFormEnum[]
    priority_rule: IFormEnum[]
    data_kind: IFormEnum[]
    data_type: IFormEnum[]
    table_kind: IFormEnum[]
}

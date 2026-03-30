import React from 'react'

/**
 * @enum
 * @description 排序方式
 * @param DESC 降序
 * @param ASC 升序
 */
export enum SortDirection {
    NONE = 'none',
    DESC = 'desc',
    ASC = 'asc',
}

/**
 * 排序方式
 * @param CREATED 'created_at' 按创建时间排序
 * @param UPDATED 'updated_at' 按更新时间排序
 * @param PUBLISHAT 'publish_at' 按发布时间
 * @param ONLINEAT 'online_at' 按上线时间
 * @param FINISHDATE 'finish_date' 期望完成时间
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
    FINISHED = 'finished_at',
    NAME = 'name',
    MOUNTSOURCENAME = 'mount_source_name',
    PUBLISHAT = 'publish_at',
    ONLINEAT = 'online_at',
    TITLE = 'title',
    FINISHDATE = 'finish_date',
    CATALOGTITLE = 'catalog_title',
    REPLIEDAT = 'replied_at',
    REPORTEDAT = 'reported_at',
    APPLYTIME = 'apply_time',
    BUSINESS_NAME = 'business_name',
    REPLYAT = 'replied_at',
    RESTITLE = 'res_title',
    PUBLISHEDAT = 'published_at',
}

/**
 * @interface
 * @description 错误响应数据
 * @param {string} code 错误码
 * @param {string} description 错误描述
 * @param {string} solution 错误处理建议
 * @param {string} cause 错误原因
 */
export interface IErrorResponse {
    code: string
    description: string
    solution: string
    cause: string
}

/**
 * @parma DOMAINDELETE 缺失业务城
 * @parma MAINBUSDELETE 缺失业务模型
 * @parma EXECUTORDELETE 缺失任务执行人
 * @parma FORMDELETE 关联业务表被删除
 * @parma CATALOGDELETE 关联教据资源目录被删除
 */
export enum TaskConfigStatus {
    NORMAL = 'normal',
    DOMAINDELETE = 'businessDomainDeleted',
    MAINBUSDELETE = 'mainBusinessDeleted',
    EXECUTORDELETE = 'executorDeleted',
    FORMDELETE = 'formDeleted',
    CATALOGDELETE = 'catalogDeleted',
    INDICATORDELETE = 'indicatorDeleted',
}

/**
 * 任务可执行的状态
 * @param EXECUTABLE 已开启
 * @param BLOCKED 未开启
 * @param COMPLETED 已完成
 * @param INVALID 已失效
 */
export enum TaskExecutableStatus {
    EXECUTABLE = 'executable',
    BLOCKED = 'blocked',
    COMPLETED = 'completed',
    INVALID = 'invalid',
}

/**
 * 任务状态
 * @param READY 'ready' 未开始
 * @param ONGOING 'ongoing' 进行中
 * @param COMPLETED 'completed' 已完成
 */
export enum TaskStatus {
    READY = 'ready',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
}

/**
 * 任务优先级
 * @param COMMON 'common' 普通
 * @param EMERGENT 'emergent' 紧急
 * @param URGENT 'urgent' 非常紧急
 */
export enum TaskPriority {
    COMMON = 'common',
    EMERGENT = 'emergent',
    URGENT = 'urgent',
}

/**
 * 任务类型
 * @param NORMAL 'normal' 普通任务
 * @param MODEL 'modeling' 业务建模任务
 * @param FieldStandard 'FieldStandard' 新建标准任务
 * @param DATACOLLECTING 'dataCollecting' 数据采集任务
 * @param DATAPROCESSING 'dataProcessing' 数据加工任务
 * @param DATACOMPREHENSION 'dataComprehension' 数据资源目录任务
 * @param DATACOMPREHENSIONWWORKORDER 'dataComprehensionWorkOrder' 数据理解工单任务
 * @param RESEARCHREPORTWWORKORDER 'researchReportWorkOrder' 调研工单任务
 * @param DATACATALOGWWORKORDER 'dataCatalogWorkOrder' 资源编目工单任务
 * @param FRONTPROCESSORSWWORKORDER 'frontEndProcessorsWorkOrder' 前置机申请工单任务
 * @param DATASHEETVIEW 'syncDataView' 库表任务
 * @param DATAMODELING 'dataModeling' 数据建模任务
 * @param MODELINGDIAGNOSIS 'businessDiagnosis' 业务模型诊断任务
 * @param MAINBUSINESS 'mainBusiness' 主干业务梳理任务
 * @param STANDARDNEW 'standardization' 标准新建任务
 */
export enum TaskType {
    NORMAL = 'normal',
    MODEL = 'modeling', // 1
    FIELDSTANDARD = 'fieldStandard',
    DATACOLLECTING = 'dataCollecting',
    DATAPROCESSING = 'dataProcessing',
    DATACOMPREHENSION = 'dataComprehension',
    DATACOMPREHENSIONWWORKORDER = 'dataComprehensionWorkOrder',
    RESEARCHREPORTWWORKORDER = 'researchReportWorkOrder',
    DATACATALOGWWORKORDER = 'dataCatalogWorkOrder',
    FRONTPROCESSORSWWORKORDER = 'frontEndProcessorsWorkOrder',
    DATASHEETVIEW = 'syncDataView',
    INDICATORPROCESSING = 'indicatorProcessing',
    DATAMODELING = 'dataModeling',
    MODELINGDIAGNOSIS = 'businessDiagnosis',
    MAINBUSINESS = 'mainBusiness',
    STANDARDNEW = 'standardization',
}

/** 任务子类型 */
export enum ModelChildTaskType {
    // 业务模型子类型
    // 1录入流程图
    FlowChart = '1',
    // 2录入业务节点表
    NodeForm = '2',
    // 3录入业务标准表
    StandardForm = '3',
    // 4录入业务指标
    Indicator = '4',
    // 5业务标准表标准化
    StandardStandardForm = '5',

    // 数据模型子类型
    // 6录入数据来源表
    DataSourceForm = '6',
    // 7录入数据标准表
    DataStandardForm = '7',
    // 8录入数据融合表
    DataFusionForm = '8',
    // 9录入数据指标
    DataIndicator = '9',
    // 10数据标准表标准化
    DataStandardStandardForm = '10',
}

export interface ICommonRes<T> {
    entries: T[]
    limit: number
    offset: number
    total_count: number
    total?: number
}

// 服务生成参数排序
export enum ParamsSort {
    // 不排序
    Unsorted = 'unsorted',

    // 升序
    ASC = 'asc',

    // 降序
    DESC = 'desc',
}

// 服务生成脱敏规则
export enum ParamsMasking {
    // 不脱敏
    Plaintext = 'plaintext',
    //  哈希
    Hash = 'hash',
    // 覆盖
    Override = 'override',
    // 替换
    Replace = 'replace',
}

// 服务生成运算逻辑
export enum ParamsOperator {
    // 精准匹配
    Equal = '=',

    // 模糊匹配
    Like = 'like',

    // 不等于
    Neq = '!=',

    // 大于
    Greater = '>',

    // 大于等于
    GreaterEqual = '>=',

    // 小于
    Less = '<',

    // 小于等于
    LessEqual = '<=',

    // 包含
    Incloudes = 'in',

    // 不包含
    Excludes = 'not in',
}

// 数据源来源类型
export enum DataSourceFromType {
    // 数仓
    Analytical = 'analytical',

    // 信息系统
    Records = 'records',
}

export enum BusinessDomainLevelTypes {
    DomainGrouping = 'domain_group',
    Domain = 'domain',
    Process = 'process',
    Infosystem = 'infosystem',
}

export interface IGetListParams {
    // 过滤参数，参数非必填
    keyword?: string // 支持指标名称，指标描述
    // 分页参数，参数非必填
    offset?: string | number
    limit?: string | number
    // 排序参数，参数非必填
    sort?: string // 指标名称，创建时间，更新时间
    direction?: string // desc, asc
}
// 标准目录类型
export enum CatalogType {
    DATAELE = 1,
    CODETABLE = 2,
    CODINGRULES = 3,
    FILE = 4,
}

// 标准目录选项
export enum CatalogOption {
    // 自定义目录
    AUTOCATLG = 'autoCatlg',
    // 标准文件目录
    STDFILECATLG = 'stdFileCatlg',

    DEPARTMENT = 'department',
}

// 标准数据平台
export enum CatalogTypeName {
    DATAELE = '数据元',
    CODETABLE = '码表',
    CODINGRULES = '编码规则',
    FILE = '文件',
}

export const CatalogTypeToName = {
    [CatalogType.DATAELE]: CatalogTypeName.DATAELE,
    [CatalogType.CODETABLE]: CatalogTypeName.CODETABLE,
    [CatalogType.CODINGRULES]: CatalogTypeName.CODINGRULES,
    [CatalogType.FILE]: CatalogTypeName.FILE,
}

// 新增或编辑数据元，编辑码表/标准文件/编码规则字段使用类型
export interface IDataItem {
    key: string
    label: string
    value?: string // 使用select对话框时，value字段(如：数据元编辑/新建时，表单中查看编码规则)
    otherInfo?: string // 携带其他字段信息回传
    catalog_id?: string
    // 标准类型
    std_type?: string
    status?: number
    code?: string
    dict_id?: string
    dict_name?: string
    label_id?: string // 数据分级标签
    label_name?: string
    label_icon?: string
}

// 编码规则status状态
export enum CRuleStatus {
    ACTIVE = 1,
}

/**
 * @interface
 * @description 菜单数据
 * @param {string} key 排序的字段
 * @param {string} label 菜单项名称
 * @param {React.ReactNode} icon 菜单图标配置
 * @param {SortDirection} sort 排序方式
 */
export interface IMenuData {
    key: string
    label?: string | React.ReactNode
    icon?: React.ReactNode
    sort?: SortDirection
}

export interface IStandCommonRes<T> {
    data: T[]
    limit: number
    offset: number
    total_count: number
    keyword?: string
}

/**
 * @IStdDetailConfig
 * @label 信息名称
 * @name 信息字段
 * @col 宽度[1, 24](对应<Col/>的span属性)
 */
export interface IStdDetailConfig {
    label: string
    name: string
    col?: number
}

// 通用列表查询参数
export interface IListParams {
    // 过滤参数，参数非必填
    keyword?: string
    // 分页参数，参数非必填
    offset?: number
    limit?: number
    // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序; name: 按名称排序。默认按创建时间排序
    sort?: SortType
    direction?: SortDirection
}

/**
 * 库表类型
 */
export enum LogicViewType {
    // 元数据库表
    DataSource = 'datasource',
    // 自定义库表
    Custom = 'custom',
    // 逻辑实体库表
    LogicEntity = 'logic_entity',
}

/**
 * 将K里面的属性变成可选
 *eg  type1= {a:string, b:string, c:string}通过Optional<type1, 'b'|'c' > 得到的类型为{a:string, b?:string, c?:string}
 */

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 获取可选类型
 */
type GetOptional<T> = {
    [P in keyof T as T[P] extends Required<T>[P] ? never : P]: T[P]
}

/**
 * 类目类型
 */
export enum CategoryType {
    // 系统
    SYSTEM = 'system',
    // 自定义
    CUSTOM = 'customize',
}

/**
 * 系统类目类型
 */
export enum SystemCategory {
    // 组织架构
    Organization = '00000000-0000-0000-0000-000000000001',
    // 信息系统
    InformationSystem = '00000000-0000-0000-0000-000000000002',
    // 主题域
    SubjectDomain = '00000000-0000-0000-0000-000000000003',
}

// 组织架构树等-未分类节点key值
export const unCategorizedKey = '00000000-0000-0000-0000-000000000000'

/**
 * 接口发布状态
 */
export enum PublishStatus {
    // 未发布
    UNPUBLISHED = 'unpublished',

    // 发布审核中
    PUB_AUDITING = 'pub-auditing',

    // 已发布
    PUBLISHED = 'published',

    // 发布审核未通过
    PUB_REJECT = 'pub-reject',

    // 变更审核中
    CHANGE_AUDITING = 'change-auditing',

    // 变更审核未通过
    CHANGE_REJECT = 'change-reject',
}

/**
 * 接口上线状态
 */
export enum OnlineStatus {
    // 未上线
    NOT_ONLINE = 'notline',

    // 已上线
    ONLINE = 'online',

    // 已下线
    OFFLINE = 'offline',

    // 上线审核中
    UP_AUDITING = 'up-auditing',

    // 下线审核
    DOWN_AUDITING = 'down-auditing',

    // 上线审核未通过
    UP_REJECT = 'up-reject',

    // 下线审核未通过
    DOWN_REJECT = 'down-reject',

    // 已删除
    DELETED = 'deleted',
}

export interface DataList<T> {
    entries: Array<T>
    total_count: number
}

/** 角色类型 */
export enum RoleType {
    // 内置角色
    Internal = 'Internal',
    // 自定义角色
    Custom = 'Custom',
}

/** 权限范围 */
export enum PermissionScope {
    // 全部
    All = 'All',
    // 本组织
    Organization = 'CurrentDepartment',
}

/** 权限分类 */
export enum PermissionCategory {
    // 基础权限
    BasicPermission = 'BasicPermission',
    // 基础类
    Basic = 'Basic',
    // 运营类
    Operation = 'Operation',
    // 服务类
    Service = 'Service',
    // 信息类
    Information = 'Information',
    // 省直达专区
    SszdZone = 'SszdZone',
}

export enum OrganizationType {
    // 组织架构
    Organization = 'organization',
    // 信息系统
    InformationSystem = 'department',
}

export enum ScopeModuleCategory {
    // 组织架构
    Interface = '0b3326bf-5e2a-8c9e-1c7a-95ef5d7366da',
}

/**
 * 样例数据类型
 */
export enum SampleDataType {
    // 合成数据
    Synthetic = 'synthetic',
    // 真实数据
    Real = 'real',
}

/**
 * 工作专区显示设置模式
 */
export enum DisplayModeType {
    List = 'list', // 列表模式
    Hierarchy = 'hierarchy', // 层级模式
}

import { SortDirection, Optional, IGetListParams } from '../common'

/**
 * 查询需求详情参数
 * @param {string} id 需求ID
 * @param {string} fields   查询详情信息返回字段  log：操作记录  basic_info：需求信息  analysis_result：分析结果 implement_result：实施结果 可选择多个字段信息任意组合，多个字段信息用英文逗号分隔
 * @param {string} view     applier：需求方视角，要求用户必须是需求创建人（当需求状态不为已撤销且为分析待确认及其之后的状态展示分析结果，分析结果展示内容为最新提交的记录）operator：需求分析/实施人员视角，需求为待分析/待实施状态时所有运营均可查看，否则限定仅曾处理过该需求的运营人员可查看（分析结果展示最新的保存或提交的记录）auditor：审核员视角，fields包含analysis_result、implement_result时必须指定analysis_id，展示指定analysis_id的分析记录
 */
export interface ISSZDDemandDetailParams {
    id: string
    fields: string
    view: string
}

export interface ISSZDDemandBaseInfo {
    id: string
    code: string
    // 0 无事项 1 有事项
    demand_type: string
    title: string
    data_source_basic: string
    update_cycle: string
    finish_date: number
    attachment_id: string
    attachment_name: string
    description: string
    catalog_id: string
    catalog_code: string
    catalog_title: string
    //  view 库表 file 文件 api 接口
    // catalog_type: string
    // 目录状态 0 已撤销 1 生效中
    catalog_status: number
    // 1 信息查询接口 2 数据核验接口  3 批量库表交换  4 文件下载交换 5 其它
    shared_type: string
    // 需求信息项，多个用‘|’分隔
    columns: string
    scene_type: string
    scene: string
    org_code: string
    org_name: string
    contact: string
    phone: string
    mail: string
    // 责任部门组织机构代码（数源部门）
    duty_org_code: string
    // 责任部门组织机构名称（数源部门）
    duty_org_name: string
}

export interface ISSZDDAnalysisResult {
    // 审核结果 reject 拒绝 agree 同意
    audit_result: string
    // 拒绝类型/原因 1 法律法规不允许提供 2 该数据不在本部门 3 资源不具备共享条件 4 其它  audit_result为reject时必填
    reject_type: number
    // 审核意见/分析结论说明
    comment: string
    // 提供时间戳（ms），audit_result为agree时选填
    provide_time: number
    // （责任）资源类型： view库表 file 文件  api 接口
    duty_resource_type: string
    // 分析处理部门联系人
    contact: string
    // 分析处理部门联系人电话
    phone: string
    // 分析处理部门组织机构代码
    org_code: string
    // 分析处理部门组织机构名称
    org_name: string
    // 分析处理人名称
    analyzer: string
}

export interface ISSZDDemandLogInfo {
    // 操作类型名称，本地操作记录没有该信息
    op_name: string
    // 操作类型，省平台同步操作记录没有该信息 1 创建 6 上报审核 11 分析签收 16 分析 21 实施签收 26 实施 31 撤销
    op_type: number
    // 操作用户名称
    op_user: string
    // 操作部门名称
    op_org: string
    // 操作备注
    op_comment: string
    // 操作结果 undone 撤销 agree 同意 reject 拒绝/驳回
    op_result: string
    // 操作时间戳（ms）
    op_time: number
}

export interface ISSZDCatalogDetail {
    // 目录ID
    catalog_id: string
    // 目录编码
    catalog_code: string
    // 目录名称
    catalog_title: string
    // 目录/资源类型 view 库表  file 文件  api 接口
    resource_type: string
    resource_name: string
    resource_id: string
}

export interface ISSZDImplementResult {
    catalogs: ISSZDCatalogDetail[]
}

export interface ISSZDDemandDetails {
    basic_info: ISSZDDemandBaseInfo
    analysis_result: ISSZDDAnalysisResult
    log: ISSZDDemandLogInfo[]
    implement_result: ISSZDImplementResult
}

export interface ICreateSSZDDemandParams {
    title: string

    description: string

    scene_type: string

    scene?: string

    one_thing_code?: string

    other_one_thing_desc?: string

    demand_type: string

    org_code: string

    contact: string

    phone: string

    mail: string

    columns: string

    duty_org_credit_code: string

    duty_org_name: string

    shared_type?: string

    format_file?: string

    data_source_basic: string

    update_cycle?: string

    other_update_cycle?: string

    attachment_id?: string

    catalog_id?: string
}

export type IAnalysisSSZDDemandParams = Omit<
    Omit<ISSZDDAnalysisResult, 'reject_type'> &
        Partial<Pick<ISSZDDAnalysisResult, 'reject_type'>>,
    'org_name' | 'analyzer'
>

export interface IGetSSZDDemandParams {
    // 列表类型 apply：我的申请  todo：我的待办  done：我处理的  signingoff：待签收的
    target: string
    offset?: number
    limit?: number
    keyword?: string
    direction?: string
    sort?: string
    create_begin_time?: number
    create_end_time?: number
    status?: string
}

export interface ISSZDDemandItem {
    id: string
    title: string
    status: string
    reject_reason: string
    cancel_reason: string
    org_code: string
    org_name: string
    contact: string
    phone: string
    duty_org_code: string
    duty_org_name: string
    created_at: number
}
export interface IGetSSZDDemandRes {
    total_count: number
    entries: ISSZDDemandItem[]
}

// 字典类型
export enum SSZDDictTypeEnum {
    // 所属领域、应用领域【应用系统】
    Area = 'area',
    // 应用场景
    Scene = 'scene',
    // 应用场景类型
    SceneType = 'scene-type',
    // 高效办成“一件事”
    OneThing = 'one-thing',
    // 应用范围
    Range = 'range',
    // 敏感级别
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
    ServeType = 'serve-type',
    // 使用范围
    UseScope = 'use-scope',
    // 更新周期
    UpdateCycle = 'update-cycle',
    // 是否发布
    Publish = 'publish',
    // 共享类型
    ShareType = 'share-type',
    // 数据区域范围
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
    // 回流是否能区分地市（州）
    BackflowRegion = 'backflow-region',
    // 数据所属领域
    FieldType = 'field-type',
    // 统一社会信用代码
    OrgCode = 'org-code',
    // 行政区划代码
    DivisionCode = 'division-code',
    // 中央业务指导（实施）部门代码
    CenterDeptCode = 'center-dept-code',
    // 数据分级
    DataSensitiveClass = 'data-sensitive-class',
    // 目录标签
    CatalogTag = 'catalog-tag',
    // 系统所属分类
    SystemClass = 'system-class',
}

export interface ISSZDDictItem {
    dict_key: string
    dict_value: string
    comment: string
}
export interface ISSZDDict {
    dicts: {
        dict_type: SSZDDictTypeEnum
        entries: ISSZDDictItem[]
    }[]
}

export interface ISSZDOrganization {
    // 编码
    code: string
    // 名称
    name: string
    // 组织机构类型
    org_type: string
    // 行政区划
    region: string
    // 组织机构
    organ: string
    // 行政区划编码
    region_code: string
    // 行政区划名称
    region_name: string
    sort_order: string
}

export interface IGetSSZDCatalogParams {
    direction?: SortDirection
    keyword?: string
    limit?: number
    offset?: number
    org_code?: string
    share_type?: Array<any>
    sort?: string
}

export interface ISSZDCatalogInfoItem {
    // 信息项目编码
    column_code: string
    // 信息项中文名
    column_name_cn: string
    // 信息项目英文名
    column_name_en: string
}

export interface ISSZDCatalogResourceGroup {
    // 关联的接口资源
    api: {
        resource_id: string
        resource_name: string
    }[]
    // 关联的数据库信息
    db: {
        resource_id: string
        resource_name: string
    }[]
    // 关联的文件信息
    file: {
        resource_id: string
        resource_name: string
    }[]
}
export interface ISSZDCatalog {
    // 目录摘要说明
    abstract: string
    // 目录编制部门名称
    dept_name: string
    // 目录编码
    id: string
    // 目录信息项目名称
    info_items: ISSZDCatalogInfoItem[]
    // 数据目录提供方编码, 政务部门所在组织机构的统一社会信用代码
    org_code: string
    // 组织结构的路径
    org_path: string
    // 目录关联的资源分组
    resource_groups: ISSZDCatalogResourceGroup
    // 共享类型
    share_type: string
    // 资源状态，1：生效中，0已撤销，上报无需传
    status: string
    // title
    title: string
    // 更新时间
    updated_at: number
}

// 同步任务
// 同步类型
export enum SSZDSyncTaskEnum {
    // 目录下行
    Catalog = 'catalog',
    // 资源目录审核状态下行
    CatalogStatus = 'catalog-status',
    // 供需下行
    Demand = 'demand',
    // 共享申请下行
    ShareApply = 'share-apply',
    // 数据异议提出下行
    RaiseObjection = 'raise-objection',
    // 数据异议处理下行
    HandleObjection = 'handle-objection',
    // 应用案例下行
    Example = 'example',
}

export interface ISSZDHasSynchTask {
    // string	任务ID，无正在进行中的任务返空字符串
    id: string
    // number	该同步类型上次同步时间戳（ms），从未同步过返回0
    last_sync_time: number
}

/**
 * 共享申请信息
 */
export interface IShareApplyBasic {
    // 共享申请ID
    id: string
    // 目录ID
    catalog_id: string
    // 目录名称
    catalog_title: string
    // 目录状态 0 已撤销 1 生效中
    catalog_status: number
    // 资源ID
    resource_id: string
    // 资源名称
    resource_name: string
    // 目录/资源类型 view-库表 file-文件 api-接口
    resource_type: string
    // 共享申请状态
    status: string
    // 申请ID，省平台唯一标识
    apply_id: string
    // 申请类型 1:政务服务 2:政务监管
    apply_type: number
    // 关联应用系统ID
    app_id: string
    // 关联应用系统名称
    app_name: string
    // 申请依据
    apply_basis: string
    // 附件ID
    attachment_id: string
    // 附件名称
    attachment_name: string
    // 使用范围说明 数据字典.使用范围
    use_scope: string
    // 其他使用范围 （使用范围为其他时必填）
    other_use_scope: string
    // 办事场景
    work_scene: string
    // 使用资源部门的组织机构编码
    user_org_code: string
    // 使用资源部门的组织机构名称
    user_org_name: string
    // 使用资源部门的组织机构路径（仅target为apply、subscribe时有）
    user_org_path: string
    // 使用人姓名
    user_name: string
    // 使用人联系方式
    user_phone: string
    // 使用人邮箱
    user_mail: string
    // 申请人姓名
    apply_name: string
    // 申请人联系方式
    apply_phone: string
    // 申请人邮箱
    apply_mail: string
    // 服务接口调用频次(峰值)次/天（申请资源为服务接口时必填）
    peak_frequency: number
    // 服务接口调用频次(平均)次/天（申请资源为服务接口时必填）
    avg_frequency: number
    // 接口使用期限，单位：天（申请资源为服务接口时必填）
    use_days: number
    // 00:00-23:59 （当为API资源必填）
    use_time: string
    // 其他技术请求（基于特定服务接口的具体技术要求）
    other_reqs: string
    // --- 列表独有
    // 目录编码，省平台目录编码
    catalog_code: string
    // 拒绝/驳回原因
    reject_reason: string
    // 撤销原因
    cancel_reason: string
    // 更新时间戳（ms）
    updated_at: number
    // 创建/申请时间
    created_at: number
    // 订阅时间 0标识没有订阅时间
    subscribe_at: number
}

/**
 * 共享申请操作记录
 */
export interface IShareApplyLog {
    // 操作类型 36-创建/提交资源申请 41-上报审核（资源申请审核）46-数源部门审核 51-订阅 56-取消订阅 61-撤销
    op_type: number
    // 操作用户名称
    op_user: string
    // 操作部门名称
    op_org: string
    // 操作备注
    op_comment: string
    // 操作结果 undone-撤销 agree-同意 reject-拒绝/驳回
    op_result: string
    // 操作时间戳（ms）
    op_time: number
    // 附件ID
    attachment_id: string
    // 附件名称
    attachment_name: string
}

/**
 * 共享申请详情
 */
export interface IShareApplyDetail {
    // 共享申请信息
    basic_info?: IShareApplyBasic
    // 操作记录
    log: IShareApplyLog[]
}

/**
 * 交换记录
 */
export interface IExchangeRecord {
    // 数据写入条数
    output_lines: string
    // 交换任务开始时间戳（ms）
    start_time: number
    // 交换任务结束时间戳（ms）
    stop_time: number
}

/**
 * 共享申请创建参数
 */
export type IShareApplyCreateParams = Optional<IShareApplyBasic>

/**
 * 共享申请订阅信息
 */
export interface IShareApplySubInfo {
    // 目录ID
    catalog_id: string
    // 目录名称
    catalog_title: string
    // 目录编码
    catalog_code: string
    // 资源ID
    resource_id: string
    // 资源名称
    resource_name: string
    // 目录/资源类型 view-库表 file-文件 api-接口
    resource_type: string
    // 数据源ID
    data_source_id: string
    // 数据源名称
    data_source_name: string
    // 库表前置库接收数据表名称
    accept_table: string
    // 文件前置库接收文件的绝对路径
    accept_path: string
    // 授权方式 none：免鉴权 token：token鉴权
    auth_type: string
    // 接口请求地址
    service_url: string
    // token请求地址
    token_url: string
}

/**
 * 共享申请审核列表信息
 */
export interface IShareApplyAudit {
    // 共享申请ID
    id: string
    // 共享申请省平台唯一标识
    apply_id: string
    // 审批状态 auditing: 审批中 audit_agreed: 审批通过 audit_rejected: 审批驳回
    status: string
    // 目录ID（本地）
    catalog_id: string
    // 目录ID（省平台）
    catalog_uniform_id: string
    // 目录编码
    catalog_code: string
    // 目录名称
    catalog_title: string
    // 资源名称
    resource_name: string
    // 资源类型 view: 库表 file: 文件 api: 接口
    resource_type: string
    // 审批流程类型 af-sszd-share-apply-escalate: 省市直达共享申请上报审核 af-sszd-share-apply-approve: 省市直达共享申请审批
    audit_type: string
    // 使用人姓名
    user_name: string
    // 申请人姓名
    apply_name: string
    // 使用资源部门的组织机构编码
    user_org_code: string
    // 使用资源部门的组织机构名称
    user_org_name: string
    // 更新时间戳（ms）
    updated_at: number
    // 申请时间
    apply_time: string
    // 审核实例ID
    proc_inst_id: string
    // 审核任务ID
    task_id: string
}

/**
 * 数据源信息
 */
export interface ISSZDDataSource {
    // 数据源ID
    id: string
    // 数据源类型 db-数据库 fs-文件服务
    ds_type: string
    // 数据源名称
    ds_name: string
    // 数据源连接信息
    conn_info: string
}

/**
 * 下行同步任务类型
 */
export enum SSZDSyncTaskType {
    // 目录下行
    Catalog = 'catalog',
    // 供需下行
    Demand = 'demand',
    // 共享申请下行
    ShareApply = 'share-apply',
    // 数据异议下行
    Objection = 'objection',
    // 应用案例下行
    Example = 'example',
}

/**
 * 同步任务信息
 */
export interface ISSZDSyncTask {
    // 任务ID，无正在进行中的任务返空字符串
    id: string
    // 该同步类型上次同步时间戳（ms），从未同步过返回0
    last_sync_time: number
}

/**
 * 需求审核类型
 * af-sszd-demand-escalate 需求审核
 */
export enum SSZDDemandAuditType {
    Escalate = 'af-sszd-demand-escalate',
}

/**
 * 需求审核类型
 * tasks 待审核
 */
export enum SSZDDemandAuditTarget {
    Tasks = 'tasks',
    Historys = 'historys',
}
/**
 * 审核列表查询参数
 * @param {SSZDDemandAuditTarget} target 审核类型
 * @param {SSZDDemandAuditType} audit_type 审核类型
 * @param {number} limit 分页
 * @param {number} offset 分页
 */
export interface IGetSSZDDemandAuditList {
    target: SSZDDemandAuditTarget
    audit_type: SSZDDemandAuditType
    limit?: number
    offset?: number
}

/**
 * 上报记录类型
 */
export enum ISSZDReportRecordType {
    /** 待上报 */
    Waiting = 'waiting',
    /** 已上报 */
    Reported = 'reported',
    /** 已撤销上报 */
    Revocation = 'revocation',
    /** 上报记录 */
    Record = 'record',
}
/**
 * 上报类型
 */
export enum ISSZDAuditOperation {
    /** 上报 */
    Report = 'report',
    /** 重新上报 */
    ReReport = 'rereport',
    /** 撤销上报 */
    Revocation = 'revocation',
    /** 撤回 */
    Cancel = 'cancel',
}

/**
 * 审核状态
 */
export enum ISSZDReportAuditStatus {
    /** 审核中 */
    Auditing = 'auditing',
    /** 审核通过 */
    Pass = 'approved',
    /** 审核未通过 */
    Reject = 'reject',
    /** 已撤回 */
    Cancel = 'cancel',
    /** 失败 */
    Error = 'error',
}

/**
 * 审核级别  1市级别, 2省级别
 */
export enum ISSZDAuditLevel {
    /** 市级别 */
    City = 'city',
    /** 省级别 */
    Province = 'province',
}

/**
 * 目录上报记录查询参数
 * @param {ISSZDReportAuditStatus} audit_status 审核状态
 * @param {SortDirection} direction 排序方向
 * @param {number} limit 分页
 * @param {number} offset 分页
 */
export interface IGetSSZDReportRecord {
    audit_status?: ISSZDReportAuditStatus
    direction?: SortDirection
    keyword?: string
    limit?: number
    offset?: number
    query_type: ISSZDReportRecordType
    org_code?: string
    resource_type?: string
    sort?: string
    status?: 'online' | 'offline'
    audit_operation?: ISSZDAuditOperation
}

/**
 * 上报记录列表项
 * @param {string} audit_comment 审核备注
 * @param {ISSZDAuditLevel} audit_level 审核级别说明, 0无级别, 1市级别, 2省级别
 * @param {ISSZDAuditOperation} audit_operation 审核动作: 1上报, 2重新上报, 3撤销上报
 * @param {ISSZDReportAuditStatus} audit_status 审核状态: 1审核中, 2 审核通过, 3审核未通过, 4已撤回
 * @param {string} catalog_code 目录编码
 * @param {string} catalog_id 目录唯一ID
 * @param {string} catalog_title 目录标题
 * @param {string} org_code 数据提供方，社会统一信用代码
 * @param {string} record_id 记录ID
 * @param {string[]} resource_type 资源类型，db,api,file当前取第一个，数组有可能为空数组
 * @param {string} update_time 更新时间
 * @param {string} data_push_error 数据推送错误信息
 * @param {string} data_push_name 数据推送名称
 * @param {string} data_push_id 数据推送ID
 */
export interface ISSZDReportRecordItem {
    audit_comment: string
    audit_level: ISSZDAuditLevel
    audit_operation: ISSZDAuditOperation
    audit_status: ISSZDReportAuditStatus
    catalog_code: string
    catalog_id: string
    catalog_title: string
    org_code: string
    org_name: string
    org_path: string
    record_id: string
    resource_type: string[]
    update_time: number
    data_push_error: string
    data_push_name: string
    data_push_id: string
}

/**
 * 目录上报审核记录查询参数
 * @param {string} target 审核列表类型
 * @param {SortDirection} direction 排序方向
 * @param {number} limit 分页
 * @param {number} offset 分页
 */
export interface IGetSSZDCatlgAuditRecord {
    direction?: SortDirection
    keyword?: string
    limit?: number
    offset?: number
    sort?: string
    report_type?: string
    target: string
}

/**
 * 上报审核记录列表项
 * @param {string} applier_id 申请人ID
 * @param {string} applier_name 申请人名称
 * @param {string} apply_code 申请编码
 * @param {string} apply_time 申请时间
 * @param {string} catalog_code 目录编码
 * @param {string} catalog_title 目录标题
 * @param {string} operation 操作
 */
export interface ISSZDCatlgAuditRecordItem {
    applier_id: string
    applier_name: string
    apply_code: string
    apply_time: number
    catalog_code: string
    catalog_title: string
    operation: string
}
/**
 * 上报审核结果列表项
 * @param {string} audit_comment 审核备注
 * @param {string} audit_level 审核级别
 * @param {string} audit_operation 审核动作
 * @param {string} audit_status 审核状态
 * @param {string} catalog_code 目录编码
 * @param {string} catalog_id 目录唯一ID
 * @param {string} catalog_title 目录标题
 * @param {string} department_id 上报部门，市级
 * @param {string} org_code 数据提供方，社会统一信用代码
 * @param {string} record_id 记录ID
 * @param {number} report_time 上报时间
 * @param {string} reporter 上报人ID
 * @param {string} reporter_name 上报人名称
 * @param {string[]} resource_type 资源类型
 * @param {number} update_time 更新时间
 */
export interface ISSZDAuditRecordItem {
    audit_comment: string
    audit_level: string
    audit_operation: string
    audit_status: string
    catalog_code: string
    catalog_id: string
    catalog_title: string
    department_id: string
    org_code: string
    record_id: string
    report_time: number
    reporter: string
    reporter_name: string
    resource_type: string[]
    update_time: number
}

/**
 * 审核状态
 * auditing 待审核
 * audit_agreed 已审核
 * audit_rejected 已驳回
 */
export enum ISSZDAuditStatus {
    Auditing = 'auditing',
    AuditAgreed = 'audit_agreed',
    AuditRejected = 'audit_rejected',
}
/**
 * 审核列表项
 * @param {string} id 需求ID
 * @param {string} title 需求标题
 * @param {ISSZDAuditStatus} status 审核状态
 * @param {number} apply_time 申请时间
 * @param {string} description 需求描述
 * @param {string} org_code 需求部门code
 * @param {string} org_name 需求部门名称
 * @param {string} org_path 需求部门路径
 * @param {string} contact 需求部门联系人
 * @param {string} phone 需求部门联系电话
 * @param {string} duty_org_code 责任部门code
 * @param {string} duty_org_name 责任部门名称
 * @param {string} proc_inst_id 审核实例ID
 * @param {string} task_id 审核任务ID
 */
export interface ISSZDDemandAuditItem {
    id: string
    title: string
    status: ISSZDAuditStatus
    apply_time: number
    description: string
    org_code: string
    org_name: string
    org_path: string
    contact: string
    phone: string
    duty_org_code: string
    duty_org_name: string
    proc_inst_id: string
    task_id: string
}

export interface IGetSSZDDemandAuditListRes {
    total_count: number
    entries: ISSZDDemandAuditItem[]
}

export interface IGetSSZDCatalogReportRecord {
    limit?: number
    offset?: number
    // 审核状态, auditing审核中，reject已拒绝，revocation已撤回
    audit_status?: string
    direction?: SortDirection
    keyword?: string
    sort?: string
    // 查询类型，start待上报，reported已上报，revocation已撤销上报，record上报记录
    query_type: string
    org_code?: string
    // 资源类型。api,db,file
    resource_type?: string
    // 上线状态，online已上线，offline已下线
    status?: string
}

export interface ISSZDCatalogReportRecordItem {
    // 目录ID
    catalog_id: string
    // 目录名称
    catalog_title: string
    // 目录编码
    catalog_code: string
    // 审核备注，意见
    audit_comment: string
    // 审核级别说明, 0无级别, 1市级别, 2省级别
    audit_level: string
    // 审核状态: 1审核中, 2 审核通过, 3审核未通过, 4已撤回
    audit_status: string
    // 审核动作: 1上报, 2重新上报, 3撤销上报
    audit_operation: string
    org_code: string
    // 数据提供方，社会统一信用代码
    record_id: string
    // 资源类型，db,api,file当前取第一个，数组有可能为空数组
    resource_type: string[]
    update_time: number
}
export interface IGetSSZDCatalogReportRecordRes {
    total_count: number
    entries: ISSZDCatalogReportRecordItem[]
}

export interface IProvinceApp {
    // 应用系统ID
    app_id: string
    // 应用系统名称
    app_name: string
    contact_name: string
    contact_phone: string
    deploy_place: string
    description: string
    id: string
    org_code: string
    org_name: string
    name: string
    province_ip: string
    province_url: string
    range_name: string
}
// 数据异议
/**
 * 异议类型
 */
export enum ObjectionTypeEnum {
    // 数据目录纠错
    DirectoryCorrection = '1',
    // 资源申请异议
    ApplyObjection = '2',
    // 资源使用异议
    UseObjection = '3',
    // 其他
    Other = '4',
}

/**
 * 资源申请异议分类
 */
export enum ApplyObjectionTypeEnum {
    // 审批时长
    ApplyTime = '1',
    // 审批意见
    ApplyOpinion = '2',
    // 其他
    Other = '3',
}

/**
 * 资源使用异议分类
 */
export enum UseObjectionTypeEnum {
    // 服务响应能力
    ServiceResponseAbility = '1',
    // 数据质量
    DataQuality = '2',
    // 其他
    Other = '3',
}

/**
 * 异议审核列表类型
 */
export enum ObjectionTargetEnum {
    // 待审核
    Tasks = 'tasks',
    // 已审核
    Historys = 'historys',
}

/**
 * 处理的异议状态
 */
export enum HandleObjectionStatusEnum {
    // 待审核
    ToAudit = 'to_audit',
    // 已处理
    Audited = 'audited',
    // 已收到评价
    Evaluated = 'evaluated',
}

/**
 * 提出的异议状态
 */
export enum RaiseObjectionStatusEnum {
    // 异议上报审核中
    ReportAuditing = 'report_auditing',
    // 异议上报已驳回
    ReportAuditRejected = 'report_audit_rejected',
    // 异议上报已撤销
    ReportAuditCanceled = 'report_audit_canceled',
    // 异议上报处理中
    Handling = 'handling',
    // 异议上报已处理
    Handled = 'handled',
    // 异议上报已评价
    Evaluated = 'evaluated',
    // 异议上报失败
    ReportFailed = 'report_failed',
}

/**
 * 处理异议操作
 */
export enum HandleObjectionOperateEnum {
    // 通过
    Pass = '1',
    // 驳回
    Reject = '0',
}

/**
 * 异议评价 - 评分
 */
export enum EvaluationScoreEnum {
    // 非常不满意
    One = '1',
    // 不满意
    Two = '2',
    // 一般
    Three = '3',
    // 满意
    Four = '4',
    // 非常满意
    Five = '5',
}

/**
 * 异议评价 - 问题是否已解决
 */
export enum EvaluationSolvedEnum {
    // 已解决
    Solved = '1',
    // 未解决
    Unsolved = '0',
}

/**
 * 数据异议列表查询参数
 */
export interface IGetSSZDDataObjectionListParams {
    // 排序方向
    direction?: string
    // 关键字
    keyword?: string
    // 每页大小
    limit?: number
    // 页码
    offset?: number
    // 排序类型
    sort?: string
    // 状态
    status?: RaiseObjectionStatusEnum | HandleObjectionStatusEnum
}

/**
 * 创建数据异议参数
 */
export interface ICreateSSZDDataObjectionParams {
    // 资源使用方编码
    apply_org_code?: string
    // 异议分类
    apply_problem?: ApplyObjectionTypeEnum | UseObjectionTypeEnum
    // 附件ID
    attachment_id?: string
    // 异议依据
    basic: string
    // 异议联系人
    contact: string
    // 创建者电话
    creator_phone: string
    // 资源ID
    data_id: string
    // 异议数据提供方编码
    data_org_code: string
    // 异议描述
    description: string
    // 异议类型
    objection_type: ObjectionTypeEnum
    // 提出部门编码
    org_code: string
    // 其他描述
    other_desc?: string
    // 异议联系人电话
    phone: string
    // 异议标题
    title: string
}

/**
 * 评价异议参数
 */
export interface IEvaluationParams {
    // 评价内容
    content: string
    // 评价分数
    score: EvaluationScoreEnum
    // 是否解决
    solved: EvaluationSolvedEnum
}

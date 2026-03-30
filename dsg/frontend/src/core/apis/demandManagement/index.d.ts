import { SortDirection, SortType } from '../common.d'
import { IUpdateDataPushParams } from '../dataCatalog'

export interface IGetDemands {
    direction?: SortDirection
    sort?: string
    keyword?: string
    limit?: number
    offset?: number
    tag_filter?: number
    org_code?: string
    status?: number
    apply_date_greater_than?: number
    apply_date_less_than?: number
}

export interface IDemandInfo {
    apply_user_id: string
    apply_user_name: string
    apply_user_phone: string
    created_at: number
    demand_code: string
    demand_title: string
    id: string
    operations: number
    org_name: string
    resource_count: number
    status: number
}

export interface ICommonList<T> {
    entries: T
    total_count: number
}

export interface IDemandItem {
    configured: number
    data_org_code: string
    data_org_name: string
    id: string
    res_code: string
    res_desc: string
    res_id: string
    res_name: string
    res_source: number
    res_type: number
    shared_type: number
}

// 过滤项
export interface IFilterItem {
    condition: string
    description: string
    item_name: string
    item_uuid: string
    value: string
}

// 信息项
export interface IInfoItem {
    column_name: string
    data_type: number
    description: string
    item_name: string
    item_uuid: string
    selected?: number
    column_status?: number
}

export interface IDemandItemConfig {
    access_ip?: string
    call_frequency?: number
    call_frequency_unit?: number
    created_at?: number
    created_by?: string
    data_org_code?: string
    data_org_name?: string
    data_push_time?: number
    data_space_range?: number
    data_time_range?: number
    filter_description?: string
    filter_items: IFilterItem[]
    id: number | string
    info_items: IInfoItem[]
    provide_type?: number
    res_code: string
    res_desc?: string
    res_id: string
    res_name: string
    res_source: number
    res_type: number
    res_version?: string
    service_end_time?: number
    service_life?: number
    shared_type?: number
    target_machine_id?: string
    target_machine_name?: string
    update_cycle?: number
    updated_at?: number
    updated_by?: string
    use_purpose?: string
    original_id?: string
    apply_desc?: string
    has_resource_desc?: string
    apply_status?: number
    has_resource?: number
}

// 分析结论
export interface IAnalysesConclusion {
    data_completion?: number
    data_completion_desc?: string
    data_content_match?: number
    data_content_match_desc?: string
    data_space_range?: number
    data_space_range_desc?: string
    data_timeliness?: number
    data_timeliness_desc?: string
    demand_feasibility?: number
    final_report?: string
    demand_feasibility_desc?: string
    audit_reject_desc?: string
}
// 分析数据 (包含需求项分析)
export interface IAnalysesInfo extends IAnalysesConclusion {
    analyse_items: IDemandItemConfig[]
    original_items: IDemandItemConfig[]
}

export interface ISaveAnalysesInfo extends IAnalysesInfo {
    save_op_type: number // 1保存  2提交
}

export interface IDemandCount {
    tag_filter: number
    count: number
}

export interface IRepository {
    created_at: number
    created_by_uid: string
    created_by_uname: string
    id: string
    res_code: string
    res_id: string
    res_name: string
    res_status: number
    state: number
    res_desc: string
}

export interface IRepositoryDetails {
    code: string
    columns: any
    data_range: string
    description: string
    id: string
    open_condition: string
    open_type: number
    orgcode: string
    orgname: string
    publish_flag: number
    shared_condition: string
    shared_type: number
    title: string
    update_cycle: string
    version: string
}

export interface IGetDemandAuditProcess {
    audit_type: string
}
export interface ICreateDemandAuditProcess extends IGetDemandAuditProcess {
    // 审核流程key
    proc_def_key: string
}

export interface IUpdateDemandAuditProcess extends IGetDemandAuditProcess {
    // 流程绑定ID
    id: string
}

// 1申请函件，2需求依据，3数据使用说明，4需求分析报告
export interface IDemandFile {
    file_name: string
    file_uuid: string
    id: string
    type: number
}
export interface IApplyFileItem {
    code: string
    reference_files: IDemandFile[]
}
export interface IUpdateDemandConfirm {
    apply_file_items: IApplyFileItem[]
    audit_result: number
    audit_result_desc: string
    demand_id: string
}

/**
 * 待申请目录
 */
export interface IApplicationCatalogItem {
    id: string
    res_id: string
    res_name: string
    res_description: string
    res_code: string
    res_type: ShareApplyResourceTypeEnum
    department_path: string
    // 是否上线
    is_online: boolean
}

/**
 * 共享申报
 */
export interface ISharedDeclarationItem {
    // 申请部门
    application_department: string
    // 申请ID
    application_id: string
    // 申请名称
    application_name: string
    // 申报编码
    code: string
    // 联系电话
    contact_number: string
    // 联系人
    contact_person: string
    // 创建时间
    created_at: number
    // 预期完成时间
    expected_completion_time: number
    // 状态
    status: string
}

/**
 * 共享申报目录信息
 */
export interface ISharedDeclarationCatalogInfo {
    // 申请类型 "support_business" "support_system_initialization" "complete_integration"
    application_type: string
    // 目录编码
    catalog_code?: string
    // 目录ID
    catalog_id: string
    // 目录名称
    catalog_name?: string
    // 数据范围 "全市" "市直" "区县"
    data_range: string
    // 数据资源ID
    data_resource_id: string
    // 数据资源名称
    data_resource_name?: string
    // 数据资源类型
    data_resource_type?: number
    // 数据库设计材料
    database_design_materials_ids: [
        {
            id: string
            name?: string
        },
    ]
    // 资源使用截止时间
    deadline_for_resource_utilization: number
    // 部门路径
    department_path?: string
    // 结束时间
    end_time: number
    // 期望调用频率
    expected_call_frequency: number
    // 期望更新频率 "实时" "每日" "每周" "每月" "每季度" "每半年" "每年" "其他"
    expected_update_frequency: string
    // 资源提供方式 "transaction" "interface"
    resource_provision_method: string
    // 开始时间
    start_time: number
}

/**
 * 共享申报详情
 */
export interface ISharedDeclarationDetail {
    // 业务应用领域
    application_area: string[]
    // 申请部门ID
    application_department_id: string
    // 申请部门名称
    application_department_name?: string
    // 申请描述
    application_description: string
    // 申请函件ID
    application_letter_id: string
    // 申请函件名称
    application_letter_name?: string
    // 申请名称
    application_name: string
    // 业务用途
    business_purpose: string
    // 申请编码
    code: string
    // 联系电话
    contact_number: string
    // 联系人
    contact_person: string
    // 目录信息
    declaration_catalog_info: ISharedDeclarationCatalogInfo[]
    // 预计应用成效
    expected_application_effectiveness: string
    // 期望完成时间
    expected_completion_time: number
    // 技术厂商联系人
    manufacturer_contact_person: string
    // 厂商联系人电话
    manufacturer_telephone: string
    // 关联应用系统描述
    related_application_system_description?: string
    // 关联应用系统ID
    related_application_system_id: string
    // 关联应用系统名称
    related_application_system_name?: string
    // 状态
    status?: string
}

/**
 * 共享申请状态
 */
export enum SharedDeclarationStatus {
    // 已经添加到待申请列表
    Added = 'added',
    // 已经申请过
    Applied = 'applied',
    // 没有申请过
    NotApplied = 'not_applied',
}

// 提供方式
export enum SupplyType {
    // 库表/库表
    View = 'view',
    // 接口
    API = 'api',
}

// 需求项列表
export interface CreateCityDemandItem {
    // 提供方式
    // supply_type?: SupplyType
    // 目录名称
    catalog_name: string
    // 数据范围
    data_range?: string
    // 更新周期
    update_cycle?: string
    // 信息项名称
    columns: string
}

// 创建供需请求
export interface CreateCityDemandRequest {
    // 供需名称
    title: string
    // 期望完成时间
    finish_date: number
    // 资源提供部门code
    supply_org_code: string
    // 供需描述
    description: string
    // 附件ID
    attachment_id?: string[]
    // 需求部门code
    apply_org_code: string
    // 需求联系人
    contact: string
    // 需求联系电话
    contact_phone: string
    // 需求联系邮箱
    contact_email?: string
    // 需求项列表
    items: CreateCityDemandItem[]
}

// 供需列表类型
export enum CityDemandListType {
    // 申请清单列表
    Applys = 'applys',
    // 分析列表
    Analysis = 'analysis',
    // 确认列表
    Confirm = 'confirm',
    // 实施列表
    Implement = 'implement',
    // 审核列表
    Audit = 'audit',
}

// 阶段
export enum PhaseType {
    // 需求申报
    Report = 'report',
    // 需求分析
    Analysis = 'analysis',
    // 需求资源确认
    Confirm = 'confirm',
    // 需求实施
    Implement = 'implement',
    // 需求完结
    Completed = 'completed',
}

// 供需状态
export enum CityDemandStatus {
    // 全部
    All = '',
    // 未申报
    UnReport = 'unreport',
    // 待签收
    SignOffPending = 'sign-off-pending',
    // 待分析
    AnalysisPending = 'analysis-pending',
    // 分析中
    Analysing = 'analysing',
    // 已分析
    Analysed = 'analysed',
    // 资源待确认
    ConfirmPending = 'confirm-pending',
    // 待实施
    Implementing = 'implementing',
    // 已删除
    Removed = 'removed',
    // 已完结
    Completed = 'completed',
}

// 审核状态
export enum CityDemandAuditStatus {
    // 申报审核中
    ReportAuditing = 'report-auditing',
    // 申报审核未通过
    ReportAuditReject = 'report-audit-reject',
    // 申报审核已撤销
    ReportAuditUndone = 'report-audit-undone',
    // 分析审核中
    AnalysisAuditing = 'analysis-auditing',
    // 分析审核未通过
    AnalysisAuditReject = 'analysis-audit-reject',
    // 分析审核已撤销
    AnalysisAuditUndone = 'analysis-audit-undone',
}

// 供需列表请求
export interface CityDemandRequest {
    // 列表类型
    target: CityDemandListType
    // 需求部门code
    apply_org_code?: string
    // 供需状态
    status?: CityDemandStatus
    // 期望完成时间开始
    finish_begin_time?: number
    // 期望完成时间结束
    finish_end_time?: number
    // 创建开始时间
    create_begin_time?: number
    // 创建结束时间
    create_end_time?: number
    // 偏移量
    offset?: number
    // 每页条数
    limit?: number
    // 关键字
    keyword?: string
    // 排序字段
    sort?: SortType
    // 排序方向
    direction?: SortDirection
}

// 供需列表项
export interface CityDemand {
    // 供需ID
    id: string
    // 供需名称
    title: string
    // 供需编码
    code: string
    // 供需状态
    status: CityDemandStatus
    // 审核状态
    audit_status: CityDemandAuditStatus
    // 需求部门code
    apply_org_code: string
    // 需求部门名称
    apply_org_name: string
    // 联系人
    contact: string
    // 联系电话
    contact_phone: string
    // 需求项总数
    total_item_num: number
    // 已提供项数
    supplied_item_num: number
    // 期望完成时间
    finish_date: number
    // 创建时间
    created_at: number
    // 驳回说明
    audit_reject_reason: string
}

// 供需列表响应
export interface CityDemandResponse {
    // 列表
    entries: CityDemand[]
    // 总条数
    total_count: number
}

// 进度信息列表
export interface CityDemandProcessInfo {
    // 进度信息
    phase: PhaseType
    // 处理人ID
    processor_id: string
    // 处理人名称
    processor: string
    // 所属部门code
    org_code: string
    // 所属部门名称
    org_name: string
    // 处理时间戳
    process_time: number
}

// 需求项
export interface CityDemandItem {
    // 需求项ID
    id: string
    // 目录名称
    catalog_name: string
    // 数据范围
    data_range: string
    // 更新周期
    update_cycle: string
    // 信息项名称
    columns: string
    // 分析结论
    conclusion: string
    // 是否提供
    is_provide: boolean
    // 不提供理由
    reject_provide_reason: string
    // 提供目录ID
    supply_catalog_id: string
    // 提供目录code
    supply_catalog_code: string
    // 提供目录名称
    supply_catalog_name: string
    // 提供库表ID
    supply_view_id: string
    // 提供库表code
    supply_view_code: string
    // 提供库表名称
    supply_view_name: string
    // 归集前置资源库表ID
    collect_view_id: string
    // 归集前置资源库表code
    collect_view_code: string
    // 归集前置资源库表名称
    collect_view_name: string
}

export interface IAttachment {
    // 附件ID
    attachment_id: string
    // 附件名称
    attachment_name: string
}

export interface CityDemandBasicInfo {
    // 需求ID
    id: string
    // 需求标题
    code: string
    // 需求标题
    title: string
    // 需求状态
    status: CityDemandStatus
    // 审核状态
    audit_status: CityDemandAuditStatus
    // 申请人ID
    applier_id: string
    // 申请人名称
    applier_name: string
    // 资源提供部门code
    supply_org_code: string
    // 资源提供部门名称
    supply_org_name: string
    // 期望完成时间
    finish_date: number
    // 附件列表
    attachments: IAttachment[]
    // 供需描述
    description: string
    // 需求部门code
    apply_org_code: string
    // 需求部门名称
    apply_org_name: string
    // 联系人
    contact: string
    // 联系电话
    contact_phone: string
    // 联系邮箱
    contact_email: string
    // 需求项信息列表
    items: CityDemandItem[]
    // 归集工单ID
    collect_id: string
}
// 供需详情
export interface CityDemandDetails {
    // 进度信息
    process_info: CityDemandProcessInfo[]
    // 需求信息
    basic_info: CityDemandBasicInfo
}

// 需求项分析
export interface DemandAnalysisItems {
    // 需求项ID
    id: string
    // 目录ID
    catalog_id?: string
    // 库表ID
    view_id?: string
    // 分析结论
    conclusion?: string
}

// 供需分析请求
export interface CityDemandAnalysisRequest {
    // 资源提供部门
    supply_org_code: string
    // 需求项列表
    items: DemandAnalysisItems[]
}

// 需求项确认
export interface DemandConfirmItems {
    // 需求项ID
    id: string
    // 是否提供
    is_provide: boolean
    // 不提供理由
    reject_provide_reason?: string
    // 待归集前置机库表库表ID，提供且未关联库表ID时必填
    collect_view_id?: string
}

// 供需确认请求
export interface CityDemandConfirmRequest {
    // 资源提供部门
    supply_org_code: string
    // 需求项列表
    items: DemandConfirmItems[]
}

// 需求项实施
export interface DemandImplementItems {
    // 需求项ID
    id: string
    // 提供目录ID
    catalog_id: string
}

// 供需实施请求
export interface CityDemandImplementRequest {
    // 需求ID
    id: string
    // 需求项列表
    items: DemandImplementItems[]
}

// 审批流程类型
export enum CityDemandAuditType {
    // 供需申报审核
    AFRequireReport = 'af_require_report',
    // 供需分析审核
    AFRequireAnalysis = 'af_require_analysis',
}

// 审核列表请求
export interface CityDemandAuditRequest {
    // 审核状态
    audit_type?: CityDemandAuditType
    // 偏移量
    offset?: number
    // 每页条数
    limit?: number
}

// 审核列表项
export interface CityDemandAudit {
    // 供需ID
    id: string
    // 需求标题
    title: string
    // 需求状态
    code: string
    // 审核状态
    audit_type: CityDemandAuditType
    // 需求部门code
    apply_org_code: string
    // 需求部门名称
    apply_org_name: string
    // 需求部门路径
    apply_org_path: string
    // 需求联系人姓名
    contact: string
    // 需求联系人电话
    contact_phone: string
    // 期望完成时间
    finish_date: number
    // 创建时间
    created_at: number
    // 审核实例ID
    audit_proc_inst_id: string
}

// 审核列表响应
export interface CityDemandAuditResponse {
    // 列表
    entries: CityDemandAudit[]
    // 总条数
    total_count: number
}

// 共享申请
// 共享申请状态
export enum ShareApplyStatus {
    // 全部
    All = '',
    // 未申报
    UnReport = 'unreport',
    // 待分析签收
    AnalysisSigningOff = 'analysis_signing_off',
    // 待分析
    AnalysisPending = 'analysis_pending',
    // 分析中
    Analysing = 'analysing',
    // 分析结论不可行
    AnalysisUnfeasible = 'analysis_unfeasible',
    // 分析结论待确认
    AnalysisConfirming = 'analysis_confirming',
    // 数据共享待确认
    AnalysisConfirmAuditing = 'analysis_confirm_auditing',
    // 已分析
    Analysed = 'analysed',
    // 待实施签收
    ImplementSigningOff = 'implement_signing_off',
    // 待实施
    ImplementPending = 'implement_pending',
    // 实施中
    Implementing = 'implementing',
    // 实施成果待确认
    ImplementAccepting = 'implement_accepting',
    // 实施方案制定中
    ImplementSolutionCreating = 'impl_solution_creating',
    // 实施方案确认中
    ImplementSolutionConfirming = 'impl_solution_confirming',
    // 已实施
    Implemented = 'implemented',
    // 已完结
    Closed = 'closed',
}

// 资源项实施标签
export enum ShareApplyImplTag {
    // 实施方案确认中
    ImplSolutionConfirming = 'impl-solution-confirming',
    // 实施方案未通过
    ImplSolutionConfirmReject = 'impl-solution-confirm-reject',
    // 实施成果确认中
    ImplementAchvConfirming = 'impl-achv-confirming',
    // 数据待推送
    PushPending = 'push-pending',
    // 数据推送中
    Pushing = 'pushing',
    // 数据推送失败
    PushFailed = 'push-failed',
}

// 共享申请审核状态
export enum ShareApplyAuditStatus {
    // 申报审核中
    ReportAuditing = 'report-auditing',
    // 申报审核未通过
    ReportAuditReject = 'report-audit-reject',
    // 申报审核已撤销
    ReportAuditUndone = 'report-audit-undone',
    // 分析审核中
    AnalysisAuditing = 'analysis-auditing',
    // 分析审核未通过
    AnalysisAuditReject = 'analysis-audit-reject',
    // 分析审核已撤销
    AnalysisAuditUndone = 'analysis-audit-undone',
    // 分析确认中
    AnalysisConfirming = 'analysis-confirming',
    // 分析确认未通过
    AnalysisConfirmReject = 'analysis-confirm-reject',
    // 数据共享确认中
    AnalysisConfirmAuditing = 'analysis-confirm-auditing',
    // 数据共享确认不通过
    AnalysisConfirmAuditReject = 'analysis-confirm-audit-reject',
    // 实施方案确认中
    ImplementSolutionConfirming = 'impl-solution-confirming',
    // 实施方案确认不通过
    ImplementSolutionConfirmReject = 'impl-solution-confirm-reject',
    // 反馈审核中
    FeedbackAuditing = 'feedback-auditing',
    // 反馈审核不通过
    FeedbackAuditReject = 'feedback-audit-reject',
}

// 共享申请审核类型
export enum ShareApplyAuditType {
    // 共享申报审核
    AFShareApplyReport = 'af_share_apply_report',
    // 共享分析结论审核
    AFShareApplyAnalysis = 'af_share_apply_analysis',
    // 共享成效反馈审核
    AFShareApplyFeedback = 'af_share_apply_feedback',
}

// 共享申请提交方式
export enum ShareApplySubmitType {
    // 暂存
    Draft = 'draft',
    // 提交
    Submit = 'submit',
}

// 共享申请资源类型
export enum ShareApplyResourceType {
    // 库表/库表
    View = 'view',
    // 接口
    API = 'api',
}

// 共享申请资源使用期限
export enum ShareApplyAvailableDateType {
    // 自定义日期
    CustomDate = -1,
    // 长期
    LongTerm = 0,
    // 30天
    ThirtyDays = 30,
    // 90天
    NinetyDays = 90,
    // 180天
    OneHundredEightyDays = 180,
}

// 共享申请分析结论
export enum ShareApplyFeasibility {
    // 可行
    Feasible = 'feasible',
    // 部分可行
    Partial = 'partial',
    // 不可行
    Unfeasible = 'unfeasible',
}

// 待补充内容类型，仅分析结果为不合理时选填
export enum ShareApplyAdditionalInfoType {
    // 数据源信息
    DataSource = 'data-source',
    // 数据用途
    Usage = 'usage',
    // 申请材料
    Attachment = 'attachment',
}

// 共享申请确认结果
export enum ShareApplyConfirmResult {
    // 通过
    Pass = 'pass',
    // 驳回
    Reject = 'reject',
}

// 库表配置
export interface IViewApplyConf {
    column_ids: string
    column_names: string
    data_res_id: string
    data_res_code: string
    data_res_name: string
    area_range: string
    time_range: string
    push_frequency: string
    new_dst_data_source: boolean
    dst_data_source_id: string
    dst_view_name: string
    push_type: string
    incr_field_id: string
    incr_start_time: number
    primary_field_id: string
}

// 接口配置
export interface IApiApplyConf {
    is_customized: boolean
    data_res_id: string
    data_res_code: string
    data_res_name: string
    data_res_type: string
    interface_desc: string
    call_frequency: number
}

// 共享申请资源配置
export interface IApplyConf {
    // 提供方式
    supply_type: ShareApplyResourceType
    available_date_type: number
    other_available_date: number
    view_apply_conf: IViewApplyConf
    api_apply_conf: IApiApplyConf
}

// 共享申请资源基础信息
export interface IResourceBasicInfo {
    // 资源类型
    res_type: ShareApplyResourceType
    // 资源清单项ID - 新增不填，编辑必填
    apply_item_id?: string
    // 资源ID（目录ID）
    res_id: string
}

// 共享申请资源
export interface IAddResource extends IResourceBasicInfo {
    // 申请资源配置
    apply_conf?: IApplyConf
}

// 共享申请基础信息
export interface IShareApplyBasicInfo {
    // 共享申请名称 新增必填，编辑不填
    name?: string
    // 业务应用领域，来自字典
    areas: string
    // 期望完成时间
    finish_date: number
    // 关联业务场景
    scene?: string
    // 关联业务事项
    matters?: string
    // 关联应用系统
    // system_id: string
    // 业务用途
    business_usage: string
    // 预期应用成效
    expect_effect: string
    // 申请函件/附件ID
    attachment_id: string
    // 申请部门code
    apply_org_code: string
    // 申请人
    applier: string
    // 申请人联系电话
    phone: string
    // 技术厂商联系人
    firm_contact: string
    // 技术厂商联系电话
    firm_contact_phone: string
}

// 新增共享申请请求
export interface IAddShareApply extends IShareApplyBasicInfo {
    // 提交方式
    submit_type: ShareApplySubmitType
    // 申请资源清单
    resources: IAddResource[]
}

// 分析资源
export interface IAnalysesResource {
    // 分析资源项ID，没有则不填
    id?: string
    // 是否新资源，即不是共享申请原始资源项
    is_new_res: boolean
    // 原始共享申请资源项ID，分析时添加的新资源无需该字段
    src_id?: string
    // 接口服务ID,如原始需求资源合理且为自定义接口有值
    api_id: string
    // 接口服务code,如原始需求资源合理且为自定义接口有值
    api_code: string
    // 接口服务名称,如原始需求资源合理且为自定义接口有值
    api_name: string
    // 分析结果
    is_reasonable: boolean
    // 待补充内容类型，仅分析结果为不合理时选填
    additional_info_types?: ShareApplyAdditionalInfoType
    // 申请材料补充说明，additional_info_types包含attachment时必填
    attach_add_remark?: string
    // 是否替换资源，仅分析结果为不合理时必填
    is_res_replace?: boolean
    // 分析后变更的原始需求资源申请信息项ids，多个用英文逗号分隔
    column_ids?: string
    // 分析后变更的原始需求资源申请信息项中文名称，多个用英文逗号分隔，顺序需要与column_ids一致
    column_names?: string
    // 替换或分析时新添加资源项ID，有则填
    new_id?: string
    // 替换或分析时新添加资源ID，仅当不合理且替换资源或添加新资源时需要
    new_res_id?: string
    // 替换或新资源code
    new_res_code?: string
    // 替换或新资源名称
    new_res_name?: string
    // 替换或分析时新添加资源类型 catalog 目录 api 接口
    new_res_type: string
    // 分析后新添加资源申请资源配置，仅当不合理且添加新资源时需要
    org_path: string
    apply_conf?: IApplyConf
    // 数据用途
    usage?: string
    // 补充申请材料
    attachments?: { id: string; name: string }[]
    // 是否提供
    is_supply?: boolean
    // 证明材料ID
    attachment_id?: string
}

export enum ShareApplyResourceTypeEnum {
    // 目录
    Catalog = 'catalog',
    // 接口
    Api = 'api',
}

// 分析信息
export interface IAnalysesShareApply {
    // 分析结论
    submit_type: ShareApplySubmitType
    // 分析结论 提交时必填
    feasibility?: ShareApplyFeasibility
    // 分析及结果确认 - 提交时必填
    conclusion?: string
    // 业务用途 - 提交时必填
    usage?: string
    // 分析资源列表 - 提交时必填
    resources?: IAnalysesResource[]
}

// 补充信息，有需要补充的则必填
export interface IAdditionalInfo {
    // 分析资源项ID
    id: string
    // 目标数据源ID，视需要补充的内容而定，如不需要补充直接带原始值
    dst_data_source_id?: string
    // 目标表ID，视需要补充的内容而定，如不需要补充直接带原始值
    dst_view_name?: string
    // 数据用途，视需要补充的内容而定，如不需要补充直接带原始值
    usage?: string
    // 申请材料ID列表，视需要补充的内容而定，如不需要补充直接带原始值
    attachment_id?: string[]
}

// 分析确认
export interface IAnalysesConfirm {
    // 补充信息，有需要补充的则必填
    additional_infos?: IAdditionalInfo[]
    // 确认结果
    confirm_result: ShareApplyConfirmResult
    // 确认结果说明，驳回时必填
    confirm_remark?: string
    // 关联应用系统ID
    app_id?: string
}

// 数据提供方审核信息
export interface ISupplyInfo {
    // 分析资源项ID
    id: string
    // 是否提供
    is_supply: boolean
    // 证明材料ID，不提供必填
    attachment_id?: string
}

// 数据提供方审核
export interface IAnalysisAudit {
    // 分析结论
    supply_infos: ISupplyInfo[]
    // 审核结果
    audit_result: ShareApplyConfirmResult
    // 确认结果说明，驳回时必填
    audit_remark?: string
    // 证明材料ID，驳回必填
    attachment_id?: string
    ds_audit_id: string
}

// 实施方案制定请求
export interface IImplementSolution {
    // 需要签收的分析资源项ID
    analysis_item_id: string
    // 推送参数，json字符串，所有推送配置相关参数按推送请求数据规则整合
    push_params: string
}

// 实施方案确认信息
export interface IConfirmInfo {
    // 需要签收的分析资源项ID
    analysis_item_id: string
    // 方案确认结果
    solution_confirm_result: ShareApplyConfirmResult
    // 确认结果说明，驳回时必填
    solution_confirm_remark?: string
}

// 实施方案确认请求
export interface IImplementSolutionConfirm {
    // 提交方式
    submit_type: ShareApplySubmitType
    // 实施方确认结果列表，提交时必填
    confirm_infos?: IConfirmInfo[]
}

export interface IShareApplyResource {
    // 资源项ID
    id: string
    // 资源类型
    res_type: ShareApplyResourceType
    // 资源ID
    res_id: string
    // 资源名称
    res_name: string
    // 资源code
    res_code: string
    // 申请资源配置
    apply_conf: IApplyConf
    org_path: string
}

// 共享申请信息
export interface IShareApplyBase extends IShareApplyBasicInfo {
    id: string
    code: string
    name: string
    areas: string
    finish_date: number
    scene: string
    matters: string
    app_id: string
    app_name: string
    app_account_name: string
    app_account_id: string
    business_usage: string
    expect_effect: string
    attachment_id: string
    attachment_name: string
    apply_org_code: string
    apply_org_name: string
    apply_org_path: string
    applier: string
    phone: string
    analyst: string
    analyst_phone: string
    firm_contact: string
    firm_contact_phone: string

    // 申请资源清单
    resources: IShareApplyResource[]
    // 状态
    status: ShareApplyStatus
    // 撤回申报原因
    cancel_reason: string
    // 申报审核驳回原因
    report_reject_reason: string
}

// 分析信息
export interface IShareApplyAnalysis {
    // 分析结论
    id: string
    // 分析结论
    feasibility: ShareApplyFeasibility
    // 分析结论
    conclusion: string
    // 业务用途
    usage: string
    // 分析资源列表
    resources: IAnalysesResource[]
    // 申请方确认结果
    confirm_result: ShareApplyConfirmResult
    // 申请方确认结果说明
    confirm_remark: string
    // 数据提供方审核结果
    audit_result: ShareApplyConfirmResult
    // 数据提供方审核结果说明
    audit_remark: string
    // 实施方案确认结果
    confirm_audit_result: ShareApplyConfirmResult
    // 实施方案确认结果说明
    confirm_audit_remark: string
    // 申请函件/附件ID
    attachment_id: string
}

// 共享申请实施信息

export interface IShareApplyImplement {
    // 分析资源项ID
    id: string
    // 接口URL，仅提供方式为接口服务有值
    api_url: string
    // 关联应用ID，仅提供方式为接口服务有值
    app_id: string
    // 关联应用名称，仅提供方式为接口服务有值
    app_name: string
    // 应用账号名称，仅提供方式为接口服务有值
    app_account_name: string
    // 应用账号ID，仅提供方式为接口服务有值
    app_account_id: string
    // 推送任务ID
    push_job_id: string
    is_publish: boolean
    sync_success: boolean
    sync_failed_reason: string
}

export interface ICommonFeedbackDetails {
    // 成效反馈结果
    feedback_status: FeedbackStatusEnum
    // 成效反馈结果说明
    feedback_at: number
    feedback_finish_date: number
    // 成效反馈说明
    feedback_remark: string
    // 成效反馈内容
    feedback_content: string
    feedback_reject_reason: string
}

// 成效反馈信息
export interface IShareApplyFeedback extends ICommonFeedbackDetails {}

export enum ShareApplyPhaseEnum {
    /** 需求申报 */
    Report = 'report',
    /** 分析完善 */
    Analysis = 'analysis',
    /** 分析结论确认 */
    AnalConfirm = 'anal-confirm',
    /** 数据共享确认 */
    DsAudit = 'ds-audit',
    /** 共享申请实施 */
    Implement = 'implement',
    /** 实施成果确认 */
    ImplAchvConfirm = 'impl-achv-confirm',
    /** 需求完结 */
    Completed = 'completed',
}

export enum ShareApplyProcessStatus {
    // 未开始
    Pending = 'pending',
    // 进行中
    Processing = 'processing',
    // 已完成
    Completed = 'completed',
}

export enum ShareApplyClosePhase {
    // 分析完善
    Analysis = 'analysis',
    // 数据共享确认
    DsConfirm = 'ds-confirm',
}

// 操作类型
export enum ShareApplyActionType {
    /** 需求创建 */
    Create = 'create',
    /** 需求编辑 */
    Edit = 'edit',
    /** 申报审核撤回 */
    ReportCancel = 'report-cancel',
    /** 申报审核 */
    ReportAudit = 'report-audit',
    /** 分析签收 */
    AnalSignoff = 'anal-signoff',
    /** 分析签收取消 */
    AnalSignoffCancel = 'anal-signoff-cancel',
    /** 分析 */
    Analysis = 'analysis',
    /** 分析结论审核 */
    AnalAudit = 'anal-audit',
    /** 分析结论确认 */
    AnalConfirm = 'anal-confirm',
    /** 数据提供方审核 */
    DsAudit = 'ds-audit',
    /** 实施签收 */
    ImplSignoff = 'impl-signoff',
    /** 实施方案制定 */
    ImplSoluCreate = 'impl-solu-create',
    /** 实施方案确认 */
    ImplSoluConfirm = 'impl-solu-confirm',
    /** 实施 */
    Implement = 'implement',
    /** 实施成果确认 */
    ImplAchvConfirm = 'impl-achv-confirm',
    /** 关闭 */
    Completed = 'completed',
}

// 进度信息
export interface IShareApplyProcessInfo {
    // 进度信息
    phase: ShareApplyPhaseEnum
    // 完成时间戳（ms）
    op_time: number
    // 处理状态
    status: ShareApplyProcessStatus
    // 人工关闭阶段，仅当phase为completed且人工关闭时有值
    close_phase: ShareApplyPhaseEnum
}

// 数据资源提供结论
export interface IResourceProvideConclusion {
    // 资源名称
    res_name: string
    // 是否提供 true-提供 false-不提供
    is_provide: boolean
}

// 操作记录扩展信息
export interface IShareApplyLogExtendInfo {
    // 操作结果，仅 申报审核、分析结论审核、分析结论确认、数据提供方审核 该字段有值
    // pass 通过 reject 驳回 undone 撤销
    audit_result: string
    // 审核意见，仅 分析结论确认、数据提供方审核 该字段可能有值
    audit_remark: string
    // 操作关联分析资源项ID列表，仅 数据提供方审核、实施签收、实施方案制定、实施方案确认、实施 该字段有值
    anal_item_ids: string[]
    // 审核申请ID，仅 申报审核、分析结论审核 该字段有值
    audit_apply_id: string
    // 数据资源提供结论列表，仅 数据提供方审核 该字段有值
    resource_conclusions?: IResourceProvideConclusion[]
    // 数据资源名称列表，仅 实施签收、实施方案制定、实施方案确认、实施 该字段有值
    resource_names?: string[]
    // 部门名称，仅 数据提供方审核 该字段可能有值
    org_name?: string
    // 部门路径，仅 数据提供方审核 该字段可能有值
    org_path?: string
}

// 操作记录
export interface IShareApplyOperateLog {
    // 操作人ID
    op_uid: string
    // 操作记录时间戳（ms）
    op_time: number
    // 操作类型
    action_type: ShareApplyActionType
    extend_info: IShareApplyLogExtendInfo
}

export interface IShareApplyUserInfo {
    // 用户ID
    id: string
    // 用户名称
    name: string
    parent_deps: {
        id: string
        name: string
    }[]
}

export interface IShareApplyAnalItemInfo {
    // 分析资源项ID
    anal_item_id: string
    // 数据资源名称（目录或注册接口）
    name: string
    // 是否提供，若无则不返
    is_supply: boolean
}

// 共享申请详情
export interface ISharedApplyDetail {
    // 共享申请信息
    base: IShareApplyBase
    // 分析信息
    analysis: IShareApplyAnalysis
    // 实施信息
    implement: IShareApplyImplement[]
    // 成效反馈信息
    feedback: IShareApplyFeedback
    // 进度信息列表
    process_info: IShareApplyProcessInfo[]
    log: IShareApplyOperateLog[]
    user_depts: IShareApplyUserInfo[]
    anal_items: IShareApplyAnalItemInfo[]
}
// 共享申请用户信息

// 基础搜索
export interface IBaseRequest {
    // 偏移量
    offset?: number
    // 每页条数
    limit?: number
    // 关键字
    keyword?: string
    // 排序方向
    direction?: SortDirection
    // 排序字段
    sort?: SortType
}

// 时间范围
export interface ITimeRangeRequest {
    // 创建/申请时间筛选（起始时间）
    create_begin_time?: number
    // 创建/申请时间筛选（结束时间）
    create_end_time?: number
    // 期望完成时间筛选（起始时间）
    finish_begin_time?: number
    // 期望完成时间筛选（结束时间）
    finish_end_time?: number
    // 数据提供方审核时间筛选（起始时间）
    anal_audit_begin_time?: number
    // 数据提供方审核时间筛选（结束时间）
    anal_audit_end_time?: number
    // 实施时间筛选（起始时间）
    impl_begin_time?: number
    // 实施时间筛选（结束时间）
    impl_end_time?: number
    // 需求完结时间筛选(起始时间)
    close_begin_time?: number
    // 需求完结时间筛选(结束时间)
    close_end_time?: number
}

// 查询相关接口
export interface IGetShareApplyRequest extends IBaseRequest, ITimeRangeRequest {
    // 申请部门code
    apply_org_code?: string
    // 状态
    status?: ShareApplyStatus | string
    // 资源类型
    res_type?: ShareApplyResourceType
    // 审核类型
    audit_type?: ShareApplyAuditType
    // 是否查询所有数据
    is_all?: boolean
}

// 共享申请列表项
export interface IShareApplyItem {
    // 共享申请ID
    id: string
    // 共享申请code
    code: string
    // 共享申请名称
    name: string
    // 状态
    status?: ShareApplyStatus
    // 申请部门名称
    audit_status?: ShareApplyAuditStatus
    // 申报审核驳回原因
    reject_reason?: string
    // 申请部门code
    apply_org_code: string
    // 申请部门名称
    apply_org_name: string
    // 申请部门路径
    apply_org_path: string
    // 申请联系人姓名
    applier: string
    // 联系电话
    phone: string
    // 库表/库表资源个数
    view_num: number
    // 接口个数
    api_num: number
    // 创建/申请时间戳
    created_at: number
    // 期望完成时间
    finish_date: number
    // 分析人员ID
    analyser_id?: string
    // 审核实例ID
    audit_proc_inst_id?: string
    // 创建人ID
    created_by?: string
    // 分析人员ID
    analyser_id?: string
    feedback_status: FeedbackStatusEnum
}

// 共享申请列表响应
export interface IGetShareApplyResponse {
    // 共享申请列表
    entries: IShareApplyItem[]
    // 总数
    total_count: number
}

// 共享申请资源列表项
export interface IShareApplyByIDItem {
    // 分析资源项ID
    id: string
    // 数据资源ID
    data_res_id: string
    // 数据资源code
    data_res_code: string
    // 数据资源名称
    data_res_name: string
    // 提供方式
    supply_type: ShareApplyResourceType
    // 实施状态
    status?: ShareApplyStatus
    // 资源项实施标签
    impl_tag?: ShareApplyImplTag
    // 申报审核驳回原因
    reject_reason?: string
    // 数据推送失败原因
    push_failed_reason?: string
    // 所属数据目录ID
    res_id: string
    // 所属数据目录code
    res_code: string
    // 所属数据目录名称
    res_name: string
    // 数据提供部门code
    org_code: string
    // 数据提供部门名称
    org_name: string
    // 数据提供部门路径
    org_path: string
    // 申请联系人姓名
    applier: string
    // 联系电话
    phone: string
    // 库表/库表资源个数
    view_num: string
    // 接口个数
    api_num: string
    // 创建/申请时间戳
    created_at: number
    // 期望完成时间
    finish_date: number
    // 实施方案ID
    implement_id: string
    // 实施人名称
    implement_name: string
}

// 19. 共享申请资源列表响应
export interface IGetShareApplyByIDResponse {
    // 共享申请列表
    entries: IShareApplyByIDItem[]
    // 总数
    total_count: number
}

// 共享申请实施请求
export interface IImplementCityShareApply {
    // 分析资源项ID
    analysis_item_id: string
    // 推送参数，json字符串，所有推送配置相关参数按推送请求数据规则整合
    push_params: IUpdateDataPushParams
}

// 共享申请实施成果确认请求
export interface IImplementCityShareApplyConfirm {
    // 提交方式
    submit_type: 'draft' | 'submit'
    // 实施方案确认结果列表，提交时必填
    confirm_infos?: IConfirmInfo[]
}

export enum ImplementCatalogStatus {
    // 数据提供方审核
    DS_AUDIT = 'ds-audit',
    // 实施方案制定
    IMPL_SOLU_CONFIRM = 'impl-solu-confirm',
    // 实施方案确认
    IMPL_ACHV_CONFIRM = 'impl-achv-confirm',
}
export interface IImplementCityShareApplyDetail {
    // 实施方案ID
    view: ImplementCatalogStatus
    // 实施方案名称
    ds_audit_id?: string
}
// 实施方案资源
export interface IShareApplyConfirmResource extends IShareApplyResource {
    // 资源类型
    supply_type: ShareApplyResourceType
    // 变更的申请信息项ids，多个用英文逗号分隔
    column_ids: string
    // 变更的申请信息项中文名称，多个用英文逗号分隔，顺序需要与column_ids一致
    column_names: string
    // 数据范围
    data_range: string
    // 更新周期
    update_cycle: string
    // 实施方案确认结果
    solution_confirm_result: ShareApplyConfirmResult
    // 数据资源ID
    data_res_id: string
}
// 实施方案成果确认响应
export interface ImplementCityShareApplyDetailResult {
    // 共享申请ID
    id: string
    // 共享申请名称
    name: string
    // 共享申请code
    code: string
    // 申请联系人姓名
    applier: string
    // 业务应用领域
    area: string
    // 期望完成时间
    finish_date: number
    // 应用场景
    scene: string
    // 涉及问题
    matters: string
    // 关联应用ID
    app_id: string
    // 关联应用名称
    app_name: string
    // 关联应用账号名称
    app_account_name: string
    // 关联应用账号ID
    app_account_id: string
    // 业务用途
    business_usage: string
    // 预期效果
    expect_effect: string
    // 申请函件/附件ID
    attachment_id: string
    // 申请函件/附件名称
    attachment_name: string
    // 申请部门code
    apply_org_code: string
    // 申请部门名称
    apply_org_name: string
    // 申请部门路径
    apply_org_path: string
    // 申请联系人姓名
    applier: string
    // 联系电话
    phone: string
    // 分析人员姓名
    analyst: string
    // 分析人员联系电话
    analyst_phone: string
    // 技术厂商联系人
    firm_contact: string
    // 技术厂商联系电话
    firm_contact_phone: string
    // 创建时间
    created_at: number
    // 实施方案资源
    resources: IShareApplyConfirmResource[]
}

// 资源项
export interface ISourceItem {
    // 资源项ID
    id?: string
    // 资源ID
    res_id?: string
    // 资源code
    res_code?: string
    // 资源名称
    res_name?: string
    // 资源类型
    res_type?: string
    // 资源路径
    org_path?: string
    // 申请资源配置
    apply_conf?: IApplyConf
    // 共享条件
    shared_condition?: string
}

export interface IShareAnalysisItem {
    // 分析资源项ID
    id?: string
    // 是否新资源，即不是共享申请原始资源项
    is_new_res?: boolean
    // 原始共享申请资源项ID，分析时添加的新资源无需该字段
    src_id?: string
    // 接口服务ID
    api_id?: string
    // 接口服务code
    api_code?: string
    // 接口服务名称
    api_name?: string
    // 是否合理
    is_reasonable?: boolean
    // 待补充内容类型
    additional_info_types?: ShareApplyAdditionalInfoType
    // 申请材料补充说明
    attach_add_remark?: string
    // 是否替换资源
    is_res_replace?: boolean
    // 分析后变更的原始需求资源申请信息项ids，多个用英文逗号分隔
    column_ids?: string
    // 分析后变更的原始需求资源申请信息项中文名称，多个用英文逗号分隔，顺序需要与column_ids一致
    column_names?: string
    // 替换或分析时新添加资源项ID，有则填
    new_id?: string
    // 替换或分析时新添加资源ID，仅当不合理且替换资源或添加新资源时需要
    new_res_id?: string
    // 替换或新资源code
    new_res_code?: string
    // 替换或新资源名称
    new_res_name?: string
    // 资源类型
    new_res_type?: string
    // 资源路径
    org_path?: string
    // 申请资源配置
    apply_conf?: IApplyConf
}
// 共享申请分析详情
export interface IShareApplyAnalysisDetail {
    // 资源项
    src_item: ISourceItem
    // 分析资源项
    analysis: IShareAnalysisItem
    // 实施信息
    implement: IShareApplyImplement
}

// 数据分析需求 --- start

// 提交方式
export enum DataAnalSubmitType {
    // 暂存
    DRAFT = 'draft',
    // 提交
    SUBMIT = 'submit',
}

// 委托方式
export enum DataAnalCommissionType {
    // 委托型
    COMMISSION_BASED = 'commission-based',
    // 自助型
    SELF_SERVICE = 'self-service',
}

// 分析结论
export enum DataAnalFeasibility {
    // 可行
    FEASIBLE = 'feasible',
    // 部分可行
    PARTIAL = 'partial',
    // 不可行
    UNFEASIBLE = 'unfeasible',
}

// 确认结果
export enum DataAnalResult {
    // 通过
    PASS = 'pass',
    // 驳回
    REJECT = 'reject',
}

// 数据分析需求状态
export enum DataAnalRequireStatus {
    // 全部
    All = '',
    // 未申报
    UnReport = 'unreport',
    // 待分析签收
    AnalysisSigningOff = 'analysis_signing_off',
    // 待分析
    AnalysisPending = 'analysis_pending',
    // 分析中
    Analysing = 'analysing',
    // 已分析
    Analysed = 'analysed',
    // 分析结论不可行
    AnalysisUnfeasible = 'analysis_unfeasible',
    // 分析结论待确认
    AnalysisConfirming = 'analysis_confirming',
    // 待实施签收
    ImplementSigningOff = 'implement_signing_off',
    // 待实施
    ImplementPending = 'implement_pending',
    // 实施中
    Implementing = 'implementing',
    // 已实施
    Implemented = 'implemented',
    // 实施成果待确认
    ImplementAccepting = 'implement_confirming',
    // 分析成果待编目
    CatalogPending = 'catalog_pending',
    // 编目中
    Cataloging = 'cataloging',
    // 分析成果待出库
    OutboundPending = 'outbound_pending',
    // 分析成果待推送
    PushPending = 'push_pending',
    // 分析成果推送中
    DataPushing = 'data_pushing',
    // 已完结
    Closed = 'closed',
    // 分析成果列表status参数
    // 待确认
    ImpConfirming = 'implement_confirming',
    // 已确认
    ImpConfirmed = 'implement_confirmed',
}

// 数据分析需求审核状态
export enum DataAnalAuditStatus {
    // 申报审核中
    ReportAuditing = 'report-auditing',
    // 申报审核未通过
    ReportAuditReject = 'report-audit-reject',
    // 申报审核已撤销
    ReportAuditUndone = 'report-audit-undone',
    // 分析审核中
    AnalysisAuditing = 'analysis-auditing',
    // 分析审核未通过
    AnalysisAuditReject = 'analysis-audit-reject',
    // 反馈审核中
    FeedbackAuditing = 'feedback-auditing',
    // 反馈审核不通过
    FeedbackAuditReject = 'feedback-audit-reject',
    //  实施(分析成果)确认未通过
    ImplementConfirmReject = 'impl-comfirm-reject',
    // 出库审核中
    OutboundAuditing = 'outbound-auditing',
    // 出库审核不通过
    OutboundAuditReject = 'outbound-audit-reject',
}

// 审批流程类型，默认所有审核类型
export enum DataAnalAuditType {
    //  数据分析需求申报审核
    AfDataAnalRequireReport = 'af_data_anal_require_report',
    // 数据分析需求分析结论审核
    AfDataAnalRequireAnalysis = 'af_data_anal_require_analysis',
    // 数据分析需求分析成果出库审核
    AfDataAnalRequireOutbound = 'af_data_anal_require_outbound',
    // 数据分析需求成效反馈审核
    AfDataAnalRequireFeedback = 'af_data_anal_require_feedback',
}

// 分析场景产物目录字段
export interface IAnalOutputItemColumn {
    // 场景产物目录字段关联记录项ID，如有需要传 编辑时
    id?: string
    // 目录信息项ID，从数据目录添加必填，从添加字段来的不传或传null
    column_id?: string
    // 信息项对应库表字段ID，从添加字段来的不传或传null
    field_id?: string
    // 字段中文名称
    name_cn: string
    // 字段英文名称
    name_en: string
    // 关联数据标准ID/CODE
    data_std_code?: string
    // 关联数据标准名称
    data_std_name?: string
    // 关联码表ID/CODE
    dict_code?: string
    // 关联码表名称
    dict_name?: string
    // 关联编码规则ID/CODE
    rule_code?: string
    // 关联编码规则名称
    rule_name?: string
    // 值域
    ranges?: string
    // 数据类型
    data_type: string
    // 数据长度
    data_length?: number
    // 是否主键
    is_pk: boolean
    // 是否必填
    is_mandatory: boolean
    // 是否增量字段
    is_increment_field: boolean
    // 是否标准
    is_standardized: boolean
    // 字段关系
    field_rel?: string
}

// 分析场景产物目录信息
export interface ICatalog {
    // 场景产物目录关联记录项ID，如有需要传 编辑时
    id?: string
    // 来源目录ID
    catalog_id?: string
    // 来源目录CODE
    catalog_code?: string
    // 来源目录名称
    catalog_name?: string
    // 来源库表ID
    view_id?: string
    // 来源库表CODE
    view_code?: string
    // 来源库表业务名称
    view_busi_name?: string
    // 来源库表技术名称
    view_tech_name?: string
    // 关联字段列表
    columns: IAnalOutputItemColumn[]
}

// 分析场景产物
export interface IAnalOutputItem {
    // 分析场景产物ID，如有需要传 编辑时
    id?: string
    // 分析场景产物名称
    name: string
    // 关联目录信息列表
    catalogs: ICatalog[]
}

// 数据分析需求创建/编辑请求参数
export interface IDataAnalRequire {
    // 提交方式
    submit_type: DataAnalSubmitType
    // 需求名称,新增必填,编辑不填
    name?: string
    // 委托方式
    commission_type: DataAnalCommissionType
    // 期望完成时间戳（ms）
    finish_date: number
    // 分析场景产物类型，多个用英文逗号分隔
    output_type: string
    // 业务场景描述
    business_scene: string
    // 预期应用成效
    expect_effect: string
    // 附件IDs，多个用英文逗号分隔,委托型必填，自助型选填
    attachment_ids?: string
    // 申请部门code
    apply_org_code: string
    // 需求联系人（姓名）
    contact: string
    // 需求联系人电话
    contact_phone: string
    // 分析场景产物列表,仅自助型必填，委托型不传或传null
    anal_output_items?: IAnalOutputItem[]
}

// 分析请求参数
export interface IDataAnalAnalysis {
    // 提交方式
    submit_type: DataAnalSubmitType
    // 分析记录ID，仅第一次分析不用填，后续多次分析或驳回后再分析需要填
    analysis_id?: string
    // 分析结论，提交时必填
    feasibility?: DataAnalFeasibility
    // 分析及结果确认，提交时必填
    conclusion?: string
    // 分析场景产物列表，仅委托型必填，自助型不传或传null
    anal_output_items?: IAnalOutputItem[]
}

// 确认请求参数
export interface IDataAnalConfirm {
    // 确认结果
    confirm_result: DataAnalResult
    // 确认结果说明，驳回时必填
    confirm_remark?: string
}

// 实施请求参数
export interface IDataAnalImplement {
    // 库表ID
    view_id: string
    // 所属数据源ID，仅自助型有值，委托型无该字段
    datasource_id: string
    // 所属数据源名称，仅自助型有值，委托型无该字段
    datasource_name: string
    // 是否需要编目，仅自助型有值，委托型无该字段
    is_catalog: boolean
}

// 查询列表请求参数
export interface IDataAnalListRequest extends IBaseRequest, ITimeRangeRequest {
    // 委托方式
    commission_type?: DataAnalCommissionType
    // 需求状态
    status?: DataAnalRequireStatus
    // 是否只看我的需求
    only_mine?: boolean
}

export interface IDataAnalOutboundListRequest
    extends IBaseRequest,
        ITimeRangeRequest {
    commission_type: DataAnalCommissionType
    status: DataAnalResultOutboundApplyStatusEnum
}
// 查询详情请求参数
export interface IDataAnalDetailRequest {
    // 查询详情信息返回字段：base，analysis，implement组合传入
    fields: string
    // 分析记录ID
    analysis_id?: string
}

// 数据分析需求详情基础信息
export interface IDataAnalRequireBase {
    // 数据分析需求ID
    id: string
    // 数据分析需求CODE
    code: string
    // 需求名称
    name: string
    // 委托方式
    commission_type: DataAnalCommissionType
    // 期望完成时间戳
    finish_date: number
    // 分析场景产物类型
    output_type: string
    // 业务场景描述
    business_scene: string
    // 预期应用成效
    expect_effect: string
    // 附件信息
    attachments: {
        id: string
        name: string
    }[]
    // 申请部门code
    apply_org_code: string
    // 申请部门名称
    apply_org_name: string
    // 申请部门路径
    apply_org_path: string
    // 需求联系人
    contact: string
    // 联系电话
    contact_phone: string
    // 分析场景产物列表
    anal_output_items: IAnalOutputItem[]
    analyser_id: string
    analyser_name: string
    implementer_id: string
    implementer_name: string
    // 申报驳回理由
    report_reject_reason: string
    // 撤回理由
    cancel_reason: string
    // 分析审核未通过理由
    anal_audit_reject_reason: string
    // 分析确认未通过理由
    anal_confirm_reject_reason: string
    // 审核状态
    audit_status: DataAnalAuditStatus
    impl_confirm_reject_reason?: string
}

// 数据分析需求列表项
export interface IDataAnalRequireItem {
    // 数据分析需求ID
    id: string
    // 数据分析需求CODE
    code: string
    // 需求名称
    name: string
    // 申请部门code
    apply_org_code: string
    // 申请部门名称
    apply_org_name: string
    // 申请部门路径
    apply_org_path: string
    // 需求联系人
    contact: string
    // 联系电话
    contact_phone: string
    // 委托方式
    commission_type: DataAnalCommissionType
    // 创建/申请时间戳
    created_at: number
    // 创建/申请人ID
    created_by: string
    // 期望完成时间戳
    finish_date: number
    // 状态
    status?: DataAnalRequireStatus
    // 审核状态
    audit_status?: DataAnalAuditStatus
    // 审批流程实例ID
    audit_proc_inst_id?: string
    // 出库审核驳回理由
    outbound_reject_reason?: string
    // 成效反馈审核驳回理由
    feedback_reject_reason?: string
}

// 数据分析需求列表响应
export interface IDataAnalRequireListResponse {
    // 总数
    total_count: number
    // 列表数据
    entries: IDataAnalRequireItem[]
}

// 数据分析需求详情
export interface IDataAnalRequireDetail {
    // 基础信息
    base: IDataAnalRequireBase
    // 分析信息
    analysis?: IDataAnalAnalysisInfo
    // 实施信息
    implement?: IDataAnalImplementInfo[]
    // 成效反馈信息
    feedback: ICommonFeedbackDetails
}

// 分析信息
export interface IDataAnalAnalysisInfo {
    // 分析记录ID
    id: string
    // 分析结论
    feasibility: DataAnalFeasibility
    // 分析及结果确认
    conclusion: string
    // 分析结论审核结果
    audit_result?: DataAnalResult
    // 分析结论审核说明
    audit_remark?: string
    // 分析结论确认结果
    confirm_result?: DataAnalResult
    // 分析结论确认说明
    confirm_remark?: string
    // 分析场景产物列表
    anal_output_items?: IAnalOutputItem[]
}

// 实施信息
export interface IDataAnalImplementInfo {
    // 分析场景产物ID，对应analysis.anal_output_item[].id，仅委托型有值
    anal_output_item_id?: string
    // 融合库表ID
    view_id: string
    // 融合库表CODE
    view_code: string
    // 融合库表业务名称
    view_busi_name: string
    // 融合库表技术名称
    view_tech_name: string
    // 所属数据源ID，仅自助型有值
    datasource_id?: string
    // 所属数据源名称，仅自助型有值
    datasource_name?: string
    // 库表描述，仅自助型有值
    description?: string
    // 数据是否出库，仅自助型有值
    is_catalog?: boolean
    // 融合库表字段
    info_items?: {
        // 字段中文（业务）名称
        name_cn: string
        // 字段英文（技术）名称
        name_en: string
    }[]
    fields?: {
        // 字段中文（业务）名称
        name_cn: string
        // 字段英文（技术）名称
        name_en: string
    }[]
    // 分析成果记录ID
    id: string
    catalog_id: string
    catalog_code: string
    catalog_name: string
    // 成果是否可以使用，仅委托型有
    is_usable: boolean
    // 理由说明，仅委托型有
    use_remark: string
    is_catalog: boolean
    // 融合工单ID，仅委托型有
    data_fusion_id: string
    // 数据推送工单ID
    data_push_id: string
    org_code: string
    org_name: string
    org_path: string
    // 成果使用配置
    use_conf: IDataAnalResultUseConfig
    // 工单状态
    work_order_status?: string
    // 工单ID
    work_order_id?: string
}

export interface IStartFeedbackCommonParams {
    // 反馈时间
    feedback_finish_date: number
    // 反馈说明
    feedback_remark: string
}

export interface IStartFeedbackParams extends IStartFeedbackCommonParams {
    // 共享申请ID
    share_apply_ids: string[]
}

export interface IStartDataAnalFeedbackParams
    extends IStartFeedbackCommonParams {
    // 数据分析需求ID
    data_anal_req_ids: string[]
}

export enum FeedbackTargetEnum {
    // 发起成效反馈-待发起反馈列表（仅运营角色）
    StartPending = 'start-pending ',
    // 发起成效反馈-已发起反馈列表（仅运营角色）
    Started = 'feedback-started',
    //  处理成效反馈列表（仅共享申请创建人）
    Process = 'feedback-process',
}

export enum FeedbackStatusEnum {
    // 待发起成效反馈
    StartPending = 'feedback-start-pending',
    // 待成效反馈（待处理）
    Pending = 'feedback-pending',
    // 成效反馈中（进行中）
    Feedbacking = 'feedbacking',
    // 成效反馈完成（已完成）
    Finished = 'feedback-finished',
}

export interface ICommonFeedbackListParams {
    offset?: number
    limit?: number
    keyword?: string
    direction?: string
    sort?: string
    target: FeedbackTargetEnum
    feedback_status?: FeedbackStatusEnum
}

export interface IShareApplyFeedbackListParams
    extends ICommonFeedbackListParams {}

export enum FeedbackAuditStatusEnum {
    // 成效反馈审核中
    Pending = 'feedback-auditing',
    // 成效反馈审核不通过
    Reject = 'feedback-audit-reject',
}

export interface IShareApplyFeedbackItem {
    id: string
    code: string
    name: string
    audit_status: FeedbackAuditStatusEnum
    apply_org_code: string
    apply_org_name: string
    apply_org_path: string
    applier: string
    phone: string
    view_num: number
    api_num: number
    created_at: number
    feedback_at: number
    feedback_content: string
    feedback_reject_reason: string
}

export interface IShareApplyFeedbackListResponse {
    total_count: number
    entries: IShareApplyFeedbackItem[]
}

export enum DataAnalResultOutboundApplyStatusEnum {
    // 待申请
    OutboundPending = 'outbound_pending',
    // 已申请
    Outbound = 'outbound',
}

export interface IDataAnalResultUseConfig {
    // 提供方式 view 库表交换
    supply_type: string
    // 申请信息项ids （json字符串）数组字符串
    column_ids: string
    // 申请信息项中文名称（json字符串）数组字符串，顺序需要与column_ids一致
    column_names: string
    // 期望空间范围
    area_range: string
    // 期望时间范围类型 select 选择日期 self-define 自定义日期
    time_range_type: string
    // 期望时间范围
    time_range: string
    push_frequency: string
    available_date_type: number
    // 自定义日期，available_date_type为-2时必填
    other_available_date: number
    // 目标数据源ID
    dst_data_source_id: string
    // 目标表名称
    dst_view_name: string
    // 推送机制，full 全量 incr 增量
    push_type: string
}

export interface IDataAnalImplementConfirmParams {
    // 确认结果
    confirm_result: DataAnalResult
    // 确认结果说明，驳回时必填
    confirm_remark?: string
    // 分析场景产物成果确认列表
    entries: IDataAnalImplementConfirmItem[]
}

export interface IDataAnalImplementConfirmItem {
    // 分析成果记录ID
    id: string
    // 成果是否可以使用
    is_usable: boolean
    // 理由说明，不可使用时必填
    use_remark?: string
    use_conf: IDataAnalResultUseConfig
}
export interface IDataAnalCatalogItem {
    // 数据分析需求ID
    id: string
    code: string
    name: string
    output_item_num: number
    apply_org_code: string
    apply_org_name: string
    apply_org_path: string
    commission_type: string
    finish_date: number
    created_at: number
}

export interface IDataAnalCatalogListResponse {
    total_count: number
    entries: IDataAnalCatalogItem[]
}

export enum DataAnalCatalogPublishStatusEnum {
    Unpublished = 'unpublished ',
    Published = 'published',
    PubAuditing = 'pub-auditing',
    PubReject = 'pub-reject',
    // 变更审核中
    ChangeAuditing = 'change-auditing',
    // 变更审核未通过
    ChangeReject = 'change-reject',
    Null = '',
}
export interface IDataAnalCatalogOutputItem {
    anal_output_item_id: string
    res_type: string
    view_id: string
    view_busi_name: string
    view_tech_name: string
    org_code: string
    org_name: string
    org_path: string
    catalog_code: string
    catalog_name: string
    catalog_id: string
    publish_status: DataAnalCatalogPublishStatusEnum
    audit_advice: string
}

export interface IDataAnalPushConfirmListRequest
    extends IBaseRequest,
        ITimeRangeRequest {
    apply_org_code: string
    commission_type: DataAnalCommissionType
}

export interface IDataAnalPushConfirmItem {
    id: string
    code: string
    name: string
    apply_org_code: string
    apply_org_name: string
    apply_org_path: string
    commission_type: DataAnalCommissionType
    finish_date: number
    created_at: number
    created_by: string
    contact: string
    contact_phone: string
}

export interface IDataAnalFeedbackItem {
    id: string
    code: string
    name: string
    audit_status: FeedbackAuditStatusEnum
    apply_org_code: string
    apply_org_name: string
    apply_org_path: string
    applier: string
    phone: string
    commission_type: DataAnalCommissionType
    output_item_num: number
    created_at: number
    feedback_at: number
    feedback_content: string
    feedback_reject_reason: string
}

export interface IDataAnalFeedbackCount {
    // 待（成效反馈）处理数量
    feedback_pending_num: number
    // （成效反馈）已完成数量
    feedback_finished_num: number
    // （成效反馈）进行中数量
    feedbacking_num: number
}

export interface IDataAnalOutboundItem {
    // 分析成果记录ID
    id: string
    // 成果使用配置，可以使用时必填
    use_conf: IDataAnalResultUseConfig
}

// 系统接入状态
export enum SystemAccessStatus {
    // 全部
    All = '',
    // 已启用
    Enabled = 'enabled',
    // 已停用
    Disabled = 'disabled',
}

// 接口订阅查询接口
export interface IGetApiSubListParams {
    // 页码，默认1
    offset?: number
    // 每页size，默认10
    limit?: number
    // 关键字，模糊匹配接口服务名称
    keyword?: string
    // 排序类型
    sort?: string
    // 排序方向
    direction?: SortDirection
    // 接入部门code
    apply_org_code?: string
    // 服务/接口资源所属部门code
    org_code?: string
    // 接入系统ID
    system_id?: string
    // 接入应用ID
    app_id?: string
    // 启用状态, enabled 已启用  disabled 已停用
    status?: SystemAccessStatus
    // 创建/接入时间筛选（起始时间）
    create_begin_time?: number
    // 创建/接入时间筛选（结束时间）
    create_end_time?: number
}

export interface IpAddr {
    ip: string
    port: number
}

export interface IGetApiSubListResponse {
    // 接口订阅记录ID
    id: string
    // 服务ID
    api_id: string
    // 服务名称
    api_name: string
    // 服务所属部门code
    org_code: number
    // 服务所属部门名称
    org_name: number
    // 服务所属部门路径
    org_path: string
    // 接入部门code
    apply_org_code: string
    // 接入部门名称
    apply_org_name: string
    // 接入部门路径
    apply_org_path: string
    // 接入系统ID
    system_id: string
    // 接入系统名称
    system_name: string
    // 接入应用ID
    app_id: string
    // 接入应用名称
    app_name: string
    // 接入IP及端口
    ip_addr: IpAddr[]
    // 接入时间
    created_at: number
    // 启用/停用时间
    enable_disable_at: number
    // 使用期限开始时间
    start_at: number
    // 使用期限结束时间
    stop_at: number
    // 启用/停用状态
    status: SystemAccessStatus
    // 调用频率
    call_frequency: number
}

// 数据资源需求概览--start
// 需求类型
export enum DemandType {
    // 共享申请
    ShareApply = 'share-apply',
    // 供需对接
    Require = 'require',
    // 数据分析需求
    DataAnalysis = 'data-analysis',
}

// 需求总览接口
export interface IOverviewList {
    // 需求总数
    total_num: number
    // 处理中需求数
    processing_num: number
    // 已完成需求数
    finished_num: number
    // 列表数据
    entries: IOverviewItem[]
}

// 不同类型需求统计汇总列表
export interface IOverviewItem {
    // 需求类型
    demand_type: DemandType
    // 需求总数
    total_num: number
    // 处理中需求数
    processing_num: number
    // 已完成需求数
    finished_num: number
    // 需求数占比，区间为[0,100]
    rate: string
}

// 部门申请需求统计接口
export interface IApplyStatisticList {
    // 列表数据
    entries: IApplyStatisticItem[]
    // 总数
    total_num: number
}

// 部门申请需求统计接口
export interface IApplyStatisticItem {
    // 部门code
    org_code: string
    // 部门名称
    org_name: string
    // 需求总数
    apply_num: number
    // 需求数占比，区间为[0,100]
    rate: string
}

// 部门已完成需求统计接口
export interface IProcStatisticList {
    // 列表数据
    entries: IProcStatisticItem[]
    // 总数
    total_num: number
}

// 部门已完成需求统计接口
export interface IProcStatisticItem {
    // 部门code
    org_code: string
    // 部门名称
    org_name: string
    // 已完成需求数
    finished_num: number
}

// 需求处理时长分布统计接口
export interface IProcTimeStatisticList {
    // 列表数据
    entries: IProcTimeStatisticItem[]
}

// 需求处理时长分布统计接口
export interface IProcTimeStatisticItem {
    // 需求类型
    demand_type: DemandType
    // 处理时长分布统计结果
    statistic_info: {
        // 处理时长（天数）
        process_days: number
        // 已完成需求数量
        finished_num: number
    }
}

// 数据资源需求概览--end

// ----------------------------个人中心-我的资源 start--------------------------------

// 我的资源申请通过的库表列表项
export interface IAppliedViewItem {
    catalog_id: string
    catalog_code: string
    catalog_name: string
    is_catalog_online: boolean
    res_id: string
    res_name: string
    res_tech_name: string
    res_code: string
    supply_org_code: string
    supply_org_name: string
    supply_org_path: string
}

export interface IAppliedApiItem {
    catalog_id: string
    catalog_code: string
    catalog_name: string
    is_catalog_online: boolean
    res_id: string
    res_name: string
    res_code: string
    // 资源是否上线，仅注册接口有返回
    is_res_online: boolean
    // 接口类型 service_register 注册接口 service_generate 生成接口
    api_type: string
    supply_org_code: string
    supply_org_name: string
    supply_org_path: string
}

export interface IAppliedApiShareApplyItem {
    share_apply_id: string
    share_apply_code: string
    share_apply_name: string
    // 系统应用ID
    app_id: string
}

export interface IAppliedViewShareApplyItem {
    share_apply_id: string
    share_apply_code: string
    share_apply_name: string
    // 推送作业ID
    push_job_id: string
}

// ----------------------------个人中心-我的资源 end--------------------------------

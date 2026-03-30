/**
 * 创建需求参数类型
 * @params {string} dmd_type 需求类型 默认为 data_apply：数据应用需求
 * @params {string} title 需求名称
 * @params {string} description 需求描述
 * @params {number} finish_date 期望完成时间
 * @params {string} attachment_id 附件ID
 */
export interface ICreateDemandParams {
    dmd_type: string
    title: string
    description: string
    finish_date?: number
    attachment_id?: string
}

/**
 * 申请需求列表参数类型
 */
export interface IGetApplyDemandsParams {
    offset?: number
    limit?: number
    keyword?: string
    direction?: string
    sort?: string
    create_begin_time?: number
    create_end_time?: number
    status?: string
}

/**
 * 需求列表项
 * @param {string} dmd_type 需求类型
 * @param {string} processor 当前处理人名称
 * @param {string} canceled_reason 需求撤销原因
 */
export interface IDemandListItem {
    id: string
    code: string
    dmd_type: string
    title: string
    created_at: number
    processor: string
    processor_phone: string
    status: string
    canceled_reason: string
}
export interface IDemandListRes<T> {
    total_count: number
    entries: T[]
}

/**
 * 需求列表项
 * @param {string} dmd_type 需求类型
 * @param {string} attachment_id 附件ID
 * @param {string} attachment_name 附件名称
 */
export interface IDemandBaseInfo {
    id: string
    code: string
    dmd_type: string
    title: string
    finish_date: number
    attachment_id: string
    attachment_name: string
    description: string
}

/**
 * 操作记录扩展信息
 * @param {string} result 操作结果（仅分析确认、分析确认审核有该信息） pass：通过 reject：驳回
 * @param {string} remark 驳回
 */

export interface IDemandLogExtendInfo {
    result: string
    remark: string
}

/**
 * 操作记录信息
 * @param {string} op_user 操作人
 * @param {number} op_time 操作时间戳
 * @param {string} action_type 操作动作
 */
export interface IDemandLogInfo {
    id: string
    op_user: string
    op_time: number
    action_type: string
    extend_info: string
}

export interface IDemandLogRes {
    entries: IDemandLogInfo[]
}

// 实施结果中资源权限申请状态列表
export interface IImplResApplyDetail {
    // 资源类型 logicview：库表
    res_type: string
    // 资源ID
    res_id: string
    // 库表授权申请所处的阶段 Auditing 审核中 Rejected 拒绝申请 Approved 允许申请 Undone 发起者撤回申请 SubViewCreating 创建行列规则（子库表）中 Authorizing 授权中 Failed 失败。创建行列规则失败，或授权失败 Completed 完成，成功创建行列规则（如果需要），成功授权
    phase: string
    // 库表授权申请所处的阶段的原因
    message: string
}

/**
 * 需求项基本信息数据类型
 * @param {string} id 需求项ID
 * @param {string} res_id 资源ID
 * @param {string} res_tech_name 资源技术名称
 * @param {string} res_busi_name 资源业务名称
 * @param {string} res_type 资源类型 ogicview：库表（即库表）
 * @param {string} apply_reason 申请理由
 * @param {string[]} authority 申请权限 read：读取 download：下载
 * @param {string} res_tech_name 资源技术名称
 * @param {string} res_busi_name 资源业务名称
 * @param {string} res_desc 资源描述
 * @param {boolean} is_publish 是否发布
 * @param {boolean} is_online 是否上线
 * @param {string} auth_apply_id 资源授权申请ID 有值则标识资源有申请配置权限
 */
export interface IDemandItemInfo extends IImplResApplyDetail {
    id: string
    res_id: string
    res_tech_name: string
    res_busi_name: string
    res_type: string
    res_desc: string
    is_publish: boolean
    is_online: boolean
    auth_apply_id?: string
    // 以下即将删除
    res_name: string
    apply_reason: string
    authority: string[]
    extend_info?: any
}
/**
 * 分析结果返回类型
 * @param {string} analyser_name 分析人员名称
 * @param {string} analyser_phone 分析人员电话
 * @param {string} confirm_reject_reason 确认驳回理由
 * @param {string} audit_result 审核结果 pass：通过 reject：驳回
 * @param {string} audit_reject_reason 确认驳回理由
 * @param {string} apply_reason 申请理由
 * @param {string} feasibility 需求可行性 feasible：可行 unfeasible：不可行
 * @param {string} conclusion 分析结论
 * @param {IDemandItemInfo[]} items 需求项列表
 * @param {apply_reason} items 申请理由
 */
export interface IAnalysisResult {
    analyser_name?: string
    analyser_phone?: string
    analysis_id: string
    confirm_result: string
    confirm_reject_reason: string
    audit_result: string
    audit_reject_reason: string
    apply_reason: string
    feasibility: string
    conclusion: string
    items: IDemandItemInfo[]
    apply_reason?: string
}

export interface IImplementResult {
    // 资源权限申请状态列表
    apply_details: Array<IImplResApplyDetail>
    // 验收反馈内容
    accept_feedback: string
}

export interface IDemandItemDetails extends IDemandItemInfo {
    extend_info: string
}

/**
 * 查询需求详情参数
 * @param {string} id 需求ID
 * @param {string} fields   查询详情信息返回字段 process_info：进度信息   log：操作记录  basic_info：需求信息  analysis_result：分析结果 implement_result：实施结果 可选择多个字段信息任意组合，多个字段信息用英文逗号分隔
 * @param {string} view     applier：需求方视角，要求用户必须是需求创建人（当需求状态不为已撤销且为分析待确认及其之后的状态展示分析结果，分析结果展示内容为最新提交的记录）operator：需求分析/实施人员视角，需求为待分析/待实施状态时所有运营均可查看，否则限定仅曾处理过该需求的运营人员可查看（分析结果展示最新的保存或提交的记录）auditor：审核员视角，fields包含analysis_result、implement_result时必须指定analysis_id，展示指定analysis_id的分析记录
 * @param {string} analysis_id 分析记录ID
 */
export interface IDemandDetailParams {
    id: string
    fields: string
    view: string
    analysis_id?: string
}

/**
 * IMemberData 每行配置字段数据
 * @param {string} id 字段ID
 * @param {string} name_en 字段技术名称
 * @param {string} data_type 字段类型
 * @param {string} operator 条件运算符
 * @param {string} value 值
 */
export interface IMemberData {
    id: string
    name: string
    name_en: string
    data_type: string
    operator: string
    value: string
}

/**
 * IWhereGroup 每组数据配置类型
 * @param {string} relation 组之间 每行的关系
 * @param {IMemberData[]} member 每行配置字段数据
 */
export interface IWhereGroup {
    relation: string
    member: IMemberData[]
}

/**
 * IRowFilter 组关系数据类型
 * @param {string} where_relation 组之间关系
 * @param {IWhereGroup} member 组数据
 */
export interface IRowFilter {
    where_relation: string
    where: IWhereGroup[]
}

/**
 * 访问者删除标志
 * @param No 未删除
 * @param Yes 删除
 */
export enum IVisitorDeleteFlag {
    No = 1,
    Yes = 2,
}

/**
 * IDemandVisitor 访问者信息
 * @param {string} id 访问者用户ID
 * @param {string} name 访问者用户名称
 * @param {IVisitorDeleteFlag} delete_flag 用户是否已删除标记
 * @param {string} fields 待申请字段列表
 * @param {string} departments 访问者部门信息
 * @param {string} IRowFilter 待申请行规则
 * @param {boolean} is_applier 是否为需求提出人
 */
export interface IDemandVisitor {
    id: string
    name: string
    delete_flag: IVisitorDeleteFlag
    fields: { id: string; name: string }[]
    departments: { id: string; name: string }[]
    row_filters: IRowFilter
    is_applier: boolean
}

/**
 * 获取需求管理中列表的数据类型
 * @param {string} target todo：我的待办  done：我处理的  signingoff：待签收的
 */
export interface IGetDemandMgtList extends IGetApplyDemandsParams {
    target: string
    finish_begin_time?: number
    finish_end_time?: number
}

/**
 * 需求管理列表项数据类型
 * @param {string} applier 需求申请人名称
 * @param {string} applier_phone 需求申请人电话
 * @param {number} finish_date 期望完成时间
 */
export interface IDemandMgtListItem extends IDemandListItem {
    applier: string
    applier_phone: string
    applier_id: string
    finish_date: number
}

export interface IAnalysisBackParams {
    op_type: 'save' | 'submit'
    analysis_id?: string
    feasibility: 'feasible' | 'unfeasible'
    conclusion?: string
    apply_reason: string
    items: IDemandItemInfo[]
}

export interface IImplAchv {
    authority_apply_result: {
        authority: 'read' | 'download'
        result: 'pass' | 'reject'
    }[]
    remark?: string
}
export interface IItemImplementAuthority {
    id?: string
    item_id: string
    impl_achv: IImplAchv
}
export interface IImplemnetBackParams {
    op_type: 'save' | 'submit'
    entries: IItemImplementAuthority[]
}

export interface IImplementResBack {
    accept_feedback: string
    entries: (IItemImplementAuthority & IDemandItemInfo)[]
}

/**
 * @param {Apply} 需求申请
 * @param {Analysis} 需求分析
 * @param {Implement} 需求实施
 * @param {Cancel} 需求撤销
 */
export enum IDemandPhase {
    Apply = 'apply',
    Analysis = 'analysis',
    Implement = 'implement',
    Cancel = 'cancel',
}
export interface IProcessInfo {
    op_time: number
    op_user: string
    phase: DemandPhaseEnum
}

export enum DemandPhaseEnum {
    Apply = 'apply',
    Analysis = 'analysis',
    Implement = 'implement',
    implementAccept = 'implement_accept',
    Cancel = 'cancel',
    Close = 'close',
}

// 库表授权申请所处的阶段
export enum ApplySheetPhaseEnum {
    // 审核中
    Auditing = 'Auditing',
    // 拒绝申请
    Rejected = 'Rejected',
    // 允许申请
    Approved = 'Approved',
    // 发起者撤回申请
    Undone = 'Undone',
    // 创建行列规则（子库表）中
    SubViewCreating = 'SubViewCreating',
    // 授权中
    Authorizing = 'Authorizing',
    // 失败。创建行列规则失败，或授权失败
    Failed = 'Failed',
    // 完成，成功创建行列规则（如果需要），成功授权
    Completed = 'Completed',
}

export interface IDemandDetails {
    basic_info: IDemandBaseInfo
    analysis_result: IAnalysisResult
    log: IDemandLogInfo[]
    process_info: IProcessInfo[]
    implement_result: IImplementResult
}

/*
 * 需求实施提交申请参数
 * @params demandID 需求ID
 * @params analysisID 需求分析记录ID
 * @params demandID []string 需要提交申请的需求资源项ID列表，不传或为空则对该需求对应分析记录关联的所有符合条件的需求资源项提交申请
 */
export interface IImplementAuthApplyParams {
    demandID: string
    analysisID: string
    ids?: Array<string>
}

export type DemandDetailView = 'applier' | 'operator' | 'auditor'

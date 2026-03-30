import { TaskConfigStatus, TaskType } from '@/core'
import { ICommonRes, IGetListParams } from '../common'

/**
 * @content 工作流程信息
 */
export interface FlowChartInfo {
    content: string
}

// 节点进度信息
export type NodePregressInfo = {
    // 完成数
    finished_count: number

    // 节点id
    node_id: string

    // 总数
    total_count: number
}

/**
 * @entries 所有节点进度信息
 * @limit 每页的数量
 * @offset 当前页数
 * @total_count 总数
 */
export interface FlowChartRates {
    entries: Array<NodePregressInfo>
    limit: number
    offset: number
    total_count: number
}

/**
 * 任务参数
 * @created_by 任务创建人id，uuid（36）
 * @direction 排序方向
 * @executor_id 任务执行人id，可以多选，逗号分隔
 * @keyword 任务名称
 * @limit 每页大小]
 * @node_id 节点id，uuid（36）
 * @offset 页码
 * @overdue 是否逾期，枚举 "overdue" "due"
 * @priority 任务优先级，枚举 "common" "emergent" "urgent" 可以多选，逗号分隔
 * @sort Enum: "created_at" "updated_at" "deadline"排序类型
 * @status 任务状态，枚举 "ready" "ongoing" "completed" 可以多选，逗号分隔
 * @project_id 项目id
 * @exclude_task_type string 需要排除的任务类型
 * @executable_status string 任务可开启类型 Enum: "blocked" "executable" "invalid" "completed"
 */
export type TaskQueryParams = {
    created_by?: string
    direction?: string
    executor_id?: string
    keyword?: string
    limit?: number
    node_id?: string
    offset?: number
    overdue?: string
    priority?: string
    sort?: string
    status?: string
    project_id?: string
    is_pre?: boolean
    is_create?: boolean
    exclude_task_type?: string
    executable_status?: string
    statistics?: boolean
}

export interface TaskInfo {
    // 截止日期
    deadline?: number
    // 任务描述
    description?: string
    // 任务执行人
    executor_name?: string
    // 任务执行人id
    executor_id?: string
    // 任务id
    id?: string
    // 任务名称
    name?: string
    // 任务优先级
    priority?: string
    // 项目id
    project_id?: string
    // 项目名称
    project_name?: string
    // 节点id
    node_id?: string
    // 阶段id
    stage_id?: string
    // 任务状态
    status?: string
    // 修改时间
    updated_at?: number
    // 修改人
    updated_by?: string
    // 逾期状态
    overdue?: 'overdue' | 'due'
    // 任务状态
    config_status: TaskConfigStatus
    // 可执行状态
    executable_status?: string
    // 任务类型
    task_type?: TaskType
    // 主题域id
    subject_domain_id?: string
    // 主题域名称
    subject_domain_name?: string
    // 业务模型id
    business_model_id?: string
    business_model_name?: string
    // 任务总字段数量
    total_fields?: number
    // 任务当前完成字段数量
    finished_fields?: number
    // 业务模型id
    main_business_id?: string
    // 业务模型名称
    main_business_name?: string
    image?: string
    role_id?: string
    color?: string
    // 新建业务模型任务的业务模型id
    new_main_business_id?: string
    // 新版业务模型id
    model_id?: string
    // 流程id
    domain_id?: string
    domain_name?: string
    // 数据模型id
    data_model_id?: string
    // 数据模型名称
    data_model_name?: string
    // 建模任务子类型
    model_child_task_types?: string[]
}

/**
 * @entries 所有任务信息
 * @limit 每页的数量
 * @offset 当前页数
 * @total_count 总数
 */
export interface TaskInfos {
    entries: Array<TaskInfo>
    limit: number
    offset: number
    total_count: number
    total_created_tasks: number
    total_processed_tasks: number
    total_blocked_tasks: number
    total_executable_tasks: number
    total_invalid_tasks: number
    total_completed_tasks: number
}

/**
 * 创建任务结构体
 * @deadline 截止日期，时间戳（10）<4102329600
 * @description 任务描述，0-255，中英文、数字、及键盘上的特殊字符
 * @executor_id 任务执行人id，uuid（36）
 * @flow_id 工作流程id，uuid（36）
 * @flow_version 工作流程版本，uuid（36）
 * @name 任务名，1-32，中英文、数字、下划线及中划线
 * @node_id 节点id，uuid（36）
 * @priority Enum: "common" "emergent" "urgent" 任务优先级，枚举 "common" "emergent" "urgent"
 * @stage_id 阶段id，uuid（36）
 */
export interface CreateTaskParam {
    deadline?: number
    description?: string
    executor_id?: string
    flow_id?: string
    flow_version?: string
    name: string
    node_id?: string
    priority?: string
    stage_id?: string
    project_id?: string
    // subject_domain_id?: string
    business_model_id?: string
    data?: string[]
    data_catalog_id?: string[]
    data_comprehension_template_id?: string
}

/**
 * 创建返回
 * @id 项目id
 * @name 项目名称
 */
export interface TaskReturn {
    id: string
    name: string
    next_executables?: string[]
}

/**
 * 编辑任务结构体
 * @deadline 截止日期，时间戳（10）<4102329600
 * @description 任务描述，0-255，中英文、数字、及键盘上的特殊字符
 * @executor_id 任务执行人id，uuid（36）
 * @name 任务名，1-32，中英文、数字、下划线及中划线
 * @priority Enum: "common" "emergent" "urgent" 任务优先级，枚举 "common" "emergent" "urgent"
 * @status Enum: "ready" "ongoing" "completed"任务状态，枚举 "ready" "ongoing" "completed
 */
export interface EditTaskParam {
    deadline?: number
    description?: string
    executor_id?: string
    name?: string
    priority?: string
    status?: string
    project_id?: string
    // subject_domain_id?: string
    business_model_id?: string
    data?: string[]
    data_catalog_id?: string[]
    data_comprehension_template_id?: string
}

/**
 * 用户信息
 * @RoleName  角色名称
 * @role_id 角色标识
 * @id 用户标识
 * @name 用户中文名称
 */
export interface ExecutorInfo {
    id: string
    role_name: string
    role_id: string
    name: string
    roles?: string[]
}

/**
 *
 * @created_at 创建时间
 * @created_by 创建人
 * @updated_at 更新日期
 * @updated_by 更新人
 * @stage_name 阶段名称
 * @node_name 节点名称
 * @org_type 标准类型（0 1 2 3 4 5 6 99）- 如果是标准化任务，必填
 */
export interface TaskDetail extends TaskInfo {
    created_at?: number
    created_by?: string
    stage_name?: string
    node_name?: string
    data?: { id: string; name: string }[]
    org_type?: number

    data_catalog_id?: string[]
    data_comprehension_template_id?: string
    data_comprehension_template_name?: string
    work_order_id?: string
    work_order_name?: string
}

/**
 * 项目信息
 * @created_at 创建时间\
 * @created_by 创建人姓名
 * @created_by_uid 创建人id
 * @deadline 项目截止日期时间戳
 * @description 项目描述
 * @flow_id 项目工作流程ID
 * @flow_version 项目工作流程版本
 * @id 项目ID
 * @image 项目图片UUID
 * @members 成员信息
 * @name 项目名称
 * @owner_id  项目负责人ID
 * @owner_name  项目负责人名称
 * @priorty   项目优先级
 * @status 项目状态
 * @updated_at 更新时间
 * @updated_by  更新人姓名
 * @updated_by_uid 更新人id
 */
export interface ProjectInfo {
    created_at: string
    created_by: string
    created_by_uid: string
    deadline: number
    description: string
    flow_id: string
    flow_version: string
    id: string
    image: string
    members: Array<MemberInfo>
    name: string
    owner_id: string
    owner_name: string
    priority: string
    status: string
    updated_at: string
    updated_by: string
    updated_by_uid: string
    complete_time: number
    flow_name: string
}

export interface MemberInfo {
    roles: Array<string>
    id: string
    name: string
    role_name: string
    role_id: string
}

/**
 * 操作日志参数
 * obj 操作日志模块，目前支持，task
 * obj_id 需要查询的对象的id, 当前支持任务ID
 */
export interface IOperateLogReq {
    obj: string
    obj_id: string
    offset?: number
    limit?: number
    sort?: string
    direction?: string
}

/**
 * 操作日志
 */
export interface IOperateLog {
    created_at: number
    created_by_name: string
    created_by_uid: string
    id: string
    name: string
    result: string
    success: boolean
}
export enum ProjectStatus {
    UNSTART = 'ready',
    PROGRESS = 'ongoing',
    COMPLETED = 'completed',
}

/**
 * urgency 非常紧急
 * emergency 紧急
 * common 普通
 */
export enum Priority {
    URGENCY = 'urgent',
    EMERGENCY = 'emergent',
    COMMON = 'common',
}

// ****************************************** 新建标准任务 start ******************************************
export interface IStdTaskCommonRes<T> {
    data: T[]
    total_count: number
}

export interface IStdTaskBusinTable {
    // 主键ID
    // id: string
    // 业务表名称
    business_table_id: string
    // 业务表名称
    business_table_name: string
    // 业务表类型
    business_table_type?: string
    // 业务表字段名称
    // business_table_filed_name: string
    // 字段总数
    total_number: number
    // 已选择数据元数量
    finish_number: number
}

// 任务-业务表字段列表查询参数
export interface IStdTaskBusinFieldTableQuery {
    // 任务id
    task_id?: string
    // 业务表id
    business_table_id?: string
    // 新建标准任务，字段状态，0-不限，1-已完成，2-未完成
    state?: number
    // 状态：0-未完成，1-已完成
    // type?: number
    // 搜索关键字，搜索字段名
    keyword?: string
    // 为空默认1，小于1取1，其余取offset值。
    offset?: number
    // 为空默认20，小于1取1，大于1000取1000，其余取limit的值。
    limit?: number
    // 排序字段：update_time/create_time，默认：create_time
    sort?: string
    // 排序方向：asc/desc，默认：desc
    direction?: string
}

export interface ISubmitDataEleParams {
    // 字段id
    id: string
    // 数据元id
    data_element_id: string
}

/**
 * 任务进度
 */
export interface IStdTaskProcess {
    total_number: number
    finish_number: number
}
// ****************************************** 新建标准任务 end ******************************************

/**
 * 创建积分策略参数
 * @strategy_code 策略代码
 * @strategy_config 策略配置
 * @strategy_period 策略周期
 */
export interface PointsStrategyParams {
    strategy_code: string
    strategy_config: string
    strategy_period: string
}

export interface PointsStrategyResult extends PointsStrategyParams {
    updated_by_id: string
    updated_by: string
    update_at: number
}
export interface PointsStrategyListRes {
    entries: Array<PointsStrategyResult>
    limit: number
    offset: number
    total_count: number
}

export interface IIntegralRecord {
    id: string
    name: string
    score: number
}

// 积分列表项
export interface IIntegralListItem {
    // 积分策略代码
    strategy_code: string
    // 积分策略对象id
    strategy_object_id: string
    // 积分策略对象名称
    strategy_object_name: string
    // 积分
    points: number
    // 星级
    score: number
    // 创建时间
    created_at: number
}

export interface IIntegralRecordListRes {
    entries: Array<IIntegralListItem>
    total_count: number
}

export enum WorkOrderStatus {
    Running = 'Running',
    Completed = 'Completed',
    Failed = 'Failed',
}

export interface IOrderTaskQueryParams extends IGetListParams {
    work_order_id: string
}

export interface IWorkOrderTaskItem {
    business_standard_table?: string
    collection_quantity?: number
    created_at?: string
    data_table?: string
    datasource?: string
    department?: string
    execution_count?: number
    id: string
    name: string
    reason?: string
    status?: WorkOrderStatus
    updated_at?: string
    work_order_id?: string
}

/** 检查质量检测是否重复结果 */
export interface IWorkOrderQualityAuditCheckRes {
    relations: [
        {
            view_business_name: string
            view_id: string
            view_technical_name: string
            work_orders: {
                work_order_id: string
                work_order_name: string
            }[]
        },
    ]
}
/**
 * status: not_add未整改过，  added已创建质量整改
 */
export interface IDataQualityStatus {
    form_view_id: string
    work_order_id: string
    work_order_name: string
    status: string
}

// -----------------------------------------------沙箱开始------------------------------------------------------------------

// 沙箱申请类型
export enum SandboxCreateTypeEnum {
    // 申请
    Apply = 'apply',
    // 扩容
    Extend = 'extend',
}

export enum SandboxExecuteTypeEnum {
    Online = 'online',
    Offline = 'offline',
}

// 状态
export enum SandboxStatus {
    // 全部
    All = '',
    // 沙箱申请中 || 扩容申请中
    Applying = 'applying',
    // 待实施
    ImplementPending = 'waiting',
    // 实施中
    Implementing = 'executing',
    // 已完成
    Implemented = 'completed',
    // 已撤回
    Undone = 'undone',
}

export interface ISandboxApplyListParams {
    apply_time_end?: number
    apply_time_start?: number
    department_id?: string
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string
    // 状态,支持多个状态，逗号分割
    status?: string
}

export interface ISandboxApplyItem {
    // 申请人ID
    applicant_id: string
    // 申请人名称
    applicant_name: string
    // 申请信息
    apply_id: string
    // 操作时间
    apply_time: string
    // 审核意见，仅驳回时有用
    audit_advice: string
    // 审核状态,1审核中，2审核通过，3未通过
    audit_state: number
    created_at: string
    // 创建用户名称
    creator_name: string
    // 创建者联系方式
    creator_phone: string
    // 创建用户ID
    creator_uid: string
    // 所属部门ID
    department_id: string
    // 所属部门名称
    department_name: string
    // 实施阶段,1待实施，2实施中，3已实施
    execute_status: SandboxStatus
    // 在申请中的容量
    in_apply_space: number
    // 操作,1创建申请，2扩容申请
    operation: SandboxCreateTypeEnum
    // 项目ID
    project_id: string
    // 项目成员ID数组
    project_member_id: string[]
    // 项目成员name数组
    project_member_name: string[]
    // 项目名称
    project_name: string
    // 申请原因
    reason: string
    sandbox_id: string
    sandbox_status: SandboxStatus
    // 总的沙箱空间，单位GB
    total_space: number
    // 更新时间
    updated_at: string
    // 更新用户名称
    updater_name: string
    // 更新用户ID
    updater_uid: string
    // 已用空间
    used_space: number
    // 有效期结束时间，单位毫秒
    valid_end: number
    // 有效期开始时间，单位毫秒
    valid_start: number
    // 上次申请容量
    last_apply_space: number
}

export interface ISandboxImpListParams {
    direction?: string
    // 实施类型
    execute_type?: string
    keyword?: string
    limit?: number
    offset?: number
    // 排序类型
    sort?: string
    status?: string
}

export interface ISandboxImplementItem {
    // 申请人ID
    applicant_id: string

    // 申请人名称
    applicant_name: string
    // 申请人联系电话
    applicant_phone: string
    // 沙箱请求ID
    apply_id: string
    // 实施阶段,1待实施，2实施中，3已实施
    execute_status: number
    // 实施方式,1线下，2线上
    execute_type: number
    // 实施完成时间
    executed_time: string
    // 实施人ID
    executor_id: string
    // 实施人名称
    executor_name: string
    // 操作,1创建申请，2扩容申请
    operation: SandboxCreateTypeEnum
    // 项目ID
    project_id: string
    //  项目名称
    project_name: string
    // 沙箱ID
    sandbox_id: string
    request_space: number
    id: string
    username: string
    password: string
}

export interface ISandboxAuditParams {
    direction?: string
    limit?: number
    offset?: number
    sort?: string
    // 审核列表类型 tasks 待审核 historys 已审核
    target?: string
}

export interface ISandboxAuditItem {
    // 申请人ID
    applicant_id: string
    // 申请人名称
    applicant_name: string
    // 申请人名电话
    applicant_phone: string
    // 申请人ID
    applier_id: string
    // 申请人名称
    applier_name: string
    // 审核code
    apply_code: string
    // 申请时间
    apply_time: string
    // 操作
    audit_operation: number
    // 审核状态
    audit_status: string
    // 审核时间，2006-01-02 15:04:05
    audit_time: string
    // 审核类型
    audit_type: string
    department_id: string
    department_name: string
    // 审核实例ID
    proc_inst_id: string
    project_id: string
    project_name: string
    sandbox_id: string
    operation: SandboxCreateTypeEnum
}

export interface ISandboxSpaceParams {
    direction?: string
    limit?: number
    offset?: number
    sort?: string
    keyword?: string
}

export interface ISandboxSpaceItem {
    // 申请人ID
    applicant_id: string
    // 申请人名称
    applicant_name: string
    // 数据集数量
    data_set_number: number
    department_id: string
    department_name: string
    project_id: string
    project_name: string
    // 最近的一个数据及名称
    recent_data_set: string
    // 沙箱的雪花ID，作为沙箱编码
    sandbox_code: number
    // 沙箱ID
    sandbox_id: string
    // 总的沙箱空间，单位GB
    total_space: number
    // 数据集更新时间
    updated_at: string
    // 已用空间
    used_space: number
    // 有效期结束时间，单位毫秒
    valid_end: number
    // 有效期开始时间，单位毫秒
    valid_start: number
    database_name: string
    datasource_id: string
    datasource_name: string
    datasource_type_name: string
}

type ISandboxLogParams = ISandboxSpaceParams
// export interface ISandboxLogParams {
//     direction?: string
//     limit?: number
//     offset?: number
//     sort?: string
//     keyword?: string
// }

export interface ISandboxTaskLog {
    // 完成时间
    end_time: string
    // 处理实例ID
    process_instance_id: string
    // 请求时间
    start_time: string
    // 状态
    status: string
    // 步骤ID，序号
    step_id: string
    // 步骤名称，uuid
    step_name: string
    // 推送总数
    sync_count: string
    // 执行方式
    sync_method: string
    // 执行时间，单位，秒
    sync_time: string
}

export interface ISandboxLogItem {
    // 数据集名称
    data_set_name: string
    // 操作人ID
    operator_id: string
    // 操作人姓名
    operator_name: string
    project_id: string
    project_name: string
    task_log: ISandboxTaskLog
}

export interface ISandboxApplyRecord {
    // 申请人ID
    applicant_id: string
    // 申请人名称
    applicant_name: string
    // 请求ID
    apply_id: string
    // 操作时间
    apply_time: string
    // 审核意见，仅驳回时有用
    audit_advice: string
    // 审核状态,1审核中，2审核通过，3未通过
    audit_state: number
    // 实施阶段,1待实施，2实施中，3已实施
    execute_status: number
    // 操作,1创建申请，2扩容申请
    operation: SandboxCreateTypeEnum
    // 申请原因
    reason: string
}

export interface ISandboxProjectMember {
    department_id: string
    department_id_path: string
    department_name: string
    department_name_path: string
    // 用户ID
    id: string
    // 加入项目时间
    join_time: string
    // 用户姓名
    name: string
    is_project_owner: boolean
}

export interface ISandboxApplyDetails {
    // 申请记录
    apply_records: ISandboxApplyRecord[]
    // 审核状态,1审核中，2审核通过，3未通过
    audit_state: number
    department_id: string
    department_name: string
    // 实施阶段,1待实施，2实施中，3已实施
    execute_status: number
    // 在申请中的容量
    in_apply_space: number
    // 操作,1创建申请，2扩容申请
    operation: SandboxCreateTypeEnum
    project_id: string
    project_members: ISandboxProjectMember[]
    project_name: string
    // 沙箱ID
    sandbox_id: string
    // 总的沙箱空间，单位GB
    total_space: number
    // 已用空间
    used_space: number
    // 有效期结束时间，单位毫秒
    valid_end: number
    // 有效期开始时间，单位毫秒
    valid_start: number
}

export interface ISandboxApplyParams {
    department_id: string
    project_id: string
    // 申请原因
    reason: string
    // 申请容量
    request_space: number
    // 有效期开结束
    valid_end?: number
    // 有效期开始
    valid_start?: number
}

export interface ISandboxImplementParams {
    // 沙箱请求ID
    apply_id: string
    // 数据库
    database_name: string
    // 数据源名称
    datasource_name: string
    // 数据库类型
    datasource_type: string
    // 沙箱密码
    password: string
    // 沙箱用户名
    user_name: string
}

export interface ISandboxImpFinishParams {
    // 实施id
    execution_id: string
    // 实施说明
    desc: string
}

export interface ISandboxImpLog {
    // 操作步骤,1申请，2扩容，3审核，4实施，5完成
    execute_step: number
    // 操作时间
    execute_time: string
    // 沙箱实施ID
    execution_id: number
    // 实施人ID
    executor_id: string
    // 实施人名称
    executor_name: string
    // 主键，uuid
    id: string
}

export interface ISandboxExtendParams {
    // 申请原因
    reason: string
    // 申请容量	 最小值: 1
    request_space: number
    // 数据库沙箱ID
    sandbox_id: string
}
// -----------------------------------------------沙箱结束------------------------------------------------------------------
/** **************************** 租户申请 start ********************************** */

export interface ITenantListItem {
    id: string
    application_name: string
    application_code: string
    tenant_name: string
    department_id: string
    department_name: string
    department_path: string
    contactor_name: string
    contactor_id: string
    contactor_phone: string
    applied_at: string
    applied_by_uid: string
    applied_by_name: string
    audit_status: string
    reject_reason: string
    cancel_reason: string
    status: string
}

export enum TenantSubmitType {
    Submit = 'submit',
    Draft = 'draft',
}

export enum DataBaseType {
    TBDS = 'tbds',
    TBASE = 'tbase',
}

export interface IAccountRescItem {
    // 数据目录id
    data_catalog_id?: string
    data_catalog_code?: string
    data_catalog_name?: string
    mount_resource_id?: string
    // 关联资源名称，如库表
    mount_resource_name?: string
    mount_resource_code?: string
    // 数据源id
    data_source_id?: string
    // 数据源名字
    data_source_name?: string
    // read write download
    apply_permission?: string[]
    // 申请用途
    apply_purpose?: string

    // remove, edit, unchanged
    edit_status?: string
}

export interface IDataBaseAccountItem {
    database_account_id?: string
    // tbds tbase
    database_type?: DataBaseType
    // 数据库名称
    database_name?: string
    // 租户账号
    tenant_account?: string
    // 租户密码
    tenant_passwd?: string
    // 项目名称
    project_name?: string
    // 允许资源
    actual_allocated_resources?: string
    // hadoop
    user_authentication_hadoop?: string
    // habase
    user_authentication_hbase?: string
    // hive
    user_authentication_hive?: string
    // remove, edit, unchanged
    edit_status?: string

    // 关联资源
    data_resource_list?: Array<IAccountRescItem>
}

export interface ITenantApplyBasicInfo {
    // 必须
    id: string
    // 必须
    application_name: string
    // 必须
    application_code: string
    // 必须
    tenant_name: string
    // 必须
    tenant_admin: string
    // 必须
    business_unit_name: string
    // 必须
    business_unit_contactor: string
    // 必须
    business_unit_phone: string
    // 必须
    business_unit_email: string
    // 必须
    business_unit_fax: string
    // 必须
    maintenance_unit: string
    // 必须
    maintenance_unit_contactor: string
    // 必须
    maintenance_unit_phone: string
    // 必须
    maintenance_unit_email: string
    // 必须
    created_at: string
    // 必须
    created_by: string
}

// 租户详情
export interface ITenantApplyDetail extends ITenantApplyBasicInfo {
    // 必须
    database_account_list: Array<IDataBaseAccountItem>
}

// 租户审核列表项
export interface ITenantAuditItem {
    id: string
    application_name: string
    application_code: string
    tenant_name: string
    application_department: string
    application_contactor: string
    applied_at: string
}
/** **************************** 租户申请 end ********************************** */

// 工单模板类型
export type WorkOrderTemplateType =
    | 'research'
    | 'frontend-machine'
    | 'data-collection'
    | 'data-standardization'
    | 'data-quality-audit'
    | 'data-fusion'
    | 'data-understanding'
    | 'data-resource-catalog'

// 工单模板状态
export type WorkOrderTemplateStatus = 0 | 1 // 0-禁用，1-启用

// 工单模板内容字段接口
export interface WorkOrderTemplateContent {
    // 调研工单模板
    research_unit?: string
    research_content?: string
    research_purpose?: string
    research_time?: string

    // 前置机工单模板
    apply_department?: string
    frontend_machine_address?: string
    apply_requirement?: string

    // 数据归集工单模板
    data_source?: string
    collection_time?: string
    department?: string
    sync_frequency?: string
    collection_method?: string
    description?: string

    // 数据标准化工单模板
    data_source?: string
    data_table?: string
    table_fields?: string[]
    standard_data_elements?: string
    business_table_fields?: string
    business_table_standard?: string
    remark?: string
    description?: string

    // 数据质量稽核工单模板
    data_source?: string
    data_table?: string
    table_fields?: string[]
    related_business_rules?: string

    // 数据融合加工工单模板
    source_data_source?: string
    source_table?: string
    target_table?: string
    field_fusion_rules?: string

    // 数据理解工单模板
    work_order_name?: string
    task_name?: string
    task_executor?: string
    manage_resource_catalog?: string

    // 数据资源编目工单模板
    basic_info?: string
    info_items?: string
    share_attributes?: string
}

export interface IWorkOrderTemplatesInfo {
    id: string
    template_name: string
    template_type: WorkOrderTemplateType
    description?: string
    version: number
    is_active: WorkOrderTemplateStatus
    reference_count: number
    created_at: number
    created_by: string
    created_by_name: string
    updated_at: number
    updated_by: string
    updated_by_name: string
    content?: WorkOrderTemplateContent
}
// 原有模板
export interface IWorkOrderTemplateInfo {
    id: string
    // 工单类型
    ticket_type: string
    // 工单模板名称
    template_name: string
    // 工单模板描述
    description: string
    // 创建人ID
    created_by_uid: string
    // 创建人名称
    created_name: string
    // 更新人名称
    updated_name: string
    // 创建时间
    created_at: string
    // 更新时间
    updated_at: string
    // 是否内置
    is_builtin: boolean
    // 工单模板状态
    status: boolean
}

export interface WorkOrderTemplateVersion {
    id: string
    template_id: string
    version: number
    template_name: string
    template_type: WorkOrderTemplateType
    description?: string
    created_at: number
    created_by: string
    created_by_name: string
    content?: WorkOrderTemplateContent
}

export interface WorkOrderTemplateParams {
    template_name?: string
    template_type?: string
    is_active?: number
    keyword?: string
    offset?: number
    limit?: number
}

export interface IDataProcessingOverview {
    // 融合工单数量
    data_fusion_work_order_count: number
    // 质量检测工单数量
    data_quality_audit_work_order_count: number
    // 部门整改情况
    department_quality_status: Array<DepartmentQualityState>
    // 已完成数据融合工单数量
    finished_data_fusion_work_order_count: number
    // 已完成质量检测工单数量
    finished_data_quality_audit_work_order_count: number
    // 已完成工单数量
    finished_work_order_count: number
    // 未整改表数量
    not_process_table_count: number
    // 进行中数据融合工单数量
    ongoing_data_fusion_work_order_count: number
    // 进行中质量检测工单数量
    ongoing_data_quality_audit_work_order_count: number
    // 进行中工单数量
    ongoing_work_order_count: number
    // 已整改表数量
    processed_table_count: number
    // 整改中表数量
    processing_table_count: number
    // 已检测表数量
    qualitied_table_count: number
    // 问题表数量
    question_table_count: number
    // 来源表数量
    source_table_count: number
    // 来源表部门数量
    source_table_department_count: number
    // 已响应表数量
    start_process_table_count: number
    // 应检测表数量
    table_count: number
    // 应检测部门数量
    table_department_count: number
    // 成果表数量
    target_table_count: number
    // 目标表部门数量
    target_table_department_count: number
    // 未派发数据融合工单数量
    unassigned_data_fusion_work_order_count: number
    // 未派发质量检测工单数量
    unassigned_data_quality_audit_work_order_count: number
    // 未派发工单数量
    unassigned_work_order_count: number
    // 数据处理工单数量
    work_order_count: number
    // 加工任务数量
    work_order_task_count: number
}

/**
 * 部门整改情况
 */
export interface DepartmentQualityState {
    department_name: string
    processed_table_count: number
    quality_rate: number
    question_table_count: number
}

// 成果表数据资源目录
export interface ResultsTableCatalogRes {
    // 准确性评分
    accuracy_score: number
    // 完整性评分
    completeness_score: number
    // 部门
    department: string
    // 名称
    name: string
    // 资源类型
    resource_type: number
    // 同步机制
    sync_mechanism: 1 | 2
    // 及时性评分
    timeliness_score: number
    // 更新时间
    updated_at: number
}

/**
 * 部门整改数据
 */
export interface QualityDepartmentData {
    // 部门名称
    department_name: string
    // 已整改表数量
    processed_table_count: number
    // 未整改表数量
    not_process_table_count: number
    // 整改中表数量
    processing_table_count: number
    // 已检测表数量
    qualitied_table_count: number

    // 问题表数量
    question_table_count: number
    // 已响应表数量
    start_process_table_count: number
    // 应检测表数量
    table_count: number
}

/**
 * 部门整改数据
 */
export interface ProcessDepartmentData {
    // 部门名称
    department_name: string
    // 待整改表
    question_table_count: number
    // 已整改表数量
    processed_table_count: number
    // 整改率
    quality_rate: number
}

export interface ProcessTaskDataRes {
    // 已完成任务数量
    completed_task_count: number
    // 数据分析任务数量
    data_analysis_task_count: number
    // 异常总数
    failed_task_count: number
    // 处理计划任务总数
    plan_task_count: number
    // 进行中任务总数
    running_task_count: number
    // 数据分析任务总数
    standalone_task_count: number
    // 任务总数
    work_order_task_count: number
}

/**
 * 成果表详情数据
 */
export interface ResultTableDetailDataRes {
    // 数据分析任务数量
    data_analysis_task_count: number
    // 处理计划任务数量
    plan_task_count: number
    // 独立任务数量
    standalone_task_count: number
    // 工单任务数量
    work_order_task_count: number
}

/** **************************** 通知 start ********************************** */
export interface IGetNotifications {
    read?: boolean
    offset?: number
    limit?: number
}

export interface IWorkOrder {
    id: string
    name: string
    code: string
    deadline: string
}

export interface INotificationsItem {
    id: string
    time: string
    recipient_id: string
    message: string
    read: boolean
    reason: string
    work_order: IWorkOrder
}
/** **************************** 通知 end ********************************** */

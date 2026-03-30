/*
 * @Author: Jeffrey.Zhang
 * @Date: 2024-01-11 15:01:55
 * @LastEditors: Jeffrey.Zhang
 * @LastEditTime: 2024-01-16 17:30:53
 * @Description:
 */
/** 策略操作枚举 */
export enum PolicyActionEnum {
    /** 查看 */
    View = 'view',
    /** 读取 */
    Read = 'read',
    /** 下载 */
    Download = 'download',
    /** 授权 */
    Auth = 'auth',
    /** 分配 */
    Allocate = 'allocate',
}

/** 策略结果枚举 */
export enum PolicyEffectEnum {
    /** 允许 */
    Allow = 'allow',
    /** 拒绝 */
    Deny = 'deny',
}

/** 资源类型枚举 */
export enum AssetTypeEnum {
    /** 主题域 */
    Domain = 'domain',
    /** 数据目录 */
    DataCatalog = 'data_catalog',
    /** 库表 */
    DataView = 'data_view',
    /** 接口 */
    Api = 'api',
    /** 接口限定规则 */
    SubService = 'sub_service',
    /** 行列规则库表 */
    SubView = 'sub_view',

    // 指标
    Indicator = 'indicator',
    // 指标维度库表
    Dim = 'indicator_dimensional_rule',
}

/** 访问者类型枚举 */
export enum VisitorTypeEnum {
    /** 用户 */
    User = 'user',
    /** 部门 */
    Department = 'department',
    /** 角色 */
    Role = 'role',

    App = 'app',
}

/**
 * 策略验证项
 */
export interface IValidatePolicy extends IVisitorPermission {
    /** 资源ID */
    object_id: string
    /** 资源类型 */
    object_type: AssetTypeEnum
    /** 访问者ID */
    subject_id: string

    subject_type: string
}

/** 访问权限项 */
export interface IVisitorPermission {
    /** 策略操作 */
    action: PolicyActionEnum
    /** 策略结果 */
    effect: PolicyEffectEnum
}

/** 部门项 */
export interface IDepartment {
    /** 部门ID */
    department_id: string
    /** 部门名称 */
    department_name: string
}

/** 访问者 */
export interface IVisitor {
    /** 所属部门集合 */
    departments: IDepartment[]
    /** 权限集合 */
    permissions: IVisitorPermission[]
    /** 访问者ID */
    subject_id: string
    /** 访问者名称 */
    subject_name: string
    /** 访问者类型 */
    subject_type: VisitorTypeEnum
}

/** 策略信息 */
export interface IPolicyInfo {
    /** 资源ID */
    object_id: string
    /** 资源类型 */
    object_type: AssetTypeEnum
    /** 资源名称 */
    object_name: string
    /** 数据ownerID */
    owner_id: string
    /** 数据owner名称 */
    owner_name: string
    /** 数据owner部门 */
    owner_departments: IDepartment[]
    /** 访问者 */
    subjects: IVisitor[]
    /** 权限继承者 */
    subjects_extend: IVisitor[]
    owners: {
        owner_id: string
        owner_name: string
        departments: IDepartment[]
    }[]
}

export interface ILogicViewAuthSpecPolicies {
    subject_type: string
    subject_id: string
    actions: string[]
}

export interface ILogicSubViews {
    id: string
    spec: { name: string; logic_view_id: string; detail: string }
    policies: ILogicViewAuthSpecPolicies[]
}
export interface ILogicViewAuthSpec {
    id: string
    policies: ILogicViewAuthSpecPolicies[]
    sub_views: ILogicSubViews[]
    suspend: boolean
    requester_id: string
    reason: string
}

export type IReferenceInfo =
    | { user: { id: string; name: string; department_ids: string[] } }
    | { department: { id: string; name: string; parent_id: string } }

export interface ILogicViewAuth {
    id: string
    spec: ILogicViewAuthSpec
    references: any[]
}

type IPolicies = {
    subject_id: string
    subject_type: string
    actions: string[]
}

type ISubSpec = {
    name: string
    logic_view_id?: string
    detail: string
}

type ISubViews = {
    id?: string
    spec?: ISubSpec
    policies: IPolicies[]
}

type ISpec = {
    id: string
    policies?: IPolicies[]
    sub_views?: ISubViews[]
    suspend?: boolean
    reason: string
}

/** 授权申请参数 */
export interface IAuthRequest {
    spec: ISpec
}

/** 授权申请返回 */
export interface IAuthRequestData {
    id: string
    spec: ISpec | { requester_id?: string }
    status: {
        phase: string
        message: string
        snapshots: ISubSpec | { id: string }
    }
}

/** 数据仓库权限申请参数 */
export interface IDwhDataAuthRequest {
    /** 申请单名称 */
    name: string
    /** 数据ID */
    data_id: string
    /** 申请类型 */
    request_type: string
    /** 过期时间，永久有效时为0，具体时间时为时间戳（毫秒） */
    expired_at: number
    /** 规格配置（JSON字符串） */
    spec: string
}

/** 数据仓库权限申请返回 */
export interface IDwhDataAuthRequestData {
    id: string
    [key: string]: any
}

/** 数据仓库权限申请列表项 */
export interface IDwhDataAuthAuditListItem {
    /** 申请ID */
    id: string
    /** 申请单名称 */
    name: string
    /** 申请人ID */
    applicant: string
    /** 申请人名称 */
    applicant_name: string
    /** 数据业务名称 */
    data_business_name: string
    /** 数据技术名称 */
    data_tech_name: string
    /** 数据ID */
    data_id: string
    /** 申请编号 */
    apply_code: string
    /** 审核类型 */
    audit_type: string
    /** 审核状态 */
    audit_status: string
    /** 审核时间 */
    audit_time: string
    /** 流程实例ID */
    proc_inst_id: string
    /** 申请时间 */
    apply_time: string
}

/** 数据仓库权限申请状态 */
export interface IDwhDataAuthRequestStatus {
    /** 阶段 */
    phase: string
    /** 申请ID */
    apply_id: string
    /** 流程定义key */
    proc_def_key: string
}

/** 数据仓库权限申请列表项（申请列表） */
export interface IDwhDataAuthRequestApplyListItem {
    /** 申请ID */
    id: string
    /** 申请单名称 */
    name: string
    /** 申请类型 */
    request_type: string
    /** 申请人ID */
    applicant: string
    /** 申请人名称 */
    applicant_name: string
    /** 申请时间（时间戳） */
    apply_time: number
    /** 数据业务名称 */
    data_business_name: string
    /** 数据技术名称 */
    data_tech_name: string
    /** 数据ID */
    data_id: string
    /** 创建时间 */
    created_at: string
    /** 更新时间 */
    updated_at: string
    /** 状态信息 */
    status: IDwhDataAuthRequestStatus
}

/** 数据仓库权限申请列表返回 */
export interface IDwhDataAuthRequestListResponse {
    /** 总条数 */
    total_count: number
    /** 列表数据 */
    entries: IDwhDataAuthAuditListItem[]
}

/** 数据仓库权限申请列表返回（申请列表） */
export interface IDwhDataAuthRequestApplyListResponse {
    /** 总条数 */
    total_count: number
    /** 列表数据 */
    entries: IDwhDataAuthRequestApplyListItem[]
}

/** 数据仓库权限申请详情 */
export interface IDwhDataAuthRequestDetail {
    /** 申请ID */
    id: string
    /** 申请单名称 */
    name: string
    /** 申请类型 */
    request_type: string
    /** 草稿申请类型，草稿态时使用该字段回显 */
    draft_request_type?: string
    /** 申请人ID */
    applicant: string
    /** 申请人名称 */
    applicant_name: string
    /** 申请时间（时间戳） */
    apply_time: number
    /** 数据业务名称 */
    data_business_name: string
    /** 数据技术名称 */
    data_tech_name: string
    /** 数据ID */
    data_id: string
    /** 创建时间 */
    created_at: string
    /** 更新时间 */
    updated_at: string
    /** 状态信息 */
    status: IDwhDataAuthRequestStatus
    /** 过期时间 */
    expired_at: string | null
    /** 草稿过期时间，草稿态时使用该字段回显，0 或 null 代表永久 */
    draft_expired_at?: number | null
    /** 规格配置（JSON字符串） */
    spec: string
    /** 草稿规格配置（JSON字符串），存在则表示草稿态 */
    draft_spec?: string
}

/** 数据仓库权限申请更新参数 */
export interface IDwhDataAuthRequestUpdate {
    /** 申请单名称 */
    name: string
    /** 数据ID */
    data_id: string
    /** 申请类型 */
    request_type: string
    /** 过期时间，永久有效时为null，具体时间时为ISO格式字符串 */
    expired_at: string | null
    /** 规格配置（JSON字符串） */
    spec: string
}

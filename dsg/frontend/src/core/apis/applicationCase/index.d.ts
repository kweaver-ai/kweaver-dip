import {
    AppCaseSource,
    AppCaseStatus,
    CaseSortType,
    AppField,
    RefResourceType,
} from '@/components/ApplicationCase/const'
import { SortDirection } from '@/core'

/**
 * @param offset  页码
 * @param limit  每页数量
 * @param source  案例来源
 * @param keyword  keyword 搜索应用案例名称
 * @param data_catalog_id  数据资源目录id
 * @param status  状态 1待提交 2待审核 3已发布 4已取消发布 5未发布 6变更中 7已变更 8被驳回
 */
export interface IQueryList {
    offset?: number
    limit?: number
    source?: AppCaseSource
    // 过滤指定状态的应用案例
    status?: AppCaseStatus
    name?: string
    // 过滤属于指定部门及其子部门的应用案例
    department_id?: string

    // 是否返回审核拒绝意见
    audit_rejection?: boolean
    sort?: CaseSortType
    direction?: SortDirection
    keyword?: string
}

/**
 * 应用案例引用资源项
 * @param id 资源在本地即市平台的 ID
 * @param type 	资源类型。枚举值定义需要待定
 */
export interface RefResc {
    id: string
    type: RefResourceType
    name: string
    catalog_name: string
    description: string
}

/**
 * 应用领域
 * @param id AppField
 * @param description 描述，仅当应用案例为“其他”(id值为0)时有值
 */
export interface AppCaseField {
    id: AppField
    description?: string
}

export interface AppCaseItem {
    // 应用案例在本地即市平台的 ID
    id: string
    // 应用案例在省平台的 ID 只有本地创建并上报到省平台，或从省平台同步的应用案例的此字段非空
    id_in_province: string
    // 名称
    name: string
    // 描述
    description?: string
    // 所属应用领域
    field_type?: string
    field_description?: string
    // 所属部门的 ID
    department_id: string
    // 所属部门的名称
    department_name?: string
    // 业务事项（业务流程）的 ID
    process_id: string
    // 业务事项的名称，由服务端设置，不可修改
    process_name: string
    // 属于应用案例的资源列表
    resources: Array<RefResc>
    // 创建者的 ID。同一个创建者不能创建相同名称的应用案例。不同创建者可以创建相同名称的应用案例。
    creator_id: string
    // 来源
    source: AppCaseSource
    // 状态
    status: AppCaseStatus
    // 创建时间
    creation_timestamp: string
    // 审核拒绝意见
    audit_rejection: string

    application_id: string
    application_name: string
}

export interface IReportAppCaseParams {
    application_id: string
    name: string
    description: string
    field_type: string
    field_description?: string
    department_id: string
    process_id: string
    resources: {
        type: string
        id: string
    }
}

export enum IAppCaseAuditType {
    All = '',
    Report = 'af-sszd-application-example-report',
    Withdraw = 'af-sszd-application-example-withdraw',
}

export interface IAppCaseAuditItem {
    id: string
    type: IAppCaseAuditType
    application_example: AppCaseItem
    audit_status: string
    creation_timestamp: string
}
export interface IAppCaseAuditList {
    entries: IAppCaseAuditItem[]
    total_count: number
}

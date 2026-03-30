import { IGetListParams } from '../common'

// 方向
export enum Direction {
    // 子节点
    CHILDREN = 'forward',
    // 父节点
    PARENTS = 'reversely',
}

// 数据表类型
export enum DataTableType {
    // 表
    TABLE = 'table',
    // 字段
    COLUMN = 'column',
    // 指标
    INDICATOR = 'indicator',
}

export interface IDataConsanguinityParams {
    id: string
    type: DataTableType
    step?: number
    direction: Direction
}

export interface ILabelTreeItem {
    id: string
    name: string
    paths?: string
    pid: string
    type?: number
    children?: ILabelTreeItem[]
}
export interface ItagCategoryCreate {
    description?: string
    name: string
    range_type_keys?: string[]
    label_tree?: ILabelTreeItem[]
    id?: string
}
export interface ITagCategoryRes {
    audit_status: string
    description: string
    id: string
    label_tree_resp?: ILabelTreeItem[]
    name: string
    range_type: string
    state: number
    has_draft?: boolean
    reject_reason?: string
}
export interface categoryAppsListItem {
    description: string
    id: string
    name: string
    type: number
}
export interface labelCategoryItem {
    audit_status: string
    created_at: number
    created_name: string
    description: string
    id: string
    name: string
    range_type: string
    range_type_list?: string[]
    state: number
    updated_at: number
    updated_name: string
}
export interface ITagCategoryDetails {
    category_apps_list_resp?: categoryAppsListItem[]
    label_category_resp: labelCategoryItem
    label_tree_resp?: ILabelTreeItem[]
}
export interface ItagAuthCreate {
    apps_id: string
    id: string
    type: number // 是否智能:1-智能,0-非智能,默认为0-非智能
}

export interface ITagAuthListParams extends IGetListParams {
    id: string
}

export enum TagDetailsType {
    classify = 1,
    auth = 2,
    audit = 3,
}

export enum CAFileType {
    // 全部
    ALL = '',
    // 标准规范文件
    Standard = 'standard_spec',
    // 三定职责文件
    Responsibility = '3_def_response',
    // 建设依据文件
    ConstructionBasis = 'construct_basis',
    // 建设内容文件
    ConstructionContent = 'construct_content',
}

// 文件列表左侧树结构类型
export enum CAFileTreeType {
    // 文件类型
    FileType = 'files_type',
    // 业务域
    BusinessDomain = 'business_domain',
    // 部门/组织架构
    Department = 'department',
    // 信息系统
    InfoSystem = 'info_system',
}

export enum ViewMode {
    // 文件类型
    FileType = 'CAFileType',
    // 业务域
    Domain = 'domain',
    // 部门/组织架构
    Department = 'department',
    // 信息系统
    InfoSystem = 'infoSystem',
}

export interface ICAFileListParams extends IGetListParams {
    id?: string
    // 关联对象ID数组（部门ID、业务领域id、信息系统id），最多30个
    related_object_id?: Array<string>
    // 文件类型 standard_spec标准规范，3_def_response三定职责，construct_basis建设依据，construct_content建设内容
    // type: CAFileType
    type: any
    // 文件列表左侧树结构类型
    business_type: CAFileTreeType
    // 	是否未分类1是，0否；未分类时不查询ID和关联的对象ID
    un_class_type?: number
    // 创建时间范围
    created_at?: any
    // 创建开始时间
    create_begin_time?: any
    // 创建结束时间
    create_end_time?: any
}

export interface ICAFileItem {
    // 非必须		创建时间
    create_at?: number
    // 必须		对象存储ID
    export_oss_id: string
    // 必须		文件ID
    id: string
    // 必须		文件名称
    name: string
    // 非必须		预览pdf的对象存储ID，没有数据时后台没转好需前端按钮变灰
    preview_oss_id?: string
    // 必须		关联对象ID数组（部门ID、业务领域id、信息系统id）
    related_object_id: string
    // 必须		文件类型standard_spec标准规范，3_def_response三定职责，construct_basis建设依据，construct_content建设内容
    type: CAFileType
}

export interface IPreviewCAFileParams {
    id: string
    preview_id: string
}

export interface IPreviewCAFileRes {
    // 必须		预览链接地址
    href_url: string
    // 必须		文件id
    id: string
    // 必须		文件预览对象存储id
    preview_id: string
}

export interface IDownloadCAFileParams {
    id: string
    oss_id: string
}

export interface IDownloadCAFileRes {
    // 文件流
    content?: any

    Content?: any
    // 必须		文件名称
    name: string
}

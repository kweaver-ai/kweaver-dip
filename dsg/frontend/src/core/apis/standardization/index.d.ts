import { Source, StdStatus, SortDirection, IDataItem } from '../common'

// ****************************************** 数据元 start ******************************************

// 数据元列表
export interface IDataElement {
    id: string
    keyword?: string
    code?: string
    name_en: string
    name_cn: string
    synonym?: string
    std_type?: number
    data_type?: number
    data_length?: number
    data_precision?: number
    dict_code?: string
    // dict_name_cn?: string
    // dict_name_en?: string
    description?: string
    state?: StateType
    deleted?: boolean
    version?: number
    version_out?: string
    create_user?: string
    create_time?: string
    update_user?: string
    update_time?: string
    // std_file_code?: string
    catalog_id?: string
    catalog_name?: string
    dict_id?: string
    dict_name?: string
    rule_id?: string
    rule_name?: string
    data_type_name?: string
    isRec?: boolean
}

export interface IQueryDE {
    // 与目录的中英文名称、同义词模糊匹配，超过20时自动截断
    keyword?: string

    // 标准类型
    std_type?: number

    // 默认为1（>=1），小于1则强制为1
    offset?: number

    // 默认20（可根据功能修改默认值），范围为 [1, 1000]，超出范围则取对应的最值
    limit?: number

    sort?: string

    direction?: string
}

export interface IQueryDEByFileCatlg extends IQueryDE {
    // 文件目录标识
    file_catalog_id: string | number

    state?: StateType
}

export interface IQueryDEByFileId extends IQueryDE {
    // 文件目录标识
    file_id: string | number
}

// 数据元
export interface IDataElementDetail {
    state?: string
    disable_reason?: string
    version?: number
    deleted?: string
    authority_id?: string
    create_time?: string
    create_user?: string
    update_time?: string
    update_user?: string
    id: string
    code: string
    name_en: string
    name_cn: string
    synonym?: string
    std_type?: number
    data_type?: number
    data_length?: number
    data_precision?: number
    dict_id?: string
    dict_code?: string
    dict_name_cn?: string
    dict_name_en?: string
    dict_state?: StateType
    dict_deleted?: boolean
    description?: string
    version?: number
    version_out?: string
    // 码表状态
    state?: StateType
    disable_reason?: string
    // 标准文件集合
    std_files?: Array<{
        file_id: string
        file_name: string
        file_state: string
        file_deleted: boolean
    }>
    catalog_id: string
    catalog_name: string
    // 码值枚举集合
    dict_enum?: Array<any>
    // 码表中文名称
    ch_name?: string
    // 版本号
    version_out?: string
    // 数据类型名称
    data_type_name: string
    // 标准分类名称
    std_type_name: string
    // 编码规则标识
    rule_id?: string
    // 编码规则名称
    rule_name?: string
    // 编码规则内容
    rule_content?: any
    // 编码规则状态
    rule_state?: StateType
    rule_deleted?: boolean
    // 值域，格式：1、标识范围：(1,9999) 2、标识列表：[1,2,3,4,5]
    data_range?: string
    delete?: boolean
    label_id?: string
    label_name?: string
    label_icon?: string

    department_name?: string
    department_path_name?: string
}

export interface IHistoryItem {
    update_user: string
    update_time: string
    version?: number
    // 数据元后端version字段为数字，但是与码表统一，所以后端将version处理之后放到version_out中
    versiont_out: string
    update_content: {}
}

/**
 * 校验数据元重复类型
 */
export enum ValidDERepeatType {
    // 中文名称字段
    NAME_CN = 'DE_NAME_CN',
    // 英文名称字段
    NAME_EN = 'DE_NAME_EN',
}

// 校验码表是否重复
export interface ICheckDataEleRepeat {
    // std_type number 标准类型
    std_type?: number

    // name	string	否
    name?: string

    // 校验类型
    repeat_type?: ValidDERepeatType

    //	编辑时需要，过滤该ID对应的记录后再查询数据是否存在
    id?: string
}

export interface IRuleItem {
    rule_id: string
    name: string
}

export interface IDataEleQueryItem {
    catalog_id: string
    data_length: number
    data_precision: number
    data_type: number
    description: string
    dict_code: string
    name_cn: string
    name_en: string
    rule_ids: string
    std_type: number
    std_file?: string
    synonym: string
}

// ****************************************** 数据元 end ******************************************

// ****************************************** 码表 start ******************************************

/**
 * 码表
 * @params authority_id 权限域（目前为预留字段）
 * @params enums 码值列表
 * @params quote_dataEle_list 引用该码表的数据元列表（需手动查询注入）
 * @params used_flag 该码表是否被引用
 * @params change_info_list 码表修改信息（包括字段：）
 */
export interface IDictItem {
    id: string
    code: string
    ch_name: string
    en_name: string
    description: string
    catalog_id: string
    catalog_name?: string
    state: StateType
    org_type: number
    authority_id?: string
    std_file_code: string
    // 标准文件名称
    std_file_name?: string
    // 标准文件id数组
    std_files: Array<string>
    enums?: Array<IDictValueItem>
    version?: number
    create_time?: string
    create_user?: string
    update_time?: string
    update_user?: string
    used_flag: boolean
    // 是否删除：false-未删除，true：已删除
    deleted: boolean

    department_name?: string
    department_path_name?: string
}

// 校验码表是否重复
export interface ICheckDictRepeat {
    // number	string	 是
    number?: string

    // name	string	否
    ch_name?: string

    // org_type		number	标准编号
    en_name?: number

    //	编辑时需要，过滤该ID对应的记录后再查询数据是否存在
    filter_id?: string
}

/**
 * 修改列表（dict_update_list/enum_add_list/enum_del_list/enum_update_list）
 * @params dict_update_list：包括field_name/old_value/new_value
 * @params 其余三个列表：包括code/old_value?/old_description?/new_value?/new_description?
 */
export interface IChangeInfo {
    old_version: string
    new_version: string
    version: number
    dict_update_list?: Array<IChangeInfoItem>
    enum_add_list?: Array<IChangeInfoItem>
    enum_del_list?: Array<IChangeInfoItem>
    enum_update_list?: Array<IChangeInfoItem>
}

/**
 * @params filed_name 字段名称（英文名称/中文名称/说明/标准分类）
 * @params old_value 历史值（enum_add_list中不含此参数）
 * @params old_description 历史值（enum_add_list中不含此参数）
 * @params new_value 当前值（enum_del_list中不含此参数）
 * @params new_description 当前值（enum_del_list中不含此参数）
 */
export interface IChangeInfoItem {
    code?: string
    filed_name?: string
    old_value: string
    new_value: string
    old_description?: string
    new_description?: string
}

export interface IDictValueItem {
    code: string
    description?: string
    dict_id?: string
    id: string
    value: string
}

export interface IDictQuery {
    dict_id?: string
    // 自定义目录/标准文件目录
    catalog_id?: string
    // 文件id-可通过此参数查询关联文件码表
    file_id?: string
    // 启用/停用：enable-启用,disable-停用
    state?: string
    keyword?: string
    offset?: number
    limit?: number
    sort?: string
    direction?: string
    org_type?: number // 制定标准 取值：stardOrignizeTypeList
    // 部门id
    department_id?: string
}

// ****************************************** 码表 end ******************************************

// ****************************************** 编码规则 start ******************************************

// 目录类型——前端
// 数据源/码表/编码规则左侧-标准文件目录中目录类型
export enum StdFileCatlgType {
    CATALOG = 'catalog',
    FILE = 'file',
}

interface IStdCommonRes<T> {
    code: string
    description: string
    solution: string
    total_count: number
    cause: string
    data: T
}

// 编码规则
export interface ICRuleItem {
    id: string
    name: string
    source: Source
    detail: string
    description: string
    version: string
    catalog_id: string
    catalog_name: string
    authority_id: string
    create_time: string
    update_time: string
    status?: StdStatus
    used_flag: boolean
    del_flag: boolean
    create_user: string
    update_user: string
    // 标准组织类型，参考《01.通用字典定义》标准组织类型，必填默认全部
    org_type?: number
    // 是否停用，启用/停用：enable-启用,disable-停用
    state: StateType
    // 是否删除：false-未删除，true：已删除
    deleted: boolean
    std_files: Array<string>
    custom?: Array<{
        name: string
        segment_length: number
        type: number
        value: string
    }>
    rule_type: string
    regex?: string
    isRec?: boolean

    department_ids: string
    department_id: string
    department_name?: string
    department_path_name?: string
}

export interface ICRuleQuery {
    file_id?: string
    catalog_id?: string
    state?: StdStatus
    keyword?: string
    offset?: number
    limit?: number
    sort?: string
    direction?: SortDirection
    org_type?: string | number | undefined
    source?: Source
    file_id?: string
    rule_type?: 'REGEX' | 'CUSTOM'
    department_id?: string
}

export interface ICreateCodeRule {
    catalog_id: string
    name: string
    org_type: number
    description?: string
    regex?: string
    rule_type: string
    std_files: string
    custom?: {
        name?: string
        segment_length: number
        type: number
        value: string
    }
}

export interface ICodeRuleDataElement {
    id: string
    code: string
    name_en: string
    name_cn: string
}

// ****************************************** 编码规则 end ******************************************

// ****************************************** 文件 start ******************************************

// 启用状态-启用/停用：enable-启用，disable-停用
export enum StateType {
    ENABLE = 'enable',
    DISABLE = 'disable',
}

// 标准文件附件类型：0-文件上传，1-填写的文件连接
// export enum AttachmentType {
//     FILEUPLOAD = 0,
//     FILELINK = 1,
// }

// 查询文件列表参数
export interface IFileQuery {
    // 目录Id
    catalog_id?: string | number

    // 关键字，用于模糊搜索（作用于标准文件名称和编号上）
    keyword?: string

    // 标准组织类型，参考《01.通用字典定义》标准组织类型，必填默认全部
    org_type?: number

    // 启用/停用：enable-启用,disable-停用
    state?: StateType

    // 开始响应的项目的偏移量，为空默认1，小于1取1，其余取offset值。
    offset?: number

    // 每页最多可返回的项目数，为空默认20，小于1取1，大于1000取1000，其余取limit的值。
    limit?: number

    // 排序字段：create_time/act_time/stop_time/enabled，默认：create_time
    sort?: string

    // 排序方向：asc/desc 默认：desc
    direction?: string

    // 部门id
    department_id?: string
}

export interface IFileItem {
    // 唯一标识
    id: string

    // 版本号，从1开始。
    version: number

    // 目录ID
    catalog_id?: number

    // 目录名称
    catalog_name?: string

    // 标准文件名称-不带文件后缀
    name: string

    // 标准编号，例如：GB/T1900-2003
    number: string

    // 实施日期
    act_date: number

    // 停用日期，用户手动标记为停用时的日期。
    disable_date?: number

    // 是否停用，启用/停用：enable-启用,disable-停用
    state: StateType

    // 停用原因，当f_stop_state为1是必填。
    disable_reason?: string

    // 标准文件附件类型：0-文件上传，1-填写的文件连接
    attachment_type: AttachmentType

    // 文件保存路径地址，当f_attachment_type为0时，填写文件实际存储的url，当f_attachment_type为1是填写用户自己填写url。
    attachment_url: string

    // 文件名称，带文件后缀，如“国家标准.pdf”，当f_attachment_type为0时，填写文件的名称，当f_attachment_type为1是填写用户自己填写url。
    file_name: string

    // 参考《01.通用字典定义》标准组织类型
    org_type: number

    // 描述
    description?: string

    // 权限域（目前为预留字段）
    authority_id: number

    // 创建时间
    create_time?: number

    // 创建用户（ID）
    create_user?: string

    // 修改时间
    upate_time?: number

    // 修改用户（ID）
    upate_user?: string

    // 是否删除：false-未删除，true：已删除
    deleted: boolean

    department_name?: string
    department_path_name?: string
}

// 标准文件附件类型：FILE-文件上传，URL-填写的文件连接
export enum AttachmentType {
    FILE = 'FILE',
    URL = 'URL',
}

// 新建文件项
export interface IAddFileItem {
    //	标准编号
    number?: string

    // 标准名称
    name: string

    // 目录id
    catalog_id: string

    // 参考《01.通用字典定义》标准组织类型
    org_type: number

    // 实施日期，格式：yyyy-MM-dd
    act_date?: string

    // 备注
    description?: string

    // 标准文件附件类型：FILE-文件上传，URL-填写的文件连接
    attachment_type: AttachmentType

    // attachment_type为URL时必填
    attachment_url?: string
}

// 文件关联数据
export interface IFileAssociateInfo {
    // 关联数据元
    relation_de_list: Array<IDataItem>
    // 关联码表
    relation_dict_list: Array<IDataItem>
    // 关联编码规则
    relation_rule_list: Array<IDataItem>
}

// 文件详情
export interface IFileInfo extends IFileItem, IFileAssociateInfo {}

// ****************************************** 文件 end ******************************************

// ****************************************** 业务表-标准化 start ******************************************

export interface IBusinFiledDataEle {
    name_cn: string
    name_en: string
    std_type: number
}

export interface IBusinTable {
    business_table_id: string
    business_table_name: string
    business_table_type: string
    // 业务表待新建标准字段数
    total_number: number

    // 业务表待新建标准字段已完成未采纳数
    created_number?: number
}

/**
 * 业务表字段-新建标准
 */
export interface IBusinTableField {
    // id: string
    // // 业务表名称
    // business_table_name: string
    // // 业务表字段当前名称
    // business_table_field_current_name: string
    // // 业务表字段原始名称
    // business_table_field_origin_name: string
    // // 业务表字段说明
    // business_table_field_description?: string
    // // 新建标准状态：0-未开始，1-进行中
    // task_status?: number
    // // 创建用户（发起请求人）
    // create_user?: string
    // // 修改用户
    // update_user?: string
    // // 请求开始时间
    // create_start_time?: string
    // // 请求结束时间
    // create_end_time?: string
    // // 修改时间
    // update_time?: string

    id: string
    // 必填，业务表名称
    business_table_name: string
    // 必填，业务表ID
    business_table_id: string
    // 必填，业务表类型
    business_table_type: string
    // 必填，业务表字段ID
    business_table_field_id: string
    // 必填，业务表字段当前名称
    business_table_field_current_name: string
    // 非必填，业务表字段原始名称
    business_table_field_origin_name?: string
    // 必填，业务表字段当前英文名称
    business_table_field_current_name_en: string
    // 非必填，业务表字段原始英文名称
    business_table_field_origin_name_en?: string
    // 必填，标准分类
    business_table_field_current_std_type: string
    // 必填，标准分类
    business_table_field_origin_std_type: string
    // 必填，数据类型
    business_table_field_data_type: string
    // 数据长度
    business_table_field_data_length?: number
    // 数据精度
    business_table_field_data_precision?: number
    // 码表名称
    business_table_field_dict_name?: string
    // 编码规则名称
    business_table_field_rule_name?: string
    // 非必填，业务表字段说明
    business_table_field_description?: string
    // 带新建标准-进行中-字段关联任务状态
    task_status?: string
    // 创建用户（发起请求人）
    create_user?: string
    // 请求开始时间
    create_start_time?: string
    // 请求结束时间
    create_end_time?: string
    // 修改用户
    // update_user?: string
    // 修改时间
    // update_time?: string

    // 数据元ID
    data_element_id?: string
    // 数据元
    data_element?: IBusinFiledDataEle

    // 关联任务id
    task_id?: string
}

export interface IPendingBusinsTableQuery {
    // 业务表模型id
    business_table_model_id: string

    // 状态：0-待发起，1-进行中，2-已完成未采纳，3-已采纳，4-不在新建标准列表中
    state?: string

    // 表名称关键字
    keyword?: string
}

// 待新建标准-业务表字段查询
export interface IPendingBusinsTableFieldQuery {
    // 业务表模型id
    business_table_model_id: string

    // 业务表id
    business_table_id: string

    // tab状态：0-待发起，1-进行中，2-已完成未采纳，3-已采纳，4-不在新建标准列表中
    state?: string

    // 进行中-新建标准状态-未开始/进行中
    // taskState?: any

    // 字段搜索关键字
    keyword?: string

    offset?: number
    limit?: number
    // 排序字段：update_time/create_time，默认：create_time
    sort?: string
    // 排序方向：asc/desc  默认：desc
    direction?: string
}

export interface IPendingRes<T> {
    data: T[]
    limit?: number
    offset?: number
    total_count: number
}

// ****************************************** 业务表-标准化 end ******************************************

export interface IStdRecTableField {
    table_field: string
    table_field_description?: string
    std_ref_file?: string
    rec_stds?: any[]
}
export interface IStdRecParams {
    table_name: string
    table_description?: string
    department_id?: string
    table_fields: IStdRecTableField[]
    department_id?: string
}

export interface IStdRecRes {
    code?: string
    description?: string
    totalCount?: number
    solution?: string
    data: {
        table: string
        table_description?: string
        department_id?: string
        table_fields: IStdRecTableField[]
    }
}

export interface IRuleRecParams {
    table_name?: string
    table_desc?: string
    table_id?: string
    fields: {
        field_id?: string
        field_name: string
        field_desc?: string
        standard_id?: string
    }[]
    department_id?: string
}

export interface IRuleRecItem {
    rule_id?: string
    rule_name?: string
    org_type?: string
}

export interface IRuleRecRes {
    code?: string
    description?: string
    totalCount?: number
    solution?: string
    data: {
        table_name?: string
        fields: { name: string; rec: IRuleRecItem[] }[]
    }[]
}

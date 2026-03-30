import { IListParams, SortDirection, SortType } from '../common'

export interface IPrvcDataCatlgListQuery extends IListParams {
    // 数据目录提供方编码, 政务部门所在组织机构的统一社会信用代码
    org_code?: string
    // 根据共享类型过滤
    share_type?: string
}

export enum PrvcCatlgRescType {
    // 库表
    DB = 'view',
    // 接口
    API = 'api',
    // 文件
    File = 'file',
}

export interface IPrvcCatlgRescItem {
    // 资源类型
    resource_items?: Array<{
        // 资源ID
        resource_id?: string
        // 资源名称
        resource_name?: string
    }>
    // 资源类型，api,db,file
    resource_type?: PrvcCatlgRescType
}

// 资源状态，1：生效中，0已撤销，上报无需传// 目录摘要
export enum IPrvcCatlgRescStatus {
    CANCEL = false,
    INEFFECT = true,
}

// 目录列表项
export interface IPrvcDataCatlgListItem {
    // 目录摘要说明
    abstract?: string
    // 目录编制部门名称
    dept_name?: string
    // 目录编码
    id?: string
    // 目录信息项目名称
    info_item_names?: string[]
    // 数据目录提供方编码, 政务部门所在组织机构的统一社会信用代码
    org_code?: string
    // 目录关联的资源分组
    resource_groups?: Object<IPrvcCatlgRescItem>
    // 共享类型
    share_type?: number
    // 资源状态，1：生效中，0已撤销，上报无需传
    status?: boolean
    // 目录标题
    title?: string
    // 更新时间
    updated_at?: number
}

// 目录详情
export interface IPrvcDataCatlgDetail {
    // 关联资源
    // resource_groups?: Object<{
    //     any: Array<{
    //         resource_id: string
    //         resource_name: string
    //     }>
    // }>
    resource_groups?: any
    // 目录名称
    title?: string
    // 是否点击证照编码
    certification_type?: string
    // 描述
    abstract?: string
    // 联系人姓名
    contact_name?: string
    // 联系人电话
    contact_phone?: string
    // 目录编制部门名称
    dept_name?: string
    // 来源系统
    dxwd34?: string
    // // 数据分级
    // fenji?: number
    // // 系统所属分类
    // fenlei?: number
    // 其他所属领域，当所属领域类型为“其他”时，该项必填
    field_desc?: string
    // 数据所属领域
    field_type?: string
    // 目录编码
    id?: string
    // 数据所属事项名称，如果无对应事项，填写“*”；如有多个事项，以“|”隔开
    item?: string
    // 实施清单编码,事项来源为国家事项基本目录且行使层级在本级，该项为必填。实施清单编码应符合国家政务服务平台标准C0109.1 的要求；如有多个实施清单编码，以“|”隔开；
    item_code?: string
    // // 目录梳理类型,表示数据目录是否与政务服务事项有关联: 1: 基于事项梳理的数据目录，填写1时，calogCode的12位事项基本目录编码为必填，且不为0。;0: 其他目录 ，calogCode的12位事项基本目录编码补充0
    // item_type?: string
    // 数据所属层级
    level_type?: string
    // 提供渠道
    net_type?: string
    // 向社会开放条件
    open_condition?: string
    // 开放类型
    open_type?: string
    // 共享条件
    share_condition?: string
    // 共享类型
    share_type?: string
    // 数据目录提供方编码, 政务部门所在组织机构的统一社会信用代码
    org_code?: string
    // 其他更新周期，当更新周期类型为“其他”时，该项必填
    other_update_cycle?: string
    // 使用要求
    shiyong?: string
    // 数据时间范围
    sjsjfw?: string
    // 数据来源事项基本目录名称
    source_item_catalog?: string
    // 资源状态，1：生效中，0已撤销，上报无需传// 目录摘要
    status?: boolean
    // 业务办理项编码,业务办理项编码应符合国家政务服务平台标准C0109.1 要求；如有多个业务办理项编码，以“|”隔开
    task_handler_item?: string
    // 更新周期
    update_cycle?: string
    // 更新时间
    updated_at?: number
    // 应用场景
    use_type?: string
    // 其他应用场景描述，当应用场景为“其他”时，该项必填
    user_desc?: string
    // 是否发布
    xld32?: boolean
    // 数据加工程度
    xldx27?: string
    // 数据区域范围
    xldx33?: number
    // 数据来源事项实施清单名称
    xldx40?: string
    // 数据来源事项业务办理项名称
    xldx41?: string
    // 数据关联事项基本目录名称
    xldx43?: string
    // 提供方所在行政区划
    division_code?: string
}

// 信息项
export interface IPrvcDataCatlgInfoItem {
    // 接口资源ID
    api_resource_id?: string
    // 库表信息ID
    db_resource_id?: string
    // 目录编制部门名称
    dept_name?: string
    // 文件资源ID
    file_resource_id?: string

    // 共享条件
    column_access_condition?: string
    // 共享类型
    column_access_limit?: boolean
    // 信息项目编码
    column_code?: string
    // 信息项中文名
    column_name_cn?: string
    // 信息项目英文名
    column_name_en?: string
    // 字段类型
    data_format?: string
    // 字段描述
    des?: string
    // 唯一id，雪花算法
    id?: number
    // 字段长度
    length?: number
    // 是否主键
    primary_key?: boolean
    // 敏感等级
    sensitive_level?: boolean
    // 来源应用系统编码
    system_id?: string
    // 更新时间
    updated_at?: number
}

// 库表信息
export interface IPrvcDataCatlgDB {
    // 字段与信息项映射
    column_mapping?: Array<{
        db_column_en_name?: string
        info_item_en_name?: string
    }>

    // 前置库数据源名,上级通过线下发给下级，目录下发时无此参数
    connection?: string
    day_of_month?: string
    hour_of_day?: string
    minute?: string
    minute_of_hour?: string
    resource_desc?: string
    resource_id?: string
    resource_name?: string
    schedule_type?: string
    status?: boolean
    updated_at?: number
    weekday?: string
}

// 目录接口信息
export interface IPrvcDataCatlgApi {
    address?: string
    // 固定的query参数
    fixed_query?: object[]
    // http请求方法
    http_method?: string
    // 定义对象列表
    object_list?: string
    // 服务路径，同步时无此参数
    path?: string
    // Query参数
    query?: object[]
    // 请求body
    request_body?: object[]
    // 服务请求报文格式
    request_content_type?: string[]
    // 请求例子
    request_example?: string
    // 请求body
    request_header?: object[]
    // 资源描述
    resource_desc?: string
    // 资源 ID；同步目录接口返回资源带有该标识，上报无需传此参数
    resource_id?: string
    // 资源名称
    resource_name?: string
    // 服务响应报文格式
    response_content_type?: string[]
    // 响应列子
    response_example?: string
    // 响应header
    response_header?: object[]
    // 响应参数
    response_parameters?: object[]
    // 服务协议
    schemes?: string
    // 服务状态，1：生效中，0已撤销，上报无需传
    status?: number
    // 更新时间
    updated_at?: number
}

// 目录文件信息
export interface IPrvcDataCatlgFile {
    connection?: string
    // 当月第几天; 当 schedule_type 为dayOfMonth 时填写，如调度时间为每个月 5 号的 8:10，则该值为 5
    day_of_month?: string
    // 前置库存储上报文件的文件路径;目录同步的时候不返回
    file_path?: string
    // 当天第几个小时; 当 schedule_type 为非minute 时填写，如调度时间为 8:10，则该值为8
    hour_of_day?: string
    // 分钟间隔  当 schedule_type为minute 时填写
    minute?: string
    // 分钟（具体时刻）;当 schedule_type为非minute 时填写，如调度时间为 8:10，则该值为10
    minute_of_hour?: string
    // 资源描述
    resource_desc?: string
    // 资源 ID；同步目录接口返回资源带有该标识，上报无需传此参数
    resource_id?: string
    // 资源名称
    resource_name?: string
    // 调度类型:none一次性；minute按分钟；hourofday按天；weekday按周；dayOfMonth按月
    schedule_type?: string
    // 服务状态，1：生效中，0已撤销，上报无需传
    status?: boolean
    // 更新时间
    updated_at?: number
    // 星期几,当 schedule_type 为weekday时填写，如调度时间为每星期三的8:10，则该值为3；星期日~星期六对应的数字为 1~7
    weekday?: string
}

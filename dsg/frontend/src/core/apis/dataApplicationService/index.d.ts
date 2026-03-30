// export interface DataList<T> {
//     entries: Array<T>
//     total_count: number
// }

export interface BasicInfo {
    name: string
    id: string
}

export interface Schemas {
    // 库分类
    catalog_name: string

    // 库名
    schema_name: string

    data_source_id?: string

    data_source_name?: string

    schema_id?: string

    schema_name?: string
    data_source_type?: string
}

export interface ColumnsParams extends Schemas {
    table_name: string
}

export interface ColumnsInfo {
    en_name: string
    cn_name: string
    type: string
}

export interface CatalogsDetail {
    code: string
    id: string
    name: string
    schema_name: string
    table_id: string
    table_name: string
    catalog_name: string
}
/**
 * @param offset  页码
 * @param limit  每页数量
 * @param service_name  服务名称
 * @param category_id  服务类别id
 * @param department_id  所属部门id
 * @param data_catalog_id  数据资源目录id
 * @param status  状态 1待提交 2待审核 3已发布 4已取消发布 5未发布 6变更中 7已变更 8被驳回
 * @param start_time  开始时间
 * @param end_time  结束时间
 * @param microservice  微服务 1否 2是
 * @param service_type  服务类型 1服务生成 2服务注册
 */
export interface IQueryList {
    offset?: number
    limit?: number
    service_name?: string
    service_keyword?: string
    category_id?: string
    department_id?: string
    data_catalog_id?: string
    // 数据资源目录下：传参，publish_status字段，值为 published
    publish_status?: string
    // 输入多个发布、上线状态，以逗号分隔，返回属于其中任意一个状态的接口服务
    publish_and_online_statuses?: string
    // 数据资源模式下：传参，status字段，值为online
    status?: string | number
    start_time?: string
    end_time?: string
    microservice?: string | number
    service_type?: string | number
    subject_domain_id?: string
    sort?: string
    direction?: string
    data_catalog_id?: string
    is_user_dep?: string
    category_node_id?: string
    info_system_id?: string
    my_department_resource?: boolean
}

/**
 * 详情-资源列表项
 * @param id id
 * @param service_code 编码
 * @param service_path 服务路径
 * @param service_address 服务地址
 * @param service_name 服务名称
 * @param create_model 创建模式 1向导模式 2脚本模式
 * @param flow_name 编码
 * @param flow_node_id 编码
 * @param flow_node_name 编码
 * @param flow_type 编码
 * @param flow_version
 * @param labels 编码
 * @param operations 编码
 * @param orgcode 编码
 * @param orgname 编码
 * @param service_count 编码
 * @param state 编码
 * @param table_count 编码
 * @param title 编码
 * @param updated_at 更新时间
 * @param version 版本号
 */
export interface IRescItem {
    id: string
    service_code: string
    service_type?: string
    created_at?: string
    data_kind?: number
    file_count?: number
    flow_id?: string
    flow_name?: string
    flow_node_id?: string
    flow_node_name?: string
    flow_type?: number
    flow_version?: string
    operations?: number
    orgcode?: string
    orgname?: string
    service_count?: number
    state?: number
    table_count?: number
    title?: string
    updated_at?: string
    version?: string
    service_id: string
}

/**
 * 表单转换为sql的参数
 */
export interface formToSqlParams {
    data_view_id: string
    datasource_id: string
    data_table_request_params: Array<{
        operator: string
        sort: string
    }>
    data_table_response_params: Array<{
        en_name: string
    }>
}

interface IDataServicInfo {
    app: { id: string; name: string }
    business_domain_id: string
    category: { id: string; name: string }
    create_time: string
    data_catalog_id: string
    data_range: string
    department: { id: string; name: string }
    description: string
    developer: { id: string; name: string }
    http_method: string
    interface_type: string
    market_publish: string
    microservice: string
    network_region: string
    protocol: string
    rate_limiting: number
    return_param: string
    return_type: string
    service_address: string
    service_code: string
    service_instance: string
    service_name: string
    service_path: string
    service_type: string
    status: string
    system: { id: string; name: string }
    tags: any[]
    timeout: number
    update_cycle: string
}
interface IDataServiceParams {
    script: string
    connection_pool: {
        connection_pool_id: string
        connection_pool_name: string
    }
    create_model: string
    data_catalog: { id: string; code: string; name: string }
    data_source: {
        catalog_name: string
        data_source_id: string
        data_source_name: string
        schema_id: string
        schema_name: string
    }
    data_source_select_type: string
    data_source_type: string
    data_table: { table_id: string; table_name: string }
    data_table_request_params: {
        alias_name: string
        cn_name: string
        data_type: string
        default_value: string
        description: string
        en_name: string
        masking: string
        operator: string
        param_type: string
        required: string
        sequence: number
        sort: string
    }[]
    data_table_response_params: {
        alias_name: string
        cn_name: string
        data_type: string
        default_value: string
        description: string
        en_name: string
        masking: string
        operator: string
        param_type: string
        required: string
        sequence: number
        sort: string
    }[]
}

interface IDataServiceResponse {
    page: string
    page_size: number
    rules: {
        param: string
        operator: string
        value: string
    }[]
}

interface IDataServiceTest {
    request_example: string
    response_example: string
}
export interface IDataServiceDetail {
    service_info: IDataServicInfo
    service_param: IDataServiceParams
    service_response: IDataServiceResponse
    service_test: IDataServiceTest
}

export interface IOrders {
    direction: 'asc' | 'desc' | string
    sort: string
}
export interface IInterfaceQueryParams {
    // 搜索关键字
    keyword?: string
    // 分页标志
    next_flag?: Array<string>

    // 排序参数 [direction ('asc', 'desc') 升序/降序， sort ('update_at') 排序条件]
    orders?: IOrders[]

    // 所属组织架构id
    orgcode?: string
    org_code?: string

    // 单页多少条
    size?: number
}

export type InterfaceData = {
    // 用户 id
    data_owner_id: string

    // 用户 名称
    data_owner_name: string
    // 接口服务描述，可能存在高亮标签
    description: string

    // 接口服务id
    id: string

    // 接口服务名称，可能存在高亮标签
    name: string

    // 接口服务发布时间
    online_at: number

    // 接口服务所属组织架构ID
    orgcode: string

    // 接口服务所属组织架构ID
    orgname: string

    // 接口服务描述，不会存在高亮标签
    raw_description: string

    // 接口服务名称，不会存在高亮标签
    raw_name: string

    //   接口服务更新时间
    updated_at: number
}

export interface InterfaceDataList {
    // 数据列表
    entries: Array<InterfaceData>

    // 下一页数据参数
    next_flag: Array<string>

    // 总数
    total_count: number
}

/**
 * 筛选下拉选项
 */
export interface OptionsListData {
    publish_status: Array<OptionItem>
    updown_status: Array<OptionItem>
}

/**
 * 下拉单项
 */
export interface OptionItem {
    key: string
    text: string
}

export interface IInterfaceStatusStatisticsItem {
    // 接口服务总数
    service_count: number
    // 未发布数量
    unpublished_count: number
    // 已发布数量
    published_count: number
    // 未上线数量
    notline_count: number
    // 已上线数量
    online_count: number
    // 已下线数量
    offline_count: number
}

export interface IInterfaceAuditStatistics {
    // 发布待审核
    af_data_application_publish_auditing_count: number
    // 发布审核未通过
    af_data_application_publish_reject_count: number
    // 发布审核通过
    af_data_application_publish_pass_count: number
    // 上线待审核
    af_data_application_online_auditing_count: number
    // 上线审核未通过
    af_data_application_online_reject_count: number
    // 上线审核通过
    af_data_application_online_pass_count: number
    // 下线待审核
    af_data_application_offline_auditing_count: number
    // 下线审核未通过
    af_data_application_offline_reject_count: number
    // 下线审核通过
    af_data_application_offline_pass_count: number
}

export interface IInterfaceStatusStatistics {
    total_statistics: IInterfaceStatusStatisticsItem & IInterfaceAuditStatistics
    generate_statistics: IInterfaceStatusStatisticsItem
    register_statistics: IInterfaceStatusStatisticsItem
}

export interface IInterfaceDepartmentStatistics {
    // department_count
    department_count: number
    department_statistics: {
        department_id: string
        department_name: string
        // 已发布数量
        published_count: number
        // 总数
        total_count: number
        // 已发布占比
        rate: number
    }[]
}

export interface IInterfaceDailyStatisticsParams {
    department_id?: string
    service_type?: string
    key?: string
    start_time?: string
    end_time?: string
}

export interface IInterfaceDailyStatisticsItem {
    success_count: number
    fail_count: number
    online_count: number
    apply_count: number
    record_date: string
}

// 监控状态
export enum MonitoringStatus {
    // 全部
    All = '',
    // 成功
    Success = 'success',
    // 错误监控
    Fail = 'fail',
}

// 监控列表请求参数
export interface IMonitorListReq {
    // 起始页码，默认1
    offset?: number
    // 单页行数，默认20
    limit?: number
    // 排序字段，默认calltime
    sort?: string
    // 排序方向，默认desc
    direction?: string
    // 服务id
    service_id?: string
    // 搜索关键字，此功能中对应服务名称
    keyword?: string
    // 服务所属部门id
    service_department_id?: string
    // 调用部门名称
    call_department_id?: string
    // 调用系统名称
    call_system_id?: string
    // 调用应用名称
    call_app_id?: string
    // 请求状态
    status?: MonitoringStatus
    // 开始时间
    start_time?: string
    // 结束时间
    end_time?: string
}

// 监控列表响应参数
export interface IMonitorListRes {
    // 服务ID
    service_id: string
    // 服务名称
    service_name: string
    // 服务所属部门ID
    service_department_id: string
    // 服务所属部门名称
    service_department_name: string
    // 服务所属部门路径
    service_department_path: string
    // 调用部门ID
    call_department_id: string
    // 调用部门名称
    call_department_name: string
    // 调用部门路径
    call_department_path: string
    // 调用系统ID
    call_system_id: string
    // 调用系统名称
    call_system_name: string
    // 调用应用ID
    call_app_id: string
    // 调用应用名称
    call_app_name: string
    // 调用IP和端口
    call_host_and_port: string
    // 调用时间
    call_time: string
    // 调用时长
    call_duration: string
    // 请求状态
    status: MonitoringStatus
    // 调用次数
    call_num: number
    // 调用平均时长
    call_average_duration: number
}

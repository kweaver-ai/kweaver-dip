import { string } from 'sql-formatter/lib/src/lexer/regexFactory'
import { SortDirection, SortType } from '../common'
import {
    IObjects,
    IGetObject,
    SearchAllIndicator,
    ISearchItem,
    ISearchDim,
    ISearchObj,
    ISubjectDomainItem,
} from '@/core'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'

/**
 * 资源分类目录树查询
 */
export interface IRescTreeQuery {
    keyword?: string
    node_id?: string
    recursive?: boolean
    tree_id?: string
}

/**
 * 资源目录列表查询参数
 * category_id 目录分类ID-组织架构查询相关目录必填项
 * data_kind number [ 1 .. 63 ]
 * direction 排序方向(Default: "desc"，Enum: "asc" "desc")
 * keyword  关键词
 * limit    每页大小
 * offset   页码
 * orgcode 所属部门ID-资源分类查询相关目录必填项
 * res_type 资源类型 number [ 1 .. 3 ]
 * shared_type  共享属性 1 无条件共享 2 有条件共享 3 不予共享
 * sort 	排序类型（默认："created_at" ，其他值："updated_at"）
 * state    number [ 1 .. 5 ]
 * comprehension_status    理解状态,逗号分隔，支持多个状态查询
 * need_org_paths    是否需要部门路劲列表
 * need_org_paths    任务id
 */
export interface IRescCatlgQuery {
    categoryID?: string
    data_kind?: number
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    orgcode?: string
    resource_type?: number
    shared_type?: number
    sort?: string
    publish_status?: string
    online_status?: any
    comprehension_status?: string
    need_org_paths?: boolean
    task_id?: string
    exclude_ids?: string[]
    audit_state?: number
    flow_type?: number
    publish_at_start?: number
    publish_at_end?: number
    updated_at_start?: number
    updated_at_end?: number
    explore_show?: boolean
    user_department?: boolean
    mount_type?: string
    subject_id?: string
}

/**
 * 数据资源目录列表-目录item
 */
export interface IRescCatlg {
    code: string
    // columns: Array<ICatglgColumn>
    created_at: number
    creator_name: string
    creator_uid: string
    current_version: number
    data_kind: number
    data_kind_flag: number
    data_range?: number
    delete_name?: string
    delete_uid?: string
    deleted_at?: string
    description?: string
    file_count: number
    flow_id: string
    flow_name?: string
    flow_node_id?: string
    flow_node_name?: string
    flow_type: number
    flow_version?: string
    forward_version_id?: number
    group_id: string
    group_name: string
    id: string
    catalog_id: string
    infos: Array<IInfo>
    label_flag: number
    mount_resources: Array<IMountResc>
    open_condition?: string
    open_type: number
    operations?: number
    orgcode: string
    orgname: string
    physical_deletion?: number
    publish_flag: number
    rel_catalog_flag: number
    rel_event_flag: number
    shared_condition?: string
    shared_mode: number
    shared_type: number
    source: number
    src_event_flag: number
    state: number
    sync_frequency?: string
    sync_mechanism?: number
    system_flag: number
    table_count: number
    table_type?: number
    theme_id?: string
    theme_name?: string
    title: string
    update_cycle?: number
    updated_at?: number
    updater_name?: string
    updater_uid?: string
    version: string
    org_paths: string[]
    explore_job_id: string
    // 数据理解需要的字段
    comprehension: {
        // 理解创建时间
        comprehension_created_time: number
        // 理解更新时间
        comprehension_update_time: number
        // 理解创建人
        creator: string
        // 异常信息
        exception_message: string
        // 是否有理解变更，红点逻辑
        has_change: boolean
        // 挂载的数据表名称
        mount_source_name: string
        // 理解更新人
        update_by: string
        // 理解状态： 1 未理解 2 已理解
        status: number
    }
    audit_state?: number
    flow_type?: number
    name?: string
}

// 服务超市-数据资源列表搜索
export interface IDataRescQuery {
    keyword?: string
    filter?: {
        // 主题域 ID，过滤属于这个主题域的数据资源
        subject_domain_id?: string

        // 数据资源的类型，传入 Uncategorized 时过滤不属于任何主题域的数据资源
        // interface_svc	接口
        // data_view	库表
        // 数据资源的类型为空字符串、未指定时，不过滤数据资源
        type?: string

        // 是否已上线
        is_online?: boolean
        // 是否已发布
        is_publish?: boolean

        // 过滤这个时间范围内发布的数据资源-时间戳
        published_at?: { start?: string; end?: string }

        // 部门的 ID，过滤属于这个部门的数据资源
        // 传入 Uncategorized 时过滤不属于部门的数据资源
        department_id?: string
        ids?: string[]
    }
    // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
    next_flag?: Array<string>
}

// 服务超市-数据资源列表项
export interface IServiceMaktDataRescItem {
    id: string
    fields?: any
    description?: string
}

// 请求返回结构
export interface IResult<K> {
    entries: Array<K>
    total_count: number
}

/**
 * 数据资源目录详情-列属性
 * @param id  目录ID
 * @param catalog_id  数据资源目录ID
 * @param column_name  字段名称
 * @param name_cn  信息项名称
 * @param data_format  字段类型
 * @param data_length  数据长度
 * @param datameta_id  关联数据元ID
 * @param datameta_name  关联数据元名称
 * @param ranges  字段值域
 * @param codeset_id  关联代码集ID
 * @param codeset_name  关联代码集名称
 * @param shared_type  共享属性 1 无条件共享 2 有条件共享
 * @param open_type  开放属性 1 向公众开放 2 不向公众开放
 * @param timestamp_flag  是时间戳(1是;0)
 * @param primary_flag  是主键(1是;0)
 * @param null_flag  是为空(1是;0)
 * @param classified_flag  是涉密属性(1是;0)
 * @param sensitive_flag  是敏感属性(1是;0)
 */
export interface ICatglgColumn {
    id: string
    catalog_id: string
    column_name: string
    name_cn: string
    data_format?: number
    data_length?: number
    datameta_id?: string
    datameta_name?: string
    ranges?: string
    codeset_id?: string
    codeset_name?: string
    shared_type: number
    open_type: number
    timestamp_flag: number
    primary_flag: number
    null_flag: number
    classified_flag: number
    sensitive_flag: number
}

/**
 *
 * @param id  目录ID，雪花ID
 * @param res_id  挂接资源ID
 * @param catalog_id  数据资源目录ID
 * @param res_type  挂接资源类型-1库表 2文件
 * @param res_name  挂接资源名称
 */
export interface ICatlgRescMount {
    id: string
    res_id?: string
    catalog_id: string
    res_type: number
    res_name?: string
}

/**
 * 数据资源目录详情-基本信息-挂接资源
 */
export interface IMountResc {
    entries: Array<{
        res_id?: string
        res_name?: string
    }>
    res_type: number
}

/**
 * 数据资源目录详情-基本信息-关联信息
 */
export interface IInfo {
    entries: Array<ILabelTag>
    info_type: number
}

/**
 * 目录详情
 */
export interface ICatlgContent {
    code: string
    columns: Array<ICatglgColumn>
    created_at: number
    creator_name: string
    creator_uid: string
    current_version: number
    data_kind: number
    data_kind_flag: number
    data_range?: number
    delete_name?: string
    delete_uid?: string
    deleted_at?: string
    description?: string
    file_count: number
    flow_id: string
    flow_name?: string
    flow_node_id?: string
    flow_node_name?: string
    flow_type: number
    audit_state: number
    flow_version?: string
    forward_version_id?: number
    group_id: string
    group_name: string
    id: string
    infos: Array<IInfo>
    label_flag: number
    mount_resources: Array<IMountResc>
    open_condition?: string
    open_type: number
    orgcode: string
    orgname: string
    physical_deletion?: number
    publish_flag: number
    rel_catalog_flag: number
    rel_event_flag: number
    shared_condition?: string
    shared_mode: number
    shared_type: number
    source: number
    src_event_flag: number
    state: number
    sync_frequency?: string
    sync_mechanism?: number
    system_flag: number
    table_count: number
    table_type?: number
    theme_id?: string
    theme_name?: string
    title: string
    name: string
    update_cycle?: number
    updated_at?: number
    updater_name?: string
    updater_uid?: string
    version: string
    audit_advice?: string
    owner_id?: string
    owner_name?: string
    mountInfo?: any
    resource_type?: number
    subject_info?: any
    department?: any
    info_system?: any
    publish_status?: any
    draft_id?: any
    online_status?: any
}

export interface ILabelTag {
    info_key?: string
    info_value: string
}

/**
 * 目录详情-资源列表项
 * @param id
 * @param code 目录编码
 * @param created_at 创建时间
 * @param data_kind 目录编码
 * @param file_count 目录编码
 * @param flow_id 目录编码
 * @param flow_name 目录编码
 * @param flow_node_id 目录编码
 * @param flow_node_name 目录编码
 * @param flow_type 目录编码
 * @param flow_version
 * @param labels 目录编码
 * @param operations 目录编码
 * @param orgcode 目录编码
 * @param orgname 目录编码
 * @param service_count 目录编码
 * @param state 目录编码
 * @param table_count 目录编码
 * @param title 目录编码
 * @param updated_at 更新时间
 * @param version 目录版本号
 */
export interface IRescItem {
    resource_type?: any
    id: string
    code: string
    draft_id?: string
    resource_id?: number
    created_at?: number
    data_kind?: number
    file_count?: number
    flow_id?: string
    flow_name?: string
    flow_node_id?: string
    flow_node_name?: string
    flow_type?: number
    flow_version?: string
    labels?: Array<ILabelTag>
    operations?: number
    orgcode?: string
    orgname?: string
    service_count?: number
    state?: number
    table_count?: number
    title?: string
    name?: string
    updated_at?: number
    version?: string
    publish_status?: string
    online_status?: string
    data_type?: number
    resource?: any[]
    next_id?: string
    source_id?: string
    is_import?: boolean
}

/**
 * 目录详情-信息项列表
 */
export interface IRescInfo {
    columns: Array<IRescItem>
    total_count: number
}

/**
 * 目录关联信息
 * @param id 目录id
 * @param catalog_id 数据资源目录id
 * @param info_type 关联信息类型(1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联目录、信息项)
 * @param info_key 关联信息key（仅当info_type为5时为关联目录ID，其它情况下为ID或枚举值）
 * @param info_value 关联信息名称（info_type为5时表示关联目录及其信息项的json字符串）
 */
export interface IRelatedInfo {
    id: string
    catalog_id: string
    info_type: string
    info_key?: string
    info_value: string
}

export interface IColumnInfo {}

/**
 * 目录详情页-列属性
 */
export interface ISearchColumn {
    catalogId: string
    direction?: SortDirection
    keyword?: string
    limit?: number
    offset?: number
    sort?: SortType
    shared_type?: any
}

/**
 *血缘表数据
 */
export interface LineageForm {
    // 数据库名称
    db_name: string

    // 是否允许展开
    expansion_flag: boolean

    // 信息系统名称
    info_system_name: string

    // 节点名称
    name: string

    // 目标表
    target_table: string

    // 节点实体id， 由ad生成
    vid: string

    fields: Array<LineageField>
}

/**
 * 血缘字段数据
 */
type LineageField = {
    // 字段id
    id: string

    // 字段名称
    name: string

    // 主键
    primary_key_flag: boolean

    // 目标字段
    target_field: {
        [key: string]: Array<string>
    }

    // 字段类型
    type: string
}

/**
 * @param mgm_dep_id  管理部门ID
 * @param mgm_dep_name  管理部门名称
 * @param name  目录分类名称
 * @param parent_id  父类别ID，为0或不传时，为在一级目录下新增
 * @param describe  描述
 */
interface IAddCatalog {
    mgm_dep_id: string
    mgm_dep_name: string
    name: string
    parent_id?: string
    describe?: string
}

interface IGetAuditProcess {
    // 审批流程类型 "af-data-catalog-online"
    audit_type?: string
}
interface ICreateAuditProcess extends IGetAuditProcess {
    // 审核流程key
    proc_def_key: string
}

interface IUpdateAuditProcess extends ICreateAuditProcess {
    // 流程绑定ID
    id: string
}

interface ICreateAuditFlow {
    // 目录ID
    catalogID: number

    // 审批流程类型 1 上线
    flowType: number
}
export interface IBusinessLogicEntityTop {
    // 的统计维度  "apply num" 申请 "preview num" 访问
    dimension: string
    // Top数量
    top_num: number
}
export interface IAvailableAssets extends SearchAllIndicator {
    // 关键词
    keyword?: string
    // 部门
    orgcode?: string
}
export interface IApplyAssets {
    // 关键词
    keyword: string
    // 部门
    end_time?: string
    start_time?: string
    state?: string
}
export interface IDataCatlgQueryPrams {
    keyword?: string
    node_id?: string
    recursive?: boolean
    tree_id?: string
}
export interface IBusinObjSearch<T> extends IObjects<T> {
    next_flag?: Array<string>
}
/**
 * @description 数据资源列表项-业务对象
 * @param id	string	业务对象ID
 * @param name	string	业务对象名称
 * @param description	string	业务对象描述
 * @param system_id	string	业务系统ID
 * @param system_name	string	业务系统名称
 * @param data_source_id	string	数据源ID
 * @param data_source_name	string	数据源名称
 * @param schema_id	string	schema ID
 * @param schema_name	string	schema名称
 * @param orgcode	string	数源单位ID
 * @param orgname	string	数源单位名称
 * @param updated_at	number	数据更新时间戳
 * @param download_access	number 结果 1 无下载权限 2 审核中 3 有下载权限
 */
export interface IBusinObject {
    business_objects: Array<string>
    id: string
    code: string
    data_kind?: Array<number>
    description?: string
    download_access?: number
    group_id?: string
    info_systems?: Array<any>
    orgcode?: string
    orgname?: string
    owner_name?: string
    published_at?: number
    raw_data_source_name?: string
    raw_description?: string
    raw_schema_name?: string
    raw_title?: string
    raw_owner_name?: string
    raw_name?: string
    raw_code?: string
    shared_type?: string
    title?: string
    updated_at?: number
    is_online?: boolean
    cate_info: any
    // 主题域
    subject_info?: Array<ISubjectDomainItem>
    // 目录更新时间
    update_time?: number | string
    // 数据更新时间
    data_update_time?: number | string
    // 申请量
    apply_num?: number
    // 挂接资源
    mount_data_resources?: Array<{
        // 数据资源类型
        data_resources_type?: DataRescType
        // 数据资源id
        data_resources_ids?: Array<string>
    }>
}
/**
 * @description 业务对象公共详情
 * @param apply_count	number 申请数
 * @param description	string  数据目录描述
 * @param download_access	number 结果 1 无下载权限 2 审核中 3 有下载权限
 * @param download_expire_time	number 数据下载有效期，时间戳毫秒
 * @param id	string  数据目录id
 * @param name	string  数据目录名称
 * @param preview_count	number 预览量
 * @param row_count	number 数据量
 */
export interface IBusinObjCommonDetail {
    apply_count: number
    description: string
    download_access: number
    download_expire_time: number
    id: string
    name: string
    preview_count: number
    row_count: number
}
/**
 * @description 业务对象摘要信息
 * @param name	string	业务对象名称
 * @param name_en	string	业务对象英文名称
 * @param description	string	业务对象描述
 * @param certificated	boolean	是否已认证
 * @param completion_ratio	double	完成度，区间为[0,100]
 * @param code	string	业务对象编码
 * @param data_kind	Array of integers	基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他
 * @param infos	Array of objects (InfoItem)	关联信息-仅返回关联系统和标签
 * @param update_cycle	number	更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
 * @param data_source_id	string	数据源ID
 * @param data_source_name	string	数据源名称
 * @param schema_id	string	schema ID
 * @param schema_name	string	schema名称
 * @param orgcode	string	数源单位ID
 * @param orgname	string	数源单位名称
 * @param created_at	number	数据起始时间戳/表元数据创建时间
 * @param updated_at	number	数据更新时间戳/表元数据更新时间
 * @param comprehension_status	number	理解状态
 */
export interface IDataCatlgBasicInfo {
    name: string
    name_en?: string
    description?: string
    certificated?: boolean
    completion_ratio?: null
    code?: string
    data_kind?: Array<number>
    infos?: Array<{
        entries: Array<{
            info_key: string
            info_value: string
        }>
        info_type: number
    }>
    update_cycle?: number
    data_source_id?: string
    data_source_name?: string
    schema_id?: string
    schema_name?: string
    orgcode?: string
    orgname?: string
    created_at?: number
    updated_at?: number
    published_at?: number
    comprehension_status?: number
    shared_condition?: string
    shared_mode?: number
    shared_type?: number
    business_object_path: any[]
    owner_id: string
    owner_name: string
    form_view_id: string
    catalog_api?: any[]
    catalog_view?: any[]
}
// 业务详情-字段信息查询
export interface IBusinFiledQuery {
    id: string
    limit?: number
    offset?: number
    keyword?: string
}
/**
 * 样例查询参数
 * @param fields	 Array of strings unique 要获取的字段值，为空则获取全部字段
 * @param limit	 number [ 1 .. 100 ] Default: 10 每页大小，默认1
 * @param offset	 number >= 1 Default: 1 页码，默认
 * @param type required number Enum: 1 2 1：默认样例数据，2：AI生成样例数据
 */
export interface IBusinSampleQuery {
    catalogID: string
    fields?: Array<string>
    limit?: number
    offset?: number
    type?: number
}
/**
 * @description 业务对象样例数据
 * @param columns   字段信息数组
 * @param id	string	字段ID
 * @param name_cn	string	字段中文名称
 * @param name_en	string	字段英文名称
 * @param alias	string	字段别名(用于接口返回字段名称)
 * @param data_format	string	数据类型 0:数字型 1:字符型 2:日期型 3:日期时间型 4:时间戳型 5:布尔型 6:二进制
 *
 * @param samples 	样例数据数组
 * @param id	string	字段ID
 * @param value	string	字段值
 * @param is_ai boolean 生成类型，为true则是AI生成
 * @param update_time number 最后更新时间
 */
export interface IBusinObjSample {
    columns?: Array<{
        id?: string
        cn_col_name?: string
        en_col_name?: string
        alias?: string
        data_format?: string
    }>
    samples?: Array<
        Array<{
            id: string
            value: string
        }>
    >
    is_ai?: boolean
    update_time?: number
}
export interface IdimensionConfigModel {
    choices: {
        [key: string]: {
            id: number
            name: string
        }[]
    }
    dimension_config: IdimensionConfig[]
}

export interface IdimensionConfig {
    // 子维度,叶子节点没有Children配置
    children?: IdimensionConfig[]
    // 具体的配置, 非叶子节点没有该配置
    detail?: {
        // 理解的内容
        content?: any
        // ai理解的内容
        ai_content?: any
        // 理解内容的类型
        content_type: number
        // 是否有多个值
        is_multi: boolean
        // 单个理解的最大长度
        item_length: number
        // 最高支持几个值
        max_multi: number
        // 悬浮提示
        note: string
        // 是否必填
        required: boolean
        // 错误信息
        content_errors?: any
        // 维度错误信息
        error?: string
    }
    // 所属分类 business-业务信息 value-价值信自
    category: string
    id: string
    name: string
}

export interface IdimensionModel {
    // 目录ID
    catalog_id: string
    // 编目code
    catalog_code: string
    // 顶层提示信息
    note: string
    // 理解状态
    status: number
    // 数据编目相关信息
    catalog_info: {
        // 名称
        name: string
        // 英文名称
        name_en: string
        // 开展工作
        base_works: string[]
        // 业务职责
        business_duties: string[]
        // 基础信息分类
        data_kind: number
        // 部门处室
        department_path: { id: string; name: string; type: string }[]
        // 表含义
        table_desc: string
        // 数据量
        total_data: number
        // 更新周期
        update_cycle: number
        // 修改人
        updater_name: string
        // 更新时间
        updated_at: number
    }
    // 数据理解详情
    comprehension_dimensions: IdimensionConfig[]
    choices: {
        [key: string]: {
            id: number
            name: string
        }[]
    }
    // 字段理解内容
    column_comments?: {
        ai_comment: string
        column_name: string
        // comment: string
        data_format: number
        id: string
        name_cn: string
        sync: boolean
    }[]
    icons: {
        [key: string]: string
    }
}
/**
 * 获取资源详情
 * @param catalogID:id
 * @returns
 */
export interface IGetResourcesDetails {
    catalogID: string
}

export interface IDataServiceDetailModel {
    base_info: {
        system_id: string
        system_name: string
        app_id: string
        app_name: string
        interface_type: string
        protocol: string
        req_method: string
        resp_type: string
        req_uri: string
        serve_time: string
        doc_id: string
        doc_name: string
    }
    req_params: {
        name: string
        data_type: string
        required: boolean
        comment: string
        description: string
    }[]
    resp_params: {
        name: string
        data_type: string
        masking: string
        standard_id: string
        standard_name: string
        description: string
    }[]
    resp_example: string
    status_codes: {
        code: number
        description: string
    }[]
}

/**
 * @description 认知搜索-子图谱节点
 * @param children ISubGraphItem[] 子节点
 * @param entity_type string 实体类型
 * @param name string  实体名称
 * @param raw_name string  实体名称原数据
 * @param relation string 节点关系
 * @param vid string 实体ID
 */
export type ISubGraphItem = {
    children: ISubGraphItem[]
    entity_type: string
    name: string
    raw_name: string
    relation: string
    vid: string
}

/**
 * @description 认知搜索-子图谱结果
 * @param graph  ISubGraphItem 节点集合
 */
export interface ISubGraphResult {
    graph: ISubGraphItem
}

export interface IGetFormViewCheck {
    attached_infos: { code: string; id: string }[]
    mounted_res_ids: string[]
}

/**
 * 类目信息
 */
export interface ICategoryItem {
    id: string
    name: string
    describe: string
    using: boolean // 启用-true 停用-false
    required: boolean // 必选-true 非必选-false
    type: string // 自定义-'customize' 系统-'system'
    created_at: number
    creator_uid: string
    creator_name: string
    updated_at: number
    updater_uid: string
    updater_name: string
    tree_node?: ICategoryTreeNode[] // 类目树结构
    apply_scope_info?: { id: string; name: string }[] // 应用范围
}

/**
 * 类目树结构
 */
export interface ICategoryTreeNode {
    id: string
    parent_id: string
    name: string
    owner: string
    ownner_uid: string
    children: ICategoryTreeNode[]
}

// 信息资源目录——————————————————————————————————start

/**
 * 资源目录列表查询参数
 */
export interface IInfoRescCatlgQuery {
    // 类目节点ID
    category_node_id?: string
    // 自动关联来源业务表ID
    auto_related_source_id?: string
    keyword?: string
    limit?: number
    offset?: number
    filter?: Object<{
        // published | pub-auditing | unpublished | pub-reject
        publish_status?: Array<string>
        // notline | up-auditing | online | up-reject | down-auditing | offline | down-reject
        online_status?: Array<string>
        update_at?: {
            start: number
            end: number
        }
    }>
    sort_by?: Object<{
        fields?: Array<string>
        direction?: SortDirection // desc asc,默认desc
    }>
    cate_info?: Object<{
        // 类目类型ID
        cate_id?: string
        // 类目节点ID
        node_id?: string
    }>
}

// 信息目录编目-业务表查询
export interface IBusinFormSerachCondition {
    // 所属部门ID
    department_id?: string
    // 后端默认值 1
    offset: number
    // 后端默认值 10
    limit: number
    keyword?: string
    sort_by: {
        fields?: Array<string>
        direction?: string
    }
    info_system_id?: string
    node_id?: string
}

// 业务表对象
export interface IInfoCatlgRelateBusinForm {
    id: string
    name: string
    description?: string
    department_id?: string
    department_name?: string
    department_path?: string
    related_info_systems?: Array<{
        id: string
        name: string
    }>
    update_at?: number
    update_by?: string
    label_list_resp?: any
}

export interface IAuditInfoCatlgItem {
    /**
     * 申请人名称
     */
    apply_user_name: string
    /**
     * 申请审核时间
     */
    audit_at: number
    /**
     * 审核意见
     */
    audit_remark?: string
    /**
     * 审核状态
     */
    audit_status: AuditStatus
    audit_type: AuditType
    /**
     * 信息资源目录编码
     */
    code: string
    /**
     * 所属部门
     */
    department: string
    /**
     * 所属部门路径
     */
    department_path: string
    /**
     * 信息资源目录ID
     */
    id: string
    /**
     * 信息资源目录名称，仅支持中英文、数字、下划线及中划线
     */
    name: string
    /**
     * 审核流程ID
     */
    process_id: string
    /**
     * 关联数据资源目录
     */
    related_data_resource_catalogs: Array<{
        id: string
        name: string
    }>
}

export enum AuditStatus {
    TODO = 'todo',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected',
    PENDING = 'pending',
}

export enum AuditType {
    // 上线审核
    OnlineAudit = 'online',

    // 下线审核
    OfflineAudit = 'offline',

    // 发布审核
    PublishAudit = 'publish',

    // 变更审核
    ChangeAudit = 'alter',
}

/**
 * 审核目录审核列表查询参数
 */
export interface IInfoCatlgAuditQuery {
    // 类目节点ID
    // category_node_id?: string

    // 筛选条件
    filter?: Filter
    // 查询文本，会模糊搜索信息资源目录名称和编码进行匹配
    keyword?: string
    limit: number
    offset: number
    // 排序依据
    sort_by?: SortBy
}

/**
 * 筛选条件
 */
export interface Filter {
    /**
     * 审核状态筛选项列表
     */
    audit_status?: AuditStatus[]
    /**
     * 审核类型筛选项列表
     */
    audit_type?: AuditType[]
}

/**
 * 排序依据
 */
export interface SortBy {
    /**
     * 排序方向
     */
    direction?: string
    /**
     * 排序字段列表
     */
    fields?: Field[]
    [property: string]: any
}

export enum Field {
    Code = 'code',
    Name = 'name',
    UpdateAt = 'update_at',
}

// 关联信息类
export interface IInfoRescCatlgAutoRelated {
    id: string
    name: string
    code: string
    columns: Array<{
        id: string
        name: string
        type: string
    }>
}

/**
 * 关联代码集
 */
export interface SimpleDataItem {
    /**
     * ID 编号
     */
    id: string
    /**
     * 名称
     */
    name: string
}

export interface ITV {
    /**
     * ID 编号
     */
    type: 'other' | 'government_service' | 'public_service' | 'supervision'
    /**
     * 名称
     */
    value: string
}

/**
 * 关联数据元
 */
export interface DataRefer {
    /**
     * ID 编号
     */
    id: string
    /**
     * 名称
     */
    name: string
}

/**
 * 元数据
 *
 * 字段元数据
 */
export interface Metadata {
    /**
     * 数据长度
     */
    data_length?: number
    /**
     * 数据值域，仅支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头
     */
    data_range?: string
    /**
     * 数据类型-digit,char,date,datetime,bool,other
     */
    data_type: string
}

/**
 * 信息项
 */
export interface InfoCatlgFieldItem {
    /**
     * 关联代码集
     */
    code_set: SimpleDataItem
    /**
     * 关联数据元
     */
    data_refer: DataRefer
    /**
     * 信息项ID
     */
    id: string
    /**
     * 是否增量字段
     */
    is_incremental: boolean
    /**
     * 是否本部门产生
     */
    is_local_generated: boolean
    /**
     * 是否主键
     */
    is_primary_key: boolean
    /**
     * 是否涉密
     */
    is_secret: boolean
    /**
     * 是否敏感属性
     */
    is_sensitive: boolean
    /**
     * 是否标准化
     */
    is_standardized: boolean
    /**
     * 元数据
     */
    metadata: Metadata
    /**
     * 信息项名称，仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头
     */
    name: string
    [property: string]: any
}

// 新建、编辑信息资源目录
export interface InfoCatlgItem {
    id?: string
    /**
     * 创建动作
     */
    action: InfoCatlgEditAction
    /**
     * 所属信息
     */
    belong_info: BelongInfo
    /**
     * 资源属性分类
     */
    category_node_ids?: string[]
    /**
     * 信息资源目录编码
     */
    code?: string
    /**
     * 信息项列表
     */
    columns: InfoItemAttrs[]
    /**
     * 数据范围
     */
    data_range: string
    /**
     * 信息资源目录描述
     */
    description: string
    /**
     * 信息资源目录名称，仅支持中英文、数字、下划线及中划线
     */
    name: string
    /**
     * 关联信息
     */
    relation_info: RelationInfo
    /**
     * 共享开放信息
     */
    shared_open_info: SharedOpenInfo
    /**
     * 来源信息
     */
    source_info: SourceInfo
    /**
     * 更新周期
     */
    update_cycle: string
}

/**
 * 创建动作
 */
export enum InfoCatlgEditAction {
    Save = 'save',
    Submit = 'submit',
}

/**
 * 所属信息
 */
export interface BelongInfo {
    /**
     * 所属业务流程列表
     */
    business_process: BusinessProcess[]
    /**
     * 所属部门
     */
    department: BelongInfoDepartment
    /**
     * 所属处室
     */
    office: Office
    [property: string]: any
}

export interface BusinessProcess {
    /**
     * ID 编号
     */
    id: string
    /**
     * 名称
     */
    name: string
    [property: string]: any
}

/**
 * 业务实体
 *
 * 所属部门
 *
 * 来源业务表
 *
 * 来源部门
 */
export interface BelongInfoDepartment {
    /**
     * ID 编号
     */
    id: string
    /**
     * 名称
     */
    name: string
    [property: string]: any
}

/**
 * 所属处室
 */
export interface Office {
    /**
     * 处室业务职责
     */
    business_responsibility: string
    /**
     * 处室ID
     */
    id: string
    /**
     * 处室名称
     */
    name: string
    [property: string]: any
}

/**
 * 信息项属性
 */
export interface InfoItemAttrs {
    /**
     * 关联代码集
     */
    code_set: SimpleDataItem
    /**
     * 关联数据元
     */
    data_refer: DataRefer
    /**
     * 是否增量字段
     */
    is_incremental: boolean
    /**
     * 是否本部门产生
     */
    is_local_generated: boolean
    /**
     * 是否主键
     */
    is_primary_key: boolean
    /**
     * 是否涉密
     */
    is_secret: boolean
    /**
     * 是否敏感属性
     */
    is_sensitive: boolean
    /**
     * 是否标准化
     */
    is_standardized: boolean
    /**
     * 元数据
     */
    metadata: Metadata
    /**
     * 信息项名称
     */
    name: string
    [property: string]: any
}

/**
 * 关联信息
 */
export interface RelationInfo {
    /**
     * 关联数据资源目录列表
     */
    data_resource_catalogs: SimpleDataItem[]
    /**
     * 关联信息项列表
     */
    info_items: InfoCatlgFieldItem[]
    /**
     * 关联信息类列表
     */
    info_resource_catalogs: SimpleDataItem[]
    /**
     * 关联信息系统列表
     */
    info_systems: SimpleDataItem[]
    /**
     * 关联业务场景列表
     */
    related_business_scenes: ITV[]
    /**
     * 来源业务场景列表
     */
    source_business_scenes: ITV[]
    [property: string]: any
}

export interface RelatedBusinessScene {
    /**
     * 场景类型
     */
    type: string
    /**
     * 业务场景
     */
    value: string
    [property: string]: any
}

export interface SourceBusinessScene {
    /**
     * 场景类型
     * GovernmentService = "government_service",
     * Other = "other",
     * PublicService = "public_service",
     * Supervision = "supervision",
     */
    type: string
    /**
     * 业务场景
     */
    value: string
    [property: string]: any
}

/**
 * 共享开放信息
 */
export interface SharedOpenInfo {
    /**
     * 开放条件
     */
    open_condition?: string
    /**
     * 开放属性
     */
    open_type: OpenTypeEnum
    /**
     * 共享信息
     */
    shared_message?: string
    /**
     * 共享方式
     */
    shared_mode: SharedMode
    /**
     * 共享属性
     */
    shared_type: OpenTypeEnum
    [property: string]: any
}

/**
 * 开放属性
 *
 * 共享属性
 */
export enum OpenTypeEnum {
    All = 'all',
    None = 'none',
    Partial = 'partial',
}

/**
 * 共享方式
 */
export enum SharedMode {
    Mail = 'mail',
    Media = 'media',
    Platform = 'platform',
}

/**
 * 来源信息
 */
export interface SourceInfo {
    /**
     * 来源业务表
     */
    business_form: Business
    /**
     * 来源部门
     */
    department: SourceInfoDepartment
    [property: string]: any
}

/**
 * 业务实体
 *
 * 所属部门
 *
 * 来源业务表
 *
 * 来源部门
 */
export interface Business {
    /**
     * ID 编号
     */
    id: string
    /**
     * 名称
     */
    name: string
    [property: string]: any
}

/**
 * 业务实体
 *
 * 所属部门
 *
 * 来源业务表
 *
 * 来源部门
 */
export interface SourceInfoDepartment {
    /**
     * ID 编号
     */
    id: string
    /**
     * 名称
     */
    name: string
    [property: string]: any
}

// 概览-信息目录统计返回数据
export interface IInfoCatlgStatistics {
    // 目录总数
    total_num?: number

    // 未发布目录数
    unpublish_num?: number

    // 已发布目录数
    published_num?: number

    // （已发布）未上线目录数（包含已下线目录数）
    notonline_num?: number

    // 已上线目录数
    online_num?: number

    // 已下线目录数
    offline_num?: number

    // 审核统计数组
    audit_statistic?: Array<{
        // 审核类型:publish 发布审核 online 上线审核 offline 下线审核

        audit_type?: string
        // 待审核目录数
        auditing_num?: number

        // 审核通过目录数
        pass_num?: number

        // 审核驳回目录数
        reject_num?: number
    }>
}

// 概览-业务标准表编目统计返回数据
export interface IInfoCatlgBusinFormStatics {
    // （已发布）业务标准表总数
    total_num?: number

    // 未编目（已发布）业务标准表数
    uncataloged_num?: number

    // 已发布信息资源目录数
    publish_num?: number

    // 编目完成率
    rate?: string

    // 部门业务标准表编目统计数组
    dept_statistic: Array<{
        // 部门ID
        department_id?: string
        // 部门名称
        department_name?: string
        // 部门路径
        department_path?: string
        // 部门（已发布）业务标准表总数
        total_num?: number
        // 部门已发布信息资源目录数
        publish_num?: number
        // 部门编目完成率，实际占比*100保留一位小数
        rate?: string
    }>
}

// 概览-部门提供目录统计返回数据
export interface IInfoCatlgDepartStatics {
    // 部门提供目录统计数组
    dept_statistic?: Array<{
        // 部门ID
        department_id?: string
        // 部门名称
        department_name?: string
        // 部门路径
        department_path?: string
        // 部门信息资源目录总数
        total_num?: number
        // 部门已发布信息资源目录数
        publish_num?: number
        // 部门提供目录占比，实际占比*100保留一位小数
        rate?: string
    }>
}

// 概览-目录共享统计返回数据
export interface IInfoCatlgShareStatics {
    // 已发布目录总数
    total_num?: number
    // 目录共享统计

    share_statistic?: {
        // 不予共享目录数量
        none_num?: number

        // 无条件共享目录数量
        all_num?: number

        // 有条件共享目录数量
        partial_num?: number
    }
}

// 信息资源目录——————————————————————————————————end

// 信息资源目录 -- 超市 -- start

// 使用信息资源目录查询数据资源目录的业务视角相关数据
export enum RelatedFieldType {
    BusinDomainName = 'business_domain.name',
    BusinaFormName = 'business form.name',
    BusinModelName = 'business_model.name',
    InfoCatlgName = 'name',
    Code = 'code',
    Column = 'column',
    DataCatlgName = 'data_resource_catalogs.name',
    DepartmentName = 'main_business_departments.name',
    Description = 'description',
    MainBusinName = 'main_business.name',
    LabelListRespName = 'label_list_resp.name',
}

export interface IqueryInfoResCatlgListParams {
    keyword?: string
    // 参数 fields 用来指定 keyword 会匹配哪些字段，没有 fields 字段和原来一样匹配名称、编码、描述、信息项名称
    fields?: RelatedFieldType[]
    filter?: {
        business_process?: string[]
        update_cycle?: string[]
        shared_type?: string[]
        online_at?: {
            start?: number
            end?: number
        }
        cate_info?: {
            cate_id?: string
            node_id?: string
        }
    }
    next_flag?: string[]
}
// 信息资源目录 -- 超市

export interface IResetInfoResCatlgParams {
    /** 信息目录ID */
    id: string
    /** 变更版本临时ID */
    alterId: string
}

export interface IqueryInfoResCatlgItem {
    id: string
    name: string
    raw_name: string
    code: string
    description: string
    online_at: number
    columns: {
        id?: string
        name?: string
    }[]
    cate_info: {
        cate_id?: string
        node_id?: string
        node_name?: string
        node_path?: string
    }[]
    status?: {
        online?: string
        publish?: string
    }

    // 数据资源目录-业务视角需求添加字段
    business_form?: {
        id?: string
        name?: string
    }
    business_model?: {
        id?: string
        name?: string
    }
    main_business?: {
        id?: string
        name?: string
    }
    main_business_departments?: {
        id?: string
        name?: string
    }[]
    business_domain?: {
        id?: string
        name?: string
    }
    data_resource_catalogs?: {
        id?: string
        name?: string
    }[]
}
export interface IqueryInfoResCatlgList {
    total_count: number
    entries: IqueryInfoResCatlgItem[]
    next_flag?: string[]
}
export interface IInfoResCatlgColumnsItem {
    id?: string
    name?: string
    data_refer?: {
        id?: string
        name?: string
    }
    code_set?: {
        id?: string
        name?: string
    }
    metadata?: {
        data_type?: string
        data_length?: number
        data_range?: string
    }
    is_sensitive?: boolean
    is_secret?: boolean
    is_primary_key?: boolean
    is_incremental?: boolean
    is_local_generated?: boolean
    is_standardized?: boolean
}
// 信息资源目录 -- 超市 -- end

// 反馈状态 目录模式
export enum FeedbackStatus {
    // 待处理
    Pending = 'pending',
    // 已回复
    Replied = 'replied',
}

// 反馈处理类型
export enum FeedbackOpType {
    // 反馈创建/提交
    Submit = 'submit',
    // 反馈回复
    Reply = 'reply',
}

// 列表视角
export enum FeedbackView {
    // 反馈创建者视角
    Applier = 'applier',
    //  运营视角
    Operator = 'operator',
}

// 创建目录反馈
export interface CreateDCFeedbackReq {
    // 目录ID
    catalog_id: string
    // 反馈类型
    feedback_type: string
    // 反馈描述
    feedback_desc: string
}

// 目录反馈列表
export interface DCFeedbackReq {
    // 列表视角
    view: FeedbackView
    // 反馈状态
    status?: FeedbackStatus
    // 反馈类型
    feedback_type?: string
    // 创建开始时间
    create_begin_time?: number
    // 创建结束时间
    create_end_time?: number
    // 偏移量
    offset?: number
    // 限制
    limit?: number
    // 关键字
    keyword?: string
    // 排序方向
    direction?: SortDirection
    // 排序类型
    sort?: SortType
}

// 目录反馈
export interface DCFeedbackItem {
    // 反馈ID
    id: string
    // 目录ID
    catalog_id: string
    // 目录名称
    catalog_title: string
    // 目录编码
    catalog_code: string
    // 反馈状态
    status: FeedbackStatus
    // 组织编码
    org_code: number
    // 组织名称
    org_name: string
    // 组织路径
    org_path: string
    // 反馈类型
    feedback_type: string
    // 反馈描述
    feedback_desc: string
    // 创建/反馈时间
    created_at: number
    // 回复时间
    replied_at: number
}

// 目录反馈列表
export interface DCFeedbackRes {
    total_count: number
    entries: DCFeedbackItem[]
}

// 反馈处理日志
export interface DCFeedbackProcessLog {
    // 反馈处理类型
    op_type: FeedbackOpType
    // 反馈处理人ID
    op_user_id: string
    // 反馈处理人名称
    op_user_name: string
    // 扩展信息
    extend_info: string
    // 操作时间
    created_at: number
}

// 目录反馈详情
export interface DCFeedbackDetail {
    basic_info: DCFeedbackItem
    process_log: DCFeedbackProcessLog[]
}

// 目录反馈目录模式 -- end

// 目录反馈资源模式 -- start
// 反馈类型
export enum FeedbackTypeResMode {
    // 信息有误
    InfoError = '1',
    // 数据质量问题
    DataQuality = '2',
    // 其他
    Other = '3',
}

export enum ResType {
    // 信息资源目录
    InfoCatalog = 'info-catalog',
    // 数据资源目录
    DataCatalog = 'data-catalog',
    // 电子证照目录
    ElecLicenceCatalog = 'elec-licence-catalog',
    // 逻辑视图
    DataView = 'data-view',
    // 接口
    InterfaceSvc = 'interface-svc',
    // 指标
    Indicator = 'indicator',
}

/**
 * 指标类型
 */
export enum IndicatorType {
    // 原子指标
    Atomic = 'atomic',
    // 衍生指标
    Derived = 'derived',
    // 复合指标
    Composite = 'composite',
}

// 创建目录反馈
export interface CreateFeedbackReqResMode {
    // 资源ID
    res_id: string
    // 资源类型
    res_type: ResType
    // 反馈类型
    feedback_type: FeedbackTypeResMode
    // 反馈描述
    feedback_desc: string
}

// 目录反馈列表
export interface FeedbackReqResMode {
    // 列表视角
    // view: FeedbackView
    // 反馈状态
    status?: FeedbackStatus
    // 反馈类型
    feedback_type?: FeedbackTypeResMode
    // 创建开始时间
    create_begin_time?: number
    // 创建结束时间
    create_end_time?: number
    // 偏移量
    offset?: number
    // 限制
    limit?: number
    // 关键字
    keyword?: string
    // 排序方向
    direction?: SortDirection
    // 排序类型
    sort?: SortType
    // 资源类型
    res_type?: ResType
    // 指标类型
    indicator_type?: IndicatorType
}

// 目录反馈
export interface FeedbackItemResMode {
    // 反馈ID
    id: string
    // 目录ID
    catalog_id: string
    // 目录名称
    catalog_title: string
    // 目录编码
    catalog_code: string
    // 反馈状态
    status: FeedbackStatus
    // 组织编码
    org_code: number
    // 组织名称
    org_name: string
    // 组织路径
    org_path: string
    // 反馈类型
    feedback_type: FeedbackTypeResMode
    // 反馈描述
    feedback_desc: string
    // 创建/反馈时间
    created_at: number
    // 回复时间
    replied_at: number
}

// 目录反馈列表
export interface FeedbackResResMode {
    total_count: number
    entries: FeedbackItemResMode[]
}

// 反馈处理日志
export interface FeedbackProcessLogResMode {
    // 反馈处理类型
    op_type: FeedbackOpType
    // 反馈处理人ID
    op_user_id: string
    // 反馈处理人名称
    op_user_name: string
    // 扩展信息
    extend_info: string
    // 操作时间
    created_at: number
}

// 目录反馈详情
export interface FeedbackDetailResMode {
    basic_info: FeedbackItemResMode
    process_log: FeedbackProcessLogResMode[]
}

// 目录反馈资源模式 -- end

// 开放数据目录 -- start

export interface IOpenCatlgListQuery {
    offset: number
    limit: number
    keyword?: string
    sort?: SortType
    direction?: string

    // 开放级别 OpenLevelEnum 1 实名认证开放 2 审核开放
    open_level?: number
    // 1-无条件 2-有条件开放
    open_type?: number
    // 数据来源部门id
    source_department_id?: string
    // 开始时间
    updated_at_start?: number
    // 结束时间
    updated_at_end?: number
}

export interface IOpenCatlgListItem {
    id: string
    name: string
    code: string
    catalog_id: string
    // 开放状态
    open_status?: string
    // 	资源类型 1库表 2 接口
    resource_type?: number
    online_status?: string
    //  部门id
    source_department_id?: string
    //  部门名称
    source_department?: string
    source_department_path?: string
    updated_at?: number
    // 审核状态，1 审核中 2 通过 3 驳回 4 未完成
    audit_state?: number
    audit_advice?: string
}

// 开放目录详情
export interface IOpenCatlgDetail {
    // 行政区划代码
    administrative_code: number
    // 目录编码
    code: string
    // 目录描述
    description: string
    // 目录名称
    name: string
    // 开放级别
    open_level: number
    // 开放方式
    open_type: number
    // 发布时间
    publish_at: number
    // 数据资源来源部门
    source_department: string
    // 更新时间
    updated_at: number
}

// 新增开放目录
export interface IAddOpenCatlgParams {
    // 选中数据资源目录id
    catalog_ids: Array<string>
    // 开放方式 1-无条件 2-有条件开放
    open_type: number
    // 开放级别 1-实名认证开放 2-审核开放
    open_level?: number
}

// 编辑开放目录
export interface IEditOpenCatlgParams {
    // 开放目录id
    id: string
    // 开放方式 1-无条件 2-有条件开放
    open_type: number
    // 开放级别 1-实名认证开放 2-审核开放
    open_level?: number
}

export interface IOpenCatlgAuditListQuery {
    offset?: number
    limit?: number
    keyword?: string
    sort?: SortType
    direction?: string
}

// 获取开放目录概览
export interface IOpenCatlgOverview {
    // 	审核中的数量
    auditing_catalog_count: number
    // 开放目录主题数量
    catalog_theme_count: [
        {
            count: number
            proportion: number
            theme_id: string
            theme_name: string
        },
    ]
    // 开放目录总数量
    catalog_total_count: number
    // 部门提供目录数量TOP10
    department_catalog_count: [
        {
            count: number
            department_id: string
            department_name: string
        },
    ]
    // 近一年开放目录新增数量(按月统计)
    new_catalog_count: {
        property1: number
        property2: number
    }
    // 资源类型开放目录数量
    type_catalog_count: [
        {
            count: number
            proportion: number
            type: number
        },
    ]
}

// 获取可开放的数据资源目录列表参数
export interface IOpenableDataCatalogQuery {
    offset?: number
    limit?: number
    keyword?: string
    sort?: SortType
    direction?: string

    // 开放级别 OpenLevelEnum 1 实名认证开放 2 审核开放
    open_level?: number
    // 1-无条件 2-有条件开放
    open_level?: number
    // 数据来源部门id
    source_department_id?: string
    // 开始时间
    updated_at_start?: number
    // 结束时间
    updated_at_end?: number
}

export interface IOpenableDataCatalog {
    code: string
    id: string
    name: string
}

// 开放数据目录 -- end

export interface IGetCatlgScoreListParams {
    offset?: number
    limit?: number
    keyword?: string
    sort?: string
    direction?: string
}

/**
 * 目录评分
 * @param catalog_id 目录id
 * @param code 目录编码
 * @param department 部门名称
 * @param department_path 部门路径
 * @param id 评分记录id
 * @param name 目录名称
 * @param score 评分
 * @param scored_at 评分时间
 */
export interface ICatlgScoreItem {
    catalog_id: string
    code: string
    department: string
    department_path: string
    id: string
    name: string
    score: number
    scored_at: number
}

export interface ICatlgScoreListRes {
    total_count: number
    entries: ICatlgScoreItem[]
}

/**
 * 目录评分统计
 * @param average_score 平均评分
 * @param catalog_id 目录id
 * @param count 评分次数
 */
export interface ICatlgScoreSummaryItem {
    average_score: string
    catalog_id: string
    count: number
}

export interface IGetCatlgScoreDetailsParams {
    offset?: number
    limit?: number
    sort?: string
    direction?: string
}

export interface ICatlgScoreDetailsItem {
    catalog_id: string
    department: string
    department_path: string
    score: number
    scored_at: number
    user_name: string
}

export interface ICatlgScoreStatItem {
    count: number
    score: number
}

/**
 * 目录评分详情
 * @param average_score 平均评分
 * @param score_detail 用户评分列表
 * @param score_stat 评分统计
 */
export interface ICatlgScoreDetailsRes {
    average_score: number
    score_detail: {
        entries: ICatlgScoreDetailsItem[]
        total_count: number
    }
    score_stat: ICatlgScoreStatItem[]
}

// 电子证照目录 -- start
export interface IQueryListCommonParams {
    direction?: string
    keyword?: string
    limit?: number
    offset?: number
    sort?: string
}
export interface IQueryLicenseListParams extends IQueryListCommonParams {
    online_status?: Array<string>
    updated_at_end: number
    updated_at_start: number
}

export interface LicenseTreeDataNode {
    id: string
    name: string
    path?: string
    path_id?: string
    children?: LicenseTreeDataNode[]
}

export interface IQueryFrontendLicenseListParams {
    keyword?: string
    industry_departments?: string[]
}
// 电子证照目录 -- end

// 我的收藏
export interface IGetFavoriteListParams {
    // 页码
    offset?: number
    // 每页size
    limit?: number
    // 关键字
    keyword?: string
    // 收藏资源类型
    res_type?: ResType
    // 排序
    sort?: SortType
    // 排序方向
    direction?: SortDirection
    // 部门ID
    department_id?: string
    // 指标类型
    indicator_type?: IndicatorType
}

// 资源类型
export enum CatalogResType {
    // 库表
    DataView = 'data_view',
    // 接口服务
    InterfaceSvc = 'interface_svc',
}

// 证照类型
export enum LicenseResType {
    // 证明文件
    ProofFile = '1',
    // 批文批复
    Approval = '2',
    // 鉴定报告
    Report = '3',
    // 其他文件
    Other = '4',
}

export interface IFavoriteItem {
    // 收藏项ID
    id: string
    // 收藏资源ID
    res_id: string
    // 收藏资源code
    res_code: string
    // 收藏资源名称
    res_name: string
    // 资源类型
    res_type: CatalogResType | LicenseResType | undefined | ResType
    // 所属主题数组
    subjects: {
        // 主题ID
        id: string
        // 主题名称
        name: string
        // 主题路径
        path: string
    }[]
    // 组织编码
    org_code: string
    // 组织名称
    org_name: string
    // 组织路径
    org_path: string
    // 评分
    score: string
    // 创建时间
    created_at: number
    // 上线时间
    online_at: number
    // 上线状态
    online_status: string
    // 发布时间
    publish_at: string
    // 指标类型
    indicator_type: IndicatorType
    // 是否在线
    is_online: boolean
}

export interface IFavoriteListRes {
    // 总数
    total_count: number
    // 收藏列表
    entries: IFavoriteItem[]
}
// 收藏 end

// 数据推送列表参数
export interface IGetPushListParams {
    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
    direction?: string
    // 关键字查询
    keyword?: string
    // 每页大小，默认10 limit=0不分页
    limit?: number
    // 页码，默认1
    offset?: number
    // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
    sort?: string
    // 开始时间，毫秒时间戳
    start_time?: number
    // 结束时间，毫秒时间戳
    end_time?: number
    // 根据状态筛选，多选
    status?: string[]
    with_sandbox_info?: boolean
    authed_sandbox_id?: string
}

// 数据推送列表项
export interface IPushListItem {
    // 审核状态
    audit_status: number
    // 审核意见
    audit_advice?: string
    // 创建时间，毫秒时间戳
    create_time: number
    // 描述 最大长度: 300
    description: string
    // 推送模型模型ID
    id: string
    // 数据推送模型名称 最大长度: 128
    name: string
    // 该模型的发布操作
    operation: number
    // 推送状态
    push_status: number
    // 推送错误
    push_error?: string
    // 下一次的执行时间，毫秒时间戳
    next_execute: number
    // 最近一次的执行时间，字符串
    recent_execute: string
    // 最近一次的执行结果 字符串
    recent_execute_status?: string
    // 责任人ID
    responsible_person_id: string
    // 责任人名称
    responsible_person_name: string
    // 调度类型 once一次性,timely定时
    schedule_type: string
    // 执行周期
    schedule_period: string
    // 定时时间，空：立即执行；非空：定时执行
    schedule_time: string
    // 计划开始日期, 时间戳, 秒
    schedule_start: string
    // 计划结束日期, 时间戳, 秒
    schedule_end: string
    // linux crontab表达式, 5级
    crontab_expr?: string
    // linux crontab表达式, 5级 描述
    crontab_expr_desc?: string
}

// 同步模型选定的字段参数
export interface ISyncModelField {
    // 来源字段的列业务名称，和目标字段公用 最大长度: 128
    business_name?: string
    // 字段注释 最大长度: 300
    comment?: string
    // 数据长度
    data_length?: number
    // 数据类型
    data_type?: string
    // 是否为空
    is_nullable?: string
    // 数据精度
    precision?: number
    // 是否为主键
    primary_key?: boolean
    // 列技术名称 最大长度: 128
    technical_name?: string
    // 来源表字段技术名称
    source_tech_name?: string
}

// 更新数据推送参数
export interface IUpdateDataPushParams {
    // 数据推送模型ID
    id?: string
    // 数据提供方法, 枚举: 1web 2share_apply 3catalog_report
    channel?: number
    // linux crontab表达式, 5级
    crontab_expr?: string
    // 描述 最大长度: 300
    description?: string
    // 过滤表达式，SQL后面的where条件
    filter_condition?: string
    // 增量字段，当推送类型选择增量时，选一个字段作为增量字段，（技术名称） 最大长度: 128
    increment_field?: string
    // 增量时间戳值，单位毫秒；当推送类型选择增量时，该字段必填
    increment_timestamp?: number
    // 数据推送模型名称 最大长度: 128
    name?: string
    // 主键，库表字段的技术名称，当推送类型选择增量时，该字段必填
    primary_key?: string
    // 责任人ID
    responsible_person_id?: string
    // 计划开始日期, 格式 2006-01-02
    schedule_start?: string
    // 计划结束日期, 格式 2006-01-02
    schedule_end?: string
    // 推送状态，不填默认是2, 枚举: 0,1,2,3,4,5
    push_status?: number
    // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
    schedule_time?: string
    // 调度类型 once一次性,timely定时
    schedule_type?: string
    // 来源库表编目的数据目录ID，冗余字段
    source_catalog_id?: string
    // 数据源（目标端）
    target_datasource_id?: string
    // 目标表在本次推送是否存在，0不存在，1存在
    target_table_exists?: boolean
    // 目标表名称 最大长度: 255
    target_table_name?: string
    // 推送策略，枚举: 1 增量，2 全量
    transmit_mode?: number
    // 同步模型选定的字段 最小数量: 1
    sync_model_fields?: ISyncModelField[]
}

// 同步模型选定的字段详情
export interface IDetailSyncModelField {
    // 来源字段的列业务名称，和目标字段公用 最大长度: 128
    business_name?: string
    // 字段注释 最大长度: 300
    comment?: string
    // 数据长度
    data_length?: number
    // 数据类型
    data_type?: string
    // 是否为主键
    primary_key?: number
    // 列技术名称 最大长度: 128
    technical_name?: string
    // 字段ID
    field_id: string
    // 来源字段信息
    source_field?: {
        // 来源字段的列业务名称，和目标字段公用 最大长度: 128
        business_name: string
        // 字段注释 最大长度: 300
        comment: string
        // 数据长度
        data_length: number
        // 数据类型
        data_type: string
        // 是否为空
        is_nullable: string
        // 数据精度
        data_accuracy: number
        // 是否为主键
        primary_key: number
        // 列技术名称 最大长度: 128
        technical_name: string
    }
}

// 数据推送详情
export interface IDataPushDetail {
    // 创建时间，毫秒时间戳
    created_at: number
    // 创建用户名称
    creator_name: string
    // 创建用户ID
    creator_uid: string
    // linux crontab表达式, 5级
    crontab_expr: string
    // 描述
    description: string
    // 过滤表达式，SQL后面的where条件
    filter_condition: string
    // 推送模型模型ID
    id: string
    // 当推送类型选择增量时，选一个字段作为增量字段，（技术名称）
    increment_field: string
    // 源数据表中，增量字段的开始时间，用来标记具体增量的时间范围
    increment_timestamp: number
    // 数据推送模型名称
    name: string
    // 推送状态
    push_status: number
    // 下一次的执行时间，毫秒时间戳
    next_execute: number
    // 推送机制的主键 技术名称
    primary_key: string
    // 责任人ID
    responsible_person_id: string
    // 责任人姓名
    responsible_person_name: string
    // 执行周期，分，时，日，天，周，月，年
    schedule_period: string
    // 计划开始日期, 时间戳, 秒
    schedule_start: number
    // 计划结束日期, 时间戳, 秒
    schedule_end: number
    // 定时时间，0立即执行，>0 定时
    schedule_time: number
    // 调度类型:none一次性,timely定时
    schedule_type: string
    // 推送策略，枚举: 1 增量，2 全量
    transmit_mode?: number
    // 更新时间戳, 毫秒
    updated_at: number
    // 更新用户名称
    updater_name: string
    // 更新用户ID
    updater_uid: string
    // 源端详情
    source_detail: ISourceDetail
    // 同步模型字段
    sync_model_fields: IDetailSyncModelField[]
    // 目标端详情
    target_detail: ITargetDetail
    // 是否脱敏 0为否，1为是
    is_desensitization: number
    // 草稿的调度计划
    schedule_draft: {
        // 调度类型:none一次性,timely定时
        schedule_type: string
        // 定时时间，0立即执行，>0 定时
        schedule_time: string
        // 执行周期，分，时，日，天，周，月，年
        schedule_period: string
        // 计划开始日期, 时间戳, 秒
        schedule_start: string
        // 计划结束日期, 时间戳, 秒
        schedule_end: string
        // linux crontab表达式, 5级
        crontab_expr: string
    }
}

// 源端详情
export interface ISourceDetail {
    // 来源库表编目的数据目录ID，冗余字段、
    catalog_id?: string
    // 所属目录名称
    catalog_name?: string
    // 源端数据库类型
    db_type?: string
    // 源端部门ID
    department_id?: string
    // 源端部门名称
    department_name?: string
    // 源端编码
    encoding?: string
    // 来源表显示名称，库表的名称
    table_display_name?: string
    // 来源表ID，库表的ID
    table_id?: string
    // 来源表技术名称
    table_technical_name?: string
}

// 目标端详情
export interface ITargetDetail {
    // 源端数据库类型
    db_type: string
    // 源端部门ID
    department_id: string
    // 源端部门名称
    department_name: string
    // 数据源（目标端）
    target_datasource_id: string
    // 数据源名称（目标端）
    target_datasource_name: string
    // 目标表在本次推送是否存在，0不存在，1存在
    target_table_exists: boolean
    // 目标表名称，也就是技术名称，没有业务名称
    target_table_name: string
    // 数据源来源类型
    source_type: string
    // 数据沙箱ID
    sandbox_id?: string
    // 沙箱项目名称
    sandbox_project_name?: string
    // 沙箱项目空间
    sandbox_datasource_name?: string
}

// 获取已编目的数据资源列表
export interface ICatalogedResourceListItem {
    // 数据资源ID
    resource_id: string
    // 数据资源名称
    name: string
    // 数据资源技术名称
    technical_name: string
    // 数据资源编码
    code: string
    // 数据资源类型
    resource_type: number
    // 所属部门
    department: string
    // 所属部门路径
    department_path: string
    // 数据源ID
    datasource_id: string
    // 数据源类型
    datasource_type: string
    // 数据目录ID
    catalog_id: string
    // 数据目录名称
    catalog_name: string
    // 发布时间
    publish_at: number
}

// 数据推送监控列表项
export interface IPushMonitorListItem {
    // 描述 最大长度: 300
    description: string
    // 推送模型模型ID
    id: string
    // 数据推送模型名称 最大长度: 128
    name: string
    // 该模型的发布操作
    operation: number
    // 推送状态
    push_status: number
    // 最近一次的执行开始时间
    start_time: string
    // 最近一次的执行结束时间
    end_time: string
    // 责任人ID
    responsible_person_id: string
    // 责任人名称
    responsible_person_name: string
    // 最近一次推送总数
    sync_count: number
    // 推送成功总数
    sync_success_count: number
    // 最后一次执行的耗时
    sync_time: number
    // 最后一次执行方式
    sync_method: string
    // 最近一次的执行结果
    status: string
}

// 查询推送调度日志参数
export interface IGetPushScheduleListParams {
    // 当前页码，默认1，大于等于1
    offset?: number
    // 每页条数，默认10，大于等于1
    limit?: number
    // 排序类型，可选start_time, end_time
    sort?: string
    // 排序方向，默认desc降序，可选asc升序
    direction?: string
    // 执行的,参考采集加工，传的是insert
    step?: string
    // 推送模型的ID
    model_uuid: string
    // 是否调度执行
    scheduleExecute?: boolean
    // 状态 RUNNING_EXECUTION(进行中)/ FAILURE（失败）/SUCCESS（成功）
    status?: string
}

//  推送调度日志返回
export interface IDataPushScheduleList {
    // 推送模型模型ID
    id: string
    // 数据推送模型名称 最大长度: 128
    name: string
    // 下一次的执行时间 毫秒
    next_execute: number
    // 当前筛选条件下的对象数量
    total_count: number
    // 列表
    entries: IDataPushScheduleListItem[]
}

// 推送调度日志 item
export interface IDataPushScheduleListItem {
    // 处理实例ID
    process_instance_id
    // 开始时间
    start_time: string
    // 结束时间
    end_time: string
    // 推送总数
    sync_count: string
    // 执行时间，单位，毫秒
    sync_time: string
    // 执行方式
    sync_method: string
    // 运行状态
    status: string
    // 步骤ID，序号
    step_id: string
    // 步骤名称，uuid
    step_name: string
}

export type SubjectGroupItem = {
    count: number
    subject_id: string
    subject_name: string
}

/**
 * 数据获取概览
 */
export interface IDataGetOverview {
    // 基础统计
    /** 部门数量 */
    department_count: number

    /** 信息资源目录 数量 */
    info_catalog_count: number
    /** 信息资源目录 信息项 */
    info_catalog_column_count: number

    /** 数据资源目录 数量 */
    data_catalog_count: number
    /** 数据资源目录 信息项 */
    data_catalog_column_count: number

    /** 数据资源统计 */
    data_resource_count: Array<{
        count: number
        type: string
    }>

    // 前置机/前置库统计
    /** 前置机 数量 */
    front_end_processor: number
    /** 前置机 已使用 */
    front_end_processor_using: number
    /** 前置机 已回收 */
    front_end_processor_reclaim: number

    /** 前置库 数量 */
    front_end_library: number
    /** 前置库 已使用 */
    front_end_library_using: number
    /** 前置库 已回收 */
    front_end_library_reclaim: number

    // 归集任务统计
    /** 归集任务 */
    aggregation: Array<{
        count: number
        status: string
    }>

    // 更新方式统计
    /** 更新方式 */
    sync_mechanism: Array<{
        count: number
        sync_mechanism: string
    }>

    // 更新频率统计
    /** 更新频率 */
    update_cycle: Array<{
        count: number
        update_cycle: string
    }>

    // 基础信息分类统计
    /** 基础信息分类 目录 */
    subject_group: Array<Array<string | number | null>>

    // 数据开放统计
    /** 数据开放 目录数量 */
    open_count: number
    /** 数据开放 部门数量 */
    open_department_count: number

    // 目录层级统计
    /** 目录层级 */
    data_range: Array<{
        count: number
        data_range: string
    }>

    // 库表相关统计
    /** 库表 部门数量 */
    view_department_count: number
    /** 库表 数量 */
    view_count: number
    /** 库表 待归集数量 */
    view_aggregation_count: number

    // 接口相关统计
    /** 接口 部门数量 */
    api_department_count: number
    /** 接口 生成数量 */
    api_generate_count: number
    /** 接口 注册数量 */
    api_register_count: number

    // 文件相关统计
    /** 文件 文件数量 */
    file_count: number
    /** 文件 部门数量 */
    file_department_count: number
    // 库表分类
    view_overview: {
        /** 基础信息 */
        subject_group: {
            count: number
            subiect_id: string
            subiect_name: string
        }[]
        /** 目录层级 */
        data_range: {
            count: number
            data_range: string
        }[]
    }
    view_subject_group: {
        count: number
        subiect_id: string
        subiect_name: string
    }[]
    catalog_subject_group: {
        count: number
        subiect_id: string
        subiect_name: string
    }[]
}

/**
 * 数据推送概览
 */
export interface IDataPushOverview {
    // 审核中
    auditing: number
    // 已停用
    end: number
    // 进行中
    going: number
    // 未开始
    starting: number
    // 已结束
    stopped: number
    // 推送记录总数
    total: number
    // 待发布
    waiting: number
}

// 待审核列表参数
export interface IGetPushAuditListParams {
    // 审核编码
    audit_code?: string
    // 审核类型
    audit_type?: string
    // 数据推送名称
    data_push_name?: string
    // 排序方向
    direction?: string
    // 每页大小
    limit?: number
    // 页码
    offset?: number
    // 排序类型 枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
    sort?: string
    // 审核列表类型 tasks 待审核 historys 已审核
    target?: string
}

// 数据推送审核列表项
export interface IPushAuditListItem {
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
    // 审核时间
    audit_time: string
    // 审核类型
    audit_type: string
    // 数据推送的ID
    data_push_id: string
    // 数据推送名称
    data_push_name: string
    // 审核实例ID
    proc_inst_id: string
}
// 数据资源目录概览 ------ start

export interface IRescCatlgOverviewParams {
    // 年、季度、月
    type: 'year' | 'quarter' | 'month'
    // 开始时间
    start?: string
    // 结束时间
    end?: string
}

export interface IClassifiyItem {
    count: string
    dive: string
    type: string
}

/**
 * @param count 数量
 * @param dive 年、季度、月
 * @param type 库表、接口、文件、手工表
 */
export interface IRescCatlgClassStatics {
    auditing?: {
        offline: Array<IClassifiyItem>
        online: Array<IClassifiyItem>
        publish: Array<IClassifiyItem>
    }
    pass?: {
        offline: Array<IClassifiyItem>
        online: Array<IClassifiyItem>
        publish: Array<IClassifiyItem>
    }
    reject?: {
        offline: Array<IClassifiyItem>
        online: Array<IClassifiyItem>
        publish: Array<IClassifiyItem>
    }
    feedback_count?: Array<any>
}
// 数据资源目录概览 ------ end

// 数据理解模板配置
export interface IComprehensionTemplateConfig {
    // 业务对象
    business_object: boolean
    // 业务特殊维度
    business_special_dimension: boolean
    // 复合表达
    compound_expression: boolean
    // 正面支撑
    front_support: boolean
    // 负面支撑
    negative_support: boolean
    // 促进/推动什么
    promote_push: boolean
    // 业务规则
    protect_control: boolean
    // 服务领域
    service_areas: boolean
    // 服务范围
    service_range: boolean
    // 空间字段理解
    spatial_field_comprehension: boolean
    // 空间维度
    spatial_range: boolean
    // 时间字段理解
    time_field_comprehension: boolean
    // 时间维度
    time_range: boolean
}

// 数据理解模板信息
export interface IComprehensionTemplateParam {
    // 理解模板名称
    name: string
    // 理解模板描述
    description?: string
    // 理解模板配置
    template_config: IComprehensionTemplateConfig
}

export interface IGetDataCatalogFileListParams {
    // 数据目录ID
    department_id: string
    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
    direction?: SortDirection
    // 关键字查询
    keyword?: string
    // 每页大小，默认10 limit=0不分页
    limit?: number
    // 页码，默认1
    offset?: number
    // 发布状态
    publish_status?: string
    my_department_resource?: boolean
}

// 数据目录附件列表项
export interface IDataCatalogFileListItem {
    // 审核意见
    audit_advice: string
    // 审核状态
    audit_state: number
    // 数据目录编码
    code: string
    // 所属部门
    department: string
    // 所属部门路径
    department_path: string
    // 附件ID
    id: string
    // 附件名称
    name: string
    // 发布状态
    publish_status: string
    // 更新时间
    updated_at: number
}

/**
 * 创建数据目录附件
 * @param name 附件名称
 * @param department_id 数据目录ID
 * @param description 附件描述
 * @param is_publish 是否发布
 */
export interface ICreateDataCatalogFileParams {
    name: string
    department_id?: string
    description?: string
    is_publish?: boolean
}

// 附件列表项
export interface IAttachmentListItem {
    // 创建时间
    created_at: number
    // 附件ID
    id: string
    // 附件名称
    name: string
    // 预览OSS ID
    preview_oss_id: string
    // 附件大小
    size: number
    // 附件类型
    type: string
}

// 文件资源详情
export interface IFileCatalogDetail {
    // 文件资源编码
    code: string
    // 创建时间
    created_at: number
    // 创建用户名称
    creator_name: string
    // 创建用户ID
    creator_uid: string
    // 部门ID
    department_id: string
    // 所属部门
    department: string
    // 所属部门路径
    department_path: string
    // 附件描述
    description: string
    // 附件ID
    id: string
    // 附件名称
    name: string
    // 更新时间
    updated_at: number
    // 更新用户名称
    updater_name: string
    // 更新用户ID
    updater_uid: string
}

// 文件资源审核请求
export interface IFileResourceAuditReq {
    // 关键字查询
    keyword?: string
    // 偏移量
    offset?: number
    // 限制
    limit?: number
}

// 文件资源审核列表项
export interface IFileResourceAuditItem {
    // 申请人ID
    applier_id: Array<any>
    // 申请人名称
    applier_name: string
    // 审核code
    apply_code: string
    // 申请时间
    apply_time: string
    // 部门
    department: string
    // 部门路径
    department_path: string
    // 描述
    description: string
    // 文件资源编码
    file_resource_code: string
    // 文件资源名称
    file_resource_name: string
    // 文件资源ID
    file_resource_id: string
    // 流程实例ID
    id: string
}
export interface ISystemOperationParams {
    acceptance_end?: number
    acceptance_start?: number
    end_date: number
    start_date: number
    construction_unit?: string
    // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
    direction?: SortDirection
    sort?: string
    // 关键字查询
    keyword?: string
    // 每页大小，默认10 limit=0不分页
    limit?: number
    // 页码，默认1
    offset?: number
}
export interface ISystemOperationItem {
    acceptance_time: number
    end_date: number
    start_date: number
    aggregation_table_count: number
    construction_unit?: string
    award_reason?: string
    award_suggestion?: string
    data_quality_situation?: string
    overall_update_timeliness?: string
    project_name?: string
    subsystem_name?: string
    summary?: string
}
export interface ISystemOperationDetailsParams extends ISystemOperationParams {
    is_whitelisted?: boolean
    organization_name?: string
    system_name?: string
}
export interface ISystemOperationDetailItem {
    acceptance_time: number
    expected_update_count: number
    field_count?: number
    first_aggregation_time?: number
    has_quality_issue?: boolean
    is_updated_normally?: boolean
    is_whitelisted?: boolean
    issue_remark?: string
    latest_data_count?: number
    organization_name?: string
    system_name?: string
    table_comment?: string
    table_name?: string
    update_count?: number
    update_frequency?: string
    update_timeliness?: number
    whitelist_type?: string
}
export interface ISystemOperationConfig {
    green_card: {
        logical_operator: string
        quality_pass_value: number
        update_timeliness_value: number
    }
    red_card: {
        logical_operator: string
        quality_pass_value: number
        update_timeliness_value: number
    }
    yellow_card: {
        logical_operator: string
        quality_pass_value: number
        update_timeliness_value: number
    }
    normal_update: {
        logical_operator?: string
        quality_pass_value?: number
        update_timeliness_value: number
    }
}
export interface ISystemOperationWhiteList {
    data_update?: boolean
    form_view_id: string
    quality_check?: boolean
}

// -------------------------------------------------------数据考核评价Start------------------------------------------------

export enum TargetTypeEnum {
    // 部门考核
    Department = 1,
    // 运营考核
    Operation = 2,
}

export enum AssessmentTargetStatus {
    // 全部
    All = '',
    // 未到期
    NoExpired = 1,
    // 待评价
    ToBeEvaluated = 2,
    // 已结束
    Ended = 3,
}

export interface ICreateDepartmentTargetParams {
    target_name: string
    target_type: TargetTypeEnum
    department_id: string
    description: string
    start_date: string
    end_date?: string
    responsible_uid?: string
}

export interface ICreateOperationTargetParams {
    target_name: string
    target_type: TargetTypeEnum
    description: string
    start_date: string
    end_date?: string
    responsible_uid?: string
    employee_id?: string
}

export interface IGetTargetListParams {
    offset?: number
    limit?: number
    sort?: string
    direction?: string
    target_name?: string
    type?: TargetTypeEnum
    status?: AssessmentTargetStatus
    department_id?: string
    start_date?: string
    end_date?: string
    is_operator?: boolean
    responsible_uid?: string
    employee_id?: string
}

export interface IAssessmentTargetItem {
    id: string
    target_name: string
    target_type: TargetTypeEnum
    department_id: string
    department_name: string
    description: string
    start_date: string
    end_date?: string
    status: AssessmentTargetStatus
    owner: string
    created_at: string
    created_by: string
    created_by_name: string
    updated_at: string
    updated_by: string
    updated_by_name: string
    responsible_uid: string
    responsible_name: string
    employee_id: string
    employee_name: string
}

// 部门考核计划类型
export enum AssessmentPlanTypeEnum {
    // 数据获取
    DataAcquisition = 1,
    // 数据质量整改
    DataQualityImprovement = 2,
    // 数据资源编目
    DataResourceCataloging = 3,
    // 业务梳理
    BusinessAnalysis = 4,
    // 数据处理
    DataProcessing = 5,
    // 数据理解
    DataUnderstanding = 6,
}

export interface ITargetEvaluationPlanItem {
    id: string
    plan_name: string
    description: string
    owner: string
    collection_count: number
    actual_collection_count: number
    related_plans: { id: string; name: string }[]
    created_at: string
    updated_at: string
    // 计划资源数量
    target_count: number
    // 实际资源数量
    actual_count: number
    model_target_count: number
    model_actual_count: number
    table_target_count: number
    table_actual_count: number
    flow_target_count: number
    flow_actual_count: number
    plan_total: number
    actual_total: number
    data_process_explore_actual?: number
    data_process_fusion_actual?: number
    data_understanding_actual?: number
}

export interface ITargetEvaluationPlans {
    plan_type: AssessmentPlanTypeEnum
    name: string
    plans: {
        list: ITargetEvaluationPlanItem[]
        total_count: number
    }
}

export interface IAssessmentTargetBaseInfo {
    id: string
    target_name: string
    target_type: TargetTypeEnum
    department_id: string
    department_name: string
    description: string
    start_date: number
    end_date?: number
    status: AssessmentTargetStatus
    created_at: number
    created_by: string
    created_by_name: string
    updated_at: number
    updated_by: string
    updated_by_name: string
    evaluation_content?: string
    employee_id: string
    employee_name: string
    responsible_uid: string
    responsible_name: string
}

export interface IAssessmentTargetDetail {
    entries: IAssessmentTargetBaseInfo
    evaluation_plans: ITargetEvaluationPlans[]
}

export interface ICreateTargetAssessmentPlanParams {
    assessment_type: TargetTypeEnum
    target_id: string
    plan_type: AssessmentPlanTypeEnum
    plan_name: string
    plan_desc: string
    responsible_uid: string
    plan_quantity?: number
    related_data_collection_plan_id?: string
    business_items?: {
        type: 'model' | 'table' | 'process'
        quantity: number
    }[]
    data_process_explore_quantity?: number
    data_process_fusion_quantity?: number
}

export interface ITargetEvaluateParams {
    evaluate_content: string
    data_collection?: {
        id: string
        actual_quantity: number
    }[]
    quality_improve?: {
        id: string
        actual_quantity: number
    }[]
    resource_catalog?: {
        id: string
        actual_quantity: number
    }[]
    business_analysis?: {
        id: string
        model_actual_count: number
        table_actual_count: number
        flow_actual_count: number
    }[]
    operation_data_process?: {
        id: string
        data_process_explore_actual: number
        data_process_fusion_actual: number
    }[]
    operation_data_understanding?: {
        id: string
        data_understanding_actual: number
    }[]
}

export interface IAssessmentOverviewParams {
    department_id: string
    target_id: string
}

export interface IOperationAssessmentOverviewParams {
    target_id: string
}
// -------------------------------------------------------数据考核评价End---------------------------------------------------

// -------------------------------------------------------数据理解概览Start---------------------------------------------------

export interface IDataUnderstandOverviewResult {
    // 服务领域-数据目录数量
    catalog_domain_group?: DomainGroup
    // 基础信息分类 - 完成率
    completed_rate: Array<BaseInfoCompletedData>
    // 基础信息分类 -已理解数据目录
    completed_understand: Array<BaseInfoCompletedData>
    // 数据理解部门数量
    department_count: number

    // 基础信息分类 数据理解部门数量
    department_understand: Array<BaseInfoCompletedData>

    // 错误信息
    errors?: Array<string>

    // 基础信息分类 未理解数据目录数量
    not_completed_understand: Array<BaseInfoCompletedData>

    // 服务领域 业务对象数量
    subject_domain_group: DomainGroup

    // 理解任务数量
    understand_task: Array<UnderstandTask>

    // 理解任务数
    understand_task_count: number

    // 库表 数量
    view_catalog_count: number

    // 库表目录数-未理解数量
    view_catalog_not_understand_count: number

    // 库表目录数-已理解
    view_catalog_understand_count: number

    // 服务领域 库表目录数
    view_domain_group: DomainGroup
}

export interface DomainGroup {
    信用信息: number
    金融信息: number
    医疗健康: number
    城市交通: number
    文化旅游: number
    行政执法: number
    党的建设: number
}

/**
 * 基础信息分类 - 完成率
 */
export interface BaseInfoCompletedData {
    count: number
    subject_id: string
    subject_name: string
}

export interface UnderstandTask {
    count: number
    status: number
}

/**
 * 数据理解部门TOP
 */
export interface IDataUnderstandDepartTopResult {
    completed_count: number
    completion_rate: number
    department_id: string
    name: string
    total_count: number
    uncompleted_count: number
}

// 数据理解领域详情
export interface IDataUnderstandDomainDetailResult {
    ['信用信息']: Array<DomainGroupDataInfo>
    ['金融信息']: Array<DomainGroupDataInfo>
    ['医疗健康']: Array<DomainGroupDataInfo>
    ['城市交通']: Array<DomainGroupDataInfo>
    ['文化旅游']: Array<DomainGroupDataInfo>
    ['行政执法']: Array<DomainGroupDataInfo>
    ['党的建设']: Array<DomainGroupDataInfo>
}

/**
 * 数据理解领域详情
 */
export interface DomainGroupDataInfo {
    view_count: number
    name: string
    api_count: number
    file_count: number
    department_id: string
    data_evaluation: string
    update_cycle: number
    updated_at: string
}

export interface IUnderstandDepartmentDetailResult {
    api_count: number
    data_evaluation: string
    department_id: string
    department_name: string
    file_count: number
    name: string
    update_cycle: number
    updated_at: string
    view_count: number
}

// -------------------------------------------------------数据理解概览End---------------------------------------------------

export interface IApplyScopeNode {
    id: string
    name: string
    parent_id: string
    required: boolean
    selected: boolean
}
export interface IApplyScopeTree {
    key: string
    name: string
    nodes: IApplyScopeNode[]
}

export interface IApplyScopeModule {
    apply_scope_id: string
    name: string
    required: boolean
    selected: boolean
    trees: IApplyScopeTree[]
}

export interface ICategoryApplyScopeConfig {
    id: string
    name: string
    using: boolean
    required: boolean
    modules: IApplyScopeModule[]
}

// putApplyScopeConfig 接口返回值相关类型
export interface IApplyScopeConfigNode {
    id: string
    selected: boolean
    required: boolean
}

export interface IApplyScopeConfigTree {
    key: string
    nodes: IApplyScopeConfigNode[]
}

export interface IApplyScopeConfigItem {
    apply_scope_id: string
    selected: boolean
    required: boolean
    trees: IApplyScopeConfigTree[]
}

// 保存应用范围配置的请求参数
export interface ISaveApplyScopeConfigRequest {
    items: IApplyScopeConfigItem[]
}

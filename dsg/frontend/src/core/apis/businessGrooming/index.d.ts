import { string } from 'sql-formatter/lib/src/lexer/regexFactory'
import { SortDirection, BusinessDomainLevelTypes } from '../common'
import { GlossaryType } from '@/components/BusinessGlossary/const'

export interface FormFiledsReturn {
    entries: Array<any>
    standard_fields_count: number
    total_count: number
}

export type FormFiled = {
    code_table: string
    created_at: number
    created_by: string
    data_accuracy: number
    data_length: number
    data_type: string
    encoding_rule: string
    explanation: string
    formulate_basis: number
    id: number
    name: string
    name_en: string
    standard_id: string
    standard_status: string
    updated_at: number
    updated_by: string
    value_range: string
    // 源字段id
    ref_id: number
}

export interface SourceFormInfo {
    // 三种状态：new新建；created已同步，在数仓创建；fromDw来自元数据平台。画布上后两种打勾。
    checked: string

    // 表描述
    description: string

    // 表字段信息
    fields: Array<SourceFieldInfo>

    // 表id
    id: string

    // 信息系统/数据源
    info_system?: string

    // 表名
    name: string

    // 版本取值：默认draft 草稿态；published 已发布
    version?: string

    // 元数据平台的id
    metadata_table_id: string

    // 数据源id
    datasource_id?: string

    // 数据源类型
    datasource_type?: string
}

export interface SourceFieldInfo {
    // 字段注释
    description: string

    // 字段精度
    field_precision: number

    // 字段id
    id: string

    // 字段长度
    length: number

    // 字段名称
    name: string

    // 所属表id
    table_id: string

    // 字段类型
    type: string

    // 版本取值：默认draft 草稿态；published 已发布
    version: string
}

export interface CanvasInfo {
    // 画布信息
    content: string

    // uuid
    id: string

    // 画布类型：collecting 采集画布，processing 加工画布
    type: string

    // 版本
    version: 'draft' | 'published'
}

export interface DataListTemplate<T> {
    entries: Array<T>
    id: string
    name: string
    limit: number
    offset: number
    total_count: number
}

export interface MetaDataFormInfo {
    // 数据源id
    data_source_id: string
    // 表id
    metadata_table_id: string
    // 表名
    name: string
    // schema id
    schema_id: string
}

export interface CollectingTableDataParams {
    // 取值：默认saving 保存，publishing 发布
    action: string

    // 业务表的字段列表
    business_table: Array<{
        // 业务表的字段ID
        field_id: string
        // 业务表字段对应的贴源表字段ID
        source_id: string
    }>
    // 贴源表
    source_tables: Array<SourceFormInfo>

    // 任务id
    task_id?: string
}

interface ProcessingTableDataParams {
    // 取值：默认saving 保存，publishing 发布
    action: string

    // 标准表
    map_table: SourceFormInfo

    // 贴源表
    source_tables: Array<SourceFormInfo>

    // 任务id
    task_id?: string
}

/**
 * 通用分页获取参数
 */
export interface SearchCommonParms {
    // 当前页码，默认1，大于等于1
    offset?: number

    // 每页条数，默认10，大于等于1
    limit?: number

    // 排序类型，默认按created_at排序，可选updated_at
    sort?: string

    // 排序方向，默认desc降序，可选asc升序
    direction?: string
}
/**
 * 通用分页获取参数
 */
export interface SearchAllIndicator {
    // 当前页码，默认1，大于等于1
    offset?: number

    // 每页条数，默认10，大于等于1
    limit?: number

    // 排序类型，默认按created_at排序，可选updated_at
    sort?: string

    // 排序方向，默认desc降序，可选asc升序
    direction?: string

    // 关键字
    keyword?: string

    // 业务域id
    mid?: string

    // 是否草稿
    is_draft?: boolean

    // 版本id
    version_id?: string
}
/**
 * 指标模型数据结构
 */
export interface IndicatorModelStruct {
    // 画布内容
    canvas: string

    // 创建时间
    created_at: number

    // 创建人
    created_by: string

    // 描述
    description: string

    //   指标模型id
    id: string

    // 指标模型名
    name: string

    // 更新时间
    updated_at: number

    // 更新人
    updated_by: string
}

/**
 * 指标图数据结构体
 */
export interface IndicatorModelCanvasStruct {
    // 画布
    canvas: string

    // 关系数据
    data: Array<FormRelationModel>

    // 任务id
    task_id?: string
}

// 表关系模型
export interface FormRelationModel {
    // 业务表id
    id: string

    // 字段关系
    relations: Array<{
        // 出表的字段id
        src_field: string

        // 入表的字段id
        target_field: string
    }>
}

// 同步模型信息
export interface SyncDataInfo {
    // 描述
    description: string

    // 名称
    name: string

    // 来源表
    source: DataFormInfo

    // 目标表
    target: DataFormInfo

    // 任务id
    task_id: string
}

// 数据表信息
export interface DataFormInfo {
    // 表描述
    description: string

    // 表字段信息
    fields: Array<DataFieldInfo>

    // 表id
    id: string

    // 信息系统/数据源
    info_system?: string

    // 表名
    name: string

    // 数据源id
    datasource_id?: string

    // 数据源类型
    datasource_type?: string
}

// 数据表字段消息
export interface DataFieldInfo {
    // 字段注释
    description: string

    // 字段精度
    field_precision: number

    // 字段id
    id: string

    // 字段长度
    length: number

    // 字段名称
    name: string

    // 字段类型
    type: string

    // 映射是否取消，true表示取消了映射
    unmapped?: boolean
}

/**
 * 数据同步列表参数
 */
export interface DataSyncParams extends SearchAllIndicator {
    // 任务id
    task_id: string
}

/**
 * 同步模型数据
 */
export interface DataSyncInfo {
    // 创建时间
    created_at: number

    // 创建人
    created_by: string

    // 描述
    description: string

    //  同步模型id
    id: string

    // 同步模型名
    name: string

    // 更新时间
    updated_at: number

    // 更新人
    updated_by: string
}

/**
 * 工作流节点
 */
export interface IWorkflowNode {
    // 节点id
    node_id?: string
    // 节点对应的模型的uuid
    model_id: string
    // 模型类型：采集或加工
    model_type: string
    // 上游节点
    pre_node_id: string[]
}

/**
 * 工作流详情
 * @id ID
 * @name 名称
 * @description 描述
 * @nodes 节点信息
 * @canvas 画布信息
 */
export interface IWorkflowDetails {
    id: string
    name: string
    description: string
    nodes: IWorkflowNode[]
    canvas?: string
}

/**
 * 工作流信息
 */
export interface IWorkflowItem {
    // ID
    id: string
    // 名称
    name: string
    // 描述
    description: string
    // 周期
    frequency: 3
    // 周期单位
    unit: string
    // 启用/禁用
    activation: boolean
    // 执行时间
    execution_time: string
    // 开始时间
    start_date: string
    // 结束时间
    end_date: string
    // 创建时间
    created_at: number
    // 更新时间
    updated_at: number
    // 节点数量
    node_count: number
}

/**
 * 数据加工列表参数
 */
export interface DataProcessParams extends SearchAllIndicator {
    // 任务id
    with_path: boolean
}

/**
 * 加工数据信息
 */
export interface DataProcessInfo extends DataSyncInfo {
    target?: DataProcessFormInfo
}

export interface DataProcessFormInfo {
    // 表id
    table_id: string

    // 信息系统/数据源
    info_system?: string

    // 数据源id
    info_system_id: string

    // 表名
    table_name: string

    // 数据源类型
    datasource_type?: string

    // 数据源名称
    datasource_name?: string
}

// 同步模型信息
export interface ProcessDataInfo {
    // 描述
    description?: string

    // 业务表id
    fid?: string

    // 业务表名称
    f_name?: string

    // 业务表字段
    f_field?: Array<ProcessBussinessField>

    // sql语句
    insert_sql: string

    // 名称
    name?: string

    // 引用的数据表
    table_list: Array<TableDataInfo>

    // 目标表
    target?: DataFormInfo

    // 任务id
    task_id: string
}

/**
 * 引用数据表信息
 */
interface TableDataInfo {
    // 数据源id
    datasource_id: string
    // 数据源 名称
    datasource_name?: string
    // 数据源类型
    datasource_type?: string
    // 信息系统名称
    info_system?: string

    // 数据表名称
    table_name
}

interface ProcessBussinessField {
    // 数据精度
    data_accuracy: number

    // 数据长度
    data_length: number

    // 数据类型
    data_type: string
    // 字段id
    id: string
    // 中文名称
    name: string
    // 英文名称
    name_en: string
}

/**
 * 业务域对象
 */
export type IBusinessDomainCount = {
    // 业务域个数
    level_business_domain: number

    // 主题域个数
    level_subject_domain: number

    // 业务对象/业务活动个数
    level_business_object: number
}

/**
 * 字段标准化任务 进行中 子项
 */
export interface IStdToBeExecTaskItem {
    // create_at?: string
    // create_by_id: string
    // create_by_name?: string
    // field_description: string
    // field_id: string
    // field_name: string
    // id: string
    // standard_reference_document: string
    // // 配置数据元id
    // data_element_id?: string

    id: string
    business_table_field_id: string
    business_table_field_current_name: string
    business_table_field_origin_name: string
    business_table_field_description?: string
    business_table_field_origin_name_en: string
    business_table_field_std_type?: string
    business_table_field_current_std_type?: string
    business_table_field_origin_std_type?: string
    business_table_field_data_type: string
    business_table_field_data_length?: number
    business_table_field_data_precision?: number
    // 码表名称
    business_table_field_dict_name?: string
    // 编码规则名称
    business_table_field_rule_name?: string
    state: string
    task_id: string
    data_element_id?: string
    data_element?: {
        name_en: string
        name_cn: string
        std_type: number
    }
    create_start_time: string
    create_user: string
}

/**
 * 字段标准化任务 进行中
 */
export interface IStdToBeExecTask {
    fields: Array<IStdToBeExecTaskItem>
    form_id: string
    form_name: string
    toggle?: Boolean
}

/**
 * 标准结果
 */
interface IStandardResult {
    data_accuracy: number
    data_length: number
    data_type: string
    id: string
    name: string
    name_en: string
    std_type_name: string
    value_range: string
}

/**
 * 字段标准化任务 已完成
 */
export interface IStdCompletedTask {
    field_description: string
    field_id: string
    field_name: string
    form_id: string
    form_name: string
    id: string
    standard_reference_document: string
    end_at: string
    standard_result: IStandardResult
}

// ----------------------------------------------flowchart start--------------------------------------------------------------

/**
 * @description 流程图Item
 * @param id string 流程图id
 * @param name string 流程图名称
 * @param description string? 流程图描述
 * @param file_path_id string? 流程图文件路径
 * @param business_model_id number 所属业务模型id
 * @param created_by string 创建人
 * @param created_at number 创建时间
 * @param updated_by string? 更新人
 * @param updated_at number? 更新时间
 * @param deleted_at number 删除时间(时间戳，逻辑删除)。默认值0
 * @param status number? 业务流程图状态（先预留）
 * @param version number? 业务流程图版本（先预留）
 * @param saved boolean 流程图画布是否已保存
 */
export interface IFlowchartItem {
    id: string
    name: string
    description?: string
    file_path_id?: string
    business_model_id: number
    created_by: string
    created_at: number
    updated_by?: string
    updated_at?: number
    deleted_at: number
    status?: number
    version?: number
    saved: boolean
}

/**
 * @description 查询流程图列表Params
 * @param offset number? 当前页数，默认1（>=1），小于1报错
 * @param limit number? 每页数量，默认10，最大100
 * @param direction SortDirection? 排序方向：默认desc降序，可选asc升序
 * @param keyword string? 模糊查询：按照流程图名或者创建人或修改人，左前缀查询
 * @param sort string? 排序类型：默认created_at，可选updated_at
 */
export interface IFlowchartQueryParams {
    offset?: number
    limit?: number
    direction?: SortDirection
    keyword?: string
    sort?: string
    is_draft?: boolean
    version_id?: string
}

/**
 * @description 查询流程图列表Model
 * @param entries IFlowchartItem[] 流程图列表
 * @param total_count number 数量
 */
export interface IFlowchartModel {
    entries: IFlowchartItem[]
    total_count: number
}

/**
 * @description 新建/编辑流程图Params
 * @param name string 流程图名称
 * @param description string? 流程图描述
 * @param task_id string? 任务id
 */
export interface IFlowchartResParams {
    name: string
    description?: string
    task_id?: string
}

/**
 * @description 流程图唯一性校验Params
 * @param name string 流程图名称
 * @param id string 流程图ID，id=0或为空表示新建时重复校验，id不为0表示对应流程图编辑校验
 */
export interface IFlowchartCheckUniquenessParams {
    name: string
    id: string
}

/**
 * @description 流程图唯一性校验Model
 * @param name string 流程图名称
 * @param repeat boolean 流程图名称是否重复
 */
export interface IFlowchartCheckUniquenessModel {
    name: string
    repeat: boolean
}

/**
 * @description 流程图请求基本Model
 */
export interface IFlowchartResBaseModel {
    entries: [{ id: string; name: string }]
}

/**
 * @description 查询流程图列表Params
 * @param main_business_id 当前页面业务模型ID
 * @param node_id 流程节点ID
 * @param type  导航查看的方式，1全部，2只看流程图，必填"
 * @param is_draft 是否草稿
 * @param version_id 版本id
 */
export interface IFlowTreeParams {
    fid?: string
    main_business_id?: string
    node_id?: string
    type: number
    is_draft?: boolean
    version_id?: string
}

/**
 * @description 业务模型下流程图树Model
 * @param business_model_id string 业务模型id
 * @param main_business_id string 业务模型id
 * @param flowchart_id string 流程图id
 * @param node_name string 节点名字
 * @param read_only boolean 是否只读
 * @param is_ref boolean 是否引用
 * @param children 子节点
 */
export interface IFlowTreeModel {
    business_model_id?: string
    main_business_id?: string
    flowchart_id?: string
    node_name: string
    read_only: boolean
    is_ref: boolean
    children: [IFlowTreeModel]
}

/**
 * @description 获取目录节点下一级流程节点、关联表单、子流程节点model
 * @param catalog_type 目录节点类型，流程节点normal、子流程节点process、泳道swimlane、表单form、流程图flowchart
 * @param read_only 是否只读
 * @param form 表单信息，仅在catalog type为form时生效
 * @param node_normal 普通节点信息，仅在catalog type为normal时生效
 * @param node_process 子流程节点信息，仅在catalog type为process时生效
 * @param node_swimlane 泳道信息，仅在catalog type为swimlane时生效
 * @param sub_flowchart 流程图信息，仅在catalog type为flowchart时生效
 */
export interface IFlowTreeNodeModel {
    catalog_type: string
    read_only: boolean
    form: {
        business_model_id: string
        form_id: string
        name: string
        is_ref: boolean
    }
    node_normal: {
        business_model_id: string
        flowchart_id: string
        node_id: string
        node_name: string
    }
    node_process: {
        business_model_id: string
        flowchart_id: string
        node_id: string
        node_name: string
        sub_flowchart: {
            business_model_id: string
            flowchart_id: string
            flowchart_name: string
            is_ref: boolean
            main_business_id: string
        }
    }
    node_swimlane: {
        business_model_id: string
        flowchart_id: string
        node_id: string
        node_name: string
    }
    sub_flowchart: {
        business_model_id: string
        flowchart_id: string
        flowchart_name: string
        is_ref: boolean
        main_business_id: string
    }
}

/**
 * 主流程图列表
 * @params type	 number  1全部，2本部门，3本业务模型 必传
 * @params fid	 string  当前的流程图id，即子流程节点所属的流程图，uuid，当type=2或3时必传
 * @params object_id	 string	 parent_id  业务架构对象id，不传查所有，uuid，当type=1时选传
 */
export interface IMainAllFlowChart {
    type: number
    fid?: string
    object_id?: string
    is_draft?: boolean
    version_id?: string
}

/**
 * 流程图列表项
 * @params business_model_id	 string  流程图所属业务模型的id
 * @params flowchart_id	 string  流程图id
 * @params parent_id	 parent_id  子流程图的父节点流程图id
 * @params flowchart_level	 number     流程图相对于主流程图的层级，为1即为主流程图
 * @params flowchart_name	 string  流程图名称
 * @params main_business_id	 string  业务模型id
 * @params department_name	string  部门或组织名称
 * @params subject_domain_name	string  主题域名称
 */
export interface IBusinFlowChartItem {
    business_model_id: string
    flowchart_id: string
    parent_id?: string
    flowchart_level: number
    flowchart_name: string
    main_business_id: string
    department_name?: string
    subject_domain_name?: string
    children?: Array<IBusinFlowChartItem>
    isExpand?: boolean
    // 是否展示节点
    isShow?: boolean
}

/**
 * 流程图推荐列表项
 * @params business_model_id	 string  流程图所属业务模型的id
 * @params flowchart_id	 string  流程图id
 * @params flowchart_level	 number     流程图相对于主流程图的层级，为1即为主流程图
 * @params flowchart_name	 string  流程图名称
 * @params main_business_id	 string  业务模型id
 * @params department_name	string  部门或组织名称
 * @params subject_domain_name	string  主题域名称
 * @params hit_score	number  	推荐分值
 * @params reason	string  推荐原因
 */
export interface IBusinFlowChartRecmdItem extends IBusinFlowChartItem {
    hit_score: number
    reason: string
}

// ----------------------------------------------forms----------------------------------------------------------------

/**
 * @description 枚举信息
 * @param display string 显示名
 * @param value number 标识/枚举值
 */
export interface IEnumeration {
    display: string
    value: number
}

/**
 * @description 表单相关信息字段
 * @param id number 字段ID
 * @param name string 字段名称
 * @param name_en string 字段英文名称
 */
export interface IFormFields {
    id: string
    name: string
    name_en: string
}

/**
 * @description 字段标准化率信息
 * @param standard_fields_count number 标准字段数
 * @param fields_count number 总字段数
 */
export interface IFormFieldStandardRate {
    standard_fields_count: number
    fields_count: number
}

/**
 * @description 融合规则
 * @param business_form_id number
 * @param get_data_unit string 取值单位
 * @param get_data_main_business string? 取值业务模型
 * @param get_data_business_table string 取值业务表
 * @param get_data_priority number 取值优先级
 * @param priority_rule IEnumeration 优先规则
 * @param field_association_rule string? 字段关联规则
 * @param rule_field string 规则字段
 * @param get_data_rule string 取值规则
 * @param remark string 备注
 */
export interface IFormFusionDetails {
    business_form_id: string
    get_data_unit: string
    get_data_main_business?: string
    get_data_business_table: string
    get_data_priority: number
    priority_rule: IEnumeration
    field_association_rule?: string
    rule_field: string
    get_data_rule?: string
    remark?: string
}

/**
 * @description 原始/业务表Item
 * @param id number 表单ID
 * @param name string 业务表名称
 * @param standard_form_name string 业务表名称
 * @param description string? 业务表描述说明
 * @param guideline string? 参考标准
 * @param data_range IEnumeration 数据范围
 * @param update_cycle IEnumeration 更新周期
 * @param resource_tag string[]? 资源标签
 * @param source_system string[]? 来源系统
 * @param source_business_scene string[]? 来源业务场景
 * @param related_business_scene string[]? 关联业务场景
 * @param flowcharts string 关联流程图
 * @param field_count number 字段数量
 * @param fields IFormFields[] 字段
 * @param created_by string 创建人
 * @param created_at number 创建时间
 * @param updated_by string 最终修改人
 * @param updated_at number 最终修改时间
 * @param field_standard_rate IFormFieldStandardRate? 字段标准化率信息
 */
export interface IFormItem {
    id: string
    name: string
    path: string
    standard_form_name: string
    description?: string
    guideline?: string
    data_range: IEnumeration
    update_cycle: IEnumeration
    resource_tag?: string[] | { id: string; name: string }[]
    source_system?: string[] | { id: string; name: string }[]
    source_business_scene?: string[] | { id: string; name: string }[]
    related_business_scene?: string[] | { id: string; name: string }[]
    flowcharts: string
    field_count: number
    fields: IFormFields[]
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
    field_standard_rate?: IFormFieldStandardRate
    business_model_id?: string
    new_flag?: boolean
    // business_object?: { id: string; name: string }[]
    subject_domain_id?: string
    data_kind?: string[]
    shared_attribute?: string
    shared_condition?: string
    shared_mode?: string
    open_attribute?: string
    open_condition?: string
    form_type: string
    is_completed: boolean
    source: string
    label_ids?: string[]
    table_kind: string
    // 业务/数据标准表-关联标准文件
    stand_file_ids?: Array<string>
}

/**
 * @description 融合表Item
 * @param id number 表单ID
 * @param name string 业务表名称
 * @param overall_priority_rule string 总体优先规则
 * @param overall_rule_remark string? 总体规则备注
 * @param fusion_field string 融合字段
 * @param field_range string 字段值域
 * @param Details IFormFusionDetails[]
 * @param created_by string 创建人
 * @param created_at number 创建时间
 * @param updated_by string 最终修改人
 * @param updated_at number 最终修改时间
 */
export interface IFusionFormItem {
    id: string
    name: string
    overall_priority_rule?: string
    overall_rule_remark?: string
    fusion_field: string
    field_range: string
    Details: IFormFusionDetails[]
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
    new_flag?: boolean
}

/**
 * @description 查询表单列表Params
 * @param type number 表单类型，枚举：1：原始表；2：业务表；3：融合表
 * @param offset number? 当前页数，默认1（>=1），小于1报错
 * @param limit number? 每页数量，默认10，最大100
 * @param direction SortDirection? 排序方向：默认desc降序，可选asc升序
 * @param keyword string? 模糊查询：按照流程图名或者创建人或修改人，左前缀查询
 * @param sort string? 排序类型：默认created_at，可选updated_at
 * @param data_range number? 原始表/业务表筛选枚举条件：数据范围：1：区县，2：市直，3：全市
 * @param overall_priority_rule number? 融合表筛选条件：总体优先规则：1：唯一性，2：不唯一性，3：时间性
 * @param rate number? 业务表查询条件：查看字段标准化率信息：默认：0：不查询，1：查询
 * @param complete boolean true 返回已完善的表
 */
export interface IFormQueryListParams {
    type?: number
    offset?: number
    limit?: number
    direction?: SortDirection
    keyword?: string
    sort?: string
    data_range?: number
    overall_priority_rule?: number
    rate?: number
    task_id?: string
    complete?: boolean
    table_kind?: string
    is_draft?: boolean
    version_id?: string
}

/**
 * @description 查询表单列表Model
 * @param entries [IFormItem | IFusionFormItem] 表单列表
 * @param total_count number 分页查询总记录条数
 */
export interface IFormQueryListModel {
    entries: Array<IFormItem & IFusionFormItem>
    total_count: number
}

/**
 * @description 表单详情Model
 * @param type number 表单类型
 * @param original_form IFormItem 原始表详情，当表单类型为0时不为空
 * @param standard_form IFormItem 业务表详情，当表单类型为1时不为空
 * @param fusion_form IFusionFormItem 融合表详情，当表单类型为2时不为空
 */
export interface IFormQueryItemModel {
    type: number
    original_form?: IFormItem
    standard_form?: IFormItem
    fusion_form?: IFusionFormItem
}

/**
 * @description 表单请求通用model
 * @param id number 表单ID
 * @param name string 表单名称
 */
export interface IFormResModel {
    entries: { id: string; name: string }[]
}

/**
 * @description 创建/修改业务表Params
 * @param type number 表单ID
 * @param name string 业务表名称
 * @param description string 业务表描述说明
 * @param guideline string? 参考标准
 * @param data_range number 数据范围
 * @param update_cycle number 更新周期
 * @param resource_tag string[]? 资源标签
 * @param source_system string[]? 来源系统
 * @param source_business_scene string[]? 来源业务场景
 * @param related_business_scene string[]? 关联业务场景
 * @param task_id string? 任务id
 */
export interface IFormEditParams {
    type?: number
    name: string
    description: string
    guideline?: string
    data_range?: number
    update_cycle?: number
    resource_tag?: string[]
    source_system?: string[]
    source_business_scene?: string[]
    related_business_scene?: string[]
    table_kind: string
    task_id?: string
    node_id?: string
    flowchart_id?: string
    // business_object?: { id: string; name: string }[]
    shared_attribute?: string
    technical_name?: string
    from_table_id: string
    // 关联标准文件
    stand_file_ids?: Array<string>
}

/**
 * @description 表单信息统计Model
 * @param origin_count number 原始表数量
 * @param standard_count number 业务表数量
 * @param fusion_count number 融合表数量
 * @param otal_count number 总数
 */
export interface IFormQueryCountModel {
    origin_count: number
    standard_count: number
    fusion_count: number
    total_count: number
}

/**
 * @description 表单配置枚信息
 * @param id number 枚举值ID
 * @param value string 配置枚举展示
 * @param value_en string 配置枚举展示英文
 */

/**
 * @description 表单唯一性校验Model
 * @param form_type number 表单类型
 * @param form_id number? 表单ID，可以为空，不为空表示排除该ID所对应的表单
 * @param name string 名称
 */
export interface IFormCheckUniquenessParams {
    form_id?: string
    name: string
}

/**
 * @description 表单唯一性校验Model
 * @param name string 表单称
 * @param repeat boolean 表单名称是否重复
 */
export interface IFormCheckUniquenessModel {
    name: string
    repeat: boolean
}

/**
 * @description 查询原始表/业务表字段列表Params
 * @param offset number? 当前页数，默认1（>=1），小于1报错
 * @param limit number? 每页数量，默认10，最大100
 * @param keyword string? 模糊查询：按照流程图名或者创建人或修改人，左前缀查询
 */
export interface IFormQueryFieldsListParams {
    offset?: number
    limit?: number
    keyword?: string
    sort?: string
    direction?: string
    version?: string
    is_draft?: boolean
    version_id?: string
}

/**
 * @description 查询原始表/业务表字段列表Model
 * @param entries  字段列表
 * @param total_count number 分页查询总记录条数
 * @param standard_fields_count number 标准字段数
 */
export interface IFormQueryFieldsListModel {
    entries: any[]
    total_count: number
    standard_fields_count: number
    department_id: string
}

/**
 * @description 创建标准任务清单
 * @param field_id  string 业务表字段id
 * @param form_id string  业务表单id
 * @param field_description string  字段描述
 * @param standard_reference_document string 参考标准文件
 * @param standard_task_id string 任务中心标准化id
 * @param main_business_id string 业务模型id
 */
export interface ICreateStandardTaskList {
    fields: Array<{
        field_id: string
        field_name: string | undefined
        field_description?: string
        standard_reference_document?: string
    }>
    form_id: string | undefined
    standard_task_id?: string
    main_business_id?: string
}
/**
 * @description 创建标准创建任务
 * @param create_by_id  string 标准创建任务创建人ID
 * @param create_by_name string 标准创建任务创建人名称
 * @param main_business_id string 业务模型id
 * @param standard_create_task_id string (任务中心视角)任务中心标准创建任务任务ID
 * @param standard_task_id string (任务中心视角)任务中心标准化任务ID
 * @returns
 */
export interface ICreateStandardTaskAndList {
    create_by_id?: string
    create_by_name?: string
    main_business_id?: string | number
    standard_create_task_id?: string
    standard_task_id?: string
}

export interface RecommendData {
    // 数据范围，枚举  Enum: "全市" "市直" "区县"
    data_range?: string

    // 描述
    description?: string

    // 制定标准 [ 1 .. 128 ] characters
    guideline?: string

    // 表单id
    id: string

    // 中文名
    name: string

    // 资源标签 <= 5 items unique
    resource_tag?: Array<string>

    // 来源系统 <= 99 items unique
    source_system?: Array<string>

    // 更新周期，枚举值Enum: "不定期" "实时" "每日" "每周" "每月" "每季度" "每半年" "每年" "其他"

    update_cycle?: string

    // 字段数组
    fields?: Array<FormFieldAttribute>

    // 表类型，枚举："业务表" "业务标准表"
    table_kind?: string

    // 搜索关键字
    keyword?: string

    department_id?: string
}

export interface FormFieldAttribute {
    // 码表
    code_table?: string

    //  数据精度 0-30
    data_accuracy?: number

    // 数据长度 数字型 0-65 字符型range 0-65535
    data_length?: number

    // 数据类型
    data_type: string

    // 编码规则
    encoding_rule?: string

    // 标准分类 Enum: "团体标准" "企业标准" "行业标准" "地方标准" "国家标准" "国际标准" "其他标准"
    formulate_basis: string

    // 字段id
    id: string

    // 字段名
    name: string

    // 字段英文名
    name_en: string

    // 值域
    value_range?: string

    // 涉密属性，枚举：非涉密；涉密 Enum: "not_confidential" "confidential"
    confidential_attribute: string

    // 字段关系
    field_relationship?: string

    // 是否本业务产生 enum 0|1
    is_current_business_generation: number

    // 是否增量字段 enum 0|1
    is_incremental_field: number

    // 是否主键：0否，1是  enum 0|1
    is_primary_key: number

    // 是否必需 enum 0|1
    is_required: number

    // 开放属性，枚举：不向公众开放；向公众开放 Enum: "not_open" "open"
    open_attribute: string

    // 引用的源表字段id，为空表示没引用
    ref_id?: number

    // 敏感属性，枚举：不敏感；敏感 Enum: "not_sensitive" "sensitive"
    sensitive_attribute: string

    // 共享属性，枚举：不予共享；无条件共享；有条件共享 Enum: "not_share" "share_no_conditions" "share_with_conditions"
    shared_attribute: string

    // 标准ID
    standard_id: string

    // 标准化状态：""，"normal"，"modified"，"deleted" Enum: "normal" "modified" "deleted"
    standard_status: string

    // 计量单位
    unit?: string

    // 是否草稿
    is_draft?: boolean
}

/**
 * 单个导入的业务表信息
 * @param id 业务表id
 * @param name 业务表名字
 * @param from_table_id 数据表id
 */
export interface IImportBussinessFormInfo {
    id: string
    name: string
    from_table_id: string
}

/**
 * 批量导入的业务表信息
 * @param success 成功的数据表名
 * @param fail 失败的数据表名
 */
export interface IImportBussinessFormsInfo {
    success: string[]
    fail: string[]
    success_ids?: string[]
}

/**
 * 数据表字段信息
 * @param name 字段名称
 * @param type 字段类型（带长度）
 * @param description 字段注释
 * @param rawType 字段类型（不带长度）
 */
export interface IDataFormField {
    name: string
    type: string
    description: string
    rawType: string
}

/**
 * 数据源信息
 * @param name 数据源名称
 * @param type 数据源类型
 * @param database_name 数据库名称
 * @param schema 数据库模式
 */
export interface IDataSourceInfo {
    database_name: string
    id: string
    name: string
    schema: string
    type: string
    [key: string]: any
}

// ---------------------------------------------------------Glossary------------------------------------------

/**
 * 新增术语表
 */
export interface IGlossary {
    name: string
    id?: string
    owners?: string[]
    type: string
    description?: string
}

export interface IGlossaryList {
    content_id?: string
    name: string
    type?: GlossaryType
}
export interface ICategoriesQuery {
    parent_id: string
    keyword?: string
    offset: number
    limit: number
}

/**
 * 移动
 * @param dest_parent_id 移动至当前术语表、指定类别下
 * @param id 需要移动的节点id
 * @param next_id 将类别移动到该next_id节点的前面，不传或传0表示移动该dest_parent_id的子节点尾部
 * @returns
 */
export interface IMove {
    dest_parent_id: string
    id: string
    next_id?: string
}

export interface ITermsRelation {
    target_id: string
    term_id: string
    type: string
}
export interface ILevelList {
    parent_id?: string
    type: string
    keyword?: string
    limit: number
    offset: number
    is_all: boolean
    sort?: string
    direction?: string
}

// ---------------------------------------------------------Indicator------------------------------------------
/**
 * @interface
 * @description 列表返回数据
 * @param {number} total_count 总数
 * @param {T} entries 数据
 */
export interface IQueryListRes<T> {
    total_count: number
    entries: T[]
    offset: number
    limit: number
}

interface IIndicatorConfigItem {
    id: number
    name: string
}
export interface IIndicatorConfig {
    open: IIndicatorConfigItem[]
    secret_related: IIndicatorConfigItem[]
    sensitive: IIndicatorConfigItem[]
    share: IIndicatorConfigItem[]
    operation_logic: string[]
}

export interface IDisplayProperty {
    property: string
    explain: string
}
export interface IProperty {
    key_cn: string
    key_en: string
    operation_scope?: string
    operation_logic: string[]
}

export interface IRuleDetail {
    source_table_cn: string
    source_table_en?: string
    properties: IProperty[]
}

export interface IRule {
    rule_detail: IRuleDetail[]
    rule_explain: string
    display_properties: IDisplayProperty[]
}
export interface ICreateIndicator {
    name: string
    desc: string
    rule: IRule
    check_rule?: string
    demo?: string
    demo_desc?: string
    tag?: string
    share: number
    open: number
    secret_related: number
    sensitive: number
}

/**
 * @interface
 * @description 查询指标参数
 * @param {string} name 指标名称，模糊匹配
 * @param {string} sort 排序类型
 * @param {number} offset 页码
 * @param {number} limit 条数
 * @param {string} SortDirection 排序方式
 */
export interface IQueryIndicators {
    offset?: number
    limit?: number
    direction?: SortDirection
    sort?: string
    name?: string
    description?: string
}

export interface IIndicatorsInfo {
    id: string
    name: string
    desc: string
    tag: string
    created_by_uid: string
    creator_name: string
    created_at: string
    updated_by_uid: string
    updater_name: string
    updated_at: string
    display: string[]
}

export interface IBusinessTableField {
    id: number
    name: string
    name_en: string
}
export interface IBusinessTable {
    id: number
    name: string
    fields: IBusinessTableField[]
}
export interface IBusinessTables {
    entries: IBusinessTable[]
    total_count: number
}

// ---------------------------------------------modal----------------------------------------------------

export interface IQueryModals {
    offset?: number
    limit?: number
    direction?: SortDirection
    keyword?: string
    sort?: string
    project_id?: string
}

export interface IModalData {
    id?: string
    name: string
    created_by: string
    created_at?: number
    updated_by?: string
    updated_at?: number
    description?: string
    business_domain_id: string
    business_domain_name: string
    subject_domain_id: string
    subject_domain_name: string
    main_business_id: string
    business_model_id: string
}

interface IDynamicFormRule {
    length_info?: string
    max_length: number
    regexp: string
    regexp_info: string
}

export interface IDynamicFormData {
    index: number
    label: string
    name: string
    type: string
    required?: boolean
    rule: IDynamicFormRule
    disabled?: boolean
    same_as?: string
    placeholder?: string
    is_multiple_values?: boolean
    max_values?: number
    separator?: string
    value?: any
}

export interface IModalDetailsAllInfo {
    mid: number
    updated_by: string
    updated_at: number
    created_by: string
    created_at: number
    base: IDynamicFormData[]
    details: IDynamicFormData[]
}

// ---------------------------------------------report----------------------------------------------------

export enum ConsistentStatus {
    Consistent = 'consistent',
    Inconsistent = 'inconsistent',
}

export interface IUpdateConsistentStatus {
    object_id: string
    status: ConsistentStatus
}

export interface IAttributes {
    data_accuracy: number
    data_length: number
    data_type: string
    formulate_basis: number
    name: string
    name_en: string
    value_range: string
}

export interface IInconsistent {
    attributes: IAttributes
    fields_info: string[]
    standard_id: string
}

export interface IFieldsCheckResult {
    field_id: string
    standard_id: string
    attributes: IAttributes
    inconsistent: IInconsistent[]
    fields_info: string[]
    ref_id: string
}
export interface IForm {
    business_form_id: string
    business_form_name: string
    fields_check_result: IFieldsCheckResult[]
}

export interface IReportDetails {
    forms: IForm[]
    updated_at: string
}

export interface IMainBusinesses {
    business_form_id: string
    business_form_name: string
    main_business_id: string
    main_business_name: string
}

// ---------------------------------------------role----------------------------------------------------

/**
 * @interface
 * @description id 集合
 * @param {number} domainId 业务域Id
 * @param {number} roleId 角色名Id
 */
export interface IIds {
    domainId?: number
    roleId?: number
}
/**
 * @interface
 * @description 创建角色参数
 * @param {number} parent_id 父角色ID，为0时表示新建父角色，>0子角色。
 * @param {string} name 业务角色名
 * @param {string} description 业务角色描述
 */
export interface ICreateRoleParams {
    parent_id: number
    name: string
    description: string
}

/**
 * @interface
 * @description 查询子角色参数
 * @param {number} parent_id 父角色ID，为0时表示新建父角色，>0子角色。
 * @param {string} name 业务角色名
 * @param {string} description 业务角色描述
 * @param {string} sort 排序类型
 * @param {number} offset 页码
 * @param {number} limit 条数
 * @param {string} SortDirection 排序方式
 * @param {string} keyword 搜索
 */
export interface IQueryRoles {
    offset?: number
    limit?: number
    direction?: SortDirection
    sort?: string
    parent_id: number
    name?: string
    description?: string
    keyword?: string
}

/**
 * @interface
 * @description 父角色返回数据
 * @param {string} name 角色名称
 * @param {number} id 角色Id
 * @param {string} description 角色描述
 * @param {string} updated_by 更新者
 * @param {string} updated_at 更新时间
 * @param {string} created_by 创建者
 * @param {string} created_at 创建时间
 * @param {string} parent_id 角色id
 * @param {IRoleInfoData} children 子级
 */
export interface IRoleInfoData {
    name?: string
    id?: number
    description?: string
    updated_by?: string
    updated_at?: string
    created_by?: string
    created_at?: string
    parent_id?: number
    children?: IRoleInfoData[]
}

/**
 * @interface
 * @description 父角色返回数据
 * @param {number} total_count 总数
 * @param {string} IRoleInfoData 数据
 */
export interface IQueryRolesRes {
    total_count: number
    entries: IRoleInfoData[]
}

/**
 * @interface
 * @description 校验角色唯一性
 * @param {number} domainId 业务域Id
 * @param {string} name 角色名称
 * @param {number} parent_id 父级Id
 * @param {number} authority_id 角色Id
 */
export interface ICheckRoleParams {
    domainId: number
    name: string
    parent_id?: number
    authority_id?: number
}

// --------------------------------------------standard-----------------------------------------------
/**
 * @interface
 * @param {number} type 表单类型，枚举：1：原始表；2：业务表；3：融合表
 */
export interface IQueryForms {
    type: number
    offset?: number
    limit?: number
    direction?: SortDirection
    keyword?: string
    sort?: string
    rate?: number
    is_draft?: boolean
    version_id?: string
}

interface IDataRange {
    display: string
    value: string
}
export interface IFieldStandardRate {
    fields_count: number
    standard_fields_count: number
}
export interface IFormData {
    create_at: string
    create_by: string
    data_range: IDataRange
    description: string
    field_count: number
    flowcharts: string
    id: string
    name: string
    update_at: string
    update_by: string
    update_cycle: IDataRange
    field_standard_rate: IFieldStandardRate
}
interface IQueryFormRes {
    entries: IFormData[]
    total_count: number
}

/**
 * @interface
 * @param {number} is_standard 是否标准
 */
export interface IQueryStandards {
    offset?: number
    limit?: number
    direction?: SortDirection
    is_standard?: number
    keyword?: string
    sort?: string
}
/**
 * @interface
 * @param {string} name 字段名称
 * @param {string} name_en 字段英文名
 * @param {number} is_current_business_generation 是否本业务产生
 * @param {string} data_type 数据类型
 * @param {string} data_length 数据长度
 * @param {string} is_primary_key 是否主键
 * @param {string} is_incremental_field 是否增量字段
 * @param {string} is_required 是否必填
 * @param {string} is_standard 是否标准
 * @param {string} created_by 创建人
 * @param {number} created_at 创建时间
 * @param {string} updated_by 最终修改人
 * @param {number} updated_at 最终修改时间
 */
export interface IStandardData {
    name: string
    name_en: string
    is_current_business_generation: number
    data_type: string
    data_length: number
    is_primary_key: number
    is_incremental_field: number
    is_required: number
    is_standard: number
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
    id: number
}

export interface IQueryStandardsRes {
    entries: IStandardData[]
    total_count: number
}

interface IStandardBasic {
    name: string
    name_en: string
    created_by: string
    created_at: number
    updated_by: string
    updated_at: number
}
interface IBusinessAttribute {
    is_current_business_generation: number
    standard_theme: string
    primary_class: string
    secondary_class: string
    formulate_basis: string
    business_definition: string
    standard_source_specification_document: string
}
interface ITechnicalAttribute {
    data_type: string
    data_length: number
    is_primary_key: number
    is_incremental_field: number
    is_required: number
    is_standard: number
    code_table: string
    value_range: string
    encoding_rule: string
    field_relationship: string
    data_accuracy: number
    unit: string
}
interface IAdditionalAttributes {
    sample: string
    explanation: string
    sensitive_attribute: number
    confidential_attribute: number
    shared_attribute: number
    open_attribute: number
}

export interface IStandardDetail {
    base_info: IStandardBasic
    business_attributes: IBusinessAttribute
    technical_attributes: ITechnicalAttribute
    additional_attributes: IAdditionalAttributes
}

export interface ICreateStandard
    extends IStandardBasic,
        IBusinessAttribute,
        ITechnicalAttribute,
        IAdditionalAttributes {
    task_id?: string
}

export interface IEditStandardsParams {
    task_id?: string
    standards: any[]
}

export interface IStandardEnumData {
    type: string
    value: number
}

/**
 * @interface IStandardEnum
 * @param {IStandardEnumData} confidential_attribute 涉密属性
 * @param {IStandardEnumData} data_type 数据类型
 * @param {IStandardEnumData} formulate_basis 标准分类（标准级别）：0：国家标准；1：行业标准；2：业务需求
 * @param {IStandardEnumData} open_attribute 开放属性
 * @param {IStandardEnumData} sensitive_attribute 敏感属性
 * @param {IStandardEnumData} shared_attribute 共享属性
 */
export interface IStandardEnum {
    confidential_attribute: IStandardEnumData[]
    data_type: IStandardEnumData[]
    formulate_basis: IStandardEnumData[]
    open_attribute: IStandardEnumData[]
    sensitive_attribute: IStandardEnumData[]
    shared_attribute: IStandardEnumData[]
}

/**
 * keyword：搜索的关键词。
 * parent_id：父节点id。即要展开的节点id。不传或传""表示第一层。
 * getall：业务域能否继续展开。
 * status：传all表示获取所有状态的节点，不传默认表示获取已发布状态的节点。
 */
export interface IBusinessDomainTreeParams {
    keyword: string
    parent_id: string
    getall: boolean
    business_system?: string
    status?: string
}

export interface IBusinessDomainProcessTreeParams {
    keyword: string
    parent_id: string
    offset: number
    limit: number
    model_related: number
    info_related: number
    data_model_related: number
    // status：传all表示获取所有状态的节点，不传默认表示获取已发布状态的节点。
    status?: string
    task_id?: string
}

export interface IBusinessDomainProcessListParams {
    keyword: string
    offset: number
    limit: number
    getall: boolean
    department_id: string
    model_related: number
    info_related: number
    data_model_related?: number
    task_id?: string
}

export interface IBusinessDomainItem {
    id: string
    name: string
    description: string
    type: BusinessDomainLevelTypes
    expand: boolean
    path: string
    path_id: string
    created_at: number
    created_by: string
    updated_by: string
    updated_at: number
    model_cnt: number
    model_id: string
    // 业务模型是否被锁
    model_locked?: boolean
    department_id: string
    department_name: string
    business_system: string[]
    business_system_name: string[]
    parent_id: string
    parent_name: string
    parent_type: BusinessDomainLevelTypes
    children?: IBusinessDomainItem[]
    // 审核状态
    audit_status: BusinessAuditStatus
    // 是否有草稿
    has_draft: boolean
    // 审批意见
    reject_reason: string
    // 数据模型是否被锁
    data_model_locked?: boolean
    disabled?: boolean
    data_model_id: string
    // 发布状态
    published_status?: string
    // 是否业务事项
    business_matter?: number
}

export interface IInfoSysProcessListParams {
    keyword?: string
    offset?: number
    limit?: number
    direction?: string
    // 	排序类型 created_at：创建时间，默认排序类型 finish_date：期望完成时间
    sort?: string
    getall?: boolean
    // 信息系统id
    business_system_id?: string
    model_related?: number
    info_related?: number
    task_id?: string
}

export interface IBusinessDomainTreeNodeParams {
    parent_id: string
    type: BusinessDomainLevelTypes
    description: string
    department_id: string
    business_system_id: string[]
}

export interface ICheckBusinessDomainTreeNodeParams {
    parent_id?: string
    name: string
    node_id?: string
}

export interface IProcessNodeCount {
    form_count: number
    flowchart_count: number
    standardization_rate: number
    indicator_model_count: number
    indicator_count: number
    model_id: string
    locked?: boolean
}

export interface IBusinessIndicatorSourceTable {
    table_id: string
    source_table_name: string
    rel_type: string
    source_field: Array<{
        field_id: string
        source_field_name?: string
        source_rule: string
        source_rule_desc: string
        check_rule: string
        operation_logic: string
    }>
}

/**
 * @interface IBusinessIndicator  业务指标
 * @param {string} id 指标ID
 * @param {string} name 指标名称
 * @param {string} code 指标编号
 * @param {string} description 描述
 * @param {string} calculation_formula 计算公式
 * @param {string} unit 指标单位
 * @param {string} statistics_cycle 统计周期
 * @param {string} statistical_caliber 统计口径
 * @param {number} created_at 创建时间
 * @param {string} creator_uid 创建人ID
 * @param {string} creator_name 创建人
 * @param {number} updated_at 更新时间
 * @param {string} updater_uid 更新人ID
 * @param {string} updater_name 更新人
 */

export interface IBusinessIndicator {
    id: string
    name: string
    code: string
    description: string
    calculation_formula: string
    unit: string
    statistics_cycle: string
    statistical_caliber: string
    created_at: number
    creator_uid: string
    creator_name: string
    updated_at: number
    updater_uid: string
    updater_name: string
    mid?: string
    source_table?: IBusinessIndicatorSourceTable[]
}

export interface IUngroupForm {
    id: string
    name: string
}

export enum DiagnosisPhase {
    Running = 'Running',
    Done = 'Done',
    Failed = 'Failed',
    Canceled = 'Canceled',
}
export interface IDiagnosisType {
    completeness: boolean
    maturity: boolean
    businessFormComplexity: boolean
    sharing: boolean
    consistency: boolean
}
export interface IBusinessDiagnosisItem {
    id: string
    name: string
    processes: string[]
    dimensions?: any
    phase: string
    report?: any
    creator?: string
    creatTime?: string
    message?: string
    process_has_draft?: any[]
}
export interface IBusinessDiagnosis {
    entries: IBusinessDiagnosisItem[]
    total_count: number
}
export interface ICreateBusinessDiagnosis {
    dimensions: IDiagnosisType
    processes: string[]
}

/**
 * 库表对应的业务表信息
 */
export interface ICatalogFrontInfo {
    business_form_id: string
    // 业务表描述
    description: string
    // 更新频率 1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
    update_cycle: number
    // 开放条件
    open_condition: string
    // 开放类型
    open_type: number
    // 共享条件
    shared_condition: string
    // 共享方式 1 共享平台方式 2邮件方式 3 介质方式
    shared_mode: number
    // 共享属性 1无条件共享 2有条件共享 3不予共享
    shared_type: number
    // 信息系统
    source_system: { id: string; name: string }[]
    columns: {
        business_form_field_id: string
        // 是否涉密（1是；0否）
        classified_flag: number
        column_name: string
        data_format: number
        data_length: number
        description: string
        name_cn: string
        null_flag: number
        primary_flag: number
        ranges: string
        // 是否敏感属性（1是；0否）
        sensitive_flag: number
        // 开放条件
        open_condition: string
        // 开放类型
        open_type: number
        // 共享条件
        shared_condition: string
        // 共享方式 1 共享平台方式 2邮件方式 3 介质方式
        shared_mode: number
        // 共享属性 1无条件共享 2有条件共享 3不予共享
        shared_type: number
        // 标签名称
        label_name: string
    }[]
    infos: any[]
    data_kind: number
}

// 业务认知审核状态
export enum BusinessAuditStatus {
    // 无审核时候状态
    None = '',
    // 未发布
    Unpublished = 'unpublished',
    // 发布审核中
    PubAuditing = 'pub-auditing',
    // 已发布
    Published = 'published',
    // 发布审核未通过
    PubReject = 'pub-reject',
    // 变更审核中
    ChangeAuditing = 'change-auditing',
    // 变更审核未通过
    ChangeReject = 'change-reject',
    // 删除审核中
    DeleteAuditing = 'delete-auditing',
    // 删除审核未通过
    DeleteReject = 'delete-reject',
    // 拒绝
    AuditReject = 'audit-reject',
}

// 发布状态
export enum PublishedStatus {
    // 已经发布
    Published = 'published',
    // 未发布
    Unpublished = 'unpublished',
}

// 模型版本信息
export interface IModalVersion {
    // 版本 id
    version_id: string
    // 版本名称
    version_name: string
}

// 业务认知审核类型
export enum BusinessAuditType {
    // 业务领域 发布
    BusinessAreaPublish = 'af-bg-publish-business-area',
    // 业务领域 删除
    BusinessAreaDelete = 'af-bg-delete-business-area',
    // 主业务 发布
    MainBusinessPublish = 'af-bg-publish-main-business',
    // 业务诊断 发布
    BusinessDiagnosisPublish = 'af-bg-publish-business-diagnosis',
    // 业务模型 发布
    BusinessModelPublish = 'af-bg-publish-business-model',
    // 数据模型 发布
    DataModelPublish = 'af-bg-publish-data-model',
}

// 业务认知审核 请求
export interface IBusinessAuditReq {
    // 目标
    target?: string
    // 审核类型
    audit_type: BusinessAuditType
    // 偏移量
    offset?: number
    // 限制
    limit?: number
}

// 业务认知审核 列表 条目
export interface IAuditEntry {
    // 审核 id
    id: string
    // 业务领域名称
    name: string
    // 审核类型
    audit_type: BusinessAuditType
    // 申请人
    apply_user_name: string
    // 申请时间
    apply_time: string
    // 流程实例 id
    proc_inst_id: string
    // 任务 id
    task_id: string
}

// 业务认知审核 列表
export interface IBusinessAuditRes {
    // 列表
    entries: IAuditEntry[]
    // 总条数
    total_count: number
}
/**
 * 模型类型
 */
export enum BizModelType {
    // 业务模型
    BUSINESS = 'business',

    // 数据工程
    DATA = 'data',
}

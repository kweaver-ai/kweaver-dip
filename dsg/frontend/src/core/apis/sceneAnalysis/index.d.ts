import { StringArraySupportOption } from 'prettier'

/**
 * 场景
 * @id 场景ID
 * @name 场景名称
 * @desc 场景描述
 * @canvas 场景画布信息
 * @config 画布节点配置
 * @updated_at 更新时间
 * @updated_by 更新人
 */
export interface ISceneItem {
    id: string
    name: string
    desc: string
    canvas?: string
    config?: string
    updated_at: number
    updated_by: string
    catalog_id?: string
    catalog_name?: string
}

/**
 * 字段信息
 * @alias 字段别名
 * @id 字段ID
 * @name 字段所属前序节点输出字段别名
 * @name_en 字段英文名
 * @original_name 字段原始技术名称
 * @data_type 字段类型
 * @dict_id 码表id
 * @dict_name 码表中文名
 * @standard_code 标准code
 * @standard_name 标准中文名
 * @primary_key 是否主键
 * @source_node_id 字段所属前序节点ID
 * @sourceId 字段来源节点id-源头算子生成-自定义
 * @originName 字段原名-自定义
 * @checked 选中-自定义
 * @nodeId 所属节点id-关联、合并算子使用-自定义
 * @editError 编辑错误-自定义
 * @beEditing 编辑中-自定义
 * @outId 输出字段id-输出库表使用-自定义
 * @attrId 逻辑实体属性id-输出库表使用-自定义
 * @type 输出type-输出库表使用-自定义
 * @canChanged 是否可修改-输出库表使用-自定义
 * @formulaId 生成新字段的算子ID-自定义
 */
export interface IFormulaFields {
    alias: string
    id?: string
    name?: string
    name_en?: string
    original_name?: string
    data_type?: string
    dict_id?: string
    dict_name?: string
    standard_code?: string
    standard_name?: string
    primary_key?: boolean
    source_node_id?: string
    sourceId?: string
    originName?: string
    checked?: boolean
    nodeId?: string
    editError?: string | string[]
    beEditing?: boolean
    outId?: string
    attrId?: string
    type?: string
    canChanged?: boolean
    isPolicy?: boolean
    formulaId?: string
}

export interface IFormulaConfig {
    // 算子,配置字段列表 - 自定义
    config_fields?: IFormulaFields[]
    // 业务表算子,业务表ID
    form_id?: string
    // 关联算子,关联字段
    relation_field?: IFormulaFields[]
    // 关联算子,关联模式,left|right|inner|full out
    relation_type?: string
    // 指标算子,分组列表
    group?: {
        field: IFormulaFields
        // 格式化 "%Y-%m-%d"｜"%x-%v"｜"%Y-%m"｜"%Y"
        format: string
    }[]
    // 指标算子,度量对象
    measure?: {
        // 聚合函数
        aggregate: string
        field: IFormulaFields
    }
    // 指标算子,指标名称
    name?: string
    // 过滤算子,过滤对象列表
    where?: {
        // 限定对象
        member: {
            field: IFormulaFields
            // 限定条件
            operator: string
            // 限定比较值
            value?: string
        }[]
        // 限定关系
        relation: string
    }[]
    // 过滤算子组间限定关系
    where_relation?: string
    // 合并算子，是否去除重复行
    merge?: {
        // 是否去除重复行，默认不去重
        deduplicate: boolean
        // 前序节点信息
        nodes: {
            fields: IFormulaFields[]
            // 字段前序节点ID
            source_node_id: string
        }[]
    }
    // 输出库表算子，库表字段
    output_view?: IFormulaFields[]
    // 自定义数据
    other?: any
    // 配置类型
    sub_type?: string
    date_where?: {
        // 限定对象
        member: {
            field: IFormulaFields
            // 限定条件
            operator: string
            // 限定比较值
            value?: string
        }[]
        // 限定关系
        relation: string
    }[]
    // 过滤算子组间限定关系
    date_where_relation?: string
    sqlTableArr?: []
    sqlFieldArr?: []
    dataViewLists?: []
    sqlTextArr?: []
    sql?: any
    analysis_dimension_fields?: any
    view_info?: any
    sql_origin?: string
}

/**
 * 算子信息
 * @config 算子配置
 * @type 算子类型
 */
export interface IFormula {
    id: string
    config?: IFormulaConfig
    type: string
    output_fields?: IFormulaFields[]
    errorMsg?: string
    dataViewId?: string
    objId?: string
}

export interface INodeItem {
    id: string
    name: string
    formula_type: string
    outputFields: { id: string; name: string; type: string }[]
}

/**
 * 场景分析组件信息
 */
export interface ISceneAnalysisComponent {
    // 聚合字段id
    aggregate_field_id?: string
    // 聚合字段名称
    aggregate_field_name?: string
    // 聚合函数
    aggregate_function?: string
    // 图表类型
    chart_type?: string
    // 分组依据字段id
    group_id?: string
    // 分组依据2字段id
    group_id_2?: string
    // 分组依据字段名称
    group_name?: string
    // 分组依据字段2名称
    group_name_2?: string
    // 场景分析组件ID
    id?: string
    // 场景分析组件名称
    name?: string
    // 场景节点id
    node_id?: string
    // 场景节点名称
    node_name?: string
    // 场景id
    scene_id?: string
    // 场景名称
    scene_name?: string
    // 数据目录id
    data_catalog_id?: string
    // 数据目录名称
    data_catalog_name?: string
    // 排序方式
    sort?: string
    // 时间维度
    time_dimension?: string
    // 图标样式
    image?: string
    // 图标颜色
    color?: string
    // 单位
    unit?: string
}

/**
 * 场景分析组件图表结果
 */
export interface ISceneAnalysisComponentResult {
    name: string
    chart_type: string
    image: string
    color: string
    columns: any[]
    count: number
    data: any[]
    err: {
        code: string
        description: string
        detail: string
        solution: string
    }
}

/** 用数问答详情 */
export interface IProductQaHistoryDetail {
    // 问答单元id
    qa_id: string
    // 问答历史记录标题，一般是第一个问题
    query: string
    // 问答单元内容
    answer: any
    // 是否点赞
    like: string
    // 问答时间
    qa_time: string
}

/**
 * 场景分析分类信息（包含子节点）
 */
export interface ICatalogItem {
    // 分类id
    id: string
    // 分类名称
    catalog_name: string
    // 父分类id
    parent_id: string
    // 子节点（可选）
    children?: ICatalogItem[]
}

/**
 * 场景分析业务关联认证响应
 */
export interface ISceneAnalysisAssocAuth {
    // 创建时间
    created_at?: string
    // 增长率
    growth_rate?: number
    // ID
    id?: number
    // 模型总数
    model_total_count?: number
    // 更新时间
    updated_at?: string
}

/**
 * 部门模型调用统计查询参数
 */
export interface IDeptModelCallQuery {
    // 开始日期 (YYYY-MM-DD)，默认7天前
    start_date?: string
    // 结束日期 (YYYY-MM-DD)，默认今天
    end_date?: string
    // 时间维度: day/month/year
    time_dimension?: 'day' | 'month' | 'year'
}

/**
 * 部门模型调用统计响应
 */
export interface IDeptModelCallItem {
    // 创建时间
    created_at?: string
    // 部门
    dept?: string
    // ID
    id?: number
    // 时间
    time?: string
    // 值
    value?: number
}

/**
 * 部门使用统计Top10响应
 */
export interface IDeptUsageTop10Item {
    // 创建时间
    created_at?: string
    // 部门名称
    dept?: string
    // ID
    id?: number
    // 元数据模型使用次数
    metaentries_model?: number
    // 统计日期
    stat_date?: string
    // 主题模型使用次数
    theme_model?: number
    // 更新时间
    updated_at?: string
}

/**
 * 目录使用统计响应
 */
export interface IDirectoryUsageStatsItem {
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 元数据模型使用次数
    metaentries_model?: number
    // 主题模型使用次数
    theme_model?: number
    // 时间
    time?: string
    // 更新时间
    updated_at?: string
}

/**
 * 模型增长统计响应
 */
export interface IModelGrowthStatsItem {
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 统计月份：YYYY-MM
    time?: string
    // 增长类型：总量、增量
    type?: string
    // 模型数量
    value?: number
}

/**
 * 查询认证统计响应
 */
export interface IQueryAuthStats {
    // 已授权目录总数
    authorized_dir_count?: number
    // 覆盖部门数
    covered_dept_count?: number
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 更新时间
    updated_at?: string
}

/**
 * 查询调用趋势统计响应
 */
export interface IQueryCallTrendItem {
    // 平均时长
    avg_duration?: number
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 时间
    time?: string
    // 类型
    type?: string
}

/**
 * 部门目录统计响应
 */
export interface IDeptDirectoryItem {
    // 目录数量
    count?: number
    // 创建时间
    created_at?: string
    // 部门名称
    dept?: string
    // ID
    id?: number
    // 更新时间
    updated_at?: string
}

/**
 * 目录使用Top10统计响应
 */
export interface IDirectoryUsageTop10Item {
    // 使用次数
    count?: number
    // 部门
    dept?: string
    // 名称
    name?: string
    // 排名
    rank?: number
}

/**
 * 部门使用统计响应
 */
export interface IDeptUsageItem {
    // 创建时间
    created_at?: string
    // 部门名称
    dept?: string
    // ID
    id?: number
    // 统计日期
    stat_date?: string
}

/**
 * 共享目录统计响应
 */
export interface ISharedDirectoryItem {
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 共享类型：无条件共享、有条件共享、不予共享
    type?: string
    // 更新时间
    updated_at?: string
}

/**
 * 主题目录统计响应
 */
export interface IThemeDirectoryItem {
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 主题类型：人、地、事、物、组织、其他
    type?: string
    // 更新时间
    updated_at?: string
}

/**
 * 验证认证统计响应
 */
export interface IVerifyAuthStats {
    // 已授权目录总数
    authorized_dir_count?: number
    // 覆盖部门数
    covered_dept_count?: number
    // 创建时间
    created_at?: string
    // 数据集数量
    entriesset_count?: number
    // ID
    id?: number
    // 主题模型目录
    theme_model_count?: number
    // 更新时间
    updated_at?: string
}

/**
 * 验证部门使用Top10统计响应
 */
export interface IVerifyDeptUsageTop10Item {
    // 创建时间
    created_at?: string
    // 部门名称
    dept?: string
    // ID
    id?: number
    // 统计日期
    stat_date?: string
    // 更新时间
    updated_at?: string
    // 使用次数
    value?: number
}

/**
 * 验证目录趋势统计响应
 */
export interface IVerifyDirectoryTrendItem {
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 时间
    time?: string
    // 类型
    type?: string
    // 值
    value?: number
}

/**
 * 验证目录使用Top10统计响应
 */
export interface IVerifyDirectoryUsageTop10Item {
    // 使用次数
    count?: number
    // 部门
    dept?: string
    // 名称
    name?: string
    // 排名
    rank?: number
}

/**
 * 验证资源目录统计响应
 */
export interface IVerifyResourceDirectoryItem {
    // 创建时间
    created_at?: string
    // ID
    id?: number
    // 资源类型：基础库、主题库、专题库
    type?: string
    // 更新时间
    updated_at?: string
}

/**
 * 验证任务查询参数
 */
export interface IVerifyTasksQuery {
    // 当前页码，默认1，大于等于1
    offset?: number
    // 每页条数，默认10，大于等于1
    limit?: number
}

/**
 * 验证任务统计项
 */
export interface IVerifyTaskItem {
    // 创建时间
    created_at?: string
    // 部门名称
    dept?: string
    // 调用耗时
    duration?: string
    // 执行次数
    execs?: number
    // 失败次数
    fail?: number
    // ID
    id?: number
    // 成功率
    rate?: number
    // 统计日期
    stat_date?: string
    // 成功次数
    success?: number
    // 校核任务数
    tasks?: number
    // 更新时间
    updated_at?: string
    // 调用数据量
    volume?: string
}

/**
 * 验证任务统计响应
 */
export interface IVerifyTasksResponse {
    // 任务列表
    entries?: IVerifyTaskItem[]
    // 每页条数
    limit?: number
    // 当前页码
    offset?: number
    // 总条数
    total_count?: number
}

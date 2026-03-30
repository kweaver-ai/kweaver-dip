import { off } from 'process'
import { SortDirection } from '../common'
import { IGetListParams } from '../common.d'

/**
 * @interface IQueryDimModel
 * @description 查询维度模型列表
 * @param {string} SortDirection 排序方式
 * @param {string} keyword 搜索
 * @param {number} limit 条数
 * @param {number} offset 页码
 * @param {string} sort 排序类型
 */
export interface IQueryDimModel {
    direction?: SortDirection
    keyword?: string
    limit?: number
    offset?: number
    sort?: string
}

/**
 * @interface IDimModelItem
 * @description 维度模型列表项
 * @param {string} created_at 创建时间戳
 * @param {string} creator_name 创建用户名称
 * @param {string} creator_uid 创建用户ID
 * @param {string} description 描述
 * @param {string} id 主键
 * @param {string} name 名称
 * @param {number} refer_count 维度模型被原子指标引用的数量
 * @param {string} updated_at 更新时间戳
 * @param {string} updater_name 更新用户名称
 * @param {string} updater_uid 更新用户ID
 */
export interface IDimModelItem {
    created_at?: number
    creator_name?: string
    creator_uid?: string
    description: string
    id: string
    name: string
    dim_module?: number
    refer_count?: number
    updated_at?: string
    updater_name?: string
    updater_uid?: string
}

/**
 * @interface IDimModelParams
 * @description 创建/更新维度模型
 * @param {string} description 描述
 * @param {string} name 名称
 */
export interface IDimModelParams {
    description: string
    name: string
}

export enum ShowType {
    Canvas = 1, // 画布字段
    ConfData = 2, // 配置数据
    All = 3, // 画布字段和配置数据
}

/**
 * @interface IQueryDimModelDetail
 * @description 查询维度模型详情
 * @param {ShowType} show_type 返回详情的字段
 */
export interface IQueryDimModelDetail {
    show_type: ShowType
}

/**
 * 维度模型字段配置 （关联维度表）
 */
interface DimFieldConfig {
    dim_table_cn_name: string
    dim_table_en_name: string
    dim_table_full_path: string
    dim_table_id: string
    dim_table_join_field_cn_name: string
    dim_table_join_field_en_name: string
    dim_table_join_field_id: string
    dim_table_join_field_data_format: string
    fact_table_join_field_cn_name: string
    fact_table_join_field_en_name: string
    fact_table_join_field_id: string
    fact_table_join_field_data_format: string
}

/**
 * 维度模型配置  (关联事实表)
 */
interface DimModelConfig {
    dim_field_config?: DimFieldConfig[]
    fact_table_cn_name: string
    fact_table_en_name: string
    fact_table_full_path: string
    fact_table_id: string
}

/**
 * @interface IDimModelDetailResult
 * @description 维度模型详情返回结果
 * @param {string} name 名称
 * @param {string} description 描述
 * @param {string} canvas 画布内容
 * @param {DimModelConfig} dim_model_config 关联配置
 */
export interface IDimModelDetailResult {
    name: string
    description: string
    dim_module?: number
    canvas?: string
    dim_model_config?: DimModelConfig
}

/**
 * @interface IUpdateDimModelConfig
 * @description 维度模型关联配置更新
 * @param {string} canvas 画布内容
 * @param {DimModelConfig} dim_model_config 关联配置
 */
export interface IUpdateDimModelConfig {
    canvas?: string
    dim_model_config?: DimModelConfig
}

// 获取列表参数
export interface IindicatorListParams extends IGetListParams {
    dimensional_model_id?: string // 维度模型id
    domain_grouping_id?: string // 主题域分组id
    domain_id?: string // 主题域id
    indicator_type?: string // 指标类型，atomic原子指标，derived衍生指标， composite复合指标
    is_owner?: boolean // 是否是当前用户拥有的
}

// 指标列表信息
export interface indicatorInfo {
    name: string // 指标名称
    description: string // 指标描述
    code: string // 指标编码
    domain_id: string // 主题域
    indicator_unit: string // 指标单位
    indicator_type: string // 指标类型，atomic原子指标，derived衍生指标， composite复合指标
    refer_count: number // 被引用数量
    updater_name: string // 更新人名称
    updater_uid: string // 更新人用户ID
    updated_at: string // 更新时间
    dimensional_model_id?: string // 关联维度模型id
    dimensional_model_name?: string // 关联维度模型name
    atomic_indicator_id?: string // 关联原子指标id
    atomic_indicator_name?: string // 关联原子指标name
    id: string // 唯一标识
}

// 原子指标参数

export interface AtomicIndictorParams {
    name: string // 指标名称
    description: string // 指标描述
    code: string // 指标编码
    domain_id: string // 主题域
    indicator_unit: string // 指标单位
    scene_analysis_id?: string // 场景分析id
    level: string // 指标等级 T1 | T2 | T3
    task_id?: string
}

// 衍生指标参数
export interface DerivedIndictorParams {
    name: string // 指标名称
    description: string // 指标描述
    code: string // 指标编码
    domain_id: string // 主题域
    indicator_unit: string // 指标单位
    scene_analysis_id?: string // 场景分析id
    level: string // 指标等级 T1 | T2 | T3
    task_id?: string
}

export type RestrictType = {
    member: Array<{
        field_id: Array<string> // 0:表ID, 1:字段ID
        operator: string // 过去/当前/从 开始时间 到 结束时间
        value: string
    }>
    relation: string
}

// 复合指标参数

export interface CompositeIndicatorParams {
    name: string // 指标名称
    description: string // 指标描述
    code: string // 指标编码
    domain_id: string // 主题域
    indicator_unit: string // 指标单位
    level: string // 指标等级 T1 | T2 | T3
    expression: string // 表达式
    task_id: string
}

// 指标详情
export interface IndictorDetail {
    actions?: string[] // 权限
    can_auth?: boolean // 是否具备授权权限
    id: string // 指标ID
    name: string // 指标名称
    description: string // 指标描述
    code: string // 指标编码
    indicator_unit: string // 指标单位
    level: string // 指标等级 T1 | T2 | T3
    where_info: any // 标记业务限定
    modifier_restrict_sql: string // 限定使用sql配置时，业务限定显示的sql

    // 原子|衍生指标
    scene_id?: string // 场景ID
    exec_sql?: string // 执行sql

    analysis_dimensions?: any[]
    date_mark?: any // 日期标识字段
    original_data_type?: string // 原始字段类型
    refer_view_id?: string // 引用库表ID
    refer_view_name?: string // 引用库表名称
    // 原子指标
    dimensional_model_id?: string // 维度模型id
    expression?: string // 表达式

    atomic_indicator_id?: string // 关联原子指标
    atomic_indicator_name?: string

    time_restrict?: Array<RestrictType> // 时间限定
    modifier_restrict?: Array<RestrictType> // 普通限定
    dependence_indicator_id?: Array<string>
    domain_id: string // 主题域
    refer_count: number // 被引用数量
    updater_name: string // 更新人名称
    updater_uid: string // 更新人用户ID
    updated_at: number // 更新时间
    creater_name: string // 创建人名称
    creater_uid: string // 创建人用户ID
    created_at: number // 创建时间
    indicator_type: string // 指标类型，atomic原子指标，derived衍生指标， composite复合指标
    fact_table_id?: string
    domain_name?: string
    business_indicator_name: string
    business_indicator_id: string
    owner_name: string // 数据owner名称
    owner_id: string // 数据owner
    management_department_id?: string // 职责部门ID
    management_department_name?: string // 职责部门名称
    analysis_dimensions: Array<AnalysisDimensionsData>
    modifier_restrict_relation?: string
    view_full_path?: string
    owners?: Array<{ owner_id: string; owner_name: string }> // 数据owner
    is_favored?: boolean // 是否收藏
    favor_id?: string // 收藏ID
}

export interface AnalysisDimensionsData {
    table_id: string // 表ID
    field_id: string // 字段ID
    business_name: string // 维度字段中文名称
    technical_name: string // 维度字段技术名称
    data_type: string
    original_data_type: string
    isPolicy?: boolean // 是否配置脱敏策略
}

// 查询逻指标参数
export interface IndicatorParamsType {
    offset: number
    limit: number
    // asc desc
    direction?: string
    // created_at updated_at
    sort?: string
    // 表、列的技术名称、业务名称筛选
    keyword?: StringConstructor
    // 组织架构 id
    management_department_id?: string
    // 主题 id
    subject_id?: string
    // 包含子主题域
    include_sub_subject?: boolean
    // 分类类型 原子指标和衍生指标
    indicator_type?: string
}
/**
 * 分析预览的数据的配置
 */
export interface AnalysisPreviewConfig {
    // 分析的数据维度（页面中行和列的集合）
    dimensions: Array<{
        field_id: string
        format: string
    }>

    // 筛选的条件
    filters: Array<{
        field_id: string
        operator: string // 过滤方式
        value: Array<string> // 过滤的范围
    }>
    // 业务限定
    time_constraint: {
        start_time: string
        end_time: string
    }
    // 同环比/占比
    metrics?: {
        type: string // 指标查询配置。枚举值: 'value' 指标值、'sameperiod' 同环比、'proportion' 占比
        // 同环比配置
        sameperiod_config?: {
            method: Array<'growth_value' | 'growth_rate'> // 计算方式枚举值：'growth_value' 增长值、'growth_rate' 增长率，列表至少有一项
            offset: number // 偏移量
            time_granularity: 'day' | 'month' | 'quarter' | 'year' // 时间粒度：'day' 日、'month' 月、'quarter' 季度、'year' 年
        }
    }

    limit?: number
    offset?: number
    row_filter?: any
}

/**
 * 预览数据的结果
 */
export interface AnalysisPreviewResult {
    columns: Array<{
        name: string
        type: string
    }>
    data: Array<Array<string | number>>
    total: number
    total_count: number
}

export interface IndicatorAnalysisConfig {
    // 透视表行
    pivot_rows: Array<{
        table_id: string
        field_id: string
        format: string
    }>

    // 透视表列
    pivot_columns: Array<{
        table_id: string
        field_id: string
        format: string
    }>

    filters: Array<{
        table_id: string
        field_id: string
        format: string
        operator: string // 过滤方式
        value: Array<string> // 过滤的范围
    }>
    time_constraint: Array<{
        format: string
        operator: string // 过滤方式
        value: Array<string> // 过滤的范围
    }>

    // 同环比/占比
    metrics?: {
        type: string // 指标查询配置。枚举值: 'value' 指标值、'sameperiod' 同环比、'proportion' 占比
        // 同环比配置
        sameperiod_config?: {
            custom: boolean // 是否自定义
            method: Array<'growth_value' | 'growth_rate'> // 计算方式枚举值：'growth_value' 增长值、'growth_rate' 增长率，列表至少有一项
            offset: number // 偏移量
            time_granularity: 'day' | 'month' | 'quarter' | 'year' // 时间粒度：'day' 日、'month' 月、'quarter' 季度、'year' 年
        }
    }
    limit?: number
    offset?: number
}

/**
 * 维度模型告警参数
 */
export interface IDimModelAlarmItem {
    alarm_type: number // 告警类型，0:事实表 1:维度表 2:维度字段（事实表中字段） 3:关联字段（维度表中字段）
    alarm_table: string // 告警表名称
    technical_name: string // 告警字段名称
    alarm_reason: number // 告警原因 0 被删除 1 数据类型变更
}

/**
 * 维度模型告警API参数
 */
export interface IDimModelAlarmParams {
    model_id: string // 模型ID
    save: IDimModelAlarmItem[] // 告警项列表
}

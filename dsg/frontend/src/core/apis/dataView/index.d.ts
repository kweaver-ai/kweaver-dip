import { LogicViewType, IGetListParams } from '../common'
import {
    explorationContentType,
    ExplorationPeculiarity,
    ExplorationRule,
} from '@/components/DatasheetView/DatasourceExploration/const'
import { DataSourceOrigin } from '@/components/DataSource/helper'

/**
 * 扫描数据源
 */
export interface IScanDatasource {
    datasource_id: string[]
}

// 查询库表参数
export interface IDatasheetView {
    offset?: number
    limit?: number
    // asc desc
    direction?: string
    // created_at updated_at
    sort?: string
    // 表、列的技术名称、业务名称筛选
    keyword?: string
    // 扫描结果筛选
    status?: string
    // 发布状态筛选
    publish_status?: string
    // 内容状态筛选
    edit_status?: string
    // 库表创建时间筛选开始时间
    created_at_start?: number
    // 库表创建时间筛选结束时间
    created_at_end?: number
    // 库表更新时间筛选
    updated_at_start?: number
    // 库表更新时间筛选
    updated_at_end?: number
    // 数据源类型
    datasource_type?: string
    // 数据源id
    datasource_id?: string
    department_id?: string
    task_id?: string
    project_id?: string
    // 主题 id
    subject_id?: string
    // 分类类型 LogicViewType
    type?: string
    // 包含子主题域
    include_sub_subject?: boolean
    include_sub_department?: boolean
    // Excel文件名
    excel_file_name?: string
    // 是否为owner
    owner?: boolean

    business_model_id?: string

    form_view_ids?: string
    // 上线状态
    online_status_list?: string
    source_type?: string
    datasource_source_type?: string
    my_department_resource?: boolean
    include_dwh_data_auth_request?: boolean
}

export interface IEditDatasheetView {
    id: string
    business_name?: string
    // 业务时间字段
    business_timestamp_id?: string
    type?: string
    fields: {
        id: string
        // 业务名称
        business_name: string
        // 数据标准
        standard_code?: string
        // 码表 id
        code_table_id?: string
        // L5属性 id
        attribute_id?: string
        // 属性分类
        classfity_type?: number
        // 清除属性 id
        clear_attribute_id?: string
    }[]
}
export interface IEditDatasheetViewTimestamp {
    id: string
    business_timestamp_id: string
}
export interface IDataViewRepeat {
    name: string
    datasource_id?: string
    form_id?: string
    name_type: 'business_name' | 'technical_name'
    type: string // LogicViewType
}
export interface IDataViewDatasouces {
    offset?: number
    limit?: number
    task_id?: string
    direction?: string
    source_type?: DataSourceOrigin
    datasource_source_type?: DataSourceOrigin
    sort?: string
    source_types?: string
}
export interface IEditDataViewBaseInfo {
    business_name: string
    technical_name?: string
    department_id?: string
    description?: string
    form_view_id: string
    owner_id: string
    subject_id?: string
    owners: any
}

export interface IExploreReport {
    id: string
    version?: number
    is_full_report?: boolean
    third_party?: boolean
}

export interface IExploreConfig {
    id: string
    field_config: any[]
}
export interface IExploreReportRes {
    explore_job_id: string
    explore_job_version: string
    status: string
}

export interface IExploreOverview {
    associated_code_field_count: number
    associated_standard_field_count: number
    explored_count: number
    field_count: number
    published_view_count: number
    view_count: number
    explored_data_view_count: number
    not_explored_data_count?: number
}
export interface IExploreTask {
    offset: number
    limit: number
    direction?: string
    sort?: string
    keyword?: string
    status?: string
    type?: string
}
export interface ExploreTaskItem {
    config: string
    created_at: number
    created_by: string
    datasource_id: string
    datasource_name: string
    datasource_type: string
    finished_at: number
    form_view_id: string
    form_view_name: string
    remark: string
    status: string
    task_id: string
    type: string
}
export interface IcreateExploreTask {
    config?: string
    datasource_id?: string
    form_view_id?: string
    type: explorationContentType | string | undefined
    subject_ids?: string[]
}

export interface IExploreRuleParams {
    offset?: number
    limit?: number
    dimension?: ExplorationPeculiarity
    enable?: boolean
    field_id?: string
    form_view_id?: string
    keyword?: string
    rule_level?: ExplorationRule
}
export interface IExploreRuleList {
    dimension?: ExplorationPeculiarity
    enable?: boolean
    rule_config?: string
    rule_description?: string
    rule_id?: string
    rule_level?: ExplorationRule
    rule_name?: string
    template_id?: string
}
export interface ICreateExploreRule {
    dimension?: ExplorationPeculiarity
    enable?: boolean
    field_id?: string
    form_view_id?: string
    rule_config?: string
    rule_description?: string
    rule_level?: ExplorationRule
    rule_name?: string
    template_id?: string
    dimension_type?: string
    draft?: boolean
}
export interface IEditExploreRule {
    id: string
    enable?: boolean
    field_id?: string
    form_view_id?: string
    rule_config?: string
    rule_description?: string
    rule_name?: string
}
/**
 * 自定义、库表库表字段
 */
export interface ILogicViewField {
    id: string
    // 列业务名称
    business_name: string
    // 关联码表ID
    code_table_id?: string
    // 数据精度（仅DECIMAL类型）
    data_accuracy?: number
    // 数据长度
    data_length?: number
    // 数据类型
    data_type: string
    // 是否为空
    is_nullable?: string
    // 原始数据类型
    original_data_type?: string
    // 是否主键
    primary_key: boolean
    // 数据标准名称
    standard?: string
    // 关联数据标准code
    standard_code?: string
    // 列技术名称
    technical_name: string
}
export interface IEditDatasheetViewDetails {
    field_id: string
    business_name: string
    code_table_id?: string
    standard_code?: string
}
export interface ICreateDownloadTask {
    form_view_id: string
    detail: string
}
export interface IGetDownloadTask {
    offset?: number
    limit?: number
    keyword?: string
    direction?: string
    sort?: string
    status?: string
}
export interface DownloadTaskItem {
    id: string
    form_view_id: string
    name: string
    name_en: string
    status: string
    created_at?: number
    updated_at?: number
}

export interface IDatasheetField {
    business_name: string
    data_accuracy: number
    data_length: number
    data_type: string
    id: string
    is_nullable: string
    original_data_type: string
    primary_key: boolean
    status: string
    technical_name: string
    label_icon?: string
    label_id?: string
    label_name?: string
    label_path?: string
    disabled?: boolean
}

export interface IUserFormViewReturn {
    business_name: string
    created_at: number
    created_by: string
    datasource: string
    datasource_catalog_name: string
    datasource_id: string
    datasource_type: string
    department: string
    department_id: string
    department_path: string
    edit_status: string
    id: string
    metadata_form_id: string
    owner: string
    owner_id: string
    publish_at: number
    status: string
    subject_domain: string
    subject_domain_id: string
    subject_domain_path: string
    technical_name: string
    type: string
    updated_at: number
    updated_by: string
    view_source_catalog_name: string
}

export interface ISearchLogicView {
    offset?: number
    limit?: number
    keyword?: string
    direction?: string
    sort?: string
}

/**
 * 库表子库表入参
 */
export interface ISearchSubView {
    offset?: number
    limit?: number
    logic_view_id?: string
    /** is_authorized */
    sort?: string
    /** asc / desc */
    direction?: string
    service_id?: string
}

export interface ISearchLogicViewReturn {
    business_name: string
    id: string
    subject_domain_id: string
    subject_id_path: string
    subject_path: string
    technical_name: string
    // 上线时间戳
    online_time: number
}

export interface ISubView {
    id: string
    name: string
    logic_view_id?: string
    auth_scope_id: string
    detail: string
    [key: string]: any
}

export enum DataViewAuditType {
    Publish = 'af-data-view-publish',
    Online = 'af-data-view-online',
    Offline = 'af-data-view-offline',
}
export enum DataViewRevokeType {
    Publish = 'publish-audit',
    Online = 'up-audit',
    Offline = 'down-audit',
}

/**
 * 选择补全库表信息
 */
export interface IDataViewSelectedCompletion {
    // 是否补全库表名称
    complete_view_name: boolean
    // 是否补全库表描述
    complete_view_description: boolean
    // 是否补全字段名称
    complete_field_name: boolean
    // 需要补全的字段id,uuid
    ids: string[]
}

/**
 * 库表补全结果
 */
export interface IDataViewCompletion {
    // 库表ID
    form_view_id?: string
    // 库表描述
    form_view_description: string
    // 库表业务名称
    form_view_business_name: string
    // 字段补全信息
    fields: { field_business_name: string; field_id: string }[]
}

export interface IConvertRuleParams {
    convert_rules?: string
    data_accuracy?: number
    data_length?: number
    field_id: string
    reset_data_type: string
}

interface IConvertRuleData {
    business_name: string
    data_type: string
    data: any[]
    technical_name: string
}

export interface IConvertRuleVerifyRes {
    convert_data: IConvertRuleData
    original_data: IConvertRuleData
}
// 创建Excel库表
export interface ICreateExcelView {
    // 库表业务名称
    business_name: string
    // 数据源ID
    data_source_id: string
    // 部门ID
    department_id: string
    // 库表描述
    description: string
    // 结束单元格
    end_cell: string
    // Excel字段
    excel_fields: IExcelField[]
    // Excel文件名
    excel_file_name: string
    // 是否有表头
    has_headers: boolean
    // 拥有者ID
    owner_id: string
    // 表名
    sheet: string
    // 是否将Excel表中的列作为新列
    sheet_as_new_column: boolean
    // 开始单元格
    start_cell: string
    // 主题ID
    subject_id: string
    // 技术名称
    technical_name: string
}

// Excel字段
interface IExcelField {
    // 属性ID
    attribute_id: string
    // 业务名称
    business_name: string
    // 属性分类
    classfity_type: number
    // 清除属性ID
    clear_attribute_id: string
    // 码表ID
    code_table_id: string
    // 数据类型
    data_type: string
    // 字段ID
    id: string
    // 数据标准code
    standard_code: string
    // 技术名称
    technical_name: string
}

interface IPreviewFilter {
    data_type?: string
    id?: string
    name?: string
    name_en?: string
    operator: string
    value?: string
}

interface IDataPreview {
    direction?: string
    fields: string[]
    filters?: IPreviewFilter[]
    form_view_id: string
    limit?: number
    offset?: number
    sort_field_id?: string
}
export interface IWhiteListItem {
    id: string // 策略id
    form_view_id: string // 库表id
    form_view_name: string // 库表name
    form_view_code: string // 库表编码
    description: string // 策略描述
    subject_name: string // 主题名称
    department_name: string // 部门名称
    created_at: string // 创建时间
    updated_at: string // 更新时间
    status: string // 状态
}
export interface IRuleCondition {
    field_id: string
    field_name: string
    type: string
    type_value: string
    operate: string
    operate_value: string
    rules: string[]
}
export interface IWhiteListDetailsRes {
    id: string
    form_view_id: string
    form_view_name: string
    description: string
    subject_name: string
    department_name: string
    datasource_name: string
    created_at: string
    created_by_name: string
    updated_at: string
    updated_by_name: string
    status: string
    configs: string
}
export interface ICreateWhiteList {
    form_view_id: string
    description: string
    id?: string
    configs: string
}

export interface IDataPrivacyPolicyItem {
    id: string
    form_view_id: string // 库表id
    business_name: string // 库表name
    technical_name: string // 库表name
    uniform_catalog_code: string // 库表编码
    description: string // 策略描述
    subject: string // 主题名称
    subject_id: string
    department_id: string
    department: string // 部门名称
    masking_fields: string
    masking_rules: string
    created_at: number // 创建时间
    created_by_user?: string // 创建时间
    updated_at: number // 更新时间
    updated_by_user?: string // 更新时间
}
export interface FieldListItem {
    form_view_field_id: string
    form_view_field_business_name: string
    form_view_field_data_grade: string
    desensitization_rule_id: string
    desensitization_rule_name: string
    desensitization_rule_method: string
}
export interface IDataPrivacyPolicyDetailsRes extends IDataPrivacyPolicyItem {
    policy_id: string
    field_list: FieldListItem[]
}
export interface ICreateDataPrivacyPolicy {
    id?: string
    form_view_id?: string
    description: string
    field_list: {
        form_view_field_id: string
        desensitization_rule_id: string
    }[]
}

// 创建分类算法
export interface IRecognitionAlgorithm {
    name: string
    description: string
    type: 'custom' | 'inner'
    inner?: string
    algorithm: string
    status: 0 | 1
}

// 分类算法列表
export interface IRecognitionAlgorithmSearch {
    status?: 0 | 1
    offset: number
    limit: number
    direction?: string
    sort?: string
    keyword?: string
}

// 分类算法列表
export interface RecognitionAlgorithmListItem {
    id: string
    name: string
    algorithm: string
    type: 'custom' | 'inner'
    status: 0 | 1
    updated_at: number
    created_at: number
}

// 分类算法详情
export interface IRecognitionAlgorithmDetails {
    id: string
    name: string
    description: string
    algorithm: string
    type: 'custom' | 'inner'
    status: 0 | 1
    created_at: number
    created_by_name: string
    updated_at: number
    updated_by_name: string
    inner_type?: string
}

// 分类算法列表
export interface IClassificationsItem {
    id: string
    name: string
    type: 'custom' | 'inner'
    subject_id: string
    subject_name: string
    algorithms: Array<{ id: string; name: string }>
    status: number
    created_at: number
    updated_at: number
    description: string
}

// 创建分类算法
export interface ICreateClassificationRule {
    // 分类算法名
    name: string
    description: string
    subject_id: string
    algorithm_ids: Array<string>
}

// 分类算法详情
export interface ClassificationRuleDetail {
    id: string
    name: string
    description: string
    type: 'custom' | 'inner'
    subject_id: string
    subject_name: string
    algorithms: Array<{ id: string; name: string }>
    created_at: number
    created_by_name: string
    updated_at: number
    updated_by_name: string
}

// 分级算法列表
export interface IGradeItem {
    id: string
    name: string
    type: 'custom' | 'inner'
    subject_id: string
    subject_name: string
    classification_subject_names: Array<string>
    status: number
    created_at: number
    updated_at: number
    description: string
    label_name: string
    label_id: string
    label_icon: string
}

// 创建分级算法
export interface ICreateGradeRule {
    name: string
    description: string
    classifications: {
        operate: string
        grade_rules: Array<IGradeRule<string>>
    }
    subject_id: string
    label_id: string
}

// 分级规则
export interface IGradeRule<T> {
    operate: string
    classification_rule_subjects: Array<T>
}
export interface IGradeRuleGroup {
    bussiness_object_id?: string
    id: string
    name: string
    description: string
}
// 分级算法详情
export interface IGradeRuleDetail {
    id: string
    group_id?: string
    name: string
    type: 'custom' | 'inner'
    subject_id: string
    subject_name: string
    classifications: {
        operate: string
        grade_rules: Array<
            IGradeRule<{
                id: string
                name: string
            }>
        >
    }
    status: number
    created_at: number
    updated_at: number
    description: string
    label_name: string
    label_id: string
    label_icon: string
    created_by_name: string
    updated_by_name: string
}

/**
 * 识别算法使用数据
 */
export interface IRecognitionAlgorithmUsedList {
    algorithm_subjects: Array<{
        algorithm_id: string
        algorithm_name: string
        subjects: Array<IUsedSubject>
    }>
}

/**
 * 使用数据
 */
export interface IUsedSubject {
    id: string
    name: string
    description: string
    path_id: string
    path_name: string
}

// 数据集参数
export interface IDataset {
    data_set_name: string
    description: string
}

// 创建模型
export interface ICreateDataModel {
    business_name?: string
    technical_name?: string
    catalog_id?: string
    description?: string
    model_type?: string
    subject_id?: string
    data_source_id?: string
    id?: string

    // 模型字段
    fields?: {
        business_name: string
        field_id: string
    }[]
    relations?: IGraphModelRelation[]
    all_nodes?: Array<{
        meta_model_id: string
        display_field_id: string
    }>
}

// 模型
export interface IGraphModelDetails {
    id: string
    business_name: string
    technical_name?: string
    catalog_id?: string
    catalog_name?: string
    description: string
    created_at: string
    data_view_id?: string
    data_view_name?: string
    fields?: IGraphModelField[]
    relations?: IGraphModelRelation[]
    subject_id?: string
    subject_name?: string
    updated_at?: string
    meta_model_slice?: Array<IGraphModelDetails>
}

interface IGraphModelField {
    id: string
    business_name: string
    technical_name: string
    comment?: string
    data_type: string
    data_accuracy?: number
    data_length?: number
    field_id: string
    id: string
    is_nullable: string
    model_id: string
    primary_key?: string
}

interface IGraphModelRelation {
    id: string
    business_name?: string
    technical_name?: string
    description?: string
    end_display_field_id: string
    start_display_field_id: string
    links: {
        end_field_id: string
        end_field_name?: string
        end_model_id: string
        end_model_name?: string
        start_field_id: string
        start_field_name?: string
        start_model_id: string
        start_model_name?: string
    }[]
}

// 模型列表
export interface IModelListParams {
    offset?: number
    limit?: number
    direction?: string
    sort?: string
    keyword?: string
    subject_id?: string
    model_type?: string
    only_self?: string
}

export interface IGraphModelListItem {
    business_name: string
    catalog_id: number
    data_view_id: string
    description: string
    id: string
    meta_model: Array<string>
    technical_name: string
    updater_name: string
    updater_uid: string
    updated_at: string
}
// 模板规则
export enum TemplateDimensionType {
    RowNull = 'row_null',
    RowRepeat = 'row_repeat',
    Null = 'null',
    Dict = 'dict',
    Repeat = 'repeat',
    Format = 'format',
    Custom = 'custom',
}
export interface ICreateTemplateRule extends ICreateExploreRule {
    dimension_type?: TemplateDimensionType
    id?: string
}
export interface ITemplateRuleList extends IExploreRuleList {
    source?: string
    updated_at?: number
}
export interface ITemplateRuleParams extends IExploreRuleParams {
    dimension_type?: number
}

export interface IGraphModelLabelListItem {
    id: string
    name: string
    description: string
    created_at: string
    updated_at: string
    related_models: Array<{
        id: string
        name: string
    }>
    created_by: string
    updated_by: string
}

interface IDepartExploreReport extends IGetListParams {
    department_id: string
}

interface IExportExploreReports {
    department_id: string
    need_rule?: boolean
    owner_ids?: string
}

interface IFormViewExploreReports extends IGetListParams {
    department_id: string
    owner_ids?: string
}

interface IFormViewOverview {
    department_id: string
    owner_ids?: string
}

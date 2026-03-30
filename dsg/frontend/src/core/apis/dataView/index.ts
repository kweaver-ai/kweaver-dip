import { string } from 'sql-formatter/lib/src/lexer/regexFactory'
import requests from '@/utils/request'
import { IResult, LineageForm } from '@/core'
import {
    IScanDatasource,
    IDatasheetView,
    IEditDatasheetView,
    IEditDatasheetViewTimestamp,
    IDataViewDatasouces,
    IDataViewRepeat,
    IEditDataViewBaseInfo,
    IExploreReport,
    IExploreReportRes,
    IExploreConfig,
    IExploreOverview,
    IExploreTask,
    ExploreTaskItem,
    IcreateExploreTask,
    ILogicViewField,
    IEditDatasheetViewDetails,
    ICreateDownloadTask,
    IGetDownloadTask,
    DownloadTaskItem,
    ISearchLogicView,
    ISearchLogicViewReturn,
    ISubView,
    ISearchSubView,
    DataViewAuditType,
    DataViewRevokeType,
    IExploreRuleParams,
    IExploreRuleList,
    ICreateExploreRule,
    IEditExploreRule,
    IDataViewCompletion,
    IDataViewSelectedCompletion,
    IConvertRuleParams,
    IConvertRuleVerifyRes,
    ICreateExcelView,
    IWhiteListItem,
    IWhiteListDetailsRes,
    ICreateWhiteList,
    IDataPrivacyPolicyItem,
    IDataPrivacyPolicyDetailsRes,
    ICreateDataPrivacyPolicy,
    IDataPreview,
    IRecognitionAlgorithm,
    IRecognitionAlgorithmSearch,
    RecognitionAlgorithmListItem,
    IRecognitionAlgorithmDetails,
    IClassificationsItem,
    ICreateClassificationRule,
    ClassificationRuleDetail,
    IGradeItem,
    ICreateGradeRule,
    IGradeRuleGroup,
    IGradeRuleDetail,
    IRecognitionAlgorithmUsedList,
    IDataset,
    ICreateDataModel,
    IGraphModelDetails,
    IModelListParams,
    ICreateTemplateRule,
    ITemplateRuleList,
    ITemplateRuleParams,
    IGraphModelListItem,
    IGraphModelLabelListItem,
    IDepartExploreReport,
    IExportExploreReports,
    IFormViewExploreReports,
    IFormViewOverview,
} from './index.d'
import { explorationContentType } from '@/components/DatasheetView/DatasourceExploration/const'
import {
    DesensitizationStruct,
    ExcutionRule,
} from '@/components/Desensitization/Config'

const { get, post, put, delete: del } = requests

/**
 * 扫描数据源
 * @param params
 * @returns
 */
export const scanDatasource = (params: {
    datasource_id: string
    task_id?: string
    project_id?: string
}) => {
    return post('/api/data-view/v1/form-view/scan', params)
}
/**
 * 批量扫描数据源
 * @param params
 * @returns
 */
export const batchScanDatasource = (params?: IScanDatasource) => {
    return post('/api/data-view/v1/form-view/scans', params)
}

/**
 * 查询库表
 * @param params
 * @returns
 */
export const getDatasheetView = (params?: IDatasheetView) => {
    return get('/api/data-view/v1/form-view', params)
}
export const getDatasheetPublishedView = (params?: IDatasheetView) => {
    return get('/api/data-view/v1/form-view/published', params)
}
// /**
//  * 编辑库表时间戳字段 -- 删除
//  * @param params
//  * @returns
//  */
// export const editDatasheetViewTimestamp = (
//     params: IEditDatasheetViewTimestamp,
// ) => {
//     return put(`/api/data-view/v1/form-view`, params)
// }
/**
 * 编辑库表
 * @param params
 * @returns
 */
export const editDatasheetView = (params: IEditDatasheetView) => {
    return put(`/api/data-view/v1/form-view/${params.id}`, params)
}
// /**
//  * 编辑库表码表、名称、数据标准 -- 删除
//  * @param params
//  * @returns
//  */
// export const editDatasheetViewDetails = (params: IEditDatasheetViewDetails) => {
//     return put(`/api/data-view/v1/form-view/field/${params.field_id}`, params)
// }
/**
 * 删除库表
 * @param params
 * @returns
 */
export const delDatasheetView = (id: string) => {
    return del(`/api/data-view/v1/form-view/${id}`)
}

/**
 *库表详情
 * @param params
 * @returns
 */
export const getDatasheetViewDetails = (
    id: string,
    params?: {
        enable_data_protection?: boolean
    },
) => {
    return get(`/api/data-view/v1/form-view/${id}`, params)
}

/**
 *库表详情
 * @param params
 * @returns
 */
export const getBusinessUpdateTime = (id: string) => {
    return get(`/api/data-view/v1/form-view/${id}/business-update-time`)
}

// 获取数据源
export const getDataViewDatasouces = (params: IDataViewDatasouces) => {
    return get(`/api/data-view/v1/datasource`, params)
}

// 库表表名称重名校验
export const getDataViewRepeat = (params: IDataViewRepeat) => {
    return get(`/api/data-view/v1/form-view/repeat`, params)
}

// 查询库表基本信息
export const getDataViewBaseInfo = (id: string) => {
    return get(`/api/data-view/v1/form-view/${id}/details`)
}

// 编辑库表基本信息
export const editDataViewBaseInfo = (params: IEditDataViewBaseInfo) => {
    return put(
        `/api/data-view/v1/form-view/${params.form_view_id}/details`,
        params,
    )
}

/**
 * 数据源探查配置
 */
export const datasourceExploreConfig = (params: {
    datasource_id: string
}): Promise<any> => {
    return post(`/api/data-view/v1/explore-conf`, params)
}

/**
 * 查询探查报告 -- 服务超市探查报告合为一个接口
 */
export const getExploreReport = (params: IExploreReport): Promise<any> => {
    return get(`/api/data-view/v1/form-view/explore-report`, params)
}

/**
 * 查询探查字段分组
 */
export const getExploreFieldGroup = (params: {
    field_id: string
}): Promise<any> => {
    return get(`/api/data-view/v1/form-view/explore-report/field`, params)
}

/**
 * 查询探查报告状态
 */
export const getExploreReportStatus = (params: {
    form_view_id?: string
    datasource_id?: string
    type?: explorationContentType
}): Promise<{ explore_type: string; status: string }[]> => {
    return get(`/api/data-view/v1/form-view/explore-conf/status`, params)
}

/**
 * 查询目录探查配置
 */
export const getExploreConfig = (id: string): Promise<any> => {
    return get(`/api/data-view/v1/form-view/explore-conf`, { id })
}

/**
 * 查询目录探查配置
 */
export const exploreConfig = (params: IExploreConfig): Promise<any> => {
    return post(`/api/data-view/v1/form-view/explore-conf`, params)
}
/**
 * 查询数据源预览
 */
export const exploreOverview = (params: {
    datasource_id: string
}): Promise<IExploreOverview> => {
    return get(` /api/data-view/v1/overview`, params)
}

/**
 * 查询数据源探查配置
 */
export const getDatasourceConfig = (params: {
    datasource_id?: string
    form_view_id?: string
}): Promise<{
    config: string
    datasource_id: string
    form_view_id: string
}> => {
    return get(`/api/data-view/v1/explore-conf`, params)
}
/**
 * 查询探查任务列表
 */
export const getExploreTask = (
    params: IExploreTask,
): Promise<IResult<ExploreTaskItem>> => {
    return get(`/api/data-view/v1/explore-task`, params)
}
/**
 * 查询探查任务列表
 */
export const getExploreTaskDetails = (id: string): Promise<ExploreTaskItem> => {
    return get(`/api/data-view/v1/explore-task/${id}`)
}
/**
 * 新建探查任务列表
 */
export const createExploreTask = (params: IcreateExploreTask): Promise<any> => {
    return post(`/api/data-view/v1/explore-task`, params)
}
/**
 * 取消探查任务列表
 */
export const cancelExploreTask = (params: {
    id: string
    status: string
}): Promise<any> => {
    return put(`/api/data-view/v1/explore-task/${params.id}`, params)
}
/**
 * 删除探查任务列表
 */
export const delExploreTask = (id: string): Promise<any> => {
    return del(`/api/data-view/v1/explore-task/${id}`)
}

/**
 * 获取内置规则列表
 */
export const getInternalRuleList = (): Promise<IExploreRuleList[]> => {
    return get(`/api/data-view/v1/explore-config/internal-rule`)
}

// ---- cssjj 探查规则start ----
/**
 * 创建探查规则
 */
export const createExploreRule = (params: ICreateExploreRule): Promise<any> => {
    return post(`/api/data-view/v1/explore-rule`, params)
}
/**
 * 批量创建探查规则
 */
export const batchCreateExploreRule = (params: {
    form_view_id: string
    rule_level: string
}): Promise<any> => {
    return post(`/api/data-view/v1/explore-rule/batch`, params)
}
/**
 * 获取探查规则列表
 */
export const getExploreRuleList = (
    params: IExploreRuleParams,
): Promise<IExploreRuleList[]> => {
    return get(`/api/data-view/v1/explore-rule`, params)
}
/**
 * 规则重名校验
 */
export const exploreRuleRepeat = (params: {
    form_view_id: string
    rule_name: string
    rule_id?: string
}): Promise<any> => {
    return get(`/api/data-view/v1/explore-rule/repeat`, params)
}
/**
 * 修改规则启用状态
 */
export const editExploreRuleStatus = (params: {
    enable: boolean
    rule_ids: string[]
}): Promise<any> => {
    return put(`/api/data-view/v1/explore-rule/status`, params)
}
/**
 * 获取规则详情
 */
export const getExploreRuleDetails = (id): Promise<any> => {
    return get(`/api/data-view/v1/explore-rule/${id}`)
}
/**
 * 修改规则
 */
export const editExploreRule = (params: IEditExploreRule): Promise<any> => {
    return put(`/api/data-view/v1/explore-rule/${params.id}`, params)
}
/**
 * 删除规则
 */
export const delExploreRule = (id): Promise<any> => {
    return del(`/api/data-view/v1/explore-rule/${id}`)
}
// ---- cssjj 探查规则end ----

// ---- 规则模板start ----
/**
 * 创建模板规则
 */
export const createTemplateRule = (
    params: ICreateTemplateRule,
): Promise<any> => {
    return post(`/api/data-view/v1/template-rule`, params)
}
/**
 * 获取模板规则列表
 */
export const getTemplateRuleList = (
    params: ITemplateRuleParams,
): Promise<ITemplateRuleList[]> => {
    return get(`/api/data-view/v1/template-rule`, params)
}
/**
 * 模板规则重名校验
 */
export const templateRuleRepeat = (params: {
    rule_name: string
    rule_id?: string
}): Promise<any> => {
    return get(`/api/data-view/v1/template-rule/repeat`, params)
}
/**
 * 修改模板规则启用状态
 */
export const editTemplateRuleStatus = (params: {
    enable: boolean
    rule_id: string
}): Promise<any> => {
    return put(`/api/data-view/v1/template-rule/status`, params)
}
/**
 * 获取模板规则详情
 */
export const getTemplateRuleDetails = (id): Promise<any> => {
    return get(`/api/data-view/v1/template-rule/${id}`)
}
/**
 * 修改模板规则
 */
export const editTemplateRule = (params: ICreateTemplateRule): Promise<any> => {
    return put(`/api/data-view/v1/template-rule/${params.id}`, params)
}
/**
 * 删除模板规则
 */
export const delTemplateRule = (id): Promise<any> => {
    return del(`/api/data-view/v1/template-rule/${id}`)
}
// ---- 规则模板end ----

// ----------------------------------------------------数据血缘-------------------------------------
/**
 * 获取数据目录血缘基础表
 * @param id
 * @returns
 */
export const getLineageBase = (id: string): Promise<LineageForm> => {
    return get(`/api/data-view/v1/data-lineage/${id}/base`)
}

/**
 * 获取父节点
 * @param id 父节点id
 * @returns
 */
export const getLineageFathers = (
    vid: string,
    params: {
        limit: number
        offset: number
    },
): Promise<IResult<LineageForm>> => {
    return get(`/api/data-view/v1/data-lineage/pre/${vid}`, params)
}

/**
 * 查询字段样例数据 /fields
 * @param params
 * @returns
 */
export const getExampleByFieldId = (params: {
    tableId: string
    fieldId: string
}): Promise<{ sample_data: Array<string> }> => {
    return get(
        `/api/data-view/v1/form-view/${params.tableId}/fields/${params.fieldId}`,
    )
}

/**
 * 查询我的可用库表
 * @param params
 * @returns
 */
export const getUserDatasheetView = (params?: IDatasheetView) => {
    return get('/api/data-view/v1/user/form-view', params)
}

/**
 * 查询我的库表详情
 * @id 库表id
 * @returns
 */
export const getUserDatasheetViewDetails = (
    id: string,
    params?: { enable_data_protection?: boolean },
) => {
    return get(`/api/data-view/v1/user/form-view/${id}`, params)
}

/**
 * 获取我的所有库表和授权给我的库表
 * @param id
 * @param params
 * @returns
 */
export const getUserDatasheetViewAll = (params?: IDatasheetView) => {
    return get(`/api/data-view/v1/user/form-all-view`, params)
}

//  --数据下载--
/**
 * 创建下载任务
 * @params
 * @returns
 */
export const createDownloadTask = (params: ICreateDownloadTask) => {
    return post(`/api/data-view/v1/download-task`, params)
}

/**
 * 查询下载任务列表接口
 * @params
 * @returns
 */
export const getDownloadTask = (
    params: IGetDownloadTask,
): Promise<IResult<DownloadTaskItem>> => {
    return get(`/api/data-view/v1/download-task`, params)
}
/**
 * 删除下载任务接口
 * @id 任务id
 * @returns
 */
export const delDownloadTask = (id: string) => {
    return del(`/api/data-view/v1/download-task/${id}`)
}
/**
 * 获取下载链接接口
 * @id 任务id
 * @returns
 */
export const getDownloadTaskUrl = (id: string) => {
    return get(`/api/data-view/v1/download-task/${id}/download-link`)
}
/**
 * 创建自定义库表和逻辑实体库表
 */
export const postDataViewLogicView = (params: {
    // 库表业务名称
    business_name: string
    // 部门id
    department_id?: string
    // 描述
    description?: string
    // 字段信息
    logic_view_field: ILogicViewField[]
    // 所有者
    owners?: { owner_id?: string }[]
    // 创建库表sql
    sql: string
    // 主题域id 或者 逻辑实体id 根据type类型传入
    subject_id: string
    // 库表技术名称
    technical_name: string
    // 类型
    type: 'custom' | 'logic_entity'
    // 场景 id
    scene_analysis_id: string
}) => {
    return post(`/api/data-view/v1/logic-view`, params)
}

/**
 * 编辑自定义库表和逻辑实体库表
 */
export const putDataViewLogicView = (params: {
    // 库表 id
    id: string
    // 字段信息
    logic_view_field: ILogicViewField[]
    // 创建库表sql
    sql: string
    // 业务时间字段
    business_timestamp_id?: string
    // 类型
    type: 'custom' | 'logic_entity'
}) => {
    return put(`/api/data-view/v1/logic-view`, params)
}

/**
 * 获取合成数据
 * @returns
 */
export const getSynthData = (id) => {
    return get(`/api/data-view/v1/logic-view/${id}/synthetic-data`)
}

/**
 * 获取用户权限下的主题域列表
 * @returns
 */
export const getUserDataViewSubjectDomains = () => {
    return get(`/api/data-view/v1/logic-view/subject-domains`)
}

/**
 * 获取可授权库表列表
 * @param params
 * @returns
 */
export const getDataViewAuthList = (params: any) => {
    return get(`/api/data-view/v1/logic-view/authorizable`, params)
}

/**
 * 资产全景搜索
 * @param params
 * @returns
 */
export const searchLogicViewfromPanorama = (
    params: ISearchLogicView,
): Promise<IResult<ISearchLogicViewReturn>> => {
    return get(`/api/data-view/v1/subject-domain/logical-view`, params)
}

/**
 * 资产全景 历史记录 有效id校验
 * @param params
 * @returns
 */
export const validateViewIds = (ids: string[]): Promise<{ ids: string[] }> => {
    return post(`/api/data-view/v1/form-view/filter`, { ids })
}

/**
 * 库表授权——获取子库表列表
 * @returns
 */
export const getSubViews = (
    params: ISearchSubView,
): Promise<IResult<ISubView>> => {
    return get(`/api/data-view/v1/sub-views`, params)
}

/**
 * 库表授权——创建子库表
 * @param 子库表 名称 | 原库表ID | 子库表内容
 * @returns
 */
export const createSubViews = (
    params: Omit<ISubView, 'id'>,
): Promise<ISubView> => {
    return post(`/api/data-view/v1/sub-views`, params)
}

/**
 * 库表授权——删除指定子库表
 * @param id 子库表ID
 * @returns
 */
export const deleteSubViews = (id: string) => {
    return del(`/api/data-view/v1/sub-views/${id}`)
}

/**
 * 库表授权——更新指定子库表
 * @param id  子库表ID
 * @param params 子库表  名称 | 内容
 * @returns
 */
export const updateSubViews = (
    id: string,
    params: Pick<ISubView, 'name' | 'detail'>,
): Promise<ISubView> => {
    return put(`/api/data-view/v1/sub-views/${id}`, params)
}

/**
 * 库表授权——获取指定子库表
 * @param id 子库表ID
 * @returns
 */
export const getSubViewById = (id: string): Promise<ISubView> => {
    return get(`/api/data-view/v1/sub-views/${id}`)
}

/**
 * 库表 - 审核流程实例创建
 * @param id 库表ID
 * @param audit_type 审核类型
 * @returns
 */
export const createdDataViewAudit = (params: {
    id: string
    audit_type: DataViewAuditType
}) => {
    return post(`/api/data-view/v1/logic-view/audit-process-instance`, params)
}
/**
 * 库表 - 撤销审核流程实例
 * @param id 库表ID
 * @param operate_type 审核类型
 * @returns
 */
export const revokeDataViewAudit = (params: {
    logic_view_id: string
    operate_type: DataViewRevokeType
}) => {
    return put(`/api/data-view/v1/logic-view/revoke`, params)
}

// /**
//  * 添加探测属性黑名单 -- 删除
//  * @param field_id 字段id
//  * @param attribute_id 属性id
//  */
// export const setAttributeBlack = (params: {
//     field_id: string
//     attribute_id: string
// }) => {
//     return post(`/api/data-view/v1/form-view/field/attribute_black`, params)
// }

/**
 * 根据给定的ID获取过滤规则。
 *
 * 本函数通过发送HTTP GET请求到指定的API端点，来获取与给定ID相关联的过滤规则。
 * 这是获取数据库表过滤规则的异步方法，使用Promise封装了网络请求，以方便在async/await语法中使用。
 *
 * @param {string} id - 数据库表的唯一标识符。这个ID用于从服务器检索特定的数据库表过滤规则。
 * @returns {Promise<{id: string, filter_rule: string}>} - 返回一个Promise，该Promise解析为一个对象，包含过滤规则的ID和规则定义。
 */
export const getFilterRule = (
    id: string,
): Promise<{
    id: string
    filter_rule: string
}> => {
    // 使用GET方法请求与给定ID相关联的过滤规则数据
    return get(`/api/data-view/v1/form-view/${id}/filter-rule`)
}

/**
 * 更新过滤规则接口
 *
 * 本函数通过发送PUT请求来更新指定数据库表的过滤规则。
 * 请求的路径是基于数据库表的ID来构建的，请求体包含待更新的过滤规则。
 *
 * @param id 数据库表的唯一标识符
 * @param params 包含待更新的过滤规则的参数对象
 * @returns 返回一个Promise，解析后的结果包含更新后的数据库表ID
 */
export const updateFilterRule = (
    id: string,
    params: { filter_rule: string },
): Promise<{
    id: string
}> => {
    // 发送PUT请求来更新过滤规则
    return put(`/api/data-view/v1/form-view/${id}/filter-rule`, params)
}

/**
 * 删除过滤规则。
 *
 * 本函数通过发送HTTP DELETE请求到指定的API端点，来删除一个特定的过滤规则。
 * 它使用过滤规则的ID作为请求路径的一部分，以便精确地定位到要删除的规则。
 *
 * @param id 过滤规则的唯一标识符。这个ID用于在API请求的路径中指定要删除的规则。
 * @returns 返回一个Promise，该Promise解析为一个包含删除规则ID的对象。
 *          这使得调用者可以通过解析的ID确认哪些规则被成功删除。
 */
export const deleteFilterRule = (
    id: string,
): Promise<{
    id: string
}> => {
    // 发送HTTP DELETE请求来删除指定ID的过滤规则
    return del(`/api/data-view/v1/form-view/${id}/filter-rule`)
}

/**
 * 执行过滤规则查询。
 *
 * 该函数通过发送HTTP POST请求到指定的API端点，测试并执行一个过滤规则。
 * 它接受一个包含过滤规则和SQL查询字符串的参数对象，并返回查询的结果，包括列名、数据数组和数据计数。
 * 这种功能通常用于在前端应用中动态过滤和展示数据库中的数据。
 *
 * @param {Object} params - 函数的参数对象。
 * @param {string} params.filter_rule - 待执行的过滤规则字符串。
 * @param {string} params.sql - 与过滤规则配合使用的SQL查询字符串。
 * @returns {Promise<{ columns: Array<string>; data: Array<any>; count: number; }>} - 返回一个Promise，解析为一个对象，包含查询结果的列名数组、数据数组和数据计数。
 */
export const execFilterRule = (
    id: string,
    params: { filter_rule: string },
): Promise<{
    columns: Array<{
        name: string
        type: string
    }>
    data: Array<any>
    count: number
}> => {
    // 使用POST方法向指定的API端点发送请求，测试并执行过滤规则
    return post(`/api/data-view/v1/form-view/${id}/filter-rule/test`, params)
}

/**
 * 获取库表补全结果
 * @param id 库表 id
 */
export const getDataViewCompletion = (
    id: string,
): Promise<{
    id: string
    result: IDataViewCompletion
}> => {
    return get(`/api/data-view/v1/form-view/${id}/completion`)
}

/**
 * 更新库表补全结果
 * @param id 库表 id
 */
export const putDataViewCompletion = (
    id: string,
    params: { result: IDataViewCompletion },
): Promise<{ id: string }> => {
    return put(`/api/data-view/v1/form-view/${id}/completion`, params)
}

/**
 * 发起库表补全
 * @param id 库表 id
 */
export const postDataViewCompletion = (
    id: string,
    params: IDataViewSelectedCompletion,
): Promise<{ id: string }> => {
    return post(`/api/data-view/v1/form-view/${id}/completion/task`, params)
}

/**
 * 通过id拿到库表详情
 */
export const getUserViewMultiDetailsRequest = (params: {
    ids: any
}): Promise<any> => {
    return post(`/api/data-view/v1/user/form-view/field/multi`, params)
}

/**
 * 通过id拿到库表详情-不加授权
 */
export const getViewMultiDetailRequest = (params: {
    ids: any
}): Promise<any> => {
    return post(`/api/data-view/v1/logic-view/field/multi`, params)
}

export const convertRuleVerify = (
    params: IConvertRuleParams,
): Promise<IConvertRuleVerifyRes> => {
    return post(`/api/data-view/v1/form-view/convert-rule/verify`, params)
}

/**
 * 创建Excel库表
 * @param params
 * @returns
 */
export const createExcelView = (params: ICreateExcelView) => {
    return post(`/api/data-view/v1/form-view/excel-view`, params)
}

/**
 * 库表数据预览
 * @param params
 * @returns
 */
export const getDataViewPreview = (params: IDataPreview) => {
    return post(`/api/data-view/v1/form-view/data-preview`, params)
}

/**
 * 创建库表预览配置
 * @param params
 * @returns
 */
export const saveDataPreviewConfig = (params: {
    form_view_id: string
    config: string
}) => {
    return post(`/api/data-view/v1/form-view/preview-config`, params)
}

/**
 * 获取库表预览配置
 * @param params
 * @returns
 */
export const getDataPreviewConfig = (form_view_id: string) => {
    return get(`/api/data-view/v1/form-view/preview-config`, { form_view_id })
}
// 白名单策略 ---- start
/**
 * 获取白名单策略列表
 * @param params
 * @returns
 */
export const getWhiteList = (
    params: IDatasheetView,
): Promise<{
    total_count: number
    entries: IWhiteListItem[]
}> => {
    return get(`/api/data-view/v1/white-list-policy/list`, params)
}
/**
 * 获取白名单策略详情
 * @param params
 * @returns
 */
export const getWhiteListDetails = (
    id: string,
): Promise<IWhiteListDetailsRes> => {
    return get(`/api/data-view/v1/white-list-policy/${id}`)
}
/**
 * 创建白名单策略
 * @param params
 * @returns
 */
export const createWhiteList = (params: ICreateWhiteList): Promise<any> => {
    return post(`/api/data-view/v1/white-list-policy`, params)
}
/**
 * 删除白名单策略
 * @param params
 * @returns
 */
export const delWhiteList = (id: string): Promise<any> => {
    return del(`/api/data-view/v1/white-list-policy/${id}`)
}
/**
 * 执行测试白名单策略
 * @param params
 * @returns
 */
export const testWhiteList = (params: any): Promise<any> => {
    return post(`/api/data-view/v1/white-list-policy/execute`, params)
}
/**
 * 更新白名单策略
 * @param params
 * @returns
 */
export const updateWhiteList = (params: ICreateWhiteList): Promise<any> => {
    return put(`/api/data-view/v1/white-list-policy/${params?.id}`, params)
}
/**
 * 获取白名单策略关联库表
 * @param params
 * @returns
 */
export const getWhiteListRelateFormView = (params: {
    form_view_ids: string[]
}): Promise<any> => {
    return post(`/api/data-view/v1/white-list-policy/relate-form-view`, params)
}
// 白名单策略 ---- end

// 数据隐私策略 ---- start
/**
 * 获取脱敏算法配置列表
 * @param params
 * @returns
 */
export const getDesensitizationRule = (
    params: any,
): Promise<{
    total_count: number
    entries: any[]
}> => {
    return get(`/api/data-view/v1/desensitization-rule/list`, params)
}
/**
 * 获取数据隐私策略列表
 * @param params
 * @returns
 */
export const getDataPrivacyPolicy = (
    params: IDatasheetView,
): Promise<{
    total_count: number
    entries: IDataPrivacyPolicyItem[]
}> => {
    return get(`/api/data-view/v1/data-privacy-policy`, params)
}
/**
 * 获取数据隐私策略详情
 * @param params
 * @returns
 */
export const getDataPrivacyPolicyDetails = (
    id: string,
): Promise<IDataPrivacyPolicyDetailsRes> => {
    return get(`/api/data-view/v1/data-privacy-policy/${id}`)
}
/**
 * 获取数据隐私策略详情
 * @param params
 * @returns
 */
export const getPolicyFieldsByFormViewId = (id: string): Promise<any> => {
    return get(`/api/data-view/v1/data-privacy-policy/${id}/by-form-view`)
}
/**
 * 创建数据隐私策略
 * @param params
 * @returns
 */
export const createDataPrivacyPolicy = (
    params: ICreateDataPrivacyPolicy,
): Promise<any> => {
    return post(`/api/data-view/v1/data-privacy-policy`, params)
}
/**
 * 删除数据隐私策略
 * @param params
 * @returns
 */
export const delDataPrivacyPolicy = (id: string): Promise<any> => {
    return del(`/api/data-view/v1/data-privacy-policy/${id}`)
}
/**
 * 执行测试数据隐私策略
 * @param params
 * @returns
 */
export const testDataPrivacyPolicy = (params: any): Promise<any> => {
    return post(
        `/api/data-view/v1/data-privacy-policy/list/desensitization-data`,
        params,
    )
}
/**
 * 更新数据隐私策略
 * @param params
 * @returns
 */
export const updateDataPrivacyPolicy = (
    params: ICreateDataPrivacyPolicy,
): Promise<any> => {
    return put(`/api/data-view/v1/data-privacy-policy/${params?.id}`, params)
}
/**
 * 获取数据隐私策略关联库表
 * @param params
 * @returns
 */
export const getDataPrivacyPolicyRelateFormView = (params: {
    form_view_ids: string[]
}): Promise<any> => {
    return post(
        `/api/data-view/v1/data-privacy-policy/list/form-view-ids`,
        params,
    )
}
// 数据隐私策略 ---- end

/**
 * 获取脱敏规则列表
 */
export const getDesenRuleList = (params: Required<ISearchLogicView>) => {
    return get('/api/data-view/v1/desensitization-rule/list', params)
}

/**
 * 获取脱敏规则详情
 */
export const getDesenDetails = (id: string) => {
    return get(`/api/data-view/v1/desensitization-rule/${id}`)
}

/**
 * 删除脱敏规则
 */
export const delDesenRule = (params: { id: string; mode?: string }) => {
    const { id, mode } = params
    return del(
        `/api/data-view/v1/desensitization-rule/${id}`,
        null,
        mode ? { mode } : {},
    )
}

/**
 * 导出脱敏规则
 */
export const exportDesenRule = (params: { ids: string[] }) => {
    return post(`/api/data-view/v1/desensitization-rule/export`, params, {
        responseType: 'arraybuffer',
    })
}

/**
 * 执行脱敏规则算法
 */
export const excuteDesenRule = (params: ExcutionRule) => {
    return post(`/api/data-view/v1/desensitization-rule/execute`, params)
}

/**
 * 新建脱敏规则
 */
export const createDesenRule = (params: DesensitizationStruct) => {
    return post(`/api/data-view/v1/desensitization-rule`, params)
}

/**
 * 更新脱敏算法
 */
export const updateDesenRule = (
    params: DesensitizationStruct & { id: string },
) => {
    const { id, ...restParams } = params
    return put(`/api/data-view/v1/desensitization-rule/${id}`, restParams)
}

/**
 * 获取脱敏规则相关的策略
 */
export const getDesenRulePolicy = (params: { ids: string[] }) => {
    return post(` /api/data-view/v1/desensitization-rule/relate-policy`, params)
}

/**
 * 获取内置脱敏算法相关的内容
 */
export const getBuiltInDesenAlgo = () => {
    return get(`/api/data-view/v1/desensitization-rule/internal-algorithm`)
}

/** 根据质量检测状态获取库表列表 */
export const getFormViewByAuditStatus = (params: {
    datasource_id?: string // 数据源id
    datasource_type?: string // 数据源类型
    is_audited: boolean // 是否已检测
    keyword?: string // 关键字
}) => {
    return get(`/api/data-view/v1/form-view/by-audit-status`, params)
}

/** 根据ID批量查询库表基本信息 */
export const getFormViewBasicByIds = (
    ids: string[],
): Promise<{ entries: any[] }> => {
    const params = ids.map((id) => `ids=${id}`).join('&')
    return get(`/api/data-view/v1/form-view/basic?${params}`)
}
/** ****************************数据识别算法********************************** */
/**
 * 创建分类算法
 * @param params
 * @returns
 */
export const createRecognitionAlgorithm = (params: IRecognitionAlgorithm) => {
    return post(`/api/data-view/v1/recognition-algorithm`, params)
}

/**
 * 获取分类算法列表
 * @param params
 * @returns
 */
export const getRecognitionAlgorithms = (
    params: IRecognitionAlgorithmSearch,
): Promise<{
    total_count: number
    entries: RecognitionAlgorithmListItem[]
}> => {
    return get(`/api/data-view/v1/recognition-algorithm`, params)
}

/**
 * 获取分类算法详情
 * @param id
 */
export const getRecognitionAlgorithmDetails = (
    id: string,
): Promise<IRecognitionAlgorithmDetails> => {
    return get(`/api/data-view/v1/recognition-algorithm/${id}`)
}

/**
 * 更新分类算法
 * @param id
 * @param params
 * @returns
 */
export const updateRecognitionAlgorithm = (
    id: string,
    params: IRecognitionAlgorithm,
) => {
    return put(`/api/data-view/v1/recognition-algorithm/${id}`, params)
}

/**
 * 检查分类算法名称是否重复
 * @param params
 * @returns
 */
export const checkRepeatRecognitionAlgorithmName = (params: {
    name: string
    id?: string
}): Promise<{
    is_duplicate: 'true' | 'false'
}> => {
    return post(
        `/api/data-view/v1/recognition-algorithm/duplicate-check`,
        params,
    )
}

/**
 * 启用分类算法
 */
export const enableRecognitionAlgorithm = (id: string) => {
    return post(`/api/data-view/v1/recognition-algorithm/${id}/start`)
}

/**
 * 停止分类算法
 * @param id
 * @returns
 */
export const stopRecognitionAlgorithm = (id: string) => {
    return post(`/api/data-view/v1/recognition-algorithm/${id}/stop`)
}

/**
 * 删除分类算法
 * @param id
 * @returns
 */
export const deleteRecognitionAlgorithm = (id: string) => {
    return del(`/api/data-view/v1/recognition-algorithm/${id}`)
}

/**
 * 检查分类算法是否被使用
 * @param params
 */
export const checkRecognitionAlgorithmsIsUsed = (params: {
    ids: Array<string>
}): Promise<{
    working_ids: Array<string>
}> => {
    return post(`/api/data-view/v1/recognition-algorithm/working-ids`, params)
}

/**
 * 强制删除分类算法
 * @param params safe: 安全删除，force: 强制删除
 * @returns
 */
export const deleteForceRecognitionAlgorithms = (params: {
    ids: Array<string>
    mode: 'force' | 'safe'
}) => {
    return post(`/api/data-view/v1/recognition-algorithm/delete-batch`, params)
}

/**
 * 导出分类算法
 * @param params
 * @returns
 */
export const exportRecognitionAlgorithm = (params: { ids: string[] }) => {
    return post(`/api/data-view/v1/recognition-algorithm/export`, params, {
        responseType: 'arraybuffer',
    })
}

/**
 * 获取内置识别算法
 * @returns
 */
export const getInnerRecognitionAlgorithm = (): Promise<{
    inner_map: Array<{
        inner_type: string
        inner_algorithm: string
    }>
}> => {
    return get(`/api/data-view/v1/recognition-algorithm/inner-type/list`)
}

/**
 * 获取识别算法使用数据
 * @param params
 * @returns
 */
export const getRecognitionAlgorithmUsedList = (params: {
    ids: Array<string>
}): Promise<IRecognitionAlgorithmUsedList> => {
    return post(
        `/api/data-view/v1/recognition-algorithm/subjects-by-ids`,
        params,
    )
}

/** ****************************数据识别算法end********************************** */

/** ****************************数据分类算法********************************** */

/**
 * 获取分类算法列表
 * @param params
 * @returns
 */
export const getClassificationsList = (params: {
    subject_id: string
}): Promise<{
    entries: Array<IClassificationsItem>
    total_count: number
}> => {
    return get(`/api/data-view/v1/classification-rule`, params)
}

/**
 * 创建分类算法
 * @param params
 * @returns
 */
export const createClassificationRule = (params: ICreateClassificationRule) => {
    return post(`/api/data-view/v1/classification-rule`, params)
}

/**
 * 删除分类算法
 * @param id
 * @returns
 */
export const deleteClassificationRule = (id: string) => {
    return del(`/api/data-view/v1/classification-rule/${id}`)
}

/**
 * 启动分类算法
 * @param id
 * @returns
 */
export const startClassificationRule = (id: string) => {
    return post(`/api/data-view/v1/classification-rule/${id}/start`)
}

/**
 * 停止分类算法
 * @param id
 * @returns
 */
export const stopClassificationRule = (id: string) => {
    return post(`/api/data-view/v1/classification-rule/${id}/stop`)
}

/**
 * 获取分类算法详情
 * @param id
 * @returns
 */
export const getClassificationRuleDetail = (
    id: string,
): Promise<ClassificationRuleDetail> => {
    return get(`/api/data-view/v1/classification-rule/${id}`)
}

/**
 * 编辑分类算法
 * @param id
 * @param params
 * @returns
 */
export const editClassificationRule = (
    id: string,
    params: ICreateClassificationRule,
) => {
    return put(`/api/data-view/v1/classification-rule/${id}`, params)
}

/**
 * 导出分类算法
 * @param params
 * @returns
 */
export const exportClassificationRule = (params: { ids: string[] }) => {
    return post(`/api/data-view/v1/classification-rule/export`, params, {
        responseType: 'arraybuffer',
    })
}
/** ****************************数据分类算法 end********************************** */
/** ****************************数据分级算法 ********************************** */

/**
 * 获取数据分级列表
 * @param params
 * @returns
 */
export const getGradeList = (params: {
    subject_id: string
    group_id: string
    offset: number
    limit: number
}): Promise<{
    entries: Array<IGradeItem>
    total_count: number
}> => {
    return get(`/api/data-view/v1/grade-rule`, params)
}

/**
 * 创建分级算法
 * @param params
 * @returns
 */
export const createGradeRule = (params: ICreateGradeRule) => {
    return post(`/api/data-view/v1/grade-rule`, params)
}

/**
 * 删除分级算法
 * @param id
 * @returns
 */
export const deleteGradeRule = (id: string) => {
    return del(`/api/data-view/v1/grade-rule/${id}`)
}

/**
 * 获取分级算法详情
 * @param id
 * @returns
 */
export const getGradeRuleDetail = (id: string): Promise<IGradeRuleDetail> => {
    return get(`/api/data-view/v1/grade-rule/${id}`)
}

/**
 * 编辑分级算法
 * @param id
 * @param params
 * @returns
 */
export const editGradeRuleDetail = (id: string, params: ICreateGradeRule) => {
    return put(`/api/data-view/v1/grade-rule/${id}`, params)
}

/**
 * 启动分级算法
 * @param id
 * @returns
 */
export const startGradeRule = (id: string) => {
    return post(`/api/data-view/v1/grade-rule/${id}/start`)
}

/**
 * 停止分类算法
 * @param id
 * @returns
 */
export const stopGradeRule = (id: string) => {
    return post(`/api/data-view/v1/grade-rule/${id}/stop`)
}

/**
 * 导出分类算法
 * @param params
 * @returns
 */
export const exportGradeRule = (params: {
    ids?: string[]
    group_ids?: string[]
    business_object_id: string
}) => {
    return post(`/api/data-view/v1/grade-rule/export`, params, {
        responseType: 'arraybuffer',
    })
}

/**
 * 获取数据集列表
 */
export const getDatasetList = (params: {
    limit: number
    keyword: string
    offset: number
    sort?: string
    direction?: string
}) => {
    return get(`/api/data-view/v1/data-set`, params)
}

/**
 * 创建数据集
 */
export const createDataset = (params: IDataset) => {
    return post(`/api/data-view/v1/data-set`, params)
}

/**
 * 更新数据集
 */
export const updateDataset = (params: IDataset & { id: string }) => {
    const { id, ...restParams } = params
    return put(`/api/data-view/v1/data-set/${id}`, restParams)
}

/**
 * 删除数据集
 */
export const delDataset = (id: string) => {
    return del(`/api/data-view/v1/data-set/${id}`)
}

/**
 * 批量添加库表到数据集中
 */
export const addBatchViews = (params: {
    id: string
    form_view_ids: string[]
}) => {
    return post(`/api/data-view/v1/data-set/add-data-set`, params)
}

/**
 * 批量从数据集中删除库表
 */
export const delBatchViews = (params: {
    id: string
    form_view_ids: string[]
}) => {
    return post(`/api/data-view/v1/data-set/remove-data-set`, params)
}

/**
 * 获取数据集中的库表列表
 */
export const getViewsInDataset = (params: {
    id: string
    limit: number
    offset: number
    sort?: string
    direction?: string
    subject?: string
    department?: string
    keyword: string
}) => {
    const { id, ...restParams } = params
    return get(`/api/data-view/v1/data-set/view/${id}`, restParams)
}

/**
 * 检查数据集名称是否重名
 */
export const validateDatasetName = (params: { name: string; id?: string }) => {
    return get(`/api/data-view/v1/data-set/validate`, params)
}

/**
 * 获取数据集树形结构
 */
export const getDatasetTree = (params: { limit: number; offset: number }) => {
    return get(`/api/data-view/v1/data-set/view-tree`, params)
}

/** 库表脱敏字段数据预览 */
export const postDataViewDesensitizationFieldDataPreview = (
    params: {
        // 库表字段id
        form_view_field_id: string
        // 脱敏规则id
        desensitization_rule_id: string
    },
    config?: {
        signal?: AbortSignal
    },
) => {
    return post(
        `/api/data-view/v1/form-view/desensitization-field/data-preview`,
        params,
        config,
    )
}

/**
 * 获取规则分组列表
 * @param params
 * @returns
 */
export const getGradeRuleGroupList = (params: {
    business_object_id: string
}): Promise<{
    entries: Array<IGradeRuleGroup>
    total_count: number
}> => {
    return get(`/api/data-view/v1/grade-rule-group`, params)
}
/**
 * 创建规则分组列表
 * @param params
 * @returns
 */
export const createGradeRuleGroup = (params: IGradeRuleGroup) => {
    return post(`/api/data-view/v1/grade-rule-group`, params)
}
/**
 * 验证规则分组名称
 * @param params
 * @returns
 */
export const checkGradeRuleGroupName = (params: {
    id?: string
    business_object_id: string
    name: string
}) => {
    return post(`/api/data-view/v1/grade-rule-group/repeat`, params)
}
/**
 * 编辑规则分组列表
 * @param params
 * @returns
 */
export const editGradeRuleGroup = (params: IGradeRuleGroup) => {
    return put(`/api/data-view/v1/grade-rule-group/${params.id}`, params)
}
/**
 * 调整规则分组列表
 * @param params
 * @returns
 */
export const moveGradeRuleGroup = (params: {
    rule_ids: string[]
    group_id: string
}) => {
    return put(`/api/data-view/v1/grade-rule/group/bind`, params)
}
/**
 * 删除规则分组列表
 * @param id
 * @returns
 */
export const deleteGradeRuleGroup = (id: string) => {
    return del(`/api/data-view/v1/grade-rule-group/${id}`)
}
/**
 * 删除规则分组列表
 * @param id
 * @returns
 */
export const batchDeleteGradeRule = (param: { ids: string[] }) => {
    return post(`/api/data-view/v1/grade-rule/delete/batch`, param)
}

/**
 * 获取规则分组列表详情
 * @param id
 * @returns
 */
export const getGradeRuleGroupDetail = (
    id: string,
): Promise<IGradeRuleDetail> => {
    return get(`/api/data-view/v1/grade-rule/${id}`)
}

// ----------------------------------------------------模型管理-------------------------------------

/**
 * 创建模型
 */
export const createDataModel = (params: ICreateDataModel) => {
    return post(`/api/data-view/v1/graph-model`, params)
}

/**
 * 获取模型详情
 */
export const getModelInfo = (id: string): Promise<IGraphModelDetails> => {
    return get(`/api/data-view/v1/graph-model/${id}`)
}

/**
 * 更新模型
 */
export const updateModel = (id: string, params: ICreateDataModel) => {
    return put(`/api/data-view/v1/graph-model/${id}`, params)
}

/**
 * 获取模型列表
 */
export const getModelList = (
    params: IModelListParams,
    config?: { signal?: AbortSignal },
): Promise<IResult<IGraphModelListItem>> => {
    return get(
        `/api/data-view/v1/graph-model`,
        {
            only_self: 'true',
            ...params,
        },
        config,
    )
}

/**
 * 删除模型
 */
export const deleteModel = (id: string) => {
    return del(`/api/data-view/v1/graph-model/${id}`)
}

/**
 * 保存模型图谱
 */
export const saveModelGraph = (params: { id: string; content: string }) => {
    return post(
        `/api/data-view/v1/graph-model/canvas
        `,
        params,
    )
}

/**
 * 获取模型图谱
 */
export const getModelGraph = (id: string) => {
    return get(`/api/data-view/v1/graph-model/canvas/${id}`)
}

/**
 * 检查模型名称是否重复
 */
export const checkModelNameRepeat = (params: {
    business_name?: string
    technical_name?: string
    id?: string
}): Promise<{
    repeat: boolean
    name?: string
}> => {
    return get(`/api/data-view/v1/graph-model/check`, params)
}

/**
 *
 * @param id 模型id
 * @param params 参数
 * @param params.grade_label_id 分级标签id
 * @returns
 */
export const setModelGradeLabel = (
    id: string,
    params: { grade_label_id: string },
) => {
    return put(`/api/data-view/v1/graph-model/topic-confidential/${id}`, params)
}

/**
 * 获取主题模型标签列表
 * @param params params.limit 每页条数
 * @returns
 */
export const getTopicModelLabelList = (params: {
    limit: number
    offset: number
    keyword: string
}): Promise<IResult<IGraphModelLabelListItem>> => {
    return get(`/api/data-view/v1/graph-model/topic-label-rec`, params)
}

/**
 * 创建主题模型标签
 * @param params params.name 标签名称
 * @param params.description 标签描述
 * @param params.related_models 关联模型列表
 * @returns
 */
export const createTopicModelLabel = (params: {
    name: string
    description: string
    related_models: Array<string>
}) => {
    return post(`/api/data-view/v1/graph-model/topic-label-rec`, params)
}

/**
 * 更新主题模型标签
 * @param id 标签id
 * @param params params.name 标签名称
 * @param params.description 标签描述
 * @param params.related_models 关联模型列表
 * @returns
 */
export const updateTopicModelLabel = (
    id: string,
    params: {
        name: string
        description: string
        related_models: Array<string>
    },
) => {
    return put(`/api/data-view/v1/graph-model/topic-label-rec/${id}`, params)
}

/**
 * 获取主题模型标签详情
 * @param id
 * @returns
 */
export const getTopicModelLabelDetails = (
    id: string,
): Promise<IGraphModelLabelListItem> => {
    return get(`/api/data-view/v1/graph-model/topic-label-rec/${id}`)
}

/**
 * 删除主题模型标签
 * @param id 标签id
 * @returns
 */
export const deleteTopicModelLabel = (id: string) => {
    return del(`/api/data-view/v1/graph-model/topic-label-rec/${id}`)
}

/**
 * 获取部门探查报告列表
 */
export const getDepartExploreReports = (
    params?: Partial<IDepartExploreReport>,
) => {
    return get(`/api/data-view/v1/form-view/explore-reports`, params)
}
/**
 * 导出探查报告
 */
export const exportExploreReports = (params: IExportExploreReports) => {
    return post(`/api/data-view/v1/department/explore-reports/export`, params, {
        responseType: 'arraybuffer', // 重要：必须设置为arraybuffer
        transformResponse: [(data, headers) => ({ data, headers })],
    })
}

/**
 * 获取视图探查报告列表
 */
export const getFormViewExploreReports = (params: IFormViewExploreReports) => {
    return get(`/api/data-view/v1/department/explore-reports`, params)
}

/**
 * 获取视图概览
 */
export const getFormViewOverview = (params: IFormViewOverview) => {
    return get(`/api/data-view/v1/department/overview`, params)
}

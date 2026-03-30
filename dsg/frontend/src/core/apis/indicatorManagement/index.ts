import requests, { cancelRequest } from '@/utils/request'
import {
    IindicatorListParams,
    indicatorInfo,
    AtomicIndictorParams,
    DerivedIndictorParams,
    CompositeIndicatorParams,
    IndictorDetail,
    IDimModelDetailResult,
    IDimModelItem,
    IDimModelParams,
    IQueryDimModel,
    IQueryDimModelDetail,
    IUpdateDimModelConfig,
    IndicatorParamsType,
    AnalysisPreviewConfig,
    AnalysisPreviewResult,
    IndicatorAnalysisConfig,
    IDimModelAlarmParams,
} from './index.d'
import { IBusinObjSearch, IBusinObject, ICommonList } from '..'

const { get, post, put, delete: del } = requests

/**
 * 维度模型名称校验
 * @param name
 * @returns
 */
export const velidateDimensionModelName = (name: string) => {
    return requests.get(
        `/api/indicator-management/v1/dimension-model/check-name`,
        { name },
    )
}

/**
 * 查询维度模型列表
 * @param {IQueryDimModel} query
 * @returns
 */
export const getDimensionModels = (
    query: IQueryDimModel,
): Promise<ICommonList<Array<IDimModelItem>>> => {
    return requests.get(`/api/indicator-management/v1/dimension-model`, query)
}

/**
 * 添加维度模型
 * @param {IDimModelParams} params
 * @returns
 */
export const createDimensionModel = (params: IDimModelParams) => {
    return requests.post(`/api/indicator-management/v1/dimension-model`, params)
}

/**
 * 查询维度模型详情
 * @param {string} dimModelID  维度模型ID
 * @param {IQueryDimModelDetail} params 参数 {show_type}
 * @returns
 */
export const getDimensionModelDetail = (
    dimModelID: string,
    params: IQueryDimModelDetail,
): Promise<IDimModelDetailResult> => {
    return requests.get(
        `/api/indicator-management/v1/dimension-model/${dimModelID}`,
        params,
    )
}

/**
 * 删除维度模型
 * @param {string} dimModelID 维度模型ID
 * @returns
 */
export const deleteDimensionModel = (dimModelID: string) => {
    return requests.delete(
        `/api/indicator-management/v1/dimension-model/${dimModelID}`,
    )
}

/**
 * 更新维度模型
 * @param {string} dimModelID 维度模型
 * @param {IDimModelParams} params 参数
 * @returns
 */
export const updateDimensionModel = (
    dimModelID: string,
    params: IDimModelParams,
) => {
    return requests.put(
        `/api/indicator-management/v1/dimension-model/${dimModelID}/basic-info`,
        params,
    )
}

/**
 * 维度模型 画布、模型 配置更新
 * @param {string} dimModelID 维度模型
 * @param {IUpdateDimModelConfig} params 参数
 * @returns
 */
export const updateDimensionModelConfig = (
    dimModelID: string,
    params: IUpdateDimModelConfig,
) => {
    return requests.put(
        `/api/indicator-management/v1/dimension-model/${dimModelID}/canvas-configs`,
        params,
    )
}

/**
 * 查询数据目录
 * @returns
 */
export const getDataCatalogSearch = (params: {
    keyword?: string
    size?: number
    next_flag?: string
}): Promise<IBusinObjSearch<IBusinObject>> => {
    return post(
        `/api/data-catalog/frontend/v1/data-catalog/search-table`,
        params,
    )
}

// 获取指标列表
export const getIndictorList = (
    params: IindicatorListParams,
): Promise<{
    count: number
    entries: Array<indicatorInfo>
}> => {
    return get(`/api/indicator-management/v1/indicator`, params)
}

// 创建原子指标

export const createAtomicIndicator = (params: AtomicIndictorParams) => {
    return post(`/api/indicator-management/v1/atomic-indicator`, params)
}

// 创建衍生指标
export const createDerivedIndicator = (params: DerivedIndictorParams) => {
    return post(`/api/indicator-management/v1/derived-indicator`, params)
}

// 创建复合指标
export const createCompositeIndicator = (params: CompositeIndicatorParams) => {
    return post(`/api/indicator-management/v1/composite-indicator`, params)
}

// 获取指标详情
export const getIndicatorDetail = (id: string): Promise<IndictorDetail> => {
    return get(`/api/indicator-management/v1/indicator/${id}`)
}

// 删除指标

export const deleteIndictor = (id: string) => {
    return del(`/api/indicator-management/v1/indicator/${id}`)
}

// 编辑原子指标
export const editAtomicIndicator = (
    id: string,
    params: AtomicIndictorParams,
) => {
    return put(`/api/indicator-management/v1/atomic-indicator/${id}`, params)
}

// 编辑衍生指标
export const editDerivedIndicator = (
    id: string,
    params: DerivedIndictorParams,
) => {
    return put(`/api/indicator-management/v1/derived-indicator/${id}`, params)
}

// 编辑复合指标
export const editCompositeIndicator = (
    id: string,
    params: CompositeIndicatorParams,
) => {
    return put(`/api/indicator-management/v1/composite-indicator/${id}`, params)
}

// 预览原子指标
export const runAtomicIndicator = (
    params: AtomicIndictorParams,
): Promise<{
    data: Array<any>
    columns: Array<any>
}> => {
    return post(
        `/api/indicator-management/v1/atomic-indicator/preview-data`,
        params,
    )
}

// 编辑衍生指标
export const runDerivedIndicator = (
    params: DerivedIndictorParams,
): Promise<{
    data: Array<any>
    columns: Array<any>
}> => {
    return post(
        `/api/indicator-management/v1/derived-indicator/preview-data`,
        params,
    )
}

// 编辑复合指标
export const runCompositeIndicator = (
    params: CompositeIndicatorParams,
): Promise<{
    data: Array<any>
    columns: Array<any>
}> => {
    return post(
        `/api/indicator-management/v1/composite-indicator/preview-data`,
        params,
    )
}

// 通过id运行指标
export const runIndicatorById = (
    id: string,
): Promise<{
    data: Array<any>
    columns: Array<any>
}> => {
    return get(`/api/indicator-management/v1/indicator/data?indicator_id=${id}`)
}

// 检查指标名称是否重复
export const checkIndicatorNameRepeat = (params: {
    name: string
    id?: string
}): Promise<{
    name: string
    repeat: boolean
}> => {
    return get(`/api/indicator-management/v1/indicator/check-name`, params)
}

// 检查指标名称是否重复
export const checkIndicatorCodeRepeat = (params: {
    code: string
    id?: string
}): Promise<{
    code: string
    repeat: boolean
}> => {
    return get(`/api/indicator-management/v1/indicator/check-code`, params)
}

/**
 * 获取模型字段推荐值
 */
export const getDimensionModelFields = (params: {
    dimensional_model_id?: string
    field_id: string
    table_id: string
}): Promise<{
    columns: Array<{ name: string; type: string }>
    data: Array<Array<string>>
}> => {
    return get(`/api/indicator-management/v1/indicator/dimension-field`, params)
}

/**
 * 获取当已绑定的业务指标
 * @returns String[] 已使用的业务指标的id数组
 */
export const getUsedBusinessIndicatorsId = (): Promise<Array<string>> => {
    return get('/api/indicator-management/v1/business-indicator/list')
}

// 获取执行sql
export const getSql = (params: {
    id: string
    type: string
    canvas: any[]
}): Promise<{
    id: string
    exec_sql: string
}> => {
    return post(`/api/scene-analysis/v1/scene/return-exec-sql`, params)
}

/*
 * 创建画布
 * @params 图及图关系数据
 * @returns
 */
export const saveCanvas = (params: {
    canvas: string
    config: string
    id?: string
    type: string
    name: string
}): Promise<{
    id: string
    name: string
}> => {
    return (params.id ? put : post)(`/api/scene-analysis/v1/scene/view`, params)
}

/**
 * 查询指标
 * @param params
 * @returns
 */
export const getIndicatorListByType = (params?: IndicatorParamsType) => {
    return get('/api/indicator-management/v1/indicator', params)
}

/**
 * 执行sql
 */
export const runSql = (params: {
    sql_type: string
    exec_sql: string
    offset: number
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/scene/exec-sql?type=indicator`, {
        need_count: true,
        ...params,
    })
}
/**
 * 查询指标数据预览
 * @param id 指标id
 * @param params 过滤参数
 * @returns
 */
export const searchIndicatorPreview = (
    id: string,
    params: AnalysisPreviewConfig,
    isNeedCancel: boolean = false,
): Promise<AnalysisPreviewResult> => {
    if (isNeedCancel) {
        cancelRequest(
            `/api/indicator-management/v1/indicator/query?id=${id}`,
            'post',
        )
    }
    return post(`/api/indicator-management/v1/indicator/query?id=${id}`, params)
}

/**
 * 保存分析配置
 */
export const saveAnalysisPreviewConfig = (
    id: string,
    params: IndicatorAnalysisConfig,
) => {
    return post(
        `/api/indicator-management/v1/indicator/analysis-config?id=${id}`,
        params,
    )
}

/**
 * 获取分析配置
 */
export const getAnalysisPreviewConfig = (params: {
    id: string
}): Promise<IndicatorAnalysisConfig> => {
    return get(`/api/indicator-management/v1/indicator/analysis-config`, params)
}

/**
 * 获取可访问的指标列表
 *
 * 该函数通过发送HTTP GET请求，从后端API获取指标列表和相关统计信息
 * 它使用了Promise来处理异步操作，并返回一个包含指标总数和指标项数组的对象
 *
 * @param params {IindicatorListParams} - 请求参数，遵循IindicatorListParams接口规范
 * @returns {Promise<{ count: number, entries: Array<indicatorInfo> }>} - 返回一个Promise对象，
 * 其resolve值为一个对象，包含总数（count）和指标信息数组（entries）
 */
export const getAccessibleIndicatorsList = (
    params: IindicatorListParams,
): Promise<{
    count: number
    entries: Array<indicatorInfo>
}> => {
    return get(`/api/indicator-management/v1/user/indicator`, params)
}

/**
 * 获取用户指标主题域
 *
 * 该函数通过发送HTTP请求从服务器获取用户指标的主题域信息这些主题域用于在用户界面上展示或过滤指标
 * 使用了Promise来处理异步操作，确保在获取数据完成后能够进行后续操作
 *
 * @returns {Promise<any>} 返回一个Promise对象，包含从API获取的主题域信息
 */
export const getUserIndicatorSubjectDomains = (): Promise<any> => {
    return get(`/api/indicator-management/v1/indicator/subject-domains`)
}

// 获取指标维度规则列表
export const getDimRules = (params: {
    direction?: 'asc' | 'desc'
    indicator_id: string
    limit: number
    offset: number
    sort?: string
}): Promise<any> => {
    return get(`/api/auth-service/v1/indicator-dimensional-rules`, params)
}

// 创建指标维度规则
export const createIndicatorDimRules = (data: {
    created_at?: string
    deleted_at?: string
    updated_at?: string
    id?: string
    spec?: { fields: any[]; id: string; name: string; name_en: string }
}): Promise<any> => {
    return post(`/api/auth-service/v1/indicator-dimensional-rules`, data)
}

// 删除指标维度规则
export const deleteIndicatorDimRules = (id: string): Promise<any> => {
    return del(`/api/auth-service/v1/indicator-dimensional-rules/${id}`)
}

// 获取单个指标维度规则详情
export const getIndicatorDimRuleDetail = (id: string): Promise<any> => {
    return get(`/api/auth-service/v1/indicator-dimensional-rules/${id}`)
}

// 更新单个指标维度规则
export const updateIndicatorDimRule = (
    id,
    data: {
        fields: any[]
        indicator_id: string
        name: string
        row_filters: Record<string, any>
    },
): Promise<any> => {
    return put(
        `/api/auth-service/v1/indicator-dimensional-rules/${id}/spec`,
        data,
    )
}

/**
 * 维度模型异常告警
 * @param {IDimModelAlarmParams} params 告警参数
 * @returns
 */
export const addDimensionModelAlarm = (params: IDimModelAlarmParams) => {
    return post(
        `/api/indicator-management/v1/dimension-model/add-alarm`,
        params,
    )
}
/**
 * 维度模型异常告警查询
 * @returns
 */
export const getDimensionModelAlarm = (params: any) => {
    return get(
        `/api/indicator-management/v1/dimension-model/alarm-list`,
        params,
    )
}

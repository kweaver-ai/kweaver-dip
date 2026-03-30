import requests from '@/utils/request'
import {
    INodeItem,
    IProductQaHistoryDetail,
    ISceneAnalysisComponent,
    ISceneAnalysisComponentResult,
    ISceneItem,
    ICatalogItem,
    ISceneAnalysisAssocAuth,
    IDeptModelCallQuery,
    IDeptModelCallItem,
    IDeptUsageTop10Item,
    IDirectoryUsageStatsItem,
    IModelGrowthStatsItem,
    IQueryAuthStats,
    IQueryCallTrendItem,
    IDeptDirectoryItem,
    IDirectoryUsageTop10Item,
    IDeptUsageItem,
    ISharedDirectoryItem,
    IThemeDirectoryItem,
    IVerifyAuthStats,
    IVerifyDeptUsageTop10Item,
    IVerifyDirectoryTrendItem,
    IVerifyDirectoryUsageTop10Item,
    IVerifyResourceDirectoryItem,
    IVerifyTasksQuery,
    IVerifyTasksResponse,
} from './index.d'
import { SearchAllIndicator } from '../businessGrooming/index.d'
import { ICommonRes } from '../common'
import { IChatHistoryItem } from '../afSailorService/index.d'

const { get, post, put, delete: del } = requests

interface ICommonList<T> {
    entries: T
    limit: number
    offset: number
    total_count: number
}

interface ISearchSceneAnalysis extends SearchAllIndicator {
    name?: string
    catalog_id?: string
}

/**
 * 查询所有场景
 */
export const querySceneAnalysisList = (
    params: ISearchSceneAnalysis,
): Promise<ICommonList<ISceneItem[]>> => {
    return get(`/api/scene-analysis/v1/scene`, params)
}

/*
 * 创建场景分析
 * @name 场景名称
 * @desc 场景描述
 * @returns
 */
export const createSceneAnalysis = (parms: {
    name: string
    desc?: string
    catalog_id?: string
}): Promise<ISceneItem> => {
    return post(`/api/scene-analysis/v1/scene`, parms)
}

/*
 * 编辑场景分析
 * @id 场景id
 * @parms 参数
 * @returns
 */

export const editSceneAnalysis = (parms: {
    id: string
    name: string
    desc?: string
    catalog_id?: string
}): Promise<ISceneItem> => {
    return put(`/api/scene-analysis/v1/scene/meta`, parms)
}

/**
 * 删除场景
 * @sid 场景id
 * @returns
 */
export const deleteSceneAnalysis = (
    sid: string,
): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return del(`/api/scene-analysis/v1/scene/${sid}`)
}

/*
 * 执行场景分析
 */
export const runSceneView = (
    limit: number,
    offset: number,
    params: any,
    need_count: boolean,
    type:
        | 'scene-analysis'
        | 'data-view'
        | 'indicator'
        | 'data_fusion' = 'scene-analysis',
): Promise<{
    err: any
    columns: any
    data: any
    count: number
}> => {
    return post(
        `/api/scene-analysis/v1/scene/exec?limit=${limit}&offset=${offset}&need_count=${need_count}&type=${type}`,
        params,
    )
}

/*
 * 保存场景分析图数据
 * @params 图及图关系数据
 * @returns
 */
export const saveSceneCanvas = (params: {
    id?: string
    canvas: string
    config?: string
    type?: string
}): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return put(`/api/scene-analysis/v1/scene/canvas`, params)
}

/*
 * 获取场景详情
 * @sid 场景id
 * @returns
 */
export const querySceneAnalysisDetail = (sid: string): Promise<ISceneItem> => {
    return get(`/api/scene-analysis/v1/scene/${sid}`)
}

/*
 * 判断场景名称是否重复
 * @sid 场景id
 * @name 场景名称
 * @returns
 */
export const checkSceneAnalysisName = (params: {
    sid?: string
    name: string
}): Promise<{ name: string; repeat: boolean }> => {
    return get(`/api/scene-analysis/v1/scene/name-check`, params)
}

/*
 * 获取场景分析图表结果
 * @id 场景id
 */
export const getSceneAnalysisChartResult = (
    id: string,
): Promise<ISceneAnalysisComponentResult> => {
    return get(`/api/scene-analysis/v1/scene/graph`, { id })
}

/*
 * 预览场景分析图表结果
 * @id 场景id
 */
export const viewSceneAnalysisChartResult = (
    params: ISceneAnalysisComponent,
): Promise<ISceneAnalysisComponentResult> => {
    return post(`/api/scene-analysis/v1/scene/graph`, { ...params })
}

/*
 * 获取场景分析节点列表
 * @id 场景id
 */
export const getSceneAnalysisNodes = (
    id: string,
): Promise<ICommonList<INodeItem[]>> => {
    return get(`/api/scene-analysis/v1/scene/node`, { id })
}

/*
 * 查看场景分析组件
 * @id 组件ID
 */
export const getSceneAnalysisComponent = (
    id: string,
): Promise<ISceneAnalysisComponent> => {
    return get(`/api/scene-analysis/v1/scene/component`, { id })
}

/*
 * 编辑场景分析组件
 */
export const updateSceneAnalysisComponent = (
    params: ISceneAnalysisComponent,
): Promise<any> => {
    return put(`/api/scene-analysis/v1/scene/component`, params)
}

/*
 * 删除场景分析组件
 * @ids 组件ID
 */
export const deleteSceneAnalysisComponents = (id: string): Promise<any> => {
    return del(`/api/scene-analysis/v1/scene/component/${id}`)
}

/*
 * 获取样例数据
 * @scene_id 场景分析id
 * @node_id 场景分析节点id
 */
export const getSceneAnalysisSamples = (
    scene_id: string,
    node_id: string,
): Promise<{
    err: any
    columns: any
    data: any
    count: number
}> => {
    return get(`/api/scene-analysis/v1/scene/samples`, { scene_id, node_id })
}

/*
 * 创建库表画布
 * @params 图及图关系数据
 * @returns
 */
export const postSceneDataView = (params: {
    canvas: string
    config?: string
    name?: string
    type?: string
}): Promise<{
    id: string
    view_sql: string
}> => {
    return post(`/api/scene-analysis/v1/scene/view`, params)
}

/*
 * 编辑库表画布
 * @params 图及图关系数据
 * @returns
 */
export const putSceneDataView = (params: {
    id: string
    canvas: string
    config?: string
    type?: string
}): Promise<{
    id: string
    view_sql: string
}> => {
    return put(`/api/scene-analysis/v1/scene/view`, params)
}

/**
 * 用数问答历史记录
 * @id 数据应用id
 */
export const getProductQaHistory = (
    id: string,
): Promise<ICommonRes<IChatHistoryItem>> => {
    return get(`/api/scene-analysis/v1/data-product/product/${id}/qa-history`)
}

/** 获取问答历史记录详情
 * @id 数据应用id
 * @sid 会话id
 */
export const getProductQaHistoryDetail = (
    params: { id: string; sid: string },
    signal?: AbortSignal,
): Promise<ICommonRes<IProductQaHistoryDetail>> => {
    return get(
        `/api/scene-analysis/v1/data-product/product/${params.id}/qa-history/${params.sid}`,
        undefined,
        { signal },
    )
}

/**
 * 删除问答历史记录
 * @id 数据应用id
 * @sid 会话id
 */
export const deleteProductQaHistory = (
    id: string,
    sid: string,
): Promise<{ status: string }> => {
    return del(
        `/api/scene-analysis/v1/data-product/product/${id}/qa-history/${sid}`,
    )
}

/**  问答点赞/取消点赞/点踩/取消点踩 */
export const putProductQaLike = (
    // 数据应用id
    id: string,
    // 问答id
    qa_id: string,
    params: {
        // like-点赞, dislike-点踩, neutrality-中立, cancel-取消
        action: string
    },
): Promise<{ status: 'success' | 'failure' }> => {
    return put(
        `/api/scene-analysis/v1/data-product/product/${id}/qa/${qa_id}`,
        params,
    )
}

/**
 * 获取场景分析分类树
 */
export const getSceneCatalogTree = (): Promise<{
    catalog_node: ICatalogItem[]
}> => {
    return get(`/api/scene-analysis/v1/scene-catalog/query-tree`)
}

/**
 * 搜索场景分析分类
 */
export const searchSceneCatalog = (params: {
    keyword: string
}): Promise<ICatalogItem[]> => {
    return get(`/api/scene-analysis/v1/scene-catalog`, params)
}

/**
 * 新增场景分析分类
 */
export const addSceneCatalog = (params: {
    catalog_name: string
    parent_id?: string
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/scene-catalog`, params)
}

/**
 * 更新场景分析分类
 */
export const updateSceneCatalog = (
    id: string,
    params: {
        catalog_name: string
    },
): Promise<any> => {
    return put(`/api/scene-analysis/v1/scene-catalog/${id}`, params)
}

/**
 * 删除场景分析分类
 */
export const deleteSceneCatalog = (id: string): Promise<any> => {
    return del(`/api/scene-analysis/v1/scene-catalog/${id}`)
}

/**
 * 检查场景分析分类名称是否重复
 */
export const checkSceneCatalogName = (params: {
    parent_id?: string
    name: string
    id?: string
}): Promise<{ name: string; repeat: boolean }> => {
    return get(`/api/scene-analysis/v1/scene-catalog/name-check`, params)
}

/**
 * 获取场景分析业务关联认证信息
 */
export const getSceneAnalysisAssocAuth =
    (): Promise<ISceneAnalysisAssocAuth> => {
        return get('/api/scene-analysis/v1/business/assoc/auth')
    }

/**
 * 获取部门模型调用统计
 * @param params 查询参数
 */
export const getDeptModelCallStats = (
    params?: IDeptModelCallQuery,
): Promise<IDeptModelCallItem[]> => {
    return get('/api/scene-analysis/v1/business/assoc/dept-model-call', params)
}

/**
 * 获取部门使用统计Top10
 */
export const getDeptUsageTop10 = (): Promise<IDeptUsageTop10Item[]> => {
    return get('/api/scene-analysis/v1/business/assoc/dept-usage-top10')
}

/**
 * 获取目录使用统计
 */
export const getDirectoryUsageStats = (): Promise<
    IDirectoryUsageStatsItem[]
> => {
    return get('/api/scene-analysis/v1/business/assoc/directory-usage-stats')
}

/**
 * 获取模型增长统计
 */
export const getModelGrowthStats = (): Promise<IModelGrowthStatsItem[]> => {
    return get('/api/scene-analysis/v1/business/assoc/model-growth')
}

/**
 * 获取查询认证统计
 */
export const getQueryAuthStats = (): Promise<IQueryAuthStats> => {
    return get('/api/scene-analysis/v1/business/query/auth')
}

/**
 * 获取查询调用趋势统计
 */
export const getQueryCallTrendStats = (
    params?: IDeptModelCallQuery,
): Promise<IQueryCallTrendItem[]> => {
    return get('/api/scene-analysis/v1/business/query/call-trend', params)
}

/**
 * 获取部门目录统计
 */
export const getDeptDirectoryStats = (): Promise<IDeptDirectoryItem[]> => {
    return get('/api/scene-analysis/v1/business/query/dept-directory')
}

/**
 * 获取目录使用Top10统计
 */
export const getDirectoryUsageTop10Stats = (): Promise<
    IDirectoryUsageTop10Item[]
> => {
    return get('/api/scene-analysis/v1/business/query/directory-usage-top10')
}

/**
 * 获取部门使用统计
 */
export const getDeptUsageStats = (): Promise<IDeptUsageItem[]> => {
    return get('/api/scene-analysis/v1/business/query/dept-usage')
}

/**
 * 获取共享目录统计
 */
export const getSharedDirectoryStats = (): Promise<ISharedDirectoryItem[]> => {
    return get('/api/scene-analysis/v1/business/query/shared-directory')
}

/**
 * 获取主题目录统计
 */
export const getThemeDirectoryStats = (params: {
    source_type?: 'query' | 'verify'
}): Promise<IThemeDirectoryItem[]> => {
    return get('/api/scene-analysis/v1/business/query/theme-directory', params)
}

/**
 * 获取验证认证统计
 */
export const getVerifyAuthStats = (): Promise<IVerifyAuthStats> => {
    return get('/api/scene-analysis/v1/business/verify/auth')
}

/**
 * 获取验证部门使用Top10统计
 */
export const getVerifyDeptUsageTop10Stats = (): Promise<
    IVerifyDeptUsageTop10Item[]
> => {
    return get('/api/scene-analysis/v1/business/verify/dept-usage-top10')
}

/**
 * 获取验证目录趋势统计
 */
export const getVerifyDirectoryTrendStats = (
    params?: IDeptModelCallQuery,
): Promise<IVerifyDirectoryTrendItem[]> => {
    return get('/api/scene-analysis/v1/business/verify/directory-trend', params)
}

/**
 * 获取验证目录使用Top10统计
 */
export const getVerifyDirectoryUsageTop10Stats = (): Promise<
    IVerifyDirectoryUsageTop10Item[]
> => {
    return get('/api/scene-analysis/v1/business/verify/directory-usage-top10')
}

/**
 * 获取验证资源目录统计
 */
export const getVerifyResourceDirectoryStats = (): Promise<
    IVerifyResourceDirectoryItem[]
> => {
    return get('/api/scene-analysis/v1/business/verify/resource-directory')
}

/**
 * 获取验证任务统计
 */
export const getVerifyTasksStats = (
    params?: IVerifyTasksQuery,
): Promise<IVerifyTasksResponse> => {
    return get('/api/scene-analysis/v1/business/verify/tasks', params)
}

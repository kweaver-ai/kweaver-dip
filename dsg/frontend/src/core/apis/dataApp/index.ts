import requests from '@/utils/request'
import { IAgentQAParams, IDataAppItem, IDataAppAuthItem } from './index.d'
import { SearchAllIndicator } from '../businessGrooming/index.d'

const { get, post, put, delete: del } = requests

interface ICommonList<T> {
    entries: T
    total_count: number
}

/**
 * 数据产品查询列表
 */
export const queryDataAppList = (
    params: SearchAllIndicator,
): Promise<ICommonList<IDataAppItem[]>> => {
    return get(`/api/scene-analysis/v1/data-product/product`, params)
}

/*
 * 创建数据产品
 * @name 数据产品名称
 * @desc 数据产品描述
 * @returns
 */
export const createDataApp = (parms: {
    name: string
    desc?: string
    image?: string
    config?: {}
}): Promise<IDataAppItem> => {
    return post(`/api/scene-analysis/v1/data-product/product`, parms)
}

/*
 * 编辑数据产品
 * @id 数据产品id
 * @parms 参数
 * @returns
 */

export const editDataApp = (parms: {
    id: string
    name: string
    desc?: string
    image?: string
}): Promise<IDataAppItem> => {
    return put(`/api/scene-analysis/v1/data-product/product/meta`, parms)
}

/*
 * 编辑数据产品配置
 * @id 数据产品id
 * @parms 参数
 * @returns
 */

export const editDataAppConfig = (parms: {
    id: string
    config: {}
}): Promise<IDataAppItem> => {
    return put(`/api/scene-analysis/v1/data-product/product/config`, parms)
}

/**
 * 删除数据产品
 * @sid 数据产品id
 * @returns
 */
export const deleteDataApp = (sid: string): Promise<any> => {
    return del(`/api/scene-analysis/v1/data-product/product/${sid}`)
}

/*
 * 获取数据产品详情
 * @sid 数据产品id
 * @returns
 */
export const queryDataAppDetail = (sid: string): Promise<IDataAppItem> => {
    return get(`/api/scene-analysis/v1/data-product/product/${sid}`)
}

/*
 * 判断数据产品名称是否重复
 * @name 数据产品名称
 * @returns
 */
export const checkDataAppName = (params: {
    name: string
}): Promise<{ name: string; repeat: boolean }> => {
    return get(`/api/scene-analysis/v1/data-product/product/name-check`, params)
}

/*
 * 数据产品测试-问答
 * @id 数据产品id
 * @que 问题内容
 * @session_id 	会话id（首次为空，后端生成，保留预览对话记录使用）
 * @returns
 */
export const testQARequest = (parms: {
    id: string
    que?: string
    chat_history?: []
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/data-product/product/qa`, parms)
}

/*
 * 数据产品预览-问答
 * @id 数据产品id
 * @que 问题内容
 * @config 	数据产品配置
 * @session_id 	会话id（首次为空，后端生成，保留预览对话记录使用）
 * @returns
 */
export const testDebugQARequest = (parms: {
    id: string
    que?: string
    config: {}
    chat_history?: []
    is_changed: boolean
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/data-product/product/qa-debug`, parms)
}

/*
 * 问答历史记录列表
 * @id 	数据产品id
 * @user_id 用户id
 * @returns
 */
export const getQAHistoryRequest = (
    id: string,
): Promise<{ id: string; qa_history: [] }> => {
    return get(`/api/scene-analysis/v1/data-product/product/qa-history/${id}`)
}

/*
 * 问答历史记录详情
 * @session_id 会话id
 * @returns
 */
export const getQAHistoryDetailRequest = (
    session_id: string,
): Promise<{ id: 'string'; session_content: []; session_id: 'string' }> => {
    return get(
        `/api/scene-analysis/v1/data-product/product/qa-history/detail/${session_id}`,
    )
}

/*
 * 图片上传接口
 * @file 文件的二进制流
 * @returns
 */
export const uploadImageRequest = (parms: any): Promise<{ id: 'string' }> => {
    return post(`/api/scene-analysis/v1/data-product/oss`, parms)
}

/*
 * 查询授权列表接口
 * @params 数据应用id
 * @returns
 */
export const getDataProductAuthListById = (
    id: string,
): Promise<Record<string, any>> => {
    return get(`/api/scene-analysis/v1/data-product/product/authorize/${id}`)
}

/*
 * 查询授权列表接口
 * @params 数据应用id
 * @returns
 */
export const authDataProduct = (
    params: IDataAppAuthItem,
): Promise<Record<string, any>> => {
    return post(`/api/scene-analysis/v1/data-product/product/authorize`, params)
}

/*
 * agent问答
 * @params 请求参数
 * @returns
 */
export const agentQA = (
    params: IAgentQAParams,
): Promise<Record<string, any>> => {
    return post(`/api/af-sailor-agent/v1/assistant/dpqa/agent`, params)
}

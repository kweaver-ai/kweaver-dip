import requests from '@/utils/request'
import { CodeTableInfo, CodeTableDetail } from './index.d'
import { ICommonRes, SortDirection } from '../common'

const { get, post, put, delete: del } = requests

/**
 * 获取码表列表
 * @param params
 * @returns
 */
export const getCodeTableList = (params: {
    keyword?: string
    offset?: number
    limit?: number
}): Promise<ICommonRes<CodeTableInfo>> => {
    return get(
        `/api/standardization/v1/standardization/dataelement/dict`,
        params,
    )
}

/**
 * 获取码表详情
 * @param code
 * @returns
 */
export const getCodeTableDetail = (code: string): Promise<CodeTableDetail> => {
    return get(
        `/api/standardization/v1/standardization/dataelement/dict/code/${code}`,
    )
}

/**
 * 标准化推荐
 * @param params
 * @returns
 */
export const getStandardRecommend = (params: any): Promise<any> => {
    return post(
        `/api/external-plugin-framework/v1/standardization/dataelement/std-rec`,
        params,
    )
}

/**
 * 检索字段标准列表
 * 需要删除的接口
 * @param params
 * @returns
 */
export const formsQueryStandards = (params: any): Promise<any> => {
    return get(
        `/api/external-plugin-framework/v1/standardization/dataelement`,
        params,
    )
}

/**
 * 检索字段标准详情
 * @param type 参数传入类型：1：码表唯一标识id 2：码表code
 * @param value 传入的标识值，具体传入的值根据type确定
 * @returns
 */
export const formsQueryStandardItem = (params: any): Promise<any> => {
    return get(`/api/standardization/v1/dataelement/detail`, {
        type: params?.type || params?.id ? 1 : 2,
        value: params?.value || params?.id || params?.code,
    })
}

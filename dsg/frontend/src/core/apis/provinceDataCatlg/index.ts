import requests from '@/utils/request'
import {
    IPrvcDataCatlgDB,
    IPrvcDataCatlgFile,
    IPrvcDataCatlgInfoItem,
    IPrvcDataCatlgApi,
    IPrvcDataCatlgListItem,
    IPrvcDataCatlgListQuery,
    IPrvcDataCatlgDetail,
} from './index.d'
import { ICommonList, IListParams } from '@/core'

const { get, post, put, delete: del } = requests

/**
 * 获取资源分类目录
 * @param params
 * @returns
 */
export const getPrvcDataCatlgList = (
    id,
    params?: IPrvcDataCatlgListQuery,
): Promise<ICommonList<IPrvcDataCatlgListItem[]>> => {
    return get(`/api/sszd-service/v1/catalog/${id}/items`, params)
}

/**
 * 目录接口信息
 * @param params
 * @returns
 */
export const getPrvcDataCatlgDetailById = (
    id,
): Promise<IPrvcDataCatlgDetail> => {
    return get(`/api/sszd-service/v1/catalog/${id}`)
}

/**
 * 同步省级目录
 * @param params
 * @returns
 */
export const synchPrvcDataCatlg = (): Promise<IPrvcDataCatlgDetail> => {
    return get(`/api/sszd-service/v1/catalog/api/synch`)
}

/**
 * 信息项信息
 * @param params
 * @returns
 */
export const getPrvcDataCatlgInfoItemById = (
    id: string,
    params?: IListParams,
): Promise<ICommonList<IPrvcDataCatlgInfoItem[]>> => {
    return get(`/api/sszd-service/v1/catalog/${id}/items`, params)
}

/**
 * 库表信息
 * @param id
 * @returns
 */
export const getPrvcDataCatlgDBById = (id): Promise<IPrvcDataCatlgDB> => {
    return get(`/api/sszd-service/v1/catalog/db/${id}`)
}

/**
 * 接口信息
 * @param id
 * @returns
 */
export const getPrvcDataCatlgInterfaceById = (
    id,
): Promise<IPrvcDataCatlgApi> => {
    return get(`/api/sszd-service/v1/catalog/api/${id}`)
}

/**
 * 目录文件信息
 * @param id
 * @returns
 */
export const getPrvcDataCatlgFileById = (id): Promise<IPrvcDataCatlgFile> => {
    return get(`/api/sszd-service/v1/catalog/file/${id}`)
}

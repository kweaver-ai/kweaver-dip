import requests from '@/utils'
import { IMetaDataFields } from './index.d'

const { get, post, put, delete: del } = requests
/**
 * 查询元数据 类目管理
 */
export const getMetaDataTree = (): Promise<any> => {
    return get(`/api/metadata-manage/v1/catagory`)
}
/**
 * 查询元数据 表字段
 */
export const getMetaDataList = (params): Promise<any> => {
    return get(`/api/metadata-manage/v1/table`, params)
}
/**
 * 查询元数据 表字段
 */
export const getMetaDataFields = (params: IMetaDataFields): Promise<any> => {
    return get(
        `/api/metadata-manage/v1/datasource/${params.dsId}/schema/${params.schemaId}/table/${params.tableId}`,
    )
}

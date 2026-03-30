import requests from '@/utils/request'
import {
    ICAFileItem,
    IDataConsanguinityParams,
    ICAFileListParams,
    IPreviewCAFileParams,
    IPreviewCAFileRes,
    IDownloadCAFileParams,
    IDownloadCAFileRes,
} from './index.d'
import {
    ItagCategoryCreate,
    IGetListParams,
    ICommonList,
    ITagCategoryRes,
    ITagCategoryDetails,
    ItagAuthCreate,
    TagDetailsType,
    ITagAuthListParams,
    ICommonRes,
} from '@/core'
import { PolicyType } from '@/components/AuditPolicy/const'

const { get, post, put, delete: del } = requests

/**
 * 查询数据血缘
 */
export const getDataConsanguinity = (
    params: IDataConsanguinityParams,
): Promise<any> => {
    return get(`/api/basic-bigdata-service/v1/data-lineage`, params)
}

// -- 标签分类 --
/**
 * 标签列表
 */
export const getTagCategory = (
    params: Partial<IGetListParams>,
): Promise<ICommonList<ITagCategoryRes[]>> => {
    return get(
        `/api/basic-bigdata-service/v1/label/category/page-label`,
        params,
    )
}

export const getTagCategoryExcludeTreeNode = (
    params: Partial<IGetListParams>,
): Promise<ICommonList<ITagCategoryRes[]>> => {
    return get(`/api/basic-bigdata-service/v1/label/category/page`, params)
}

/**
 * 创建标签分类
 */
export const tagCategoryCreate = (
    params: Partial<ItagCategoryCreate>,
): Promise<any> => {
    return post(`/api/basic-bigdata-service/v1/label/category/save`, params)
}
/**
 * 更新标签分类
 */
export const tagCategoryUpdate = (
    params: Partial<ItagCategoryCreate>,
): Promise<any> => {
    return put(`/api/basic-bigdata-service/v1/label/category/update`, params)
}
/**
 * 标签分类启用停用
 */
export const tagCategoryUpdateState = (params: {
    id: string
    state: number
}): Promise<any> => {
    return put(
        `/api/basic-bigdata-service/v1/label/category/update-state`,
        params,
    )
}

/**
 * 删除标签分类
 */
export const tagCategoryRemoves = (id: string): Promise<string> => {
    return del(`/api/basic-bigdata-service/v1/label/category/${id}`)
}
/**
 * 删除标签分类草稿
 */
export const tagCategoryDraftRemoves = (id: string): Promise<string> => {
    return del(`/api/basic-bigdata-service/v1/label/category/draft/${id}`)
}

/**
 * 标签详情 -- 授权列表
 */
export const getTagAppDetails = (id: string): Promise<ITagCategoryDetails> => {
    return get(`/api/basic-bigdata-service/v1/label/apps/detail/${id}`)
}
/**
 * 标签详情 -- 分类详情
 */
export const getTagCategoryDetails = (
    id: string,
): Promise<ITagCategoryDetails> => {
    return get(`/api/basic-bigdata-service/v1/label/category/detail/${id}`)
}
/**
 * 标签详情 -- 根据类型查询分类详情
 */
export const getTagCategoryDetailsByType = (params: {
    id: string
    type: TagDetailsType
    is_draft?: boolean
}): Promise<ITagCategoryDetails> => {
    return get(`/api/basic-bigdata-service/v1/label/category/detail`, params)
}

//  -- 标签授权 --
/**
 * 标签授权应用列表
 */
export const getTagAuthList = (
    params: Partial<ITagAuthListParams>,
): Promise<any> => {
    return get(`/api/basic-bigdata-service/v1/label/apps/page`, params)
}
/**
 * 创建标签授权
 */
export const tagAuthCreate = (
    params: Partial<ItagAuthCreate>,
): Promise<any> => {
    return post(`/api/basic-bigdata-service/v1/label/apps/save`, params)
}
/**
 * 创建标签授权 -- 批量
 */
export const tagAuthBatchCreate = (params: {
    category_apps_list: ItagAuthCreate[]
}): Promise<any> => {
    return post(`/api/basic-bigdata-service/v1/label/apps/batch-save`, params)
}
/**
 * 开启智能标签授权
 */
export const tagAuthUpdateState = (params: {
    id: string
    type: number
}): Promise<any> => {
    return put(`/api/basic-bigdata-service/v1/label/apps/update-type`, params)
}
/**
 * 删除标签授权
 */
export const tagAuthDetele = (id: string): Promise<any> => {
    return del(`/api/basic-bigdata-service/v1/label/apps/${id}`)
}

// -- 业务标签应用 --
/**
 * 获取标签推荐列表
 */
export const getTagRecommend = (params: any): Promise<any> => {
    return post(
        `/api/basic-bigdata-service/v1/label/recommend/batch-list`,
        params,
    )
}
/**
 * 获取标签推荐列表
 */
export const getTagByIds = (ids: string[]): Promise<any> => {
    let params = ''
    ids.forEach((id) => {
        // eslint-disable-next-line
        params = `id=${id}${params ? '&' : ''}` + params
    })
    return get(`/api/basic-bigdata-service/v1/label/getByIds?${params}`)
}
/**
 * 获取标签审核列表
 */
export const getTagAuditList = (params: any): Promise<any> => {
    return get(`/api/basic-bigdata-service/v1/label/category/audit`, params)
}
/**
 * 取消标签审核
 */
export const tagAuditCancel = (params: {
    id: string
    audit_type: PolicyType
}): Promise<any> => {
    return put(
        `/api/basic-bigdata-service/v1/label/category/${params.id}/audit/cancel`,
        params,
    )
}

// ****************************************** 认知业务平台-文件管理 start ******************************************
// 分页查询文件列表
export const getCAFileList = (
    params: ICAFileListParams,
): Promise<ICommonRes<ICAFileItem>> => {
    let jointIdsParams = ''

    const { related_object_id, ...rest } = params
    related_object_id?.forEach((id) => {
        // eslint-disable-next-line
        jointIdsParams = `related_object_id=${id}${
            jointIdsParams ? '&' : ''
        }${jointIdsParams}`
    })
    return get(
        `/api/basic-bigdata-service/v1/file-management/page${
            jointIdsParams ? `?${jointIdsParams}` : ''
        }`,
        rest,
    )
}

// 根据文件ID和pdf对象存储ID返回文件流预览文件
export const previewCAFileById = (
    params: IPreviewCAFileParams,
): Promise<any> => {
    return get(
        `/api/basic-bigdata-service/v1/file-management/preview-pdf`,
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}

// 根据文件ID和pdf对象存储ID返回href，使用链接预览文件
export const previewCAFileHrefById = (
    params: IPreviewCAFileParams,
): Promise<IPreviewCAFileRes> => {
    return get(
        `/api/basic-bigdata-service/v1/file-management/preview-pdf-href`,
        params,
        // {
        //     responseType: 'arraybuffer',
        // },
    )
}

// 根据文件ID和对象存储ID下载文件
export const downloadCAFileById = (
    params: IDownloadCAFileParams,
): Promise<any> => {
    return get(`/api/basic-bigdata-service/v1/file-management/down`, params, {
        responseType: 'arraybuffer',
    })
}

// 根据id删除文件
export const delCAFileById = (id: string): Promise<any> => {
    return del(`/api/basic-bigdata-service/v1/file-management/${id}`)
}

// ****************************************** 认知业务平台-文件管理 end ******************************************

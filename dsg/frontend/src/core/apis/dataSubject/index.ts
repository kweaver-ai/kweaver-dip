import requests from '@/utils/request'
import {
    IAttributeWithLabel,
    IBusinessRecItems,
    ICategories,
    ICategory,
    ICheckGlossary,
    IClassification,
    IClassificationData,
    IClassificationFieldData,
    IClassificationStatsData,
    IDataListTemplate,
    IGetBusinessRecListQuery,
    IGetFormRelatedAttribute,
    ISubjectDomainItem,
    IUpdateFormRelatedAttribute,
    LoginEntity,
    RefInfo,
    SubjectDomainParams,
} from './index.d'
import { ICommonRes } from '../common'

const { get, post, put, delete: del } = requests
/**
 * 主题域列表查询
 * @param params
 * @returns
 */
export const getSubjectDomain = (
    params?: Partial<SubjectDomainParams>,
): Promise<IDataListTemplate<ISubjectDomainItem>> => {
    return get(`/api/data-subject/v1/subject-domains`, params)
}

/**
 * 主题域对象查询
 * @param id
 * @returns
 */
export const getSubjectDomainDetail = (
    id: string,
): Promise<IDataListTemplate<ISubjectDomainItem>> => {
    return get(`/api/data-subject/v1/subject-domain`, { id })
}

/**
 * 获取对象详情以及子孙节点
 * @param id
 * @param display  tree/list
 * @returns
 */
export const getSubjectDomainDetailAndChild = (
    id: string,
    display?: 'tree' | 'list',
) => {
    return get(`/api/data-subject/v1/subject-domain/child`, { id, display })
}

/**
 * 名称重复校验
 * @param params
 * @returns
 */
export const checkGlossaryName = (params: ICheckGlossary) => {
    return post(`/api/data-subject/v1/subject-domain/check`, params)
}

/**
 * 新建对象
 * @param params
 * @returns
 */
export const addCategories = (params: ICategories) => {
    return post(`/api/data-subject/v1/subject-domain`, params)
}

/**
 * 获取对象详情
 */
export const getCategoriesDetails = (id: string) => {
    return get(`/api/data-subject/v1/subject-domain?id=${id}`)
}

/**
 * 更新对象
 * @param params
 * @returns
 */
export const editCategories = (params: ICategory) => {
    return put(`/api/data-subject/v1/subject-domain`, params)
}
/**
 * 删除对象
 */
export const delCategories = (id: string) => {
    return del(`/api/data-subject/v1/subject-domain/${id}`)
}

// 获取当前节点下的层级统计信息
export const getGlossaryCount = (id: string) => {
    return get(`/api/data-subject/v1/subject-domain/count?id=${id}`)
}

// 获取定义
export const getBusinessObjDefine = (
    id: string,
): Promise<{ logic_entities: LoginEntity[]; ref_info: RefInfo[] }> => {
    return get(`/api/data-subject/v1/subject-domain/logic-entity?id=${id}`)
}

// 编辑定义
export const updateBusinessObjDefine = (params: {
    id: string
    logic_entities: LoginEntity[]
    ref_id: RefInfo[]
}) => {
    return post(`/api/data-subject/v1/subject-domain/logic-entity`, params)
}

// 检验循环引用
export const checkBusinessObjReference = (params: {
    id: string
    ref_id: string
}) => {
    return get(
        `/api/data-subject/v1/subject-domain/business-object/check-references`,
        params,
    )
}

// 业务表处编辑多个业务对象/业务活动定义
export const updateObjsDefine = (params: {
    form_id: string
    contents: {
        id: string
        logic_entities: LoginEntity[]
    }[]
}) => {
    return post(
        `/api/data-subject/v1/subject-domain/business-object/context`,
        params,
    )
}

export const updateFormRelatedAttribute = (
    params: IUpdateFormRelatedAttribute,
) => {
    return requests.post(`/api/data-subject/v1/forms/subject`, params)
}

export const getFormRelatedAttribute = (params: {
    fid: string
}): Promise<IGetFormRelatedAttribute> => {
    return requests.get(`/api/data-subject/v1/forms/subject`, params)
}

/**
 * 导出主题域
 * @param ids L3层级的id
 */
export const exportSubjectDomains = (ids: string[]) => {
    return post(
        `/api/data-subject/v1/subject-domains/export`,
        { ids },
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 导入主题域
 */
export const importSubjectDomains = (file: FormData) => {
    return post(`/api/data-subject/v1/subject-domains/import`, file, {
        timeout: 5 * 60 * 1000,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 下载主题域模板
 */
export const downloadSubjectDomainsTemplate = () => {
    return get(`/api/data-subject/v1/subject-domains/template`, undefined, {
        responseType: 'arraybuffer',
    })
}

export const getAttributesByParentId = (params: {
    parent_id?: string
    keyword?: string
    view_id?: string
    field_id?: string
}): Promise<{ attributes: IAttributeWithLabel[] }> => {
    return requests.get(
        `/api/data-subject/v1/subject-domain/attributes`,
        params,
    )
}

/**
 * 查询分类分级统计信息
 */
export const getClassification = (
    params: IClassification,
): Promise<ICommonRes<IClassificationData>> => {
    return requests.get(`/api/data-subject/v1/classification`, params)
}

/**
 * 查询分类分级的库表字段信息
 */
export const getClassificationField = (
    params: Omit<IClassification, 'display'>,
): Promise<ICommonRes<IClassificationFieldData>> => {
    return requests.get(`/api/data-subject/v1/classification/field`, params)
}

/**
 * 查询分类分级的库表字段信息 [分页]
 */
export const getClassificationFields = (
    params: Omit<IClassification, 'display'>,
): Promise<ICommonRes<IClassificationFieldData>> => {
    return requests.get(`/api/data-subject/v1/classification/fields`, params)
}

/**
 * 查询分类分级的统计数据
 */
export const getClassificationStats = (
    id?: string,
): Promise<IClassificationStatsData> => {
    return requests.get(`/api/data-subject/v1/classification/stats`, { id })
}

export const getBusinessRecList = (params: {
    query: IGetBusinessRecListQuery[]
}): Promise<{ items: IBusinessRecItems[] }> => {
    return requests.post(
        `/api/data-subject/v1/subject-domain/query-business-rec-list`,
        params,
    )
}

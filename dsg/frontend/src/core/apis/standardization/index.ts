import { Key } from 'react'
import { CatalogType, CatalogOption } from '../common'
import requests, { StdStatus } from '@/utils'
import {
    IDataEleQueryItem,
    IDictQuery,
    IDictItem,
    IAddFileItem,
    IStdCommonRes,
    ICreateCodeRule,
    ICRuleItem,
    ICRuleQuery,
    ICodeRuleDataElement,
    IFileQuery,
    StateType,
    StdFileCatlgType,
    ICheckDictRepeat,
    ICheckDataEleRepeat,
    IQueryDEByFileCatlg,
    IQueryDEByFileId,
    IBusinTableField,
    IPendingBusinsTableFieldQuery,
    IPendingBusinsTableQuery,
    IPendingRes,
    IBusinTable,
    IStdRecParams,
    IStdRecRes,
    IRuleRecParams,
    IRuleRecRes,
} from './index.d'

const { get, post, put, delete: del } = requests

// ------------------------------原codingRule--------------------------------

/**
 * 获取编码规则列表
 * @param query 其中，catalog_id,status为必填项
 * @returns
 */
export const getCRuleListBySearch = (
    query: ICRuleQuery,
): Promise<IStdCommonRes<ICRuleItem[]>> => {
    return get(`/api/standardization/v1/rule`, query)
}

/**
 * 获取编码规则列表 通过文件目录
 * @param query 其中，catalog_id,status为必填项
 * @returns
 */
export const getCRuleListByFileCatalogSearch = (
    query: ICRuleQuery,
): Promise<IStdCommonRes<ICRuleItem[]>> => {
    return get(`/api/standardization/v1/rule/queryByStdFileCatalog`, query)
}

/**
 * 获取编码规则列表 通过文件
 * @param query 其中，catalog_id,status为必填项
 * @returns
 */
export const getCRuleListByFileSearch = (
    query: ICRuleQuery,
): Promise<IStdCommonRes<ICRuleItem[]>> => {
    return get(`/api/standardization/v1/rule/queryByStdFile`, query)
}
// 创建编码规则
export const createCodeRule = (params: ICreateCodeRule) => {
    return post(`/api/standardization/v1/rule`, params)
}

// 修改编码规则
export const updateCodeRule = (id: string, params: ICreateCodeRule) => {
    return put(`/api/standardization/v1/rule/${id}`, params)
}

// 编码规则详情
export const getCodeRuleDetails = (
    id: string,
): Promise<IStdCommonRes<ICRuleItem>> => {
    return get(`/api/standardization/v1/rule/${id}`)
}

// 查询关联编码规则关联的文件
export const getCodeRuleReletionFilesInfo = (
    id: string,
    query: { limit?: number; offset?: number },
) => {
    return get(`/api/standardization/v1/rule/relation/stdfile/${id}`, query)
}

// 根据id获取编码规则
export const getCodeRulesByIds = (params: {
    ids: Array<string>
}): Promise<IStdCommonRes<ICRuleItem[]>> => {
    return post(`/api/standardization/v1/rule/queryByIds`, params)
}
// 查询编码规则的引用
export const getCodeRuleDataElement = (
    id: string,
    query: { limit?: number; offset?: number },
): Promise<IStdCommonRes<ICodeRuleDataElement[]>> => {
    return get(`/api/standardization/v1/rule/relation/de/${id}`, query)
}

// 删除
export const delCodeRule = (id: string) => {
    return del(`/api/standardization/v1/rule/${id}`)
}

// 批量删除
export const batchDelCodeRules = (ids: string[]) => {
    return del(`/api/standardization/v1/rule/${ids.join(',')}`)
}

// 更新状态
export const updateCodeRuleStatus = (
    id: string,
    params: {
        state: StateType
        reason?: string
    },
) => {
    return put(`/api/standardization/v1/rule/state/${id}`, params)
}

export const checkCodeRuleName = (name: string, id?: string | '') => {
    return get(`/api/standardization/v1/rule/queryDataExists`, {
        name,
        filter_id: id,
    })
}

/**
 * 根据码表id查询码表信息
 * @param ids
 * @returns
 */
export const getCodeTableByIds = (ids: Array<string>) => {
    return post(`/api/standardization/v1/dataelement/dict/queryByIds`, { ids })
}

// ------------------------------原dataEle--------------------------------

/**
 * 分页获取数据元
 * @param params any
 * @returns
 */
export const getDataElement = (params: any) => {
    return get('/api/standardization/v1/dataelement', params)
}

/**
 * 按文件目录检索数据元列表-分页获取数据元
 * @param params any
 * @returns
 */
export const getDataElementByFileCatlg = (params: IQueryDEByFileCatlg) => {
    return get(
        '/api/standardization/v1/dataelement/query/byStdFileCatalog',
        params,
    )
}

/**
 * 按文件id检索数据元列表-分页获取数据元
 * @param params any
 * @returns
 */
export const getDataElementByFileId = (params: IQueryDEByFileId) => {
    return get('/api/standardization/v1/dataelement/query/byStdFile', params)
}

/**
 * 添加数据元
 * @param params
 * @returns
 */
export const addDataEle = (params: IDataEleQueryItem) => {
    return post('/api/standardization/v1/dataelement', params)
}

/**
 * 编辑/修改数据元属性
 * @param id 数据元id
 * @param params
 * @returns
 */
export const editDatEle = (id: string, params: IDataEleQueryItem) => {
    return put(`/api/standardization/v1/dataelement/${id}`, params)
}

//
/**
 * 更新状态
 * @params ids 唯一标识多个id用','拼接，长度在2000以内
 */
export const changeDataEleState = (
    ids: string,
    params: {
        state: StateType
        reason?: string
    },
) => {
    return put(`/api/standardization/v1/dataelement/state/${ids}`, params)
}

/**
 * 校验数据元名称是否重复
 * @param params
 * @param file
 * @returns
 */
export const checkDataEleNameUnique = (params: ICheckDataEleRepeat) => {
    return get(`/api/standardization/v1/dataelement/query/isRepeat`, params)
}

/**
 * 获取数据元单例属性
 * @param type type：默认1，id匹配；type:2,code匹配
 * @param value 若type为1，为id， 若type为2，则为code
 * @returns
 */
export const getDataEleDetailById = (query: {
    type: number
    value: string
}) => {
    return get(`/api/standardization/v1/dataelement/detail`, query)
}

/**
 * 获取数据元关联文件
 * @param type type：默认1，id匹配；type:2,code匹配
 * @param value 若type为1，为id， 若type为2，则为code
 * @returns
 */
export const getDataEleAssociateFileList = (params: {
    id: string
    offset: number
    limit: number
}) => {
    const { id, offset, limit } = params
    return get(`/api/standardization/v1/dataelement/query/stdFile?id=${id}`, {
        offset,
        limit,
    })
}

/**
 * 通过查询结果批量导出数据元
 * @param query { catalog_id: string, keyword: string, std_type: number | undefined, status: number}
 * 若query无值则下载模板文件
 * @returns
 */
export const exportDataEleBySearch = (query?: any) => {
    let params = ''
    if (query.catalog_id) {
        params += `catalog_id=${query.catalog_id}`
    }
    if (query.keyword) {
        params += `&keyword=${query.keyword}`
    }
    if (query.std_type) {
        params += `&std_type=${query.std_type}`
    }
    if (query.status) {
        params += `&status=${query.status}`
    }
    return post(
        `/api/standardization/v1/dataelement/export${
            params ? `?${params}` : ''
        }`,
        undefined,
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 通过id集合批量导出数据元
 * @param ids
 * @returns
 */
export const exportDataEleByIds = (ids: string) => {
    return post(
        `/api/standardization/v1/dataelement/export/${ids}`,
        {},
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 批量导入数据元
 * @param cid
 * @param file
 * @returns
 */
export const importDataEle = (cid: string, file: FormData) => {
    // 超时时候设置3min
    return post(
        `/api/standardization/v1/dataelement/import?catalog_id=${cid}`,
        file,
        {
            timeout: 3 * 60 * 1000,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // responseType: 'arraybuffer',
        },
    )
}

/**
 * 通过id集合删除数据元
 * @param ids
 * @returns
 */
export const delDataEleByIds = (ids: string) => {
    return del(`/api/standardization/v1/dataelement/${ids}`)
}

/**
 * 通过id集合移动数据元
 * @param newDirId 移动至新目录id
 * @param ids 选中行的id拼接字符串
 * @returns
 */
export const moveDataEleByIds = (newDirId: Key, ids: any) => {
    return put(`/api/standardization/v1/dataelement/move_catalog/${ids}`, {
        catalog_id: newDirId,
    })
}

export const moveCodeRuleByIds = (newDirId: Key, ids: any) => {
    return post(`/api/standardization/v1/rule/catalog/remove`, {
        catalog_id: newDirId,
        ids,
    })
}

// ------------------------------原dict--------------------------------

/**
 * 分页获取码表
 * @param params IDictQuery
 * @returns
 */
export const getDictList = (params: IDictQuery) => {
    return get('/api/standardization/v1/dataelement/dict', params)
}

/**
 * 通过文件目录id获取关联码表
 * @param params IDictQuery
 * @returns
 */
export const getDictListByFileCatlgId = (params: IDictQuery) => {
    return get(
        '/api/standardization/v1/dataelement/dict/queryByStdFileCatalog',
        params,
    )
}

/**
 * 通过文件id获取关联码表
 * @param params IDictQuery
 * @returns
 */
export const getDictListByFileId = (params: IDictQuery) => {
    return get(
        '/api/standardization/v1/dataelement/dict/queryByStdFile',
        params,
    )
}

/**
 * 添加码表
 * @param params
 * @returns
 */
export const addDict = (params: IDictItem) => {
    return post('/api/standardization/v1/dataelement/dict', params)
}

/**
 * 编辑/修改码表属性
 * @param id 码表id
 * @param params
 * @returns
 */
export const editDict = (id: string, params: IDictItem) => {
    return put(`/api/standardization/v1/dataelement/dict/${id}`, params)
}

// 更新状态
export const changeDictState = (
    id: string,
    params: {
        state: StateType
        reason?: string
    },
) => {
    return put(`/api/standardization/v1/dataelement/dict/state/${id}`, params)
}

/**
 * 校验码表名称是否重复
 * @param params
 * @param file
 * @returns
 */
export const checkDictNameUnique = (params: ICheckDictRepeat) => {
    return get(
        `/api/standardization/v1/dataelement/dict/queryDataExists`,
        params,
    )
}

/**
 * 获取码表单例属性
 * @param dictId 码表id
 * @returns
 */
export const getDictDetailById = (dictId: string) => {
    return get(`/api/standardization/v1/dataelement/dict/${dictId}`)
}

/**
 * 通过id查找引用码表的数据元集合
 * @param dictId 码表id
 * @returns
 */
export const getDictQuoteListById = (
    dictId: string,
    query: { limit?: number; offset?: number },
) => {
    return get(
        `/api/standardization/v1/dataelement/dict/dataelement/${dictId}`,
        query,
    )
}

/**
 * 查询码表关联的标准文件
 * @returns
 */
export const getDictAssociatedFile = (
    dictId: string,
    query: { limit?: number; offset?: number },
) => {
    return get(
        `/api/standardization/v1/dataelement/dict/relation/stdfile/${dictId}`,
        query,
    )
}

/**
 * 获取码表单例属性
 * @param dictId 码表code
 * @returns
 */
export const getDictDetailByCode = (dictCode: string) => {
    return get(`/api/standardization/v1/dataelement/dict/code/${dictCode}`)
}

/**
 * 获取码表中码值相关值
 * @param dictId 码表code
 * @returns
 */
export const getDictValuesBySearch = (query: IDictQuery) => {
    return get(`/api/standardization/v1/dataelement/dict/enum`, query)
}

/**
 * 导出码表模板
 * @returns
 */
export const exportDictTemplate = () => {
    return post(
        `/api/standardization/v1/dataelement/dict/export/template`,
        undefined,
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 通过目录id或者码表id集合批量导出码表
 * @param ids
 * @returns
 */
export const exportDict = (catalog_id?: string, ids?: Array<Key>) => {
    let reqParams: any
    if (catalog_id) {
        reqParams = {
            catalog_id,
        }
    }
    if (ids && ids.length) {
        reqParams = {
            ...reqParams,
            ids,
        }
    }
    return post(`/api/standardization/v1/dataelement/dict/export`, reqParams, {
        responseType: 'arraybuffer',
    })
}

/**
 * 批量导入码表
 * @param cid
 * @param file
 * @returns
 */
export const importDict = (cid: string, file: FormData) => {
    return post(
        `/api/standardization/v1/dataelement/dict/import?catalog_id=${cid}`,
        file,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // responseType: 'arraybuffer',
        },
    )
}

/**
 * 通过id删除码表
 * @param ids
 * @returns
 */
export const delDictById = (ids: string) => {
    return del(`/api/standardization/v1/dataelement/dict/${ids}`)
}

/**
 * 通过id集合删除码表
 * @param ids
 * @returns
 */
export const delDictByIds = (ids: string) => {
    return del(`/api/standardization/v1/dataelement/dict/batch/${ids}`)
}

/**
 * 通过id集合移动码表
 * @param newDirId 移动至新目录id
 * @param ids 选中行的id数组
 * @returns
 */
export const moveDictByIds = (newDirId: Key, ids: []) => {
    return post(`/api/standardization/v1/dataelement/dict/catalog/remove`, {
        catalog_id: newDirId,
        ids,
    })
}

/**
 * 新增/编辑码表时查询码表名称是否重复
 * @param id 码表id
 * @param ch_name 中文名称
 * @param en_name 英文名称
 * @param org_type 标准分类
 * @returns
 */
export const isDictExists = (query: {
    id?: string
    ch_name?: string
    en_name?: string
    org_type: number
}) => {
    let params = ''
    if (query.id) {
        params += `id=${query.id}`
    }
    if (query.ch_name) {
        params += `&ch_name=${query.ch_name}`
    }
    if (query.en_name) {
        params += `&en_name=${query.en_name}`
    }
    if (query.org_type) {
        params += `&org_type=${query.org_type}`
    }
    return get(`/api/standardization/v1/dataelement/dict/exist?${params}`)
}

// ------------------------------原directory--------------------------------

// 目录节点类型
export interface IDirItem {
    id: string
    catalog_name: string
    level?: string
    description?: string
    isEditing?: boolean
    parent_id?: string
    type?: number
    authority_id?: number
    children?: IDirItem[]
    count?: number
    isLeaf?: boolean
    // 标准文件目录类型-目录/文件
    stdFileCatlgType?: StdFileCatlgType
}

/**
 * 目录请求类型
 * type: 目录类型：1-数据元，2-码表，3-编码规则，4-文件
 * catalog_name：目录名称
 * id：目录id
 * parent_id：父目录id
 * catlgOption 目录选项类型
 */
export interface IDirQueryType {
    type?: CatalogType
    catalog_name?: string
    id?: string
    parent_id?: string
    catlgOption?: CatalogOption
}

/**
 * 通过目录类型或id查询目录自身及全部子集
 * @param type 目录类型：1-数据元，2-码表，3-编码规则，4-文件
 * @param id 目录id
 * @returns
 */
export const getDirDataByTypeOrId = (type: number, id?: number) => {
    return get('/api/standardization/v1/catalog/query_tree', {
        type,
        id,
    })
}

/**
 * 通过文件ID获取文件目录及其子集、文件并统计文件关联的数据量
 * @param type 目录类型：1-数据元，2-码表，3-编码规则
 * @param id 目录id
 * @returns
 */
export const getFileDirByTypeOrId = (type: number, id?: string) => {
    return get('/api/standardization/v1/catalog/query_tree_by_file', {
        type,
        id,
    })
}

// 通过目录名称检索文件目录与文件列表
export const queryFileCatlgOrFile = (catalog_name: string) => {
    return get(`/api/standardization/v1/catalog/query/with_file`, {
        catalog_name,
    })
}

/**
 * 搜索查询目录列表
 * @param query
 * @param type 目录类型：1-数据元，2-码表，3-编码规则，4-文件
 * @param catalog_name 目录名称
 * @returns
 */
export const getDirDataBySearch = (
    query?: IDirQueryType,
): Promise<IDirItem> => {
    return get(`/api/standardization/v1/catalog/query`, {
        type: query?.type,
        catalog_name: query?.catalog_name,
    })
}

/**
 * 添加目录信息
 * @param params 目录信息
 * @returns
 */
export const addDir = (params: IDirQueryType): Promise<any> => {
    return post(`/api/standardization/v1/catalog`, params)
}

/**
 * 修改目录信息
 * @param id 目录id
 * @params {type, catalog_name}
 * @returns
 */
export const updateDirById = (
    id: string,
    params: IDirQueryType,
): Promise<any> => {
    return put(`/api/standardization/v1/catalog/${id}`, params)
}

/**
 * 删除目录信息及其子集信息
 * @param id 目录id
 * @returns
 */
export const delDirById = (id: string): Promise<any> => {
    return del(`/api/standardization/v1/catalog/${id}`)
}

// ------------------------------原task--------------------------------

interface ITaskQuery {
    offset?: number
    limit?: number
    keyword?: string
}

/**
 * 获取已完成任务列表
 * @param id
 * @returns
 */
export const getUnCompletedTasks = ({ offset, limit, keyword }: ITaskQuery) => {
    return get(
        `/api/standardization/v1/dataelement/task/std-create/uncompleted/`,
        {
            offset,
            limit,
            keyword,
        },
    )
}

/**
 * 获取已完成任务列表
 * @param id
 * @returns
 */
export const getCompletedTasks = ({ offset, limit, keyword }: ITaskQuery) => {
    return get(
        `/api/standardization/v1/dataelement/task/std-create/completed/`,
        {
            offset,
            limit,
            keyword,
        },
    )
}

/**
 * 获取任务详情
 * @param id
 * @returns
 */
export const getTaskDetails = (id: string) => {
    return get(
        `/api/standardization/v1/dataelement/task/std-create/completed/${id}`,
    )
}

/**
 * 业务字段表格 - 元数据详情
 * @param stdCode
 * @returns
 */
export const getMetaDataDetails = (stdCode: string) => {
    return get(
        `/api/standardization/v1/dataelement/detail?type=2&value=${stdCode}`,
    )
}

/**
 * 暂存任务
 * @param stdCode
 * @returns
 */
export const stagingTask = (postJson: any) => {
    return post(
        `/api/standardization/v1/dataelement/task/std-create/relation/staging`,
        {
            ...postJson,
        },
    )
}

/**
 * 提交任务
 * @param postJson
 * @returns
 */
export const submitTask = (postJson: any) => {
    return post(
        `/api/standardization/v1/dataelement/task/std-create/publish/submit`,
        {
            ...postJson,
        },
    )
}

// ****************************************** 文件 start ******************************************

/**
 * 分页获取数据元
 * @param params any
 * @returns
 */
export const getFileList = (params: IFileQuery) => {
    return get('/api/standardization/v1/std-file', params)
}

/**
 * 根据ids获取数据元
 * @param params any
 * @returns
 */
export const getFileListByIds = (ids: Array<string>) => {
    return post('/api/standardization/v1/std-file/queryByIds', {
        ids,
    })
}

/**
 * 标准文件管理-详情查询（根据ID）
 * @param id 文件id
 * @returns
 */
export const getFileDetailById = (id: string) => {
    return get(`/api/standardization/v1/std-file/${id}`)
}

/**
 * 查询文件关联数据元
 * @param id 文件id
 * @returns
 */
export const getFileAssociatedDataElement = (params: {
    id: string
    offset: number
    limit: number
}) => {
    const { id, offset, limit } = params
    return get(`/api/standardization/v1/std-file/relation/de/${id}`, {
        offset,
        limit,
    })
}

/**
 * 查询文件关联码表
 * @param id 文件id
 * @returns
 */
export const getFileAssociatedCodeTable = (params: {
    id: string
    offset: number
    limit: number
}) => {
    const { id, offset, limit } = params
    return get(`/api/standardization/v1/std-file/relation/dict/${id}`, {
        offset,
        limit,
    })
}

/**
 * 查询文件关联编码规则
 * @param id 文件id
 * @returns
 */
export const getFileAssociatedCodeRule = (params: {
    id: string
    offset: number
    limit: number
}) => {
    const { id, offset, limit } = params
    return get(`/api/standardization/v1/std-file/relation/rule/${id}`, {
        offset,
        limit,
    })
}

/**
 * 单个添加文件
 * @param params
 * @param file
 * @returns
 */
export const addFile = (data?: FormData) => {
    // 超时时候设置3min
    return post(`/api/standardization/v1/std-file`, data, {
        timeout: 3 * 60 * 1000,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 编辑文件
 * @param params
 * @param file
 * @returns
 */
export const editFile = (fId: string, file?: FormData) => {
    // 超时时候设置3min
    return put(`/api/standardization/v1/std-file/${fId}`, file, {
        timeout: 3 * 60 * 1000,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

// 更新状态
export const changeFileState = (
    id: string,
    params: {
        state: StateType
        reason?: string
    },
) => {
    return put(`/api/standardization/v1/std-file/state/${id}`, params)
}

/**
 * 通过id集合移动文件
 * @param newDirId 移动至新目录id
 * @param ids 选中行的id数组
 * @returns
 */
export const moveFileByIds = (newDirId: Key, ids: []) => {
    return post(`/api/standardization/v1/std-file/catalog/remove`, {
        catalog_id: newDirId,
        ids,
    })
}

/**
 * 通过id集合删除文件
 * @param ids
 * @returns
 */
export const delFileByIds = (ids: string) => {
    return del(`/api/standardization/v1/std-file/delete/${ids}`)
}

/**
 * 批量导入文件
 * @param params
 * @param file
 * @returns
 */
export const importFile = (params: IAddFileItem, file: FormData) => {
    const { number, name, catalog_id, org_type, attachment_type } = params
    // 超时时候设置3min
    return post(
        `/api/standardization/v1/std-file?number=${number}&name=${name}&catalog_id=${catalog_id}&org_type=${org_type}&attachment_type=${attachment_type}`,
        file,
        {
            timeout: 3 * 60 * 1000,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        },
    )
}

/**
 * 标准文件附件下载
 * @param id 文件id
 * @returns
 */
export const exportFileById = (id: string) => {
    // return post(
    //     `/api/standardization/v1/std-file/download/${id}`,
    //     {},
    //     {
    //         responseType: 'arraybuffer',
    //     },
    // )

    return `/api/standardization/v1/std-file/download/${id}`
}

/**
 *  标准文件附件批量下载
 * @param id 文件id
 * @returns
 */
export const exportFileByIds = (ids: any[]) => {
    return post(
        `/api/standardization/v1/std-file/downloadBatch`,
        { ids },
        {
            responseType: 'arraybuffer',
        },
    )
}

// 校验文件是否重复
export interface ICheckFileRepeat {
    // number	string	 是
    number?: string

    // name	string	否
    name?: string

    // org_type		int	标准编号
    org_type?: number

    //	编辑时需要，过滤该ID对应的记录后再查询数据是否存在
    filter_id?: string
}

/**
 * 校验文件名称/编号重复与否
 * @param params
 * @param file
 * @returns
 */
export const checkFileNumOrNameRepeat = (params: ICheckFileRepeat) => {
    return get(`/api/standardization/v1/std-file/queryDataExists`, params)
}

/**
 * 标准文件关联关系查询
 * @param id 文件id
 * @param file
 * @returns
 */
export const getFileAssociateInfo = (fId: string) => {
    return get(`/api/standardization/v1/std-file/relation/${fId}`)
}

/**
 * 标准文件关联关系查询
 * @param id 文件id
 * @param file
 * @returns
 */
export const updFileAssociateInfo = (
    fId: string,
    params: {
        relation_de_list: Array<string>
        relation_dict_list: Array<string>
        relation_rule_list: Array<string>
    },
) => {
    return put(`/api/standardization/v1/std-file/relation/${fId}`, params)
}

// ****************************************** 文件 end ******************************************

// ****************************************** 业务表-标准化 start ******************************************
/**
 * 添加至待新建标准
 * @param business_table_model_id 业务表模型id
 * @param business_table_fields 业务表字段数组
 * @returns
 */
export const addToPending = (
    business_table_model_id: string,
    business_table_fields: Array<IBusinTableField>,
): Promise<any> => {
    return requests.post(
        `/api/standardization/v1/dataelement/task/addToPending`,
        {
            business_table_model_id,
            business_table_fields,
        },
    )
}

/**
 * 待新建标准-业务表列表查询
 * @param business_table_model_id 业务表模型id
 * @param business_table_fields 业务表字段数组
 * @returns
 */
export const getPendingBusinTable = (
    params: IPendingBusinsTableQuery,
): Promise<IPendingRes<IBusinTable>> => {
    return requests.get(
        `/api/standardization/v1/dataelement/task/getBusinessTable`,
        params,
    )
}

/**
 * 待新建标准-业务表字段列表查询
 * @param business_table_model_id 业务表模型id
 * @param business_table_fields 业务表字段数组
 * @returns
 */
export const getPendingBusinTableField = (
    params: IPendingBusinsTableFieldQuery,
): Promise<IPendingRes<IBusinTableField>> => {
    return requests.get(
        `/api/standardization/v1/dataelement/task/getBusinessTableField`,
        params,
    )
}

/**
 * 待新建标准-待发起-移除业务表字段
 * @param id 字段id
 * @returns
 */
export const deleteBusinessTableField = (
    id: string,
): Promise<IPendingRes<IBusinTableField>> => {
    return requests.delete(
        `/api/standardization/v1/dataelement/task/deleteBusinessTableField/${id}`,
    )
}

/**
 * 待新建标准-新建标准任务
 * @param task_id 任务id
 * @param ids 待建标准业务表字段主键ID数组
 * @returns
 */
export const createStdTask = (
    task_id: string,
    ids: Array<string | number>,
): Promise<any> => {
    return requests.post(
        '/api/standardization/v1/dataelement/task/createTask',
        {
            task_id,
            ids,
        },
    )
}

/**
 * 待新建标准-进行中-撤销业务表字段
 * @param business_table_model_id 业务表模型id
 * @param business_table_fields 业务表字段数组
 * @returns
 */
export const cancelBusinessTableField = (
    ids: Array<string>,
): Promise<IPendingRes<IBusinTableField>> => {
    return requests.put(
        `/api/standardization/v1/dataelement/task/cancelBusinessTableField`,
        ids,
    )
}

// ****************************************** 业务表-标准化 end ******************************************

export const getStdRec = (params: IStdRecParams): Promise<IStdRecRes> => {
    return requests.post(
        '/api/standardization/v1/dataelement/task/stand-rec/rec',
        params,
    )
}

export const getRuleRec = (params: IRuleRecParams[]): Promise<IRuleRecRes> => {
    return requests.post(
        '/api/standardization/v1/dataelement/task/rule-rec/rec',
        { query: params },
    )
}

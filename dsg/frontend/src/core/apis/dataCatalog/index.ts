import requests from '@/utils/request'
import { getRequestArryParams } from '@/utils'
import {
    IRescInfo,
    IRescItem,
    ISearchColumn,
    ICatglgColumn,
    IRescCatlgQuery,
    IRescCatlg,
    IResult,
    ICatlgContent,
    IRescTreeQuery,
    LineageForm,
    IAddCatalog,
    ICreateAuditProcess,
    IUpdateAuditProcess,
    ICreateAuditFlow,
    IBusinessLogicEntityTop,
    IAvailableAssets,
    IApplyAssets,
    IDataCatlgQueryPrams,
    IBusinObjSearch,
    IBusinObject,
    IBusinObjCommonDetail,
    IDataCatlgBasicInfo,
    IBusinFiledQuery,
    IBusinSampleQuery,
    IBusinObjSample,
    IdimensionConfigModel,
    IdimensionModel,
    IGetResourcesDetails,
    IDataServiceDetailModel,
    ISubGraphResult,
    IGetFormViewCheck,
    IDataRescQuery,
    IServiceMaktDataRescItem,
    ICategoryItem,
    IInfoRescCatlgQuery,
    IqueryInfoResCatlgList,
    IqueryInfoResCatlgListParams,
    IInfoResCatlgColumnsItem,
    IInfoCatlgAuditQuery,
    IInfoRescCatlgAutoRelated,
    InfoCatlgItem,
    IBusinFormSerachCondition,
    CreateDCFeedbackReq,
    DCFeedbackReq,
    DCFeedbackRes,
    DCFeedbackDetail,
    IOpenCatlgListQuery,
    IAddOpenCatlgParams,
    IEditOpenCatlgParams,
    IOpenableDataCatalogQuery,
    IOpenableDataCatalog,
    IOpenCatlgAuditListQuery,
    IOpenCatlgOverview,
    IOpenCatlgDetail,
    IGetCatlgScoreListParams,
    ICatlgScoreListRes,
    ICatlgScoreSummaryItem,
    IGetCatlgScoreDetailsParams,
    ICatlgScoreDetailsRes,
    IQueryListCommonParams,
    IQueryFrontendLicenseListParams,
    LicenseTreeDataNode,
    IGetFavoriteListParams,
    IFavoriteListRes,
    IGetPushListParams,
    IPushListItem,
    IUpdateDataPushParams,
    IDataPushDetail,
    ICatalogedResourceListItem,
    IGetPushScheduleListParams,
    IDataPushScheduleListItem,
    IPushMonitorListItem,
    IDataPushOverview,
    IGetPushAuditListParams,
    IPushAuditListItem,
    IDataPushScheduleList,
    IRescCatlgOverviewParams,
    IComprehensionTemplateParam,
    IGetDataCatalogFileListParams,
    IDataCatalogFileListItem,
    ICreateDataCatalogFileParams,
    IAttachmentListItem,
    IFileResourceAuditReq,
    IFileResourceAuditItem,
    ISystemOperationParams,
    ISystemOperationItem,
    ISystemOperationConfig,
    ISystemOperationWhiteList,
    ISystemOperationDetailsParams,
    ISystemOperationDetailItem,
    IResetInfoResCatlgParams,
    IInfoCatlgStatistics,
    IInfoCatlgBusinFormStatics,
    IInfoCatlgDepartStatics,
    IInfoCatlgShareStatics,
    ICreateOperationTargetParams,
    IGetTargetListParams,
    IAssessmentTargetItem,
    IAssessmentTargetDetail,
    ICreateTargetAssessmentPlanParams,
    ITargetEvaluateParams,
    IAssessmentOverviewParams,
    ICreateDepartmentTargetParams,
    IOperationAssessmentOverviewParams,
    ResType,
    FeedbackReqResMode,
    FeedbackResResMode,
    FeedbackDetailResMode,
    CreateFeedbackReqResMode,
    IDataGetOverview,
    IDataUnderstandOverviewResult,
    IDataUnderstandDepartTopResult,
    IDataUnderstandDomainDetailResult,
    IUnderstandDepartmentDetailResult,
    ICategoryApplyScopeConfig,
    ISaveApplyScopeConfigRequest,
} from './index.d'
import { IBusinessAssetsFilterQuery } from '../../../components/DataAssetsCatlg/helper'
import { ICommonRes, IObject } from '@/core'
import { PolicyType } from '@/components/AuditPolicy/const'

const { get, post, put, delete: del, patch } = requests

/**
 * 获取资源分类目录
 * @param params
 * @returns
 */
export const getRescTree = (params?: IRescTreeQuery) => {
    return get('/api/data-catalog/v1/trees/nodes', params)
}

/**
 * 获取组织架构目录
 * @param params
 * @returns
 */
// export const getOrgStrucDir = (params?: IGetObject): Promise<IObjects> => {
//     return get(`/api/configuration-center/v1/objects`, params)
// }

/**
 *
 * @param params 查询资源目录列表
 * @returns
 */
export const getRescCatlgList = (
    params: IRescCatlgQuery,
): Promise<IResult<IRescCatlg>> => {
    const reuqestParams = params
    let urlParams = ''
    if (params?.publish_status) {
        urlParams += `${getRequestArryParams(
            'publish_status',
            params?.publish_status?.split(','),
        )}`
        delete reuqestParams?.publish_status
    }
    if (params?.online_status) {
        urlParams = urlParams ? `${urlParams}&` : urlParams
        urlParams += `${getRequestArryParams(
            'online_status',
            params?.online_status?.split(','),
        )}`
        delete reuqestParams?.online_status
    }
    if (params?.mount_type) {
        urlParams = urlParams ? `${urlParams}&` : urlParams
        urlParams += `${getRequestArryParams(
            'mount_type',
            params?.mount_type?.split(','),
        )}`
        delete reuqestParams?.mount_type
    }
    urlParams = urlParams ? `?${urlParams}` : ''
    return get(`/api/data-catalog/v1/data-catalog${urlParams}`, reuqestParams)
}

/**
 *
 * @param params 查询资源目录列表 -- 待编目
 * @returns /data-catalog/v1/data-catalog/
 */
export const getCurOrgEditRescCatlgList = (
    params: IRescCatlgQuery,
): Promise<IResult<IRescCatlg>> => {
    const reuqestParams = params
    let urlParams = ''
    if (params?.publish_status) {
        urlParams += `${getRequestArryParams(
            'publish_status',
            params?.publish_status?.split(','),
        )}`
        delete reuqestParams?.publish_status
    }
    if (params?.online_status) {
        urlParams = urlParams ? `${urlParams}&` : urlParams
        urlParams += `${getRequestArryParams(
            'online_status',
            params?.online_status?.split(','),
        )}`
        delete reuqestParams?.online_status
    }
    if (params?.mount_type) {
        urlParams = urlParams ? `${urlParams}&` : urlParams
        urlParams += `${getRequestArryParams(
            'mount_type',
            params?.mount_type?.split(','),
        )}`
        delete reuqestParams?.mount_type
    }
    urlParams = urlParams ? `?${urlParams}` : ''
    return get(`/api/data-catalog/v1/data-catalog/normal${urlParams}`, params)
}

/**
 *
 * @param params 查询资源目录列表 (任务关联)
 * @returns
 */
export const getTaskRescCatlgList = (
    params: IRescCatlgQuery,
): Promise<IResult<IRescCatlg>> => {
    const reuqestParams = params
    let urlParams = ''
    if (params?.publish_status) {
        urlParams += `${getRequestArryParams(
            'publish_status',
            params?.publish_status?.split(','),
        )}`
        delete reuqestParams?.publish_status
    }
    if (params?.online_status) {
        urlParams = urlParams ? `${urlParams}&` : urlParams
        urlParams += `${getRequestArryParams(
            'online_status',
            params?.online_status?.split(','),
        )}`
        delete reuqestParams?.online_status
    }
    urlParams = urlParams ? `?${urlParams}` : ''
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/catalog${urlParams}`,
        reuqestParams,
    )
}

/**
 *
 * @param params 查询资源目录任务监控信息
 * @returns
 */
export const getTaskMonitorInfo = (catalog_id: string): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${catalog_id}/task`)
}
/**
 *
 * @param params 查询资源目录列表 -- 待编目
 * @returns
 */
export const getUnEditRescCatlgList = (
    params: IRescCatlgQuery,
): Promise<IResult<IRescCatlg>> => {
    return get('/api/data-catalog/v1/data-catalog/data-resource', params)
}

/**
 *
 * @param params 删除数据资源目录
 * @returns
 */
export const delRescCatlg = (catalogId: string) => {
    return del(`/api/data-catalog/v1/data-catalog/${catalogId}`)
}

/**
 *
 * @param params 查询数据资源目录详情
 * @returns
 */
export const getRescDirDetail = (catalogId: string): Promise<ICatlgContent> => {
    return get(`/api/data-catalog/v1/data-catalog/${catalogId}`)
}

/**
 *
 * @param params 查询数据资源目录详情
 * @returns
 */
export const getRescDirColumnInfo = (
    params: ISearchColumn,
): Promise<IRescInfo> => {
    return get(
        `/api/data-catalog/v1/data-catalog/${params?.catalogId}/column`,
        params,
    )
}
/**
 *
 * @param params 查询数据资源目录详情
 * @returns
 */
export const rescDirImport = (params: FormData): Promise<any> => {
    return post(`/api/data-catalog/v1/data-catalog/import`, params)
}

/**
 * 获取样例数据
 * @param id
 * @returns
 */
export const getDataCatalogSamples = (
    id: string,
    params: { type: number; fields?: string },
): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${id}/samples`, params)
}

/**
 * 查询目录分类（表格）
 */
export const queryCatalogClassify = (params: {
    keyword?: string
}): Promise<any> => {
    return get(`/api/data-catalog/v1/trees/nodes/tree`, params)
}
/**
 * 新增目录分类
 */
export const addCatalogClassify = (params: IAddCatalog): Promise<any> => {
    return post(`/api/data-catalog/v1/trees/nodes`, params)
}
/**
 * 编辑目录分类
 */
export const editCatalogClassify = (params: {
    id: string
    name: string
    describe?: string
}): Promise<any> => {
    return put(`/api/data-catalog/v1/trees/nodes/${params.id}`, params)
}
/**
 * 编辑目录分类
 */
export const moveCatalogClassify = (params: {
    id: string
    dest_parent_id: string
    next_id?: string
}): Promise<any> => {
    return put(`/api/data-catalog/v1/trees/nodes/${params.id}/reorder`, params)
}
/**
 * 目录分类详情
 */
export const detailsCatalogClassify = (params: {
    id: string
}): Promise<any> => {
    return get(`/api/data-catalog/v1/trees/nodes/${params.id}`, params)
}
/**
 * 删除
 */
export const delCatalogClassify = (params: { id: string }): Promise<any> => {
    return del(`/api/data-catalog/v1/trees/nodes/${params.id}`)
}
/**
 * 名称是否重复
 * @param name 名称
 * @param parent_id 要新增子节点的父节点ID，不传或传0表示在一级目录下检测
 * @param cur_id 当前在修改的节点ID
 */
export const getCatalogClassifyNameCheck = (params: {
    name: string
    parent_id?: string
    cur_id?: string
}): Promise<any> => {
    return post(`/api/data-catalog/v1/trees/nodes/check`, params)
}

/**
 * 绑定审核流程查询接口
 */
export const getAuditProcess = (params?: { audit_type?: string }) => {
    return get(`/api/data-catalog/v1/audit-process`, params)
}

/**
 * 创建审核流程绑定
 * @param audit_type 审批流程类型
 * @param proc_def_key 审核流程key
 */
export const createAuditProcess = ({
    audit_type,
    proc_def_key,
}): Promise<ICreateAuditProcess> => {
    return post(`/api/data-catalog/v1/audit-process`, {
        audit_type,
        proc_def_key,
    })
}

/**
 * 编辑审核流程绑定
 */
export const updateAuditProcess = ({
    id,
    audit_type,
    proc_def_key,
}): Promise<IUpdateAuditProcess> => {
    return put(`/api/data-catalog/v1/audit-process/${id}`, {
        audit_type,
        proc_def_key,
    })
}
/**
 * 删除审核流程
 */
export const delAuditProcess = ({ id }): Promise<IUpdateAuditProcess> => {
    return del(`/api/data-catalog/v1/audit-process/${id}`)
}

/**
 * 创建数据目录审核实例
 */
export const createAuditFlow = ({
    catalogID,
    flowType,
}): Promise<ICreateAuditFlow> => {
    return post(
        `/api/data-catalog/v1/data-catalog/${catalogID}/audit-flow/${flowType}/instance`,
        {},
    )
}

/**
 * 获取数据资源数量
 */
export const getAssetConts = () => {
    return get(`/api/data-catalog/frontend/v1/data-assets/count`)
}

/**
 * 获取业务逻辑实体分布信息(业务域视角)
 */
export const getBusinessLogicEntityByDomain = () => {
    return get(
        `/api/data-catalog/frontend/v1/data-assets/business-domain/business-logic-entity`,
    )
}

/**
 * 获取业务逻辑实体分布信息(部门视角)
 */
export const getBusinessLogicEntityByDepartment = () => {
    return get(
        `/api/data-catalog/frontend/v1/data-assets/department/business-logic-entity`,
    )
}
/**
 * 获取top业务逻辑实体数措
 */
export const getBusinessLogicEntityTop = (params: IBusinessLogicEntityTop) => {
    return get(`/api/data-catalog/frontend/v1/data-assets/top-data`, params)
}
/**
 * 获取数据标准化率
 */
export const getStandardizedRate = () => {
    return get(`/api/data-catalog/frontend/v1/data-assets/standardized-rate`)
}
/**
 * 我的 - 可用资源列表
 */
export const getAvailableAssets = (params: IAvailableAssets) => {
    return get(
        `/api/data-catalog/frontend/v1/my/data-catalog/available-assets`,
        params,
    )
}
/**
 * 我的 - 可用资源-库表
 */
export const getAvailableLogicView = () => {
    return get(``)
}

/**
 * 我的 - 可用资源详情
 */
export const getAvailableAssetsDetail = (id: string) => {
    return get(
        `/api/data-catalog/frontend/v1/my/data-catalog/available-assets/${id}`,
    )
}
/**
 * 我的 - 申请列表
 */
export const getApplyAssets = (params: IApplyAssets) => {
    return get(`/api/data-catalog/frontend/v1/my/data-catalog/apply`, params)
}
/**
 * 我的 - 申请详情
 */
export const getApplyAssetsDetails = (apply_id: string) => {
    return get(
        `/api/data-catalog/frontend/v1/my/data-catalog/apply/${apply_id}`,
    )
}

// 获取父节点下的子节点列表
export const reqTreeNode = (
    params: IDataCatlgQueryPrams,
): Promise<IRescCatlg> => {
    return get(
        `/api/data-catalog/frontend/v1/trees/nodes?node_id=${
            params.node_id || ''
        }&recursive=${params.recursive}`,
    )
}

// 获取资源目录详情-基本信息
export const reqDataCatlgBasicInfo = (catalogID: string) => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${catalogID}`)
}

export interface IRescItemInfoPrams {
    catalogID?: string
    limit?: number
    offset?: number
}

// 获取资源目录详情-信息项列表
export const reqDataCatlgColumnInfo = (params: ISearchColumn) => {
    return get(
        `/api/data-catalog/frontend/v1/data-catalog/${params.catalogId}/column`,
        params,
    )
}

/**
 * 目录对象顶部公共信息
 * @param id 业务对象ID
 * @returns
 */
export const reqCatlgCommonInfo = (
    id: string,
): Promise<IBusinObjCommonDetail> => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${id}/common`)
}

/**
 * 目录对象基本信息
 * @param id 业务对象ID
 * @returns
 */
export const reqCatlgBasicInfo = (id: string): Promise<IDataCatlgBasicInfo> => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${id}/basic-info`)
}

/**
 * 业务对象摘要信息查询
 * @param id 业务对象ID
 * @returns
 */
export const reqBusinObjAbstract = (
    id: string,
): Promise<IDataCatlgBasicInfo> => {
    return get(`/api/data-catalog/frontend/v1/business-object/${id}`)
}

/**
 * 业务对象字段信息查询
 * @param id 业务对象ID
 * @returns
 */
export const reqBusinObjField = (params: IBusinFiledQuery): Promise<any> => {
    const { id, limit, offset, keyword = '' } = params
    return get(`/api/data-catalog/frontend/v1/data-catalog/${id}/column`, {
        offset,
        limit,
        keyword,
    })
}

/**
 * 业务对象样例数据查询
 * @param id 业务对象ID
 * @returns
 */
export const reqBusinObjSample = (
    params: IBusinSampleQuery,
): Promise<IBusinObjSample> => {
    return get(
        `/api/data-catalog/frontend/v1/data-catalog/${params.catalogID}/samples`,
        {
            ...params,
        },
    )
}
// 申请下载
export const applyDownloadBusinessObjectAccess = (
    id: string,
    auditType: string,
    params: {
        apply_days: number
        apply_reason: string
    },
) => {
    return post(
        `/api/data-catalog/frontend/v1/data-catalog/${id}/audit-flow/${auditType}/instance`,
        params,
    )
}

// 字段信息数据下载
export const DownloadBusinessObjectFields = (
    id: string,
    params: {
        direction: string
        download_count: number
        fields: Array<string>
    },
) => {
    return post(
        `/api/data-catalog/frontend/v1/data-catalog/${id}/data-download`,
        params,
        { responseType: 'arraybuffer' },
    )
}

// 摘要信息预览量埋点
export const businessObjectPreviewSave = (id: string) => {
    return post(
        `/api/data-catalog/frontend/v1/data-catalog/${id}/preview-save`,
        {},
    )
}

/**
 * 获取数据理解的维度配置
 */
export const getDataComprehensionConfig =
    (): Promise<IdimensionConfigModel> => {
        return get(`/api/data-catalog/frontend/v1/data-comprehension/config`)
    }

/**
 * 获取数据理解配置详情
 * @catalogID 目录的ID
 */
export const getDataComprehensionDetails = (
    catalogID: string,
    params?: any,
): Promise<IdimensionModel> => {
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/${catalogID}`,
        params,
    )
}

/**
 * 更新数据理解接口
 * @catalogID 目录的ID
 * @catalog_code 数据目录的code
 * @dimension_configs 维度配置详情
 * @column_comments 字段注释理解
 * @operation 操作，是保存还是更新
 * @task_id 任务ID
 */
export const updateDataComprehension = (
    catalogID: string,
    params: {
        catalog_code: string
        catalog_id: string
        dimension_configs: any[]
        column_comments: any[]
        operation: 'save' | 'upsert'
        task_id: string
        template_id?: string
        catalog_create?: boolean
    },
): Promise<any> => {
    return put(
        `/api/data-catalog/frontend/v1/data-comprehension/${catalogID}`,
        params,
    )
}

/**
 * 删除数据理解
 * @catalogID 目录的ID
 */
export const deleteDataComprehension = (catalogID: string): Promise<any> => {
    return del(`/api/data-catalog/frontend/v1/data-comprehension/${catalogID}`)
}

/**
 * 数据理解红点消除
 * @catalogID 目录的ID
 */
export const updateComprehensionMark = (
    catalog_id: string,
    task_id: string = '',
): Promise<any> => {
    return put(`/api/data-catalog/frontend/v1/data-comprehension/mark`, {
        catalog_id,
        task_id,
    })
}

/** ***************数据理解模板 start******************* */

// 查询数据理解模板列表
export const getComprehensionTemplate = (params: {
    keyword?: string
    limit?: number
    offset?: number
    direction?: string
    sort?: string
}): Promise<any> => {
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/template`,
        params,
    )
}
// 创建数据理解模板
export const createComprehensionTemplate = (
    params: IComprehensionTemplateParam,
): Promise<any> => {
    return post(
        `/api/data-catalog/frontend/v1/data-comprehension/template`,
        params,
    )
}
// 编辑数据理解模板
export const updateComprehensionTemplate = (
    id: string,
    params: IComprehensionTemplateParam,
): Promise<any> => {
    return put(`/api/data-catalog/frontend/v1/data-comprehension/template`, {
        id,
        ...params,
    })
}
// 查询数据理解模板详情
export const getComprehensionTemplateDetail = (id: string): Promise<any> => {
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/template/detail`,
        { id },
    )
}
// 查询数据理解模板配置
export const getComprehensionTemplateConfig = (id: string): Promise<any> => {
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/template/config`,
        { id },
    )
}
// 删除数据理解模板
export const deleteComprehensionTemplate = (id: string): Promise<any> => {
    return del(`/api/data-catalog/frontend/v1/data-comprehension/template`, {
        id,
    })
}
// 数据理解模板名称校验
export const checkNameComprehensionTemplate = (params: {
    id?: string
    name?: string
}): Promise<any> => {
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/template/repeat`,
        params,
    )
}
// 通过任务id查询数据资源目理解
export const getCatalogComprehensionListByTaskId = (
    id: string,
): Promise<any> => {
    return get(
        `/api/data-catalog/frontend/v1/data-comprehension/task/catalog/list`,
        {
            id,
        },
    )
}
// 查询数据资源目理解
export const getCatalogComprehensionList = (params: any): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/data-comprehension/list`, params)
}

// 上传理解结果
export const createComprehensionJson = (params: {
    catalog_id: string
    task_id: string
}): Promise<any> => {
    return post(`/api/data-catalog/frontend/v1/data-comprehension/json`, params)
}

// 查询该数据理解模板是否绑定任务
export const getComprehensionTemplateBindTask = (id: string): Promise<any> => {
    return get(`/api/internal/task-center/v1/data-comprehension-template`)
}

/** ***************数据理解模板 end******************* */

// 获取服务超市库表数据
export const getDataCatalog = () => {
    return get('/api/data-catalog/v1/data-catalog/?offset=1&limit=100')
}

// 获取信息项
export const getInfoItems = (id: string, parmas) => {
    return get(`/api/data-catalog/v1/data-catalog/${id}/column`, parmas)
}

/**
 * 新增资源目录
 */
export const addResources = (params: any): Promise<any> => {
    return post(`/api/data-catalog/v1/data-catalog`, params)
}
/**
 * 编辑资源目录
 */
export const editResources = (params: any): Promise<any> => {
    return put(`/api/data-catalog/v1/data-catalog`, params)
}

/**
 * 获取资源目录详情
 */

export const getResourcesDetails = (
    params: IGetResourcesDetails,
): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${params.catalogID}`)
}

/**
 * 获取资源目录Owner状态
 */
export const getResourcesOwnerState = (catalogID: string): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${catalogID}/owner`)
}

/**
 * 资源分类树
 */
export const getResourcesTree = (params: any): Promise<any> => {
    return get(`/api/data-catalog/v1/trees/nodes`, params)
}
/**
 * 资源是否已挂接目录
 * @param res_id 资源ID,多个用逗号分隔
 * @param res_type 挂接资源类型 1 库表 2 接口 3 文件
 */
export const getResourcesCheck = (params: {
    res_ids: string
    res_type: number
}): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/resource/check`, params)
}

/**
 * 库表是否已编目检查
 * @param res_id 资源ID,多个用逗号分隔
 */
export const getFormViewCheck = (params: {
    form_view_ids: string
}): Promise<IGetFormViewCheck> => {
    return get(`/api/data-catalog/v1/data-catalog/form-view/check`, params)
}

/**
 * 资源名称是否重复
 * @param name 名称
 */
export const getResourcesNameCheck = (params: {
    name: string
}): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/check`, params)
}

/**
 *
 * @param params 业务对象类目查询
 * @returns IObjects<IBusinObject>
 */
// export const reqBusinNode = (
//     params: IBusinNodeParams,
// ): Promise<Array<IBusinNode>> => {
//     return get(`/api/business-object/category`, params)
// }
/**
 *
 * @param params 业务对象列表搜索
 * @returns IObjects<IBusinObject>
 */
export const reqBusinObjList = (
    params: IBusinessAssetsFilterQuery,
): Promise<IBusinObjSearch<IBusinObject>> => {
    return post(`/api/data-catalog/frontend/v1/data-catalog/search`, params)
}
/**
 *
 * @param params 业务对象列表搜索 -- 运营视角
 * @returns IObjects<IBusinObject>
 */
export const reqBusinObjListForOper = (
    params: any,
): Promise<IBusinObjSearch<IBusinObject>> => {
    return post(
        `/api/data-catalog/frontend/v1/data-catalog/operation/search`,
        params,
    )
}

/**
 *
 * @param params 应用概览列表 header 带有 testdata 时返回测试数据，testdata 的值可以是   empty, all, continue
 */
export const reqInfoSysSearch = (params: any): Promise<any> => {
    return post(
        `/api/data-catalog/frontend/v1/info-systems/search`,
        params,
        //     {
        //     headers: {
        //         testdata: 'continue',
        //     },
        // }
    )
}
/**
 *
 * @param params 查询数据目录详情
 */
export const getDataCatalogDetails = (catalogId: string): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${catalogId}`)
}
/**
 *
 * @param params 查询数据目录信息项列表
 */
export const getDataCatalogInfoItems = (catalogId: string): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${catalogId}/column`)
}
/**
 *
 * @param params 查询数据目录挂在资源
 */
export const getDataCatalogMount = (catalogId: string): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${catalogId}/mount`)
}
/**
 *
 * @param params 查询数据目录挂在资源
 */
export const getDataCatalogRelation = (catalogId: string): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${catalogId}/relation`)
}
/**
 * @param params 查询数据目录挂在资源 -- 超市
 */
export const getDataCatalogMountFrontend = (
    catalogId: string,
): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${catalogId}/mount`)
}
/**
 * @param params 查询数据目录统计数量
 */
export const getDataCatalogStatstics = (params: any): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/data-resource`, params)
}
/**
 * @param params 查询数据目录已发布、已上线数量
 */
export const getDataCatalogCount = (params: any): Promise<any> => {
    const reuqestParams = params
    let urlParams = ''
    if (params?.online_status) {
        urlParams = urlParams ? `${urlParams}&` : urlParams
        urlParams += `${getRequestArryParams(
            'online_status',
            params?.online_status?.split(','),
        )}`
        delete reuqestParams?.online_status
    }
    urlParams = urlParams ? `?${urlParams}` : ''
    return get(`/api/data-catalog/v1/data-catalog/count${urlParams}`, params)
}

/**
 * @param params 创建数据探查作业
 */
export const exploreJob = (id: string): Promise<string> => {
    return post(`/api/data-catalog/v1/data-catalog/${id}/explore-job`, null)
}

// 查询用户是否具有业务对象下载权限接口-接口已刪除
// export const getDownloadAccessOfBusinessObject = (
//     id: string,
// ): Promise<IDownloadAccessOfBusinessObject> => {
//     return get(
//         `/api/data-catalog/frontend/v1/business-object/${id}/download-access`,
//     )
// }

// --------------------------认知搜索-------------------------------

/**
 * 认知搜索-子图谱
 * @param params 认知搜索图谱查询参数
 * @returns
 */
export const reqSubGraph = (params: {
    end: string
    start: string[]
    'data-version': string
}): Promise<ISubGraphResult> => {
    return post(
        `/api/data-catalog/frontend/v1/data-catalog/search/subgraph`,
        params,
    )
}

/**
 * 服务超市-数据资源搜索接口-普通用户视角
 * @param params
 * @returns
 */
export const getDataRescList = (
    params: IDataRescQuery,
): Promise<IBusinObjSearch<IServiceMaktDataRescItem>> => {
    return post(`/api/data-catalog/frontend/v1/data-resources/search`, params)
}
/**
 * 数据资源检索接口（运营视角）
 * @param params
 * @returns
 */
export const getDataRescList2 = (
    params: IDataRescQuery & {
        is_publish?: boolean
        is_online?: boolean
        published_status?: string[]
        online_status?: string[]
        online_at?: {
            start: number
            end: number
        }
    },
): Promise<IBusinObjSearch<IServiceMaktDataRescItem>> => {
    return post(
        `/api/data-catalog/frontend/v1/data-resources/searchForOper`,
        params,
    )
}

/**
 * 服务超市-数据资源搜索接口-运营视角
 * @param params
 * @returns
 */
export const getDataRescListByOper = (
    params: IDataRescQuery,
): Promise<IBusinObjSearch<IServiceMaktDataRescItem>> => {
    return post(
        `/api/data-catalog/frontend/v1/data-resources/searchForOper`,
        params,
    )
}

/** -------------------- 类目管理 ----------------------- */

/**
 * 创建类目
 * @name 自定义类目名称
 * @describe 自定义类目描述
 */
export const postCategory = (params: {
    name: string
    describe: string
}): Promise<{ id: string }> => {
    return post(`/api/data-catalog/v1/category`, params)
}

/**
 * 获取类目
 * @keyword 关键字
 */
export const getCategory = (params: {
    keyword?: string
}): Promise<{
    entries: Array<ICategoryItem>
    total_count: number
}> => {
    return get(`/api/data-catalog/v1/category`, params)
}

/**
 * 批量修改类目
 * @id 类目id
 * @required 类目必选
 * @index 类目索引
 */
export const putCategory = (
    params: {
        id: string
        required?: boolean
        index: number
    }[],
): Promise<{ id: string }[]> => {
    return put(`/api/data-catalog/v1/category`, params)
}

/**
 * 修改类目状态
 * @id 类目id
 * @using 类目启用/停用
 */
export const putCategoryItemUsing = (
    id: string,
    params: {
        using: boolean
    },
): Promise<{ id: string }> => {
    return put(`/api/data-catalog/v1/category/${id}/using`, params)
}

/**
 * 删除指定的类目
 * @id 类目id
 */
export const deleteCategoryItem = (id: string): Promise<any> => {
    return del(`/api/data-catalog/v1/category/${id}`)
}

/**
 * 修改指定的类目
 * @id 类目id
 * @name 类目名称
 * @describe 类目描述
 */
export const putCategoryItem = (
    id: string,
    params: {
        name: string
        describe: string
    },
): Promise<{ id: string }> => {
    return put(`/api/data-catalog/v1/category/${id}`, params)
}

/**
 * 获取指定的类目
 * @id 类目id
 */
export const getCategoryItem = (id: string): Promise<ICategoryItem> => {
    return get(`/api/data-catalog/v1/category/${id}`)
}

/**
 * 检查类目名称是否重名
 * @id 类目id
 * @name 类目名称
 */
export const getCategoryNameCheck = (params: {
    id?: string
    name: string
}): Promise<{ name: string; repeat: boolean }> => {
    return get(`/api/data-catalog/v1/category/name-check`, params)
}

/**
 * 创建类目树节点
 * @id 类目id
 * @parent_id 类目父节点id
 * @name 类目名称
 * @owner owner名称
 * @ownner_uid owner id
 */
export const postCategoryTreesNode = (
    id: string,
    params: {
        parent_id: string
        name: string
        owner: string
        ownner_uid: string
    },
): Promise<{ id: string; name: string; owner: string }> => {
    return post(`/api/data-catalog/v1/category/${id}/trees-node`, params)
}

/**
 * 类目树重新排序
 * @id 类目id
 * @dest_parent_id 目标父节点id
 * @next_id 相邻下一个节点id
 */
export const putCategoryTreesNode = (
    id: string,
    params: {
        id: string
        dest_parent_id: string
        next_id: string
    },
): Promise<any> => {
    return put(`/api/data-catalog/v1/category/${id}/trees-node`, params)
}

/**
 * 删除指定ID的类目树节点
 * @id 类目id
 * @node_id 类目树节点id
 */
export const deleteCategoryTreesNodeItem = (
    id: string,
    node_id: string,
): Promise<any> => {
    return del(`/api/data-catalog/v1/category/${id}/trees-node/${node_id}`)
}

/**
 * 修改指定ID的类目树节点
 * @id 类目id
 * @node_id 类目树节点id
 * @parent_id 类目父节点id
 * @name 类目名称
 * @owner owner名称
 * @ownner_uid owner id
 */
export const putCategoryTreesNodeItem = (
    id: string,
    node_id: string,
    params: {
        parent_id: string
        name: string
        owner: string
        ownner_uid: string
    },
): Promise<{ id: string; name: string; owner: string }> => {
    return put(
        `/api/data-catalog/v1/category/${id}/trees-node/${node_id}`,
        params,
    )
}

/**
 * 检查类目节点名称是否重名
 * @id 类目id
 * @parent_id 类目父节点id
 * @node_id 类目树节点id
 * @name 类目树节点名称
 */
export const getCategoryTreesNodeItem = (
    id: string,
    params: {
        node_id: string
        parent_id: string
        name: string
    },
): Promise<{ name: string; repeat: boolean }> => {
    return get(
        `/api/data-catalog/v1/category/${id}/trees-node/name-check`,
        params,
    )
}

/**
 * 挂接资源目录
 * @catalog_id 目录ID
 */
export const mountResource = (catalog_id: string): Promise<any> => {
    return get(`/api/data-catalog/v1/data-catalog/${catalog_id}/mount`)
}

// 信息资源目录——————————————————————————————————start

/**
 * 导出信息资源目录
 * @param params
 * @returns
 */
export const exportInfoRescCatlg = (params: { catalog_ids: string[] }) => {
    return post(`/api/data-catalog/v1/info-resource-catalog/export`, params, {
        responseType: 'arraybuffer',
    })
}

/**
 * 新建信息资源目录
 * @catalog_id 目录ID
 */
export const addInfoCatlg = (params: InfoCatlgItem): Promise<any> => {
    return post(`/api/data-catalog/v1/info-resource-catalog`, params)
}

/**
 * 获取信息资源目录详情
 * @catalog_id 目录ID
 */
export const getInfoCatlgDetail = (id: string): Promise<any> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/${id}`)
}

/**
 * 编辑信息资源目录
 * @catalog_id 目录ID
 */
export const updInfoCatlg = (params: InfoCatlgItem): Promise<any> => {
    const { id = '', ...rest } = params
    return put(`/api/data-catalog/v1/info-resource-catalog/${id}`, rest)
}

/**
 * 在上线/下线/撤销上线/撤销下线/撤销发布信息资源目录时使用
 * @catalog_id 目录ID
 */
export const updInfoCatlgStatus = (
    id: string,
    status: 'next' | 'prev',
): Promise<any> => {
    return patch(`/api/data-catalog/v1/info-resource-catalog/${id}`, {
        status,
    })
}

/**
 * 删除信息资源目录
 * @catalog_id 目录ID
 */
export const delInfoCatlg = (id: string): Promise<any> => {
    return del(`/api/data-catalog/v1/info-resource-catalog/${id}`)
}

/**
 * 仅数据运营工程师/数据开发工程师可用
 * 需要业务表服务提供支持
 * 以业务表创建信息资源目录时使用
 * @catalog_id 目录ID
 */
export const getUneditFormList = (
    params: IBusinFormSerachCondition,
): Promise<IResult<any>> => {
    return post(
        `/api/data-catalog/v1/info-resource-catalog/business-form/search`,
        params,
    )
}

/**
 * 当用户只有系统管理员身分时不可用
 * 响应结果为当前用户的信息资源编目待办审核项列表
 * @catalog_id 目录ID
 */
export const getAuditList = (params: any): Promise<IResult<any>> => {
    return post(
        `/api/data-catalog/v1/info-resource-catalog/audit/search`,
        params,
    )
}

/**
 *
 * @param params 查询信息资源目录编目模块-目录列表
 * @returns
 */
export const getInfoRescCatlgList = (
    params: IInfoRescCatlgQuery,
): Promise<IResult<any>> => {
    const reuqestParams = params

    return post(
        `/api/data-catalog/v1/info-resource-catalog/search`,
        reuqestParams,
    )
}

/**
 * 获取信息资源目录自动关联信息类
 * @param source_id 来源业务表ID
 * @returns IObjects<IBusinObject>
 */
export const getInfoRescCatlgAutoRelated = (
    source_id: string,
): Promise<IInfoRescCatlgAutoRelated> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/auto-related`, {
        source_id,
    })
}

/**
 * 获取信息资源目录基本信息
 * @param source_id 来源业务表ID
 * @returns IObjects<IBusinObject>
 */
export const getInfoCatlgBasicInfo = (id: string): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/info-resource-catalog/${id}`)
}

/**
 * 获取信息资源目录关联数据资源目录
 * @param
 * @returns IObjects<IBusinObject>
 */
export const getInfoCatlgRelateDataCatlg = (params: {
    id: string
    offset?: number
    limit?: number
}): Promise<any> => {
    const { id, ...rest } = params
    return get(
        `/api/data-catalog/frontend/v1/info-resource-catalog/${id}/data-resource-catalogs`,
        rest,
    )
}

/**
 * 获取信息资源目录详情（运营/开发）
 * @param id 目录id
 * 数据运营工程师/数据开发工程师使用
 * 查看信息资源目录详情时使用
 * 当关联项ID为0表示其已被删除
 */
export const getInfoCatlgDetailByOper = (id: string): Promise<any> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/${id}/operation`)
}

/**
 * 资源名称是否重复，在信息资源目录编辑页面的名称输入框失焦（input元素onblur事件触发）时使用
 * @param name 名称
 */
export const getInfoCatlgConflicts = (params: {
    id?: string
    name: string
}): Promise<any> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/conflicts`, params)
}

/**
 * 查询信息资源目录审核列表
 * @param name 名称
 */
export const queryInfoCatlgList = (
    params: IInfoCatlgAuditQuery,
): Promise<any> => {
    return post(
        `/api/data-catalog/v1/info-resource-catalog/audit/search`,
        params,
    )
}

// 信息资源目录变更
export const changeInfoResCatlg = (
    params: Partial<InfoCatlgItem & { catlgId: string }>,
): Promise<any> => {
    const { catlgId = '', ...rest } = params
    return put(
        `/api/data-catalog/v1/info-resource-catalog/${catlgId}/alter`,
        rest,
    )
}

// 信息资源目录变更审核撤回
export const cancelInfoResCatlgChangeAudit = (id: string): Promise<any> => {
    return put(
        `/api/data-catalog/v1/info-resource-catalog/${id}/alter/audit/cancel`,
    )
}

// 信息资源目录变更恢复
export const resetInfoResCatlg = (
    param: IResetInfoResCatlgParams,
): Promise<any> => {
    return del(
        `/api/data-catalog/v1/info-resource-catalog/${param?.id}/version/${param?.alterId}`,
    )
}

// 信息资源目录统计接口
export const getInfoCatlgStatistics = (org_code: string): Promise<any> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/statistics`, {
        org_code,
    })
}

// 概览-信息目录统计接口
export const reqInfoCatlgStatics = (): Promise<IInfoCatlgStatistics> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/catalog-statistic`)
}

// 概览-业务标准表编目统计接口
export const reqInfoCatlgBusinFormStatics =
    (): Promise<IInfoCatlgBusinFormStatics> => {
        return get(
            `/api/data-catalog/v1/info-resource-catalog/business-form-statistic`,
        )
    }

// 概览-部门提供目录统计接口
export const reqInfoCatlgDepartStatics =
    (): Promise<IInfoCatlgDepartStatics> => {
        return get(
            `/api/data-catalog/v1/info-resource-catalog/dept-catalog-statistic`,
        )
    }

// 概览-目录共享统计接口
export const reqInfoCatlgShareStatics = (): Promise<IInfoCatlgShareStatics> => {
    return get(`/api/data-catalog/v1/info-resource-catalog/share-statistic`)
}

// 信息资源目录——————————————————————————————————end

// 信息资源目录 -- 服务超市 -- start
export const getResourceCatalogsFrontend = (params: {
    id: string
    offset?: number
    limit?: number
}): Promise<
    IResult<{
        name: string
        code: string
        id: string
        publish_at: number
    }>
> => {
    return get(
        `/api/data-catalog/frontend/v1/info-resource-catalog/${params.id}/data-resource-catalogs`,
        {
            limit: params.limit,
            offset: params.offset,
        },
    )
}

//  查询资源目录信息项
export const queryInfoResCatlgColumns = (
    params: IBusinFiledQuery,
): Promise<IResult<IInfoResCatlgColumnsItem>> => {
    const { id, limit = 1000, offset = 1, keyword = '' } = params
    return get(`/api/data-catalog/v1/info-resource-catalog/${id}/columns`, {
        offset,
        limit,
        keyword,
    })
}
// 获取信息资源目录卡片基本信息
export const queryInfoResCatlgDetailsFrontend = (id: string): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/info-resource-catalog/${id}`)
}
// 获取信息资源目录列表 -- 前端
export const queryInfoResCatlgListFrontend = (
    param: IqueryInfoResCatlgListParams,
): Promise<IqueryInfoResCatlgList> => {
    return post(
        `/api/data-catalog/frontend/v1/info-resource-catalog/search`,
        param,
    )
}

// 获取信息资源目录列表
export const queryInfoResCatlgList = (
    param: IqueryInfoResCatlgListParams,
): Promise<IqueryInfoResCatlgList> => {
    return post(
        `/api/data-catalog/frontend/v1/info-resource-catalog/operation/search`,
        param,
    )
}

// 信息资源目录 -- 服务超市 -- end

// 目录反馈 - 目录模式
export const postFeedback = (
    params: CreateDCFeedbackReq,
): Promise<{ id: string }> => {
    return post(`/api/data-catalog/v1/data-catalog/feedback`, params)
}

// 目录反馈回复
export const putFeedbackReply = (
    feedback_id,
    params: {
        reply_content: string
    },
): Promise<{ id: string }> => {
    return put(
        `/api/data-catalog/v1/data-catalog/feedback/${feedback_id}/reply`,
        params,
    )
}

// 目录反馈列表
export const getFeedbackList = (
    params: DCFeedbackReq,
): Promise<DCFeedbackRes> => {
    return get(`/api/data-catalog/v1/data-catalog/feedback`, params)
}

// 目录反馈详情
export const getFeedbackDetail = (
    feedback_id: string,
): Promise<DCFeedbackDetail> => {
    return get(`/api/data-catalog/v1/data-catalog/feedback/${feedback_id}`)
}

// 目录反馈列表
export const getFeedbackCount = (): Promise<{
    total_num: number
    pending_num: number
    replied_num: number
}> => {
    return get(`/api/data-catalog/v1/data-catalog/feedback/count`)
}
// 目录反馈目录模式 - end

// 目录反馈资源模式 - start
// 目录反馈
export const postFeedbackResMode = (
    params: CreateFeedbackReqResMode,
): Promise<{ id: string }> => {
    return post(`/api/data-catalog/v1/data-resource/feedback`, params)
}

// 目录反馈回复
export const putFeedbackReplyResMode = (
    feedback_id,
    params: {
        reply_content: string
    },
): Promise<{ id: string }> => {
    return put(
        `/api/data-catalog/v1/data-resource/feedback/${feedback_id}/reply`,
        params,
    )
}

// 目录反馈列表
export const getFeedbackListResMode = (
    params: FeedbackReqResMode,
): Promise<FeedbackResResMode> => {
    return get(`/api/data-catalog/v1/data-resource/feedback`, params)
}

// 目录反馈详情
export const getFeedbackDetailResMode = (
    feedback_id: string,
    res_type: ResType,
): Promise<FeedbackDetailResMode> => {
    return get(
        `/api/data-catalog/v1/data-resource/feedback/${feedback_id}/${res_type}`,
        {},
    )
}

// 目录反馈列表
export const getFeedbackCountResMode = (
    params: any,
): Promise<{
    total_num: number
    pending_num: number
    replied_num: number
}> => {
    return get(`/api/data-catalog/v1/data-resource/feedback/count`, params)
}

// 开放数据目录 -- start
// 获取开放目录列表
export const queryOpenCatlgList = (
    params: IOpenCatlgListQuery,
): Promise<IResult<any>> => {
    return get(`/api/data-catalog/v1/open-catalog`, params)
}

// 添加开放目录-获取数据资源目录列表
export const queryOpenableDataCatalog = (
    param: IOpenableDataCatalogQuery,
): Promise<IResult<IOpenableDataCatalog>> => {
    return get(`/api/data-catalog/v1/open-catalog/openable-catalog`, param)
}

/**
 * 新增开放目录
 * @param params 新增开放目录参数
 * @returns
 */
export const addOpenCatlg = (
    params: IAddOpenCatlgParams,
): Promise<{
    failed_catalog: Array<{
        id: string
        name: string
    }>
    success_catalog: Array<{
        id: string
        name: string
    }>
}> => {
    return post(`/api/data-catalog/v1/open-catalog`, params)
}

/**
 * 编辑开放目录
 * @param params 编辑开放目录参数
 * @returns
 */
export const editOpenCatlg = (params: IEditOpenCatlgParams): Promise<any> => {
    const { id, ...rest } = params
    return put(`/api/data-catalog/v1/open-catalog/${id}`, rest)
}

/**
 * 撤销开放目录审核
 * @param id 开放目录id
 * @returns
 */
export const undoOpenCatlgAudit = (id: string): Promise<any> => {
    return put(`/api/data-catalog/v1/open-catalog/cancel/${id}`)
}

// 获取开放目录审核列表-workflow暂不支持排序
export const queryOpenCatlgAuditList = (
    param: IOpenCatlgAuditListQuery,
): Promise<IResult<any>> => {
    return get(`/api/data-catalog/v1/open-catalog/audit`, param)
}

/**
 * 获取开放目录概览
 * @returns
 */
export const queryOpenCatlgOverview = (): Promise<IOpenCatlgOverview> => {
    return get(`/api/data-catalog/v1/open-catalog/overview`)
}

/**
 * 开放目录详情
 * @param id 开放目录id
 * @returns
 */
export const queryOpenCatlgDetail = (id: string): Promise<IOpenCatlgDetail> => {
    return get(`/api/data-catalog/v1/open-catalog/${id}`)
}

/**
 * 删除指定的类目
 * @id 类目id
 */
export const deleteOpenCatlg = (id: string): Promise<any> => {
    return del(`/api/data-catalog/v1/open-catalog/${id}`)
}

// 开放数据目录 -- end

// 我的-获取数据资源目录评分列表
export const getCatlgScoreList = (
    params: IGetCatlgScoreListParams,
): Promise<ICatlgScoreListRes> => {
    return get(`/api/data-catalog/v1/data-catalog/score`, params)
}

// 获取数据资源目录评分列表
export const getCatlgScoreSummary = (
    ids: string[],
): Promise<ICatlgScoreSummaryItem[]> => {
    let params = ''
    ids.forEach((id) => {
        // eslint-disable-next-line
        params = `catalog_ids=${id}${params ? '&' : ''}` + params
    })

    return get(`/api/data-catalog/v1/data-catalog/score/summary?${params}`)
}

// 获取数据资源目录评分详情
export const getCatlgScoreDetails = (
    id: string,
    params: IGetCatlgScoreDetailsParams,
): Promise<ICatlgScoreDetailsRes> => {
    return get(`/api/data-catalog/v1/data-catalog/score/${id}`, params)
}

// 修改目录评分
export const putCatlgScore = (id: string, score: number): Promise<any> => {
    return put(`/api/data-catalog/v1/data-catalog/score/${id}`, { score })
}

// 添加数据资源目录评分
export const postCatlgScore = (id: string, score: number): Promise<any> => {
    return post(`/api/data-catalog/v1/data-catalog/score/${id}`, { score })
}
// 电子证照 -- start

/**
 * 电子证照搜索树节点列表-后台
 * @param id 开放目录id
 * @returns
 */
export const queryLicenseTreeList = (
    params: any,
): Promise<{
    classify: LicenseTreeDataNode[]
}> => {
    return get(`/api/data-catalog/v1/elec-licence/industry-department`, params)
}

/**
 * 电子证照结构口-后台
 * @param id 开放目录id
 * @returns
 */
export const queryLicenseTree = (): Promise<{
    classify_tree: LicenseTreeDataNode[]
}> => {
    return get(`/api/data-catalog/v1/elec-licence/industry-department/tree`)
}

/**
 * 电子证照信息项-后台
 * @param id 开放目录id
 * @returns
 */
export const queryLicenseList = (params: any): Promise<any> => {
    return get(`/api/data-catalog/v1/elec-licence`, params)
}

/**
 * 导出数据
 * @param ids
 * @returns
 */
export const exportLicenseFile = (ids?: Array<string>) => {
    return post(
        `/api/data-catalog/v1/elec-licence/export`,
        {
            ids,
        },
        {
            responseType: 'arraybuffer',
        },
    )
}

/**
 * 电子证照上、下线
 * @param ids
 * @returns
 */
export const chgLicenseOnlineStatus = (
    id: string,
    auditType: PolicyType.ElecLicenceOnline | PolicyType.ElecLicenceOffline,
) => {
    return post(
        `/api/data-catalog/v1/elec-licence/${id}/audit-flow/${auditType}/instance`,
    )
}

/**
 * 电子证照详情-后台
 * @param id 开放目录id
 * @returns
 */
export const queryLicenseDetail = (id: string): Promise<any> => {
    return get(`/api/data-catalog/v1/elec-licence/${id}`)
}

/**
 * 电子证照详情-后台
 * @param id 开放目录id
 * @returns
 */
export const queryLicenseInfoItems = (
    id: string,
    params?: IQueryListCommonParams,
): Promise<any> => {
    return get(`/api/data-catalog/v1/elec-licence/${id}/column`, params)
}

/**
 * 电子证照详情-前台
 * @param id 开放目录id
 * @returns
 */
export const queryFrontendLicenseList = (
    params: IQueryFrontendLicenseListParams,
): Promise<any> => {
    return post(`/api/data-catalog/frontend/v1/elec-licence/search`, params)
}

/**
 * 电子证照详情-前台
 * @param id 开放目录id
 * @returns
 */
export const queryFontendLicenseDetail = (id: string): Promise<any> => {
    return get(`/api/data-catalog/frontend/v1/elec-licence/${id}`)
}

/**
 * 电子证照信息项-前台
 * @param id 开放目录id
 * @returns
 */
export const queryFontendLicenseInfoItems = (
    id: string,
    params?: IQueryListCommonParams,
): Promise<any> => {
    return get(
        `/api/data-catalog/frontend/v1/elec-licence/${id}/column`,
        params,
    )
}

// 电子证照 -- end

// 我的收藏
// 我的收藏列表接口
export const getFavoriteList = (
    params: IGetFavoriteListParams,
): Promise<IFavoriteListRes> => {
    return get(`/api/data-catalog/frontend/v1/favorite`, params)
}

// 新增收藏接口
export const addFavorite = (params: {
    // 资源类型开放目录数量
    res_type: ResType
    // 资源ID
    res_id: string
}): Promise<any> => {
    return post(`/api/data-catalog/frontend/v1/favorite`, params)
}

// 取消收藏接口
export const deleteFavorite = (favor_id: string): Promise<any> => {
    return del(`/api/data-catalog/frontend/v1/favorite/${favor_id}`)
}

// 检查资源是否已收藏
export const checkFavorite = (params: {
    res_type: ResType
    res_id: string
}): Promise<{ is_favored: boolean }> => {
    return get(`/api/data-catalog/frontend/v1/favorite/check`, params)
}

// 数据推送列表
export const getDataPushList = (
    params: IGetPushListParams,
): Promise<IResult<IPushListItem>> => {
    return get(`/api/data-catalog/v1/data-push`, params)
}

// 数据推送详情
export const getDataPushDetail = (id: string): Promise<IDataPushDetail> => {
    return get(`/api/data-catalog/v1/data-push/${id}`)
}

// 更新数据推送
export const putDataPush = (
    params: IUpdateDataPushParams,
): Promise<{ id: string; name: string }> => {
    return put(`/api/data-catalog/v1/data-push`, params)
}

// 新增数据推送
export const postDataPush = (
    params: IUpdateDataPushParams,
): Promise<{ id: string; name: string }> => {
    return post(`/api/data-catalog/v1/data-push`, params)
}

// 删除数据推送
export const deleteDataPush = (id: string): Promise<{ id?: string }> => {
    return del(`/api/data-catalog/v1/data-push/${id}`)
}

// 立即执行数据推送
export const executeDataPush = (id: string): Promise<any> => {
    return post(`/api/data-catalog/v1/data-push/execute/${id}`)
}

// 修改推送调度计划
export const putDataPushSchedule = (params: {
    // 推送主键ID
    id: string
    // 是否为草稿
    is_draft?: boolean
    // linux crontab表达式, 5级
    crontab_expr?: string
    // 计划结束日期, 格式 2006-01-02
    schedule_end?: string
    // 计划开始日期, 格式 2006-01-02
    schedule_start?: string
    // 调度时间，格式 2006-01-02 15:04:05;  空：立即执行；非空：定时执行
    schedule_time?: string
    // 调度计划:once一次性,timely定时
    schedule_type?: string
}): Promise<any> => {
    return put(`/api/data-catalog/v1/data-push/schedule`, params)
}

// 推送启用停用
export const putDataPushSwitch = (params: {
    // 推送主键ID
    id: string
    // 推送状态，1启用，0禁用，不填默认是启用
    schedule_status: number
}): Promise<any> => {
    return put(`/api/data-catalog/v1/data-push/switch`, params)
}

// 获取已编目的数据资源列表
export const getCatalogedResourceList = (params: {
    // 关键字查询
    keyword?: string
    // 每页大小，默认10 limit=0不分页
    limit?: number
    // 页码，默认1
    offset?: number
    // 主题ID
    subject_id?: string
}): Promise<IResult<ICatalogedResourceListItem>> => {
    return get(`/api/data-catalog/v1/data-catalog/push-resource`, params)
}

// 获取数据推送监控列表
export const getDataPushMonitorList = (
    params: IGetPushListParams,
): Promise<IResult<IPushMonitorListItem>> => {
    return get(`/api/data-catalog/v1/data-push/schedule`, params)
}

// 查询调度日志
export const getDataPushScheduleList = (
    params: IGetPushScheduleListParams,
): Promise<IDataPushScheduleList> => {
    return get(`/api/data-catalog/v1/data-push/schedule/history`, params)
}

// 近一年数据推送总量
export const getDataPushAnnualStatistics = (): Promise<
    {
        count: number
        month: string
    }[]
> => {
    return get(`/api/data-catalog/v1/data-push/annual-statistics`)
}

// 数据推送概览
export const getDataPushOverview = (params: {
    // 目标部门ID
    dest_department_id?: string
    // 来源部门ID
    source_department_id?: string
    // 开始时间
    start_time?: number
    // 结束时间
    end_time?: number
}): Promise<IDataPushOverview> => {
    return get(`/api/data-catalog/v1/data-push/overview`, params)
}

// 待审核列表
export const getDataPushAuditList = (
    params: IGetPushAuditListParams,
): Promise<IResult<IPushAuditListItem>> => {
    return get(`/api/data-catalog/v1/data-push/audit`, params)
}

// 数据推送撤回审核
export const getDataPushAuditRecall = (id: string): Promise<any> => {
    return put(`/api/data-catalog/v1/data-push/audit/revocation`, { id })
}

// 数据资源目录概览 ------ start

// 概览-总览
export const reqRescCatlgOverview = (): Promise<any> => {
    return post(`/api/data-catalog/v1/data-catalog/overview/total`)
}

// 概览-分类统计
export const reqRescCatlgClassStatics = (
    params: IRescCatlgOverviewParams,
): Promise<any> => {
    return post(`/api/data-catalog/v1/data-catalog/overview/statistics`, params)
}

// 数据资源目录概览 ------ end
/** ****************************数据资源文件管理********************************** */

/**
 * 获取数据目录附件列表
 * @param params
 * @returns
 */
export const getDataCatalogFileList = (
    params: IGetDataCatalogFileListParams,
): Promise<IResult<IDataCatalogFileListItem>> => {
    return get(`/api/data-catalog/v1/file-resource`, params)
}

/**
 * 创建文件资源
 * @param params
 * @returns
 */
export const createDataCatalogFile = (params: ICreateDataCatalogFileParams) => {
    return post(`/api/data-catalog/v1/file-resource`, params)
}

/**
 * 获取数据资源附件列表
 * @param id 数据资源ID
 * @returns
 */
export const getFileResourceList = (
    id: string,
    params: {
        offset?: number
        limit?: number
    },
): Promise<IResult<IAttachmentListItem>> => {
    return get(`/api/data-catalog/v1/file-resource/${id}/attachment`, params)
}

/**
 * 获取文件资源详情
 * @param id 文件资源ID
 * @returns
 */
export const getFileCatalogDetail = (id: string): Promise<any> => {
    return get(`/api/data-catalog/v1/file-resource/${id}`)
}

/**
 * 编辑数据目录附件
 * @param id 数据目录附件ID
 * @param params 编辑数据目录附件参数
 * @returns
 */
export const editDataCatalogFile = (
    id: string,
    params: ICreateDataCatalogFileParams,
) => {
    return put(`/api/data-catalog/v1/file-resource/${id}`, params)
}

/**
 * 删除数据目录附件
 * @param id 数据目录附件ID
 * @returns
 */
export const deleteDataCatalogFile = (id: string) => {
    return del(`/api/data-catalog/v1/file-resource/${id}`)
}

/**
 * 发布数据目录附件
 * @param id 数据目录附件ID
 * @returns
 */
export const publishDataCatalogFile = (id: string) => {
    return post(`/api/data-catalog/v1/file-resource/audit/${id}`)
}

/**
 * 撤销数据目录附件发布
 * @param id 数据目录附件ID
 * @returns
 */
export const cancelPublishDataCatalogFile = (id: string) => {
    return put(`/api/data-catalog/v1/file-resource/cancel/${id}`)
}

/**
 * 删除数据目录附件
 * @param id 数据目录附件ID
 * @returns
 */
export const deleteDataCatalogFileAttachment = (id: string) => {
    return del(`/api/data-catalog/v1/file-resource/attachment/${id}`)
}

/**
 * 获取文件资源预览
 * @param id 文件资源ID
 * @param preview_id 预览ID
 * @returns
 */
export const getFileAttachmentPreviewPdf = (params: {
    id: string
    preview_id: string
}): Promise<{
    href_url: string
    id: string
    preview_id: string
}> => {
    return get(
        `/api/data-catalog/v1/file-resource/attachment/preview-pdf`,
        params,
    )
}

// 文件资源审核
export const getFileResourceAudit = (
    params: IFileResourceAuditReq,
): Promise<IResult<IFileResourceAuditItem>> => {
    return get(`/api/data-catalog/v1/file-resource/audit`, params)
}

/**
 * 创建单目录模板
 */
export const createSingleCatalog = (params: any) => {
    return post(
        '/api/data-catalog/v1/cognitive-service-system/single-catalog/template',
        params,
    )
}

/**
 * 删除单目录模板
 */
export const delSingleCatalog = (id: string) => {
    return del(
        `/api/data-catalog/v1/cognitive-service-system/single-catalog/template/${id}`,
    )
}

/**
 * 获取单目录模板列表
 */
export const getSingleCatalogList = (params: any) => {
    return get(
        '/api/data-catalog/v1/cognitive-service-system/single-catalog/template/list',
        params,
    )
}

/**
 * 导入单目录模板
 */
export const importSingleCatalog = (id: string) => {
    return get(
        `/api/data-catalog/v1/cognitive-service-system/single-catalog/template/${id}/import`,
    )
}

/**
 * 更新单目录模板
 */
export const updateSingleCatalog = (params: any) => {
    const { id, ...restParams } = params
    return put(
        `/api/data-catalog/v1/cognitive-service-system/single-catalog/template/${id}`,
        restParams,
    )
}

/**
 * 获取单目录数据目录信息
 */
export const getSingleCatalogInfo = (params: any) => {
    return get(
        `/api/data-catalog/v1/cognitive-service-system/single-catalog/info`,
        params,
    )
}

/**
 * 获取单目录查询结果
 */
export const getSingleCatalogResult = (params: any) => {
    return post(
        '/api/data-catalog/v1/cognitive-service-system/single-catalog/data-search',
        params,
    )
}

/**
 * 获取单目录模板详情
 */
export const getSingleCatalogDetail = (id: string) => {
    return get(
        `/api/data-catalog/v1/cognitive-service-system/single-catalog/template/${id}`,
    )
}

/**
 * 获取历史记录列表
 */
export const getSingleCatalogHistory = (params: any) => {
    return get(
        '/api/data-catalog/v1/cognitive-service-system/single-catalog/history/list',
        params,
    )
}

/**
 * 获取历史记录导入的详情
 */
export const getHistoryImportDetail = (id: string) => {
    return get(
        `/api/data-catalog/v1/cognitive-service-system/single-catalog/history/${id}`,
    )
}

/**
 * 获取数据目录的详情
 */
export const getDataCatalogDetail = (catalogID: string) => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${catalogID}/column`)
}

/**
 * 校验模板名称唯一性
 */
export const validateNameUniq = (params: { name: string }) => {
    return get(
        '/api/data-catalog/v1/cognitive-service-system/single-catalog/template/unique-check',
        params,
    )
}

/**
 * 查询数据资源的数据目录列表
 */
export const postDataCatalog = (params: {
    catalog_info_show: boolean
    resource_ids: string[]
}) => {
    return post(`/api/data-catalog/v1/data-resources/data-catalog`, params)
}
// 系统运行评价 ---- start
/**
 * 系统运行明细列表
 */
export const getSystemOperationDetailsList = (
    params: ISystemOperationDetailsParams,
): Promise<IResult<ISystemOperationDetailItem>> => {
    return get(`/api/data-catalog/v1/system-operation/details`, params)
}
/**
 * 系统运行明细导出
 */
export const exportSystemOperationDetails = (params: {
    file_name: string
    data?: ISystemOperationDetailItem[]
    start_date?: number
    end_date?: number
}) => {
    return post(
        `/api/data-catalog/v1/system-operation/details/export`,
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}
/**
 * 整体评价结果列表
 */
export const getSystemOperationList = (
    params: ISystemOperationParams,
): Promise<IResult<ISystemOperationItem>> => {
    return get(
        `/api/data-catalog/v1/system-operation/overall-evaluations`,
        params,
    )
}
/**
 * 整体评价导出
 */
export const exportSystemOperation = (params: {
    file_name: string
    data?: ISystemOperationItem[]
}) => {
    return post(
        `/api/data-catalog/v1/system-operation/overall-evaluations/export`,
        params,
        {
            responseType: 'arraybuffer',
        },
    )
}
/**
 * 获取系统运行规则设置
 */
export const getSystemOperationConfig = () => {
    return get(`/api/data-catalog/v1/system-operation/rule`)
}
/**
 * 修改系统运行规则设置
 */
export const updateSystemOperationConfig = (params: ISystemOperationConfig) => {
    return put(`/api/data-catalog/v1/system-operation/rule`, params)
}
/**
 * 系统运行白名单
 */
export const systemOperationWhiteList = (params: ISystemOperationWhiteList) => {
    return post(`/api/data-catalog/v1/system-operation/white-list`, params)
}
/**
 * 修改系统运行白名单
 */
export const updateSystemOperationWhiteList = (params: {
    form_view_id: string
    data_update?: boolean
    quality_check?: boolean
}) => {
    return put(
        `/api/data-catalog/v1/system-operation/white-list/${params.form_view_id}`,
        params,
    )
}

// 系统运行评价 ---- end

export const getApplyScope = (): Promise<
    Array<{
        id: string
        name: string
    }>
> => {
    return get(`/api/data-catalog/v1/apply-scope/list`)
}
/**
 * 获取库表样例数据
 */
export const getLogicViewSampleData = (id: string) => {
    return get(`/api/data-catalog/frontend/v1/data-catalog/${id}/sample-data`)
}

// -------------------------------------------------------数据考核评价Start------------------------------------------------

// 部门目标管理接口创建
export const createDepartmentTarget = (
    params: ICreateDepartmentTargetParams,
) => {
    return post(`/api/data-catalog/v1/assessment`, params)
}

// 运营目标管理接口创建
export const createOperationTarget = (params: ICreateOperationTargetParams) => {
    return post(`/api/data-catalog/v1/operation-assessment`, params)
}

// 部门目标管理接口更新
export const updateDepartmentTarget = (
    id: string,
    params: ICreateDepartmentTargetParams,
) => {
    return put(`/api/data-catalog/v1/assessment/${id}`, params)
}

// 运营目标管理接口更新
export const updateOperationTarget = (
    id: string,
    params: ICreateOperationTargetParams,
) => {
    return put(`/api/data-catalog/v1/operation-assessment/${id}`, params)
}

// 目标管理接口删除
export const deleteTarget = (id: string) => {
    return del(`/api/data-catalog/v1/assessment/${id}`)
}

// 目标列表
export const getTargetList = (
    params: IGetTargetListParams,
): Promise<{
    entries: Array<IAssessmentTargetItem>
    total: number
}> => {
    return get(`/api/data-catalog/v1/assessment`, params)
}

// 目标详情
export const getTargetDetail = (
    id: string,
    params?: {
        plan_name?: string
    },
): Promise<IAssessmentTargetDetail> => {
    return get(`/api/data-catalog/v1/assessment/${id}/detail`, params)
}

// 查看目标管理评价详情（部门与运营管理）
export const getTargetEvaluationDetail = (
    id: string,
    params?: {
        plan_name?: string
    },
): Promise<IAssessmentTargetDetail> => {
    return get(`/api/data-catalog/v1/assessment/${id}/evaluation`, params)
}

// 创建目标计划
export const createTargetAssessmentPlan = (
    params: ICreateTargetAssessmentPlanParams,
) => {
    return post(`/api/data-catalog/v1/operation-assessment/plans`, params)
}

// 更新目标计划
export const updateTargetAssessmentPlan = (
    id: string,
    params: ICreateTargetAssessmentPlanParams,
) => {
    return put(`/api/data-catalog/v1/operation-assessment/plans/${id}`, params)
}

// 评价目标
export const evaluateTarget = (id: string, params: ITargetEvaluateParams) => {
    return put(`/api/data-catalog/v1/assessment/${id}/evaluation`, params)
}

// 部门考核数据概览
export const getDepartmentAssessmentOverview = (
    params: IAssessmentOverviewParams,
) => {
    return get(`/api/data-catalog/v1/assessment/overview`, params)
}

// 运营考核数据概览
export const getOperationAssessmentOverview = (
    params: IOperationAssessmentOverviewParams,
) => {
    return get(`/api/data-catalog/v1/operation-assessment/overview`, params)
}

// 目标删除
export const deleteDepartmentAssessmentTarget = (id: string) => {
    return del(`/api/data-catalog/v1/assessment/${id}`)
}

// 考核计划删除
export const deleteAssessmentPlan = (id: string) => {
    return del(`/api/data-catalog/v1/operation-assessment/plans/${id}`)
}

// 计划详情
export const getAssessmentPlanDetail = (id: string) => {
    return get(`/api/data-catalog/v1/operation-assessment/plans/${id}`)
}

// -------------------------------------------------------数据考核评价End--------------------------------------------------

/**
 * 数据获取概览
 */
export const getDataGetOverview = (params: {
    my_department?: boolean
}): Promise<IDataGetOverview> => {
    return post(`/api/data-catalog/v1/overview/data-get`, params)
}

/**
 * 归集任务详情
 */
export const getDataGetAggregation = (params: {
    keyword?: string
    deparment_id?: string
    my_department?: boolean
    limit?: number
    offset?: number
}): Promise<any> => {
    return post(`/api/data-catalog/v1/overview/data-get-aggregation`, params)
}

/**
 * 数据获取部门详情
 */
export const getDataGetDepartment = (params: {
    keyword?: string
    deparment_id?: string
    my_department?: boolean
    limit?: number
    offset?: number
}): Promise<any> => {
    return post(`/api/data-catalog/v1/overview/data-get-department`, params)
}

/**
 * 数据资源概览
 */
export const getDataAseetsOverview = (): Promise<any> => {
    return get(`/api/data-catalog/v1/data-assets/overview`)
}
/**
 * 数据资源获取部门详情
 */
export const getDataAssetDepartment = (params: {
    keyword?: string
    department_id?: string
    limit?: number
    offset?: number
}): Promise<any> => {
    return get(`/api/data-catalog/v1/data-assets/detail`, params)
}

/** **************************** 数据理解概览 start ********************************** */

/** 数据理解概览 */
export const getDataUnderstandOverview = (params: {
    my_department?: boolean
}): Promise<IDataUnderstandOverviewResult> => {
    return get(`/api/data-catalog/v1/overview/data-understand`, params)
}

/** 数据理解概览 */
export const getDataUnderstandDepartTop = (params: {
    direction?: 'asc' | 'desc'
    limit: number
    offset: number
    my_department?: boolean
    department_id?: string
    sort?: 'completion_rate' | 'name'
    subject_id?: string
}): Promise<{
    entries: IDataUnderstandDepartTopResult[]
    total_count: number
}> => {
    return get(
        `/api/data-catalog/v1/overview/data-understand-depart-top`,
        params,
    )
}

/** 数据理解领域详情 */
export const getDataUnderstandDomainDetail = (params: {
    my_department?: boolean
}): Promise<{
    catalog_info: IDataUnderstandDomainDetailResult
}> => {
    return get(
        `/api/data-catalog/v1/overview/data-understand-domain-detail`,
        params,
    )
}

/**
 * 数据理解任务详情
 * @param params
 * @returns
 */
export const getUnderstandTaskDetail = (params: {
    my_department?: boolean
    start: string
    end: string
}): Promise<{
    task: Array<{
        count: number
        status: number
    }>
}> => {
    return get(
        `/api/data-catalog/v1/overview/data-understand-task-detail`,
        params,
    )
}

/**
 * 数据理解部门详情
 * @param params
 * @returns
 */
export const getUnderstandDepartmentDetail = (params: {
    department_id?: string
    my_department?: boolean
    limit?: number
    offset?: number
    understand: boolean
}): Promise<{
    entries: IUnderstandDepartmentDetailResult[]
    total_count: number
}> => {
    return get(
        `/api/data-catalog/v1/overview/data-understand-depart-detail`,
        params,
    )
}

/** **************************** 数据理解概览 end ********************************** */

/**
 * 空间地理服务-5.1.1查询目录列表接口
 * @param foldType 目录类型
 * @returns
 */
export const servFolderTree = (params: { foldType: string }): Promise<any> => {
    // return get(`/api/serv/folder/tree`, params)
    return get(`/csdss/dlkj/v1/tree`)
}

/**
 * 空间地理服务-5.1.1查询目录列表接口
 * @param foldType 目录类型
 * @returns
 */
export const servInfoList = (
    pageNum: number,
    folderId: string,
): Promise<any> => {
    // return get(
    //     `/api/serv/info/list?pageNum=${pageNum}&pageSize=10&orderByColumn=cdate&isAsc=&folderId=${folderId}
    //     &servType=dataServ&servText=&tags=&scale=&sphere=&year=&servCategory=&encryption=`,
    // )
    return get(
        `/csdss/dlkj/v1/foldList?page_num=${pageNum}&page_size=10&folder_id=${folderId}`,
    )
}

/** **************************** 空间地理服务 end ********************************** */

export const getApplyScopeConfig = (): Promise<{
    categories: ICategoryApplyScopeConfig[]
    total_count: number
}> => {
    return get(`/api/data-catalog/v1/category/apply-scope-config`)
}

export const saveApplyScopeConfig = (
    categoryId: string,
    data: ISaveApplyScopeConfigRequest,
): Promise<any> => {
    return put(
        `/api/data-catalog/v1/category/${categoryId}/apply-scope-config`,
        data,
    )
}

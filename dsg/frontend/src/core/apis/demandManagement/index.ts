import requests from '@/utils/request'
import {
    IAnalysesInfo,
    IApplicationCatalogItem,
    ICommonList,
    ICreateDemandAuditProcess,
    IDemandCount,
    IDemandInfo,
    IDemandItem,
    IDemandItemConfig,
    IGetDemands,
    IInfoItem,
    IRepository,
    IRepositoryDetails,
    ISaveAnalysesInfo,
    ISharedDeclarationDetail,
    ISharedDeclarationItem,
    IUpdateDemandAuditProcess,
    IUpdateDemandConfirm,
    CreateCityDemandRequest,
    CityDemandRequest,
    CityDemandResponse,
    CityDemandDetails,
    CityDemandAnalysisRequest,
    CityDemandConfirmRequest,
    CityDemandImplementRequest,
    CityDemandAuditRequest,
    CityDemandAuditResponse,
    IAddShareApply,
    IAnalysesShareApply,
    IAnalysesConfirm,
    IAnalysisAudit,
    IImplementSolution,
    IImplementSolutionConfirm,
    ISharedApplyDetail,
    IGetShareApplyRequest,
    IGetShareApplyResponse,
    IGetShareApplyByIDResponse,
    ShareApplyAuditType,
    IImplementCityShareApplyConfirm,
    IImplementCityShareApply,
    IImplementCityShareApplyDetail,
    ImplementCityShareApplyDetailResult,
    IShareApplyAnalysisDetail,
    IDataAnalRequire,
    IDataAnalAnalysis,
    IDataAnalConfirm,
    IDataAnalImplement,
    IDataAnalListRequest,
    IDataAnalDetailRequest,
    IDataAnalRequireListResponse,
    IDataAnalRequireDetail,
    DataAnalAuditType,
    IStartFeedbackParams,
    IShareApplyFeedbackListParams,
    IShareApplyFeedbackListResponse,
    ShareApplyResourceTypeEnum,
    IDataAnalImplementConfirmParams,
    IDataAnalCatalogListResponse,
    IDataAnalCatalogOutputItem,
    IDataAnalPushConfirmListRequest,
    IDataAnalPushConfirmItem,
    IStartDataAnalFeedbackParams,
    ICommonFeedbackListParams,
    IDataAnalFeedbackItem,
    IDataAnalFeedbackCount,
    IDataAnalOutboundItem,
    IDataAnalOutboundListRequest,
    IGetApiSubListParams,
    IGetApiSubListResponse,
    SystemAccessStatus,
    IOverviewList,
    IApplyStatisticList,
    IProcStatisticList,
    IProcTimeStatisticList,
    IAppliedViewItem,
    IAppliedApiItem,
    IAppliedApiShareApplyItem,
    IAppliedViewShareApplyItem,
} from './index.d'
import { ICommonRes, IGetListParams, SortDirection } from '../common'

const { get, post, put, delete: del } = requests

// 获取需求列表
export const getDemands = (
    params: IGetDemands,
): Promise<ICommonList<IDemandInfo[]>> => {
    return get('/api/demand-management/v1/demands', params)
}

// 创建需求
export const createDemand = (params: any) => {
    return post('/api/demand-management/v1/demands', params)
}

// 编辑需求
export const editDemand = (id: string, params: any) => {
    return put(`/api/demand-management/v1/demands/${id}`, params)
}

// 获取基本信息详情 (需求信息 单位信息)
export const getDemandDetails = (id: string) => {
    return get(`/api/demand-management/v1/demands/${id}`)
}

// 获取资源列表
export const getDemandItems = (
    id: string,
    auditId?: string,
): Promise<ICommonList<IDemandItemConfig[]>> => {
    return get(
        `/api/demand-management/v1/demands/${id}/items?audit_id=${
            auditId || ''
        }`,
    )
}

// 获取资源信息配置详情
export const getDemandItemDetails = (
    id: string,
    itemId: string,
): Promise<IDemandItemConfig> => {
    return get(`/api/demand-management/v1/demands/${id}/items/${itemId}`)
}

export const checkDemandName = (params: {
    demand_id?: string
    demand_title: string
}) => {
    return post('/api/demand-management/v1/demands/check', params)
}

export const uploadInfoItems = (
    params: FormData,
    demand_id?: string,
): Promise<ICommonList<IInfoItem>> => {
    return post(`/api/demand-management/v1/demands/${demand_id}/import`, params)
}

// 删除需求申请
export const deleteDemand = (id: string) => {
    return del(`/api/demand-management/v1/demands/${id}`)
}

// 查询服务超市资源
// export const getDataCatalog = () => {
//     return post(`/api/basic-search/v1/data-catalog/search`, {})
// }

// 下载文件
export const downloadDemandFile = (id: string) => {
    return get(
        `/api/demand-management/v1/files/${id}`,
        {},
        {
            responseType: 'arraybuffer',
        },
    )
}

// 获取需求分析信息
export const getDemandAnalyseInfo = (id: string): Promise<IAnalysesInfo> => {
    return get(`/api/demand-management/v1/demands/${id}/analyses`)
}

// 保存需求分析信息
export const saveDemandAnalyseInfo = (
    id: string,
    params: ISaveAnalysesInfo,
) => {
    return put(`/api/demand-management/v1/demands/${id}/analyses`, params)
}

// 获取需求分析数据数量 tab=1 查申请   tab=2 查分析
export const getDemandAnalyseInfoCount = (
    tab: number,
): Promise<ICommonList<IDemandCount[]>> => {
    return get(`/api/demand-management/v1/demands/count?tab=${tab}`)
}

// 获取需求信息项信息
export const getDemandItemInfos = (params: {
    item_id?: string
    res_id: string
    analyse_item_id?: string
    original_id?: string
}): Promise<ICommonList<IInfoItem[]>> => {
    return get('/api/demand-management/v1/demands/itemInfos', params)
}

// 获取购物车资源列表
export const getRepositorys = (): Promise<ICommonList<IRepository[]>> => {
    return get('/api/demand-management/v1/repositorys')
}

// 购物车添加资源列表
export const addRepositorys = (id: string) => {
    return post(`/api/demand-management/v1/repositorys/${id}`, {})
}

// 购物车删除资源列表
export const removeRepositorys = (id: string) => {
    return del(`/api/demand-management/v1/repositorys/${id}`)
}

// 购物车选取资源列表
export const chooseRepositorys = (params: { ids: string[] }) => {
    return put(`/api/demand-management/v1/repositorys`, params)
}

// 获取购物车选取资源列表
export const getSelectedRepositorys = (
    id?: string,
): Promise<ICommonList<IRepositoryDetails[]>> => {
    if (id) {
        return get(
            `/api/demand-management/v1/repositorys/catalogs?res_id=${id}`,
        )
    }
    return get(`/api/demand-management/v1/repositorys/catalogs`)
}

// 检查资源是否下线
export const getRepositoryIsOnline = (id: string) => {
    return get(`/api/demand-management/v1/repositorys/${id}/check`)
}

/**
 * 绑定审核流程查询接口
 */
export const getDemandAuditProcessList = (audit_type: string) => {
    return get(`/api/demand-management/v1/audit-process`, { audit_type })
}

/**
 * 绑定审核流程查询接口  V2版
 */
export const getDemandAuditProcessV2List = (audit_type: string) => {
    return get(`/api/demand-management/v2/audit-process`, { audit_type })
}

/**
 * 创建审核流程绑定  V2
 * @param audit_type 审批流程类型
 * @param proc_def_key 审核流程key
 */
export const createDemandAuditProcessV2 = ({
    audit_type,
    proc_def_key,
}): Promise<ICreateDemandAuditProcess> => {
    return post(`/api/demand-management/v2/audit-process`, {
        audit_type,
        proc_def_key,
    })
}

/**
 * 编辑审核流程绑定 V2
 */
export const updateDemandAuditProcessV2 = ({
    id,
    audit_type,
    proc_def_key,
}): Promise<IUpdateDemandAuditProcess> => {
    return put(`/api/demand-management/v2/audit-process/${id}`, {
        audit_type,
        proc_def_key,
    })
}

/**
 * 解绑审核流程 V2
 */
export const deleteDemandAuditProcessV2 = (id): Promise<{ id: string }> => {
    return del(`/api/demand-management/v2/audit-process/${id}`)
}

/**
 * 创建审核流程绑定
 * @param audit_type 审批流程类型
 * @param proc_def_key 审核流程key
 */
export const createDemandAuditProcess = ({
    audit_type,
    proc_def_key,
}): Promise<ICreateDemandAuditProcess> => {
    return post(`/api/demand-management/v1/audit-process`, {
        audit_type,
        proc_def_key,
    })
}

/**
 * 编辑审核流程绑定
 */
export const updateDemandAuditProcess = ({
    id,
    audit_type,
    proc_def_key,
}): Promise<IUpdateDemandAuditProcess> => {
    return put(`/api/demand-management/v1/audit-process/${id}`, {
        audit_type,
        proc_def_key,
    })
}

/**
 * 获取需要绑定的材料列表
 */
export const getDemandFiles = (id: string, auditId?: string) => {
    return get(
        `/api/demand-management/v1/demands/${id}/files?audit_id=${
            auditId || ''
        }`,
    )
}

/**
 * 保存需求确认 同意时的申请材料
 */
export const updateDemandConfirm = (params: IUpdateDemandConfirm) => {
    return put(
        `/api/demand-management/v1/demands/${params.demand_id}/confirm`,
        params,
    )
}

// 关闭需求申请
export const closeDemand = (id: string) => {
    return put(`/api/demand-management/v1/demands/${id}/close`, { id })
}

/**
 * 获取待申请目录列表
 */
export const getApplicationCatalog = (): Promise<IApplicationCatalogItem[]> => {
    return get(`/api/demand-management/v2/application-catalog`)
}

/**
 * 删除待申请目录
 * @param id 目录ID
 */
export const deleteApplicationCatalog = (id: string) => {
    return del(`/api/demand-management/v2/application-catalog/${id}`)
}

/**
 * 添加待申请目录
 * @param catalog_id 目录ID
 */
export const postApplicationCatalog = (
    res_id: string,
    res_type: ShareApplyResourceTypeEnum = ShareApplyResourceTypeEnum.Catalog,
) => {
    return post(`/api/demand-management/v2/application-catalog`, {
        res_id,
        res_type,
    })
}

/**
 * 获取共享申报列表
 */
export const getSharedDeclaration = (params: {
    direction?: SortDirection
    // 排序类型 "created_at" "expected_completion_time"
    sort?: string
    keyword?: string
    limit?: number
    offset?: number
}): Promise<ICommonList<ISharedDeclarationItem[]>> => {
    return get(`/api/demand-management/v1/shared-declaration`, params)
}

/**
 * 共享申报
 * @param catalog_id 目录ID
 */
export const postSharedDeclaration = (params: ISharedDeclarationDetail) => {
    return post(`/api/demand-management/v1/shared-declaration`, params)
}

/**
 * 共享申报重名校验
 */
export const getSharedDeclarationRepeat = (
    application_name: string,
): Promise<any> => {
    return get(`/api/demand-management/v1/shared-declaration/repeat`, {
        application_name,
    })
}

/**
 * 共享申报详情
 */
export const getSharedDeclarationDetail = (
    id: string,
): Promise<ISharedDeclarationDetail> => {
    return get(`/api/demand-management/v1/shared-declaration/${id}`)
}

// 供需管理
/**
 * 供需创建
 */
export const createCityDemand = (
    params: CreateCityDemandRequest,
): Promise<string> => {
    return post(`/api/demand-management/v2/require`, params)
}

/**
 * 供需编辑接口
 */
export const updateCityDemand = (
    requiredID: string,
    params: CreateCityDemandRequest,
): Promise<string> => {
    return put(`/api/demand-management/v2/require/${requiredID}`, params)
}

/**
 * 供需删除接口
 */
export const deleteCityDemand = (requiredID: string) => {
    return del(`/api/demand-management/v2/require/${requiredID}`)
}

/**
 * 供需列表接口
 */
export const getCityDemandList = (
    params: CityDemandRequest,
): Promise<CityDemandResponse> => {
    return get(`/api/demand-management/v2/require`, params)
}

/**
 * 供需详情接口
 */
export const getCityDemandDetail = (
    requiredID: string,
    params: {
        // process_info进度信息,basic_info需求信息;可选择多个字段信息任意组合，多个字段信息用英文逗号分隔
        fields: string
        // 分析ID
        analysis_id?: string
    },
): Promise<CityDemandDetails> => {
    return get(`/api/demand-management/v2/require/${requiredID}`, params)
}

/**
 * 供需分析接口
 */
export const putCityDemandAnalysis = (
    requiredID: string,
    params: CityDemandAnalysisRequest,
): Promise<string> => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/analysis`,
        params,
    )
}

/**
 * 供需确认接口
 */
export const putCityDemandConfirm = (
    requiredID: string,
    params: CityDemandConfirmRequest,
) => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/confirm`,
        params,
    )
}

/**
 * 供需实施接口
 */
export const putCityDemandImplement = (
    requiredID: string,
    params: CityDemandImplementRequest,
) => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/implement`,
        params,
    )
}

/**
 * 审核列表查询接口
 */
export const getCityDemandAuditList = (
    params: CityDemandAuditRequest,
): Promise<CityDemandAuditResponse> => {
    return get(`/api/demand-management/v2/require/audit`, params)
}

/**
 * 供需撤回接口
 */
export const revokeCityDemand = (requiredID: string) => {
    return put(`/api/demand-management/v2/require/${requiredID}/report`)
}

/**
 * 供需分析签收接口
 */
export const signOffCityDemand = (requiredID: string) => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/analysis/sign-off`,
    )
}

/**
 * 供需取消签收接口
 */
export const cancelSignOffCityDemand = (requiredID: string) => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/analysis/sign-off-cancel`,
    )
}

/**
 * 供需分析审核撤销接口
 */
export const cancelCityDemandAnalysis = (requiredID: string) => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/analysis/audit/cancel`,
    )
}

/**
 * 创建归集工单接口
 */
export const createCityDemandWorkOrder = (requiredID: string, params: any) => {
    return put(
        `/api/demand-management/v2/require/${requiredID}/collect-work-order`,
        params,
    )
}

// 共享申请
// 新增共享申请接口
export const postCityShareApply = (params: IAddShareApply) => {
    return post(`/api/demand-management/v1/share-apply`, params)
}

// 编辑共享申请接口
export const putCityShareApply = (id: string, params: IAddShareApply) => {
    return put(`/api/demand-management/v1/share-apply/${id}`, params)
}

// 删除共享申请接口
export const deleteCityShareApply = (id: string) => {
    return del(`/api/demand-management/v1/share-apply/${id}`)
}

// 撤回共享申请接口
export const cancelCityShareApply = (
    id: string,
    params: { cancel_reason: string },
) => {
    return put(`/api/demand-management/v1/share-apply/${id}/cancel`, params)
}

// 分析签收接口
export const signOffCityShareApply = (id: string) => {
    return put(`/api/demand-management/v1/share-apply/${id}/analysis/sign-off`)
}

// 分析签收接口
export const cancelSignOffCityShareApply = (id: string) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/analysis/sign-off/cancel`,
    )
}

// 分析接口
export const putCityShareApplyAnalysis = (
    id: string,
    params: IAnalysesShareApply,
) => {
    return put(`/api/demand-management/v1/share-apply/${id}/analysis`, params)
}

// 分析结论确认接口
export const putCityShareApplyAnalysisConfirm = (
    id: string,
    params: IAnalysesConfirm,
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/analysis/confirm`,
        params,
    )
}

// 数据提供方审核接口
export const putCityShareApplyAnalysisAudit = (
    id: string,
    params: IAnalysisAudit,
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/analysis/audit`,
        params,
    )
}

// 实施签收接口
export const signOffCityShareApplyImplement = (
    id: string,
    params: {
        // 需要签收的分析资源项ID，无该参数则批量签收该共享申请下所有未被实施签收的资源
        analysis_item_id?: string
    },
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/sign-off`,
        params,
    )
}

// 实施方案制定接口
export const putCityShareApplyImplementSolution = (
    id: string,
    params: IImplementSolution,
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/solution`,
        params,
    )
}

// 实施方案确认接口
export const putCityShareApplyImplementSolutionConfirm = (
    id: string,
    params: IImplementSolutionConfirm,
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/solution/confirm`,
        params,
    )
}

// 实施成果确认接口
export const putCityShareApplyImplementAchivementConfirm = (id: string) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/achivement/confirm`,
    )
}

// 查询详情接口
export const getCityShareApplyDetail = (
    id: string,
    params: {
        // 分析记录ID，如不传则取现行的版本
        analysis_id?: string
        // 查询详情信息返回字段,可选择多个字段信息任意组合，多个字段信息用英文逗号分隔
        // 共享申请信息 base: string | 分析信息 analysis: string | 实施信息implement: string | feedback
        // 进度信息 process_info: string | 操作记录 log: string

        fields: string
    },
): Promise<ISharedApplyDetail> => {
    return get(`/api/demand-management/v1/share-apply/${id}`, params)
}

// 查询申请清单（列表）接口
export const getCityShareApplyResourceList = (
    params: IGetShareApplyRequest,
): Promise<IGetShareApplyResponse> => {
    return get(`/api/demand-management/v1/share-apply`, params)
}

// 分析列表接口
export const getCityShareApplyAnalysisList = (
    params: IGetShareApplyRequest,
): Promise<IGetShareApplyResponse> => {
    return get(`/api/demand-management/v1/share-apply/analysis`, params)
}

// 实施列表接口
export const getCityShareApplyImplementList = (
    params: IGetShareApplyRequest,
): Promise<IGetShareApplyResponse> => {
    return get(`/api/demand-management/v1/share-apply/implement`, params)
}

// 审核列表查询
export const getCityShareApplyAuditList = (
    params: IGetShareApplyRequest,
): Promise<IGetShareApplyResponse> => {
    return get(`/api/demand-management/v1/share-apply/audit`, params)
}

// 数据提供方审核列表
export const getCityShareApplyDataProviderAuditList = (
    params: IGetShareApplyRequest,
): Promise<IGetShareApplyResponse> => {
    return get(`/api/demand-management/v1/share-apply/audit/analysis`, params)
}

// 查询指定共享申请下的资源信息列表
export const getCityShareApplyListByID = (
    id: string,
    params: IGetShareApplyRequest,
): Promise<IGetShareApplyByIDResponse> => {
    return get(`/api/demand-management/v1/share-apply/${id}/resources`, params)
}

// 共享申请名称唯一性校验接口
export const getCityShareApplyNameRepeat = (params: {
    name: string
    share_apply_id?: string
}): Promise<{ is_repeated: boolean }> => {
    return get(`/api/demand-management/v1/share-apply/uniqueCheck`, params)
}

// 审核流程绑定接口
export const postCityShareApplyAuditProcess = (params: {
    audit_type: ShareApplyAuditType
}) => {
    return post(`/api/demand-management/v2/audit-process`, params)
}

// 查询审核流程列表接口
export const getCityShareApplyAuditProcessList = (params: {
    audit_type: ShareApplyAuditType
}) => {
    return get(`/api/demand-management/v2/audit-process`, params)
}

/**
 * 共享申请实施接口
 * @param id
 * @param params
 * @returns
 */
export const implementCityShareApply = (
    id: string,
    params: IImplementCityShareApply,
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/solution`,
        params,
    )
}

// 关闭共享申请
export const closeCityShareApply = (id: string) => {
    return put(`/api/demand-management/v1/share-apply/${id}/close`, { id })
}

/**
 * 共享申请实施成果确认接口
 * @param id
 * @param params
 * @returns
 */
export const implementCityShareApplyConfirm = (
    id: string,
    params: IImplementCityShareApplyConfirm,
) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/solution/confirm`,
        params,
    )
}

/**
 * 共享申请实施接口
 * @param id
 * @param params
 * @returns
 */
export const implementApiCityShare = (id: string, analysisId: string) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/${analysisId}`,
    )
}

/**
 * 查询分析资源详情接口
 * @param id
 * @param analysisId
 * @returns
 */
export const getResourceDetailsByAnalysisId = (
    id: string,
    analysisId: string,
): Promise<any> =>
    //    Promise<IShareApplyAnalysisDetail>
    {
        return get(
            `/api/demand-management/v1/share-apply/${id}/analysis/item/${analysisId}`,
        )
    }

/**
 * 共享申请实施详情接口
 * @param id
 * @param params
 * @returns
 */
export const getImplementCityShareApplyDetail = (
    id: string,
    params: IImplementCityShareApplyDetail,
): Promise<ImplementCityShareApplyDetailResult> => {
    return get(
        `/api/demand-management/v1/share-apply/${id}/implement/solution`,
        params,
    )
}

/**
 * 数据分析需求创建接口
 */
export const postDataAnalRequire = (
    params: IDataAnalRequire,
): Promise<string> => {
    return post('/api/demand-management/v2/data-anal-require', params)
}

/**
 * 数据分析需求编辑接口
 */
export const putDataAnalRequire = (
    id: string,
    params: IDataAnalRequire,
): Promise<string> => {
    return put(`/api/demand-management/v2/data-anal-require/${id}`, params)
}

/**
 * 数据分析需求删除接口
 */
export const deleteDataAnalRequire = (id: string): Promise<string> => {
    return del(`/api/demand-management/v2/data-anal-require/${id}`)
}

/**
 * 数据分析需求撤回接口
 */
export const cancelDataAnalRequire = (
    id: string,
    params: { cancel_reason: string },
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/report/cancel`,
        params,
    )
}

/**
 * 数据分析需求签收接口
 */
export const signOffDataAnalRequire = (id: string): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/analysis/sign-off`,
    )
}

/**
 * 数据分析需求分析签收取消接口
 */
export const cancelSignOffDataAnalRequire = (id: string): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/analysis/sign-off/cancel`,
    )
}

/**
 * 数据分析需求分析接口
 */
export const putDataAnalRequireAnalysis = (
    id: string,
    params: IDataAnalAnalysis,
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/analysis`,
        params,
    )
}

/**
 * 数据分析需求分析确认接口
 */
export const putDataAnalRequireConfirm = (
    id: string,
    params: IDataAnalConfirm,
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/analysis/confirm`,
        params,
    )
}

/**
 * 数据分析需求实施签收接口
 */
export const signOffDataAnalRequireImplement = (
    id: string,
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/implement/sign-off`,
    )
}

export const cancelSignOffDataAnalRequireImplement = (
    id: string,
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/implement/sign-off/cancel`,
    )
}

/**
 * 数据分析需求实施接口
 */
export const putDataAnalRequireImplement = (
    id: string,
    params: {
        impl_achivements?: IDataAnalImplement[]
    },
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/implement`,
        params,
    )
}

/**
 * 数据分析需求实施成果确认接口
 */
export const putDataAnalRequireImplementConfirm = (
    id: string,
    params: IDataAnalImplementConfirmParams,
): Promise<string> => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/implement/achivement/confirm`,
        params,
    )
}

/**
 * 数据分析需求关闭接口
 */
export const closeDataAnalRequire = (id: string): Promise<string> => {
    return put(`/api/demand-management/v2/data-anal-require/${id}/close`)
}

/**
 * 数据分析需求清单查询接口
 */
export const getDataAnalRequireList = (
    params: IDataAnalListRequest,
): Promise<IDataAnalRequireListResponse> => {
    return get('/api/demand-management/v2/data-anal-require', params)
}

/**
 * 	实施（分析成果）确认列表查询接口
 */
export const getDataAnalImpConfirmList = (
    params: IDataAnalListRequest,
): Promise<IDataAnalRequireListResponse> => {
    return get(
        '/api/demand-management/v2/data-anal-require/impl-confirm',
        params,
    )
}

/**
 * 分析成果出库列表查询接口
 */
export const getDataAnalOutboundList = (
    params: IDataAnalOutboundListRequest,
): Promise<IDataAnalRequireListResponse> => {
    return get('/api/demand-management/v2/data-anal-require/outbound', params)
}

/**
 * 分析完善列表查询接口
 */
export const getDataAnalRequireAnalysisList = (
    params: IDataAnalListRequest,
): Promise<IDataAnalRequireListResponse> => {
    return get('/api/demand-management/v2/data-anal-require/analysis', params)
}

/**
 * 数据资源实施列表查询接口
 */
export const getDataAnalRequireImplementList = (
    params: IDataAnalListRequest,
): Promise<IDataAnalRequireListResponse> => {
    return get('/api/demand-management/v2/data-anal-require/implement', params)
}

/**
 * 数据分析需求详情查询接口
 */
export const getDataAnalRequireDetail = (
    id: string,
    params: IDataAnalDetailRequest,
): Promise<IDataAnalRequireDetail> => {
    return get(`/api/demand-management/v2/data-anal-require/${id}`, params)
}

/**
 * 审核列表查询接口
 */
export const getDataAnalRequireAuditList = (
    params: { audit_type?: DataAnalAuditType } & IDataAnalListRequest,
): Promise<IDataAnalRequireListResponse> => {
    return get('/api/demand-management/v2/data-anal-require/audit', params)
}

/**
 * 根据产物ID查产物及需求名称接口
 */
export const getDataAnalOutputItemDetail = (
    id: string,
): Promise<{
    anal_output_item_id: string
    anal_output_item_name: string
    data_anal_req_id: string
    data_anal_req_name: string
}> => {
    return get(
        `/api/demand-management/v2/data-anal-require/anal-output-item/${id}`,
    )
}

/**
 * 数据分析需求名称唯一性校验接口
 */
export const getDataAnalRequireUniqueCheck = (params: {
    name: string
}): Promise<{ is_repeated: boolean }> => {
    return get(
        `/api/demand-management/v2/data-anal-require/uniqueCheck`,
        params,
    )
}

/**
 * 共享申请发起成效反馈
 */
export const startFeedback = (params: IStartFeedbackParams) => {
    return put(`/api/demand-management/v1/share-apply/feedback/start`, params)
}

/**
 * 共享申请成效反馈
 */
export const shareApplyFeedback = (
    id: string,
    params: { feedback_content: string },
) => {
    return put(`/api/demand-management/v1/share-apply/${id}/feedback`, params)
}

/**
 * 成效反馈列表
 */
export const getShareApplyFeedbackList = (
    params: IShareApplyFeedbackListParams,
): Promise<IShareApplyFeedbackListResponse> => {
    return get(`/api/demand-management/v1/share-apply/feedback`, params)
}

/**
 * 融合工单创建(代理接口)接口
 * @param dataAnalRequireID 数据分析需求ID，雪花ID
 * @param params anal_output_item_id 分析场景产物ID
 * @param params params 创建融合工单参数json字符串，直接透传融合工单用于创建，不做检验等处理
 * @returns
 */
export const putDataFusionInDataAnal = (
    dataAnalRequireID: string,
    anal_output_item_id: string,
    params: string,
) => {
    return put(
        `/api/demand-management/v2/data-anal-require/${dataAnalRequireID}/data-fusion`,
        { anal_output_item_id, params },
    )
}

// 数据分析需求编目列表查询接口
export const getDataAnalCatalogList = (
    params: IDataAnalListRequest,
): Promise<IDataAnalCatalogListResponse> => {
    return get(`/api/demand-management/v2/data-anal-require/catalog`, params)
}

// 	数据资源编目列表展开产物列表查询接口
export const getDataAnalCatalogOutputItemList = (
    dataAnalRequireID: string,
): Promise<IDataAnalCatalogOutputItem[]> => {
    return get(
        `/api/demand-management/v2/data-anal-require/${dataAnalRequireID}/catalog/output-items`,
    )
}

// 数据推送确认列表查询接口
export const getDataAnalPushConfirmList = (
    params: IDataAnalPushConfirmListRequest,
): Promise<ICommonRes<IDataAnalPushConfirmItem>> => {
    return get(
        `/api/demand-management/v2/data-anal-require/push-confirm`,
        params,
    )
}

/**
 * 推送工单创建(代理接口)接口
 * @param id
 * @param params
 * @returns
 */
export const dataAnalDataPush = (
    dataAnalRequireID: string,
    params: {
        id: string
        params: string
    },
) => {
    return put(
        `/api/demand-management/v2/data-anal-require/${dataAnalRequireID}/data-push`,
        params,
    )
}

/**
 * 数据推送确认接口
 * @param id
 * @param params
 * @returns
 */
export const dataAnalDataPushConfirm = (dataAnalRequireID: string) => {
    return put(
        `/api/demand-management/v2/data-anal-require/${dataAnalRequireID}/push-confirm`,
    )
}

/**
 * 数据分析发起成效反馈
 */
export const dataAnalStartFeedback = (params: IStartDataAnalFeedbackParams) => {
    return put(
        `/api/demand-management/v2/data-anal-require/feedback/start`,
        params,
    )
}

/**
 * 数据分析成效反馈
 */
export const dataAnalFeedback = (
    id: string,
    params: { feedback_content: string },
) => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/feedback`,
        params,
    )
}

/**
 * 数据分析成效反馈列表
 */
export const getDataAnalFeedbackList = (
    params: ICommonFeedbackListParams,
): Promise<ICommonRes<IDataAnalFeedbackItem>> => {
    return get(`/api/demand-management/v2/data-anal-require/feedback`, params)
}

/**
 * 数据分析成效反馈状态计数接口
 */
export const getDataAnalFeedbackCount = (): Promise<IDataAnalFeedbackCount> => {
    return get(`/api/demand-management/v2/data-anal-require/feedback/count`)
}

/**
 * 数据分析出库申请
 */
export const dataAnalOutbound = (
    id: string,
    params: { entries: IDataAnalOutboundItem[] },
) => {
    return put(
        `/api/demand-management/v2/data-anal-require/${id}/outbound`,
        params,
    )
}

/**
 * 同步订阅接口
 */
export const syncSubService = (id: string, analysisId: string) => {
    return put(
        `/api/demand-management/v1/share-apply/${id}/implement/${analysisId}/subscribe`,
    )
}

// 接口订阅查询接口
export const getApiSubList = (
    params: IGetApiSubListParams,
): Promise<ICommonList<IGetApiSubListResponse[]>> => {
    return get(`/api/demand-management/v1/api-sub`, params)
}

// 接口订阅启用/停用接口
export const putApiSubStatus = (
    id: string,
    dst_sub_status: SystemAccessStatus,
) => {
    return put(
        `/api/demand-management/v1/api-sub/${id}/status/${dst_sub_status}`,
    )
}

// 接口订阅编辑接口
export const putApiSub = (
    id: string,
    params: {
        call_frequency: number
    },
) => {
    return put(`/api/demand-management/v1/api-sub/${id}`, params)
}

// 数据资源需求概览--start

// 需求总览接口
export const getOverview = (): Promise<IOverviewList> => {
    return get(`/api/demand-management/v2/overview`)
}

// 	部门申请需求统计接口
export const getApplyStatistic = (): Promise<IApplyStatisticList> => {
    return get(`/api/demand-management/v2/overview/apply-statistic`)
}

// 部门已完成需求统计接口
export const getProcStatistic = (): Promise<IProcStatisticList> => {
    return get(`/api/demand-management/v2/overview/proc-statistic`)
}

// 需求处理时长分布统计接口
export const getProcTimeStatistic = ({
    begin_time,
    end_time,
}: {
    begin_time: number
    end_time: number
}): Promise<IProcTimeStatisticList> => {
    return get(`/api/demand-management/v2/overview/proc-time-statistic`, {
        begin_time,
        end_time,
    })
}

// 数据资源需求概览--end

// ----------------------------个人中心-我的资源 start--------------------------------

// 我的资源申请通过的库表列表查询
export const getAppliedViewList = (
    params: IGetListParams,
): Promise<ICommonRes<IAppliedViewItem>> => {
    return get(`/api/demand-management/v2/my-resource/applied-view`, params)
}

// 我的资源申请通过的接口列表查询
export const getAppliedApiList = (
    params: IGetListParams,
): Promise<ICommonRes<IAppliedApiItem>> => {
    return get(`/api/demand-management/v2/my-resource/applied-api`, params)
}

// 我的资源申请通过的接口对应共享申请列表查询
export const getAppliedApiShareApplyList = (
    id: string,
): Promise<IAppliedApiShareApplyItem[]> => {
    return get(
        `/api/demand-management/v2/my-resource/applied-api/${id}/share-applys`,
    )
}

// 我的资源申请通过的库表对应共享申请列表查询
export const getAppliedViewShareApplyList = (
    id: string,
): Promise<IAppliedViewShareApplyItem[]> => {
    return get(
        `/api/demand-management/v2/my-resource/applied-view/${id}/share-applys`,
    )
}

// ----------------------------个人中心-我的资源--------------------------------

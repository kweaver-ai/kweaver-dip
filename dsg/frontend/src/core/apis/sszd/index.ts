import requests from '@/utils/request'
import {
    ISSZDDemandDetailParams,
    ISSZDDemandDetails,
    ICreateSSZDDemandParams,
    IAnalysisSSZDDemandParams,
    IGetSSZDDemandParams,
    IGetSSZDDemandRes,
    SSZDDictTypeEnum,
    ISSZDDict,
    ISSZDOrganization,
    IGetSSZDCatalogParams,
    ISSZDCatalog,
    SSZDSyncTaskEnum,
    IShareApplyDetail,
    IShareApplyBasic,
    IExchangeRecord,
    IShareApplyCreateParams,
    ISSZDDataSource,
    IShareApplySubInfo,
    SSZDSyncTaskType,
    ISSZDSyncTask,
    IShareApplyAudit,
    IGetSSZDDemandAuditList,
    IGetSSZDDemandAuditListRes,
    IGetSSZDCatalogReportRecord,
    IGetSSZDCatalogReportRecordRes,
    IProvinceApp,
    ISSZDHasSynchTask,
    IGetSSZDReportRecord,
    ISSZDReportRecordItem,
    IGetSSZDCatlgAuditRecord,
    ISSZDCatlgAuditRecordItem,
    ICreateSSZDDataObjectionParams,
    IEvaluationParams,
    ObjectionTargetEnum,
    IGetSSZDDataObjectionListParams,
    HandleObjectionOperateEnum,
    ISSZDAuditRecordItem,
    ISSZDAuditOperation,
} from './index.d'
import { ICommonRes } from '../common'

const { get, post, put, delete: del } = requests

// 需求详情
export const getSSZDDemandDetails = (
    params: ISSZDDemandDetailParams,
): Promise<ISSZDDemandDetails> => {
    const { id, fields, view } = params
    return get(`/api/sszd-service/v1/demand/${id}/${view}/${fields}`)
}

// 查询当前是否有正在进行的同步任务接口
export const getSSZDHasSynchTask = (
    taskType: SSZDSyncTaskEnum,
): Promise<ISSZDHasSynchTask> => {
    return get(`/api/sszd-service/v1/sync-task/${taskType}`)
}

// 创建下行同步任务接口
export const createSSZDSynchTask = (
    taskType: SSZDSyncTaskEnum,
): Promise<{ id?: string }> => {
    return post(`/api/sszd-service/v1/sync-task/${taskType}`)
}

// 供需列表查询
export const getSSZDDemand = (
    params: IGetSSZDDemandParams,
): Promise<IGetSSZDDemandRes> => {
    return get(`/api/sszd-service/v1/demand`, params)
}

// 上报（审核）撤销
export const cancelSSZDEscalateAuditDemand = (
    id: string,
    params: { cancel_reason: string },
): Promise<IGetSSZDDemandRes> => {
    return put(
        `/api/sszd-service/v1/demand/${id}/escalate-audit/cancel`,
        params,
    )
}

// 创建需求
export const createSSZDDemand = (params: ICreateSSZDDemandParams) => {
    return post(`/api/sszd-service/v1/demand`, params)
}

// 供需上报
export const escalateSSZDDemand = (id: string) => {
    return put(`/api/sszd-service/v1/demand/${id}/escalate`)
}

// 供需分析签收
export const analysisSignoffSSZDDemand = (id: string) => {
    return put(`/api/sszd-service/v1/demand/${id}/analysis/sign-off`)
}

// 供需分析签收
export const analysisSSZDDemand = (
    id: string,
    params: IAnalysisSSZDDemandParams,
) => {
    return put(`/api/sszd-service/v1/demand/${id}/analysis/sign-off`, params)
}

// 供需实施签收
export const implementSignoffSSZDDemand = (id: string) => {
    return put(`/api/sszd-service/v1/demand/${id}/implement/sign-off`)
}

// 供需实施
export const implementSSZDDemand = (
    id: string,
    params: { resources: { catalog_id: string; resource_id: string }[] },
) => {
    return put(`/api/sszd-service/v1/demand/${id}/implement`, params)
}

// 审核流程查询接口
export const getSSZDDemandAuditProcess = (params: { audit_type?: string }) => {
    return get(`/api/sszd-service/v1/audit-process`, params)
}

// 审核流程绑定接口
export const bindSSZDDemandAuditProcess = (params: {
    audit_type: string
    proc_def_key: string
}) => {
    return post(`/api/sszd-service/v1/audit-process`, params)
}

// 审核流程绑定更新接口
export const updateSSZDDemandAuditProcess = (
    bindId: string,
    params: {
        audit_type: string
        proc_def_key: string
    },
) => {
    return put(`/api/sszd-service/v1/audit-process/${bindId}`, params)
}

// 审核流程解绑接口
export const deleteSSZDDemandAuditProcess = (bindId: string) => {
    return del(`/api/sszd-service/v1/audit-process/${bindId}`)
}

// 文件上传
export const importSSZDFile = (file: FormData): Promise<{ id }> => {
    // 超时时候设置3min
    return post(`/api/sszd-service/v1/file`, file, {
        timeout: 3 * 60 * 1000,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

// 下载文件
export const downloadSSZDDemandFile = (id: string) => {
    return get(
        `/api/sszd-service/v1/file/${id}`,
        {},
        {
            responseType: 'arraybuffer',
        },
    )
}

// 文件删除
export const deleteSSZDDemandFile = (fileId: string) => {
    return del(`/api/sszd-service/v1/file/${fileId}`)
}

// 字典查询接口
export const getSSZDDict = (
    dict_type: SSZDDictTypeEnum[],
): Promise<ISSZDDict> => {
    return get(`/api/sszd-service/v1/dict`, { dict_type: dict_type.join(',') })
}

// 省组织机构树查询接口
export const getSSZDOrganization = (
    parent_code?: string,
): Promise<{ entries: ISSZDOrganization[] }> => {
    return get(`/api/sszd-service/v1/organization`, {
        parent_code,
    })
}

// 数据目录分页列表接口
export const getSSZDCatalog = (
    params: IGetSSZDCatalogParams,
): Promise<{ entries: ISSZDCatalog[]; total_count: number }> => {
    const { share_type, ...otherParams } = params
    let shareTypeParam = ''
    share_type?.forEach?.((type) => {
        shareTypeParam =
            // eslint-disable-next-line
            `share_type=${type}${shareTypeParam ? '&' : ''}` + shareTypeParam
    })
    return get(
        `/api/sszd-service/v1/catalog${
            shareTypeParam ? `?${shareTypeParam}` : ''
        }`,
        otherParams,
    )
}

/** ************ 目录/资源上报&审核 Start*************** */
// 目录上报
export const createSSZDCatlgReport = (params: {
    catalog_id: string
    operation: ISSZDAuditOperation.Report | ISSZDAuditOperation.ReReport
}): Promise<{ id: string }> => {
    return post(`/api/sszd-service/v1/catalog/report`, params)
}
// 资源上报
export const createSSZDResourceReport = (params: {
    catalog_id: string
    operation: ISSZDAuditOperation.Report | ISSZDAuditOperation.ReReport
}): Promise<{ id: string }> => {
    return post(`/api/sszd-service/v1/catalog/resource/report`, params)
}
// 撤回已上报过目录
export const revocationSSZDCatlgReport = (
    catalog_id: string,
): Promise<{ id: string }> => {
    return put(`/api/sszd-service/v1/catalog/revocation`, { catalog_id })
}
// 撤回已上报过资源
export const revocationSSZDResourceReport = (
    resource_key: string,
): Promise<{ id: string }> => {
    return put(`/api/sszd-service/v1/catalog/resource/revocation`, {
        resource_key,
    })
}
// 取消目录上报在市级审核
export const cancelSSZDCatlgReport = (
    catalog_id: string,
): Promise<{ id: string }> => {
    return put(`/api/sszd-service/v1/catalog/cancel`, { catalog_id })
}

// 取消资源上报在市级审核
export const cancelSSZDResourceReport = (
    resource_key: string,
): Promise<{ id: string }> => {
    return put(`/api/sszd-service/v1/catalog/resource/cancel`, {
        resource_key,
    })
}

// 目录上报记录查询
export const getSSZDReportRecord = (
    params: IGetSSZDReportRecord,
): Promise<ICommonRes<ISSZDReportRecordItem>> => {
    return get(`/api/sszd-service/v1/catalog/report/record`, params)
}

// 资源上报记录查询
export const getSSZDRescReportRecord = (
    params: IGetSSZDReportRecord,
): Promise<ICommonRes<ISSZDReportRecordItem>> => {
    return get(`/api/sszd-service/v1/catalog/resource/report/record`, params)
}

// 目录/资源审核记录列表
export const getSSZDCatlgAuditRecordList = (
    params: IGetSSZDCatlgAuditRecord,
): Promise<ICommonRes<ISSZDCatlgAuditRecordItem>> => {
    return get(`/api/sszd-service/v1/catalog/audit`, params)
}
// 目录审核结果列表
export const getSSZDAuditRecord = (
    id: string,
): Promise<ICommonRes<ISSZDAuditRecordItem>> => {
    return get(`/api/sszd-service/v1/catalog/${id}/audit`)
}
// 资源审核结果列表
export const getSSZDResourceAuditRecord = (
    resource_key: string,
): Promise<ICommonRes<ISSZDAuditRecordItem>> => {
    return get(`/api/sszd-service/v1/catalog/resource/${resource_key}/audit`)
}

/** ************ 目录上报&审核 End*************** */

export const checkSSZDDemandName = (params: { title: string }) => {
    return get('/api/sszd-service/v1/demand/check', params)
}

// 创建同步任务接口
export const createSSZDSyncTask = (
    taskType: SSZDSyncTaskEnum,
): Promise<{ id: string }> => {
    return post(`/api/sszd-service/v1/sync-task/${taskType}`)
}

/**
 * 查询当前是否有正在进行的同步任务接口
 * @param taskType 下行同步任务类型
 */
export const getSSZDSyncTask = (
    taskType: SSZDSyncTaskEnum,
): Promise<ISSZDSyncTask> => {
    return get(`/api/sszd-service/v1/sync-task/${taskType}`)
}

// 需求撤销接口
export const cancelSSZDDemand = (
    id: string,
    params: { cancel_reason: string },
) => {
    return put(
        `/api/sszd-service/v1/demand/${id}/escalate-audit/cancel`,
        params,
    )
}
/**
 * 共享申请创建
 */
export const postShareApply = (params: IShareApplyCreateParams) => {
    return post(`/api/sszd-service/v1/share-apply`, params)
}

/**
 * 共享申请上报
 * @param applyID 共享申请ID
 * @returns
 */
export const putShareApplyEscalate = (applyID: string) => {
    return put(`/api/sszd-service/v1/share-apply/${applyID}/escalate`)
}

/**
 * 共享申请一键提交审批（批量创建审批实例-异步创建）
 */
export const postShareApplyApproveAuditInstance = () => {
    return post(`/api/sszd-service/v1/share-apply/approve-audit/instance`)
}

/**
 * 共享申请审批上报
 * @param applyID 共享申请ID
 */
export const putShareApplyApproveAuditEscalate = (applyID: string) => {
    return put(
        `/api/sszd-service/v1/share-apply/${applyID}/approve-audit/escalate`,
    )
}

/**
 * 资源订阅
 * @param applyID 共享申请ID
 */
export const putShareApplySub = (
    applyID: string,
    params: { data_source_id?: string },
) => {
    return put(`/api/sszd-service/v1/share-apply/${applyID}/sub`, params)
}

/**
 * 资源退订
 * @param applyID 共享申请ID
 */
export const putShareApplyUnsub = (applyID: string) => {
    return put(`/api/sszd-service/v1/share-apply/${applyID}/unsub`)
}

/**
 * 查询订阅信息
 * @param applyID 共享申请ID
 */
export const getShareApplySubInfo = (
    applyID: string,
): Promise<IShareApplySubInfo> => {
    return get(`/api/sszd-service/v1/share-apply/${applyID}/sub-info`)
}

/**
 * 共享申请详情查询
 * @param applyID 共享申请ID
 */
export const getShareApplyDetail = (
    applyID: string,
): Promise<IShareApplyDetail> => {
    return get(`/api/sszd-service/v1/share-apply/${applyID}`)
}

/**
 * 共享申请列表查询
 * @param applyID 共享申请ID
 */
export const getShareApplyList = (params: {
    offset?: number
    limit?: number
    // updated_at：更新时间，默认排序类型 created_at：创建/申请时间 subscribe_at：订阅时间
    sort?: string
    direction?: string
    keyword?: string
    // 列表类型 apply：申请的资源（创建者）subscribe：订阅的资源（创建者）todo：处理的资源（运营角色）
    target: string
    // 共享申请状态
    status?: string
}): Promise<{
    total_count: number
    entries: IShareApplyBasic[]
}> => {
    return get(`/api/sszd-service/v1/share-apply`, params)
}

/**
 * 审核列表查询
 * @param applyID 共享申请ID
 */
export const getShareApplyAuditList = (params: {
    offset?: number
    limit?: number
    // 审核列表类型 tasks 待审核 historys 已审核
    target: string
    // 审批流程类型，多个用逗号分隔 af-sszd-share-apply-escalate 省市直达共享申请上报审核 af-sszd-share-apply-approve 省市直达共享申请审批
    audit_type?: string
}): Promise<{
    total_count: number
    entries: IShareApplyAudit[]
}> => {
    return get(`/api/sszd-service/v1/share-apply/audit`, params)
}

/**
 * 上报（审核）撤销
 * @param applyID 共享申请ID
 * @cancel_reason 撤销原因
 */
export const putShareApplyEscalateAuditCancel = (
    applyID: string,
    cancel_reason: string,
) => {
    return put(
        `/api/sszd-service/v1/share-apply/${applyID}/escalate-audit/cancel`,
        { cancel_reason },
    )
}

/**
 * 交换记录查询
 * @param applyID 共享申请ID
 */
export const getShareApplyExchangeRecord = (
    applyID: string,
): Promise<{
    entries: IExchangeRecord[]
}> => {
    return get(`/api/sszd-service/v1/share-apply/${applyID}/exchange-record`)
}

/**
 * 查询数据源
 * @param ds_type 数据源类型 db-数据库 fs-文件服务
 */
export const getSSZDDataSource = (
    ds_type: 'db' | 'fs',
): Promise<{
    entries: ISSZDDataSource[]
}> => {
    return get(`/api/sszd-service/v1/data-source`, { ds_type })
}

// 审核列表查询接口
export const getSSZDDemandAuditList = (
    params: IGetSSZDDemandAuditList,
): Promise<IGetSSZDDemandAuditListRes> => {
    return get(`/api/sszd-service/v1/demand/audit`, params)
}

// 获取目录上报记录列表接口
export const getSSZDCatalogReportRecord = (
    params: IGetSSZDCatalogReportRecord,
): Promise<IGetSSZDCatalogReportRecordRes> => {
    return get(`/api/sszd-service/v1/catalog/report/record`, params)
}

// 获取应用系统列表接口
export const getSSZDProvinceApp = (): Promise<{
    entries: IProvinceApp[]
    total_count: number
}> => {
    return get(`/api/sszd-service/v1/province-app`)
}
// 数据异议
/**
 * 处理的异议列表接口
 */
export const getHandleObjection = (params: IGetSSZDDataObjectionListParams) => {
    return get(`/api/sszd-service/v1/handle-objection`, params)
}

/**
 * 处理的异议详情接口
 */
export const getHandleObjectionDetails = (objectionID: string) => {
    return get(`/api/sszd-service/v1/handle-objection/${objectionID}`)
}

/**
 * 提出的异议列表接口
 */
export const getRaiseObjection = (params: IGetSSZDDataObjectionListParams) => {
    return get(`/api/sszd-service/v1/raise-objection`, params)
}

/**
 * 提出的异议详情接口
 */
export const getRaiseObjectionDetails = (objectionID: string) => {
    return get(`/api/sszd-service/v1/raise-objection/${objectionID}`)
}

/**
 * 处理的异议审核列表查询接口
 */
export const getRaiseObjectionAudit = (params: {
    limit?: number
    offset?: number
    target?: ObjectionTargetEnum
}) => {
    return get(`/api/sszd-service/v1/raise-objection/audit`, params)
}

/**
 * 创建数据异议接口
 */
export const createSSZDDataObjection = (
    params: ICreateSSZDDataObjectionParams,
) => {
    return post(`/api/sszd-service/v1/raise-objection`, params)
}

/**
 * 上报（审核）撤销接口
 */
export const cancelRaiseObjectionAudit = (objectionID: string) => {
    return put(
        `/api/sszd-service/v1/raise-objection/${objectionID}/objection-audit/cancel`,
    )
}

/**
 * 评价异议接口
 */
export const evaluationRaiseObjection = (
    objectionID: string,
    params: IEvaluationParams,
) => {
    return put(
        `/api/sszd-service/v1/raise-objection/${objectionID}/evaluation`,
        params,
    )
}

/**
 * 处理异议接口
 */
export const handleObjection = (
    objectionID: string,
    params: {
        comment: string
        operate: HandleObjectionOperateEnum
    },
) => {
    return put(
        `/api/sszd-service/v1/handle-objection/${objectionID}/handle`,
        params,
    )
}

/**
 * 上报异议接口
 */
export const reportObjection = (objectionID: string) => {
    return put(`/api/sszd-service/v1/raise-objection/${objectionID}/report`)
}

/**
 * 转办异议接口
 */
export const transferObjection = (
    objectionID: string,
    params: {
        department_id: string
        user_id: string
    },
) => {
    return put(
        `/api/sszd-service/v1/handle-objection/${objectionID}/transfer`,
        params,
    )
}

// 上报应用列表
export const getSSZDProvinceAppList = (): Promise<{
    total_count: number
    entries: any[]
}> => {
    return get(`/api/sszd-service/v1/province-app`)
}

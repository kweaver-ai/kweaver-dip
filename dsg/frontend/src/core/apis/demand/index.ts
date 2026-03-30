import requests from '@/utils/request'
import {
    ICreateDemandParams,
    IGetApplyDemandsParams,
    IDemandListRes,
    IDemandBaseInfo,
    IDemandLogRes,
    IAnalysisResult,
    IDemandItemDetails,
    IGetDemandMgtList,
    IDemandListItem,
    IDemandMgtListItem,
    IAnalysisBackParams,
    IDemandItemInfo,
    IImplemnetBackParams,
    IImplementResBack,
    IDemandDetails,
    IDemandDetailParams,
    IImplementAuthApplyParams,
    DemandDetailView,
} from './index.d'

const { get, post, put, delete: del } = requests

// 获取需求列表(我的申请)
export const getApplyDemandsV2 = (
    params: IGetApplyDemandsParams,
): Promise<IDemandListRes<IDemandListItem>> => {
    return get('/api/demand-management/frontend/v2/demand/apply', params)
}
// 创建需求
export const createDemandV2 = (
    params: ICreateDemandParams,
): Promise<{ id: string }> => {
    return post('/api/demand-management/frontend/v2/demand', params)
}

export const checkDemandNameV2 = (params: { title: string }) => {
    return get('/api/demand-management/frontend/v2/demand/check', params)
}

// 下载文件
export const downloadDemandFileV2 = (id: string) => {
    return get(
        `/api/demand-management/v2/file/${id}`,
        {},
        {
            responseType: 'arraybuffer',
        },
    )
}

// 文件上传
export const importDemandFile = (file: FormData): Promise<{ id }> => {
    // 超时时候设置3min
    return post(`/api/demand-management/v2/file`, file, {
        timeout: 3 * 60 * 1000,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

// 获取基本信息详情 (需求信息--前台)
export const getDemandBaseInfoV2 = (id: string): Promise<IDemandBaseInfo> => {
    return get(`/api/demand-management/frontend/v2/demand/${id}/base-info`)
}

// 获取基本信息详情 (需求信息--后台)
export const getDemandBaseInfoBackV2 = (
    id: string,
): Promise<IDemandBaseInfo> => {
    return get(`/api/demand-management/v2/demand/${id}/base-info`)
}

// 获取操作记录
export const getDemandLogV2 = (id: string): Promise<IDemandLogRes> => {
    return get(`/api/demand-management/frontend/v2/demand/${id}/log`)
}

// 获取分析结果 (前台)
export const getDemandAnalysisResultV2 = (
    id: string,
): Promise<IAnalysisResult> => {
    return get(
        `/api/demand-management/frontend/v2/demand/${id}/analysis/base-info`,
    )
}

// 分析结果查询接口（后台，仅供查看场景用）
export const getDemandAnalysisResultBackV2 = (
    id: string,
): Promise<IAnalysisResult> => {
    return get(`/api/demand-management/v2/demand/${id}/analysis/base-info`)
}

// 需求项详情
export const getDemandItemDetailsV2 = (
    id: string,
    itemId: string,
): Promise<IDemandItemDetails> => {
    return get(
        `/api/demand-management/frontend/v2/demand/${id}/analysis/item/${itemId}`,
    )
}

// 需求详情
export const getDemandDetailsV2 = (
    params: IDemandDetailParams,
): Promise<IDemandDetails> => {
    const { id, fields, view, analysis_id } = params
    return get(`/api/demand-management/v2/demand/${id}/${fields}`, {
        view,
        analysis_id,
    })
}

// 需求项详情(后台，查看场景)
export const getDemandItemDetailsBackV2 = (
    id: string,
    itemId: string,
): Promise<IDemandItemDetails> => {
    return get(`/api/demand-management/v2/demand/${id}/analysis/item/${itemId}`)
}

// 获取需求列表(待签收的、我处理的、我的待办)
export const getDemandMgtListV2 = (
    params: IGetDemandMgtList,
): Promise<IDemandListRes<IDemandMgtListItem>> => {
    return get('/api/demand-management/v2/demand', params)
}

// 分析签收
export const analysisSignOffV2 = (id: string) => {
    return put(`/api/demand-management/v2/demand/${id}/analysis/sign-off`)
}

// 实施签收
export const implementSignOffV2 = (id: string) => {
    return put(`/api/demand-management/v2/demand/${id}/implement/sign-off`)
}

// 分析结果查询接口 （后台，仅供编辑场景即分析时用）
export const getAnalysisResultBackV2 = (
    id: string,
): Promise<IAnalysisResult> => {
    return get(`/api/demand-management/v2/demand/${id}/analysis`)
}

// 分析(后台)
export const analysisBackV2 = (id: string, params: IAnalysisBackParams) => {
    return put(`/api/demand-management/v2/demand/${id}/analysis`, params)
}

// 分析确认接口（前台）
export const analysisConfirmV2 = (
    id: string,
    params: { confirm_result: 'pass' | 'reject'; reject_reason?: string },
) => {
    return put(
        `/api/demand-management/frontend/v2/demand/${id}/analysis/confirm`,
        params,
    )
}

// 需求项详情查询接口（后台，仅供查看场景用）
export const getItemDetails = (
    did: string,
    itemId: string,
): Promise<IDemandItemInfo> => {
    return get(
        `/api/demand-management/v2/demand/${did}/analysis/item/${itemId}`,
    )
}

// 实施阶段(后台)-资源提交申请
export const submitAuthApplyBackV2 = (
    params: IImplementAuthApplyParams,
): Promise<any> => {
    const { demandID, analysisID, ids } = params
    return put(
        `/api/demand-management/v2/demand/${demandID}/analysis/${analysisID}/auth-apply`,
        {
            ids,
        },
    )
}

/**
 * 实施接口（后台）
 * @param id 需求id
 * @returns
 */
export const implementBackV2 = (id: string) => {
    return put(`/api/demand-management/v2/demand/${id}/implement`)
}

// 实施结果查询接口（后台）
export const getImplementResBackV2 = (
    id: string,
): Promise<IImplementResBack> => {
    return get(`/api/demand-management/v2/demand/${id}/implement`)
}

// 实施验收接口（前台）
export const implementAcceptV2 = (
    id: string,
    params: { accept_feedback?: string },
) => {
    return put(
        `/api/demand-management/frontend/v2/demand/${id}/implement/accept`,
        params,
    )
}

// 需求撤销接口（前台）
export const cancelDemandV2 = (
    id: string,
    params: { canceled_reason: string },
) => {
    return put(`/api/demand-management/frontend/v2/demand/${id}/cancel`, params)
}

// 需求详情
export const getDetailsOfDemand = (
    pathParams: {
        id: string
        fields: (
            | 'process_info'
            | 'log'
            | 'basic_info'
            | 'analysis_result'
            | 'implement_result'
        )[]
    },
    queryParams: {
        view: DemandDetailView
        analysis_id?: string
    },
): Promise<IDemandDetails> => {
    return get(
        `/api/demand-management/v2/demand/${
            pathParams.id
        }/${pathParams.fields.join(',')}`,
        queryParams,
    )
}

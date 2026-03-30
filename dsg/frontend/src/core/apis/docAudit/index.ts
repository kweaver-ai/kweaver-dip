import { IDocAudit, IDocAuditAuthority } from './index.d'
import requests from '@/utils/request'

const { get, post, put, delete: del } = requests

export const docAuditAuthority = (params: IDocAuditAuthority): Promise<any> => {
    return get('/api/doc-audit-rest/v1/doc-audit/authority', params)
}

// 审核同意/拒绝
export const putDocAudit = (params: IDocAudit): Promise<any> => {
    return put('/api/doc-audit-rest/v1/doc-audit', params, {
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
        },
    })
}

export const delAudit = (id: string) => {
    return del(`/api/doc-audit-rest/v1/doc-audit/${id}`)
}

// 获取审核详情
export const getAuditDetails = (id: string) => {
    return get(`/api/doc-audit-rest/v1/doc-audit/${id}`)
}

// 获取审核详情
export const getDocAuditBizDetails = (id: string) => {
    return get(`/api/doc-audit-rest/v1/doc-audit/biz/${id}`)
}

// 获取审核待办列表
export const getAuditTasks = (params: any) =>
    get(`/api/doc-audit-rest/v1/doc-audit/tasks`, params)

// 获取审核历史列表
export const getAuditHistory = (params: any) =>
    get(`/api/doc-audit-rest/v1/doc-audit/historys`, params)

// 获取审核待办数量
export const getReviewCount = () =>
    get(`/api/doc-audit-rest/v1/doc-audit/tasks/count`)

/**
 * 获取审核信息
 * @param id 审核id
 * @returns
 */
export const getAuditInfo = (id: string) => {
    return get(`/api/doc-audit-rest/v1/doc-audit/${id}`)
}

// 获取我的申请数量
export const getAuditApplyCount = () =>
    get(`/api/doc-audit-rest/v1/doc-audit/applys`, {
        offset: 0,
        limit: 50,
        type: 'af-data-catalog-publish,af-data-catalog-online,af-data-catalog-offline,af-data-view-online,af-data-view-offline,af-data-application-publish,af-data-application-change,af-data-application-online,af-data-application-offline,af_demand_analysis_confirm,af-data-permission-request,af-basic-bigdata-create-category-label,af-basic-bigdata-update-category-label,af-basic-bigdata-delete-category-label,af-basic-bigdata-auth-category-label,af-bg-publish-business-area,af-bg-delete-business-area,af-bg-publish-main-business,af-bg-publish-business-diagnosis,af-data-push-audit,af-file-resource-publish',
    })

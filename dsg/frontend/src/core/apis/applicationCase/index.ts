import requests from '@/utils/request'
import {
    AppCaseItem,
    IAppCaseAuditList,
    IQueryList,
    IReportAppCaseParams,
} from './index.d'
import { DataList } from '@/core'
import { AppCaseSource } from '@/components/ApplicationCase/const'

const { get, post, put, delete: del } = requests

/**
 * 查询应用案例列表
 */
export const queryAppCaseList = (
    params: IQueryList,
): Promise<DataList<AppCaseItem>> => {
    return get(`/api/sszd-service/v1/application-examples`, params)
}

/**
 * 上报应用案例
 */
export const reportAppCase = (params: IReportAppCaseParams): Promise<any> => {
    return post(`/api/sszd-service/v1/application-examples`, params)
}

/**
 * 获取应用案例详情
 */
export const getAppCaseDetailById = (id: string): Promise<AppCaseItem> => {
    return get(`/api/sszd-service/v1/application-examples/${id}`)
}

/**
 * 删除应用案例
 */
export const delAppCaseById = (
    id: string,
    source: AppCaseSource,
): Promise<DataList<any>> => {
    return del(`/api/sszd-service/v1/application-examples/${id}`, { source })
}

/**
 * 更新应用案例
 */
export const updAppCase = (
    id: string,
    params: IQueryList,
): Promise<DataList<any>> => {
    return put(`/api/sszd-service/v1/application-examples/${id}`, params)
}

// 审核流程查询接口
export const getSSZDAuditProcess = (params: { audit_type?: string }) => {
    return get(`/api/sszd-service/v1/audit-process`, params)
}

// 审核流程绑定接口
export const bindSSZDAuditProcess = (params: {
    audit_type: string
    proc_def_key: string
}) => {
    return post(`/api/sszd-service/v1/audit-process`, params)
}

// 审核流程绑定更新接口
export const updateSSZDAuditProcess = (
    bindId: string,
    params: {
        audit_type: string
        proc_def_key: string
    },
) => {
    return put(`/api/sszd-service/v1/audit-process/${bindId}`, params)
}

// 审核流程解绑接口
export const deleteSSZDAuditProcess = (bindId: string) => {
    return del(`/api/sszd-service/v1/audit-process/${bindId}`)
}

// 审核列表查询接口
export const getSSZDAppCaseAuditList = (
    params: any,
): Promise<IAppCaseAuditList> => {
    return get(`/api/sszd-service/v1/application-example-audits`, params)
}

export const checkAppCaseName = (params: { title: string; id: string }) => {
    return post('/api/sszd-service/v1/application-examples/check-name', params)
}

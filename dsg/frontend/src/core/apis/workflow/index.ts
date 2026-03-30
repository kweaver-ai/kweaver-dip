import request from '@/utils'
import { IGetProcessDefinition } from './index.d'

// 通过Key获取指定流程信息
export const getProcessDefinitionByKey = (key: string) => {
    return request.get(`/api/workflow-rest/v1/process-definition/${key}`)
}

// 获取流程定义列表
export const getProcessDefinition = ({
    key,
    limit,
    name,
    offset,
    tenant_id = 'af_workflow',
    type_id,
}: IGetProcessDefinition) =>
    request.get(`/api/workflow-rest/v1/process-definition`, {
        key,
        limit,
        name,
        offset,
        tenant_id,
        type_id,
    })

/**
 * 获取审核日志
 * @param id  审核id
 * @returns
 */
export const getAuditLogs = (id) => {
    return request.get(`/api/workflow-rest/v1/process-instance/${id}/logs`)
}

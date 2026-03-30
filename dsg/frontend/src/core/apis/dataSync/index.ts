import requests from '@/utils/request'
import { SyncSearchParams, logsReturnData } from './index.d'

const { get, post, put, delete: del } = requests

/**
 * 执行同步
 * @param id
 * @returns
 */
export const execDataSync = (id: string) => {
    return post(`/api/data-sync/v1/model/run/${id}`, {})
}

/**
 * 查询同步日志
 * @param params
 * @returns
 */
export const getDataSyncHistoryList = (
    params: SyncSearchParams,
): Promise<logsReturnData> => {
    return get(`/api/data-sync/v1/model/history`, params)
}

/**
 * 工作流日志列表
 * @process_uuid id
 * @scheduleExecute true 表示 调度执行的，false：表示手动执行的，不调表示查询所有
 * @status 状态
 * @sort 排序字段start_time或end_time
 * @direction 排序方式asc或desc
 */
export const queryWorkFlowLogsList = (params: {
    process_uuid: string
    offset?: number
    limit?: number
    scheduleExecute?: boolean
    status?: string
    sort?: string
    direction?: string
}): Promise<logsReturnData> => {
    return get(`/api/data-sync/v1/process/history`, params)
}

/**
 * 手动运行工作流
 * @process_uuid id
 */
export const runWorkFlow = (process_uuid: string): Promise<any> => {
    return post(`/api/data-sync/v1/process/run/${process_uuid}`, {})
}
/**
 * 执行同步
 * @param id
 * @returns
 */
export const execDataProcess = (id: string) => {
    return post(`/api/data-sync/v1/compose/model/run/${id}`, {})
}

/**
 * 查询同步日志
 * @param params
 * @returns
 */
export const getDataProcessHistoryList = (
    params: SyncSearchParams,
): Promise<logsReturnData> => {
    return get(`/api/data-sync/v1/compose/model/history`, params)
}

/**
 * 执行sql
 */

export const execProcessSql = (params: {
    db_type: string
    sql_str: string
}): Promise<{
    code: string
    data: string
    description: string
    solution: string
}> => {
    return post(`/api/data-sync/v1/task/execute`, params)
}

/**
 * 获取详情
 * @param params
 * @returns
 */
export const getDetailLogs = (params: {
    subProcessTaskInstanceId: string
}): Promise<{
    code: string
    description: 'string'
    solution: ''
    data: {
        line_num: number
        message: string
    }
}> => {
    return get(`/api/data-sync/v1/task`, params)
}

/**
 * 工作流日志失败列表
 * @process_instance_id 日志id
 * @process_uuid 工作流id
 */
export const queryWorkFlowLogsFail = (params: {
    process_instance_id: string
    process_uuid: string
}): Promise<any> => {
    return get(`/api/data-sync/v1/process/history/tasks`, params)
}

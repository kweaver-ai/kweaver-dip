import requests from '@/utils/request'
import { IAuditEventFilter, IAuditEventItem } from './index.d'

const { get, post, put, delete: del } = requests

/**
 * 查询审计日志
 * @param params
 */
export const postAuditEventsQuery = (params: {
    offset: number
    limit: number
    filter: IAuditEventFilter
}): Promise<{ total_count: number; entries: IAuditEventItem[] }> => {
    return post(`/api/audit/v1/events/query`, params)
}
